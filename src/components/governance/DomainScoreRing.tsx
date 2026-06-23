'use client';
// ============================================================
// components/governance/DomainScoreRing.tsx
// SVG ring for a single compliance domain score.
// All colours use CSS variables ONLY — no hex values.
// ============================================================
import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useRouter } from 'next/navigation';

export type RingColor = 'green' | 'amber' | 'red';

export interface DomainScoreRingProps {
  score: number;           // 0-100
  domainCode: string;      // "GL", "RM", …
  domainName: string;      // "Governance & Leadership"
  passing: number;
  total: number;
  color: RingColor;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// ── Size config ───────────────────────────────────────────────
const SIZES = {
  sm: { px: 80,  stroke: 6,  scoreFontSize: 16, codeFontSize: 9,  nameFontSize: 10 },
  md: { px: 100, stroke: 6,  scoreFontSize: 20, codeFontSize: 10, nameFontSize: 11 },
  lg: { px: 160, stroke: 8,  scoreFontSize: 36, codeFontSize: 13, nameFontSize: 12 },
};

// ── CSS-var colour map ────────────────────────────────────────
const COLOR_VARS: Record<RingColor, string> = {
  green: 'var(--color-text-success)',
  amber: 'var(--color-text-warning)',
  red:   'var(--color-text-danger)',
};

const GLOW_VARS: Record<RingColor, string> = {
  green: 'rgba(16,185,129,0.4)',
  amber: 'rgba(245,158,11,0.4)',
  red:   'rgba(239,68,68,0.4)',
};

export default function DomainScoreRing({
  score, domainCode, domainName, passing, total, color, size = 'md', onClick,
}: DomainScoreRingProps) {
  const router = useRouter();
  const { px, stroke, scoreFontSize, codeFontSize, nameFontSize } = SIZES[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  // Animated stroke-dashoffset: starts at circumference (0% filled) → targetOffset
  const dashOffset = useMotionValue(circumference);
  // Animated score counter
  const scoreDisplay = useMotionValue(0);
  const scoreRef = useRef<SVGTextElement>(null);
  const codeStroke = COLOR_VARS[color];
  const glowColor  = GLOW_VARS[color];

  useEffect(() => {
    const c1 = animate(dashOffset, targetOffset, { duration: 0.6, ease: 'easeOut' });
    const c2 = animate(scoreDisplay, score, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (scoreRef.current) scoreRef.current.textContent = String(Math.round(v));
      },
    });
    return () => { c1.stop(); c2.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    router.push(`/dashboard/governance/${domainCode.toLowerCase()}`);
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.18 }}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
    >
      {/* SVG Ring */}
      <div style={{ position: 'relative', width: px, height: px }}>
        <svg width={px} height={px} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={px / 2} cy={px / 2} r={radius}
            fill="none"
            stroke="var(--color-border-tertiary)"
            strokeWidth={stroke}
          />
          {/* Animated progress arc */}
          <motion.circle
            cx={px / 2} cy={px / 2} r={radius}
            fill="none"
            stroke={codeStroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: dashOffset,
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Centre text (rotated back upright) */}
        <svg
          width={px} height={px}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <text
            ref={scoreRef}
            x="50%" y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
              fontSize: `${scoreFontSize}px`,
              fontWeight: 700,
              fill: 'var(--color-text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            {Math.round(score)}
          </text>
          <text
            x="50%"
            y={`calc(50% + ${scoreFontSize * 0.7}px)`}
            dominantBaseline="middle"
            textAnchor="middle"
            style={{
              fontSize: `${codeFontSize}px`,
              fill: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            {domainCode}
          </text>
        </svg>
      </div>

      {/* Domain name below ring */}
      <p style={{
        fontSize: `${nameFontSize}px`,
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        maxWidth: px + 8,
        lineHeight: 1.3,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {domainName}
      </p>
    </motion.div>
  );
}
