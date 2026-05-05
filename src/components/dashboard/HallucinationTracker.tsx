'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BehavioralFingerprint } from '@/types';

interface HallucinationTrackerProps {
  fingerprints: BehavioralFingerprint[];
}

export default function HallucinationTracker({ fingerprints }: HallucinationTrackerProps) {
  const sorted = [...fingerprints].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const data = sorted.map(fp => ({
    version: fp.version,
    score: Math.round(fp.hallucinationScore * 100),
    raw: fp.hallucinationScore,
  }));

  return (
    <div className="bio-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-surface-text)] mb-4">Hallucination Tracker</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,209,0.06)" />
          <XAxis dataKey="version" tick={{ fill: '#4A8F8A', fontSize: 10, fontFamily: 'Fira Code' }} axisLine={{ stroke: 'rgba(0,255,209,0.1)' }} />
          <YAxis tick={{ fill: '#4A8F8A', fontSize: 10, fontFamily: 'Fira Code' }} axisLine={{ stroke: 'rgba(0,255,209,0.1)' }} domain={[0, 40]} unit="%" />
          <Tooltip
            contentStyle={{ background: '#010D10', border: '1px solid rgba(0,255,209,0.2)', borderRadius: 8, fontSize: 12, fontFamily: 'Fira Code' }}
            labelStyle={{ color: '#E0FFFC' }}
            itemStyle={{ color: '#00FFD1' }}
            formatter={(value) => [`${value}%`, 'Hallucination']}
          />
          <Line type="monotone" dataKey="score" stroke="#00FFD1" strokeWidth={2} dot={{ r: 4, fill: '#010D10', stroke: '#00FFD1', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#00FFD1', stroke: '#010D10', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(0,255,209,0.6))' }}
          />
          {/* Danger threshold line */}
          <Line type="monotone" dataKey={() => 20} stroke="#FF3D6B" strokeWidth={1} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--color-ghost-text)] font-mono">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#00FFD1]" /> Score</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#FF3D6B]" style={{ borderTop: '1px dashed #FF3D6B' }} /> Danger threshold</span>
      </div>
    </div>
  );
}
