'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import DriftMap from '@/components/dashboard/DriftMap';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
const DriftSphere = dynamic(() => import('@/components/three/DriftSphere'), { ssr: false });

export default function DriftPage() {
  const dg = useDriftGuardContext();
  const fps = dg.fingerprints.filter(f => f.endpointId === dg.selectedEndpoint?.id);
  const driftData = fps.map(fp => fp.hallucinationScore + (1 - fp.topicConsistency));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Drift Map" />

      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--color-muted-text)] font-mono">Viewing:</span>
        <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
      </div>

      {fps.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" style={{ padding: '5rem 2rem' }}>
          <Map size={40} className="mx-auto text-[var(--color-ghost-text)]" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem' }}>No drift data yet</h3>
          <p className="text-sm text-[var(--color-muted-text)]" style={{ maxWidth: '360px', margin: '0 auto' }}>
            Send multiple versions of data to <strong>{dg.selectedEndpoint?.name}</strong> to see how its behavior drifts over time.
          </p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><DriftMap fingerprints={fps} /></div>
          <div className="flex flex-col items-center gap-5">
            <div className="bio-card p-5"><DriftSphere driftData={driftData} /></div>
            <p className="text-xs text-[var(--color-muted-text)] text-center max-w-[280px] leading-relaxed">
              3D drift sphere for <strong>{dg.selectedEndpoint?.name}</strong> — vertex colors encode behavioral drift magnitude across {fps.length} version{fps.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
