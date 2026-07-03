export function buildUpstreamUrl(
  upstreamUrl: string,
  reqPath: string,
  pathPrefix: string,
  stripPrefix: boolean
): string {
  const base = upstreamUrl.replace(/\/+$/, '');

  let targetPath: string;
  if (stripPrefix && pathPrefix !== '/') {
    targetPath = reqPath.replace(new RegExp(`^${escapeRegex(pathPrefix)}`), '') || '/';
  } else {
    targetPath = reqPath;
  }

  // Ensure leading slash
  if (!targetPath.startsWith('/')) {
    targetPath = '/' + targetPath;
  }

  return base + targetPath;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseUpstreamHost(upstreamUrl: string): { hostname: string; port: number; isHttps: boolean } {
  const url = new URL(upstreamUrl);
  return {
    hostname: url.hostname,
    port: url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80),
    isHttps: url.protocol === 'https:',
  };
}
