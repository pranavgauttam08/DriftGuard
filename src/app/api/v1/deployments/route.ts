import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { createDeployment, listDeployments } from '@/lib/deployments';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deployments — List deployments for a project
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '25');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!orgId || !projectId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId and projectId are required' } }, { status: 400 });
  }

  try {
    await requirePermission(userId, orgId, 'dashboard:view');
    const result = await listDeployments(orgId, projectId, { status: status as any, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List deployments error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list deployments' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/deployments — Create a new deployment (triggers gating pipeline)
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { orgId, projectId, endpointId, endpointName, version, targetEnvironmentId, sourceEnvironmentId } = body;

    if (!orgId || !projectId || !endpointId || !version || !targetEnvironmentId) {
      return NextResponse.json({
        error: { code: 'VALIDATION_ERROR', message: 'Required: orgId, projectId, endpointId, version, targetEnvironmentId' },
      }, { status: 400 });
    }

    await requirePermission(userId, orgId, 'deployment:create');

    const deployment = await createDeployment({
      orgId, projectId, endpointId, endpointName, version,
      targetEnvironmentId, sourceEnvironmentId,
      createdBy: userId,
    });

    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Create deployment error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create deployment' } }, { status: 500 });
  }
}
