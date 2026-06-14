'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Organization, Project, Environment, EnvironmentName, Role } from '@/types/tenant';

// ============================================================
// Tenant Context — resolves and provides org/project/env state
// ============================================================

interface TenantState {
  // Current selections
  org: Organization | null;
  project: Project | null;
  environment: Environment | null;

  // Available options
  organizations: Organization[];
  projects: Project[];
  environments: Environment[];

  // User's role in current org
  role: Role;

  // Loading state
  isLoading: boolean;

  // Actions
  switchOrg: (orgId: string) => void;
  switchProject: (projectId: string) => void;
  switchEnvironment: (envName: EnvironmentName) => void;
  refreshOrgs: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const TenantContext = createContext<TenantState>({
  org: null,
  project: null,
  environment: null,
  organizations: [],
  projects: [],
  environments: [],
  role: 'viewer',
  isLoading: true,
  switchOrg: () => {},
  switchProject: () => {},
  switchEnvironment: () => {},
  refreshOrgs: async () => {},
  refreshProjects: async () => {},
});

export function useTenant() {
  return useContext(TenantContext);
}

// ── Local Storage Keys ───────────────────────────────────────
const LS_ORG = 'dg_active_org';
const LS_PROJECT = 'dg_active_project';
const LS_ENV = 'dg_active_env';

// ── Provider Component ───────────────────────────────────────
export function TenantProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [role, setRole] = useState<Role>('viewer');
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch Organizations ────────────────────────────────────
  const refreshOrgs = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/orgs');
      const data = await res.json();
      const orgs: Organization[] = (data.organizations || []).map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      }));
      setOrganizations(orgs);

      // Restore saved org or pick first
      const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem(LS_ORG) : null;
      const activeOrg = orgs.find(o => o.id === savedOrgId) || orgs[0] || null;
      setOrg(activeOrg);

      return activeOrg;
    } catch {
      // Fallback for demo mode
      const defaultOrg: Organization = {
        id: 'default-org', name: 'My Organization', slug: 'my-org',
        plan: 'free', createdAt: new Date(), updatedAt: new Date(),
      };
      setOrganizations([defaultOrg]);
      setOrg(defaultOrg);
      return defaultOrg;
    }
  }, []);

  // ── Fetch Projects ─────────────────────────────────────────
  const refreshProjects = useCallback(async (orgId?: string) => {
    const targetOrgId = orgId || org?.id;
    if (!targetOrgId) return;

    try {
      const res = await fetch(`/api/v1/orgs/${targetOrgId}/projects`);
      const data = await res.json();
      const projs: Project[] = (data.projects || []).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
      setProjects(projs);

      // Restore saved project or pick first
      const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem(LS_PROJECT) : null;
      const activeProject = projs.find(p => p.id === savedProjectId) || projs[0] || null;
      setProject(activeProject);

      return activeProject;
    } catch {
      const defaultProject: Project = {
        id: 'default-project', orgId: targetOrgId, name: 'Default Project',
        slug: 'default', description: '', createdAt: new Date(),
      };
      setProjects([defaultProject]);
      setProject(defaultProject);
      return defaultProject;
    }
  }, [org?.id]);

  // ── Fetch Environments ─────────────────────────────────────
  const fetchEnvironments = useCallback(async (orgId: string, projectId: string) => {
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/projects/${projectId}/environments`);
      const data = await res.json();
      const envs: Environment[] = (data.environments || []).map((e: any) => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }));
      setEnvironments(envs);

      // Restore saved env or default to development
      const savedEnv = typeof window !== 'undefined' ? localStorage.getItem(LS_ENV) : null;
      const activeEnv = envs.find(e => e.name === savedEnv) || envs.find(e => e.name === 'development') || envs[0] || null;
      setEnvironment(activeEnv);
    } catch {
      const defaultEnvs: Environment[] = [
        { id: 'env-dev', projectId, name: 'development', isProduction: false, requireApproval: false, createdAt: new Date() },
        { id: 'env-stg', projectId, name: 'staging', isProduction: false, requireApproval: true, createdAt: new Date() },
        { id: 'env-prd', projectId, name: 'production', isProduction: true, requireApproval: true, createdAt: new Date() },
      ];
      setEnvironments(defaultEnvs);
      setEnvironment(defaultEnvs[0]);
    }
  }, []);

  // ── Initial Load ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const activeOrg = await refreshOrgs();
      if (activeOrg) {
        const activeProject: any = await refreshProjects(activeOrg.id);
        if (activeProject) {
          await fetchEnvironments(activeOrg.id, activeProject.id);
        }
      }
      setRole('owner'); // Will be fetched from API in production
      setIsLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switchers ──────────────────────────────────────────────
  const switchOrg = useCallback(async (orgId: string) => {
    const selected = organizations.find(o => o.id === orgId);
    if (!selected) return;
    setOrg(selected);
    localStorage.setItem(LS_ORG, orgId);
    // Reload projects + environments for new org
    await refreshProjects(orgId);
  }, [organizations, refreshProjects]);

  const switchProject = useCallback(async (projectId: string) => {
    const selected = projects.find(p => p.id === projectId);
    if (!selected || !org) return;
    setProject(selected);
    localStorage.setItem(LS_PROJECT, projectId);
    // Reload environments for new project
    await fetchEnvironments(org.id, projectId);
  }, [projects, org, fetchEnvironments]);

  const switchEnvironment = useCallback((envName: EnvironmentName) => {
    const selected = environments.find(e => e.name === envName);
    if (!selected) return;
    setEnvironment(selected);
    localStorage.setItem(LS_ENV, envName);
  }, [environments]);

  return (
    <TenantContext.Provider value={{
      org, project, environment,
      organizations, projects, environments,
      role, isLoading,
      switchOrg, switchProject, switchEnvironment,
      refreshOrgs, refreshProjects,
    }}>
      {children}
    </TenantContext.Provider>
  );
}
