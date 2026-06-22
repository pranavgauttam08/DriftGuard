'use client';
// ============================================================
// components/governance/ControlCard.tsx
// Reads live data from Supabase. All colours use CSS variables.
// "Change Status" visible only to Admin/Manager (owner/admin roles).
// Clicking the card opens SlideOverDrawer with full details.
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Calendar, FileText, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';
import { SupabaseControl, ControlStatus, useUpdateControlStatus } from '@/hooks/useControls';
import { useUser } from '@clerk/nextjs';
import { useTenant } from '@/hooks/useTenant';

// ── Status badge config ───────────────────────────────────────
const STATUS_CONFIG: Record<ControlStatus, { bg: string; text: string; label: string }> = {
  PASS:         { bg: 'var(--color-background-success)',   text: 'var(--color-text-success)',   label: 'PASS' },
  WARN:         { bg: 'var(--color-background-warning)',   text: 'var(--color-text-warning)',   label: 'WARN' },
  FAIL:         { bg: 'var(--color-background-danger)',    text: 'var(--color-text-danger)',    label: 'FAIL' },
  NOT_ASSESSED: { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)', label: 'NOT ASSESSED' },
};

// ── Risk level badge config ───────────────────────────────────
const RISK_CONFIG: Record<string, { bg: string; text: string }> = {
  Critical: { bg: 'var(--color-background-danger)',    text: 'var(--color-text-danger)' },
  High:     { bg: 'var(--color-background-warning)',   text: 'var(--color-text-warning)' },
  Medium:   { bg: 'rgba(59,130,246,0.10)',             text: 'var(--color-brand-primary)' },
  Low:      { bg: 'rgba(100,116,139,0.12)',            text: 'var(--color-text-secondary)' },
};

// ── Left-edge border for FAIL/WARN ───────────────────────────
function getLeftBorderStyle(status: ControlStatus): React.CSSProperties {
  if (status === 'FAIL') return { borderLeft: '3px solid var(--color-border-danger)' };
  if (status === 'WARN') return { borderLeft: '3px solid var(--color-border-warning)' };
  return {};
}

// ── Date formatter ────────────────────────────────────────────
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Roles that can change status ──────────────────────────────
const CAN_CHANGE_STATUS = new Set(['admin', 'owner', 'manager']);

// ── SlideOverDrawer ───────────────────────────────────────────
interface DrawerProps {
  control: SupabaseControl;
  open: boolean;
  onClose: () => void;
}

