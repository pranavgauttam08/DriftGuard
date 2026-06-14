import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { getProjectEnvironments } from '@/lib/tenant';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orgId: string; projectId: string }>;
}

/**
 * GET /api/v1/orgs/[orgId]/projects/[projectId]/environments
 * List all environments for a project.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId, projectId } = await params;

  try {
    await requirePermission(userId, orgId, 'dashboard:view');
    const environments = await getProjectEnvironments(projectId);
    return NextResponse.json({ environments });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List environments error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list environments' } }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/orgs/[orgId]/projects/[projectId]/environments
 * Update environment settings (e.g., toggle require_approval).
 * Requires: project:manage_settings permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    await requirePermission(userId, orgId, 'project:manage_settings');

    const body = await request.json();
    const { environmentId, requireApproval } = body;

    if (!environmentId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'environmentId is required' } }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    await supabaseAdmin
      .from('environments')
      .update({ require_approval: requireApproval })
      .eq('id', environmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Update environment error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update environment' } }, { status: 500 });
  }
}
