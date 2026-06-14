'use client';
import { motion } from 'framer-motion';
import { BehavioralFingerprint } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { Rocket, AlertTriangle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DeploymentEvent {
  version: string;
  environment: string;
  status: 'deployed' | 'blocked' | 'rolled_back';
  timestamp: Date;
}

interface AlertMarker {
  version: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
}

interface TimelineProps {
  fingerprints: BehavioralFingerprint[];
  onSelectVersion?: (fp: BehavioralFingerprint) => void;
  selectedVersion?: string;
  deployments?: DeploymentEvent[];
  alerts?: AlertMarker[];
}

const ENV_COLORS: Record<string, string> = {
  development: '#00E5FF',
  staging: '#FFB800',
  production: '#00FF88',
  canary: '#B388FF',
};

export default function BehavioralTimeline({ fingerprints, onSelectVersion, selectedVersion, deployments = [], alerts = [] }: TimelineProps) {
  const sorted = [...fingerprints].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Helper: find deployment for a version
  const getDeployment = (version: string) => deployments.find(d => d.version === version);
  const getAlerts = (version: string) => alerts.filter(a => a.version === version);

  return (
    <div className="bio-card p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">Behavioral Timeline</h3>
        <div className="flex items-center gap-3">
          {/* Legend */}
          {[
            { color: '#00FF88', label: 'Pass' },
            { color: '#FFB800', label: 'Warn' },
            { color: '#FF3D6B', label: 'Block' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] text-[var(--color-ghost-text)]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-0 min-w-max pb-2">
        {sorted.map((fp, i) => {
          const isSelected = selectedVersion === fp.version;
          const isHovered = hoveredIdx === i;
          const hallScore = fp.hallucinationScore;
          const nodeColor = hallScore > 0.2 ? '#FF3D6B' : hallScore > 0.1 ? '#FFB800' : '#00FFD1';
          const verdict = hallScore > 0.2 ? 'block' : hallScore > 0.1 ? 'warn' : 'pass';
          const deployment = getDeployment(fp.version);
          const versionAlerts = getAlerts(fp.version);
          const envColor = deployment ? ENV_COLORS[deployment.environment] || '#5A7A7D' : undefined;

          return (
            <div key={fp.id} className="flex items-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onSelectVersion?.(fp)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`relative flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all ${isSelected ? 'bg-[var(--color-biolume-dim)] border border-[var(--color-biolume-primary)]' : 'hover:bg-[rgba(0,255,209,0.04)]'}`}
              >
                {/* Deployment marker */}
                {deployment && (
                  <div className="absolute -top-1 -right-1 flex items-center gap-0.5" title={`${deployment.status} → ${deployment.environment}`}>
                    {deployment.status === 'deployed' ? (
                      <Rocket size={11} style={{ color: envColor }} />
                    ) : deployment.status === 'blocked' ? (
                      <XCircle size={11} style={{ color: '#FF3D6B' }} />
                    ) : (
                      <AlertTriangle size={11} style={{ color: '#FFB800' }} />
                    )}
                  </div>
                )}

                {/* Alert indicators */}
                {versionAlerts.length > 0 && (
                  <div className="absolute -top-1 -left-1 flex gap-0.5">
                    {versionAlerts.slice(0, 3).map((a, j) => (
                      <div key={j} className="w-2 h-2 rounded-full animate-pulse" style={{
                        background: a.severity === 'critical' ? '#FF3D6B' : a.severity === 'warning' ? '#FFB800' : '#00E5FF',
                        boxShadow: `0 0 6px ${a.severity === 'critical' ? '#FF3D6B' : '#FFB800'}60`,
                      }} />
                    ))}
                  </div>
                )}

                {/* Mini radar preview */}
                <div className="w-12 h-12 relative">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    {[fp.toneDistribution.formal, fp.toneDistribution.technical, fp.topicConsistency, 1 - fp.hallucinationScore].map((v, j) => {
                      const angle = (j / 4) * Math.PI * 2 - Math.PI / 2;
                      const r = v * 18;
                      return <line key={j} x1="24" y1="24" x2={24 + Math.cos(angle) * r} y2={24 + Math.sin(angle) * r} stroke={nodeColor} strokeWidth="1.5" opacity="0.6" />;
                    })}
                    <polygon
                      points={[fp.toneDistribution.formal, fp.toneDistribution.technical, fp.topicConsistency, 1 - fp.hallucinationScore].map((v, j) => {
                        const angle = (j / 4) * Math.PI * 2 - Math.PI / 2;
                        return `${24 + Math.cos(angle) * v * 18},${24 + Math.sin(angle) * v * 18}`;
                      }).join(' ')}
                      fill={nodeColor} fillOpacity="0.15" stroke={nodeColor} strokeWidth="1"
                    />
                  </svg>
                </div>

                {/* Node dot with environment ring */}
                <div className="relative">
                  <div className="w-3 h-3 rounded-full" style={{ background: nodeColor, boxShadow: `0 0 10px ${nodeColor}80` }} />
                  {envColor && (
                    <div className="absolute -inset-1 rounded-full" style={{ border: `1.5px solid ${envColor}`, opacity: 0.5 }} />
                  )}
                </div>

                {/* Version label */}
                <span className="text-[10px] font-mono text-[var(--color-muted-text)]">{fp.version}</span>
                <StatusBadge status={verdict as 'pass' | 'warn' | 'block'} size="sm" />

                {/* Environment badge */}
                {deployment && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full" style={{
                    background: `${envColor}15`,
                    color: envColor,
                    border: `1px solid ${envColor}30`,
                  }}>
                    {deployment.environment.slice(0, 4)}
                  </span>
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                    style={{ minWidth: '160px' }}
                  >
                    <div className="bio-card p-2.5 text-[10px] space-y-1" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                      <div className="flex justify-between"><span className="text-[var(--color-ghost-text)]">Hallucination</span><span className="font-mono">{(hallScore * 100).toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-[var(--color-ghost-text)]">Consistency</span><span className="font-mono">{(fp.topicConsistency * 100).toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-[var(--color-ghost-text)]">Samples</span><span className="font-mono">{fp.sampleCount}</span></div>
                      {deployment && (
                        <div className="flex justify-between"><span className="text-[var(--color-ghost-text)]">Deploy</span><span className="font-mono" style={{ color: envColor }}>{deployment.environment}</span></div>
                      )}
                    </div>
                    <ChevronDown size={10} className="mx-auto -mt-px text-[var(--color-border)]" style={{ transform: 'rotate(180deg)' }} />
                  </motion.div>
                )}
              </motion.button>

              {/* Connecting line with regression indicator */}
              {i < sorted.length - 1 && (
                <div className="w-8 h-0.5 relative flex items-center">
                  {(() => {
                    const nextFp = sorted[i + 1];
                    const delta = nextFp.hallucinationScore - fp.hallucinationScore;
                    const lineColor = delta > 0.1 ? '#FF3D6B' : delta > 0.05 ? '#FFB800' : 'var(--color-biolume-primary)';
                    return (
                      <>
                        <div className="h-full w-full" style={{ background: `linear-gradient(90deg, ${nodeColor}40, ${lineColor}40)` }} />
                        {delta > 0.1 && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF3D6B] animate-pulse" style={{ boxShadow: '0 0 4px #FF3D6B60' }} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
