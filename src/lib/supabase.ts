import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Clean the URL by removing whitespaces, trailing slashes, and accidental '/rest/v1' suffixes
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .replace(/[\s\n\r]/g, '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/[\s\n\r]/g, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/[\s\n\r]/g, '');

// Check if Supabase is configured with valid URLs
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseUrl !== 'your-supabase-url'
  );
}

// Lazy-initialize clients only when Supabase is actually configured
function createSafeClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key || !url.startsWith('http')) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Client-side Supabase instance (uses anon key)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) _supabase = createSafeClient(supabaseUrl, supabaseAnonKey);
    if (!_supabase) throw new Error('Supabase is not configured');
    return (_supabase as any)[prop];
  },
});

// Server-side Supabase instance (uses service role key for full access)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) _supabaseAdmin = createSafeClient(supabaseUrl, supabaseServiceKey);
    if (!_supabaseAdmin) throw new Error('Supabase admin is not configured');
    return (_supabaseAdmin as any)[prop];
  },
});

/**
 * Get a user-scoped Supabase client that automatically filters by userId.
 * All queries through this client respect RLS via app.user_id setting.
 */
export function getUserSupabase(userId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);

  return {
    client,
    // Proxy common methods so callers can use supabase.from() directly
    from: client.from.bind(client),
    rpc: client.rpc.bind(client),
    /**
     * Execute a query with the user's RLS context set.
     */
    async query<T>(fn: (client: SupabaseClient) => Promise<T>): Promise<T> {
      try {
        await client.rpc('set_config', {
          setting: 'app.user_id',
          value: userId,
          is_local: true,
        });
      } catch {
        // RLS function may not exist yet — proceed with manual filtering
      }
      return fn(client);
    },
    userId,
  };
}

/**
 * Get a tenant-scoped Supabase client that sets both user_id and org_id for RLS.
 * Used by v1 API routes that are multi-tenant aware.
 */
export function getTenantSupabase(userId: string, orgId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);

  return {
    client,
    // Proxy common methods so callers can use supabase.from() directly
    from: client.from.bind(client),
    rpc: client.rpc.bind(client),
    /**
     * Execute a query with both user and org RLS context set.
     */
    async query<T>(fn: (client: SupabaseClient) => Promise<T>): Promise<T> {
      try {
        // Set both user and org context for RLS policies
        await client.rpc('set_config', {
          setting: 'app.user_id',
          value: userId,
          is_local: true,
        });
        await client.rpc('set_config', {
          setting: 'app.org_id',
          value: orgId,
          is_local: true,
        });
      } catch {
        // RLS functions may not exist yet — proceed with manual filtering
      }
      return fn(client);
    },
    userId,
    orgId,
  };
}

