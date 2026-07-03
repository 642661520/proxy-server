import type { ProxyConfig } from '../modules/proxies/proxy.service.js';
import { logger } from '../logger.js';
import { auditLog } from '../utils/file-logger.js';
import { createRequire } from 'module';

interface AuditEntry {
  proxy_id: number | null;
  request_method: string;
  request_path: string;
  request_query: string;
  upstream_url: string;
  status_code: number;
  response_time_ms: number;
  bytes_sent: number;
  bytes_received: number;
  client_ip: string;
  user_agent: string;
  referer: string;
  cache_hit: number;
  error_message: string;
}

// Lazy require — gracefully degrades when DB modules are unavailable (YAML mode)
let _getDb: Function | null = null;
function getDb(): any {
  if (!_getDb) {
    try {
      _getDb = createRequire(import.meta.url)
        ('../database/connection.js').getDb;
    } catch {
      _getDb = () => { throw new Error('Database unavailable'); };
    }
  }
  return _getDb!();
}

// Batch buffer
const batch: AuditEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 500;
let useConsoleOnly = false;
let shuttingDown = false;

export function setAuditMode(mode: 'db' | 'console'): void {
  useConsoleOnly = mode === 'console';
}

function flushToDb(entries: AuditEntry[]): void {
  if (entries.length === 0) return;

  const db = getDb();

  try {
    const stmt = db.prepare(`
      INSERT INTO request_logs (proxy_id, request_method, request_path, request_query,
        upstream_url, status_code, response_time_ms, bytes_sent, bytes_received,
        client_ip, user_agent, referer, cache_hit, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: AuditEntry[]) => {
      for (const item of items) {
        stmt.run(
          item.proxy_id, item.request_method, item.request_path, item.request_query,
          item.upstream_url, item.status_code, item.response_time_ms, item.bytes_sent,
          item.bytes_received, item.client_ip, item.user_agent, item.referer,
          item.cache_hit, item.error_message,
        );
      }
    });

    insertMany(entries);
  } catch (err) {
    logger.error({ err }, 'Failed to flush audit logs to DB');
    // On DB failure, fall back to console logging so entries are not lost
    for (const entry of entries) {
      logger.warn(
        { method: entry.request_method, status: entry.status_code, ms: entry.response_time_ms, ip: entry.client_ip },
        `[AUDIT LOST] ${entry.request_method} ${entry.request_path} -> ${entry.status_code}`,
      );
    }
  }
}

function flush(): void {
  if (batch.length === 0) return;

  const entries = batch.splice(0);

  if (useConsoleOnly) {
    for (const entry of entries) {
      auditLog({
        time: new Date().toISOString(),
        proxy_id: entry.proxy_id,
        method: entry.request_method,
        path: entry.request_path,
        status: entry.status_code,
        ms: entry.response_time_ms,
        bytes: entry.bytes_received,
        ip: entry.client_ip,
        ua: entry.user_agent,
        cache: entry.cache_hit,
      });
      logger.info(
        { method: entry.request_method, status: entry.status_code, ms: entry.response_time_ms, ip: entry.client_ip, upstream: entry.upstream_url, cache: entry.cache_hit },
        `${entry.request_method} ${entry.request_path} → ${entry.status_code} (${entry.response_time_ms}ms)  ${entry.cache_hit ? '[CACHE]' : ''}  upstream=${entry.upstream_url || '-'}`,
      );
    }
  } else {
    flushToDb(entries);
  }
}

export function logRequest(entry: AuditEntry): void {
  if (shuttingDown) return;
  batch.push(entry);

  if (batch.length >= BATCH_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, FLUSH_INTERVAL);
  }
}

/** Call during graceful shutdown to flush remaining entries. Returns synchronously (sync DB writes). */
export function shutdownAuditor(): void {
  shuttingDown = true;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flush();
}
