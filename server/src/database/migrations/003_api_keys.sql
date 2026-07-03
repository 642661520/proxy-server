CREATE TABLE api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  proxy_id    INTEGER REFERENCES proxies(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  key_value   TEXT    NOT NULL,
  inject_into TEXT    NOT NULL DEFAULT 'query',
  inject_name TEXT    NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
