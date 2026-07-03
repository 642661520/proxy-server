CREATE TABLE access_rules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  proxy_id   INTEGER REFERENCES proxies(id) ON DELETE CASCADE,
  rule_type  TEXT    NOT NULL,
  pattern    TEXT    NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
