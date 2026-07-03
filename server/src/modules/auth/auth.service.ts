import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../../database/connection.js';
import { config } from '../../config.js';
import { logger } from '../../logger.js';
import type { JwtPayload } from '../../middleware/auth.js';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: string;
  is_active: number;
}

export function seedAdminUser(): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash = bcrypt.hashSync(config.adminDefaultPassword, 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
    ).run('admin', hash, '管理员', 'admin');
    logger.info('Default admin user created (admin / admin123)');
  }
}

export function authenticateUser(username: string, password: string): { token: string; user: Omit<User, 'password_hash'> } | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as User | undefined;

  if (!user) return null;

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return null;

  // Update last login
  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);

  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

export function getUserById(id: number): Omit<User, 'password_hash'> | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export function changePassword(userId: number, oldPassword: string, newPassword: string): boolean {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user) return false;

  const valid = bcrypt.compareSync(oldPassword, user.password_hash);
  if (!valid) return false;

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, userId);
  return true;
}