function SlideOverDrawer({ control, open, onClose }: DrawerProps) {
  const statusCfg = STATUS_CONFIG[control.status] ?? STATUS_CONFIG.NOT_ASSESSED;
  const riskCfg = RISK_CONFIG[control.risk_level] ?? RISK_CONFIG.Medium;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(8,12,20,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto ag-card"
            style={{
              width: '480px',
              maxWidth: '95vw',
              borderRadius: '0',
              borderRight: 'none',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.08em' }}>
                  {control.control_id}
                </span>
                <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {control.control_name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-xs font-mono rounded-md transition-all"
                style={{
                  padding: '6px 12px',
                  background: 'var(--color-bg-overlay)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                Close ✕
              </button>
            </div>

            {/* Status + Risk row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-semibold rounded-md px-2 py-0.5"
                style={{ background: statusCfg.bg, color: statusCfg.text }}>
                {statusCfg.label}
              </span>
              <span className="text-[11px] font-mono rounded-md px-2 py-0.5"
                style={{ background: riskCfg.bg, color: riskCfg.text }}>
                {control.risk_level} Risk
              </span>
            </div>

            {/* Description */}
            {control.description && (
              <div>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Description</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {control.description}
                </p>
              </div>
            )}

            {/* Frameworks */}
            {control.frameworks?.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase mb-2" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Frameworks</div>
                <div className="flex flex-wrap gap-1.5">
                  {control.frameworks.map(fw => (
                    <span key={fw} className="text-[10px] font-mono rounded-full px-2 py-0.5"
                      style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--color-brand-primary)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {control.owner_name && (
                <div className="ag-card" style={{ padding: '0.75rem' }}>
                  <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Owner</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{control.owner_name}</div>
                </div>
              )}
              {control.last_assessed_at && (
                <div className="ag-card" style={{ padding: '0.75rem' }}>
                  <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Last Assessed</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatDate(control.last_assessed_at)}</div>
                </div>
              )}
            </div>

            {/* Evidence */}
            {control.evidence_filename && control.evidence_url && (
              <div>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Evidence</div>
                <a
                  href={control.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs rounded-md transition-all"
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(59,130,246,0.05)',
                    color: 'var(--color-brand-primary)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    textDecoration: 'none',
                  }}
                >
                  <FileText size={12} />
                  {control.evidence_filename}
                  <ExternalLink size={10} className="ml-auto" />
                </a>
              </div>
            )}

            {/* Notes */}
            {control.notes && (
              <div>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>Notes</div>
                <div className="rounded-lg text-xs leading-relaxed" style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-overlay)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  {control.notes}
                </div>
              </div>
            )}

            {/* Meta footer */}
            <div className="text-[9px] font-mono" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
              Domain: {control.domain_code} · ID: {control.id?.slice(0, 8)}…
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main ControlCard ──────────────────────────────────────────
interface ControlCardProps {
  control: SupabaseControl;
  index?: number;
  orgId: string;
}

export default function ControlCard({ control, index = 0, orgId }: ControlCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useUser();
  const { role } = useTenant();

  const updateStatus = useUpdateControlStatus();
  const statusCfg = STATUS_CONFIG[control.status] ?? STATUS_CONFIG.NOT_ASSESSED;
  const riskCfg = RISK_CONFIG[control.risk_level] ?? RISK_CONFIG.Medium;
  const canEdit = CAN_CHANGE_STATUS.has(role);
  const visibleFrameworks = control.frameworks?.slice(0, 3) ?? [];
  const extraFrameworks = (control.frameworks?.length ?? 0) - 3;

  const handleStatusChange = async (newStatus: ControlStatus) => {
    setDropdownOpen(false);
    if (newStatus === control.status) return;
    await updateStatus.mutateAsync({
      controlId:    control.id,
      controlRecordId: control.control_id,
      controlName:  control.control_name,
      oldStatus:    control.status,
      newStatus,
      orgId,
      actorUserId:  user?.id,
      actorEmail:   user?.primaryEmailAddress?.emailAddress,
      actorRole:    role,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="ag-card group relative cursor-pointer"
        style={{ padding: '1rem 1.25rem', ...getLeftBorderStyle(control.status) }}
        onClick={() => setDrawerOpen(true)}
      >
        {/* ── Top Row ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-2">
          {/* Left: control_id + risk badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold rounded"
              style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.07em' }}>
              {control.control_id}
            </span>
            <span className="text-[9px] font-mono font-semibold rounded px-1.5 py-0.5 uppercase"
              style={{ background: riskCfg.bg, color: riskCfg.text }}>
              {control.risk_level}
            </span>
          </div>

          {/* Right: status badge + change dropdown */}
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] font-mono font-semibold rounded px-2 py-0.5"
              style={{ background: statusCfg.bg, color: statusCfg.text }}>
              {statusCfg.label}
            </span>

            {canEdit && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-0.5 text-[10px] font-mono rounded-md transition-all"
                  style={{
                    padding: '2px 6px',
                    background: 'var(--color-bg-overlay)',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                  disabled={updateStatus.isPending}
                >
                  Change <ChevronDown size={10} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 z-20 ag-card"
                      style={{ minWidth: '130px', padding: '4px', boxShadow: 'var(--shadow-lg)' }}
                    >
                      {(['PASS', 'WARN', 'FAIL', 'NOT_ASSESSED'] as ControlStatus[]).map(s => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className="w-full text-left text-[10px] font-mono rounded px-2 py-1.5 transition-all"
                            style={{
                              color: cfg.text,
                              background: s === control.status ? cfg.bg : 'transparent',
                            }}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>

        {/* ── Title ───────────────────────────────────────────── */}
        <h4 className="text-sm font-semibold mb-2 line-clamp-2"
          style={{ color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
          {control.control_name}
        </h4>

        {/* ── Framework pills ──────────────────────────────────── */}
        {visibleFrameworks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {visibleFrameworks.map(fw => (
              <span key={fw} className="text-[9px] font-mono rounded-full px-1.5 py-0.5"
                style={{
                  background: 'rgba(59,130,246,0.07)',
                  color: 'var(--color-brand-primary)',
                  border: '1px solid rgba(59,130,246,0.12)',
                }}>
                {fw}
              </span>
            ))}
            {extraFrameworks > 0 && (
              <span className="text-[9px] font-mono rounded-full px-1.5 py-0.5"
                style={{ background: 'var(--color-bg-overlay)', color: 'var(--color-text-muted)' }}>
                +{extraFrameworks} more
              </span>
            )}
          </div>
        )}

        {/* ── Meta row ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          {control.owner_name && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              <User size={9} />{control.owner_name}
            </span>
          )}
          {control.last_assessed_at && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar size={9} />{formatDate(control.last_assessed_at)}
            </span>
          )}
          {control.evidence_filename && (
            <a
              href={control.evidence_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] transition-all"
              style={{ color: 'var(--color-brand-primary)', textDecoration: 'none' }}
            >
              <FileText size={9} />{control.evidence_filename}
              <ExternalLink size={8} />
            </a>
          )}
        </div>
      </motion.div>

      <SlideOverDrawer control={control} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
