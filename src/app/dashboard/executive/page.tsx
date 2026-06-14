'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import MetricCard from '@/components/dashboard/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { motion } from 'framer-motion';
import {
  Shield, Activity, AlertTriangle, CheckCircle, TrendingUp,
  Server, Clock, Zap, Target, BarChart3,
} from 'lucide-react';

export default function ExecutiveDashboard() {
  const dg = useDriftGuardContext();

  // ── Org-wide aggregates ───────────────────────────────
  const totalEndpoints = dg.endpoints.length;
  const criticalEndpoints = dg.endpoints.filter(e => e.status === 'critical').length;
  const warningEndpoints = dg.endpoints.filter(e => e.status === 'warning').length;
  const healthyEndpoints = dg.endpoints.filter(e => e.status === 'healthy').length;

  const totalResponses = dg.endpoints.reduce((sum, ep) => sum + ep.totalResponses, 0);
  const totalVersions = dg.fingerprints.length;
  const totalDiffs = dg.diffs.length;
  const totalAlerts = dg.alerts.length;

  // Deployment stats
  const passCount = dg.diffs.filter(d => d.verdict === 'PASS').length;
  const warnCount = dg.diffs.filter(d => d.verdict === 'WARN').length;
  const blockCount = dg.diffs.filter(d => d.verdict === 'BLOCK').length;
  const deploySuccessRate = totalDiffs > 0 ? passCount / totalDiffs : 1;

  // Average hallucination across latest fingerprints per endpoint
  const latestFps = dg.endpoints.map(ep => {
    const epFps = dg.fingerprints.filter(f => f.endpointId === ep.id);
    return epFps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }).filter(Boolean);

  const avgHallucination = latestFps.length > 0
    ? latestFps.reduce((sum, fp) => sum + (fp?.hallucinationScore || 0), 0) / latestFps.length
    : 0;

  const avgConsistency = latestFps.length > 0
    ? latestFps.reduce((sum, fp) => sum + (fp?.topicConsistency || 0), 0) / latestFps.length
    : 0;

  // Risk score: composite metric
  const riskScore = Math.min(100, Math.round(
    (criticalEndpoints * 30) +
    (warningEndpoints * 10) +
    (avgHallucination * 100) +
    (blockCount * 5)
  ));

  const riskLevel = riskScore > 60 ? 'critical' : riskScore > 30 ? 'warning' : 'healthy';
  const riskColor = riskLevel === 'critical' ? '#FF3D6B' : riskLevel === 'warning' ? '#FFB800' : '#00FF88';

  // Sparkline from diffs over time
  const diffSparkline = dg.diffs
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-12)
    .map(d => d.verdict === 'PASS' ? 1 : d.verdict === 'WARN' ? 0.5 : 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Executive Overview" />

      {/* ── Risk Score Hero ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bio-card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Glow background */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
          background: `radial-gradient(circle at 80% 20%, ${riskColor}12, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} style={{ color: riskColor }} />
              <h2 className="text-lg font-semibold text-[var(--color-surface-text)]">Organization Health</h2>
              <StatusBadge status={riskLevel === 'critical' ? 'critical' : riskLevel === 'warning' ? 'warn' : 'pass'}
                label={riskLevel.toUpperCase()} />
            </div>
            <p className="text-sm text-[var(--color-muted-text)] max-w-md leading-relaxed">
              {riskScore <= 15 ? 'All AI systems are operating within expected behavioral parameters.' :
               riskScore <= 40 ? 'Some endpoints show behavioral drift. Review recommended.' :
               'Multiple systems exhibiting significant behavioral changes. Immediate attention required.'}
            </p>
          </div>

          {/* Risk score gauge */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: '96px', height: '96px' }}>
              <svg viewBox="0 0 96 96" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="48" cy="48" r="40" fill="none" stroke="var(--color-border)" strokeWidth="6" opacity="0.3" />
                <circle cx="48" cy="48" r="40" fill="none" stroke={riskColor} strokeWidth="6"
                  strokeDasharray={`${(riskScore / 100) * 251} 251`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${riskColor}60)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono" style={{ color: riskColor }}>{riskScore}</span>
                <span className="text-[9px] text-[var(--color-ghost-text)] uppercase tracking-wider">risk</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Top Metric Cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <MetricCard title="Endpoints" value={totalEndpoints} icon={<Server size={16} />}
          status={criticalEndpoints > 0 ? 'critical' : warningEndpoints > 0 ? 'warning' : 'healthy'} />
        <MetricCard title="Responses" value={totalResponses} icon={<Activity size={16} />} trend="up" />
        <MetricCard title="Deploy Rate" value={deploySuccessRate} format="percent" icon={<CheckCircle size={16} />}
          status={deploySuccessRate < 0.5 ? 'critical' : deploySuccessRate < 0.8 ? 'warning' : 'healthy'}
          sparkline={diffSparkline.length > 2 ? diffSparkline.map(v => Math.round(v * 100)) : undefined} />
        <MetricCard title="Avg Hallucination" value={avgHallucination} format="percent" icon={<AlertTriangle size={16} />}
          status={avgHallucination > 0.2 ? 'critical' : avgHallucination > 0.1 ? 'warning' : 'healthy'} />
        <MetricCard title="Consistency" value={avgConsistency} format="percent" icon={<Target size={16} />}
          status={avgConsistency < 0.7 ? 'warning' : 'healthy'} />
      </div>

      {/* ── Cross-Project Comparison ─────────────────────── */}
      <div className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} style={{ color: 'var(--color-biolume-primary)' }} />
          <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">Cross-Endpoint Comparison</h3>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr', fontSize: '10px', color: 'var(--color-ghost-text)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 0.5rem' }}>
            <span>Endpoint</span>
            <span>Status</span>
            <span>Hallucination</span>
            <span>Consistency</span>
            <span>Versions</span>
            <span>Responses</span>
          </div>

          {dg.endpoints.map((ep, idx) => {
            const epFps = dg.fingerprints.filter(f => f.endpointId === ep.id);
            const latestFp = epFps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const hall = latestFp?.hallucinationScore || 0;
            const cons = latestFp?.topicConsistency || 0;
            const hallColor = hall > 0.2 ? '#FF3D6B' : hall > 0.1 ? '#FFB800' : '#00FF88';
            const consColor = cons < 0.7 ? '#FFB800' : '#00FF88';

            return (
              <motion.div key={ep.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid gap-3 items-center rounded-lg"
                style={{
                  gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr',
                  padding: '0.75rem 0.5rem',
                  background: 'rgba(0,255,209,0.02)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Endpoint name */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: ep.status === 'critical' ? '#FF3D6B' : ep.status === 'warning' ? '#FFB800' : '#00FF88',
                    boxShadow: `0 0 6px ${ep.status === 'critical' ? '#FF3D6B' : ep.status === 'warning' ? '#FFB800' : '#00FF88'}40`,
                  }} />
                  <span className="text-xs font-medium text-[var(--color-surface-text)] truncate">{ep.name}</span>
                </div>

                {/* Status */}
                <StatusBadge status={ep.status === 'critical' ? 'critical' : ep.status === 'warning' ? 'warn' : 'pass'} size="sm" />

                {/* Hallucination bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)]">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(100, hall * 100 * 3)}%`,
                      background: hallColor,
                      boxShadow: `0 0 4px ${hallColor}40`,
                    }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: hallColor, minWidth: '32px' }}>{(hall * 100).toFixed(1)}%</span>
                </div>

                {/* Consistency */}
                <span className="text-xs font-mono" style={{ color: consColor }}>{(cons * 100).toFixed(0)}%</span>

                {/* Versions */}
                <span className="text-xs font-mono text-[var(--color-muted-text)]">{epFps.length}</span>

                {/* Responses */}
                <span className="text-xs font-mono text-[var(--color-muted-text)]">{ep.totalResponses.toLocaleString()}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Deployment & Verdict Trends ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Verdict breakdown */}
        <div className="bio-card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: 'var(--color-biolume-primary)' }} />
            <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">Verdict Distribution</h3>
          </div>

          <div className="flex items-end justify-center gap-6" style={{ height: '140px', paddingBottom: '1rem' }}>
            {[
              { label: 'PASS', count: passCount, color: '#00FF88', icon: CheckCircle },
              { label: 'WARN', count: warnCount, color: '#FFB800', icon: AlertTriangle },
              { label: 'BLOCK', count: blockCount, color: '#FF3D6B', icon: Shield },
            ].map(({ label, count, color, icon: Icon }) => {
              const maxCount = Math.max(passCount, warnCount, blockCount, 1);
              const height = Math.max(8, (count / maxCount) * 100);

              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="w-12 rounded-t-md"
                    style={{
                      background: `linear-gradient(to top, ${color}30, ${color}60)`,
                      border: `1px solid ${color}40`,
                      borderBottom: 'none',
                      boxShadow: `0 0 12px ${color}15`,
                    }}
                  />
                  <div className="text-center">
                    <Icon size={12} style={{ color, margin: '0 auto 2px' }} />
                    <div className="text-lg font-bold font-mono" style={{ color }}>{count}</div>
                    <div className="text-[9px] text-[var(--color-ghost-text)] uppercase tracking-wider">{label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success rate bar */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[var(--color-ghost-text)] uppercase tracking-wider">Deploy Success Rate</span>
              <span className="text-sm font-mono font-bold" style={{
                color: deploySuccessRate >= 0.8 ? '#00FF88' : deploySuccessRate >= 0.5 ? '#FFB800' : '#FF3D6B',
              }}>{(deploySuccessRate * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-border)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deploySuccessRate * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: deploySuccessRate >= 0.8 ? 'linear-gradient(90deg, #00FF88, #00FFD1)' :
                    deploySuccessRate >= 0.5 ? 'linear-gradient(90deg, #FFB800, #FFDA6B)' :
                    'linear-gradient(90deg, #FF3D6B, #FF7A9A)',
                  boxShadow: `0 0 8px ${deploySuccessRate >= 0.8 ? '#00FF88' : '#FFB800'}40`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bio-card" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: 'var(--color-biolume-primary)' }} />
            <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">Recent Activity</h3>
          </div>

          <div className="space-y-2.5" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {dg.diffs
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 8)
              .map((diff, idx) => {
                const endpoint = dg.endpoints.find(e => e.id === diff.endpointId);
                const color = diff.verdict === 'PASS' ? '#00FF88' : diff.verdict === 'WARN' ? '#FFB800' : '#FF3D6B';

                return (
                  <motion.div key={diff.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ background: 'rgba(0,255,209,0.02)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}40` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--color-surface-text)] truncate">{endpoint?.name || 'Unknown'}</span>
                        <StatusBadge status={diff.verdict === 'PASS' ? 'pass' : diff.verdict === 'WARN' ? 'warn' : 'block'} size="sm" />
                      </div>
                      <span className="text-[10px] font-mono text-[var(--color-ghost-text)]">{diff.baseVersion} → {diff.newVersion}</span>
                    </div>
                    <span className="text-[9px] text-[var(--color-ghost-text)] flex-shrink-0">
                      {timeAgo(new Date(diff.createdAt))}
                    </span>
                  </motion.div>
                );
              })}

            {dg.diffs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--color-muted-text)]">No behavioral diffs yet</p>
                <p className="text-xs text-[var(--color-ghost-text)] mt-1">Deploy 2+ versions to see activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Endpoint Health Grid ──────────────────────────── */}
      <div className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: 'var(--color-biolume-primary)' }} />
          <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">Health Summary</h3>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Healthy', count: healthyEndpoints, color: '#00FF88', icon: CheckCircle },
            { label: 'Warning', count: warningEndpoints, color: '#FFB800', icon: AlertTriangle },
            { label: 'Critical', count: criticalEndpoints, color: '#FF3D6B', icon: Shield },
          ].map(({ label, count, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg" style={{
              background: `${color}06`,
              border: `1px solid ${color}20`,
            }}>
              <div className="p-2 rounded-lg" style={{ background: `${color}10` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-bold font-mono" style={{ color }}>{count}</div>
                <div className="text-[10px] text-[var(--color-ghost-text)] uppercase tracking-wider">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
