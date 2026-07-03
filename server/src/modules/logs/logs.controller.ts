import { Request, Response } from 'express';
import { queryLogs, getLogById } from './logs.service.js';
import { config } from '../../config.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../../middleware/auth.js';

// SSE clients for real-time log streaming
const sseClients = new Set<Response>();

export function addSseClient(res: Response): void {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

export function broadcastLog(entry: any): void {
  const data = JSON.stringify(entry);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function list(req: Request, res: Response): void {
  const q = {
    proxyId: req.query.proxyId ? parseInt(req.query.proxyId as string, 10) : undefined,
    statusCode: req.query.statusCode ? parseInt(req.query.statusCode as string, 10) : undefined,
    method: req.query.method as string | undefined,
    clientIp: req.query.clientIp as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
  };
  res.json(queryLogs(q));
}

export function detail(req: Request, res: Response): void {
  const log = getLogById(parseInt(req.params.id, 10));
  if (!log) { res.status(404).json({ error: '不存在' }); return; }
  res.json({ data: log });
}

export function stream(req: Request, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':ok\n\n');
  addSseClient(res);
}

export function exportLogs(req: Request, res: Response): void {
  // Allow token-based auth via query param for CSV export (window.open cannot set headers)
  const token = req.query.token as string | undefined;
  if (token) {
    try {
      jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      res.status(401).json({ error: '认证令牌无效或已过期' });
      return;
    }
  }
  // If no token in query, fall through — the authMiddleware already checked Bearer header

  const q = {
    proxyId: req.query.proxyId ? parseInt(req.query.proxyId as string, 10) : undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: 1,
    pageSize: 10000,
  };
  const { data } = queryLogs(q);

  // Escape CSV field: wrap in quotes, escape internal quotes, prefix formulas with tab
  const csvEscape = (val: unknown): string => {
    const s = String(val ?? '');
    const escaped = s.replace(/"/g, '""');
    // Prevent CSV formula injection: prefix =, +, -, @ with tab
    if (/^[=+\-@]/.test(escaped)) {
      return `"\t${escaped}"`;
    }
    return `"${escaped}"`;
  };

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=proxy-logs.csv');
  const header = 'id,proxy_id,method,path,status,response_ms,client_ip,user_agent,cache_hit,created_at\n';
  res.write(header);
  for (const log of data as any[]) {
    res.write([
      csvEscape(log.id),
      csvEscape(log.proxy_id),
      csvEscape(log.request_method),
      csvEscape(log.request_path),
      csvEscape(log.status_code),
      csvEscape(log.response_time_ms),
      csvEscape(log.client_ip),
      csvEscape(log.user_agent),
      csvEscape(log.cache_hit),
      csvEscape(log.created_at),
    ].join(',') + '\n');
  }
  res.end();
}
