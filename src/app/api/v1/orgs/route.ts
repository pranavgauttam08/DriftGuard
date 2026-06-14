import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserOrganizations, createOrganization } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/orgs — List all organizations the user belongs to
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const orgs = await getUserOrganizations(userId);
    return NextResponse.json({ organizations: orgs });
  } catch (error) {
    console.error('List orgs error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list organizations' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/orgs — Create a new organization
 * The creator automatically becomes the owner.
 * A default project with dev/staging/prod environments is created.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Organization name is required' } }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Organization name must be 100 characters or less' } }, { status: 400 });
    }

    const org = await createOrganization(userId, name.trim(), slug);
    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'An organization with this slug already exists' } }, { status: 409 });
    }
    console.error('Create org error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create organization' } }, { status: 500 });
  }
}
