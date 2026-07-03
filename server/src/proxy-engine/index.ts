import type { Server } from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { matchProxy } from './router.js';
import { forwardRequest, serveStaticFile } from './forwarder.js';
import { applyInjections } from './injector.js';
import { checkAccess } from './access-guard.js';
import { checkRateLimit } from './rate-limiter.js';
import { getCacheKey, getCachedResponse, setCachedResponse, isCacheableMethod } from './cache-handler.js';
import { logRequest } from './auditor.js';
import { logger } from '../logger.js';

export function initProxyEngine(server: Server): void {
  server.on('request', async (clientReq: IncomingMessage, clientRes: ServerResponse) => {
    const startTime = Date.now();
    const clientIp = clientReq.socket.remoteAddress
      || 'unknown';

    try {
      // 1. Match proxy config
      const reqHostname = clientReq.headers.host?.split(':')[0];
      const reqPath = clientReq.url || '/';
      // Parse port from Host header or use server port
      const hostPort = clientReq.headers.host?.split(':')[1];
      const reqPort = hostPort ? parseInt(hostPort, 10) : (server.address() as any)?.port || 3000;

      const proxy = matchProxy(reqHostname, reqPath, reqPort);

      if (!proxy) {
        clientRes.writeHead(404, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '未找到匹配的代理配置', path: reqPath }));
        logRequest({
          proxy_id: null, request_method: clientReq.method || 'GET',
          request_path: reqPath, request_query: '',
          upstream_url: '', status_code: 404, response_time_ms: Date.now() - startTime,
          bytes_sent: 0, bytes_received: 0, client_ip: clientIp,
          user_agent: (clientReq.headers['user-agent'] as string) || '',
          referer: (clientReq.headers.referer as string) || '',
          cache_hit: 0, error_message: 'No matching proxy',
        });
        return;
      }

      // 2. Access Guard
      if (!checkAccess(clientIp, proxy)) {
        clientRes.writeHead(403, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '访问被拒绝' }));
        return;
      }

      // 3. Rate Limiting (inline, using proxy fields directly)
      if (proxy.rate_limit_req > 0) {
        const key = `proxy:${proxy.id}:ip:${clientIp}`;
        const result = checkRateLimit(key, proxy.rate_limit_req, proxy.rate_limit_window, 0);
        if (!result.allowed) {
          clientRes.writeHead(429, {
            'Content-Type': 'application/json',
            'Retry-After': String(result.resetSeconds),
          });
          clientRes.end(JSON.stringify({ error: '请求过于频繁，请稍后重试', retryAfter: result.resetSeconds }));
          return;
        }
      }

      // 4. Cache Check (inline, using proxy.cache_ttl directly)
      let cacheKey = '';
      if (isCacheableMethod(clientReq.method, proxy)) {
        cacheKey = getCacheKey(clientReq, proxy);
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          const filteredHeaders: Record<string, string | string[]> = {};
          for (const [k, v] of Object.entries(cached.headers)) {
            if (v) filteredHeaders[k] = v;
          }
          clientRes.writeHead(cached.statusCode, filteredHeaders);
          clientRes.end(cached.body);

          logRequest({
            proxy_id: proxy.id, request_method: clientReq.method || 'GET',
            request_path: reqPath, request_query: '',
            upstream_url: '', status_code: cached.statusCode,
            response_time_ms: Date.now() - startTime,
            bytes_sent: cached.body.length, bytes_received: 0,
            client_ip: clientIp,
            user_agent: (clientReq.headers['user-agent'] as string) || '',
            referer: (clientReq.headers.referer as string) || '',
            cache_hit: 1, error_message: '',
          });
          return;
        }
      }

      // 5. Branch: static file serving vs upstream forwarding
      const shouldBuffer = !!cacheKey;

      if (proxy.static_dir) {
        // ─── Static File Mode ───
        const basePath = reqPath.includes('?') ? reqPath.split('?')[0] : reqPath;

        const result = await serveStaticFile(clientReq, clientRes, proxy, basePath, shouldBuffer);

        if (result && result.body && cacheKey && !result.error) {
          setCachedResponse(cacheKey, {
            statusCode: result.statusCode,
            headers: result.responseHeaders || {},
            body: result.body,
            timestamp: Date.now(),
          }, proxy.cache_ttl);
        }

        logRequest({
          proxy_id: proxy.id,
          request_method: clientReq.method || 'GET',
          request_path: reqPath,
          request_query: reqPath.includes('?') ? reqPath.split('?')[1] : '',
          upstream_url: result?.upstreamUrl || `file://${proxy.static_dir}`,
          status_code: result?.statusCode || 500,
          response_time_ms: result?.responseTimeMs || (Date.now() - startTime),
          bytes_sent: result?.bytesSent || 0,
          bytes_received: 0,
          client_ip: clientIp,
          user_agent: (clientReq.headers['user-agent'] as string) || '',
          referer: (clientReq.headers.referer as string) || '',
          cache_hit: 0,
          error_message: result?.error || '',
        });
        return;
      }

      // 5b. Inject injection rules (upstream mode only)
      const reqQuery = reqPath.includes('?') ? reqPath.split('?')[1] : '';
      const basePath = reqPath.includes('?') ? reqPath.split('?')[0] : reqPath;
      const { path: injectedPath, headers: injectedHeaders } = applyInjections(basePath, reqQuery, proxy);

      // Add injected headers to request (sanitize control characters)
      for (const [key, val] of Object.entries(injectedHeaders)) {
        const sanitized = val.replace(/[\r\n]/g, '');
        clientReq.headers[key.toLowerCase()] = sanitized;
      }

      // 6. Forward request (buffer response body when caching is enabled)
      const result = await forwardRequest(clientReq, clientRes, proxy, injectedPath, proxy.timeout, shouldBuffer);

      // 7. Cache response if applicable
      if (cacheKey && result.body && result.statusCode > 0 && !result.error) {
        setCachedResponse(cacheKey, {
          statusCode: result.statusCode,
          headers: result.responseHeaders || {},
          body: result.body,
          timestamp: Date.now(),
        }, proxy.cache_ttl);
      }

      // 8. Log (async)
      logRequest({
        proxy_id: proxy.id,
        request_method: clientReq.method || 'GET',
        request_path: reqPath,
        request_query: reqQuery,
        upstream_url: result.upstreamUrl,
        status_code: result.statusCode,
        response_time_ms: result.responseTimeMs,
        bytes_sent: 0,
        bytes_received: result.bytesReceived,
        client_ip: clientIp,
        user_agent: (clientReq.headers['user-agent'] as string) || '',
        referer: (clientReq.headers.referer as string) || '',
        cache_hit: 0,
        error_message: result.error || '',
      });

    } catch (err: any) {
      logger.error({ err }, 'Proxy error');
      if (!clientRes.headersSent) {
        clientRes.writeHead(500, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '代理处理错误' }));
      }
    }
  });

  server.on('error', (err) => {
    logger.error({ err }, 'Proxy engine error');
  });
}
