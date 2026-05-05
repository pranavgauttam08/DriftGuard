'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useDriftGuardContext } from '../layout';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import DataSender from '@/components/dashboard/DataSender';
import { Plus, Server, Eye, GitBranch, MoreHorizontal, Trash2, Copy, ShieldAlert, Loader2 } from 'lucide-react';

interface EndpointData {
  id: string;
  name: string;
  description: string;
  latest_version: string;
  total_responses: number;
  status: string;
  created_at: string;
  last_active_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function EndpointsPage() {
  const dg = useDriftGuardContext();
  const [showCreate, setShowCreate] = useState(false);
  const [showSender, setShowSender] = useState<string | null>(null);
  const [senderVersion, setSenderVersion] = useState('v1.0.0');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Convert context endpoints to display format
  const endpoints = dg.endpoints.map(ep => ({
    id: ep.id,
    name: ep.name,
    description: ep.description,
    latest_version: ep.latestVersion,
    total_responses: ep.totalResponses,
    status: ep.status,
    created_at: ep.createdAt instanceof Date ? ep.createdAt.toISOString() : String(ep.createdAt),
    last_active_at: ep.lastActiveAt instanceof Date ? ep.lastActiveAt.toISOString() : (ep.lastActiveAt ? String(ep.lastActiveAt) : ''),
  }));

  const createEndpoint = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      if (data.endpoint) {
        // Add to shared context → propagates to Overview, Timeline, etc.
        dg.addEndpoint({
          id: data.endpoint.id || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: data.endpoint.name || newName.trim(),
          description: data.endpoint.description || newDesc.trim(),
          createdAt: new Date(),
          latestVersion: 'v1.0.0',
          totalResponses: 0,
          status: 'healthy',
          lastActiveAt: new Date(),
        });
        setNewName(''); setNewDesc(''); setShowCreate(false);
      }
    } catch {}
    setCreating(false);
  };

  const deleteEndpoint = async (id: string) => {
    if (!confirm('Delete this endpoint and ALL associated data? This cannot be undone.')) return;
    try {
      await fetch(`/api/endpoints?id=${id}`, { method: 'DELETE' });
      // Remove from shared context → propagates everywhere
      dg.removeEndpoint(id);
    } catch {}
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const openSender = (epId: string) => {
    const ep = dg.endpoints.find(e => e.id === epId);
    // Suggest next version number
    const currentVersion = ep?.latestVersion || 'v1.0.0';
    const parts = currentVersion.replace('v', '').split('.');
    const nextPatch = `v${parts[0]}.${parts[1]}.${parseInt(parts[2] || '0') + 1}`;
    setSenderVersion(nextPatch);
    setShowSender(epId);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="My Endpoints" />

      {/* Create button */}
      <div className="flex justify-end">
        <GlowButton onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>New Endpoint</GlowButton>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,5,7,0.8)', backdropFilter: 'blur(6px)' }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
              className="bio-card" style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold" style={{ marginBottom: '1.5rem' }}>Create New Endpoint</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Endpoint Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder='e.g. "support-bot"'
                  className="bio-input w-full" onKeyDown={e => e.key === 'Enter' && createEndpoint()} autoFocus />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Description (optional)</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does this AI do?"
                  className="bio-input w-full" />
              </div>
              <div className="flex gap-3">
                <GlowButton onClick={createEndpoint} disabled={!newName.trim() || creating}
                  icon={creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}>
                  {creating ? 'Creating...' : 'Create'}
                </GlowButton>
                <GlowButton variant="ghost" onClick={() => setShowCreate(false)}>Cancel</GlowButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DataSender modal */}
      <AnimatePresence>
        {showSender && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,5,7,0.8)', backdropFilter: 'blur(6px)', padding: '2rem' }}
            onClick={() => setShowSender(null)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              style={{ width: '100%', maxWidth: '640px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 className="text-lg font-bold">Send Data — {showSender}</h3>
                <GlowButton variant="ghost" size="sm" onClick={() => setShowSender(null)}>Close</GlowButton>
              </div>
              <DataSender
                endpointId={showSender}
                version={senderVersion}
                onResponseSent={() => {
                  // Each individual response → update count in shared context
                  dg.ingestResponse(showSender!, senderVersion);
                }}
                onAllSent={(count) => {
                  // Batch complete → auto-generate fingerprint + diff
                  dg.onBatchComplete(showSender!, senderVersion, count);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Endpoints grid */}
      {endpoints.length === 0 ? (
        /* Empty state */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center" style={{ padding: '5rem 2rem' }}
        >
          <div className="mx-auto" style={{ width: '80px', height: '80px', marginBottom: '2rem' }}>
            <svg viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" stroke="rgba(0,255,209,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="40" cy="40" r="20" stroke="rgba(0,255,209,0.25)" strokeWidth="1" />
              <circle cx="40" cy="40" r="4" fill="rgba(0,255,209,0.3)" />
              <text x="40" y="45" textAnchor="middle" fill="rgba(0,255,209,0.4)" fontSize="20">?</text>
            </svg>
          </div>
          <h3 className="text-lg font-semibold" style={{ marginBottom: '0.5rem' }}>No endpoints yet.</h3>
          <p className="text-sm text-[var(--color-muted-text)]" style={{ marginBottom: '2rem', maxWidth: '360px', margin: '0 auto 2rem' }}>
            Create your first endpoint to start monitoring your AI.
          </p>
          <GlowButton onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>Create First Endpoint</GlowButton>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {endpoints.map((ep, i) => (
            <motion.div key={ep.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="bio-card" style={{ padding: '1.25rem' }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div className="flex items-center gap-2">
                  <span className="rounded-full" style={{
                    width: '8px', height: '8px',
                    background: ep.status === 'healthy' ? '#00FF88' : ep.status === 'critical' ? '#FF3D6B' : '#FFB800',
                    boxShadow: `0 0 8px ${ep.status === 'healthy' ? '#00FF88' : ep.status === 'critical' ? '#FF3D6B' : '#FFB800'}`,
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                  <span className="font-semibold text-sm text-[var(--color-surface-text)]">{ep.name}</span>
                </div>
                <span className="text-[10px] font-mono uppercase" style={{
                  padding: '3px 8px', borderRadius: '6px',
                  background: ep.status === 'healthy' ? 'rgba(0,255,136,0.1)' : ep.status === 'critical' ? 'rgba(255,61,107,0.1)' : 'rgba(255,184,0,0.1)',
                  color: ep.status === 'healthy' ? '#00FF88' : ep.status === 'critical' ? '#FF3D6B' : '#FFB800',
                }}>{ep.status}</span>
              </div>
              <div className="space-y-1 text-xs text-[var(--color-muted-text)]" style={{ marginBottom: '1.25rem' }}>
                <div className="flex justify-between"><span>Latest version</span><span className="font-mono">{ep.latest_version || 'v1.0.0'}</span></div>
                <div className="flex justify-between"><span>Total responses</span><span className="font-mono">{ep.total_responses || 0}</span></div>
                <div className="flex justify-between"><span>Last active</span><span>{ep.last_active_at ? timeAgo(ep.last_active_at) : 'Never'}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <GlowButton variant="ghost" size="sm" icon={<Eye size={12} />}
                  onClick={() => dg.selectEndpoint(dg.endpoints.find(e => e.id === ep.id)!)}>
                  Select
                </GlowButton>
                <GlowButton variant="ghost" size="sm" onClick={() => openSender(ep.id)} icon={<GitBranch size={12} />}>
                  New Version
                </GlowButton>
                <div className="relative ml-auto">
                  <button onClick={() => setMenuOpen(menuOpen === ep.id ? null : ep.id)}
                    className="rounded-lg transition-all" style={{ padding: '6px', color: '#5A7A7D' }}>
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === ep.id && (
                    <div className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-20"
                      style={{ width: '160px', background: 'rgba(1,20,24,0.98)', border: '1px solid rgba(0,255,209,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                      <button onClick={() => { copyId(ep.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 text-xs text-left transition-all"
                        style={{ padding: '10px 14px', color: '#E0F2F1' }}>
                        <Copy size={12} /> Copy Endpoint ID
                      </button>
                      <button onClick={() => { setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 text-xs text-left transition-all"
                        style={{ padding: '10px 14px', color: '#E0F2F1' }}>
                        <ShieldAlert size={12} /> Run Probes
                      </button>
                      <button onClick={() => { deleteEndpoint(ep.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 text-xs text-left transition-all"
                        style={{ padding: '10px 14px', color: '#FF3D6B' }}>
                        <Trash2 size={12} /> Delete Endpoint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
