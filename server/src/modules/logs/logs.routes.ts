import { Router } from 'express';
import { list, detail, stream, exportLogs } from './logs.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const logRoutes = Router();
logRoutes.get('/', list);
logRoutes.get('/stream', stream);
logRoutes.get('/export', exportLogs);
logRoutes.get('/:id', detail);
// All log routes require admin access
logRoutes.use(adminOnly);
