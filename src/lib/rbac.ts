import { Role, Permission, ROLE_PERMISSIONS, ROLE_HIERARCHY, TenantContext } from '@/types/tenant';
import { getUserRole } from './tenant';

// ============================================================
// RBAC — Role-Based Access Control
// ============================================================

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role meets a minimum role level.
 * e.g., requireMinRole('developer', 'viewer') → true
 */
export function meetsMinRole(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

/**
 * Enforce a permission check — throws if not allowed.
 * Used in API routes.
 */
export async function requirePermission(
  userId: string,
  orgId: string,
  permission: Permission
): Promise<Role> {
  const role = await getUserRole(userId, orgId);
  if (!role) {
    throw new RBACError('Not a member of this organization', 403);
  }

  if (!hasPermission(role, permission)) {
    throw new RBACError(
      `Role "${role}" does not have permission "${permission}"`,
      403
    );
  }

  return role;
}

/**
 * Enforce a minimum role — throws if insufficient.
 * Simpler than permission-based checks for basic operations.
 */
export async function requireRole(
  userId: string,
  orgId: string,
  minRole: Role
): Promise<Role> {
  const role = await getUserRole(userId, orgId);
  if (!role) {
    throw new RBACError('Not a member of this organization', 403);
  }

  if (!meetsMinRole(role, minRole)) {
    throw new RBACError(
      `Role "${role}" is insufficient. Minimum role required: "${minRole}"`,
      403
    );
  }

  return role;
}

/**
 * Validate tenant context has required permission.
 * Used when context is already resolved.
 */
export function validateContextPermission(ctx: TenantContext, permission: Permission): void {
  if (!hasPermission(ctx.role, permission)) {
    throw new RBACError(
      `Role "${ctx.role}" does not have permission "${permission}"`,
      403
    );
  }
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Get all available roles (ordered by hierarchy, highest first).
 */
export function getAvailableRoles(): { role: Role; level: number; label: string }[] {
  return [
    { role: 'owner', level: 50, label: 'Owner — Full control over the organization' },
    { role: 'admin', level: 40, label: 'Admin — Manage members, projects, and all settings' },
    { role: 'developer', level: 30, label: 'Developer — Create endpoints, ingest data, run diffs' },
    { role: 'reviewer', level: 20, label: 'Reviewer — Review and approve deployments' },
    { role: 'viewer', level: 10, label: 'Viewer — View dashboards only' },
  ];
}

/**
 * Check if a user can modify another user's role.
 * Owner can modify anyone. Admin can modify developer/reviewer/viewer.
 * Nobody can modify the last owner.
 */
export function canModifyMemberRole(
  actorRole: Role,
  targetRole: Role,
  newRole?: Role
): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') {
    // Admins can only modify users below their level
    if (ROLE_HIERARCHY[targetRole] >= ROLE_HIERARCHY.admin) return false;
    // Admins cannot promote anyone to admin or owner
    if (newRole && ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY.admin) return false;
    return true;
  }
  return false;
}

// ============================================================
// Error class for RBAC violations
// ============================================================

export class RBACError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'RBACError';
    this.statusCode = statusCode;
  }
}
