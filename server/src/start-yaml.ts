// YAML 纯服务端入口 — 无 Admin API、无 SQLite、无 Express
// 启动: npx tsx src/start-yaml.ts --config=proxy-server.yaml

import { createServer } from 'http';
import { config } from './config.js';
import { loadYamlConfig, watchYamlConfig } from './yaml-config/loader.js';
import { setRouteTable } from './proxy-engine/router.js';
import { setAuditMode, shutdownAuditor } from './proxy-engine/auditor.js';
import { initProxyEngine } from './proxy-engine/index.js';
import { initFileLogging } from './utils/file-logger.js';
import { logger } from './logger.js';

const configArg = process.argv.find(a => a.startsWith('--config='));
const configPath = configArg?.split('=')[1];

if (!configPath) {
  console.error('Usage: npx tsx src/start-yaml.ts --config=<path>');
  process.exit(1);
}

initFileLogging(config.logDir);

const { port, proxies } = loadYamlConfig(configPath);

setAuditMode('console');
setRouteTable(proxies);

const server = createServer();
initProxyEngine(server);

server.listen(port, () => {
  logger.info(`YAML mode -- Proxy Engine: http://localhost:${port}`);
});

watchYamlConfig(configPath, (newProxies) => {
  setRouteTable(newProxies);
});

const shutdown = () => {
  logger.info('Shutting down...');
  shutdownAuditor();
  server.close(() => {
    logger.info('Proxy engine stopped');
    process.exit(0);
  });
  // Force exit after 10s if connections don't drain
  setTimeout(() => process.exit(0), 10000);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
