'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import ControlCard from '@/components/governance/ControlCard';
import { getControlsByDomain, getDomainScore } from '@/lib/controls-engine';
import { Filter, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface DomainPageProps {
  domainCode: string;
  title: string;
  description: string;
}

const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DomainPage({ domainCode, title, description }: DomainPageProps) {
  const controls = getControlsByDomain(domainCode);
  const score = getDomainScore(domainCode);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filtered = statusFilter === 'all' ? controls : controls.filter(c => c.assessment.status === statusFilter);
  const scoreColor = score.score >= 80 ? '#10B981' : score.score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title={title} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>DOMAIN {domainCode}</span>
            <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', maxWidth: '600px' }}>{description}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold font-mono" style={{ color: scoreColor }}>{score.score}</div>
            <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>DOMAIN SCORE</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] font-mono">
          <span className="flex items-center gap-1" style={{ color: '#10B981' }}><CheckCircle size={11} /> {score.passing} Pass</span>
          <span className="flex items-center gap-1" style={{ color: '#F59E0B' }}><AlertTriangle size={11} /> {score.warning} Warn</span>
          <span className="flex items-center gap-1" style={{ color: '#EF4444' }}><XCircle size={11} /> {score.failing} Block</span>
          <span className="flex items-center gap-1" style={{ color: '#475569' }}><Clock size={11} /> {score.pending} Pending</span>
        </div>
      </motion.div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        {['all', 'pass', 'warn', 'block', 'pending'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="text-[11px] font-mono rounded-md transition-all" style={{
            padding: '4px 10px',
            background: statusFilter === s ? 'rgba(59,130,246,0.1)' : 'transparent',
            border: `1px solid ${statusFilter === s ? 'rgba(59,130,246,0.3)' : 'var(--color-border-subtle)'}`,
            color: statusFilter === s ? '#3B82F6' : 'var(--color-text-muted)',
          }}>
            {s.toUpperCase()} ({s === 'all' ? controls.length : controls.filter(c => c.assessment.status === s).length})
          </button>
        ))}
      </div>

      {/* ── Controls ──────────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-2">
        {filtered.map(control => (
          <motion.div key={control.id} variants={cardVariants}>
            <ControlCard
              id={control.id} name={control.name} domain={control.domain}
              status={control.assessment.status} frameworks={control.frameworks}
              owner={control.assessment.owner} lastAssessed={control.assessment.lastAssessed}
              evidenceCount={control.assessment.evidenceCount} riskLevel={control.riskLevel}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
