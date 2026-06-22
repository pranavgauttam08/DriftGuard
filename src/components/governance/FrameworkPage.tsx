'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import ComplianceScoreRing from '@/components/governance/ComplianceScoreRing';
import ControlCard from '@/components/governance/ControlCard';
import { getControlsByFramework, getFrameworkScore, ControlWithAssessment } from '@/lib/controls-engine';
import { Filter } from 'lucide-react';

interface FrameworkPageProps {
  frameworkName: string;
  frameworkFullName: string;
  color: string;
  description: string;
}

const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function FrameworkPage({ frameworkName, frameworkFullName, color, description }: FrameworkPageProps) {
  const controls = getControlsByFramework(frameworkName);
  const score = getFrameworkScore(frameworkName);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all' ? controls : controls.filter(c => c.assessment.status === statusFilter);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title={frameworkFullName} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-6">
          <div className="relative" style={{ width: 100, height: 100 }}>
            <ComplianceScoreRing score={score.score} framework={frameworkName} color={color} size="md" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{frameworkName} Compliance</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)', maxWidth: '500px' }}>{description}</p>
            <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
              <span style={{ color: '#10B981' }}>✓ {score.passing} pass</span>
              <span style={{ color: '#F59E0B' }}>⚠ {score.warning} warn</span>
              <span style={{ color: '#EF4444' }}>✕ {score.failing} block</span>
              <span style={{ color: '#475569' }}>○ {score.pending} pending</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        {['all', 'pass', 'warn', 'block', 'pending'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="text-[11px] font-mono rounded-md transition-all"
            style={{
              padding: '4px 10px',
              background: statusFilter === s ? `${color}15` : 'transparent',
              border: `1px solid ${statusFilter === s ? `${color}40` : 'var(--color-border-subtle)'}`,
              color: statusFilter === s ? color : 'var(--color-text-muted)',
            }}
          >
            {s.toUpperCase()} {s !== 'all' ? `(${controls.filter(c => c.assessment.status === s).length})` : `(${controls.length})`}
          </button>
        ))}
      </div>

      {/* ── Controls Grid ─────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-2">
        {filtered.map(control => (
          <motion.div key={control.id} variants={cardVariants}>
            <ControlCard
              id={control.id}
              name={control.name}
              domain={control.domain}
              status={control.assessment.status}
              frameworks={control.frameworks}
              owner={control.assessment.owner}
              lastAssessed={control.assessment.lastAssessed}
              evidenceCount={control.assessment.evidenceCount}
              riskLevel={control.riskLevel}
            />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="ag-card text-center" style={{ padding: '3rem', color: 'var(--color-text-muted)' }}>
            No controls match the selected filter.
          </div>
        )}
      </motion.div>
    </div>
  );
}
