'use client';

interface StatusBadgeProps {
  status: 'pass' | 'warn' | 'block' | 'pending' | 'na' | 'healthy' | 'warning' | 'critical' | 'info';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusMap: Record<string, { className: string; defaultLabel: string; dotColor: string }> = {
  pass:     { className: 'ag-badge-pass',    defaultLabel: 'PASS',     dotColor: '#10B981' },
  healthy:  { className: 'ag-badge-pass',    defaultLabel: 'HEALTHY',  dotColor: '#10B981' },
  warn:     { className: 'ag-badge-warn',    defaultLabel: 'WARN',     dotColor: '#F59E0B' },
  warning:  { className: 'ag-badge-warn',    defaultLabel: 'WARNING',  dotColor: '#F59E0B' },
  info:     { className: 'ag-badge-info',    defaultLabel: 'INFO',     dotColor: '#8B5CF6' },
  block:    { className: 'ag-badge-block',   defaultLabel: 'BLOCK',    dotColor: '#EF4444' },
  critical: { className: 'ag-badge-block',   defaultLabel: 'CRITICAL', dotColor: '#EF4444' },
  pending:  { className: 'ag-badge-pending', defaultLabel: 'PENDING',  dotColor: '#475569' },
  na:       { className: 'ag-badge-pending', defaultLabel: 'N/A',      dotColor: '#475569' },
};

export default function StatusBadge({ status, label, size = 'md', pulse = false }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.warn;
  return (
    <span className={`ag-badge ${config.className} ${size === 'sm' ? '!text-[10px] !px-2 !py-0.5' : ''}`}>
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full ${pulse ? 'animate-pulse-dot' : ''}`}
        style={{ backgroundColor: config.dotColor, boxShadow: `0 0 6px ${config.dotColor}` }}
      />
      {label || config.defaultLabel}
    </span>
  );
}
