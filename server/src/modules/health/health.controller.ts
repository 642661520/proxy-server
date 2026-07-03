import { Request, Response } from 'express';
import { getAllHealthChecks, getHealthCheckResults } from './health.service.js';
import { getAllProxies } from '../proxies/proxy.service.js';
import { logger } from '../../logger.js';

export function list(_req: Request, res: Response): void {
  res.json({ data: getAllHealthChecks() });
}

export function getResults(req: Request, res: Response): void {
  const results = getHealthCheckResults(parseInt(req.params.id, 10), 100);
  res.json({ data: results });
}

export async function getStatus(_req: Request, res: Response): Promise<void> {
  const proxies = getAllProxies().filter(p => p.enabled);

  const data = await Promise.all(
    proxies.map(async (proxy) => {
      try {
        const url = new URL('/', proxy.upstream_url);
        const start = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(url.toString(), {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'Host': proxy.upstream_host || url.hostname },
        });
        clearTimeout(timer);

        return {
          proxyId: proxy.id,
          name: proxy.name,
          status: 'healthy',
          statusCode: resp.status,
          responseTimeMs: Date.now() - start,
          lastChecked: new Date().toISOString(),
        };
      } catch (err: any) {
        return {
          proxyId: proxy.id,
          name: proxy.name,
          status: err.name === 'AbortError' ? 'unhealthy' : 'error',
          errorMessage: err.name === 'AbortError' ? '连接超时' : err.message,
          lastChecked: new Date().toISOString(),
        };
      }
    })
  );

  res.json({ data });
}
