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
    <div className="ag-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Hallucination Tracker</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.06)" />
          <XAxis dataKey="version" tick={{ fill: '#4A8F8A', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(59,130,246,0.1)' }} />
          <YAxis tick={{ fill: '#4A8F8A', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(59,130,246,0.1)' }} domain={[0, 40]} unit="%" />
          <Tooltip
            contentStyle={{ background: '#010D10', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 12, fontFamily: 'JetBrains Mono' }}
            labelStyle={{ color: '#E0FFFC' }}
            itemStyle={{ color: '#3B82F6' }}
            formatter={(value) => [`${value}%`, 'Hallucination']}
          />
          <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#010D10', stroke: '#3B82F6', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#3B82F6', stroke: '#010D10', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))' }}
          />
          {/* Danger threshold line */}
          <Line type="monotone" dataKey={() => 20} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--color-text-muted)] font-mono">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#3B82F6]" /> Score</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#EF4444]" style={{ borderTop: '1px dashed #EF4444' }} /> Danger threshold</span>
      </div>
    </div>
  );
}
