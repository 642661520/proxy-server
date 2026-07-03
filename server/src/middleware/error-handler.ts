import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { config } from '../config.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: '服务器内部错误',
    detail: config.isDev ? err.message : undefined,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: '接口不存在' });
}
