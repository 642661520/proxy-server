import { Request, Response } from 'express';
import { authenticateUser, getUserById, changePassword } from './auth.service.js';

// Simple in-memory login rate limiter: max 10 attempts per IP per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function login(req: Request, res: Response): void {
  const { username, password } = req.body;

  // Rate limit check
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(clientIp);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      const retrySec = Math.ceil((entry.resetAt - now) / 1000);
      res.status(429).json({ error: '登录尝试过于频繁，请稍后重试', retryAfter: retrySec });
      return;
    }
    entry.count++;
  } else {
    loginAttempts.set(clientIp, { count: 1, resetAt: now + 60_000 });
  }

  // Cleanup old entries periodically
  if (loginAttempts.size > 10000) {
    for (const [key, val] of loginAttempts) {
      if (now > val.resetAt) loginAttempts.delete(key);
    }
  }

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const result = authenticateUser(username, password);
  if (!result) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  res.json({
    token: result.token,
    user: result.user,
  });
}

export function me(req: Request, res: Response): void {
  const user = getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user });
}

export function updatePassword(req: Request, res: Response): void {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: '旧密码和新密码不能为空' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: '新密码长度不能少于6位' });
    return;
  }

  const ok = changePassword(req.user!.userId, oldPassword, newPassword);
  if (!ok) {
    res.status(400).json({ error: '旧密码错误' });
    return;
  }
  res.json({ message: '密码修改成功' });
}
