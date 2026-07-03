import { appendFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';

let logDir = '';

export function initFileLogging(dir: string): void {
  logDir = dir;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function dateStamp(): string {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function timeStamp(): string {
  const d = new Date();
  return d.toISOString();
}

function writeRotated(prefix: string, line: string, maxDays: number): void {
  if (!logDir) return;
  const today = dateStamp();
  const file = resolve(logDir, `${prefix}-${today}.log`);

  try {
    appendFileSync(file, line + '\n');
  } catch { /* fail silently */ }

  // Cleanup old files every ~100 writes
  if (Math.random() < 0.01) {
    cleanup(prefix, maxDays);
  }
}

function cleanup(prefix: string, maxDays: number): void {
  try {
    const files = readdirSync(logDir);
    const cutoff = Date.now() - maxDays * 86400000;
    for (const f of files) {
      if (!f.startsWith(prefix + '-')) continue;
      const full = resolve(logDir, f);
      try {
        if (statSync(full).mtimeMs < cutoff) unlinkSync(full);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

/** System log: receives raw JSON line from Pino, writes to server-YYYY-MM-DD.log */
export function writeServerLog(line: string): void {
  writeRotated('server', line, 7);
}

/** Audit log: data/logs/access-YYYY-MM-DD.log, keep 30 days */
export function auditLog(entry: Record<string, unknown>): void {
  writeRotated('access', JSON.stringify(entry), 30);
}
