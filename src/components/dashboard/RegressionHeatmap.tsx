'use client';
import { BehavioralFingerprint } from '@/types';

interface HeatmapProps {
  fingerprints: BehavioralFingerprint[];
}

const DIMS = ['Formality', 'Casual', 'Technical', 'Empathy', 'Refusal', 'Hallucination', 'Latency', 'Topic Focus'];

function getVal(fp: BehavioralFingerprint, dim: string): number {
  switch (dim) {
    case 'Formality': return fp.toneDistribution.formal;
    case 'Casual': return fp.toneDistribution.casual;
    case 'Technical': return fp.toneDistribution.technical;
    case 'Empathy': return fp.toneDistribution.empathetic;
    case 'Refusal': return fp.refusalRate;
    case 'Hallucination': return fp.hallucinationScore;
    case 'Latency': return Math.min(fp.avgLatencyMs / 1000, 1);
    case 'Topic Focus': return fp.topicConsistency;
    default: return 0;
  }
}

function cellColor(value: number, isInverted: boolean): string {
  const v = isInverted ? value : 1 - value;
  if (v < 0.3) return 'rgba(0,255,136,0.4)';
  if (v < 0.5) return 'rgba(59,130,246,0.3)';
  if (v < 0.7) return 'rgba(255,184,0,0.3)';
  return 'rgba(255,61,107,0.4)';
}

const invertedDims = ['Refusal', 'Hallucination', 'Latency'];

export default function RegressionHeatmap({ fingerprints }: HeatmapProps) {
  const sorted = [...fingerprints].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="ag-card p-5 overflow-x-auto">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Regression Heatmap</h3>
      <div className="min-w-max">
        {/* Header row */}
        <div className="flex items-center mb-2">
          <div className="w-24 text-[10px] text-[var(--color-text-muted)]" />
          {sorted.map(fp => (
            <div key={fp.id} className="w-16 text-center text-[10px] font-mono text-[var(--color-text-secondary)]">{fp.version}</div>
          ))}
        </div>

        {/* Dimension rows */}
        {DIMS.map(dim => {
          const isInverted = invertedDims.includes(dim);
          return (
            <div key={dim} className="flex items-center mb-1">
              <div className="w-24 text-[10px] text-[var(--color-text-secondary)] truncate pr-2">{dim}</div>
              {sorted.map((fp, i) => {
                const val = getVal(fp, dim);
                const prevVal = i > 0 ? getVal(sorted[i - 1], dim) : val;
                const isRegression = isInverted ? val > prevVal + 0.05 : val < prevVal - 0.05;

                return (
                  <div key={fp.id} className="w-16 h-8 flex items-center justify-center mx-0.5 group relative"
                    style={{
                      background: cellColor(val, isInverted),
                      borderRadius: '4px',
                      border: isRegression ? '1px solid rgba(255,61,107,0.6)' : '1px solid transparent',
                      animation: isRegression ? 'bio-pulse 2s ease-in-out infinite' : undefined,
                    }}
                  >
                    <span className="text-[10px] font-mono text-[var(--color-text-primary)]">{val.toFixed(2)}</span>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="ag-card !p-2 text-[10px] whitespace-nowrap">
                        {dim}: {val.toFixed(3)}{isRegression && <span className="text-[var(--color-block)] ml-1">⚠ regression</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[10px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(0,255,136,0.4)' }} /> Good</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(255,184,0,0.3)' }} /> Degrading</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(255,61,107,0.4)' }} /> Regressed</span>
        </div>
      </div>
    </div>
  );
}
