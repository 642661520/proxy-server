// ProxyConfig — 纯类型定义（YAML 模式）
// 无数据库依赖，所有配置由 YAML 文件加载后填充

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
  // Inline config — populated by YAML loader
  _injections?: Array<{ inject_into: string; inject_name: string; key_value: string; enabled: number }> | null;
  _accessRules?: Array<{ rule_type: string; pattern: string; enabled: number }> | null;
  // Static file serving (YAML mode)
  static_dir?: string | null;
  index?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
