import { existsSync, mkdirSync } from 'fs';
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

export const config = {
  proxyPort: parseInt(process.env.PROXY_PORT || '3000', 10),
  logDir: process.env.LOG_DIR || resolve(dataDir, 'logs'),
  dataDir,
  isDev: process.env.NODE_ENV !== 'production',
};
