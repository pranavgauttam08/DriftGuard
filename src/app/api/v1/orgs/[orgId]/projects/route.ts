import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { getOrgProjects, createProject } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orgId: string }>;
}

/**
 * GET /api/v1/orgs/[orgId]/projects — List all projects in an organization
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    await requirePermission(userId, orgId, 'dashboard:view');
    const projects = await getOrgProjects(orgId);
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List projects error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list projects' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/orgs/[orgId]/projects — Create a new project
 * Requires: project:create permission (owner or admin)
 * Auto-creates dev/staging/prod environments.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    await requirePermission(userId, orgId, 'project:create');

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Project name is required' } }, { status: 400 });
    }

    const project = await createProject(orgId, name.trim(), slug, description);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'A project with this slug already exists in this organization' } }, { status: 409 });
    }
    console.error('Create project error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' } }, { status: 500 });
  }
}
