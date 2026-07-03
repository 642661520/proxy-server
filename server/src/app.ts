import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { proxyRoutes } from './modules/proxies/proxy.routes.js';
import { injectionRuleRoutes } from './modules/injection-rules/injection-rule.routes.js';
import { accessRoutes } from './modules/access/access.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { logRoutes } from './modules/logs/logs.routes.js';
import { statsRoutes } from './modules/stats/stats.routes.js';
import { getCacheStats, purgeCache } from './proxy-engine/cache-handler.js';


const __dirname = dirname(fileURLToPath(import.meta.url));

// Priority: env var > Docker path > local dev path
const clientDist = process.env.CLIENT_DIST
  || (existsSync(resolve(__dirname, '..', 'public')) ? resolve(__dirname, '..', 'public') : null)
  || resolve(__dirname, '..', '..', 'client', 'dist');

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Auth routes (no auth required for login)
  app.use('/api/v1/auth', authRoutes);

  // Protected routes
  app.use('/api/v1', authMiddleware);

  // Module routes
  app.use('/api/v1/proxies', proxyRoutes);
  app.use('/api/v1/injection-rules', injectionRuleRoutes);
  app.use('/api/v1/access-rules', accessRoutes);
  app.use('/api/v1/health-checks', healthRoutes);
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/logs', logRoutes);
  app.use('/api/v1/stats', statsRoutes);

  // Cache debug endpoints
  app.get('/api/v1/cache/stats', (_req, res) => {
    res.json(getCacheStats());
  });
  app.post('/api/v1/cache/purge', (req, res) => {
    const proxyId = req.body?.proxyId ? parseInt(req.body.proxyId, 10) : undefined;
    const count = purgeCache(proxyId);
    res.json({ purged: count });
  });


  // Serve static client SPA in production
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
