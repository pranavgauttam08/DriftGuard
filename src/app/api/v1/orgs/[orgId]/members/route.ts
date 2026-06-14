import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, requireRole, RBACError, canModifyMemberRole } from '@/lib/rbac';
import { getUserRole } from '@/lib/tenant';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { Role } from '@/types/tenant';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ orgId: string }>;
}

/**
 * GET /api/v1/orgs/[orgId]/members — List all members of an organization
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    // Verify user is a member (any role can view members)
    await requirePermission(userId, orgId, 'dashboard:view');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        members: [{
          id: 'default-member',
          orgId,
          userId,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        }],
      });
    }

    const { data, error } = await supabaseAdmin
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .order('joined_at');

    if (error) throw error;

    const members = (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      userId: row.user_id,
      role: row.role,
      invitedBy: row.invited_by,
      joinedAt: row.joined_at,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List members error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list members' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/orgs/[orgId]/members — Invite/add a member
 * Requires: org:manage_members permission (owner or admin)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    await requirePermission(userId, orgId, 'org:manage_members');

    const body = await request.json();
    const { targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'targetUserId and role are required' } }, { status: 400 });
    }

    const validRoles: Role[] = ['owner', 'admin', 'developer', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` } }, { status: 400 });
    }

    // Check if actor can assign this role
    const actorRole = await getUserRole(userId, orgId);
    if (actorRole && !canModifyMemberRole(actorRole, 'viewer', role)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cannot assign a role at or above your own level' } }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        member: { id: uuid(), orgId, userId: targetUserId, role, joinedAt: new Date().toISOString() },
      }, { status: 201 });
    }

    const { data, error } = await supabaseAdmin
      .from('org_members')
      .insert({
        org_id: orgId,
        user_id: targetUserId,
        role,
        invited_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: { code: 'CONFLICT', message: 'User is already a member of this organization' } }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ member: { id: data.id, orgId: data.org_id, userId: data.user_id, role: data.role, joinedAt: data.joined_at } }, { status: 201 });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Add member error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add member' } }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/orgs/[orgId]/members — Update a member's role
 * Requires: org:manage_members permission
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    const actorRole = await requirePermission(userId, orgId, 'org:manage_members');

    const body = await request.json();
    const { memberId, newRole } = body;

    if (!memberId || !newRole) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'memberId and newRole are required' } }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    // Get target member's current role
    const { data: targetMember } = await supabaseAdmin
      .from('org_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Member not found' } }, { status: 404 });
    }

    if (!canModifyMemberRole(actorRole, targetMember.role as Role, newRole)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cannot modify this member\'s role' } }, { status: 403 });
    }

    await supabaseAdmin
      .from('org_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Update member error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' } }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/orgs/[orgId]/members — Remove a member
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { orgId } = await params;

  try {
    await requirePermission(userId, orgId, 'org:manage_members');

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'memberId is required' } }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    // Prevent removing the last owner
    const { data: member } = await supabaseAdmin
      .from('org_members')
      .select('role')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .single();

    if (member?.role === 'owner') {
      const { count } = await supabaseAdmin
        .from('org_members')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('role', 'owner');

      if ((count || 0) <= 1) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cannot remove the last owner' } }, { status: 403 });
      }
    }

    await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('id', memberId)
      .eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Remove member error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' } }, { status: 500 });
  }
}
