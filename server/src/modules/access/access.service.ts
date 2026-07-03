import { getDb } from '../../database/connection.js';

export interface AccessRule {
  id: number;
  proxy_id: number | null;
  rule_type: string;
  pattern: string;
  enabled: number;
}

export function getAccessRulesByProxyId(proxyId: number): AccessRule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM access_rules WHERE (proxy_id = ? OR proxy_id IS NULL) ORDER BY id').all(proxyId) as AccessRule[];
}

export function getAllAccessRules(): AccessRule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM access_rules ORDER BY id').all() as AccessRule[];
}

export function getAccessRuleById(id: number): AccessRule | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM access_rules WHERE id = ?').get(id) as AccessRule | undefined;
}

export function createAccessRule(data: Partial<AccessRule>): AccessRule {
  const db = getDb();
  const r = db.prepare(
    'INSERT INTO access_rules (proxy_id, rule_type, pattern, enabled) VALUES (?, ?, ?, ?)'
  ).run(data.proxy_id || null, data.rule_type || 'blacklist', data.pattern || '', data.enabled ?? 1);
  return getAccessRuleById(r.lastInsertRowid as number)!;
}

export function updateAccessRule(id: number, data: Partial<AccessRule>): AccessRule | null {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  for (const f of ['proxy_id', 'rule_type', 'pattern', 'enabled']) {
    if (f in data) { fields.push(`${f} = ?`); values.push((data as any)[f]); }
  }
  if (fields.length === 0) return getAccessRuleById(id) || null;
  values.push(id);
  db.prepare(`UPDATE access_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getAccessRuleById(id)!;
}

export function deleteAccessRule(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM access_rules WHERE id = ?').run(id).changes > 0;
}
