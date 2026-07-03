// YAML 纯服务端入口 — 无 Admin API、无 SQLite、无 Express
// 启动: npx tsx server/src/index.ts --config=config.yaml
// 或:   npx tsx server/src/index.ts --config=proxy-server.yaml

import { createServer } from 'http';
import { config } from './config.js';
import { loadYamlConfig, watchYamlConfig } from './yaml-config/loader.js';
import { setRouteTable } from './proxy-engine/router.js';
import { shutdownAuditor } from './proxy-engine/auditor.js';
import { initProxyEngine } from './proxy-engine/index.js';
import { initFileLogging } from './utils/file-logger.js';
import { logger } from './logger.js';

const configArg = process.argv.find(a => a.startsWith('--config='));
const configPath = configArg?.split('=')[1];

if (!configPath) {
  console.error('Usage: npx tsx src/index.ts --config=<path>');
  console.error('Example: npx tsx src/index.ts --config=config.yaml');
  process.exit(1);
}

// At this point configPath is guaranteed to be a non-empty string
const configFile: string = configPath;

async function main(): Promise<void> {
  initFileLogging(config.logDir);

  const { port, proxies } = loadYamlConfig(configFile);

  setRouteTable(proxies);

  const server = createServer();
  initProxyEngine(server);

  server.listen(port, () => {
    logger.info(`Proxy Engine: http://localhost:${port}`);
  });

  // Hot reload on config change
  watchYamlConfig(configFile, (newProxies) => {
    setRouteTable(newProxies);
  });

  // Graceful shutdown
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
}

main().catch(err => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
