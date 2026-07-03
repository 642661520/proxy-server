import { Router } from 'express';
import { list, get, create, update, remove } from './access.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const accessRoutes = Router();
accessRoutes.get('/', list);
accessRoutes.post('/', adminOnly, create);
accessRoutes.get('/:id', get);
accessRoutes.put('/:id', adminOnly, update);
accessRoutes.delete('/:id', adminOnly, remove);
