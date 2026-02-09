const WINDOW_MS = 30_000;
const WINDOW_LIMIT = 20;
const buckets = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string, limit = WINDOW_LIMIT, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 } as const;
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter } as const;
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0 } as const;
}

// TODO: Replace with Redis/Upstash backed limiter for production reliability.
