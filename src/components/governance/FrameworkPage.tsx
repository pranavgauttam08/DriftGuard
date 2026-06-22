'use client';
// ============================================================
// components/governance/FrameworkPage.tsx
// Generic template for compliance framework pages (SOC2, GDPR…).
// Reads live Supabase data — filters by framework name across all domains.
// All colours via CSS variables only.
// ============================================================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import ComplianceScoreRing from '@/components/governance/ComplianceScoreRing';
import ControlCard from '@/components/governance/ControlCard';
import { useControls } from '@/hooks/useControls';
import { useTenant } from '@/hooks/useTenant';
import { useQueryClient } from '@tanstack/react-query';
import { Filter, CheckCircle, AlertTriangle, XCircle, RefreshCw, ShieldOff } from 'lucide-react';
import { getScoreColor } from '@/lib/scoring';

interface FrameworkPageProps {
  frameworkName: string;
  frameworkFullName: string;
  color: string;
  description: string;
}

// ── Skeleton card ─────────────────────────────────────────────
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
        {[1, 2, 3].map(i => <div key={i} className="h-3 rounded-full w-10" style={{ background: 'var(--color-background-secondary)' }} />)}
      </div>
    </div>
  );
}

export default function FrameworkPage({ frameworkName, frameworkFullName, color, description }: FrameworkPageProps) {
  const { org } = useTenant();
  const orgId = org?.id ?? '';
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all controls for org, then filter by framework client-side
  const { data: allControls = [], isLoading, isError, refetch } = useControls(orgId);

  // Only controls tagged with this framework
  const controls = allControls.filter(c =>
    c.frameworks?.some(fw => fw.toLowerCase() === frameworkName.toLowerCase())
  );

  const total       = controls.length;
  const passing     = controls.filter(c => c.status === 'PASS').length;
  const warning     = controls.filter(c => c.status === 'WARN').length;
  const failing     = controls.filter(c => c.status === 'FAIL').length;
  const notAssessed = controls.filter(c => c.status === 'NOT_ASSESSED').length;

  const rawScore = total > 0
    ? Math.round(((passing * 1 + warning * 0.5) / total) * 100)
    : 0;

  const filtered = statusFilter === 'all'
    ? controls
    : controls.filter(c => c.status === statusFilter);

  const STATUS_FILTERS = [
    { key: 'all',          label: 'ALL',          count: total },
    { key: 'PASS',         label: 'PASS',         count: passing },
    { key: 'WARN',         label: 'WARN',         count: warning },
    { key: 'FAIL',         label: 'FAIL',         count: failing },
    { key: 'NOT_ASSESSED', label: 'NOT ASSESSED', count: notAssessed },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title={frameworkFullName} />

      {/* ── Hero ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-start gap-6 flex-wrap">
          {!isLoading && (
            <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
              <ComplianceScoreRing score={rawScore} framework={frameworkName} color={color} size="md" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {frameworkName} Compliance
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
              {description}
            </p>
            {!isLoading && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--color-text-success)' }}>
                  <CheckCircle size={11} /> {passing} pass
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--color-text-warning)' }}>
                  <AlertTriangle size={11} /> {warning} warn
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--color-text-danger)' }}>
                  <XCircle size={11} /> {failing} fail
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Error state ─────────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl flex items-center justify-between gap-3" style={{
          padding: '1rem 1.25rem',
          background: 'var(--color-background-danger)',
          border: '1px solid var(--color-border-danger)',
        }}>
          <span className="text-sm" style={{ color: 'var(--color-text-danger)' }}>Failed to load controls</span>
          <button
            onClick={() => { qc.refetchQueries({ queryKey: ['controls'] }); refetch(); }}
            className="flex items-center gap-1.5 text-xs font-mono rounded-md"
            style={{ padding: '6px 12px', background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', border: '1px solid var(--color-border-danger)' }}
          >
            <RefreshCw size={11} /> Try again
          </button>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────── */}
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
                background: statusFilter === sf.key ? `${color}18` : 'transparent',
                border: `1px solid ${statusFilter === sf.key ? `${color}50` : 'var(--color-border-subtle)'}`,
                color: statusFilter === sf.key ? color : 'var(--color-text-muted)',
              }}
            >
              {sf.label} ({sf.count})
            </button>
          ))}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <ShieldOff size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {controls.length === 0
              ? `No controls mapped to ${frameworkName} yet`
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
