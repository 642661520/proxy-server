import { createServer } from 'http';
import { config } from './config.js';
import { createApp } from './app.js';
import { runMigrations } from './database/migrate.js';
import { logger } from './logger.js';
import { initProxyEngine } from './proxy-engine/index.js';
import { seedAdminUser } from './modules/auth/auth.service.js';
import { setRouteTable } from './proxy-engine/router.js';
import { setAuditMode, shutdownAuditor } from './proxy-engine/auditor.js';
import { initFileLogging } from './utils/file-logger.js';
import { loadYamlConfig, watchYamlConfig } from './yaml-config/loader.js';
import { closeDb } from './database/connection.js';

const configArg = process.argv.find(a => a.startsWith('--config='));
const configPath = configArg?.split('=')[1];

async function main(): Promise<void> {
  if (configPath) {
    // ─── YAML 纯服务端模式 ───
    initFileLogging(config.logDir);
    const { port, proxies } = loadYamlConfig(configPath);

    // Set up proxy engine with in-memory config
    setAuditMode('console');
    setRouteTable(proxies);

    const proxyServer = createServer();
    initProxyEngine(proxyServer);
    proxyServer.listen(port, () => {
      logger.info(`YAML mode -- Proxy Engine: http://localhost:${port}`);
    });

    // Hot reload on config change
    watchYamlConfig(configPath, (newProxies) => {
      setRouteTable(newProxies);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down...');
      shutdownAuditor();
      closeDb();
      proxyServer.close(() => {
        logger.info('Proxy engine stopped');
        process.exit(0);
      });
      // Force exit after 10s if connections don't drain
      setTimeout(() => process.exit(0), 10000);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } else {
    // ─── Web 管理模式 ───
    initFileLogging(config.logDir);
    logger.info({ dataDir: config.dataDir, dbPath: config.dbPath, logDir: config.logDir }, 'Web mode starting');

    logger.info('Running database migrations...');
    runMigrations();
    logger.info('Migrations complete');

    // Seed default admin user
    seedAdminUser();

    // Start Admin API server
    const app = createApp();
    const adminServer = createServer(app);
    adminServer.listen(config.adminPort, () => {
      logger.info(`Admin API + UI: http://localhost:${config.adminPort}`);
    });

    // Start Proxy Engine
    const proxyServer = createServer();
    initProxyEngine(proxyServer);
    proxyServer.listen(config.proxyPort, () => {
      logger.info(`Proxy Engine: http://localhost:${config.proxyPort}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down...');
      shutdownAuditor();
      closeDb();
      adminServer.close();
      proxyServer.close(() => {
        logger.info('All servers stopped');
        process.exit(0);
      });
      // Force exit after 10s if connections don't drain
      setTimeout(() => process.exit(0), 10000);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

main().catch(err => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
