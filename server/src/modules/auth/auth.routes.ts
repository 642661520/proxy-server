import { Router } from 'express';
import { login, me, updatePassword } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.get('/me', me);
authRoutes.put('/password', updatePassword);
