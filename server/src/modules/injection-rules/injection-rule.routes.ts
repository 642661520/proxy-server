import { Router } from 'express';
import { list, get, create, update, remove } from './injection-rule.controller.js';
import { adminOnly } from '../../middleware/auth.js';

export const injectionRuleRoutes = Router();

injectionRuleRoutes.get('/', list);
injectionRuleRoutes.post('/', adminOnly, create);
injectionRuleRoutes.get('/:id', get);
injectionRuleRoutes.put('/:id', adminOnly, update);
injectionRuleRoutes.delete('/:id', adminOnly, remove);
