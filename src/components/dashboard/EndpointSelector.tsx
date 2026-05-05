'use client';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Endpoint } from '@/types';

interface EndpointSelectorProps {
  endpoints: Endpoint[];
  selected: Endpoint | null;
  onSelect: (ep: Endpoint) => void;
}

export default function EndpointSelector({ endpoints, selected, onSelect }: EndpointSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const statusColor = (s: string) =>
    s === 'critical' ? '#FF3D6B' : s === 'warning' ? '#FFB800' : '#00FF88';

  return (
    <div ref={ref} className="relative" style={{ minWidth: '220px' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 rounded-lg transition-all"
        style={{
          padding: '10px 14px',
          background: 'rgba(0,255,209,0.04)',
          border: '1px solid rgba(0,255,209,0.12)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="rounded-full shrink-0"
            style={{
              width: '8px', height: '8px',
              background: statusColor(selected?.status || 'healthy'),
              boxShadow: `0 0 6px ${statusColor(selected?.status || 'healthy')}`,
            }}
          />
          <span className="text-sm font-medium text-[var(--color-surface-text)] truncate">
            {selected?.name || 'Select endpoint'}
          </span>
        </div>
        <ChevronDown size={14} className={`text-[var(--color-ghost-text)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-30"
          style={{
            background: 'rgba(1,14,18,0.98)',
            border: '1px solid rgba(0,255,209,0.15)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {endpoints.map(ep => (
            <button
              key={ep.id}
              onClick={() => { onSelect(ep); setOpen(false); }}
              className="w-full flex items-center gap-3 text-left transition-all"
              style={{
                padding: '10px 14px',
                background: selected?.id === ep.id ? 'rgba(0,255,209,0.08)' : 'transparent',
                borderLeft: selected?.id === ep.id ? '2px solid #00FFD1' : '2px solid transparent',
              }}
            >
              <span
                className="rounded-full shrink-0"
                style={{
                  width: '6px', height: '6px',
                  background: statusColor(ep.status),
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[var(--color-surface-text)] truncate">{ep.name}</div>
                <div className="text-[10px] text-[var(--color-ghost-text)] truncate">{ep.latestVersion} · {ep.totalResponses} responses</div>
              </div>
              <span className="text-[9px] font-mono uppercase shrink-0" style={{ color: statusColor(ep.status) }}>
                {ep.status}
              </span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
