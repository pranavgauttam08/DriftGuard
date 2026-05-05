'use client';

interface StatusBadgeProps {
  status: 'pass' | 'warn' | 'block' | 'healthy' | 'warning' | 'critical' | 'info';
  label?: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { className: string; defaultLabel: string }> = {
  pass: { className: 'bio-badge-pass', defaultLabel: 'PASS' },
  healthy: { className: 'bio-badge-pass', defaultLabel: 'HEALTHY' },
  warn: { className: 'bio-badge-warn', defaultLabel: 'WARN' },
  warning: { className: 'bio-badge-warn', defaultLabel: 'WARNING' },
  info: { className: 'bio-badge-warn', defaultLabel: 'INFO' },
  block: { className: 'bio-badge-block', defaultLabel: 'BLOCK' },
  critical: { className: 'bio-badge-block', defaultLabel: 'CRITICAL' },
};

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.warn;
  return (
    <span className={`bio-badge ${config.className} ${size === 'sm' ? '!text-[10px] !px-2 !py-0.5' : ''}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
        status === 'pass' || status === 'healthy' ? 'bg-[#00FF88]' :
        status === 'block' || status === 'critical' ? 'bg-[#FF3D6B]' : 'bg-[#FFB800]'
      }`} style={{ boxShadow: status === 'pass' || status === 'healthy' ? '0 0 6px #00FF88' : status === 'block' || status === 'critical' ? '0 0 6px #FF3D6B' : '0 0 6px #FFB800' }} />
      {label || config.defaultLabel}
    </span>
  );
}
