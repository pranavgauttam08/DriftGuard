import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';

// GET — get or auto-create user profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();

  if (!isSupabaseConfigured()) {
    // Return a synthetic profile when Supabase isn't configured
    return NextResponse.json({
      profile: {
        id: uuid(),
        userId,
        email: user?.emailAddresses?.[0]?.emailAddress || '',
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
        totalEndpoints: 0,
        totalResponsesIngested: 0,
        plan: 'free',
      },
      apiKey: {
        id: uuid(),
        userId,
        apiKey: `dg_live_${uuid().replace(/-/g, '').slice(0, 32)}`,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        totalRequests: 0,
      },
    });
  }

  const { client } = getUserSupabase(userId);

  // Get or create profile
  let { data: profile } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    const newProfile = {
      id: uuid(),
      user_id: userId,
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      full_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
      created_at: new Date().toISOString(),
      onboarding_completed: false,
      total_endpoints: 0,
      total_responses_ingested: 0,
      plan: 'free',
    };
    const { data } = await client.from('user_profiles').insert(newProfile).select().single();
    profile = data;
  }

  // Get or create API key
  let { data: apiKey } = await client
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!apiKey) {
    const newKey = {
      id: uuid(),
      user_id: userId,
      api_key: `dg_live_${uuid().replace(/-/g, '').slice(0, 32)}`,
      created_at: new Date().toISOString(),
      last_used_at: null,
      total_requests: 0,
    };
    const { data } = await client.from('user_api_keys').insert(newKey).select().single();
    apiKey = data;
  }

  return NextResponse.json({ profile, apiKey });
}

// PATCH — update profile or regenerate API key
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const { client } = getUserSupabase(userId);

  if (body.action === 'regenerate_key') {
    const newKey = `dg_live_${uuid().replace(/-/g, '').slice(0, 32)}`;
    await client.from('user_api_keys')
      .update({ api_key: newKey, last_used_at: null, total_requests: 0 })
      .eq('user_id', userId);
    return NextResponse.json({ apiKey: newKey });
  }

  if (body.action === 'complete_onboarding') {
    await client.from('user_profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', userId);
    return NextResponse.json({ success: true });
  }

  if (body.fullName) {
    await client.from('user_profiles')
      .update({ full_name: body.fullName })
      .eq('user_id', userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'No action specified' }, { status: 400 });
}
