'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import RegressionHeatmap from '@/components/dashboard/RegressionHeatmap';
import RadarFingerprint from '@/components/dashboard/RadarFingerprint';
import StatusBadge from '@/components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function RegressionsPage() {
  const dg = useDriftGuardContext();
  const fps = dg.fingerprints.filter(f => f.endpointId === dg.selectedEndpoint?.id);
  const epDiffs = dg.diffs.filter(d => d.endpointId === dg.selectedEndpoint?.id);
  const sorted = [...fps].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const base = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const latest = sorted[sorted.length - 1] || null;
  const latestDiff = epDiffs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Regressions" />

      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-[var(--color-text-secondary)] font-mono">Viewing:</span>
        <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
        {latestDiff && (
          <StatusBadge
            status={latestDiff.verdict === 'BLOCK' ? 'block' : latestDiff.verdict === 'WARN' ? 'warn' : 'pass'}
            label={`${latestDiff.baseVersion} → ${latestDiff.newVersion}: ${latestDiff.verdict}`}
          />
        )}
      </div>

      {fps.length < 2 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" style={{ padding: '5rem 2rem' }}>
          <AlertTriangle size={40} className="mx-auto text-[var(--color-text-muted)]" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem' }}>Not enough data for regression analysis</h3>
          <p className="text-sm text-[var(--color-text-secondary)]" style={{ maxWidth: '400px', margin: '0 auto' }}>
            Send data for at least <strong>2 different versions</strong> of <strong>{dg.selectedEndpoint?.name}</strong> to compare behavioral fingerprints and detect regressions.
          </p>
        </motion.div>
      ) : (
        <>
          <RegressionHeatmap fingerprints={fps} />

          {/* Show diff details if available */}
          {latestDiff && (
            <div className="ag-card" style={{ padding: '1.5rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
                <h3 className="text-sm font-semibold">Latest Diff: {latestDiff.baseVersion} → {latestDiff.newVersion}</h3>
                <StatusBadge status={latestDiff.verdict === 'BLOCK' ? 'block' : latestDiff.verdict === 'WARN' ? 'warn' : 'pass'} />
              </div>
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed" style={{ marginBottom: '1.25rem' }}>{latestDiff.verdictReason}</p>
              <div className="space-y-2">
                {latestDiff.regressions.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg" style={{ padding: '0.75rem', background: 'rgba(255,61,107,0.04)', border: '1px solid rgba(255,61,107,0.15)' }}>
                    <span className="text-xs">{r.dimension}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{r.baseValue.toFixed(2)} → {r.newValue.toFixed(2)}</span>
                      <StatusBadge status={r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'block' : 'warn'} size="sm" label={r.severity.toUpperCase()} />
                    </div>
                  </div>
                ))}
                {latestDiff.improvements.map((imp, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg" style={{ padding: '0.75rem', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)' }}>
                    <span className="text-xs">{imp.dimension}</span>
                    <span className="text-[10px] font-mono text-[var(--color-pass)]">+{Math.abs(imp.delta).toFixed(2)} ✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {base && latest && (
            <div className="grid lg:grid-cols-2 gap-6">
              <RadarFingerprint base={base} next={latest} />
              <div className="ag-card p-6">
                <h3 className="text-sm font-semibold mb-5">Overlay: {base.version} vs {latest.version}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">The radar chart shows both versions overlaid. Teal represents the baseline ({base.version}), cyan represents the new version ({latest.version}). Red highlights indicate regression zones.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
