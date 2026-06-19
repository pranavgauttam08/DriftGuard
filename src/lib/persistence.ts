'use client';

// ============================================================
// Persistence Layer — localStorage with user-scoping
// Provides data survival across refresh/logout when Supabase
// is not configured. Automatically upgrades to Supabase when available.
// ============================================================

const STORAGE_VERSION = 'v1';
const PREFIX = 'dg';

function key(userId: string, collection: string): string {
  return `${PREFIX}:${STORAGE_VERSION}:${userId}:${collection}`;
}

/** Safely read a JSON array from localStorage */
export function loadCollection<T>(userId: string, collection: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key(userId, collection));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Safely write a JSON array to localStorage */
export function saveCollection<T>(userId: string, collection: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key(userId, collection), JSON.stringify(data));
  } catch (e) {
    // localStorage full or unavailable — silently fail
    console.warn(`[DriftGuard] Failed to persist ${collection}:`, e);
  }
}

/** Remove a collection from localStorage */
export function clearCollection(userId: string, collection: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key(userId, collection));
  } catch {}
}

/** Load a single value */
export function loadValue<T>(userId: string, key_name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key(userId, key_name));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Save a single value */
export function saveValue<T>(userId: string, key_name: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key(userId, key_name), JSON.stringify(value));
  } catch {}
}

// ── Collection names ─────────────────────────────────────────
export const COLLECTIONS = {
  ENDPOINTS: 'endpoints',
  FINGERPRINTS: 'fingerprints',
  DIFFS: 'diffs',
  ALERTS: 'alerts',
  PROBE_RESULTS: 'probe_results',
  DATASETS: 'datasets',
  DEPLOYMENTS: 'deployments',
  AI_API_KEYS: 'ai_api_keys',
  AUDIT_LOG: 'audit_log',
  COST_HISTORY: 'cost_history',
} as const;

// ── Date reviver for JSON.parse ──────────────────────────────
// When loading from localStorage, date strings need to be converted back
export function reviveDates<T>(items: T[]): T[] {
  return items.map(item => {
    const obj = item as any;
    const dateFields = ['createdAt', 'updatedAt', 'lastActiveAt', 'timestamp', 'created_at', 'last_active_at', 'reviewedAt'];
    for (const field of dateFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        obj[field] = new Date(obj[field]);
      }
    }
    return obj;
  });
}

// ── Migration / cleanup ──────────────────────────────────────
export function clearAllUserData(userId: string): void {
  if (typeof window === 'undefined') return;
  Object.values(COLLECTIONS).forEach(collection => {
    clearCollection(userId, collection);
  });
}
