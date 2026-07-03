import { getDb } from '../../database/connection.js';
import { logger } from '../../logger.js';

export interface HealthCheck {
  id: number;
  proxy_id: number;
  name: string;
  enabled: number;
  check_interval: number;
  timeout: number;
  method: string;
  path: string;
  expected_status: number;
  expected_body: string | null;
  unhealthy_threshold: number;
  healthy_threshold: number;
  notify_on_change: number;
}

export function getAllHealthChecks(): HealthCheck[] {
  const db = getDb();
  return db.prepare('SELECT * FROM health_checks ORDER BY id').all() as HealthCheck[];
}

export function getHealthCheckById(id: number): HealthCheck | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM health_checks WHERE id = ?').get(id) as HealthCheck | undefined;
}

export function getHealthCheckByProxyId(proxyId: number): HealthCheck | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM health_checks WHERE proxy_id = ?').get(proxyId) as HealthCheck | undefined;
}

export function getHealthCheckResults(checkId: number, limit = 50) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM health_check_results WHERE health_check_id = ? ORDER BY checked_at DESC LIMIT ?'
  ).all(checkId, limit);
}

export function addHealthCheckResult(checkId: number, status: string, statusCode: number | null, responseTimeMs: number, errorMessage?: string) {
  const db = getDb();
  db.prepare(
    'INSERT INTO health_check_results (health_check_id, status, status_code, response_time_ms, error_message) VALUES (?, ?, ?, ?, ?)'
  ).run(checkId, status, statusCode, responseTimeMs, errorMessage || null);
}

// Background health checker
const checkTimers = new Map<number, ReturnType<typeof setInterval>>();

export function startHealthChecker(): void {
  const checks = getAllHealthChecks().filter(c => c.enabled);

  for (const check of checks) {
    if (checkTimers.has(check.id)) continue;

    const timer = setInterval(async () => {
      try {
        const { getProxyById } = await import('../proxies/proxy.service.js');
        const proxy = getProxyById(check.proxy_id);
        if (!proxy?.enabled) return;

        const url = new URL(check.path, proxy.upstream_url);
        const start = Date.now();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), check.timeout * 1000);

        try {
          const res = await fetch(url.toString(), {
            method: check.method,
            signal: controller.signal,
          });

          const responseTimeMs = Date.now() - start;
          const ok = res.status === check.expected_status;
          addHealthCheckResult(check.id, ok ? 'healthy' : 'unhealthy', res.status, responseTimeMs);
        } finally {
          clearTimeout(timeout);
        }
      } catch (err: any) {
        addHealthCheckResult(check.id, 'error', null, 0, err.message);
      }
    }, check.check_interval * 1000);

    checkTimers.set(check.id, timer);
  }

  logger.info({ count: checks.length }, 'Health checker started');
}
