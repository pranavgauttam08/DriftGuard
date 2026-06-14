'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { useTenant } from '@/hooks/useTenant';
import { Shield, Key, Plus, Eye, EyeOff, Copy, Check, Trash2, RefreshCw, Clock, FileText, AlertTriangle } from 'lucide-react';

const DEMO_API_KEYS = [
  {
    id: 'key-001', name: 'Production Ingestion', prefix: 'dg_live_abc1...',
    scopes: ['ingest', 'read'], environment: 'production',
    lastUsed: new Date(Date.now() - 30 * 60 * 1000), totalRequests: 12847,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'key-002', name: 'CI/CD Pipeline', prefix: 'dg_live_def2...',
    scopes: ['ingest', 'read', 'fingerprint', 'diff'], environment: 'staging',
    lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000), totalRequests: 3210,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'key-003', name: 'Development Testing', prefix: 'dg_test_ghi3...',
    scopes: ['ingest'], environment: 'development',
    lastUsed: null, totalRequests: 0,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const DEMO_AUDIT = [
  { action: 'deployment.approved', user: 'admin@company.com', resource: 'support-bot v1.3.0', time: '2 hours ago' },
  { action: 'endpoint.created', user: 'dev@company.com', resource: 'analytics-ai', time: '5 hours ago' },
  { action: 'api_key.rotated', user: 'admin@company.com', resource: 'Production Ingestion', time: '1 day ago' },
  { action: 'member.invited', user: 'owner@company.com', resource: 'reviewer@company.com', time: '2 days ago' },
  { action: 'deployment.rejected', user: 'reviewer@company.com', resource: 'content-gen v3.0.0', time: '3 days ago' },
];

const SCOPE_COLORS: Record<string, string> = {
  ingest: '#00FFD1', read: '#00E5FF', fingerprint: '#00FF88',
  diff: '#FFB800', admin: '#FF3D6B',
};

export default function SecurityPage() {
  const tenant = useTenant();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyKey = (keyId: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Security & Compliance" />

      {/* API Keys Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[var(--color-biolume-primary)]" />
            <h3 className="font-semibold">Scoped API Keys</h3>
          </div>
          <GlowButton size="sm" icon={<Plus size={14} />}>Create Key</GlowButton>
        </div>

        <div className="space-y-3">
          {DEMO_API_KEYS.map(key => (
            <div key={key.id} className="rounded-lg" style={{ padding: '1rem', background: 'rgba(0,255,209,0.02)', border: '1px solid rgba(0,255,209,0.08)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-surface-text)]">{key.name}</span>
                  <span className="text-[9px] font-mono rounded" style={{
                    padding: '2px 6px',
                    background: key.environment === 'production' ? 'rgba(0,255,136,0.08)' : key.environment === 'staging' ? 'rgba(255,184,0,0.08)' : 'rgba(0,229,255,0.08)',
                    color: key.environment === 'production' ? '#00FF88' : key.environment === 'staging' ? '#FFB800' : '#00E5FF',
                  }}>{key.environment}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyKey(key.id, key.prefix)}
                    className="rounded-lg transition-all hover:bg-[rgba(0,255,209,0.06)]" style={{ padding: '6px', color: '#5A7A7D' }}>
                    {copiedKey === key.id ? <Check size={12} className="text-[#00FF88]" /> : <Copy size={12} />}
                  </button>
                  <button className="rounded-lg transition-all hover:bg-[rgba(0,255,209,0.06)]" style={{ padding: '6px', color: '#5A7A7D' }}>
                    <RefreshCw size={12} />
                  </button>
                  <button className="rounded-lg transition-all hover:bg-[rgba(255,61,107,0.1)]" style={{ padding: '6px', color: '#5A7A7D' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <code className="text-xs font-mono text-[var(--color-muted-text)]">{key.prefix}</code>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-1">
                  {key.scopes.map(scope => (
                    <span key={scope} className="text-[9px] font-mono rounded-full" style={{
                      padding: '1px 6px', background: (SCOPE_COLORS[scope] || '#5A7A7D') + '15', color: SCOPE_COLORS[scope] || '#5A7A7D',
                    }}>{scope}</span>
                  ))}
                </div>
                <span className="text-[10px] text-[var(--color-ghost-text)]">
                  {key.totalRequests.toLocaleString()} requests
                </span>
                <span className="text-[10px] text-[var(--color-ghost-text)]">
                  {key.lastUsed ? `Last used ${key.lastUsed.toLocaleDateString()}` : 'Never used'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Audit Log Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[var(--color-biolume-secondary)]" />
            <h3 className="font-semibold">Audit Log</h3>
          </div>
          <GlowButton variant="ghost" size="sm">Export</GlowButton>
        </div>

        <div className="space-y-1">
          {DEMO_AUDIT.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-xs rounded-lg"
              style={{ padding: '10px 12px', background: i % 2 === 0 ? 'rgba(0,255,209,0.02)' : 'transparent' }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] rounded" style={{
                  padding: '2px 6px', minWidth: '130px',
                  background: entry.action.includes('rejected') || entry.action.includes('rotated') ? 'rgba(255,184,0,0.08)' : 'rgba(0,255,209,0.04)',
                  color: entry.action.includes('rejected') ? '#FFB800' : '#4A8F8A',
                }}>{entry.action}</span>
                <span className="text-[var(--color-muted-text)]">{entry.user}</span>
                <span className="text-[var(--color-ghost-text)]">→</span>
                <span className="text-[var(--color-surface-text)]">{entry.resource}</span>
              </div>
              <span className="text-[var(--color-ghost-text)] flex items-center gap-1"><Clock size={10} />{entry.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Compliance Readiness */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '1.25rem' }}>
          <Shield size={16} className="text-[var(--color-biolume-tertiary)]" />
          <h3 className="font-semibold">Compliance Readiness</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { name: 'SOC 2', status: 'partial', items: '8/12 controls', color: '#FFB800' },
            { name: 'GDPR', status: 'partial', items: '5/8 requirements', color: '#FFB800' },
            { name: 'Data Encryption', status: 'active', items: 'AES-256 at rest', color: '#00FF88' },
            { name: 'Audit Logging', status: 'active', items: 'All mutations logged', color: '#00FF88' },
            { name: 'PII Masking', status: 'configure', items: 'Not configured', color: '#5A7A7D' },
            { name: 'Key Rotation', status: 'configure', items: 'Manual only', color: '#5A7A7D' },
          ].map(item => (
            <div key={item.name} className="rounded-lg" style={{ padding: '1rem', background: 'rgba(0,255,209,0.02)', border: '1px solid rgba(0,255,209,0.06)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <span className="text-sm font-medium text-[var(--color-surface-text)]">{item.name}</span>
                <span className="rounded-full" style={{ width: '8px', height: '8px', background: item.color }} />
              </div>
              <span className="text-[10px] text-[var(--color-muted-text)]">{item.items}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* PII Masking Config */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl" style={{ padding: '1.5rem', border: '1px solid rgba(255,184,0,0.2)', background: 'rgba(255,184,0,0.02)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
          <AlertTriangle size={16} className="text-[var(--color-biolume-warning)]" />
          <h3 className="font-semibold text-[var(--color-biolume-warning)]">PII Protection</h3>
        </div>
        <p className="text-xs text-[var(--color-muted-text)]" style={{ marginBottom: '1rem' }}>
          Automatically detect and mask personally identifiable information in ingested responses before storage.
        </p>
        <div className="flex gap-3">
          <GlowButton size="sm">Enable PII Masking</GlowButton>
          <GlowButton variant="ghost" size="sm">Configure Rules</GlowButton>
        </div>
      </motion.div>
    </div>
  );
}
