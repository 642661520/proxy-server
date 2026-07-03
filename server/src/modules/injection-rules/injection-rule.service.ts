import { getDb } from '../../database/connection.js';

export interface InjectionRule {
  id: number;
  proxy_id: number | null;
  name: string;
  key_value: string;
  inject_into: string;
  inject_name: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export function getAllInjectionRules(): InjectionRule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM injection_rules ORDER BY id').all() as InjectionRule[];
}

export function getInjectionRulesByProxyId(proxyId: number): InjectionRule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM injection_rules WHERE (proxy_id = ? OR proxy_id IS NULL) AND enabled = 1 ORDER BY id').all(proxyId) as InjectionRule[];
}

export function getInjectionRuleById(id: number): InjectionRule | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM injection_rules WHERE id = ?').get(id) as InjectionRule | undefined;
}

export function createInjectionRule(data: { proxy_id?: number | null; name: string; key_value: string; inject_into?: string; inject_name: string; enabled?: number }): InjectionRule {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO injection_rules (proxy_id, name, key_value, inject_into, inject_name, enabled) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.proxy_id || null, data.name, data.key_value, data.inject_into || 'query', data.inject_name, data.enabled ?? 1);

  const rule = getInjectionRuleById(result.lastInsertRowid as number)!;
  // Return with original key_value shown only once
  return { ...rule, key_value: data.key_value };
}

export function updateInjectionRule(id: number, data: Partial<{ name: string; key_value: string; inject_into: string; inject_name: string; enabled: number; proxy_id: number | null }>): InjectionRule | null {
  const db = getDb();
  const existing = getInjectionRuleById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['name', 'key_value', 'inject_into', 'inject_name', 'enabled', 'proxy_id'];
  for (const f of allowed) {
    if (f in data) {
      fields.push(`${f} = ?`);
      values.push((data as any)[f]);
    }
  }

  if (fields.length === 0) return existing;
  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE injection_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getInjectionRuleById(id)!;
}

export function deleteInjectionRule(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM injection_rules WHERE id = ?').run(id).changes > 0;
}
