'use client';
import { useEffect, useRef } from 'react';
import { BehavioralFingerprint } from '@/types';

interface RadarProps {
  base: BehavioralFingerprint;
  next?: BehavioralFingerprint;
  size?: number;
}

const AXES = ['Semantic', 'Formality', 'Technical', 'Empathy', 'Refusal(inv)', 'Halluc(inv)', 'Latency(inv)', 'Topic Focus'];

function extractValues(fp: BehavioralFingerprint): number[] {
  return [
    fp.topicConsistency,
    fp.toneDistribution.formal,
    fp.toneDistribution.technical,
    fp.toneDistribution.empathetic,
    1 - fp.refusalRate,
    1 - fp.hallucinationScore,
    1 - Math.min(fp.avgLatencyMs / 1000, 1),
    fp.topicConsistency,
  ];
}

export default function RadarFingerprint({ base, next, size = 300 }: RadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const n = AXES.length;

    // Draw grid rings
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const radius = (r / 4) * maxR;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(59,130,246,0.08)';
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = 'rgba(59,130,246,0.1)';
      ctx.stroke();

      // Labels
      const labelR = maxR + 18;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(AXES[i], lx, ly);
    }

    // Draw fingerprint polygon
    function drawPolygon(values: number[], fillColor: string, strokeColor: string, fillOpacity: number) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (i % n / n) * Math.PI * 2 - Math.PI / 2;
        const v = Math.min(values[i % n], 1);
        const x = cx + Math.cos(angle) * v * maxR;
        const y = cy + Math.sin(angle) * v * maxR;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor.replace(')', `,${fillOpacity})`).replace('rgb', 'rgba');
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw data points
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const v = Math.min(values[i], 1);
        const x = cx + Math.cos(angle) * v * maxR;
        const y = cy + Math.sin(angle) * v * maxR;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      }
    }

    const baseValues = extractValues(base);
    if (next) {
      const nextValues = extractValues(next);
      drawPolygon(baseValues, 'rgb(59,130,246)', 'rgba(59,130,246,0.4)', 0.08);
      drawPolygon(nextValues, 'rgb(139,92,246)', 'rgba(139,92,246,0.8)', 0.15);

      // Highlight regression zones
      for (let i = 0; i < n; i++) {
        if (nextValues[i] < baseValues[i] - 0.05) {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * nextValues[i] * maxR;
          const y = cy + Math.sin(angle) * nextValues[i] * maxR;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239,68,68,0.3)';
          ctx.fill();
        }
      }
    } else {
      drawPolygon(baseValues, 'rgb(59,130,246)', 'rgba(59,130,246,0.7)', 0.12);
    }
  }, [base, next, size]);

  return (
    <div className="ag-card p-4 inline-block">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {next && (
        <div className="flex gap-4 mt-2 justify-center text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[rgba(59,130,246,0.5)]" /> {base.version}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[rgba(139,92,246,0.8)]" /> {next.version}</span>
        </div>
      )}
    </div>
  );
}
