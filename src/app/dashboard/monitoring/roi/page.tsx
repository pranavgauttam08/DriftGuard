'use client';
import React from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import { TrendingUp, Clock, DollarSign, Ticket, ArrowDown, BarChart3 } from 'lucide-react';

const containerVariants = { animate: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const KPI_CARDS = [
  { label: 'Hours Saved', value: '14,200', unit: 'hrs', icon: Clock, color: '#3B82F6', change: '+23%' },
  { label: 'Cost Avoided', value: '$1.1M', unit: '', icon: DollarSign, color: '#10B981', change: '+18%' },
  { label: 'Tickets Resolved by AI', value: '8,400', unit: '', icon: Ticket, color: '#8B5CF6', change: '+31%' },
  { label: 'MTTR Improvement', value: '-67%', unit: '', icon: ArrowDown, color: '#F59E0B', change: 'vs manual' },
];

const DEPT_ROI = [
  { dept: 'Engineering', spend: '$340K', value: '$890K', roi: '162%', bar: 85 },
  { dept: 'Customer Support', spend: '$220K', value: '$780K', roi: '255%', bar: 95 },
  { dept: 'Sales Operations', spend: '$180K', value: '$420K', roi: '133%', bar: 70 },
  { dept: 'Finance & Legal', spend: '$95K', value: '$310K', roi: '226%', bar: 90 },
  { dept: 'HR & Recruitment', spend: '$65K', value: '$180K', roi: '177%', bar: 75 },
];

const AI_SYSTEMS = [
  { name: 'Customer Support Bot', spend: '$28,400/mo', value: '$89,200/mo', status: 'High ROI' },
  { name: 'Code Review Assistant', spend: '$12,300/mo', value: '$45,600/mo', status: 'High ROI' },
  { name: 'Document Analyzer', spend: '$8,900/mo', value: '$22,100/mo', status: 'Medium ROI' },
  { name: 'Sales Copilot', spend: '$15,200/mo', value: '$31,400/mo', status: 'Medium ROI' },
  { name: 'Internal Q&A Bot', spend: '$3,100/mo', value: '$4,200/mo', status: 'Low ROI' },
];

export default function ROIDashboardPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="AI ROI Dashboard" />

      {/* ── Hero Value ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card text-center" style={{ padding: '2rem' }}>
        <p className="text-xs font-mono uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total AI Value Delivered This Quarter</p>
        <h2 className="text-5xl font-bold" style={{ color: '#10B981', letterSpacing: '-0.025em' }}>$2.4M</h2>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Against $900K total AI spend — <span style={{ color: '#10B981' }}>167% ROI</span>
        </p>
      </motion.div>

      {/* ── Impact KPIs ─────────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={cardVariants} className="ag-card" style={{ padding: '1.25rem' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
                <span className="text-[10px] font-mono rounded-full" style={{ padding: '2px 8px', background: `${kpi.color}12`, color: kpi.color, border: `1px solid ${kpi.color}25` }}>{kpi.change}</span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{kpi.value}</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{kpi.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── ROI by Department ───────────────────────────────── */}
      <div className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} style={{ color: 'var(--color-brand-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>ROI by Department</h3>
        </div>
        <div className="space-y-3">
          {DEPT_ROI.map(d => (
            <div key={d.dept}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.dept}</span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span style={{ color: 'var(--color-text-muted)' }}>Spend: {d.spend}</span>
                  <span style={{ color: '#10B981' }}>Value: {d.value}</span>
                  <span className="font-semibold" style={{ color: '#3B82F6' }}>{d.roi}</span>
                </div>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--color-bg-overlay)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${d.bar}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #10B981)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Systems ROI Table ─────────────────────────────── */}
      <div className="ag-card" style={{ padding: '1.5rem' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>AI System Performance</h3>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <th className="text-left py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>System</th>
              <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Monthly Spend</th>
              <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Monthly Value</th>
              <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {AI_SYSTEMS.map(sys => (
              <tr key={sys.name} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td className="py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>{sys.name}</td>
                <td className="text-right py-2.5 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{sys.spend}</td>
                <td className="text-right py-2.5 font-mono" style={{ color: '#10B981' }}>{sys.value}</td>
                <td className="text-right py-2.5">
                  <span className="font-mono text-[10px] rounded-full" style={{
                    padding: '2px 8px',
                    background: sys.status === 'High ROI' ? '#052E16' : sys.status === 'Medium ROI' ? '#2D1D00' : '#1E2536',
                    color: sys.status === 'High ROI' ? '#10B981' : sys.status === 'Medium ROI' ? '#F59E0B' : '#94A3B8',
                    border: `1px solid ${sys.status === 'High ROI' ? 'rgba(16,185,129,0.3)' : sys.status === 'Medium ROI' ? 'rgba(245,158,11,0.3)' : 'var(--color-border-subtle)'}`,
                  }}>{sys.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
