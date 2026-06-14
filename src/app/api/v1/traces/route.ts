import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/traces — Query traces with filters
 * Supports: endpointId, version, sessionId, environmentId, limit, offset
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const endpointId = searchParams.get('endpointId');
  const version = searchParams.get('version');
  const sessionId = searchParams.get('sessionId');
  const environmentId = searchParams.get('environmentId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!orgId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ traces: [], total: 0 });
  }

  try {
    let query = supabaseAdmin
      .from('traces')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (endpointId) query = query.eq('endpoint_id', endpointId);
    if (version) query = query.eq('version', version);
    if (sessionId) query = query.eq('session_id', sessionId);
    if (environmentId) query = query.eq('environment_id', environmentId);

    query = query.order('timestamp', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const traces = (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      endpointId: row.endpoint_id,
      environmentId: row.environment_id,
      version: row.version,
      timestamp: row.timestamp,
      systemPrompt: row.system_prompt,
      userQuery: row.user_query,
      retrievedContext: row.retrieved_context,
      toolCalls: row.tool_calls,
      modelConfig: row.model_config,
      latencyMs: row.latency_ms,
      tokenCount: row.token_count,
      finalResponse: row.final_response,
      error: row.error,
      sessionId: row.session_id,
      endUserId: row.end_user_id,
    }));

    return NextResponse.json({ traces, total: count || 0, limit, offset });
  } catch (error) {
    console.error('List traces error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list traces' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/traces — Ingest a structured trace
 * Extension of the existing /api/ingest that captures full request context.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  // Also support API key auth
  const apiKey = request.headers.get('x-api-key');
  if (!userId && !apiKey) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      orgId, endpointId, environmentId, version,
      systemPrompt, userQuery, retrievedContext, toolCalls, modelConfig,
      latencyMs, tokenCount, finalResponse, error: traceError,
      sessionId, endUserId,
    } = body;

    // Validate required fields
    if (!orgId || !endpointId || !version || !userQuery || !finalResponse) {
      return NextResponse.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: orgId, endpointId, version, userQuery, finalResponse',
        },
      }, { status: 400 });
    }

    const traceId = uuid();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        trace: { id: traceId, endpointId, version, userQuery, finalResponse },
      }, { status: 201 });
    }

    const { data, error } = await supabaseAdmin
      .from('traces')
      .insert({
        id: traceId,
        org_id: orgId,
        endpoint_id: endpointId,
        environment_id: environmentId || null,
        version,
        system_prompt: systemPrompt || null,
        user_query: userQuery,
        retrieved_context: retrievedContext || null,
        tool_calls: toolCalls || null,
        model_config: modelConfig || null,
        latency_ms: latencyMs || 0,
        token_count: tokenCount || 0,
        final_response: finalResponse,
        error: traceError || null,
        session_id: sessionId || null,
        end_user_id: endUserId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      trace: { id: data.id, endpointId: data.endpoint_id, version: data.version },
    }, { status: 201 });
  } catch (error) {
    console.error('Ingest trace error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to ingest trace' } }, { status: 500 });
  }
}
