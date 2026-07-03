CREATE TABLE proxies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  description     TEXT    NOT NULL DEFAULT '',
  enabled         INTEGER NOT NULL DEFAULT 1,

  listen_port     INTEGER,
  hostname        TEXT,
  path_prefix     TEXT    NOT NULL DEFAULT '/',
  strip_prefix    INTEGER NOT NULL DEFAULT 1,

  upstream_url    TEXT    NOT NULL,
  upstream_host   TEXT,
  proxy_type      TEXT    NOT NULL DEFAULT 'reverse',

  tls_ciphers     TEXT,
  tls_servername  TEXT,
  tls_reject_unauthorized INTEGER NOT NULL DEFAULT 1,
  connect_timeout INTEGER NOT NULL DEFAULT 10000,
  timeout         INTEGER NOT NULL DEFAULT 30000,

  max_body_size   INTEGER NOT NULL DEFAULT 10485760,
  allowed_methods TEXT    NOT NULL DEFAULT 'GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS',

  cache_rule_id   INTEGER,
  rate_limit_id   INTEGER,
  health_check_id INTEGER,

  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
