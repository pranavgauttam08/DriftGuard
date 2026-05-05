import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { getUserSupabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/ingest
 * Supports BOTH Clerk session auth (browser) AND API key auth (external systems).
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;

    // Try Clerk session first
    try {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) userId = clerkUserId;
    } catch {
      // Not in a Clerk session context — that's fine, try API key
    }

    // If no Clerk session, try API key from Authorization header
    if (!userId) {
      const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (apiKey && isSupabaseConfigured()) {
        const { data } = await supabaseAdmin
          .from('user_api_keys')
          .select('user_id')
          .eq('api_key', apiKey)
          .single();
        if (data) {
          userId = data.user_id;
          // Update last_used_at and increment total_requests
          await supabaseAdmin
            .from('user_api_keys')
            .update({
              last_used_at: new Date().toISOString(),
              total_requests: (data as any).total_requests ? (data as any).total_requests + 1 : 1,
            })
            .eq('api_key', apiKey);
        }
      }
    }

    // For development/demo: allow unauthenticated ingest if Supabase isn't configured
    if (!userId && isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Unauthorized. Provide a valid session or API key.' }, { status: 401 });
    }

    const body = await request.json();
    const { endpointId, version, query, response, latencyMs, tokenCount } = body;

    if (!endpointId || !version || !query || !response) {
      return NextResponse.json({ error: 'Missing required fields: endpointId, version, query, response' }, { status: 400 });
    }

    const responseId = uuidv4();

    // Store to Supabase if configured
    if (isSupabaseConfigured() && userId) {
      const { client } = getUserSupabase(userId);
      await client.from('ai_responses').insert({
        id: responseId,
        endpoint_id: endpointId,
        user_id: userId,
        version,
        query,
        response,
        latency_ms: latencyMs || 0,
        token_count: tokenCount || 0,
        timestamp: new Date().toISOString(),
      });

      // Update endpoint's last_active_at and latest_version
      await client.from('endpoints')
        .update({
          last_active_at: new Date().toISOString(),
          latest_version: version,
        })
        .eq('id', endpointId)
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      responseId,
      message: `Response ingested for ${endpointId} ${version}`,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest response' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpointId = searchParams.get('endpointId');

  if (!endpointId) {
    return NextResponse.json({ error: 'endpointId required' }, { status: 400 });
  }

  // Try authenticated query first
  let userId: string | null = null;
  try {
    const { userId: clerkUserId } = await auth();
    userId = clerkUserId;
  } catch {}

  if (userId && isSupabaseConfigured()) {
    const { client } = getUserSupabase(userId);
    const { data } = await client
      .from('ai_responses')
      .select('*')
      .eq('endpoint_id', endpointId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);
    return NextResponse.json({ responses: data || [] });
  }

  // Fallback to seed data for demo
  const { seedResponses } = await import('@/lib/seed');
  const responses = seedResponses.filter(r => r.endpointId === endpointId);
  return NextResponse.json({ responses });
}
