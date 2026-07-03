import { Request, Response } from 'express';
import { getSummary, getTraffic, getTopProxies, getStatusDistribution, getResponseTimeStats } from './stats.service.js';

export function summary(_req: Request, res: Response): void {
  res.json({ data: getSummary() });
}

export function traffic(req: Request, res: Response): void {
  const proxyId = req.query.proxyId ? parseInt(req.query.proxyId as string, 10) : undefined;
  const interval = (req.query.interval as string) || '1h';
  res.json({ data: getTraffic(proxyId, interval) });
}

export function topProxies(_req: Request, res: Response): void {
  res.json({ data: getTopProxies() });
}

export function statusDistribution(_req: Request, res: Response): void {
  res.json({ data: getStatusDistribution() });
}

export function responseTime(_req: Request, res: Response): void {
  res.json({ data: getResponseTimeStats() });
}
