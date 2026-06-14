// ============================================================
// DriftGuard Enterprise — Tenant & RBAC Types
// ============================================================

// ── Roles ────────────────────────────────────────────────────
export type Role = 'owner' | 'admin' | 'developer' | 'reviewer' | 'viewer';

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 50,
  admin: 40,
  developer: 30,
  reviewer: 20,
  viewer: 10,
};

// ── Organizations ────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationInput {
  name: string;
  slug?: string; // auto-generated from name if not provided
}

// ── Organization Members ─────────────────────────────────────
export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: Role;
  invitedBy?: string;
  joinedAt: Date;
  // Populated from Clerk
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface InviteMemberInput {
  email: string;
  role: Role;
}

// ── Projects ─────────────────────────────────────────────────
export interface Project {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string;
}

// ── Environments ─────────────────────────────────────────────
export type EnvironmentName = 'development' | 'staging' | 'production';

export interface Environment {
  id: string;
  projectId: string;
  name: EnvironmentName;
  isProduction: boolean;
  requireApproval: boolean; // deployment gating
  createdAt: Date;
}

// ── Tenant Context (resolved at request time) ────────────────
export interface TenantContext {
  userId: string;
  org: Organization;
  role: Role;
  project?: Project;
  environment?: Environment;
}

// ── Permissions ──────────────────────────────────────────────
export type Permission =
  | 'org:manage_members'
  | 'org:manage_settings'
  | 'project:create'
  | 'project:delete'
  | 'project:manage_settings'
  | 'endpoint:create'
  | 'endpoint:delete'
  | 'endpoint:update'
  | 'data:ingest'
  | 'fingerprint:create'
  | 'diff:create'
  | 'probe:run'
  | 'deployment:create'
  | 'deployment:approve'
  | 'deployment:reject'
  | 'deployment:rollback'
  | 'review:create'
  | 'review:approve'
  | 'review:reject'
  | 'alert:configure'
  | 'alert:acknowledge'
  | 'dataset:create'
  | 'dataset:delete'
  | 'settings:api_keys'
  | 'settings:security'
  | 'audit:view'
  | 'dashboard:view';

// ── Permission Matrix ────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'org:manage_members', 'org:manage_settings',
    'project:create', 'project:delete', 'project:manage_settings',
    'endpoint:create', 'endpoint:delete', 'endpoint:update',
    'data:ingest',
    'fingerprint:create', 'diff:create', 'probe:run',
    'deployment:create', 'deployment:approve', 'deployment:reject', 'deployment:rollback',
    'review:create', 'review:approve', 'review:reject',
    'alert:configure', 'alert:acknowledge',
    'dataset:create', 'dataset:delete',
    'settings:api_keys', 'settings:security',
    'audit:view', 'dashboard:view',
  ],
  admin: [
    'org:manage_members', 'org:manage_settings',
    'project:create', 'project:delete', 'project:manage_settings',
    'endpoint:create', 'endpoint:delete', 'endpoint:update',
    'data:ingest',
    'fingerprint:create', 'diff:create', 'probe:run',
    'deployment:create', 'deployment:approve', 'deployment:reject', 'deployment:rollback',
    'review:create', 'review:approve', 'review:reject',
    'alert:configure', 'alert:acknowledge',
    'dataset:create', 'dataset:delete',
    'settings:api_keys', 'settings:security',
    'audit:view', 'dashboard:view',
  ],
  developer: [
    'endpoint:create', 'endpoint:delete', 'endpoint:update',
    'data:ingest',
    'fingerprint:create', 'diff:create', 'probe:run',
    'deployment:create',
    'review:create',
    'alert:acknowledge',
    'dataset:create', 'dataset:delete',
    'dashboard:view',
  ],
  reviewer: [
    'fingerprint:create', 'diff:create', 'probe:run',
    'deployment:approve', 'deployment:reject',
    'review:create', 'review:approve', 'review:reject',
    'alert:acknowledge',
    'dashboard:view',
  ],
  viewer: [
    'dashboard:view',
  ],
};

// ── Database Row Types (snake_case for Supabase) ─────────────
export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMemberRow {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  joined_at: string;
}

export interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface EnvironmentRow {
  id: string;
  project_id: string;
  name: string;
  is_production: boolean;
  require_approval: boolean;
  created_at: string;
}
