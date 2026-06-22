'use client';
// ============================================================
// hooks/useControls.ts — TanStack Query hooks for Supabase controls
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  calculateDomainScore,
  calculateOverallScore,
  getScoreGrade,
  ControlRow,
  ComplianceReport,
  DomainScore,
} from '@/lib/scoring';

// ── Types matching the Supabase controls table ────────────────
export type ControlStatus = 'PASS' | 'WARN' | 'FAIL' | 'NOT_ASSESSED';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface SupabaseControl {
  id: string;
  org_id: string;
  domain_code: string;
  control_id: string;
  control_name: string;
  description: string | null;
  frameworks: string[];
  risk_level: RiskLevel;
  status: ControlStatus;
  owner_name: string | null;
  last_assessed_at: string | null;
  evidence_url: string | null;
  evidence_filename: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Domain codes for all 12 domains ──────────────────────────
export const DOMAIN_CODES = ['GL', 'RM', 'RO', 'LC', 'SE', 'PR', 'RS', 'AA', 'OM', 'IM', 'TP', 'CO'] as const;
export type DomainCode = typeof DOMAIN_CODES[number];

// ── useControls ───────────────────────────────────────────────
/**
 * Fetch controls for an org. Optionally filtered by domainCode.
 * queryKey: ['controls', orgId, domainCode?]
 */
export function useControls(orgId: string, domainCode?: string) {
  return useQuery<SupabaseControl[], Error>({
    queryKey: ['controls', orgId, domainCode ?? null],
    staleTime: 30_000,
    enabled: Boolean(orgId),
    queryFn: async () => {
      let query = (supabase as any)
        .from('controls')
        .select('*')
        .eq('org_id', orgId)
        .order('control_id', { ascending: true });

      if (domainCode) {
        query = query.eq('domain_code', domainCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupabaseControl[];
    },
  });
}

// ── useUpdateControlStatus ────────────────────────────────────
interface UpdateStatusArgs {
  controlId: string;        // UUID primary key
  controlRecordId: string;  // human readable id e.g. "GL-01"
  controlName: string;
  oldStatus: ControlStatus;
  newStatus: ControlStatus;
  orgId: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
}

/**
 * Mutation: update a control's status in Supabase.
 * On success: invalidates ['controls'] and ['compliance-score'] query keys.
 * Also writes an audit log entry via the API route (server-side).
 */
export function useUpdateControlStatus() {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateStatusArgs>({
    mutationFn: async (args) => {
      const { error } = await (supabase as any)
        .from('controls')
        .update({
          status:     args.newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', args.controlId)
        .eq('org_id', args.orgId);

      if (error) throw error;

      // Fire audit log via API (server-side, uses service role key)
      try {
        await fetch('/api/v1/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId:        args.orgId,
            actorUserId:  args.actorUserId ?? 'unknown',
            actorEmail:   args.actorEmail  ?? 'unknown',
            actorRole:    args.actorRole   ?? 'unknown',
            eventType:    'control.status_changed',
            resourceType: 'control',
            resourceId:   args.controlId,
            resourceName: args.controlName,
            oldValue:     { status: args.oldStatus },
            newValue:     { status: args.newStatus },
          }),
        });
      } catch {
        // Non-fatal — audit failure must not block UI
      }
    },
    onSuccess: (_data, args) => {
      // Invalidate so UI refetches fresh data
      qc.invalidateQueries({ queryKey: ['controls'] });
      qc.invalidateQueries({ queryKey: ['compliance-score'] });
    },
  });
}

// ── useComplianceScore ────────────────────────────────────────
/**
 * Fetch only domain_code + status columns (lightweight) and compute
 * per-domain and overall compliance scores.
 * queryKey: ['compliance-score', orgId]
 */
export function useComplianceScore(orgId: string) {
  return useQuery<ComplianceReport, Error>({
    queryKey: ['compliance-score', orgId],
    staleTime: 15_000,
    enabled: Boolean(orgId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('controls')
        .select('domain_code, status')
        .eq('org_id', orgId);

      if (error) throw error;
      const rows = (data ?? []) as ControlRow[];

      // Group by domain
      const byDomain: Record<string, ControlRow[]> = {};
      for (const row of rows) {
        if (!byDomain[row.domain_code]) byDomain[row.domain_code] = [];
        byDomain[row.domain_code].push(row);
      }

      const domains: DomainScore[] = Object.values(byDomain).map(calculateDomainScore);
      const overallScore = calculateOverallScore(domains);
      const criticalFailures = rows.filter(r => r.status === 'FAIL');

      return {
        overallScore,
        overallGrade: getScoreGrade(overallScore),
        domains,
        criticalFailures,
      };
    },
  });
}

// ── useAuditLogs ──────────────────────────────────────────────
export interface AuditLog {
  id: string;
  org_id: string;
  actor_user_id: string;
  actor_email: string;
  actor_role: string;
  event_type: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UseAuditLogsOptions {
  orgId: string;
  actorFilter?: string;     // actor_email ILIKE filter
  eventTypeFilter?: string;
  dateFrom?: string;        // ISO date string
  dateTo?: string;
  page?: number;
  pageSize?: number;
  /** The Clerk role of the current viewer. Controls which rows are visible. */
  viewerRole?: string;
  viewerUserId?: string;
}

export function useAuditLogs(opts: UseAuditLogsOptions) {
  const {
    orgId,
    actorFilter,
    eventTypeFilter,
    dateFrom,
    dateTo,
    page = 0,
    pageSize = 50,
    viewerRole = 'viewer',
    viewerUserId,
  } = opts;

  return useQuery<{ logs: AuditLog[]; total: number }, Error>({
    queryKey: ['audit-logs', orgId, actorFilter, eventTypeFilter, dateFrom, dateTo, page, viewerRole, viewerUserId],
    staleTime: 10_000,
    enabled: Boolean(orgId) && ['admin', 'owner', 'auditor', 'reviewer'].includes(viewerRole),
    queryFn: async () => {
      let query = (supabase as any)
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Manager/reviewer role: only see their own team's logs
      if ((viewerRole === 'reviewer' || viewerRole === 'developer') && viewerUserId) {
        query = query.eq('actor_user_id', viewerUserId);
      }

      if (actorFilter) query = query.ilike('actor_email', `%${actorFilter}%`);
      if (eventTypeFilter) query = query.eq('event_type', eventTypeFilter);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as AuditLog[], total: count ?? 0 };
    },
  });
}
