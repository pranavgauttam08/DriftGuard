'use client';
// ============================================================
// hooks/useControls.ts — TanStack Query hooks + Supabase Realtime
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

// ─────────────────────────────────────────────────────────────
// useControls
// ─────────────────────────────────────────────────────────────
/**
 * Fetch controls for an org. Optionally filtered by domainCode.
 * Subscribes to Supabase Realtime for live updates.
 * queryKey: ['controls', orgId, domainCode?]
 */
export function useControls(orgId: string, domainCode?: string) {
  const qc = useQueryClient();

  const query = useQuery<SupabaseControl[], Error>({
    queryKey: ['controls', orgId, domainCode ?? null],
    staleTime: 30_000,
    enabled: Boolean(orgId),
    queryFn: async () => {
      let q = (supabase as any)
        .from('controls')
        .select('*')
        .eq('org_id', orgId)
        .order('control_id', { ascending: true });
      if (domainCode) q = q.eq('domain_code', domainCode);
      const { data, error } = await q;
      if (error) throw error;
      return data as SupabaseControl[];
    },
  });

  // ── Supabase Realtime subscription ───────────────────────
  useEffect(() => {
    if (!orgId) return;

    const channel = (supabase as any)
      .channel(`controls-${orgId}-${domainCode ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'controls',
          filter: `org_id=eq.${orgId}`,
        },
        (payload: any) => {
          const updated = payload.new as SupabaseControl;
          // Toast notification for status changes made by another user
          if (updated?.control_id && updated?.status) {
            toast(`${updated.control_id} updated to ${updated.status}`, {
              icon: updated.status === 'PASS' ? '✅' : updated.status === 'FAIL' ? '🔴' : '⚠️',
              style: {
                background: 'var(--color-bg-elevated, #161B27)',
                color: 'var(--color-text-primary, #F1F5F9)',
                border: '1px solid var(--color-border-subtle, #1E2536)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              },
            });
          }
          // Invalidate so TanStack Query refetches
          qc.invalidateQueries({ queryKey: ['controls', orgId] });
          qc.invalidateQueries({ queryKey: ['compliance-score', orgId] });
        },
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [orgId, domainCode, qc]);

  return query;
}

// ─────────────────────────────────────────────────────────────
// useRealtimeStatus — tracks whether the Realtime channel is SUBSCRIBED
// ─────────────────────────────────────────────────────────────
export function useRealtimeStatus(orgId: string): 'SUBSCRIBED' | 'CONNECTING' | 'CLOSED' {
  const [status, setStatus] = useState<'SUBSCRIBED' | 'CONNECTING' | 'CLOSED'>('CONNECTING');

  useEffect(() => {
    if (!orgId) return;

    const channel = (supabase as any)
      .channel(`realtime-status-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'controls', filter: `org_id=eq.${orgId}` }, () => {})
      .subscribe((state: string) => {
        if (state === 'SUBSCRIBED')   setStatus('SUBSCRIBED');
        else if (state === 'CLOSED')  setStatus('CLOSED');
        else                          setStatus('CONNECTING');
      });

    return () => { (supabase as any).removeChannel(channel); };
  }, [orgId]);

  return status;
}

// ─────────────────────────────────────────────────────────────
// useUpdateControlStatus
// ─────────────────────────────────────────────────────────────
interface UpdateStatusArgs {
  controlId: string;
  controlRecordId: string;
  controlName: string;
  oldStatus: ControlStatus;
  newStatus: ControlStatus;
  orgId: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
}

export function useUpdateControlStatus() {
  const qc = useQueryClient();

  return useMutation<void, Error, UpdateStatusArgs>({
    mutationFn: async (args) => {
      const { error } = await (supabase as any)
        .from('controls')
        .update({ status: args.newStatus, updated_at: new Date().toISOString() })
        .eq('id', args.controlId)
        .eq('org_id', args.orgId);
      if (error) throw error;

      try {
        await fetch('/api/v1/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId:        args.orgId,
            actorUserId:  args.actorUserId  ?? 'unknown',
            actorEmail:   args.actorEmail   ?? 'unknown',
            actorRole:    args.actorRole    ?? 'unknown',
            eventType:    'control.status_changed',
            resourceType: 'control',
            resourceId:   args.controlId,
            resourceName: args.controlName,
            oldValue:     { status: args.oldStatus },
            newValue:     { status: args.newStatus },
          }),
        });
      } catch { /* audit failure must not block UI */ }
    },
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ['controls'] });
      qc.invalidateQueries({ queryKey: ['compliance-score'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// useComplianceScore
// ─────────────────────────────────────────────────────────────
export function useComplianceScore(orgId: string) {
  return useQuery<ComplianceReport, Error>({
    queryKey: ['compliance-score', orgId],
    staleTime: 15_000,
    enabled: Boolean(orgId),
    queryFn: async () => {
      // Need full row to render ControlCards in criticalFailures
      const { data, error } = await (supabase as any)
        .from('controls')
        .select('*')
        .eq('org_id', orgId);
      if (error) throw error;
      const rows = (data ?? []) as SupabaseControl[];

      const byDomain: Record<string, SupabaseControl[]> = {};
      for (const row of rows) {
        if (!byDomain[row.domain_code]) byDomain[row.domain_code] = [];
        byDomain[row.domain_code].push(row);
      }

      // calculateDomainScore expects { domain_code, status } which SupabaseControl satisfies
      const domains: DomainScore[] = Object.values(byDomain).map((arr) => calculateDomainScore(arr as unknown as ControlRow[]));
      const overallScore = calculateOverallScore(domains);
      const criticalFailures = rows.filter(r => r.status === 'FAIL');

      return { 
        overallScore, 
        overallGrade: getScoreGrade(overallScore), 
        domains, 
        // criticalFailures expects ControlRow[] but dashboard casts it. Let's cast it here.
        criticalFailures: criticalFailures as unknown as ControlRow[]
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────
// useAuditLogs
// ─────────────────────────────────────────────────────────────
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
  actorFilter?: string;
  eventTypeFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  viewerRole?: string;
  viewerUserId?: string;
}

export function useAuditLogs(opts: UseAuditLogsOptions) {
  const {
    orgId, actorFilter, eventTypeFilter, dateFrom, dateTo,
    page = 0, pageSize = 50, viewerRole = 'viewer', viewerUserId,
  } = opts;

  return useQuery<{ logs: AuditLog[]; total: number }, Error>({
    queryKey: ['audit-logs', orgId, actorFilter, eventTypeFilter, dateFrom, dateTo, page, viewerRole, viewerUserId],
    staleTime: 10_000,
    enabled: Boolean(orgId) && ['admin', 'owner', 'auditor', 'reviewer'].includes(viewerRole),
    queryFn: async () => {
      let q = (supabase as any)
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if ((viewerRole === 'reviewer' || viewerRole === 'developer') && viewerUserId)
        q = q.eq('actor_user_id', viewerUserId);
      if (actorFilter)      q = q.ilike('actor_email', `%${actorFilter}%`);
      if (eventTypeFilter)  q = q.eq('event_type', eventTypeFilter);
      if (dateFrom)         q = q.gte('created_at', dateFrom);
      if (dateTo)           q = q.lte('created_at', dateTo);

      const { data, error, count } = await q;
      if (error) throw error;
      return { logs: data as AuditLog[], total: count ?? 0 };
    },
  });
}
