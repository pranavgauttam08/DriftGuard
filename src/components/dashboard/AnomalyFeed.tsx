'use client';
import { Alert } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/ui/StatusBadge';
import { Clock } from 'lucide-react';

interface AnomalyFeedProps {
  alerts: Alert[];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AnomalyFeed({ alerts }: AnomalyFeedProps) {
  const sorted = [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="ag-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Anomaly Feed</h3>
        <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{alerts.filter(a => !a.acknowledged).length} unread</span>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {sorted.map((alert, i) => (
            <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border transition-all ${
                !alert.acknowledged
                  ? 'border-[rgba(255,61,107,0.3)] bg-[rgba(255,61,107,0.04)]'
                  : 'border-[var(--color-biolume-border)] bg-[var(--color-biolume-glass)]'
              }`}
            >
              <div className="flex items-start gap-2">
                <StatusBadge status={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-[var(--color-text-muted)]" />
                    <span className="text-[10px] text-[var(--color-text-muted)]">{timeAgo(alert.timestamp)}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">· {alert.endpointId}</span>
                  </div>
                </div>
                {!alert.acknowledged && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-block)] mt-1 animate-bio-pulse" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
