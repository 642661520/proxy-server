import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..', '..');

// Load .env from project root (before any process.env reads)
// Explicit env vars take priority; .env file fills in the gaps
const envPath = resolve(ROOT_DIR, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

// Data directory — env var or default
const dataDir = process.env.DATA_DIR || resolve(ROOT_DIR, 'data');

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Persist a secret: env > file > generate + save to file
function envOrPersist(envKey: string, fileName: string, bytes: number): string {
  // 1. Environment variable (explicit override)
  if (process.env[envKey]) return process.env[envKey];

  // 2. Persisted file in data directory (survives restart)
  const filePath = resolve(dataDir, fileName);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8').trim();
  }

  // 3. Generate and persist
  const generated = randomBytes(bytes).toString('hex');
  writeFileSync(filePath, generated, { mode: 0o600 });
  return generated;
}

export const config = {
  adminPort: parseInt(process.env.ADMIN_PORT || '3001', 10),
  proxyPort: parseInt(process.env.PROXY_PORT || '3000', 10),

  jwtSecret: envOrPersist('JWT_SECRET', '.jwt_secret', 32),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',

  dataDir,
  dbPath: resolve(dataDir, 'proxy-server.db'),
  logDir: process.env.LOG_DIR || resolve(dataDir, 'logs'),

  isDev: process.env.NODE_ENV !== 'production',
};
