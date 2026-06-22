'use client';
// ============================================================
// app/dashboard/audit-center/page.tsx
// Live Supabase audit log viewer. All colours via CSS vars only.
// Role visibility:
//   Admin, Auditor (owner/auditor): see ALL logs
//   Manager/Reviewer: see only own team logs
//   Engineer/Developer, Viewer: blocked with no-access banner
// ============================================================
import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import { useAuditLogs } from '@/hooks/useControls';
import { useTenant } from '@/hooks/useTenant';
import {
  ScrollText, Search, Download, Shield, Clock, ChevronLeft, ChevronRight,
  ArrowRight, Lock, RefreshCw, Filter,
} from 'lucide-react';

// ── Roles that can see the audit center ──────────────────────
const ALLOWED_ROLES = new Set(['admin', 'owner', 'auditor', 'reviewer']);

// ── CSV export ───────────────────────────────────────────────
function exportToCsv(logs: any[], filename: string) {
  const headers = ['Timestamp', 'Actor Email', 'Role', 'Event', 'Resource Type', 'Resource Name', 'Old Value', 'New Value', 'IP'];
  const rows = logs.map(l => [
    l.created_at,
    l.actor_email,
    l.actor_role,
    l.event_type,
    l.resource_type,
    l.resource_name,
    l.old_value ? JSON.stringify(l.old_value) : '',
    l.new_value ? JSON.stringify(l.new_value) : '',
    l.ip_address,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Change diff cell ─────────────────────────────────────────
function ChangeDiff({ oldValue, newValue }: { oldValue: any; newValue: any }) {
  if (!oldValue && !newValue) return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  const oldStr = oldValue ? Object.entries(oldValue).map(([k, v]) => `${k}: ${v}`).join(', ') : null;
  const newStr = newValue ? Object.entries(newValue).map(([k, v]) => `${k}: ${v}`).join(', ') : null;
  return (
    <span className="flex items-center gap-1 text-[10px] font-mono flex-wrap">
      {oldStr && <span className="line-through" style={{ color: 'var(--color-text-danger)' }}>{oldStr}</span>}
      {oldStr && newStr && <ArrowRight size={9} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
      {newStr && <span style={{ color: 'var(--color-text-success)' }}>{newStr}</span>}
    </span>
  );
}

// ── Date formatter ────────────────────────────────────────────
function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAGE_SIZE = 50;

export default function AuditCenterPage() {
  const { user } = useUser();
  const { org, role } = useTenant();
  const orgId = org?.id ?? '';

  const [actorFilter, setActorFilter]      = useState('');
  const [eventFilter, setEventFilter]      = useState('');
  const [dateFrom, setDateFrom]            = useState('');
  const [dateTo, setDateTo]                = useState('');
  const [page, setPage]                    = useState(0);

  const { data, isLoading, isError, refetch } = useAuditLogs({
    orgId,
    actorFilter:     actorFilter || undefined,
    eventTypeFilter: eventFilter || undefined,
    dateFrom:        dateFrom || undefined,
    dateTo:          dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
    viewerRole:   role,
    viewerUserId: user?.id,
  });

  const logs   = data?.logs ?? [];
  const total  = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Role-gate ─────────────────────────────────────────────
  if (!ALLOWED_ROLES.has(role)) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <TopBar title="Audit Center" />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="ag-card flex flex-col items-center justify-center text-center"
          style={{ padding: '4rem 2rem', marginTop: '2rem' }}
        >
          <Lock size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4, marginBottom: '1rem' }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Access Restricted
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
            Your role does not have permission to view audit logs.
            Contact your organization administrator.
          </p>
          <p className="text-[10px] font-mono mt-3" style={{ color: 'var(--color-text-muted)' }}>
            Current role: {role}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Audit Center" />

      {/* ── Filter bar ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="ag-card" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />

          {/* Actor search */}
          <div className="relative" style={{ minWidth: '200px', flex: 1 }}>
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              className="w-full text-xs font-mono rounded-md"
              style={{
                paddingLeft: '30px',
                paddingRight: '10px',
                height: '32px',
                background: 'var(--color-bg-overlay)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Search actor email..."
              value={actorFilter}
              onChange={e => { setActorFilter(e.target.value); setPage(0); }}
            />
          </div>

          {/* Event type filter */}
          <select
            className="text-xs font-mono rounded-md"
            style={{
              padding: '0 10px',
              height: '32px',
              background: 'var(--color-bg-overlay)',
              border: '1px solid var(--color-border-subtle)',
              color: eventFilter ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
            }}
            value={eventFilter}
            onChange={e => { setEventFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Events</option>
            <option value="control.status_changed">control.status_changed</option>
            <option value="control.evidence_uploaded">control.evidence_uploaded</option>
            <option value="control.evidence_deleted">control.evidence_deleted</option>
            <option value="user.login">user.login</option>
          </select>

          {/* Date range */}
          <input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="text-xs font-mono rounded-md"
            style={{ padding: '0 8px', height: '32px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>to</span>
          <input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="text-xs font-mono rounded-md"
            style={{ padding: '0 8px', height: '32px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          />

          {/* Export CSV */}
          <button
            onClick={() => exportToCsv(logs, `audit_log_${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 text-xs font-mono rounded-md transition-all disabled:opacity-40"
            style={{
              padding: '0 12px',
              height: '32px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.20)',
              color: 'var(--color-brand-primary)',
            }}
          >
            <Download size={11} />
            Export CSV ({logs.length})
          </button>

          {/* Refresh */}
          <button onClick={() => refetch()}
            className="flex items-center gap-1 text-xs font-mono rounded-md transition-all"
            style={{ padding: '0 10px', height: '32px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={11} />
          </button>
        </div>
      </motion.div>

      {/* ── Error state ───────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl flex items-center gap-3" style={{
          padding: '1rem', background: 'var(--color-background-danger)', border: '1px solid var(--color-border-danger)',
        }}>
          <span className="text-sm" style={{ color: 'var(--color-text-danger)' }}>Failed to load audit logs.</span>
          <button onClick={() => refetch()} className="text-xs font-mono underline" style={{ color: 'var(--color-text-danger)' }}>Try again</button>
        </div>
      )}

      {/* ── Log table ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ag-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div className="grid text-[9px] font-mono uppercase font-semibold" style={{
          gridTemplateColumns: '160px 1fr 70px 140px 100px 1fr',
          padding: '10px 16px',
          background: 'var(--color-bg-overlay)',
          borderBottom: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.06em',
        }}>
          <span>Timestamp</span>
          <span>Actor Email</span>
          <span>Role</span>
          <span>Event</span>
          <span>Resource</span>
          <span>Change</span>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid animate-pulse" style={{
                gridTemplateColumns: '160px 1fr 70px 140px 100px 1fr',
                padding: '12px 16px', gap: '12px',
              }}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-3 rounded" style={{ background: 'var(--color-background-secondary)' }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <ScrollText size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p className="text-sm">No audit log entries found</p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && logs.map((log, i) => (
          <div
            key={log.id}
            className="grid text-xs transition-colors hover:bg-[rgba(59,130,246,0.03)]"
            style={{
              gridTemplateColumns: '160px 1fr 70px 140px 100px 1fr',
              padding: '11px 16px',
              borderBottom: i < logs.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              gap: '8px',
              alignItems: 'start',
            }}
          >
            {/* Timestamp */}
            <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <Clock size={9} />{formatTs(log.created_at)}
            </span>

            {/* Actor email */}
            <span className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {log.actor_email}
            </span>

            {/* Role */}
            <span className="text-[10px] font-mono rounded px-1.5 py-0.5 self-start w-fit"
              style={{ background: 'rgba(59,130,246,0.07)', color: 'var(--color-brand-primary)' }}>
              {log.actor_role}
            </span>

            {/* Event type */}
            <span className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {log.event_type}
            </span>

            {/* Resource */}
            <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {log.resource_name}
            </span>

            {/* Change diff */}
            <ChangeDiff oldValue={log.old_value} newValue={log.new_value} />
          </div>
        ))}
      </motion.div>

      {/* ── Pagination ───────────────────────────────────── */}
      {!isLoading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 text-xs font-mono rounded-md transition-all disabled:opacity-30"
              style={{ padding: '6px 12px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
            >
              <ChevronLeft size={12} /> Previous
            </button>
            <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              Page {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 text-xs font-mono rounded-md transition-all disabled:opacity-30"
              style={{ padding: '6px 12px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Immutability notice ──────────────────────────── */}
      <div className="rounded-xl flex items-center gap-2 text-[10px]"
        style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.03)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
        <Shield size={12} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
        All audit entries are immutable and tamper-proof. Written via service role key, bypassing RLS.
        Retained for 7 years per compliance requirements.
      </div>
    </div>
  );
}
