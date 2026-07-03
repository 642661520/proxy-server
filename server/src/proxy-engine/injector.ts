import type { ProxyConfig } from '../types.js';

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

  // Use inline injections from YAML config
  const sources = (proxy._injections || [])
    .filter(r => r.enabled)
    .map(r => ({
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
