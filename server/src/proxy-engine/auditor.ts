import { logger } from '../logger.js';
import { auditLog } from '../utils/file-logger.js';

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

// Batch buffer
const batch: AuditEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 500;
let shuttingDown = false;

function flush(): void {
  if (batch.length === 0) return;

  const entries = batch.splice(0);

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

/** Call during graceful shutdown to flush remaining entries. */
export function shutdownAuditor(): void {
  shuttingDown = true;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flush();
}
