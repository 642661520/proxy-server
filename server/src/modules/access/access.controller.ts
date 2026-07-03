import { Request, Response } from 'express';
import { getAllAccessRules, getAccessRuleById, createAccessRule, updateAccessRule, deleteAccessRule } from './access.service.js';

export function list(req: Request, res: Response): void { res.json({ data: getAllAccessRules() }); }
export function get(req: Request, res: Response): void {
  const r = getAccessRuleById(parseInt(req.params.id, 10));
  if (!r) { res.status(404).json({ error: '不存在' }); return; }
  res.json({ data: r });
}
export function create(req: Request, res: Response): void { res.status(201).json({ data: createAccessRule(req.body) }); }
export function update(req: Request, res: Response): void {
  const r = updateAccessRule(parseInt(req.params.id, 10), req.body);
  if (!r) { res.status(404).json({ error: '不存在' }); return; }
  res.json({ data: r });
}
export function remove(req: Request, res: Response): void {
  if (!deleteAccessRule(parseInt(req.params.id, 10))) { res.status(404).json({ error: '不存在' }); return; }
  res.json({ message: '删除成功' });
}
