import { Organization, OrgMember, Project, Environment, TenantContext, Role, ROLE_HIERARCHY } from '@/types/tenant';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';
import { v4 as uuid } from 'uuid';

// ============================================================
// Tenant Resolution — resolves userId → org → project → env
// ============================================================

/**
 * Get all organizations a user belongs to.
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  if (!isSupabaseConfigured()) {
    return [getDefaultOrg(userId)];
  }

  const { data, error } = await supabaseAdmin
    .from('org_members')
    .select('org_id, organizations(*)')
    .eq('user_id', userId);

  if (error || !data?.length) {
    return [getDefaultOrg(userId)];
  }

  return data.map((row: any) => mapOrgRow(row.organizations));
}

/**
 * Get a specific organization by ID, verifying user membership.
 */
export async function getOrganization(userId: string, orgId: string): Promise<Organization | null> {
  if (!isSupabaseConfigured()) {
    return getDefaultOrg(userId);
  }

  const { data: member } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  if (!member) return null;

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  return org ? mapOrgRow(org) : null;
}

/**
 * Get the user's role in a specific organization.
 */
export async function getUserRole(userId: string, orgId: string): Promise<Role | null> {
  if (!isSupabaseConfigured()) {
    return 'owner'; // Default role in demo mode
  }

  const { data } = await supabaseAdmin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  return data ? (data.role as Role) : null;
}

/**
 * Get all projects in an organization.
 */
export async function getOrgProjects(orgId: string): Promise<Project[]> {
  if (!isSupabaseConfigured()) {
    return [getDefaultProject(orgId)];
  }

  const { data } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  return (data || []).map(mapProjectRow);
}

/**
 * Get all environments for a project.
 */
export async function getProjectEnvironments(projectId: string): Promise<Environment[]> {
  if (!isSupabaseConfigured()) {
    return getDefaultEnvironments(projectId);
  }

  const { data } = await supabaseAdmin
    .from('environments')
    .select('*')
    .eq('project_id', projectId)
    .order('name');

  return (data || []).map(mapEnvRow);
}

/**
 * Resolve full tenant context for a request.
 * Used by API routes to scope all queries.
 */
export async function resolveTenantContext(
  userId: string,
  orgId?: string,
  projectId?: string,
  environmentId?: string
): Promise<TenantContext | null> {
  // Get user's orgs
  const orgs = await getUserOrganizations(userId);
  if (orgs.length === 0) return null;

  // Select the specified org, or default to first
  const org = orgId ? orgs.find(o => o.id === orgId) || orgs[0] : orgs[0];
  const role = await getUserRole(userId, org.id);
  if (!role) return null;

  // Resolve project if specified
  let project: Project | undefined;
  if (projectId) {
    const projects = await getOrgProjects(org.id);
    project = projects.find(p => p.id === projectId);
  }

  // Resolve environment if specified
  let environment: Environment | undefined;
  if (environmentId && project) {
    const envs = await getProjectEnvironments(project.id);
    environment = envs.find(e => e.id === environmentId);
  }

  return { userId, org, role, project, environment };
}

// ============================================================
// Organization CRUD
// ============================================================

/**
 * Create a new organization and set the creator as owner.
 */
export async function createOrganization(userId: string, name: string, slug?: string): Promise<Organization> {
  const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const orgId = uuid();

  if (!isSupabaseConfigured()) {
    return {
      id: orgId, name, slug: orgSlug, plan: 'free',
      createdAt: new Date(), updatedAt: new Date(),
    };
  }

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .insert({ id: orgId, name, slug: orgSlug })
    .select()
    .single();

  if (error) throw new Error(`Failed to create org: ${error.message}`);

  // Add creator as owner
  await supabaseAdmin
    .from('org_members')
    .insert({ org_id: orgId, user_id: userId, role: 'owner' });

  // Create default project
  const projectId = uuid();
  await supabaseAdmin
    .from('projects')
    .insert({ id: projectId, org_id: orgId, name: 'Default Project', slug: 'default', description: 'Your first project' });

  // Create default environments
  await supabaseAdmin
    .from('environments')
    .insert([
      { project_id: projectId, name: 'development', is_production: false, require_approval: false },
      { project_id: projectId, name: 'staging', is_production: false, require_approval: true },
      { project_id: projectId, name: 'production', is_production: true, require_approval: true },
    ]);

  return mapOrgRow(org);
}

/**
 * Create a new project within an organization.
 */
export async function createProject(orgId: string, name: string, slug?: string, description?: string): Promise<Project> {
  const projectSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const projectId = uuid();

  if (!isSupabaseConfigured()) {
    return {
      id: projectId, orgId, name, slug: projectSlug,
      description: description || '', createdAt: new Date(),
    };
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ id: projectId, org_id: orgId, name, slug: projectSlug, description: description || '' })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);

  // Create default environments for the new project
  await supabaseAdmin
    .from('environments')
    .insert([
      { project_id: projectId, name: 'development', is_production: false, require_approval: false },
      { project_id: projectId, name: 'staging', is_production: false, require_approval: true },
      { project_id: projectId, name: 'production', is_production: true, require_approval: true },
    ]);

  return mapProjectRow(data);
}

// ============================================================
// Default data for demo/seed mode (no Supabase)
// ============================================================

function getDefaultOrg(userId: string): Organization {
  return {
    id: 'default-org',
    name: 'My Organization',
    slug: 'my-org',
    plan: 'free',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };
}

function getDefaultProject(orgId: string): Project {
  return {
    id: 'default-project',
    orgId,
    name: 'Default Project',
    slug: 'default',
    description: 'Your first project',
    createdAt: new Date('2025-01-01'),
  };
}

function getDefaultEnvironments(projectId: string): Environment[] {
  return [
    { id: 'env-dev', projectId, name: 'development', isProduction: false, requireApproval: false, createdAt: new Date('2025-01-01') },
    { id: 'env-stg', projectId, name: 'staging', isProduction: false, requireApproval: true, createdAt: new Date('2025-01-01') },
    { id: 'env-prd', projectId, name: 'production', isProduction: true, requireApproval: true, createdAt: new Date('2025-01-01') },
  ];
}

// ============================================================
// Row Mappers (snake_case DB → camelCase TS)
// ============================================================

function mapOrgRow(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    plan: row.plan,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    createdAt: new Date(row.created_at),
  };
}

function mapEnvRow(row: any): Environment {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    isProduction: row.is_production,
    requireApproval: row.require_approval,
    createdAt: new Date(row.created_at),
  };
}
