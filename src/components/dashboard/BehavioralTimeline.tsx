'use client';
import { motion } from 'framer-motion';
import { BehavioralFingerprint } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';

interface TimelineProps {
  fingerprints: BehavioralFingerprint[];
  onSelectVersion?: (fp: BehavioralFingerprint) => void;
  selectedVersion?: string;
}

export default function BehavioralTimeline({ fingerprints, onSelectVersion, selectedVersion }: TimelineProps) {
  const sorted = [...fingerprints].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="bio-card p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-[var(--color-surface-text)] mb-4">Behavioral Timeline</h3>
      <div className="flex items-center gap-0 min-w-max pb-2">
        {sorted.map((fp, i) => {
          const isSelected = selectedVersion === fp.version;
          const hallScore = fp.hallucinationScore;
          const nodeColor = hallScore > 0.2 ? '#FF3D6B' : hallScore > 0.1 ? '#FFB800' : '#00FFD1';
          const verdict = hallScore > 0.2 ? 'block' : hallScore > 0.1 ? 'warn' : 'pass';

          return (
            <div key={fp.id} className="flex items-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onSelectVersion?.(fp)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all ${isSelected ? 'bg-[var(--color-biolume-dim)] border border-[var(--color-biolume-primary)]' : 'hover:bg-[rgba(0,255,209,0.04)]'}`}
              >
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

                {/* Node dot */}
                <div className="w-3 h-3 rounded-full" style={{ background: nodeColor, boxShadow: `0 0 10px ${nodeColor}80` }} />

                {/* Version label */}
                <span className="text-[10px] font-mono text-[var(--color-muted-text)]">{fp.version}</span>
                <StatusBadge status={verdict as 'pass' | 'warn' | 'block'} size="sm" />
              </motion.button>

              {/* Connecting line */}
              {i < sorted.length - 1 && (
                <div className="w-8 h-0.5 relative">
                  <div className="data-flow-line h-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
