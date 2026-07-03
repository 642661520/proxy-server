import { Request, Response } from 'express';
import {
  getAllProxies, getProxyById, createProxy, updateProxy, deleteProxy, toggleProxy,
} from './proxy.service.js';
import { getInjectionRulesByProxyId } from '../injection-rules/injection-rule.service.js';

export function listProxies(req: Request, res: Response): void {
  const search = req.query.search as string | undefined;
  const proxies = getAllProxies(search);
  res.json({ data: proxies });
}

export function getProxy(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const proxy = getProxyById(id);
  if (!proxy) {
    res.status(404).json({ error: '代理配置不存在' });
    return;
  }
  // Include associated injection rules
  const injectionRules = getInjectionRulesByProxyId(id);
  res.json({ data: { ...proxy, injectionRules } });
}

export function create(req: Request, res: Response): void {
  const proxy = createProxy(req.body);
  res.status(201).json({ data: proxy });
}

export function update(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const proxy = updateProxy(id, req.body);
  if (!proxy) {
    res.status(404).json({ error: '代理配置不存在' });
    return;
  }
  res.json({ data: proxy });
}

export function remove(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const ok = deleteProxy(id);
  if (!ok) {
    res.status(404).json({ error: '代理配置不存在' });
    return;
  }
  res.json({ message: '删除成功' });
}

export function toggle(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const proxy = toggleProxy(id);
  if (!proxy) {
    res.status(404).json({ error: '代理配置不存在' });
    return;
  }
  res.json({ data: proxy });
}
