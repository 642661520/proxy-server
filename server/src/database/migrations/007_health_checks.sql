CREATE TABLE health_checks (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  proxy_id            INTEGER NOT NULL REFERENCES proxies(id) ON DELETE CASCADE,
  name                TEXT    NOT NULL,
  enabled             INTEGER NOT NULL DEFAULT 1,
  check_interval      INTEGER NOT NULL DEFAULT 30,
  timeout             INTEGER NOT NULL DEFAULT 10,
  method              TEXT    NOT NULL DEFAULT 'GET',
  path                TEXT    NOT NULL DEFAULT '/',
  expected_status     INTEGER NOT NULL DEFAULT 200,
  expected_body       TEXT,
  unhealthy_threshold INTEGER NOT NULL DEFAULT 3,
  healthy_threshold   INTEGER NOT NULL DEFAULT 2,
  notify_on_change    INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE health_check_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  health_check_id INTEGER NOT NULL REFERENCES health_checks(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL,
  status_code     INTEGER,
  response_time_ms INTEGER,
  error_message   TEXT,
  checked_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_hcr_check_id_time ON health_check_results(health_check_id, checked_at DESC);
