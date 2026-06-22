'use client';
// ============================================================
// components/governance/DomainPage.tsx
// Generic template used by all 12 domain pages.
// Reads controls from Supabase via useControls hook.
// All colours via CSS variables only.
// ============================================================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import ControlCard from '@/components/governance/ControlCard';
import { useControls } from '@/hooks/useControls';
import { useTenant } from '@/hooks/useTenant';
import { useQueryClient } from '@tanstack/react-query';
import { Filter, CheckCircle, AlertTriangle, XCircle, Clock, ShieldOff, RefreshCw } from 'lucide-react';
import { getScoreColor } from '@/lib/scoring';

interface DomainPageProps {
  domainCode: string;
  title: string;
  description: string;
}

// ── Skeleton card for loading state ──────────────────────────
function SkeletonCard() {
  return (
    <div className="ag-card animate-pulse" style={{ padding: '1rem 1.25rem', minHeight: '120px' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <div className="h-3 rounded w-12" style={{ background: 'var(--color-background-secondary)' }} />
          <div className="h-3 rounded w-10" style={{ background: 'var(--color-background-secondary)' }} />
        </div>
        <div className="h-4 rounded w-14" style={{ background: 'var(--color-background-secondary)' }} />
      </div>
      <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--color-background-secondary)' }} />
      <div className="h-3 rounded w-1/2 mb-3" style={{ background: 'var(--color-background-secondary)' }} />
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 rounded-full w-10" style={{ background: 'var(--color-background-secondary)' }} />
        ))}
      </div>
    </div>
  );
}

export default function DomainPage({ domainCode, title, description }: DomainPageProps) {
  const { org } = useTenant();
  const orgId = org?.id ?? '';
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: controls = [], isLoading, isError, refetch } = useControls(orgId, domainCode);

  // ── KPI counts ────────────────────────────────────────────
  const total       = controls.length;
  const passing     = controls.filter(c => c.status === 'PASS').length;
  const warning     = controls.filter(c => c.status === 'WARN').length;
  const failing     = controls.filter(c => c.status === 'FAIL').length;
  const notAssessed = controls.filter(c => c.status === 'NOT_ASSESSED').length;

  const rawScore = total > 0
    ? Math.round(((passing * 1 + warning * 0.5) / total) * 100)
    : 0;
  const scoreColor = getScoreColor(rawScore);

  // ── Filtered controls ─────────────────────────────────────
  const filtered = statusFilter === 'all'
    ? controls
    : controls.filter(c => c.status === statusFilter);

  const STATUS_FILTERS = [
    { key: 'all',          label: 'ALL',         count: total },
    { key: 'PASS',         label: 'PASS',         count: passing },
    { key: 'WARN',         label: 'WARN',         count: warning },
    { key: 'FAIL',         label: 'FAIL',         count: failing },
    { key: 'NOT_ASSESSED', label: 'NOT ASSESSED', count: notAssessed },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title={title} />

      {/* ── Hero / domain header ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.07em' }}>
              DOMAIN {domainCode}
            </span>
            <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', maxWidth: '600px' }}>{description}</p>
          </div>
          {!isLoading && (
            <div className="text-right flex-shrink-0">
              <div className="text-4xl font-bold font-mono" style={{ color: scoreColor }}>{rawScore}</div>
              <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>DOMAIN SCORE</div>
            </div>
          )}
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        {!isLoading && (
          <div className="grid grid-cols-4 gap-3 mt-4 max-sm:grid-cols-2">
            {[
              { label: 'Total Controls', value: total,       icon: <Filter size={12} />,         color: 'var(--color-text-secondary)' },
              { label: 'Passing',        value: passing,     icon: <CheckCircle size={12} />,    color: 'var(--color-text-success)' },
              { label: 'Warning',        value: warning,     icon: <AlertTriangle size={12} />,  color: 'var(--color-text-warning)' },
              { label: 'Failing',        value: failing,     icon: <XCircle size={12} />,        color: 'var(--color-text-danger)' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg" style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-bg-overlay)',
                border: '1px solid var(--color-border-subtle)',
              }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: kpi.color }}>
                  {kpi.icon}
                  <span className="text-[9px] font-mono uppercase" style={{ letterSpacing: '0.06em' }}>{kpi.label}</span>
                </div>
                <div className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Error state ───────────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl flex items-center justify-between gap-3" style={{
          padding: '1rem 1.25rem',
          background: 'var(--color-background-danger)',
          border: '1px solid var(--color-border-danger)',
        }}>
          <div className="flex items-center gap-2">
            <XCircle size={16} style={{ color: 'var(--color-text-danger)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-danger)' }}>
              Failed to load controls
            </span>
          </div>
          <button
            onClick={() => {
              qc.refetchQueries({ queryKey: ['controls'] });
              refetch();
            }}
            className="flex items-center gap-1.5 text-xs font-mono rounded-md transition-all"
            style={{
              padding: '6px 12px',
              background: 'var(--color-background-danger)',
              color: 'var(--color-text-danger)',
              border: '1px solid var(--color-border-danger)',
            }}
          >
            <RefreshCw size={11} />
            Try again
          </button>
        </div>
      )}

      {/* ── Filter bar ───────────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className="text-[10px] font-mono rounded-md transition-all"
              style={{
                padding: '4px 10px',
                background: statusFilter === sf.key ? 'rgba(59,130,246,0.10)' : 'transparent',
                border: `1px solid ${statusFilter === sf.key ? 'rgba(59,130,246,0.30)' : 'var(--color-border-subtle)'}`,
                color: statusFilter === sf.key ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
              }}
            >
              {sf.label} ({sf.count})
            </button>
          ))}
        </div>
      )}

      {/* ── Loading state: 6 skeleton cards ──────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <ShieldOff size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {controls.length === 0
              ? 'No controls in this domain yet'
              : `No controls matching "${statusFilter}" status`}
          </p>
        </div>
      )}

      {/* ── Controls grid ────────────────────────────────────── */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((control, i) => (
            <ControlCard key={control.id} control={control} index={i} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}
