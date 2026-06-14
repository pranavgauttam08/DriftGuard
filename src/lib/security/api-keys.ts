import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { getTenantSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeAuditLog } from './audit';

// ============================================================
// Scoped API Key Management v2
// Create, validate, rotate, and revoke API keys with scopes
// ============================================================

export type APIKeyScope = 'ingest' | 'read' | 'evaluate' | 'deploy' | 'admin';

export interface APIKey {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  keyPrefix: string;     // e.g., "dg_live_abc..."
  scopes: APIKeyScope[];
  environmentId?: string;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastRotatedAt?: Date;
  totalRequests: number;
  createdAt: Date;
  revoked: boolean;
}

export interface CreateKeyResult {
  key: APIKey;
  /** The full API key — shown ONCE at creation, never stored in plain text */
  plainTextKey: string;
}

/**
 * Generate a new scoped API key.
 */
export async function createAPIKey(
  orgId: string,
  userId: string,
  name: string,
  scopes: APIKeyScope[],
  options: { environmentId?: string; expiresInDays?: number } = {}
): Promise<CreateKeyResult> {
  const keyId = uuidv4();
  const rawKey = generateRawKey();
  const keyPrefix = `dg_live_${rawKey.slice(0, 8)}`;
  const keyHash = hashKey(rawKey);

  const key: APIKey = {
    id: keyId,
    orgId,
    userId,
    name,
    keyPrefix,
    scopes,
    environmentId: options.environmentId,
    expiresAt: options.expiresInDays ? new Date(Date.now() + options.expiresInDays * 86400000) : undefined,
    totalRequests: 0,
    createdAt: new Date(),
    revoked: false,
  };

  if (isSupabaseConfigured()) {
    const supabase = getTenantSupabase(userId, orgId);
    await supabase.from('api_keys_v2').insert({
      id: keyId,
      org_id: orgId,
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes,
      environment_id: options.environmentId || null,
      expires_at: key.expiresAt?.toISOString() || null,
      created_at: key.createdAt.toISOString(),
      revoked: false,
      total_requests: 0,
    });
  }

  await writeAuditLog({
    orgId, userId,
    action: 'api_key.created',
    resourceType: 'api_key',
    resourceId: keyId,
    details: { name, scopes, prefix: keyPrefix },
  });

  return {
    key,
    plainTextKey: `dg_live_${rawKey}`,
  };
}

/**
 * Validate an API key and check scopes.
 */
export async function validateAPIKey(
  plainTextKey: string,
  requiredScope?: APIKeyScope
): Promise<{ valid: boolean; key?: APIKey; error?: string }> {
  if (!plainTextKey.startsWith('dg_live_')) {
    return { valid: false, error: 'Invalid key format' };
  }

  const rawKey = plainTextKey.replace('dg_live_', '');
  const keyHash = hashKey(rawKey);

  if (!isSupabaseConfigured()) {
    return { valid: true, key: getDemoKey() };
  }

  const supabase = getTenantSupabase('system', '');
  const { data } = await supabase
    .from('api_keys_v2')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('revoked', false)
    .single();

  if (!data) {
    return { valid: false, error: 'API key not found or revoked' };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Check scope
  if (requiredScope && !data.scopes.includes(requiredScope)) {
    return { valid: false, error: `Missing required scope: ${requiredScope}` };
  }

  // Update last used
  await supabase.from('api_keys_v2').update({
    last_used_at: new Date().toISOString(),
    total_requests: (data.total_requests || 0) + 1,
  }).eq('id', data.id);

  return {
    valid: true,
    key: rowToAPIKey(data),
  };
}

/**
 * Rotate an API key — generates new key, invalidates old.
 */
export async function rotateAPIKey(keyId: string, userId: string, orgId: string): Promise<CreateKeyResult> {
  // Get existing key
  const existing = await getAPIKey(keyId, orgId);
  if (!existing) throw new Error('API key not found');

  // Revoke old key
  await revokeAPIKey(keyId, userId, orgId);

  // Create new key with same config
  const result = await createAPIKey(orgId, userId, existing.name, existing.scopes, {
    environmentId: existing.environmentId,
  });

  await writeAuditLog({
    orgId, userId,
    action: 'api_key.rotated',
    resourceType: 'api_key',
    resourceId: keyId,
    details: { oldPrefix: existing.keyPrefix, newPrefix: result.key.keyPrefix },
  });

  return result;
}

/**
 * Revoke an API key.
 */
export async function revokeAPIKey(keyId: string, userId: string, orgId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getTenantSupabase(userId, orgId);
    await supabase.from('api_keys_v2').update({ revoked: true }).eq('id', keyId);
  }

  await writeAuditLog({
    orgId, userId,
    action: 'api_key.revoked',
    resourceType: 'api_key',
    resourceId: keyId,
    details: {},
  });
}

/**
 * List API keys for an org (without hashes).
 */
export async function listAPIKeys(orgId: string): Promise<APIKey[]> {
  if (!isSupabaseConfigured()) {
    return [getDemoKey()];
  }

  const supabase = getTenantSupabase('system', orgId);
  const { data } = await supabase
    .from('api_keys_v2')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  return (data || []).map(rowToAPIKey);
}

/**
 * Get a single API key.
 */
async function getAPIKey(keyId: string, orgId: string): Promise<APIKey | null> {
  if (!isSupabaseConfigured()) return getDemoKey();

  const supabase = getTenantSupabase('system', orgId);
  const { data } = await supabase.from('api_keys_v2').select('*').eq('id', keyId).single();
  return data ? rowToAPIKey(data) : null;
}

// ── Crypto helpers ───────────────────────────────────────

function generateRawKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function rowToAPIKey(row: any): APIKey {
  return {
    id: row.id, orgId: row.org_id, userId: row.user_id, name: row.name,
    keyPrefix: row.key_prefix, scopes: row.scopes,
    environmentId: row.environment_id || undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    lastRotatedAt: row.last_rotated_at ? new Date(row.last_rotated_at) : undefined,
    totalRequests: row.total_requests || 0,
    createdAt: new Date(row.created_at), revoked: row.revoked,
  };
}

function getDemoKey(): APIKey {
  return {
    id: 'key-demo', orgId: 'org-demo', userId: 'demo', name: 'Demo Key',
    keyPrefix: 'dg_live_demo1234', scopes: ['ingest', 'read'],
    totalRequests: 142, createdAt: new Date(), revoked: false,
  };
}
