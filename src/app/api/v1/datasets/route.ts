import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { createDataset, listDatasets, importDataset, exportDataset } from '@/lib/datasets';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/datasets — List datasets for an organization
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const projectId = searchParams.get('projectId') || undefined;

  if (!orgId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
  }

  try {
    await requirePermission(userId, orgId, 'dashboard:view');
    const datasets = await listDatasets(orgId, projectId);
    return NextResponse.json({ datasets });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List datasets error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list datasets' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/datasets — Create a new dataset or import one
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { orgId, name, description, projectId, tags, isPublic, importData, format } = body;

    if (!orgId || !name) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId and name are required' } }, { status: 400 });
    }

    await requirePermission(userId, orgId, 'dataset:create');

    // If import data is provided, import it
    if (importData && format) {
      const result = await importDataset(orgId, name, format, importData, userId, {
        projectId, tags,
      });
      return NextResponse.json({
        dataset: result.dataset,
        entriesImported: result.entriesImported,
      }, { status: 201 });
    }

    // Otherwise, create an empty dataset
    const dataset = await createDataset(orgId, name, description || '', userId, {
      projectId, tags, isPublic,
    });

    return NextResponse.json({ dataset }, { status: 201 });
  } catch (error: any) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Create dataset error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create dataset' } }, { status: 500 });
  }
}
