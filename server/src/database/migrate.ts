import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function runMigrations(): void {
  const db = getDb();

  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrationsDir = resolve(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all()
      .map((r: any) => r.name)
  );

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(resolve(migrationsDir, file), 'utf-8');
    console.log(`[migrate] Running: ${file}`);

    // Wrap migration + recording in a single transaction
    const runInTx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    });
    runInTx();
    console.log(`[migrate] Done: ${file}`);
  }
}

// Run directly: tsx src/database/migrate.ts
if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations();
  console.log('[migrate] All migrations complete.');
  process.exit(0);
}
