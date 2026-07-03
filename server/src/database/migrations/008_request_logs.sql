CREATE TABLE request_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  proxy_id        INTEGER REFERENCES proxies(id) ON DELETE SET NULL,
  request_method  TEXT    NOT NULL,
  request_path    TEXT    NOT NULL,
  request_query   TEXT,
  upstream_url    TEXT,
  request_headers TEXT,
  status_code     INTEGER,
  response_time_ms INTEGER,
  bytes_sent      INTEGER DEFAULT 0,
  bytes_received  INTEGER DEFAULT 0,
  client_ip       TEXT,
  user_agent      TEXT,
  referer         TEXT,
  cache_hit       INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_logs_proxy_time ON request_logs(proxy_id, created_at DESC);
CREATE INDEX idx_logs_created_at ON request_logs(created_at DESC);
CREATE INDEX idx_logs_status ON request_logs(status_code);
