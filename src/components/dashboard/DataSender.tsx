'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Loader2, Plus, Sparkles, Key, FileText, Code } from 'lucide-react';
import GlowButton from '@/components/ui/GlowButton';
import { exampleSets, ExampleResponse } from '@/lib/example-data';

type Tab = 'manual' | 'bulk' | 'examples' | 'apikey';

interface DataSenderProps {
  endpointId: string;
  version: string;
  apiKey?: string;
  onResponseSent?: () => void;
  onAllSent?: (count: number) => void;
}

export default function DataSender({ endpointId, version, apiKey, onResponseSent, onAllSent }: DataSenderProps) {
  const [tab, setTab] = useState<Tab>('manual');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [latency, setLatency] = useState('500');
  const [tokens, setTokens] = useState('100');
  const [bulkJson, setBulkJson] = useState('');
  const [queue, setQueue] = useState<Array<ExampleResponse & { status: 'pending' | 'sending' | 'sent' | 'error' }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentTotal, setSentTotal] = useState(0);
  const [copied, setCopied] = useState(false);
  const [codeLang, setCodeLang] = useState<'curl' | 'typescript' | 'python'>('curl');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'manual', label: 'Manual Entry', icon: <Plus size={14} /> },
    { key: 'bulk', label: 'Bulk Paste', icon: <FileText size={14} /> },
    { key: 'examples', label: 'Load Examples', icon: <Sparkles size={14} /> },
    { key: 'apikey', label: 'API Key', icon: <Key size={14} /> },
  ];

  const addToQueue = () => {
    if (!query.trim() || !response.trim()) return;
    setQueue(prev => [...prev, { query: query.trim(), response: response.trim(), latencyMs: parseInt(latency) || 500, tokenCount: parseInt(tokens) || 100, status: 'pending' }]);
    setQuery(''); setResponse('');
  };

  const parseBulk = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
      const items = parsed.map((p: any) => ({
        query: p.query || '', response: p.response || '', latencyMs: p.latencyMs || 500, tokenCount: p.tokenCount || 100, status: 'pending' as const,
      }));
      setQueue(prev => [...prev, ...items]);
      setBulkJson('');
    } catch (e) {
      alert('Invalid JSON. Must be an array of { query, response, latencyMs?, tokenCount? }');
    }
  };

  const loadExampleSet = (set: typeof exampleSets[0]) => {
    const items = set.responses.map(r => ({ ...r, status: 'pending' as const }));
    setQueue(prev => [...prev, ...items]);
  };

  const sendAll = async () => {
    setIsSending(true);
    let count = 0;
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === 'sent') continue;
      setQueue(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'sending' } : r));
      try {
        await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointId, version,
            query: queue[i].query,
            response: queue[i].response,
            latencyMs: queue[i].latencyMs,
            tokenCount: queue[i].tokenCount,
          }),
        });
        setQueue(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'sent' } : r));
        count++;
        setSentTotal(prev => prev + 1);
        onResponseSent?.();
        await new Promise(r => setTimeout(r, 150)); // Visual delay
      } catch {
        setQueue(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
    }
    setIsSending(false);
    onAllSent?.(count);
  };

  const copyKey = () => {
    if (apiKey) { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const pendingCount = queue.filter(r => r.status === 'pending').length;
  const sentCount = queue.filter(r => r.status === 'sent').length;

  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST https://driftguard.vercel.app/api/ingest \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "endpointId": "${endpointId}",
    "version": "${version}",
    "query": "your query here",
    "response": "ai response here",
    "latencyMs": 500,
    "tokenCount": 100
  }'`,
    typescript: `const response = await fetch('https://driftguard.vercel.app/api/ingest', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpointId: '${endpointId}',
    version: '${version}',
    query: userQuery,
    response: aiResponse,
    latencyMs: responseTime,
    tokenCount: tokens
  })
});`,
    python: `import requests

response = requests.post(
    'https://driftguard.vercel.app/api/ingest',
    headers={
        'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}',
        'Content-Type': 'application/json'
    },
    json={
        'endpointId': '${endpointId}',
        'version': '${version}',
        'query': user_query,
        'response': ai_response,
        'latencyMs': response_time,
        'tokenCount': token_count
    }
)`,
  };

  return (
    <div className="bio-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Tabs */}
      <div className="flex border-b border-[var(--color-biolume-border)]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 text-xs font-mono transition-all"
            style={{
              padding: '12px 16px', flex: 1,
              color: tab === t.key ? '#00FFD1' : '#5A7A7D',
              background: tab === t.key ? 'rgba(0,255,209,0.06)' : 'transparent',
              borderBottom: tab === t.key ? '2px solid #00FFD1' : '2px solid transparent',
            }}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Manual Entry */}
        {tab === 'manual' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Query</label>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="User's question..." className="bio-input w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Response</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="AI's response..." className="bio-input w-full" rows={3} style={{ resize: 'vertical' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Latency (ms)</label>
                <input value={latency} onChange={e => setLatency(e.target.value)} className="bio-input w-full" type="number" />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Tokens</label>
                <input value={tokens} onChange={e => setTokens(e.target.value)} className="bio-input w-full" type="number" />
              </div>
            </div>
            <GlowButton onClick={addToQueue} variant="ghost" size="sm" icon={<Plus size={14} />}>Add to Queue</GlowButton>
          </div>
        )}

        {/* Bulk Paste */}
        {tab === 'bulk' && (
          <div className="space-y-3">
            <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-1">Paste JSON array</label>
            <textarea value={bulkJson} onChange={e => setBulkJson(e.target.value)} placeholder='[{"query":"...", "response":"...", "latencyMs": 500, "tokenCount": 100}]'
              className="bio-input w-full font-mono text-xs" rows={8} style={{ resize: 'vertical' }} />
            <GlowButton onClick={parseBulk} variant="ghost" size="sm">Parse & Queue</GlowButton>
          </div>
        )}

        {/* Load Examples */}
        {tab === 'examples' && (
          <div className="grid grid-cols-2 gap-3">
            {exampleSets.map((set, i) => (
              <button key={i} onClick={() => loadExampleSet(set)}
                className="text-left rounded-lg transition-all hover:border-[rgba(0,255,209,0.3)]"
                style={{ padding: '14px', background: 'rgba(0,255,209,0.03)', border: '1px solid rgba(0,255,209,0.1)' }}>
                <div className="text-lg" style={{ marginBottom: '4px' }}>{set.icon}</div>
                <div className="text-sm font-semibold text-[var(--color-surface-text)]">{set.name}</div>
                <div className="text-xs text-[var(--color-ghost-text)]">{set.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* API Key */}
        {tab === 'apikey' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--color-muted-text)] font-mono mb-2">Your API Key</label>
              <div className="flex items-center gap-2">
                <code className="bio-input flex-1 text-xs font-mono truncate" style={{ padding: '10px 14px' }}>
                  {apiKey || 'Loading...'}
                </code>
                <button onClick={copyKey} className="bio-button-ghost !p-2.5" title="Copy">
                  {copied ? <Check size={14} className="text-[var(--color-biolume-tertiary)]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {(['curl', 'typescript', 'python'] as const).map(lang => (
                <button key={lang} onClick={() => setCodeLang(lang)}
                  className="text-xs font-mono rounded-lg transition-all"
                  style={{
                    padding: '6px 14px',
                    background: codeLang === lang ? 'rgba(0,255,209,0.1)' : 'transparent',
                    border: `1px solid ${codeLang === lang ? 'rgba(0,255,209,0.3)' : 'rgba(0,255,209,0.08)'}`,
                    color: codeLang === lang ? '#00FFD1' : '#5A7A7D',
                  }}>
                  {lang}
                </button>
              ))}
            </div>
            <pre className="text-xs font-mono rounded-lg overflow-x-auto" style={{ padding: '16px', background: 'rgba(0,0,0,0.4)', color: '#8AEACC', border: '1px solid rgba(0,255,209,0.08)', lineHeight: 1.6 }}>
              {codeSnippets[codeLang]}
            </pre>
          </div>
        )}

        {/* Queue display */}
        {queue.length > 0 && tab !== 'apikey' && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,255,209,0.08)', paddingTop: '1.5rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <span className="text-xs font-mono text-[var(--color-muted-text)]">
                Queue: {sentCount} sent, {pendingCount} pending
              </span>
              {pendingCount > 0 && (
                <GlowButton onClick={sendAll} disabled={isSending} size="sm" icon={isSending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}>
                  {isSending ? 'Sending...' : `Send All (${pendingCount})`}
                </GlowButton>
              )}
            </div>
            {/* Progress bar */}
            {queue.length > 0 && (
              <div className="rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(0,255,209,0.08)', marginBottom: '1rem' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #00FFD1, #00E5FF)' }}
                  animate={{ width: `${(sentCount / queue.length) * 100}%` }} />
              </div>
            )}
            <div className="space-y-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {queue.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs rounded" style={{ padding: '6px 10px', background: item.status === 'sent' ? 'rgba(0,255,136,0.04)' : 'rgba(0,255,209,0.02)' }}>
                  {item.status === 'sent' ? <Check size={12} className="text-[#00FF88] shrink-0" /> :
                   item.status === 'sending' ? <Loader2 size={12} className="animate-spin text-[#00FFD1] shrink-0" /> :
                   <div className="w-3 h-3 rounded-full border border-[rgba(0,255,209,0.2)] shrink-0" />}
                  <span className="truncate text-[var(--color-muted-text)]">{item.query}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Arrow icon for the send button
function ArrowRight({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
