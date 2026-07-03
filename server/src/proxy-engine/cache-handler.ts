import { LRUCache } from 'lru-cache';
import type { ProxyConfig } from '../types.js';
import { IncomingMessage } from 'http';
import { logger } from '../logger.js';

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: Buffer;
  timestamp: number;
}

// Global cache store (memory)
const cacheStore = new LRUCache<string, CachedResponse>({
  max: 10000,
  maxSize: 100 * 1024 * 1024, // 100 MB
  sizeCalculation: (value) => value.body.length,
});

export function getCacheKey(req: IncomingMessage, proxy: ProxyConfig): string {
  return `proxy:${proxy.id}|${req.method}|${req.url}`;
}

export function getCachedResponse(cacheKey: string): CachedResponse | undefined {
  if (!cacheKey) return undefined;
  const cached = cacheStore.get(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Cache hit');
  }
  return cached;
}

export function setCachedResponse(cacheKey: string, response: CachedResponse, ttlSeconds: number): void {
  if (!cacheKey) return;
  cacheStore.set(cacheKey, response, { ttl: ttlSeconds * 1000 });
}

export function isCacheableMethod(method: string | undefined, proxy: ProxyConfig): boolean {
  if (!proxy.cache_ttl || proxy.cache_ttl <= 0) return false;
  const methods = (proxy.allowed_methods || 'GET').split(',').map(s => s.trim().toUpperCase());
  return methods.includes((method || 'GET').toUpperCase());
}

export function getCacheStats() {
  return {
    size: cacheStore.size,
    maxSize: cacheStore.maxSize,
    calculatedSize: cacheStore.calculatedSize,
  };
}

export function purgeCache(proxyId?: number): number {
  if (proxyId !== undefined) {
    let count = 0;
    const prefix = `proxy:${proxyId}|`;
    for (const key of cacheStore.keys()) {
      if (key.startsWith(prefix)) {
        cacheStore.delete(key);
        count++;
      }
    }
    return count;
  }

  const count = cacheStore.size;
  cacheStore.clear();
  return count;
}
