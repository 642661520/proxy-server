import { IncomingMessage, ServerResponse } from 'http';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { createReadStream, existsSync, statSync } from 'fs';
import { resolve, extname, join } from 'path';
import type { ProxyConfig } from '../types.js';
import { buildUpstreamUrl } from '../utils/url.js';
import { logger } from '../logger.js';

export interface ForwardResult {
  statusCode: number;
  responseTimeMs: number;
  bytesSent: number;
  bytesReceived: number;
  upstreamUrl: string;
  error?: string;
  /** Buffered response body (only populated when bufferResponse is true) */
  body?: Buffer;
  /** Response headers (only populated when bufferResponse is true) */
  responseHeaders?: Record<string, string | string[]>;
}

// ─── Static File Serving ───────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.wasm': 'application/wasm',
};

function getMime(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * Serve a static file from a local directory. Returns true if the request was
 * handled (file served or error sent to client), false if we should fall through
 * to the normal forwarding logic.
 */
export function serveStaticFile(
  clientReq: IncomingMessage,
  clientRes: ServerResponse,
  proxy: ProxyConfig,
  injectedPath: string,
  bufferResponse?: boolean,
): Promise<ForwardResult | null> {
  return new Promise((done) => {
    const startTime = Date.now();
    const staticDir = resolve(proxy.static_dir!);

    // Map request path to filesystem path
    let relativePath = injectedPath;
    // Strip the proxy path_prefix from the URL path
    if (proxy.strip_prefix && proxy.path_prefix && proxy.path_prefix !== '/') {
      const prefix = proxy.path_prefix.endsWith('/') ? proxy.path_prefix.slice(0, -1) : proxy.path_prefix;
      if (relativePath.startsWith(prefix)) {
        relativePath = relativePath.slice(prefix.length) || '/';
      }
    }
    // Remove query string if present
    const qIdx = relativePath.indexOf('?');
    if (qIdx >= 0) relativePath = relativePath.slice(0, qIdx);

    // Normalize: ensure leading /
    if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;

    // Resolve and check for path traversal (both resolved to absolute paths)
    let rawPath = resolve(join(staticDir, relativePath));
    // Ensure trailing slash consistency for startsWith check
    const resolvedDir = staticDir.endsWith('/') || staticDir.endsWith('\\') ? staticDir.slice(0, -1) : staticDir;
    if (!rawPath.startsWith(resolvedDir + '/') && !rawPath.startsWith(resolvedDir + '\\') && rawPath !== resolvedDir) {
      clientRes.writeHead(403, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: '禁止访问' }));
      done({ statusCode: 403, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${rawPath}`, error: 'Path traversal' });
      return;
    }

    let filePath = rawPath;

    // Directory → try index file
    try {
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        const indexFile = proxy.index || 'index.html';
        filePath = resolve(join(filePath, indexFile));
        // Re-check traversal after appending index
        if (!filePath.startsWith(resolvedDir + '/') && !filePath.startsWith(resolvedDir + '\\') && filePath !== resolvedDir) {
          clientRes.writeHead(403, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: '禁止访问' }));
          done({ statusCode: 403, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}`, error: 'Path traversal' });
          return;
        }
      }
    } catch { /* stat failed, will 404 below */ }

    // Check file exists
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      // If we tried an index file that doesn't exist, fall through to SPA mode:
      // serve the real index.html for client-side routing
      if (proxy.index && filePath !== rawPath) {
        // Already tried index — don't loop
      }
      // SPA fallback: if index file is set, try serving it for any 404
      if (proxy.index && filePath !== resolve(staticDir, proxy.index)) {
        const spaPath = resolve(staticDir, proxy.index);
        if (existsSync(spaPath) && statSync(spaPath).isFile()) {
          filePath = spaPath;
        } else {
          clientRes.writeHead(404, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: '文件不存在', path: relativePath }));
          done({ statusCode: 404, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${rawPath}`, error: 'Not found' });
          return;
        }
      } else {
        clientRes.writeHead(404, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '文件不存在', path: relativePath }));
        done({ statusCode: 404, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${rawPath}`, error: 'Not found' });
        return;
      }
    }

    // Serve the file
    try {
      const stats = statSync(filePath);
      const mime = getMime(filePath);
      const isText = mime.includes('text/') || mime.includes('javascript') || mime.includes('json') || mime.includes('xml') || mime.includes('svg');

      const headers: Record<string, string> = {
        'Content-Type': mime,
        'Content-Length': String(stats.size),
        'Cache-Control': proxy.cache_ttl > 0 ? `public, max-age=${proxy.cache_ttl}` : 'no-cache',
      };

      // Conditional: If-None-Match / If-Modified-Since
      const etag = `"${stats.mtimeMs.toString(36)}-${stats.size.toString(36)}"`;
      headers['ETag'] = etag;
      headers['Last-Modified'] = stats.mtime.toUTCString();

      if (clientReq.headers['if-none-match'] === etag) {
        clientRes.writeHead(304, headers);
        clientRes.end();
        done({ statusCode: 304, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}` });
        return;
      }

      // Only allow GET/HEAD for static files
      if (clientReq.method !== 'GET' && clientReq.method !== 'HEAD') {
        clientRes.writeHead(405, { 'Content-Type': 'application/json', Allow: 'GET, HEAD' });
        clientRes.end(JSON.stringify({ error: '方法不允许' }));
        done({ statusCode: 405, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}`, error: 'Method not allowed' });
        return;
      }

      clientRes.writeHead(200, headers);

      if (clientReq.method === 'HEAD') {
        clientRes.end();
        done({ statusCode: 200, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}`, responseHeaders: bufferResponse ? headers : undefined });
        return;
      }

      const stream = createReadStream(filePath);
      let bytesSent = 0;
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        bytesSent += chunk.length;
        if (bufferResponse) chunks.push(chunk);
        clientRes.write(chunk);
      });

      stream.on('end', () => {
        clientRes.end();
        done({
          statusCode: 200,
          responseTimeMs: Date.now() - startTime,
          bytesSent,
          bytesReceived: 0,
          upstreamUrl: `file://${filePath}`,
          body: bufferResponse ? Buffer.concat(chunks) : undefined,
          responseHeaders: bufferResponse ? headers : undefined,
        });
      });

      stream.on('error', (err: Error) => {
        logger.error({ err, filePath }, 'Static file read error');
        if (!clientRes.headersSent) {
          clientRes.writeHead(500, { 'Content-Type': 'application/json' });
        }
        if (!clientRes.writableEnded) {
          clientRes.end(JSON.stringify({ error: '文件读取失败' }));
        }
        done({ statusCode: 500, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}`, error: err.message });
      });

    } catch (err: any) {
      logger.error({ err, filePath }, 'Static file serve error');
      if (!clientRes.headersSent) {
        clientRes.writeHead(500, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '服务器内部错误' }));
      }
      done({ statusCode: 500, responseTimeMs: Date.now() - startTime, bytesSent: 0, bytesReceived: 0, upstreamUrl: `file://${filePath}`, error: err.message });
    }
  });
}

