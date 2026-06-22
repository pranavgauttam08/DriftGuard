'use client';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import EndpointSelector from '@/components/dashboard/EndpointSelector';
import StatusBadge from '@/components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { Check, Clock, Bell, Filter } from 'lucide-react';
import { useState } from 'react';

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const dg = useDriftGuardContext();
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');

  const filtered = filterMode === 'selected'
    ? dg.alerts.filter(a => a.endpointId === dg.selectedEndpoint?.id)
    : dg.alerts;

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unacked = sorted.filter(a => !a.acknowledged).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Alerts" />

      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-[var(--color-text-secondary)] font-mono">Filter:</span>
        <EndpointSelector endpoints={dg.endpoints} selected={dg.selectedEndpoint} onSelect={dg.selectEndpoint} />
        <div className="flex gap-2">
          <button onClick={() => setFilterMode('all')}
            className="text-xs font-mono rounded-lg transition-all"
            style={{
              padding: '6px 12px',
              background: filterMode === 'all' ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: `1px solid ${filterMode === 'all' ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.08)'}`,
              color: filterMode === 'all' ? '#3B82F6' : '#5A7A7D',
            }}>All Endpoints</button>
          <button onClick={() => setFilterMode('selected')}
            className="text-xs font-mono rounded-lg transition-all"
            style={{
              padding: '6px 12px',
              background: filterMode === 'selected' ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: `1px solid ${filterMode === 'selected' ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.08)'}`,
              color: filterMode === 'selected' ? '#3B82F6' : '#5A7A7D',
            }}>Selected Only</button>
        </div>
        {unacked > 0 && (
          <span className="text-xs font-mono" style={{ color: '#EF4444' }}>
            {unacked} unacknowledged
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center" style={{ padding: '5rem 2rem' }}>
          <Bell size={40} className="mx-auto text-[var(--color-text-muted)]" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem' }}>No alerts</h3>
          <p className="text-sm text-[var(--color-text-secondary)]" style={{ maxWidth: '360px', margin: '0 auto' }}>
            {filterMode === 'selected'
              ? `No alerts for ${dg.selectedEndpoint?.name}. Try selecting "All Endpoints".`
              : 'No behavioral alerts have been triggered yet. Send data and run diffs to monitor for regressions.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert, i) => (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`ag-card p-5 flex items-start gap-4 ${!alert.acknowledged ? 'border-l-2 border-l-[var(--color-block)]' : ''}`}
            >
              <StatusBadge status={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text-primary)]">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-muted)] flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(alert.timestamp)}</span>
                  <span className="font-semibold" style={{
                    color: dg.endpoints.find(e => e.id === alert.endpointId)?.status === 'critical' ? '#EF4444' : '#3B82F6'
                  }}>{alert.endpointId}</span>
                  <span>· {alert.version}</span>
                  <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
              {!alert.acknowledged && (
                <button onClick={() => dg.acknowledgeAlert(alert.id)} className="ag-button-ghost !py-1.5 !px-4 !text-[10px] flex items-center gap-1 shrink-0">
                  <Check size={12} /> Ack
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
