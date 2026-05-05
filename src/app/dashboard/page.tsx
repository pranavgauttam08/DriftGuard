'use client';
import { useDriftGuardContext } from './layout';
import { useUser } from '@clerk/nextjs';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import MetricCard from '@/components/dashboard/MetricCard';
import BehavioralTimeline from '@/components/dashboard/BehavioralTimeline';
import AnomalyFeed from '@/components/dashboard/AnomalyFeed';
import HallucinationTracker from '@/components/dashboard/HallucinationTracker';
import StatusBadge from '@/components/ui/StatusBadge';
import GlowButton from '@/components/ui/GlowButton';
import { Activity, Server, ShieldAlert, Brain, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardOverview() {
  const dg = useDriftGuardContext();
  const { user } = useUser();
  const epId = dg.selectedEndpoint?.id || '';
  const epFps = dg.fingerprints.filter(f => f.endpointId === epId);
  const epDiffs = dg.diffs.filter(d => d.endpointId === epId);
  const epAlerts = dg.alerts.filter(a => a.endpointId === epId);
  const latestDiff = epDiffs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestFp = [...epFps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Sum total responses across ALL user endpoints
  const totalResponses = dg.endpoints.reduce((sum, ep) => sum + ep.totalResponses, 0);

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Determine overall status across all endpoints
  const worstStatus = dg.endpoints.some(e => e.status === 'critical') ? 'critical' :
    dg.endpoints.some(e => e.status === 'warning') ? 'warning' : 'healthy';
  const critCount = dg.endpoints.filter(e => e.status === 'critical').length;
  const warnCount = dg.endpoints.filter(e => e.status === 'warning').length;
  const statusText = critCount > 0 ? `${critCount} critical` : warnCount > 0 ? `${warnCount} warning` : 'all healthy';
  const statusColor = worstStatus === 'critical' ? '#FF3D6B' : worstStatus === 'warning' ? '#FFB800' : '#00FF88';

  const hasData = dg.endpoints.length > 0;

  // Build sparkline from fingerprint data
  const sparkline = epFps
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(fp => Math.round(fp.sampleCount * 10 + Math.random() * 20));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Overview" />

      {/* Greeting bar */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[var(--color-muted-text)]">{greeting}, <span className="text-[var(--color-surface-text)] font-medium">{firstName}</span></span>
        <span className="text-[var(--color-ghost-text)]">✦</span>
        {hasData ? (
          <span className="text-[var(--color-muted-text)]">Your AI systems are <span style={{ color: statusColor }}>{statusText}</span></span>
        ) : (
          <span className="text-[var(--color-muted-text)]">Ready to start monitoring</span>
        )}
      </div>

      {!hasData ? (
        /* Empty state for new users */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center" style={{ padding: '5rem 2rem' }}
        >
          <div className="mx-auto" style={{ width: '80px', height: '80px', marginBottom: '2rem' }}>
            <div className="rounded-full animate-pulse" style={{
              width: '80px', height: '80px',
              background: 'radial-gradient(circle at 35% 35%, rgba(0,255,209,0.2), rgba(0,229,255,0.1), transparent)',
              boxShadow: '0 0 40px rgba(0,255,209,0.1), 0 0 80px rgba(0,255,209,0.05)',
              border: '1px solid rgba(0,255,209,0.15)',
            }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.75rem' }}>
            You haven&apos;t monitored anything yet.
          </h3>
          <p className="text-sm text-[var(--color-muted-text)]" style={{ maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Create your first endpoint and send some responses to see your behavioral analytics here.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/dashboard/endpoints">
              <GlowButton icon={<Plus size={16} />}>Create First Endpoint</GlowButton>
            </Link>
            <Link href="/onboarding">
              <GlowButton variant="ghost" icon={<Sparkles size={16} />}>Try with Example Data</GlowButton>
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Endpoint selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-muted-text)] font-mono">Viewing:</span>
            <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
          </div>

          {/* Top metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            <MetricCard
              title="Total Responses"
              value={dg.selectedEndpoint?.totalResponses || 0}
              icon={<Activity size={18} />}
              trend={totalResponses > 0 ? 'up' : 'neutral'}
              delta={dg.selectedEndpoint?.totalResponses || 0}
              deltaLabel="this endpoint"
              sparkline={sparkline.length > 2 ? sparkline : [0, 0, 0]}
            />
            <MetricCard
              title="Active Endpoints"
              value={dg.endpoints.length}
              icon={<Server size={18} />}
              status={worstStatus as any}
            />
            <MetricCard
              title="Last Verdict"
              value={0}
              prefix=""
              suffix=""
              icon={<ShieldAlert size={18} />}
              status={latestDiff?.verdict === 'BLOCK' ? 'critical' : latestDiff?.verdict === 'WARN' ? 'warning' : 'healthy'}
              halo={latestDiff?.verdict === 'BLOCK'}
            />
            <MetricCard
              title="Hallucination Score"
              value={latestFp?.hallucinationScore || 0}
              format="percent"
              icon={<Brain size={18} />}
              status={latestFp?.hallucinationScore ? (latestFp.hallucinationScore > 0.2 ? 'critical' : latestFp.hallucinationScore > 0.1 ? 'warning' : 'healthy') : 'healthy'}
              delta={latestDiff?.hallucinationDelta}
              deltaLabel="vs prev version"
              trend={latestDiff?.hallucinationDelta ? (latestDiff.hallucinationDelta > 0 ? 'down' : 'up') : 'neutral'}
              halo={(latestFp?.hallucinationScore || 0) > 0.2}
            />
          </div>

          {/* Middle: Timeline + Anomaly Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.25rem' }}>
            {epFps.length > 0 ? (
              <BehavioralTimeline fingerprints={epFps} />
            ) : (
              <div className="bio-card flex items-center justify-center" style={{ padding: '3rem', minHeight: '220px' }}>
                <div className="text-center">
                  <p className="text-sm text-[var(--color-muted-text)]">No version data for <strong>{dg.selectedEndpoint?.name}</strong></p>
                  <p className="text-xs text-[var(--color-ghost-text)] mt-2">Send data via the Endpoints page to see the timeline</p>
                </div>
              </div>
            )}
            <AnomalyFeed alerts={epAlerts.length > 0 ? epAlerts : dg.alerts.slice(0, 5)} />
          </div>

          {/* Bottom: Hallucination + Latest Diff */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {epFps.length > 0 ? (
              <HallucinationTracker fingerprints={epFps} />
            ) : (
              <div className="bio-card flex items-center justify-center" style={{ padding: '3rem', minHeight: '200px' }}>
                <p className="text-sm text-[var(--color-muted-text)]">Hallucination data will appear after version tracking</p>
              </div>
            )}

            {latestDiff ? (
              <div className="bio-card" style={{ padding: '1.5rem' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
                  <h3 className="text-sm font-semibold">Latest Diff</h3>
                  <StatusBadge status={latestDiff.verdict === 'BLOCK' ? 'block' : latestDiff.verdict === 'WARN' ? 'warn' : 'pass'} />
                </div>
                <div className="text-xs font-mono text-[var(--color-muted-text)]" style={{ marginBottom: '0.75rem' }}>{latestDiff.baseVersion} → {latestDiff.newVersion}</div>
                <p className="text-sm text-[var(--color-surface-text)] leading-relaxed" style={{ marginBottom: '1.25rem' }}>{latestDiff.verdictReason}</p>
                <div className="space-y-2">
                  {latestDiff.regressions.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg" style={{ padding: '0.75rem', background: 'rgba(255,61,107,0.04)', border: '1px solid rgba(255,61,107,0.15)' }}>
                      <span className="text-xs">{r.dimension}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--color-muted-text)]">{r.baseValue.toFixed(2)} → {r.newValue.toFixed(2)}</span>
                        <StatusBadge status={r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'block' : 'warn'} size="sm" label={r.severity.toUpperCase()} />
                      </div>
                    </div>
                  ))}
                  {latestDiff.improvements.map((imp, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg" style={{ padding: '0.75rem', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)' }}>
                      <span className="text-xs">{imp.dimension}</span>
                      <span className="text-[10px] font-mono text-[var(--color-biolume-tertiary)]">+{Math.abs(imp.delta).toFixed(2)} ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bio-card flex items-center justify-center" style={{ padding: '3rem', minHeight: '200px' }}>
                <div className="text-center">
                  <p className="text-sm text-[var(--color-muted-text)]">No diffs generated yet</p>
                  <p className="text-xs text-[var(--color-ghost-text)] mt-2">Send 2+ versions to compare behavior</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
