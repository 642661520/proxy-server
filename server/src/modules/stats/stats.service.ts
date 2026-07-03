import { getDb } from '../../database/connection.js';

export function getSummary() {
  const db = getDb();

  const activeProxies = (db.prepare('SELECT COUNT(*) as cnt FROM proxies WHERE enabled = 1').get() as any).cnt;
  const totalProxies = (db.prepare('SELECT COUNT(*) as cnt FROM proxies').get() as any).cnt;
  const todayRequests = (db.prepare(
    "SELECT COUNT(*) as cnt FROM request_logs WHERE created_at >= date('now')"
  ).get() as any).cnt;
  const totalRequests = (db.prepare('SELECT COUNT(*) as cnt FROM request_logs').get() as any).cnt;
  const errorCount = (db.prepare(
    "SELECT COUNT(*) as cnt FROM request_logs WHERE status_code >= 400 AND created_at >= date('now')"
  ).get() as any).cnt;
  const cacheHits = (db.prepare(
    "SELECT COUNT(*) as cnt FROM request_logs WHERE cache_hit = 1 AND created_at >= date('now')"
  ).get() as any).cnt;

  const totalReqsToday = todayRequests || 1; // avoid division by zero
  const errorRate = ((errorCount / totalReqsToday) * 100).toFixed(1);
  const cacheHitRate = ((cacheHits / totalReqsToday) * 100).toFixed(1);

  return {
    activeProxies,
    totalProxies,
    todayRequests,
    totalRequests,
    errorRate: parseFloat(errorRate),
    cacheHitRate: parseFloat(cacheHitRate),
  };
}

export function getTraffic(proxyId?: number, interval = '1h') {
  const db = getDb();
  const timeFormat = interval === '1d' ? '%Y-%m-%d' :
    interval === '1h' ? '%Y-%m-%d %H:00' :
    '%Y-%m-%d %H:%M';

  const params: any[] = [];
  let where = "WHERE created_at >= datetime('now', '-24 hours')";
  if (proxyId) { where += ' AND proxy_id = ?'; params.push(proxyId); }

  return db.prepare(`
    SELECT strftime('${timeFormat}', created_at) as time,
           COUNT(*) as requests,
           AVG(response_time_ms) as avg_response_time,
           SUM(bytes_sent + bytes_received) as traffic_bytes
    FROM request_logs ${where}
    GROUP BY time ORDER BY time
  `).all(...params);
}

export function getTopProxies(limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.name, COUNT(*) as requests
    FROM request_logs rl
    JOIN proxies p ON p.id = rl.proxy_id
    GROUP BY rl.proxy_id
    ORDER BY requests DESC LIMIT ?
  `).all(limit);
}

export function getStatusDistribution() {
  const db = getDb();
  return db.prepare(`
    SELECT status_code, COUNT(*) as count
    FROM request_logs
    WHERE created_at >= date('now')
    GROUP BY status_code ORDER BY status_code
  `).all();
}

export function getResponseTimeStats() {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      AVG(response_time_ms) as avg,
      MIN(response_time_ms) as min,
      MAX(response_time_ms) as max,
      COUNT(*) as total
    FROM request_logs
    WHERE created_at >= date('now') AND response_time_ms > 0
  `).get() as any;

  // Approximate percentiles
  const data = db.prepare(`
    SELECT response_time_ms FROM request_logs
    WHERE created_at >= date('now') AND response_time_ms > 0
    ORDER BY response_time_ms
  `).all() as any[];

  const times = data.map((r: any) => r.response_time_ms);
  const p50 = times[Math.floor(times.length * 0.5)] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || 0;
  const p99 = times[Math.floor(times.length * 0.99)] || 0;

  return { ...stats, p50, p95, p99 };
}
