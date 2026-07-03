import { Request, Response } from 'express';
import { getAllInjectionRules, getInjectionRuleById, createInjectionRule, updateInjectionRule, deleteInjectionRule } from './injection-rule.service.js';

export function list(req: Request, res: Response): void {
  const rules = getAllInjectionRules();
  // Mask key values in list
  const masked = rules.map(r => ({
    ...r,
    key_value: r.key_value ? '****' : '',
  }));
  res.json({ data: masked });
}

export function get(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const rule = getInjectionRuleById(id);
  if (!rule) {
    res.status(404).json({ error: '注入规则不存在' });
    return;
  }
  res.json({ data: { ...rule, key_value: '****' } });
}

export function create(req: Request, res: Response): void {
  const rule = createInjectionRule(req.body);
  res.status(201).json({ data: rule, message: '注入规则创建成功，请妥善保存注入值，之后将无法查看原文' });
}

export function update(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const rule = updateInjectionRule(id, req.body);
  if (!rule) {
    res.status(404).json({ error: '注入规则不存在' });
    return;
  }
  res.json({ data: { ...rule, key_value: '****' } });
}

export function remove(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  if (!deleteInjectionRule(id)) {
    res.status(404).json({ error: '注入规则不存在' });
    return;
  }
  res.json({ message: '删除成功' });
}
