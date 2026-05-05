'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { Copy, Check, RefreshCw, Trash2, Loader2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [apiKey, setApiKey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        setProfile(data.profile);
        setApiKey(data.apiKey);
        setFullName(data.profile?.full_name || data.profile?.fullName || '');
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveName = async () => {
    setSaving(true);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
    } catch {}
    setSaving(false);
  };

  const regenerateKey = async () => {
    if (!confirm('Regenerate your API key? The current key will stop working immediately.')) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_key' }),
      });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey((prev: any) => ({ ...prev, api_key: data.apiKey, apiKey: data.apiKey }));
      }
    } catch {}
    setRegenerating(false);
  };

  const copyKey = () => {
    const key = apiKey?.api_key || apiKey?.apiKey || '';
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const responsesUsed = profile?.total_responses_ingested || profile?.totalResponsesIngested || 0;
  const usagePercent = Math.min((responsesUsed / 10000) * 100, 100);
  const keyValue = apiKey?.api_key || apiKey?.apiKey || '';

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <TopBar title="Settings" />
        <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
          <div className="rounded-full animate-pulse" style={{ width: '40px', height: '40px', background: 'radial-gradient(circle, rgba(0,255,209,0.2), transparent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Settings" />

      {/* Profile Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.5rem' }}>
        <h3 className="font-semibold" style={{ marginBottom: '1.25rem' }}>Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Full Name</label>
            <div className="flex gap-2">
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="bio-input flex-1" />
              <GlowButton variant="ghost" size="sm" onClick={saveName} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </GlowButton>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Email</label>
            <div className="bio-input" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              {profile?.email || 'Not available'}
            </div>
          </div>
          <div className="flex gap-8 text-xs text-[var(--color-muted-text)]">
            <div><span className="font-mono text-[var(--color-ghost-text)]">Member since:</span> {profile?.created_at ? new Date(profile.created_at || profile.createdAt).toLocaleDateString() : 'Today'}</div>
            <div><span className="font-mono text-[var(--color-ghost-text)]">Plan:</span> <span className="text-[var(--color-biolume-primary)] uppercase">{profile?.plan || 'free'}</span></div>
          </div>
        </div>
      </motion.div>

      {/* API Key Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bio-card" style={{ padding: '1.5rem' }}>
        <h3 className="font-semibold" style={{ marginBottom: '0.5rem' }}>API Key</h3>
        <p className="text-xs text-[var(--color-muted-text)]" style={{ marginBottom: '1.25rem' }}>
          Your secret API key for external integrations. Never share this key publicly.
        </p>
        <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <code className="bio-input flex-1 text-xs font-mono truncate" style={{ padding: '10px 14px', letterSpacing: '0.02em' }}>
            {keyValue}
          </code>
          <button onClick={copyKey} className="bio-button-ghost" style={{ padding: '10px' }} title="Copy">
            {copied ? <Check size={14} className="text-[#00FF88]" /> : <Copy size={14} />}
          </button>
          <button onClick={regenerateKey} disabled={regenerating} className="bio-button-ghost" style={{ padding: '10px' }} title="Regenerate">
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-6 text-xs text-[var(--color-ghost-text)]">
          <span>Last used: {apiKey?.last_used_at || apiKey?.lastUsedAt ? 'Recently' : 'Never'}</span>
          <span>Total requests: {apiKey?.total_requests || apiKey?.totalRequests || 0}</span>
        </div>
        <p className="text-[10px] text-[var(--color-biolume-warning)] mt-3">
          ⚠ Regenerating your key will invalidate the current key immediately.
        </p>
      </motion.div>

      {/* Usage Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bio-card" style={{ padding: '1.5rem' }}>
        <h3 className="font-semibold" style={{ marginBottom: '1.25rem' }}>Usage This Month</h3>
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="flex justify-between text-xs" style={{ marginBottom: '6px' }}>
            <span className="text-[var(--color-muted-text)]">Responses Ingested</span>
            <span className="font-mono">{responsesUsed.toLocaleString()} / 10,000 <span className="text-[var(--color-ghost-text)]">(free tier)</span></span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '8px', background: 'rgba(0,255,209,0.06)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${usagePercent}%`,
              background: usagePercent > 80 ? 'linear-gradient(90deg, #FFB800, #FF3D6B)' : 'linear-gradient(90deg, #00FFD1, #00E5FF)',
            }} />
          </div>
          <div className="text-right text-[10px] text-[var(--color-ghost-text)] mt-1">{usagePercent.toFixed(1)}%</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Endpoints', value: profile?.total_endpoints || profile?.totalEndpoints || 0 },
            { label: 'Fingerprints', value: 0 },
            { label: 'Diffs Run', value: 0 },
          ].map(item => (
            <div key={item.label} className="text-center rounded-lg" style={{ padding: '14px', background: 'rgba(0,255,209,0.03)', border: '1px solid rgba(0,255,209,0.06)' }}>
              <div className="text-xl font-bold font-mono text-[var(--color-biolume-primary)]">{item.value}</div>
              <div className="text-[10px] text-[var(--color-ghost-text)] mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl" style={{ padding: '1.5rem', border: '1px solid rgba(255,61,107,0.2)', background: 'rgba(255,61,107,0.02)' }}>
        <h3 className="font-semibold text-[var(--color-biolume-danger)]" style={{ marginBottom: '1rem' }}>Danger Zone</h3>
        <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
          <div>
            <div className="text-sm font-medium">Delete All My Data</div>
            <div className="text-xs text-[var(--color-muted-text)]">Permanently deletes all endpoints, responses, fingerprints, and diffs.</div>
          </div>
          <GlowButton variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>Delete All Data</GlowButton>
        </div>
      </motion.div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,5,7,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowDeleteModal(false)}>
          <div className="bio-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <AlertTriangle size={24} className="text-[var(--color-biolume-danger)]" style={{ marginBottom: '1rem' }} />
            <h3 className="font-bold" style={{ marginBottom: '0.5rem' }}>Are you sure?</h3>
            <p className="text-sm text-[var(--color-muted-text)]" style={{ marginBottom: '1.5rem' }}>
              This will permanently delete all your data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE" className="bio-input w-full" style={{ marginBottom: '1rem' }} />
            <div className="flex gap-3">
              <GlowButton variant="danger" disabled={deleteConfirm !== 'DELETE'} onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
                Delete Everything
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>Cancel</GlowButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
