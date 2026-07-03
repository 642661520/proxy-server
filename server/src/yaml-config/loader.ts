import { readFileSync, watch } from 'fs';
import { resolve } from 'path';
import { load as parseYaml } from 'js-yaml';
import type { ProxyConfig } from '../modules/proxies/proxy.service.js';
import { logger } from '../logger.js';

export interface YamlProxyConfig {
  name: string;
  description?: string;
  path_prefix: string;
  hostname?: string;
  listen_port?: number;
  upstream_url: string;
  upstream_host?: string;
  // Load balancing: multiple upstream URLs (overrides upstream_url when set)
  upstream_urls?: string[];
  lb_strategy?: string;    // "random" (default) or "rr" (round-robin)
  strip_prefix?: boolean;
  proxy_type?: string;
  tls_ciphers?: string;
  tls_servername?: string;
  tls_reject_unauthorized?: boolean;
  connect_timeout?: number;
  timeout?: number;
  max_body_size?: number;
  allowed_methods?: string;
  cache_ttl?: number;
  rate_limit_req?: number;
  rate_limit_window?: number;
  sort_order?: number;
  // Static file serving — serve local files instead of forwarding to upstream
  static_dir?: string;
  index?: string;
  injections?: Array<{
    into?: string;
    name: string;
    value: string;
  }>;
  access?: Array<{
    type: string;
    pattern: string;
  }>;
}

export interface YamlConfig {
  port?: number;
  log_level?: string;
  proxies: YamlProxyConfig[];
}

function mapToProxyConfig(yaml: YamlProxyConfig, index: number): ProxyConfig {
  const now = new Date().toISOString();

  // Expand environment variable references like ${VAR} or ${VAR:-default}
  const expandEnv = (value: string): string => {
    return value.replace(/\$\{(\w+)(?::-([^}]*))?\}/g, (_match, varName, defaultValue) => {
      return process.env[varName] ?? (defaultValue ?? '');
    });
  };

  return {
    id: -(index + 1), // synthetic negative IDs for YAML mode
    name: yaml.name,
    description: yaml.description || '',
    enabled: 1,
    listen_port: yaml.listen_port || null,
    hostname: yaml.hostname || null,
    path_prefix: yaml.path_prefix,
    strip_prefix: yaml.strip_prefix !== false ? 1 : 0,
    upstream_url: yaml.upstream_url || '',
    upstream_host: yaml.upstream_host || null,
    upstream_urls: yaml.upstream_urls || null,
    lb_strategy: yaml.lb_strategy || 'random',
    proxy_type: yaml.proxy_type || 'reverse',
    tls_ciphers: yaml.tls_ciphers || null,
    tls_servername: yaml.tls_servername || null,
    tls_reject_unauthorized: yaml.tls_reject_unauthorized !== false ? 1 : 0,
    connect_timeout: yaml.connect_timeout ?? 10000,
    timeout: yaml.timeout ?? 30000,
    max_body_size: yaml.max_body_size ?? 10485760,
    allowed_methods: yaml.allowed_methods || 'GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS',
    cache_rule_id: null,
    rate_limit_id: null,
    health_check_id: null,
    cache_ttl: yaml.cache_ttl ?? 0,
    rate_limit_req: yaml.rate_limit_req ?? 0,
    rate_limit_window: yaml.rate_limit_window ?? 60,
    sort_order: yaml.sort_order ?? index,
    created_at: now,
    updated_at: now,
    // Static file serving
    static_dir: yaml.static_dir || null,
    index: yaml.index || 'index.html',
    // Inline injection rules (no DB needed)
    _injections: (yaml.injections || []).map(inj => ({
      inject_into: inj.into || 'query',
      inject_name: inj.name,
      key_value: expandEnv(inj.value),
      enabled: 1,
    })),
    // Inline access rules (no DB needed)
    _accessRules: (yaml.access || []).map(ac => ({
      rule_type: ac.type,
      pattern: ac.pattern,
      enabled: 1,
    })),
  };
}

export function loadYamlConfig(configPath: string): { port: number; proxies: ProxyConfig[] } {
  const absPath = resolve(configPath);
  const raw = readFileSync(absPath, 'utf-8');
  const parsed = parseYaml(raw) as YamlConfig;

  if (!parsed.proxies || !Array.isArray(parsed.proxies)) {
    throw new Error('Invalid config: "proxies" array is required');
  }

  const proxies = parsed.proxies.map((p, i) => mapToProxyConfig(p, i));

  logger.info({ count: proxies.length, path: absPath }, 'YAML config loaded');
  return { port: parsed.port ?? 3000, proxies };
}

export function watchYamlConfig(configPath: string, onChange: (proxies: ProxyConfig[]) => void): void {
  const absPath = resolve(configPath);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(absPath, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const { proxies } = loadYamlConfig(absPath);
        onChange(proxies);
        logger.info('YAML config hot-reloaded');
      } catch (err) {
        logger.error({ err }, 'Failed to reload YAML config');
      }
    }, 100); // debounce
  });
  logger.info({ path: absPath }, 'Watching YAML config for changes');
}
