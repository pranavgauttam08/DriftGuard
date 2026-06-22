'use client';
import { BehavioralFingerprint } from '@/types';
import { useMemo, useRef, useEffect, useState } from 'react';

interface DriftMapProps {
  fingerprints: BehavioralFingerprint[];
}

interface Point {
  x: number;
  y: number;
  version: string;
  endpointId: string;
  label: string;
}

export default function DriftMap({ fingerprints }: DriftMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const W = 600, H = 400;

  const points: Point[] = useMemo(() => {
    if (fingerprints.length === 0) return [];
    // Simplified MDS: use fingerprint dimensions as 2D coordinates
    return fingerprints.map((fp, i) => {
      const x = (fp.topicConsistency * 0.4 + fp.toneDistribution.formal * 0.3 + (1 - fp.hallucinationScore) * 0.3) * W * 0.7 + W * 0.15;
      const y = (fp.toneDistribution.technical * 0.4 + fp.toneDistribution.empathetic * 0.3 + (1 - fp.refusalRate) * 0.3) * H * 0.7 + H * 0.15;
      // Add jitter for overlap prevention
      return { x: x + (Math.sin(i * 2.5) * 20), y: y + (Math.cos(i * 3.1) * 15), version: fp.version, endpointId: fp.endpointId, label: `${fp.endpointId} ${fp.version}` };
    });
  }, [fingerprints]);

  // Dynamic version colors — works for ANY version, not just hardcoded ones
  const versionColors: Record<string, string> = useMemo(() => {
    const allVersions = [...new Set(fingerprints.map(f => f.version))].sort();
    const palette = ['#3B82F6', '#00E5FF', '#00CBB7', '#00FF88', '#8AEACC', '#00B1A2', '#66FFE0', '#33D9B2', '#00CCAA', '#99FFE6'];
    const colors: Record<string, string> = {};
    allVersions.forEach((v, i) => { colors[v] = palette[i % palette.length]; });
    return colors;
  }, [fingerprints]);

  // Group by endpoint and draw centroids
  const endpointGroups = useMemo(() => {
    const groups: Record<string, Point[]> = {};
    points.forEach(p => {
      if (!groups[p.endpointId]) groups[p.endpointId] = [];
      groups[p.endpointId].push(p);
    });
    return groups;
  }, [points]);

  return (
    <div className="ag-card p-5 relative">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Semantic Drift Map</h3>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '400px' }}>
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line x1={W * (i + 1) / 6} y1={0} x2={W * (i + 1) / 6} y2={H} stroke="rgba(59,130,246,0.05)" />
            <line x1={0} y1={H * (i + 1) / 6} x2={W} y2={H * (i + 1) / 6} stroke="rgba(59,130,246,0.05)" />
          </g>
        ))}

        {/* Centroid connections */}
        {Object.entries(endpointGroups).map(([epId, pts]) => {
          if (pts.length < 2) return null;
          const sorted = [...pts].sort((a, b) => a.version.localeCompare(b.version));
          return (
            <g key={epId}>
              {sorted.slice(0, -1).map((p, i) => (
                <line key={i} x1={p.x} y1={p.y} x2={sorted[i + 1].x} y2={sorted[i + 1].y} stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="4 2" />
              ))}
            </g>
          );
        })}

        {/* Points */}
        {points.map((p, i) => {
          const color = versionColors[p.version] || '#3B82F6';
          return (
            <g key={i}
              onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, text: p.label })}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              <circle cx={p.x} cy={p.y} r={6} fill={color} opacity={0.7} />
              <circle cx={p.x} cy={p.y} r={10} fill={color} opacity={0.15} />
              <circle cx={p.x} cy={p.y} r={3} fill="#010D10" />
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={W / 2} y={H - 5} fill="#4A8F8A" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">← Semantic Consistency →</text>
        <text x={8} y={H / 2} fill="#4A8F8A" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono" transform={`rotate(-90, 8, ${H / 2})`}>← Behavioral Depth →</text>
      </svg>

      {tooltip && (
        <div className="fixed z-50 ag-card !p-2 text-xs font-mono" style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}>
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono">
        {Object.entries(versionColors).map(([v, c]) => (
          <span key={v} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{v}</span>
        ))}
      </div>
    </div>
  );
}
