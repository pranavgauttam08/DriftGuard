// ============================================================
// Cache Layer — In-memory with stale-while-revalidate
// Drop-in replacement for Vercel KV / Redis in production
// ============================================================

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  staleAt: number;    // after this, serve stale + revalidate
  expiredAt: number;  // after this, force refetch
  tags: string[];
}

export interface CacheOptions {
  /** Fresh duration in ms (default: 30s) */
  ttlMs?: number;
  /** Stale duration after TTL (default: 60s) — total lifetime = ttl + stale */
  staleTtlMs?: number;
  /** Tags for invalidation (e.g., ['org:abc', 'fingerprints']) */
  tags?: string[];
}

const DEFAULT_TTL = 30_000;      // 30 seconds fresh
const DEFAULT_STALE = 60_000;    // 60 seconds stale-while-revalidate

const store = new Map<string, CacheEntry<any>>();
const revalidating = new Set<string>();

/**
 * Get a cached value with stale-while-revalidate semantics.
 */
export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlMs = DEFAULT_TTL, staleTtlMs = DEFAULT_STALE, tags = [] } = options;
  const now = Date.now();
  const cached = store.get(key);

  // Fresh hit
  if (cached && now < cached.staleAt) {
    return cached.data as T;
  }

  // Stale hit — return stale data + revalidate in background
  if (cached && now < cached.expiredAt && !revalidating.has(key)) {
    revalidating.add(key);
    fetcher().then(data => {
      store.set(key, {
        data,
        createdAt: Date.now(),
        staleAt: Date.now() + ttlMs,
        expiredAt: Date.now() + ttlMs + staleTtlMs,
        tags,
      });
    }).catch(err => {
      console.error(`Cache revalidation error for ${key}:`, err);
    }).finally(() => {
      revalidating.delete(key);
    });

    return cached.data as T;
  }

  // Miss or expired — fetch synchronously
  const data = await fetcher();
  store.set(key, {
    data,
    createdAt: now,
    staleAt: now + ttlMs,
    expiredAt: now + ttlMs + staleTtlMs,
    tags,
  });

  return data;
}

/**
 * Set a cache value directly.
 */
export function cacheSet<T>(key: string, data: T, options: CacheOptions = {}): void {
  const { ttlMs = DEFAULT_TTL, staleTtlMs = DEFAULT_STALE, tags = [] } = options;
  const now = Date.now();
  store.set(key, {
    data,
    createdAt: now,
    staleAt: now + ttlMs,
    expiredAt: now + ttlMs + staleTtlMs,
    tags,
  });
}

/**
 * Invalidate cache entries by tag.
 */
export function cacheInvalidateByTag(tag: string): number {
  let count = 0;
  for (const [key, entry] of store.entries()) {
    if (entry.tags.includes(tag)) {
      store.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * Invalidate a specific cache key.
 */
export function cacheInvalidate(key: string): boolean {
  return store.delete(key);
}

/**
 * Invalidate all entries for an org (prefix-based).
 */
export function cacheInvalidateOrg(orgId: string): number {
  let count = 0;
  for (const key of store.keys()) {
    if (key.startsWith(`org:${orgId}`)) {
      store.delete(key);
      count++;
    }
  }
  // Also invalidate by tag
  count += cacheInvalidateByTag(`org:${orgId}`);
  return count;
}

/**
 * Cache statistics.
 */
export function cacheStats(): { size: number; hitRate: string; oldestMs: number } {
  const now = Date.now();
  let oldest = now;
  for (const entry of store.values()) {
    if (entry.createdAt < oldest) oldest = entry.createdAt;
  }
  return {
    size: store.size,
    hitRate: 'N/A (in-memory, no tracking)',
    oldestMs: now - oldest,
  };
}

/**
 * Cleanup expired entries.
 */
export function cacheCleanup(): number {
  const now = Date.now();
  let removed = 0;
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiredAt) {
      store.delete(key);
      removed++;
    }
  }
  return removed;
}

// ── Cache key builders ───────────────────────────────────

export const CacheKeys = {
  fingerprint: (orgId: string, endpointId: string, version: string) =>
    `org:${orgId}:fp:${endpointId}:${version}`,
  fingerprints: (orgId: string, endpointId: string) =>
    `org:${orgId}:fps:${endpointId}`,
  diff: (orgId: string, diffId: string) =>
    `org:${orgId}:diff:${diffId}`,
  diffs: (orgId: string, endpointId: string) =>
    `org:${orgId}:diffs:${endpointId}`,
  deployment: (orgId: string, deploymentId: string) =>
    `org:${orgId}:deploy:${deploymentId}`,
  alerts: (orgId: string) =>
    `org:${orgId}:alerts`,
  compliance: (orgId: string, framework: string) =>
    `org:${orgId}:compliance:${framework}`,
};
