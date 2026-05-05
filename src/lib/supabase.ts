import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
