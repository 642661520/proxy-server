import { Router } from 'express';
import { list, getResults, getStatus } from './health.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const healthRoutes = Router();
healthRoutes.get('/', list);
healthRoutes.get('/status', getStatus);
healthRoutes.get('/:id/results', getResults);
// All health check routes require admin access
healthRoutes.use(adminOnly);
