'use client';
import { useDriftGuardContext } from './layout';
import { useUser } from '@clerk/nextjs';
import TopBar from '@/components/dashboard/TopBar';
import StatusBadge from '@/components/ui/StatusBadge';
import ComplianceScoreRing from '@/components/governance/ComplianceScoreRing';
import { getOverallScore, getDomainHealthMap, getActiveAlertCount, getCriticalControls } from '@/lib/controls-engine';
import { Activity, Shield, Bell, ShieldCheck, AlertTriangle, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const MOCK_ALERTS = [
  { id: '1', severity: 'critical', title: 'Hallucination spike detected on Support Bot v3.2', time: '12m ago', framework: 'NIST AI RMF' },
  { id: '2', severity: 'high', title: 'PII detected in LLM output — PR-02 control failing', time: '34m ago', framework: 'GDPR' },
  { id: '3', severity: 'high', title: 'Behavioral drift exceeds threshold on Code Review Bot', time: '1h ago', framework: 'ISO42001' },
  { id: '4', severity: 'medium', title: 'Shadow AI usage detected — 3 new tools this week', time: '2h ago', framework: 'SOC2' },
  { id: '5', severity: 'medium', title: 'Cost forecast exceeded 80% monthly budget threshold', time: '3h ago', framework: 'Internal' },
];

export default function DashboardOverview() {
  const dg = useDriftGuardContext();
  const { user } = useUser();
  const overall = getOverallScore();
  const domainHealth = getDomainHealthMap();
  const alertCount = getActiveAlertCount();
  const criticalControls = getCriticalControls();

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Control Tower" />

      {/* Greeting */}
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: 'var(--color-text-secondary)' }}>{greeting}, <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{firstName}</span></span>
        <span style={{ color: 'var(--color-text-muted)' }}>·</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          Governance score: <span className="font-mono font-semibold" style={{ color: overall.score >= 70 ? '#10B981' : '#F59E0B' }}>{overall.score}/100</span>
        </span>
      </div>

      {/* ── Top KPI Row ─────────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        {/* Governance Score */}
        <motion.div variants={cardVariants} className="ag-card flex items-center gap-3" style={{ padding: '1.25rem' }}>
          <div className="relative" style={{ width: 64, height: 64 }}>
            <ComplianceScoreRing score={overall.score} framework="" color="#3B82F6" size="sm" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Governance</div>
            <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{overall.score}<span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>/100</span></div>
          </div>
        </motion.div>

        {/* Controls Passing */}
        <motion.div variants={cardVariants} className="ag-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} style={{ color: '#10B981' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Controls Passing</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#10B981' }}>
            {overall.passing}<span className="text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>/{overall.total}</span>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div variants={cardVariants} className="ag-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} style={{ color: '#EF4444' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Active Alerts</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#EF4444' }}>
            {alertCount}
          </div>
        </motion.div>

        {/* Frameworks */}
        <motion.div variants={cardVariants} className="ag-card" style={{ padding: '1.25rem' }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} style={{ color: '#3B82F6' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Frameworks</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#3B82F6' }}>14</div>
        </motion.div>
      </motion.div>

      {/* ── Middle Row: Domain Heatmap + Alert Feed ──────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Domain Health Heatmap */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Activity size={14} style={{ color: 'var(--color-brand-primary)' }} /> Domain Health
          </h3>
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-3 gap-2 max-lg:grid-cols-2">
            {domainHealth.map(d => {
              const sc = d.score.score >= 80 ? '#10B981' : d.score.score >= 50 ? '#F59E0B' : '#EF4444';
              return (
                <motion.div key={d.code} variants={cardVariants} className="ag-card group cursor-pointer" style={{ padding: '0.75rem' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono font-semibold" style={{ color: 'var(--color-brand-primary)', letterSpacing: '0.05em' }}>{d.code}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: sc }}>{d.score.score}</span>
                  </div>
                  <h4 className="text-[11px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)', minHeight: '28px' }}>{d.name}</h4>
                  <div className="w-full rounded-full overflow-hidden mt-2" style={{ height: '3px', background: 'var(--color-bg-overlay)' }}>
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${d.score.score}%` }} transition={{ duration: 0.6 }} style={{ background: sc }} />
                  </div>
                  <div className="flex gap-2 mt-1.5 text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    <span style={{ color: '#10B981' }}>✓{d.score.passing}</span>
                    <span style={{ color: '#F59E0B' }}>⚠{d.score.warning}</span>
                    <span style={{ color: '#EF4444' }}>✕{d.score.failing}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Live Alert Feed */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Bell size={14} style={{ color: '#EF4444' }} /> Live Alerts
          </h3>
          <div className="space-y-2">
            {MOCK_ALERTS.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ag-card group cursor-pointer"
                style={{ padding: '0.75rem 1rem' }}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 rounded-full animate-pulse-dot" style={{
                    width: '6px', height: '6px', flexShrink: 0,
                    background: alert.severity === 'critical' ? '#EF4444' : alert.severity === 'high' ? '#F59E0B' : '#3B82F6',
                    boxShadow: `0 0 6px ${alert.severity === 'critical' ? '#EF4444' : alert.severity === 'high' ? '#F59E0B' : '#3B82F6'}`,
                  }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: 'var(--color-text-primary)' }}>{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{alert.time}</span>
                      <span style={{ color: 'var(--color-brand-primary)' }}>{alert.framework}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <Link href="/dashboard/alerts">
              <div className="flex items-center justify-center gap-1 text-[11px] py-2 transition-all" style={{ color: 'var(--color-brand-primary)' }}>
                View all alerts <ChevronRight size={12} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Critical Controls Needing Attention ──────────────── */}
      {criticalControls.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#EF4444' }}>
            <AlertTriangle size={14} /> Critical Controls Needing Attention ({criticalControls.length})
          </h3>
          <div className="grid grid-cols-2 gap-2 max-lg:grid-cols-1">
            {criticalControls.slice(0, 4).map(c => (
              <div key={c.id} className="ag-card flex items-center gap-3" style={{ padding: '0.75rem 1rem' }}>
                <StatusBadge status={c.assessment.status} size="sm" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--color-brand-primary)' }}>{c.id}</span>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
