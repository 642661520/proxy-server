import type { ProxyConfig } from '../types.js';
import { matchIpOrCidr } from '../utils/ip.js';
import { logger } from '../logger.js';

export function checkAccess(clientIp: string, proxy: ProxyConfig): boolean {
  // Use inline access rules from YAML config
  const rules = (proxy._accessRules || []).filter(r => r.enabled);

  if (rules.length === 0) return true;

  const whitelist = rules.filter(r => r.rule_type === 'whitelist');
  const blacklist = rules.filter(r => r.rule_type === 'blacklist');

  // Blacklist check first
  for (const rule of blacklist) {
    if (matchIpOrCidr(clientIp, rule.pattern)) {
      logger.warn({ clientIp, proxyId: proxy.id, rule: rule.pattern }, 'Access denied by blacklist');
      return false;
    }
  }

  // If whitelist exists, must match
  if (whitelist.length > 0) {
    const allowed = whitelist.some(r => matchIpOrCidr(clientIp, r.pattern));
    if (!allowed) {
      logger.warn({ clientIp, proxyId: proxy.id }, 'Access denied: not in whitelist');
      return false;
    }
  }

  return true;
}
