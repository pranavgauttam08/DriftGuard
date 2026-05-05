'use client';
import { motion } from 'framer-motion';
import { useAnimatedCounter, useScrollReveal } from '@/hooks';
import React, { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'healthy' | 'warning' | 'critical';
  icon?: React.ReactNode;
  halo?: boolean;
  format?: 'number' | 'percent' | 'ms';
  sparkline?: number[];
}

export default function MetricCard({ title, value, suffix = '', prefix = '', delta, deltaLabel, trend, status, icon, halo, format = 'number', sparkline }: MetricCardProps) {
  const counter = useAnimatedCounter(format === 'percent' ? Math.round(value * 100) : Math.round(value));
  const { ref, isVisible } = useScrollReveal(0.1);

  useEffect(() => {
    if (isVisible && !counter.started) counter.start();
  }, [isVisible, counter]);

  const displayValue = format === 'percent' ? `${counter.value}%` : format === 'ms' ? `${counter.value}ms` : `${prefix}${counter.value}${suffix}`;

  const statusColor = status === 'critical' ? 'var(--color-biolume-danger)' : status === 'warning' ? 'var(--color-biolume-warning)' : 'var(--color-biolume-primary)';

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
      className={`bio-card p-5 relative overflow-hidden ${halo ? 'halo-border' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-[var(--color-muted-text)] font-medium uppercase tracking-wider">{title}</span>
        {icon && <span style={{ color: statusColor }}>{icon}</span>}
      </div>

      <div className="text-3xl font-bold font-mono animate-counter" style={{ color: statusColor, textShadow: `0 0 20px ${statusColor}40` }}>
        {displayValue}
      </div>

      {(delta !== undefined || deltaLabel) && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <TrendingUp size={12} className="text-[var(--color-biolume-tertiary)]" />}
          {trend === 'down' && <TrendingDown size={12} className="text-[var(--color-biolume-danger)]" />}
          {trend === 'neutral' && <Minus size={12} className="text-[var(--color-muted-text)]" />}
          {delta !== undefined && (
            <span className={`text-xs font-mono ${delta > 0 && trend !== 'down' ? 'text-[var(--color-biolume-tertiary)]' : delta < 0 ? 'text-[var(--color-biolume-danger)]' : 'text-[var(--color-muted-text)]'}`}>
              {delta > 0 ? '+' : ''}{format === 'percent' ? `${(delta * 100).toFixed(1)}%` : delta.toFixed(1)}
            </span>
          )}
          {deltaLabel && <span className="text-[10px] text-[var(--color-ghost-text)]">{deltaLabel}</span>}
        </div>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="flex items-end gap-0.5 mt-3 h-8">
          {sparkline.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{
              height: `${(v / Math.max(...sparkline)) * 100}%`,
              background: `rgba(0,255,209,${0.2 + (v / Math.max(...sparkline)) * 0.4})`,
              minHeight: '2px',
            }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
