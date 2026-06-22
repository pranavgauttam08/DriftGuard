'use client';
import React, { useEffect, useState } from 'react';

interface ComplianceScoreRingProps {
  score: number;
  framework: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SIZES = {
  sm: { diameter: 64, stroke: 5, fontSize: '14px', labelSize: '8px' },
  md: { diameter: 100, stroke: 6, fontSize: '22px', labelSize: '10px' },
  lg: { diameter: 140, stroke: 8, fontSize: '32px', labelSize: '12px' },
};

export default function ComplianceScoreRing({
  score, framework, color, size = 'md', animated = true,
}: ComplianceScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const { diameter, stroke, fontSize, labelSize } = SIZES[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    let start: number | null = null;
    const duration = 1200;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={diameter / 2} cy={diameter / 2} r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx={diameter / 2} cy={diameter / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: animated ? 'none' : 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {/* Score number centered */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: diameter, height: diameter }}>
        <span className="font-bold" style={{ fontSize, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.025em' }}>
          {displayScore}
        </span>
      </div>
      {/* Framework label */}
      <span className="font-mono font-medium" style={{
        fontSize: labelSize,
        color,
        letterSpacing: '0.05em',
        marginTop: '-4px',
      }}>{framework}</span>
    </div>
  );
}
