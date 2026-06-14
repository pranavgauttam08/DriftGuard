import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { getDeployment, approveDeployment, rejectDeployment, rollbackDeployment } from '@/lib/deployments';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/deployments/[id] — Get deployment details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { id } = await params;
  const deployment = await getDeployment(id);

  if (!deployment) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Deployment not found' } }, { status: 404 });
  }

  return NextResponse.json({ deployment });
}

/**
 * PATCH /api/v1/deployments/[id] — Approve, reject, or rollback a deployment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, reason, orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        await requirePermission(userId, orgId, 'deployment:approve');
        await approveDeployment(id, userId);
        return NextResponse.json({ message: 'Deployment approved', status: 'approved' });

      case 'reject':
        await requirePermission(userId, orgId, 'deployment:approve');
        await rejectDeployment(id, userId, reason || 'No reason provided');
        return NextResponse.json({ message: 'Deployment rejected', status: 'rejected' });

      case 'rollback':
        await requirePermission(userId, orgId, 'deployment:create');
        await rollbackDeployment(id, userId, reason);
        return NextResponse.json({ message: 'Deployment rolled back', status: 'rolled_back' });

      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'action must be: approve, reject, or rollback' } }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Deployment action error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to perform action' } }, { status: 500 });
  }
}
