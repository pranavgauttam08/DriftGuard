'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { loadValue, saveValue } from '@/lib/persistence';
import { PROVIDER_DISPLAY, AIProvider } from '@/lib/ai-providers';
import {
  Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Zap, Shield,
  AlertTriangle,
} from 'lucide-react';

interface StoredKey {
  provider: AIProvider;
  apiKey: string;
  connected: boolean;
  models: string[];
  lastTested: string | null;
}

const PROVIDERS: { id: AIProvider; name: string; color: string; description: string }[] = [
  { id: 'anthropic', name: 'Anthropic (Claude)', color: '#D4A574', description: 'Claude Haiku, Sonnet, Opus — Behavioral Version Control testing' },
  { id: 'google', name: 'Google (Gemini)', color: '#4285F4', description: 'Gemini Flash, Pro — Multi-modal AI evaluation' },
  { id: 'openai', name: 'OpenAI', color: '#10A37F', description: 'GPT-4o, GPT-4o Mini, o3 — Broad model testing' },
];

export default function APIKeysPage() {
  const { user } = useUser();
  const userId = user?.id || 'anonymous';

  const [keys, setKeys] = useState<Record<AIProvider, StoredKey>>({
    anthropic: { provider: 'anthropic', apiKey: '', connected: false, models: [], lastTested: null },
    google: { provider: 'google', apiKey: '', connected: false, models: [], lastTested: null },
    openai: { provider: 'openai', apiKey: '', connected: false, models: [], lastTested: null },
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  // Load saved keys
  useEffect(() => {
    const saved = loadValue<Record<AIProvider, StoredKey>>(userId, 'ai_provider_keys', keys);
    setKeys(saved);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist keys on change
  const updateKey = (provider: AIProvider, updates: Partial<StoredKey>) => {
    setKeys(prev => {
      const updated = { ...prev, [provider]: { ...prev[provider], ...updates } };
      saveValue(userId, 'ai_provider_keys', updated);
      return updated;
    });
  };

  const testConnection = async (provider: AIProvider) => {
    const apiKey = keys[provider].apiKey;
    if (!apiKey.trim()) return;

    setTesting(provider);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json();
      updateKey(provider, {
        connected: data.success,
        models: data.models || [],
        lastTested: new Date().toISOString(),
      });
    } catch {
      updateKey(provider, { connected: false, models: [], lastTested: new Date().toISOString() });
    }
    setTesting(null);
  };

  const disconnectProvider = (provider: AIProvider) => {
    updateKey(provider, { apiKey: '', connected: false, models: [], lastTested: null });
  };

  const connectedCount = Object.values(keys).filter(k => k.connected).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="AI Provider Keys" />

      {/* Status banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl flex items-center justify-between"
        style={{
          padding: '1rem 1.5rem',
          background: connectedCount > 0 ? 'rgba(0,255,136,0.04)' : 'rgba(255,184,0,0.04)',
          border: `1px solid ${connectedCount > 0 ? 'rgba(0,255,136,0.15)' : 'rgba(255,184,0,0.15)'}`,
        }}>
        <div className="flex items-center gap-3">
          <Zap size={18} style={{ color: connectedCount > 0 ? '#00FF88' : '#FFB800' }} />
          <div>
            <span className="text-sm font-medium text-[var(--color-surface-text)]">
              {connectedCount > 0
                ? `${connectedCount} provider${connectedCount > 1 ? 's' : ''} connected`
                : 'No providers connected'}
            </span>
            <p className="text-[10px] text-[var(--color-ghost-text)]">
              {connectedCount > 0
                ? 'DriftGuard can test real AI models for behavioral analysis'
                : 'Add API keys to enable real model testing, cost analysis, and recommendations'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-ghost-text)]">
          <Shield size={10} /> Keys stored locally, never logged
        </div>
      </motion.div>

      {/* Provider cards */}
      {PROVIDERS.map((provider, i) => {
        const keyData = keys[provider.id];
        const isConnected = keyData.connected;
        const isTesting = testing === provider.id;

        return (
          <motion.div key={provider.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bio-card" style={{ padding: '1.5rem' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg flex items-center justify-center"
                  style={{ width: '36px', height: '36px', background: provider.color + '15', border: `1px solid ${provider.color}30` }}>
                  <Key size={16} style={{ color: provider.color }} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-surface-text)]">{provider.name}</span>
                  <p className="text-[10px] text-[var(--color-ghost-text)]">{provider.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-mono rounded-full"
                    style={{ padding: '3px 10px', background: 'rgba(0,255,136,0.08)', color: '#00FF88' }}>
                    <CheckCircle2 size={10} /> Connected
                  </span>
                )}
                {keyData.lastTested && !isConnected && keyData.apiKey && (
                  <span className="flex items-center gap-1 text-[10px] font-mono rounded-full"
                    style={{ padding: '3px 10px', background: 'rgba(255,61,107,0.08)', color: '#FF3D6B' }}>
                    <XCircle size={10} /> Failed
                  </span>
                )}
              </div>
            </div>

            {/* API Key input */}
            <div className="flex gap-2" style={{ marginBottom: '0.75rem' }}>
              <div className="relative flex-1">
                <input
                  type={showKey[provider.id] ? 'text' : 'password'}
                  className="bio-input w-full font-mono text-xs"
                  placeholder={`Enter your ${provider.name} API key...`}
                  value={keyData.apiKey}
                  onChange={e => updateKey(provider.id, { apiKey: e.target.value, connected: false })}
                  style={{ paddingRight: '36px' }}
                />
                <button onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ghost-text)] hover:text-[var(--color-surface-text)]">
                  {showKey[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <GlowButton size="sm"
                onClick={() => testConnection(provider.id)}
                disabled={!keyData.apiKey.trim() || isTesting}
                icon={isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </GlowButton>
              {isConnected && (
                <GlowButton variant="danger" size="sm" onClick={() => disconnectProvider(provider.id)}>
                  Disconnect
                </GlowButton>
              )}
            </div>

            {/* Connected models */}
            {isConnected && keyData.models.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[var(--color-ghost-text)]">Available models:</span>
                {keyData.models.map(model => (
                  <span key={model} className="text-[9px] font-mono rounded-full"
                    style={{ padding: '2px 8px', background: provider.color + '10', color: provider.color, border: `1px solid ${provider.color}25` }}>
                    {model}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Security info */}
      <div className="rounded-xl" style={{ padding: '1.25rem', background: 'rgba(0,229,255,0.02)', border: '1px solid rgba(0,229,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-[var(--color-biolume-secondary)]" />
          <span className="text-xs font-semibold text-[var(--color-surface-text)]">Security Notice</span>
        </div>
        <ul className="text-[10px] text-[var(--color-muted-text)] space-y-1" style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
          <li>API keys are stored in your browser&apos;s localStorage — they never leave your device except to contact the provider API directly</li>
          <li>Keys are scoped to your Clerk user account and are not shared with other users or organizations</li>
          <li>DriftGuard does not log, store, or transmit your API keys to our servers</li>
          <li>Use the &quot;Disconnect&quot; button to permanently remove a key from your browser</li>
        </ul>
      </div>
    </div>
  );
}
