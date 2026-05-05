'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import ProbeRunner from '@/components/dashboard/ProbeRunner';
import { useState } from 'react';
import { ProbeResult } from '@/types';

export default function ProbesPage() {
  const dg = useDriftGuardContext();
  // Track probe results per endpoint so switching endpoints shows correct results
  const [endpointProbes, setEndpointProbes] = useState<Record<string, ProbeResult[]>>({});

  const currentEpId = dg.selectedEndpoint?.id || '';
  const currentResults = endpointProbes[currentEpId] || dg.probeResults;

  const handleRunProbes = async () => {
    if (!dg.selectedEndpoint) return null;
    const res = await fetch('/api/probes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointId: dg.selectedEndpoint.id,
        version: dg.selectedEndpoint.latestVersion,
      }),
    });
    const data = await res.json();
    if (data.results) {
      setEndpointProbes(prev => ({ ...prev, [currentEpId]: data.results }));
    }
    return data.results;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Probe Runner" />

      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-[var(--color-muted-text)] font-mono">Testing:</span>
        <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
        <span className="text-xs text-[var(--color-ghost-text)]">
          {dg.selectedEndpoint?.name} — {dg.selectedEndpoint?.latestVersion}
        </span>
      </div>

      <ProbeRunner
        probeResults={currentResults}
        onRunProbes={handleRunProbes}
        isLoading={dg.isLoading}
      />
    </div>
  );
}
