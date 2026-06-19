'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Lightbulb,
  AlertTriangle, ArrowRight, Zap, Target, Shield, ChevronDown,
} from 'lucide-react';
import {
  generateCostHistory, calculateMetrics, generateForecasts,
  compareModels, getOptimizationSuggestions,
} from '@/lib/cost-engine';

type Tab = 'overview' | 'forecast' | 'compare' | 'alerts' | 'optimize';

const TAB_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'forecast', label: 'Forecasting', icon: TrendingUp },
  { id: 'compare', label: 'Comparison', icon: Target },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'optimize', label: 'Optimization', icon: Lightbulb },
];

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export default function CostIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const history = useMemo(() => generateCostHistory(30), []);
  const metrics = useMemo(() => calculateMetrics(history), [history]);
  const forecasts = useMemo(() => generateForecasts(history), [history]);
  const comparisons = useMemo(() => compareModels(), []);
  const suggestions = useMemo(() => getOptimizationSuggestions(history), [history]);

  // Aggregate daily costs for sparkline
  const dailyCosts = useMemo(() => {
    const byDay: Record<string, number> = {};
    history.forEach(h => { byDay[h.date] = (byDay[h.date] || 0) + h.costUsd; });
    return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [history]);
  const maxDaily = Math.max(...dailyCosts, 1);

  // Cost alerts
  const costAlerts = [
    metrics.budgetUtilization > 80 && { severity: 'warning' as const, message: `Budget utilization at ${metrics.budgetUtilization.toFixed(0)}% — approaching ${fmt(metrics.budget)} monthly limit`, time: 'now' },
    metrics.growthRate > 20 && { severity: 'warning' as const, message: `Cost growth rate of ${metrics.growthRate.toFixed(0)}% detected over past 15 days`, time: '2h ago' },
    metrics.riskScore > 60 && { severity: 'critical' as const, message: `Cost risk score is ${metrics.riskScore}/100 — consider reviewing usage patterns`, time: '1h ago' },
    { severity: 'info' as const, message: `${suggestions.length} optimization opportunities identified — potential savings of ${fmt(suggestions.reduce((s, o) => s + o.savingsUsd, 0))}`, time: '3h ago' },
  ].filter(Boolean) as { severity: string; message: string; time: string }[];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Cost Intelligence" />

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {TAB_ITEMS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
              style={{
                padding: '8px 14px',
                background: activeTab === tab.id ? 'rgba(0,255,209,0.08)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(0,255,209,0.25)' : 'rgba(0,255,209,0.06)'}`,
                color: activeTab === tab.id ? '#00FFD1' : '#5A7A7D',
              }}>
              <Icon size={12} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Today\'s Cost', value: fmt(metrics.todaysCost), color: '#00FFD1', icon: DollarSign },
              { label: 'Monthly Cost', value: fmt(metrics.monthlyCost), color: '#00E5FF', icon: BarChart3 },
              { label: 'Annual Projected', value: fmt(metrics.annualProjected), color: '#FFB800', icon: TrendingUp },
              { label: 'Total Requests', value: metrics.totalRequests.toLocaleString(), color: '#00FF88', icon: Zap },
            ].map((card, i) => {
              const CardIcon = card.icon;
              return (
                <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bio-card" style={{ padding: '1.25rem' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase">{card.label}</span>
                    <CardIcon size={14} style={{ color: card.color }} />
                  </div>
                  <span className="text-xl font-bold" style={{ color: card.color }}>{card.value}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Budget + Efficiency + Risk */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {/* Budget Utilization */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.25rem' }}>
              <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">Budget Utilization</div>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold" style={{ color: metrics.budgetUtilization > 80 ? '#FF3D6B' : metrics.budgetUtilization > 60 ? '#FFB800' : '#00FF88' }}>
                  {metrics.budgetUtilization.toFixed(0)}%
                </span>
                <span className="text-[10px] text-[var(--color-ghost-text)] mb-1">of {fmt(metrics.budget)}/mo</span>
              </div>
              <div className="w-full rounded-full overflow-hidden mt-2" style={{ height: '4px', background: 'rgba(0,255,209,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, metrics.budgetUtilization)}%`,
                  background: metrics.budgetUtilization > 80 ? '#FF3D6B' : metrics.budgetUtilization > 60 ? '#FFB800' : '#00FF88',
                }} />
              </div>
            </motion.div>

            {/* Efficiency Score */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bio-card" style={{ padding: '1.25rem' }}>
              <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">Cost Efficiency</div>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold text-[#00FF88]">{metrics.efficiencyScore}</span>
                <span className="text-[10px] text-[var(--color-ghost-text)] mb-1">/100</span>
              </div>
              <span className="text-[10px] text-[var(--color-muted-text)]">
                {metrics.efficiencyScore > 70 ? 'Excellent output per dollar' : 'Room for improvement'}
              </span>
            </motion.div>

            {/* Risk Score */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bio-card" style={{ padding: '1.25rem' }}>
              <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">Cost Risk</div>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold" style={{ color: metrics.riskScore > 60 ? '#FF3D6B' : metrics.riskScore > 30 ? '#FFB800' : '#00FF88' }}>
                  {metrics.riskScore}
                </span>
                <span className="text-[10px] text-[var(--color-ghost-text)] mb-1">/100</span>
              </div>
              <span className="text-[10px] text-[var(--color-muted-text)]">
                {metrics.riskScore > 60 ? 'High risk — review immediately' : metrics.riskScore > 30 ? 'Moderate risk' : 'Low risk'}
              </span>
            </motion.div>
          </div>

          {/* Daily cost sparkline */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.25rem' }}>
            <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">Daily Cost (Last 30 Days)</div>
            <div className="flex items-end gap-px" style={{ height: '80px' }}>
              {dailyCosts.map((cost, i) => (
                <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(cost / maxDaily) * 100}%`,
                    background: cost > metrics.avgDailyCost * 1.5 ? '#FF3D6B' : cost > metrics.avgDailyCost ? '#FFB800' : '#00FFD1',
                    minHeight: '2px', opacity: 0.7,
                  }}
                  title={`$${cost.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-[var(--color-ghost-text)]">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </motion.div>
        </>
      )}

      {/* ── FORECAST ──────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {forecasts.map((fc, i) => (
              <motion.div key={fc.period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bio-card" style={{ padding: '1.25rem' }}>
                <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">
                  {fc.period === '30d' ? '30 Days' : fc.period === '90d' ? '90 Days' : fc.period === '180d' ? '6 Months' : '12 Months'}
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Expected', value: fmt(fc.expected), color: '#00FFD1' },
                    { label: 'Maximum', value: fmt(fc.maximum), color: '#FFB800' },
                    { label: 'Worst Case', value: fmt(fc.worstCase), color: '#FF3D6B' },
                    { label: 'Growth Cost', value: fmt(fc.growthCost), color: '#00E5FF' },
                    { label: 'Retry Cost', value: fmt(fc.retryCost), color: '#5A7A7D' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-muted-text)]">{row.label}</span>
                      <span className="font-mono font-semibold" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Mini bar */}
                <div className="mt-3 rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(0,255,209,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (fc.expected / fc.worstCase) * 100)}%`, background: '#00FFD1' }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPARISON ────────────────────────────────────────── */}
      {activeTab === 'compare' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.5rem' }}>
          <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-4">
            Claude Model Comparison (30k requests/month)
          </div>

          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Model', 'Monthly Cost', 'Cost/Request', 'Quality', 'Latency', 'Risk', 'ROI'].map(h => (
                    <th key={h} className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase text-left"
                      style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,255,209,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisons.map(comp => (
                  <tr key={comp.model.id} className="hover:bg-[rgba(0,255,209,0.02)] transition-colors">
                    <td style={{ padding: '12px' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono rounded-full px-2 py-0.5"
                          style={{
                            background: comp.model.tier === 'premium' ? 'rgba(255,61,107,0.08)' : comp.model.tier === 'standard' ? 'rgba(255,184,0,0.08)' : 'rgba(0,255,136,0.08)',
                            color: comp.model.tier === 'premium' ? '#FF3D6B' : comp.model.tier === 'standard' ? '#FFB800' : '#00FF88',
                          }}>{comp.model.tier}</span>
                        <span className="text-sm font-semibold text-[var(--color-surface-text)]">{comp.model.name}</span>
                      </div>
                    </td>
                    <td className="text-sm font-mono text-[var(--color-surface-text)]" style={{ padding: '12px' }}>{fmt(comp.monthlyCost)}</td>
                    <td className="text-xs font-mono text-[var(--color-muted-text)]" style={{ padding: '12px' }}>${comp.costPerRequest.toFixed(4)}</td>
                    <td style={{ padding: '12px' }}>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full overflow-hidden" style={{ width: '60px', height: '4px', background: 'rgba(0,255,209,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${comp.qualityScore}%`, background: '#00FF88' }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#00FF88]">{comp.qualityScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full overflow-hidden" style={{ width: '60px', height: '4px', background: 'rgba(0,255,209,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${comp.latencyScore}%`, background: '#00E5FF' }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#00E5FF]">{comp.latencyScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="text-xs font-mono" style={{ color: comp.riskScore > 25 ? '#FFB800' : '#00FF88' }}>{comp.riskScore}%</span>
                    </td>
                    <td className="text-xs font-mono font-semibold text-[#00FFD1]" style={{ padding: '12px' }}>{comp.roi.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── ALERTS ─────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {costAlerts.map((alert, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bio-card flex items-start gap-3" style={{ padding: '1.25rem' }}>
              <AlertTriangle size={16} style={{
                color: alert.severity === 'critical' ? '#FF3D6B' : alert.severity === 'warning' ? '#FFB800' : '#00E5FF',
                marginTop: '2px', flexShrink: 0,
              }} />
              <div className="flex-1">
                <span className="text-sm text-[var(--color-surface-text)]">{alert.message}</span>
                <span className="block text-[10px] text-[var(--color-ghost-text)] mt-1">{alert.time}</span>
              </div>
              <span className="text-[9px] font-mono rounded-full"
                style={{
                  padding: '2px 8px',
                  background: alert.severity === 'critical' ? 'rgba(255,61,107,0.08)' : alert.severity === 'warning' ? 'rgba(255,184,0,0.08)' : 'rgba(0,229,255,0.08)',
                  color: alert.severity === 'critical' ? '#FF3D6B' : alert.severity === 'warning' ? '#FFB800' : '#00E5FF',
                }}>{alert.severity}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── OPTIMIZATION ──────────────────────────────────────── */}
      {activeTab === 'optimize' && (
        <div className="space-y-4">
          <div className="bio-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#FFB800]" />
              <span className="text-sm font-semibold text-[var(--color-surface-text)]">{suggestions.length} Optimization Opportunities</span>
            </div>
            <span className="text-sm font-mono font-bold text-[#00FF88]">
              Save up to {fmt(suggestions.reduce((s, o) => s + o.savingsUsd, 0))}/month
            </span>
          </div>

          {suggestions.map((sug, i) => (
            <motion.div key={sug.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bio-card" style={{ padding: '1.5rem' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-muted-text)]">{sug.currentModel}</span>
                  <ArrowRight size={14} className="text-[var(--color-ghost-text)]" />
                  <span className="text-sm font-semibold text-[#00FFD1]">{sug.suggestedModel}</span>
                </div>
                <span className="text-lg font-bold text-[#00FF88]">-{sug.savingsPercent}%</span>
              </div>

              <p className="text-xs text-[var(--color-muted-text)] mb-3">{sug.reason}</p>

              <div className="flex gap-4 text-[10px]">
                <span className="font-mono rounded-full" style={{ padding: '2px 8px', background: 'rgba(0,255,136,0.06)', color: '#00FF88' }}>
                  Save {fmt(sug.savingsUsd)}/mo
                </span>
                <span className="font-mono rounded-full" style={{ padding: '2px 8px', background: 'rgba(0,229,255,0.06)', color: '#00E5FF' }}>
                  {sug.workloadType}
                </span>
                <span className="font-mono rounded-full" style={{
                  padding: '2px 8px',
                  background: sug.qualityImpact === 'better' ? 'rgba(0,255,136,0.06)' : sug.qualityImpact === 'similar' ? 'rgba(0,229,255,0.06)' : 'rgba(255,184,0,0.06)',
                  color: sug.qualityImpact === 'better' ? '#00FF88' : sug.qualityImpact === 'similar' ? '#00E5FF' : '#FFB800',
                }}>
                  Quality: {sug.qualityImpact}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
