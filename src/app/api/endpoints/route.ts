import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';

// GET — list all endpoints for the authenticated user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    // Return empty array when Supabase isn't configured
    return NextResponse.json({ endpoints: [] });
  }

  const { client } = getUserSupabase(userId);
  const { data, error } = await client
    .from('endpoints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ endpoints: data || [] });
}

// POST — create a new endpoint
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Endpoint name is required' }, { status: 400 });
  }

  const endpoint = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    user_id: userId,
    name: name.trim(),
    description: description?.trim() || '',
    created_at: new Date().toISOString(),
    latest_version: 'v1.0.0',
    total_responses: 0,
    status: 'healthy',
    last_active_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    // Return the endpoint directly without DB
    return NextResponse.json({
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        description: endpoint.description,
        createdAt: endpoint.created_at,
        latestVersion: endpoint.latest_version,
        totalResponses: 0,
        status: 'healthy',
        lastActiveAt: endpoint.last_active_at,
      },
    });
  }

  const { client } = getUserSupabase(userId);
  const { data, error } = await client.from('endpoints').insert(endpoint).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An endpoint with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ endpoint: data });
}

// DELETE — delete an endpoint and all associated data
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const endpointId = searchParams.get('id');
  if (!endpointId) return NextResponse.json({ error: 'Endpoint ID required' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const { client } = getUserSupabase(userId);

  // Delete cascading data
  await client.from('alerts').delete().eq('endpoint_id', endpointId).eq('user_id', userId);
  await client.from('probe_results').delete().eq('endpoint_id', endpointId).eq('user_id', userId);
  await client.from('behavioral_diffs').delete().eq('endpoint_id', endpointId).eq('user_id', userId);
  await client.from('behavioral_fingerprints').delete().eq('endpoint_id', endpointId).eq('user_id', userId);
  await client.from('ai_responses').delete().eq('endpoint_id', endpointId).eq('user_id', userId);
  await client.from('endpoints').delete().eq('id', endpointId).eq('user_id', userId);

  return NextResponse.json({ success: true });
}
