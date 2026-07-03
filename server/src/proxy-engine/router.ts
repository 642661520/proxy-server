import type { ProxyConfig } from '../types.js';
import { logger } from '../logger.js';

// In-memory routing table (set from YAML config)
let routeTable: ProxyConfig[] = [];

export function getRouteTable(): ProxyConfig[] {
  return routeTable;
}

/** Set route table directly from YAML config */
export function setRouteTable(proxies: ProxyConfig[]): void {
  routeTable = proxies;
  logger.info({ count: routeTable.length }, 'Route table set from YAML');
}

export function matchProxy(reqHostname: string | undefined, reqPath: string, reqPort: number): ProxyConfig | null {
  // Sort by most specific path first
  const sorted = [...routeTable].sort((a, b) => {
    const aLen = (a.path_prefix || '/').length;
    const bLen = (b.path_prefix || '/').length;
    return bLen - aLen;
  });

  for (const proxy of sorted) {
    // Port match (if proxy specifies a port)
    if (proxy.listen_port && proxy.listen_port !== reqPort) continue;

    // Hostname match (if proxy specifies a hostname) — case-insensitive per RFC 7230
    if (proxy.hostname && reqHostname && proxy.hostname.toLowerCase() !== reqHostname.toLowerCase()) continue;

    // Path prefix match
    const prefix = proxy.path_prefix || '/';
    if (reqPath.startsWith(prefix) || prefix === '/') {
      return proxy;
    }
  }

  return null;
}
