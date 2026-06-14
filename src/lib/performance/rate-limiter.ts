// ============================================================
// Rate Limiting Engine — Tiered API key rate limiting
// ============================================================

export type RateLimitTier = 'free' | 'pro' | 'enterprise' | 'internal';

const TIER_LIMITS: Record<RateLimitTier, { maxRequestsPerMinute: number; maxRequestsPerHour: number; burstLimit: number }> = {
  free:       { maxRequestsPerMinute: 60,    maxRequestsPerHour: 1000,   burstLimit: 10 },
  pro:        { maxRequestsPerMinute: 600,   maxRequestsPerHour: 10000,  burstLimit: 50 },
  enterprise: { maxRequestsPerMinute: 3000,  maxRequestsPerHour: 100000, burstLimit: 200 },
  internal:   { maxRequestsPerMinute: 10000, maxRequestsPerHour: 500000, burstLimit: 1000 },
};

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  minuteCount: number;
  minuteStart: number;
  hourCount: number;
  hourStart: number;
}

// In-memory store (use Redis/Vercel KV in production)
const buckets = new Map<string, TokenBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs?: number;
  headers: Record<string, string>;
}

/**
 * Check and consume a rate limit token.
 */
export function checkRateLimit(keyId: string, tier: RateLimitTier = 'free'): RateLimitResult {
  const limits = TIER_LIMITS[tier];
  const now = Date.now();

  let bucket = buckets.get(keyId);
  if (!bucket) {
    bucket = {
      tokens: limits.burstLimit,
      lastRefill: now,
      minuteCount: 0,
      minuteStart: now,
      hourCount: 0,
      hourStart: now,
    };
    buckets.set(keyId, bucket);
  }

  // Refill tokens (token bucket algorithm)
  const elapsed = now - bucket.lastRefill;
  const refillRate = limits.maxRequestsPerMinute / 60000; // tokens per ms
  bucket.tokens = Math.min(limits.burstLimit, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  // Reset minute window
  if (now - bucket.minuteStart >= 60000) {
    bucket.minuteCount = 0;
    bucket.minuteStart = now;
  }

  // Reset hour window
  if (now - bucket.hourStart >= 3600000) {
    bucket.hourCount = 0;
    bucket.hourStart = now;
  }

  // Check limits
  if (bucket.tokens < 1) {
    const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRate);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.maxRequestsPerMinute,
      retryAfterMs,
      headers: buildHeaders(0, limits.maxRequestsPerMinute, retryAfterMs),
    };
  }

  if (bucket.minuteCount >= limits.maxRequestsPerMinute) {
    const retryAfterMs = 60000 - (now - bucket.minuteStart);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.maxRequestsPerMinute,
      retryAfterMs,
      headers: buildHeaders(0, limits.maxRequestsPerMinute, retryAfterMs),
    };
  }

  if (bucket.hourCount >= limits.maxRequestsPerHour) {
    const retryAfterMs = 3600000 - (now - bucket.hourStart);
    return {
      allowed: false,
      remaining: 0,
      limit: limits.maxRequestsPerHour,
      retryAfterMs,
      headers: buildHeaders(0, limits.maxRequestsPerHour, retryAfterMs),
    };
  }

  // Consume token
  bucket.tokens -= 1;
  bucket.minuteCount += 1;
  bucket.hourCount += 1;

  const remaining = Math.min(
    limits.maxRequestsPerMinute - bucket.minuteCount,
    Math.floor(bucket.tokens)
  );

  return {
    allowed: true,
    remaining,
    limit: limits.maxRequestsPerMinute,
    headers: buildHeaders(remaining, limits.maxRequestsPerMinute),
  };
}

/**
 * Idempotency key tracking — deduplicate requests.
 */
const idempotencyCache = new Map<string, { response: any; expiresAt: number }>();

export function checkIdempotency(key: string): any | null {
  const cached = idempotencyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }
  if (cached) idempotencyCache.delete(key);
  return null;
}

export function setIdempotency(key: string, response: any, ttlMs: number = 300000): void {
  idempotencyCache.set(key, { response, expiresAt: Date.now() + ttlMs });

  // Cleanup old entries periodically
  if (idempotencyCache.size > 10000) {
    const now = Date.now();
    for (const [k, v] of idempotencyCache.entries()) {
      if (v.expiresAt < now) idempotencyCache.delete(k);
    }
  }
}

function buildHeaders(remaining: number, limit: number, retryAfterMs?: number): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.ceil(Date.now() / 60000) * 60),
  };
  if (retryAfterMs) {
    headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
    headers['X-RateLimit-RetryAfter-Ms'] = String(retryAfterMs);
  }
  return headers;
}

/**
 * Cleanup — remove stale buckets (call periodically).
 */
export function cleanupRateLimiter(): void {
  const now = Date.now();
  const staleThreshold = 3600000; // 1 hour
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > staleThreshold) {
      buckets.delete(key);
    }
  }
}
