'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import BehavioralTimeline from '@/components/dashboard/BehavioralTimeline';
import RadarFingerprint from '@/components/dashboard/RadarFingerprint';
import { useState } from 'react';
import { BehavioralFingerprint } from '@/types';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function TimelinePage() {
  const dg = useDriftGuardContext();
  const fps = dg.fingerprints
    .filter(f => f.endpointId === dg.selectedEndpoint?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const [selected, setSelected] = useState<BehavioralFingerprint | null>(null);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Version Timeline" />

      {/* Endpoint selector */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--color-muted-text)] font-mono">Viewing:</span>
        <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
        <span className="text-xs text-[var(--color-ghost-text)]">{fps.length} version{fps.length !== 1 ? 's' : ''} tracked</span>
      </div>

      {fps.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" style={{ padding: '5rem 2rem' }}>
          <Clock size={40} className="mx-auto text-[var(--color-ghost-text)]" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem' }}>No versions tracked yet</h3>
          <p className="text-sm text-[var(--color-muted-text)]" style={{ maxWidth: '360px', margin: '0 auto' }}>
            Send data to <strong>{dg.selectedEndpoint?.name || 'this endpoint'}</strong> via the Endpoints page to see its behavioral timeline here.
          </p>
        </motion.div>
      ) : (
        <>
          <BehavioralTimeline fingerprints={fps} onSelectVersion={setSelected} selectedVersion={selected?.version} />
          {selected && (
            <div className="grid lg:grid-cols-2 gap-6">
              <RadarFingerprint base={selected} />
              <div className="bio-card p-6">
                <h3 className="text-sm font-semibold mb-5">{dg.selectedEndpoint?.name} — {selected.version} Details</h3>
                <div className="space-y-4 text-sm">
                  {[
                    ['Hallucination Score', `${(selected.hallucinationScore * 100).toFixed(1)}%`, selected.hallucinationScore > 0.2 ? '#FF3D6B' : selected.hallucinationScore > 0.1 ? '#FFB800' : '#00FF88'],
                    ['Topic Consistency', `${(selected.topicConsistency * 100).toFixed(1)}%`, selected.topicConsistency < 0.75 ? '#FF3D6B' : selected.topicConsistency < 0.85 ? '#FFB800' : '#00FF88'],
                    ['Avg Latency', `${selected.avgLatencyMs.toFixed(0)}ms`, selected.avgLatencyMs > 500 ? '#FFB800' : '#00FF88'],
                    ['Refusal Rate', `${(selected.refusalRate * 100).toFixed(1)}%`, selected.refusalRate > 0.1 ? '#FF3D6B' : '#00FF88'],
                    ['Sample Count', `${selected.sampleCount}`, '#00FFD1'],
                    ['Formal Tone', `${(selected.toneDistribution.formal * 100).toFixed(0)}%`, '#00FFD1'],
                    ['Technical Tone', `${(selected.toneDistribution.technical * 100).toFixed(0)}%`, '#00FFD1'],
                    ['Empathetic Tone', `${(selected.toneDistribution.empathetic * 100).toFixed(0)}%`, '#00FFD1'],
                  ].map(([k, v, color]) => (
                    <div key={k as string} className="flex justify-between items-center py-1 border-b border-[rgba(0,255,209,0.06)]">
                      <span className="text-[var(--color-muted-text)]">{k}</span>
                      <span className="font-mono" style={{ color: color as string }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
