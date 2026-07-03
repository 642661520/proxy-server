import { EventEmitter } from 'events';
import { createRequire } from 'module';

// Lazy require -- gracefully degrades when DB is unavailable (YAML mode)
let _dbGetter: (() => any) | null = null;
function getDb(): any {
  if (!_dbGetter) {
    try {
      _dbGetter = createRequire(import.meta.url)('../../database/connection.js').getDb;
    } catch {
      _dbGetter = () => { throw new Error('Database unavailable in YAML mode'); };
    }
  }
  return _dbGetter!();
}

export const proxyEvents = new EventEmitter();

export interface ProxyConfig {
  id: number;
  name: string;
  description: string;
  enabled: number;
  listen_port: number | null;
  hostname: string | null;
  path_prefix: string;
  strip_prefix: number;
  upstream_url: string;
  upstream_host: string | null;
  // Load balancing: when set, forwarder picks from these URLs (overrides upstream_url)
  upstream_urls?: string[] | null;
  lb_strategy?: string | null;    // "random" (default) or "rr" (round-robin)
  proxy_type: string;
  tls_ciphers: string | null;
  tls_servername: string | null;
  tls_reject_unauthorized: number;
  connect_timeout: number;
  timeout: number;
  max_body_size: number;
  allowed_methods: string;
  cache_rule_id: number | null;
  rate_limit_id: number | null;
  health_check_id: number | null;
  cache_ttl: number;
  rate_limit_req: number;
  rate_limit_window: number;
  // Inline config -- populated by YAML loader; DB mode uses null and falls back to module queries
  _injections?: Array<{ inject_into: string; inject_name: string; key_value: string; enabled: number }> | null;
  _accessRules?: Array<{ rule_type: string; pattern: string; enabled: number }> | null;
  // Static file serving (YAML mode only)
  static_dir?: string | null;
  index?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function getAllProxies(search?: string): ProxyConfig[] {
  const db = getDb();
  if (search) {
    return db.prepare(
      'SELECT * FROM proxies WHERE name LIKE ? OR upstream_url LIKE ? ORDER BY sort_order, id'
    ).all(`%${search}%`, `%${search}%`) as ProxyConfig[];
  }
  return db.prepare('SELECT * FROM proxies ORDER BY sort_order, id').all() as ProxyConfig[];
}

export function getProxyById(id: number): ProxyConfig | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM proxies WHERE id = ?').get(id) as ProxyConfig | undefined;
}

export function getEnabledProxies(): ProxyConfig[] {
  const db = getDb();
  return db.prepare('SELECT * FROM proxies WHERE enabled = 1 ORDER BY sort_order, id').all() as ProxyConfig[];
}

export function createProxy(data: Partial<ProxyConfig>): ProxyConfig {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO proxies (name, description, enabled, listen_port, hostname, path_prefix, strip_prefix,
      upstream_url, upstream_host, proxy_type, tls_ciphers, tls_servername, tls_reject_unauthorized,
      connect_timeout, timeout, max_body_size, allowed_methods, cache_rule_id, rate_limit_id,
      health_check_id, cache_ttl, rate_limit_req, rate_limit_window, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name || 'New Proxy',
    data.description || '',
    data.enabled ?? 1,
    data.listen_port ?? null,
    data.hostname || null,
    data.path_prefix || '/',
    data.strip_prefix ?? 1,
    data.upstream_url || '',
    data.upstream_host || null,
    data.proxy_type || 'reverse',
    data.tls_ciphers || null,
    data.tls_servername || null,
    data.tls_reject_unauthorized ?? 1,
    data.connect_timeout ?? 10000,
    data.timeout ?? 30000,
    data.max_body_size ?? 10485760,
    data.allowed_methods || 'GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS',
    data.cache_rule_id ?? null,
    data.rate_limit_id ?? null,
    data.health_check_id ?? null,
    data.cache_ttl ?? 0,
    data.rate_limit_req ?? 0,
    data.rate_limit_window ?? 60,
    data.sort_order ?? 0,
  );

  proxyEvents.emit('changed');
  return getProxyById(result.lastInsertRowid as number)!;
}

export function updateProxy(id: number, data: Partial<ProxyConfig>): ProxyConfig | null {
  const db = getDb();
  const existing = getProxyById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'name', 'description', 'enabled', 'listen_port', 'hostname', 'path_prefix',
    'strip_prefix', 'upstream_url', 'upstream_host', 'proxy_type', 'tls_ciphers',
    'tls_servername', 'tls_reject_unauthorized', 'connect_timeout', 'timeout',
    'max_body_size', 'allowed_methods', 'cache_rule_id', 'rate_limit_id',
    'health_check_id', 'cache_ttl', 'rate_limit_req', 'rate_limit_window', 'sort_order',
  ];

  for (const field of allowedFields) {
    if (field in data) {
      fields.push(`${field} = ?`);
      values.push((data as any)[field]);
    }
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE proxies SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  proxyEvents.emit('changed');
  return getProxyById(id)!;
}

export function deleteProxy(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM proxies WHERE id = ?').run(id);
  if (result.changes > 0) {
    proxyEvents.emit('changed');
    return true;
  }
  return false;
}

export function toggleProxy(id: number): ProxyConfig | null {
  const proxy = getProxyById(id);
  if (!proxy) return null;
  return updateProxy(id, { enabled: proxy.enabled ? 0 : 1 });
}
