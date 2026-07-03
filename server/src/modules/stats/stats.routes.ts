import { Router } from 'express';
import { summary, traffic, topProxies, statusDistribution, responseTime } from './stats.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const statsRoutes = Router();
statsRoutes.use(adminOnly);
statsRoutes.get('/summary', summary);
statsRoutes.get('/traffic', traffic);
statsRoutes.get('/top-proxies', topProxies);
statsRoutes.get('/status-distribution', statusDistribution);
statsRoutes.get('/response-time', responseTime);
