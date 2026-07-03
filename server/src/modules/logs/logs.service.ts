import { getDb } from '../../database/connection.js';
import { config } from '../../config.js';

export interface RequestLog {
  id: number;
  proxy_id: number | null;
  request_method: string;
  request_path: string;
  request_query: string;
  upstream_url: string;
  request_headers: string;
  status_code: number | null;
  response_time_ms: number;
  bytes_sent: number;
  bytes_received: number;
  client_ip: string;
  user_agent: string;
  referer: string;
  cache_hit: number;
  error_message: string;
  created_at: string;
}

export interface LogQuery {
  proxyId?: number;
  statusCode?: number;
  method?: string;
  clientIp?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function queryLogs(q: LogQuery) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (q.proxyId) { conditions.push('proxy_id = ?'); params.push(q.proxyId); }
  if (q.statusCode) { conditions.push('status_code = ?'); params.push(q.statusCode); }
  if (q.method) { conditions.push('request_method = ?'); params.push(q.method.toUpperCase()); }
  if (q.clientIp) { conditions.push('client_ip = ?'); params.push(q.clientIp); }
  if (q.from) { conditions.push('created_at >= ?'); params.push(q.from); }
  if (q.to) { conditions.push('created_at <= ?'); params.push(q.to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = q.page || 1;
  const pageSize = Math.min(q.pageSize || 20, 200);
  const offset = (page - 1) * pageSize;

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM request_logs ${where}`).get(...params) as any).cnt;
  const data = db.prepare(
    `SELECT * FROM request_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export function getLogById(id: number): RequestLog | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM request_logs WHERE id = ?').get(id) as RequestLog | undefined;
}

export function cleanupOldLogs(): number {
  const db = getDb();
  const result = db.prepare(
    `DELETE FROM request_logs WHERE created_at < datetime('now', '-' || ? || ' days')`
  ).run(config.logRetentionDays);
  return result.changes;
}
