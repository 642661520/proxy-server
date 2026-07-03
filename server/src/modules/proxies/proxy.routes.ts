import { Router } from 'express';
import { listProxies, getProxy, create, update, remove, toggle } from './proxy.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const proxyRoutes = Router();

proxyRoutes.get('/', listProxies);
proxyRoutes.post('/', adminOnly, create);
proxyRoutes.get('/:id', getProxy);
proxyRoutes.put('/:id', adminOnly, update);
proxyRoutes.delete('/:id', adminOnly, remove);
proxyRoutes.patch('/:id/toggle', adminOnly, toggle);
