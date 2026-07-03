import type { ProxyConfig } from '../modules/proxies/proxy.service.js';
import { matchIpOrCidr } from '../utils/ip.js';
import { logger } from '../logger.js';
import { createRequire } from 'module';

// Lazy require — gracefully degrades when DB modules are unavailable (YAML mode)
let _getAccessRulesByProxyId: Function | null = null;
function getAccessRulesByProxyId(proxyId: number): any[] {
  if (!_getAccessRulesByProxyId) {
    try {
      _getAccessRulesByProxyId = createRequire(import.meta.url)
        ('../modules/access/access.service.js').getAccessRulesByProxyId;
    } catch {
      _getAccessRulesByProxyId = () => [];
    }
  }
  return _getAccessRulesByProxyId!(proxyId);
}

export function checkAccess(clientIp: string, proxy: ProxyConfig): boolean {
  // Inline access rules (YAML mode) take priority over DB lookups
  const rules = proxy._accessRules
    ? proxy._accessRules.filter(r => r.enabled)
    : getAccessRulesByProxyId(proxy.id).filter((r: any) => r.enabled);

  if (rules.length === 0) return true;

  const whitelist = rules.filter(r => (r as any).rule_type === 'whitelist');
  const blacklist = rules.filter(r => (r as any).rule_type === 'blacklist');

  // Blacklist check first
  for (const rule of blacklist) {
    if (matchIpOrCidr(clientIp, (rule as any).pattern)) {
      logger.warn({ clientIp, proxyId: proxy.id, rule: (rule as any).pattern }, 'Access denied by blacklist');
      return false;
    }
  }

  // If whitelist exists, must match
  if (whitelist.length > 0) {
    const allowed = whitelist.some(r => matchIpOrCidr(clientIp, (r as any).pattern));
    if (!allowed) {
      logger.warn({ clientIp, proxyId: proxy.id }, 'Access denied: not in whitelist');
      return false;
    }
  }

  return true;
}
