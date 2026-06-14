import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orgId: string; projectId: string }>;
}

/**
 * GET /api/v1/orgs/[orgId]/projects/[projectId]/endpoints
 * List all endpoints in a project, optionally filtered by environment.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId, projectId } = await params;
  const { searchParams } = new URL(request.url);
  const environmentId = searchParams.get('environmentId');

  try {
    await requirePermission(userId, orgId, 'dashboard:view');

    if (!isSupabaseConfigured()) {
      // Return seed data (backward compatible)
      return NextResponse.json({ endpoints: [], total: 0 });
    }

    let query = supabaseAdmin
      .from('endpoints')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('project_id', projectId);

    if (environmentId) {
      query = query.eq('environment_id', environmentId);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    const endpoints = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      latestVersion: row.latest_version,
      totalResponses: row.total_responses,
      status: row.status,
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
      orgId: row.org_id,
      projectId: row.project_id,
      environmentId: row.environment_id,
    }));

    return NextResponse.json({
      endpoints,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List endpoints error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list endpoints' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/orgs/[orgId]/projects/[projectId]/endpoints
 * Create a new endpoint scoped to a project + environment.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId, projectId } = await params;

  try {
    await requirePermission(userId, orgId, 'endpoint:create');

    const body = await request.json();
    const { name, description, environmentId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Endpoint name is required' } }, { status: 400 });
    }

    const endpointId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + uuid().slice(0, 8);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        endpoint: {
          id: endpointId,
          name: name.trim(),
          description: description || '',
          latestVersion: 'v1.0.0',
          totalResponses: 0,
          status: 'healthy',
          orgId,
          projectId,
          environmentId: environmentId || 'env-dev',
        },
      }, { status: 201 });
    }

    const { data, error } = await supabaseAdmin
      .from('endpoints')
      .insert({
        id: endpointId,
        name: name.trim(),
        description: description || '',
        latest_version: 'v1.0.0',
        total_responses: 0,
        status: 'healthy',
        user_id: userId,
        org_id: orgId,
        project_id: projectId,
        environment_id: environmentId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      endpoint: {
        id: data.id,
        name: data.name,
        description: data.description,
        latestVersion: data.latest_version,
        totalResponses: data.total_responses,
        status: data.status,
        orgId: data.org_id,
        projectId: data.project_id,
        environmentId: data.environment_id,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Create endpoint error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create endpoint' } }, { status: 500 });
  }
}
