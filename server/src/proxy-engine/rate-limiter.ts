interface Bucket {
  tokens: number;
  lastRefill: number;
  penaltyUntil: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 100000;

// Clean up old buckets periodically
setInterval(() => {
  const now = Date.now();
  // Time-based cleanup: remove buckets not touched in 5 minutes
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 300_000) {
      buckets.delete(key);
    }
  }
  // Fallback: if still over limit, remove the oldest entries
  if (buckets.size > MAX_BUCKETS) {
    const entries = [...buckets.entries()];
    entries.sort((a, b) => a[1].lastRefill - b[1].lastRefill);
    for (const [key] of entries.slice(0, entries.length - MAX_BUCKETS)) {
      buckets.delete(key);
    }
  }
}, 60000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  penaltySeconds: number,
): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: maxRequests, lastRefill: now, penaltyUntil: 0 };
    buckets.set(key, bucket);
  }

  // Check penalty
  if (now < bucket.penaltyUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil((bucket.penaltyUntil - now) / 1000),
    };
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refillRate = maxRequests / windowSeconds;
  bucket.tokens = Math.min(maxRequests, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetSeconds: windowSeconds,
    };
  }

  // Apply penalty if configured
  if (penaltySeconds > 0) {
    bucket.penaltyUntil = now + penaltySeconds * 1000;
  }

  return {
    allowed: false,
    remaining: 0,
    resetSeconds: Math.max(1, Math.ceil((1 - bucket.tokens) / (maxRequests / windowSeconds))),
  };
}
