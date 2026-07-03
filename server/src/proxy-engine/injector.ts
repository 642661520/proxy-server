import type { ProxyConfig } from '../modules/proxies/proxy.service.js';
import { createRequire } from 'module';

// Lazy require -- gracefully degrades when DB modules are unavailable (YAML mode)
let _getInjectionRulesByProxyId: Function | null = null;
function getInjectionRulesByProxyId(proxyId: number): any[] {
  if (!_getInjectionRulesByProxyId) {
    try {
      _getInjectionRulesByProxyId = createRequire(import.meta.url)
        ('../modules/injection-rules/injection-rule.service.js').getInjectionRulesByProxyId;
    } catch {
      _getInjectionRulesByProxyId = () => [];
    }
  }
  return _getInjectionRulesByProxyId!(proxyId);
}

export interface InjectorResult {
  path: string;
  headers: Record<string, string>;
}

export function applyInjections(
  reqPath: string,
  reqQuery: string,
  proxy: ProxyConfig,
): InjectorResult {
  const queryParams = new URLSearchParams(reqQuery || '');
  const extraHeaders: Record<string, string> = {};

  // Inline injections (YAML mode) take priority over DB lookups
  const sources = proxy._injections
    ? proxy._injections.filter(r => r.enabled).map(r => ({
        key_value: r.key_value,
        inject_into: r.inject_into,
        inject_name: r.inject_name,
      }))
    : getInjectionRulesByProxyId(proxy.id).filter((r: any) => r.enabled).map((r: any) => ({
        key_value: r.key_value,
        inject_into: r.inject_into,
        inject_name: r.inject_name,
      }));

  for (const rule of sources) {
    switch (rule.inject_into) {
      case 'query':
        queryParams.set(rule.inject_name, rule.key_value);
        break;
      case 'header':
        extraHeaders[rule.inject_name] = rule.key_value;
        break;
    }
  }

  let newPath = reqPath;
  const qs = queryParams.toString();
  if (qs) {
    newPath = newPath + '?' + qs;
  }

  return { path: newPath, headers: extraHeaders };
}