// ─── Upstream Forwarding ───────────────────────────────────────────

// Load-balancing state: per-proxy round-robin counter
const rrCounters = new Map<number, number>();

/** Pick an upstream URL from the proxy's config using the configured strategy */
function pickUpstream(proxy: ProxyConfig): string {
  const urls = proxy.upstream_urls;
  if (!urls || urls.length === 0) return proxy.upstream_url;

  if (proxy.lb_strategy === 'rr') {
    const current = rrCounters.get(proxy.id) || 0;
    const next = (current + 1) % urls.length;
    rrCounters.set(proxy.id, next);
    return urls[current];
  }

  // Default: random — good for tile servers (各子域名均匀分布)
  return urls[Math.floor(Math.random() * urls.length)];
}

export function forwardRequest(
  clientReq: IncomingMessage,
  clientRes: ServerResponse,
  proxy: ProxyConfig,
  injectedPath: string,
  timeout: number,
  bufferResponse?: boolean,
): Promise<ForwardResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    // Build upstream URL (with load balancing if configured)
    const selectedUrl = pickUpstream(proxy);
    const upstreamUrl = buildUpstreamUrl(
      selectedUrl,
      injectedPath,
      proxy.path_prefix,
      !!proxy.strip_prefix,
    );

    const parsedUrl = new URL(upstreamUrl);
    const isHttps = parsedUrl.protocol === 'https:';

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: clientReq.method,
      headers: { ...clientReq.headers },
      rejectUnauthorized: !!proxy.tls_reject_unauthorized,
      timeout: timeout || 30000,
    };

    // Override Host header
    (options.headers as any)['host'] = proxy.upstream_host || parsedUrl.hostname;

    // Set SNI if specified
    if (proxy.tls_servername) {
      (options as any).servername = proxy.tls_servername;
    }

    // Set custom ciphers if specified
    if (proxy.tls_ciphers) {
      (options as any).ciphers = proxy.tls_ciphers;
    }

    // Remove hop-by-hop headers
    const hopByHop = ['connection', 'keep-alive', 'proxy-connection', 'proxy-authenticate',
      'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'];
    for (const h of hopByHop) {
      delete (options.headers as any)[h];
    }

    // Add X-Forwarded-For
    const clientIp = clientReq.socket.remoteAddress || 'unknown';
    const existingFwd = (options.headers as any)['x-forwarded-for'];
    (options.headers as any)['x-forwarded-for'] = existingFwd
      ? `${existingFwd}, ${clientIp}`
      : clientIp;

    let bytesReceived = 0;
    let responseStatusCode = 502;
    const chunks: Buffer[] = [];

    const req = (isHttps ? https : http).request(options, (upstreamRes) => {
      responseStatusCode = upstreamRes.statusCode || 200;

      // Copy response headers
      // Remove hop-by-hop from response too
      const resHopByHop = ['connection', 'keep-alive', 'proxy-authenticate',
        'proxy-authorization', 'te', 'trailers', 'transfer-encoding'];
      const filteredHeaders: Record<string, string | string[]> = {};
      for (const [key, val] of Object.entries(upstreamRes.headers)) {
        if (!resHopByHop.includes(key.toLowerCase()) && val) {
          filteredHeaders[key] = val;
        }
      }

      clientRes.writeHead(responseStatusCode, filteredHeaders);

      upstreamRes.on('data', (chunk: Buffer) => {
        bytesReceived += chunk.length;
        if (bufferResponse) chunks.push(chunk);
        clientRes.write(chunk);
      });

      upstreamRes.on('end', () => {
        clientRes.end();
        resolve({
          statusCode: responseStatusCode,
          responseTimeMs: Date.now() - startTime,
          bytesSent: 0,
          bytesReceived,
          upstreamUrl,
          body: bufferResponse ? Buffer.concat(chunks) : undefined,
          responseHeaders: bufferResponse ? filteredHeaders : undefined,
        });
      });

      upstreamRes.on('error', (err: Error) => {
        logger.error({ err, upstreamUrl }, 'Upstream response stream error');
        if (!clientRes.headersSent) {
          clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        }
        if (!clientRes.writableEnded) {
          clientRes.end();
        }
        resolve({
          statusCode: 502,
          responseTimeMs: Date.now() - startTime,
          bytesSent: 0,
          bytesReceived,
          upstreamUrl,
          error: err.message,
        });
      });
    });

    req.on('error', (err: Error) => {
      logger.error({ err, upstreamUrl }, 'Upstream request failed');
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: '上游服务器连接失败', message: err.message }));
      } else if (!clientRes.writableEnded) {
        clientRes.end();
      }
      // Ensure client request is destroyed on upstream error
      if (!clientReq.destroyed) {
        clientReq.destroy();
      }
      resolve({
        statusCode: 502,
        responseTimeMs: Date.now() - startTime,
        bytesSent: 0,
        bytesReceived: 0,
        upstreamUrl,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });

    // Pipe request body (respect max_body_size)
    const maxBodySize = proxy.max_body_size || 10485760; // default 10MB
    let bodyBytes = 0;
    clientReq.on('data', (chunk: Buffer) => {
      bodyBytes += chunk.length;
      if (bodyBytes > maxBodySize) {
        clientReq.destroy(new Error('Request body too large'));
        req.destroy();
        if (!clientRes.headersSent) {
          clientRes.writeHead(413, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: '请求体过大', maxSize: maxBodySize }));
        }
        resolve({
          statusCode: 413,
          responseTimeMs: Date.now() - startTime,
          bytesSent: 0,
          bytesReceived: bodyBytes,
          upstreamUrl,
          error: 'Request body too large',
        });
      }
    });
    clientReq.pipe(req);
  });
}
