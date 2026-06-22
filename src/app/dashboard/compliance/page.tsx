'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import ComplianceScoreRing from '@/components/governance/ComplianceScoreRing';
import FrameworkTag from '@/components/governance/FrameworkTag';
import ControlCard from '@/components/governance/ControlCard';
import { getOverallScore, getFrameworkScore, getDomainHealthMap, getCrosswalkMatrix, FRAMEWORKS } from '@/lib/controls-engine';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, ChevronRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function ComplianceHubPage() {
  const overall = getOverallScore();
  const domainHealth = getDomainHealthMap();
  const [showCrosswalk, setShowCrosswalk] = useState(false);
  const crosswalk = showCrosswalk ? getCrosswalkMatrix() : [];
  const visibleFrameworks = FRAMEWORKS.slice(0, 10);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Compliance Hub" />

      {/* ── Hero Score ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-8">
          <div className="relative" style={{ width: 140, height: 140 }}>
            <ComplianceScoreRing score={overall.score} framework="Overall" color="#3B82F6" size="lg" />
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>
              Governance Posture
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {overall.passing} of {overall.total} controls passing across {FRAMEWORKS.length} frameworks
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#10B981' }}>
                <CheckCircle size={12} /> {overall.passing} Pass
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#F59E0B' }}>
                <AlertTriangle size={12} /> {overall.warning} Warn
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#EF4444' }}>
                <XCircle size={12} /> {overall.failing} Block
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#475569' }}>
                <Clock size={12} /> {overall.pending} Pending
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Framework Grid ──────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Framework Scores</h3>
        <motion.div
          variants={containerVariants} initial="initial" animate="animate"
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          {FRAMEWORKS.map(fw => {
            const score = getFrameworkScore(fw.name);
            return (
              <motion.div key={fw.id} variants={cardVariants}>
                <Link href={`/dashboard/compliance/${fw.id}`}>
                  <div className="ag-card group cursor-pointer" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div className="relative mx-auto" style={{ width: 80, height: 80, marginBottom: '0.75rem' }}>
                      <ComplianceScoreRing score={score.score} framework="" color={fw.color} size="sm" />
                    </div>
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{fw.name}</h4>
                    <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>{fw.fullName}</p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: '#10B981' }}>{score.passing}/{score.total}</span>
                      <span>passing</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" style={{ color: 'var(--color-brand-primary)' }}>
                      View Controls <ChevronRight size={10} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Domain Health Heatmap ───────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Domain Health</h3>
        <motion.div
          variants={containerVariants} initial="initial" animate="animate"
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
        >
          {domainHealth.map(domain => {
            const scoreColor = domain.score.score >= 80 ? '#10B981' : domain.score.score >= 50 ? '#F59E0B' : '#EF4444';
            return (
              <motion.div key={domain.code} variants={cardVariants} className="ag-card" style={{ padding: '1rem' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>{domain.code}</span>
                    <h4 className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{domain.name}</h4>
                  </div>
                  <span className="text-lg font-bold font-mono" style={{ color: scoreColor }}>{domain.score.score}</span>
                </div>
                {/* Score bar */}
                <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--color-bg-overlay)', marginBottom: '0.5rem' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${domain.score.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: scoreColor }}
                  />
                </div>
                <div className="flex gap-3 text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  <span style={{ color: '#10B981' }}>✓ {domain.score.passing}</span>
                  <span style={{ color: '#F59E0B' }}>⚠ {domain.score.warning}</span>
                  <span style={{ color: '#EF4444' }}>✕ {domain.score.failing}</span>
                  <span>○ {domain.score.pending}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Framework Crosswalk Toggle ──────────────────────── */}
      <div>
        <button
          onClick={() => setShowCrosswalk(!showCrosswalk)}
          className="flex items-center gap-2 text-sm font-semibold transition-all"
          style={{ color: 'var(--color-brand-primary)', marginBottom: '0.75rem' }}
        >
          <BarChart3 size={16} />
          {showCrosswalk ? 'Hide' : 'Show'} Framework Crosswalk Table
          <ChevronRight size={14} className={`transition-transform ${showCrosswalk ? 'rotate-90' : ''}`} />
        </button>

        {showCrosswalk && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="ag-card overflow-x-auto" style={{ padding: '1rem' }}>
            <table className="w-full text-[10px] font-mono" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 sticky left-0" style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', minWidth: '180px' }}>Control</th>
                  {visibleFrameworks.map(fw => (
                    <th key={fw.id} className="text-center py-2 px-1" style={{ color: fw.color, minWidth: '60px' }}>{fw.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crosswalk.slice(0, 30).map(row => (
                  <tr key={row.control.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <td className="py-1.5 px-2 sticky left-0" style={{ background: 'var(--color-bg-surface)' }}>
                      <span style={{ color: 'var(--color-brand-primary)' }}>{row.control.id}</span>
                      <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>{row.control.name.slice(0, 35)}{row.control.name.length > 35 ? '...' : ''}</span>
                    </td>
                    {visibleFrameworks.map(fw => (
                      <td key={fw.id} className="text-center py-1.5">
                        {row.frameworkMap[fw.name] ? (
                          <span style={{ color: '#10B981' }}>●</span>
                        ) : (
                          <span style={{ color: 'var(--color-border-subtle)' }}>·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {crosswalk.length > 30 && (
              <p className="text-center text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Showing 30 of {crosswalk.length} controls. Visit individual framework pages for full views.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
