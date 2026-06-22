'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, Server, GitCompare, Plus, Sparkles, ShieldAlert } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      setQuery('');
      setSelectedIndex(0);
    };
    window.addEventListener('open-command-palette', handler);

    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('open-command-palette', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const items: CommandItem[] = [
    { id: 'overview', label: 'Go to Overview', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard'); setOpen(false); } },
    { id: 'endpoints', label: 'Go to Endpoints', category: 'Navigation', icon: <Server size={14} />, action: () => { router.push('/dashboard/endpoints'); setOpen(false); } },
    { id: 'timeline', label: 'Go to Timeline', category: 'Navigation', icon: <GitCompare size={14} />, action: () => { router.push('/dashboard/timeline'); setOpen(false); } },
    { id: 'drift', label: 'Go to Drift Map', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/drift'); setOpen(false); } },
    { id: 'alerts', label: 'Go to Alerts', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/alerts'); setOpen(false); } },
    { id: 'deployments', label: 'Go to Deployments', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/deployments'); setOpen(false); } },
    { id: 'datasets', label: 'Go to Datasets', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/datasets'); setOpen(false); } },
    { id: 'traces', label: 'Go to Traces', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/traces'); setOpen(false); } },
    { id: 'reviews', label: 'Go to Reviews', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/reviews'); setOpen(false); } },
    { id: 'settings', label: 'Go to Settings', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/settings'); setOpen(false); } },
    { id: 'security', label: 'Go to Security', category: 'Navigation', icon: <Search size={14} />, action: () => { router.push('/dashboard/settings/security'); setOpen(false); } },
    { id: 'new-endpoint', label: 'Create New Endpoint', category: 'Actions', icon: <Plus size={14} />, action: () => { router.push('/dashboard/endpoints'); setOpen(false); } },
    { id: 'new-deployment', label: 'Create New Deployment', category: 'Actions', icon: <Plus size={14} />, action: () => { router.push('/dashboard/deployments'); setOpen(false); } },
    { id: 'new-dataset', label: 'Create New Dataset', category: 'Actions', icon: <Plus size={14} />, action: () => { router.push('/dashboard/datasets'); setOpen(false); } },
    { id: 'probes', label: 'Run Probe Suite', category: 'Actions', icon: <ShieldAlert size={14} />, action: () => { router.push('/dashboard/probes'); setOpen(false); } },
    { id: 'example', label: 'Load Example Data', category: 'Actions', icon: <Sparkles size={14} />, action: () => { router.push('/dashboard/endpoints'); setOpen(false); } },
  ];

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const grouped = filtered.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center"
        style={{ background: 'rgba(0,5,7,0.8)', backdropFilter: 'blur(8px)', paddingTop: '20vh' }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="rounded-xl overflow-hidden"
          style={{
            width: '100%', maxWidth: '520px',
            background: 'rgba(1,20,24,0.98)', border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 0 60px rgba(59,130,246,0.08), 0 20px 60px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
            <Search size={18} className="text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, endpoints, pages..."
              className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-primary)]"
              style={{ fontFamily: 'inherit' }}
            />
            <kbd className="text-[10px] font-mono text-[var(--color-text-muted)] rounded" style={{ padding: '2px 8px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>ESC</kbd>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)]" style={{ padding: '8px 12px 4px' }}>{category}</div>
                {items.map((item) => {
                  const globalIndex = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 text-sm rounded-lg transition-all"
                      style={{
                        padding: '10px 12px',
                        color: globalIndex === selectedIndex ? '#3B82F6' : '#E0F2F1',
                        background: globalIndex === selectedIndex ? 'rgba(59,130,246,0.08)' : 'transparent',
                      }}
                    >
                      <span className="text-[var(--color-text-secondary)]">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-sm text-[var(--color-text-muted)]" style={{ padding: '2rem' }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
