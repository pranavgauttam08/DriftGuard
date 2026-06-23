// ============================================================
// lib/rateLimit.ts — Upstash Redis sliding window rate limiter
// Server-side only. Never import in client components.
// ============================================================
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 100 requests per minute per org (sliding window)
export const rateLimiter = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix:    'driftguard',
});

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  reset:     number;   // epoch ms when the window resets
}

/**
 * Check whether the given identifier (orgId, userId, IP) is within the rate limit.
 * Returns { success, remaining, reset }.
 * If Upstash is not configured, always returns success=true (graceful degradation).
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Graceful degradation — env vars not configured
    return { success: true, remaining: 99, reset: Date.now() + 60_000 };
  }
  const { success, remaining, reset } = await rateLimiter.limit(identifier);
  return { success, remaining, reset };
}

/**
 * Build the standard 429 rate-limit response with proper headers.
 */
export function rateLimitResponse(remaining: number, reset: number): Response {
  return Response.json(
    { error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After':         String(Math.ceil((reset - Date.now()) / 1000)),
        'X-RateLimit-Limit':   '100',
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset':   String(reset),
      },
    },
  );
}
