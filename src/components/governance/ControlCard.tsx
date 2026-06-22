'use client';
import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/ui/StatusBadge';
import FrameworkTag from '@/components/governance/FrameworkTag';
import { Shield, AlertTriangle, FileCheck, User, Calendar, ChevronRight } from 'lucide-react';

export type ControlStatus = 'pass' | 'warn' | 'block' | 'pending' | 'na';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ControlCardProps {
  id: string;
  name: string;
  domain: string;
  status: ControlStatus;
  frameworks: string[];
  owner: string;
  lastAssessed: string;
  evidenceCount: number;
  riskLevel: RiskLevel;
  onClick?: () => void;
}

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.2)' },
  high:     { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
  medium:   { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
  low:      { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.2)' },
};

export default function ControlCard({
  id, name, domain, status, frameworks, owner, lastAssessed, evidenceCount, riskLevel, onClick,
}: ControlCardProps) {
  const risk = RISK_COLORS[riskLevel];

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left ag-card group"
      style={{ padding: '1rem 1.25rem' }}
      whileHover={{ y: -2, scale: 1.005, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: '0.75rem' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg"
            style={{ width: '36px', height: '36px', background: risk.bg, border: `1px solid ${risk.border}` }}>
            <Shield size={16} style={{ color: risk.text }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>{id}</span>
              <span className="text-xs font-mono rounded" style={{
                padding: '1px 6px',
                background: risk.bg,
                color: risk.text,
                border: `1px solid ${risk.border}`,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>{riskLevel}</span>
            </div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{name}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status as any} />
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      {/* Framework tags */}
      <div className="flex flex-wrap gap-1.5" style={{ marginBottom: '0.75rem' }}>
        {frameworks.slice(0, 4).map(fw => (
          <FrameworkTag key={fw} framework={fw} />
        ))}
        {frameworks.length > 4 && (
          <span className="text-[10px] font-mono rounded-full" style={{
            padding: '2px 8px',
            background: 'var(--color-bg-overlay)',
            color: 'var(--color-text-muted)',
          }}>+{frameworks.length - 4}</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><User size={10} />{owner}</span>
        <span className="flex items-center gap-1"><Calendar size={10} />{lastAssessed}</span>
        <span className="flex items-center gap-1"><FileCheck size={10} />{evidenceCount} evidence</span>
      </div>
    </motion.button>
  );
}
