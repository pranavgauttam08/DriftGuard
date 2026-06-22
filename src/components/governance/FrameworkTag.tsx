'use client';
import React from 'react';

const FRAMEWORK_COLORS: Record<string, string> = {
  'GDPR':       '#3B82F6',
  'HIPAA':      '#10B981',
  'SOC2':       '#8B5CF6',
  'EU AI Act':  '#F59E0B',
  'NIST':       '#06B6D4',
  'NIST AI RMF':'#06B6D4',
  'ISO42001':   '#EC4899',
  'ISO 42001':  '#EC4899',
  'ISO27001':   '#6366F1',
  'ISO 27001':  '#6366F1',
  'ISO27701':   '#6366F1',
  'MAS':        '#14B8A6',
  'MAS TRM':    '#14B8A6',
  'MAS FEAT':   '#14B8A6',
  'APRA':       '#F97316',
  'APRA CPS 234': '#F97316',
  'BCBS':       '#84CC16',
  'BCBS 239':   '#84CC16',
  'BNM':        '#14B8A6',
  'BNM RMiT':   '#14B8A6',
  'OJK':        '#F97316',
  'PCI-DSS':    '#EF4444',
  'DORA':       '#8B5CF6',
  'OWASP':      '#EF4444',
  'OWASP LLM':  '#EF4444',
  'OWASP LLM Top10': '#EF4444',
  'Internal':   '#475569',
};

interface FrameworkTagProps {
  framework: string;
  size?: 'sm' | 'md';
}

export default function FrameworkTag({ framework, size = 'sm' }: FrameworkTagProps) {
  const color = FRAMEWORK_COLORS[framework] || '#94A3B8';
  const fontSize = size === 'sm' ? '10px' : '11px';
  const pad = size === 'sm' ? '2px 7px' : '3px 10px';

  return (
    <span
      className="inline-flex items-center font-mono font-medium rounded-full whitespace-nowrap"
      style={{
        fontSize,
        padding: pad,
        letterSpacing: '0.04em',
        background: `${color}12`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {framework}
    </span>
  );
}
