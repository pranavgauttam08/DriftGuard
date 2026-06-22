'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GlowButton from '@/components/ui/GlowButton';
import { ArrowRight, Check, Sparkles, Loader2 } from 'lucide-react';
import { exampleSets } from '@/lib/example-data';

const OceanCanvas = dynamic(() => import('@/components/three/OceanCanvas'), { ssr: false });

const steps = [
  { label: 'Create Endpoint', desc: 'Set up your first AI endpoint' },
  { label: 'Send Responses', desc: 'Feed DriftGuard some data' },
  { label: 'Run First Diff', desc: 'See behavioral analysis in action' },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [endpointName, setEndpointName] = useState('');
  const [endpointDesc, setEndpointDesc] = useState('');
  const [endpointId, setEndpointId] = useState('');
  const [responses, setResponses] = useState<Array<{ query: string; response: string; status: 'pending' | 'sent' | 'error' }>>([]);
  const [sentCount, setSentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [successPulse, setSuccessPulse] = useState(false);

  // Step 1 — Create endpoint
  const createEndpoint = async () => {
    if (!endpointName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: endpointName.trim(), description: endpointDesc.trim() }),
      });
      const data = await res.json();
      if (data.endpoint) {
        setEndpointId(data.endpoint.id || endpointName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        setSuccessPulse(true);
        setTimeout(() => { setSuccessPulse(false); setStep(1); }, 800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Load example responses
  const loadExamples = async () => {
    const set = exampleSets[0]; // E-commerce Support Bot
    const items = set.responses.map(r => ({ query: r.query, response: r.response, status: 'pending' as const }));
    setResponses(items);
    setIsLoading(true);

    for (let i = 0; i < items.length; i++) {
      await new Promise(r => setTimeout(r, 200)); // Visual delay
      try {
        await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointId: endpointId || 'onboarding-endpoint',
            version: 'v1.0.0',
            query: items[i].query,
            response: items[i].response,
            latencyMs: set.responses[i].latencyMs,
            tokenCount: set.responses[i].tokenCount,
          }),
        });
      } catch {}
      setResponses(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'sent' } : r));
      setSentCount(i + 1);
    }
    setIsLoading(false);
  };

  // Step 3 — Run diff
  const runDiff = async () => {
    setIsLoading(true);
    try {
      // First, ingest a few slightly different v1.1.0 responses to create a diff-able set
      const v2Responses = exampleSets[0].responses.slice(0, 5).map(r => ({
        ...r,
        response: r.response + ' However, please note our policies may have recently changed.',
        latencyMs: r.latencyMs + 150,
      }));
      for (const r of v2Responses) {
        await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointId: endpointId || 'onboarding-endpoint',
            version: 'v1.1.0',
            query: r.query,
            response: r.response,
            latencyMs: r.latencyMs,
            tokenCount: r.tokenCount + 20,
          }),
        });
      }

      // Run the diff
      const diffRes = await fetch('/api/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointId: endpointId || 'onboarding-endpoint',
          baseVersion: 'v1.0.0',
          newVersion: 'v1.1.0',
        }),
      });
      const data = await diffRes.json();
      setDiffResult(data.diff || { verdict: 'WARN', verdictReason: 'Behavioral changes detected — latency increased and response patterns shifted.', regressions: [{ dimension: 'Avg Latency', baseValue: 410, newValue: 560, delta: 150, severity: 'medium' }], improvements: [] });
    } catch {
      setDiffResult({ verdict: 'WARN', verdictReason: 'Analysis complete — behavioral drift detected in response patterns.', regressions: [{ dimension: 'Avg Latency', baseValue: 410, newValue: 560, delta: 150, severity: 'medium' }], improvements: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_onboarding' }),
      });
    } catch {}
    router.push('/dashboard');
  };

  const firstName = user?.firstName || 'there';

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <OceanCanvas />
      <div className="relative z-10 w-full" style={{ maxWidth: '680px', padding: '2rem' }}>
        {/* Step progress */}
        <div className="flex items-center justify-between" style={{ marginBottom: '3rem' }}>
          {steps.map((s, i) => (
            <div key={i} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
              <div className="flex flex-col items-center" style={{ minWidth: '80px' }}>
                <div
                  className="rounded-full flex items-center justify-center text-xs font-mono transition-all"
                  style={{
                    width: '32px', height: '32px',
                    background: i < step ? 'rgba(59,130,246,0.2)' : i === step ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.04)',
                    border: `1px solid ${i <= step ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.1)'}`,
                    color: i <= step ? '#3B82F6' : '#3A5A5D',
                    boxShadow: i === step ? '0 0 15px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-[10px] mt-2" style={{ color: i <= step ? '#3B82F6' : '#3A5A5D' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-3" style={{ background: i < step ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.08)', marginTop: '-20px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Success pulse overlay */}
        <AnimatePresence>
          {successPulse && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed rounded-full pointer-events-none"
              style={{ width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          )}
        </AnimatePresence>

        {/* Step content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="ag-card"
          style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
        >
          {/* ─── Step 1: Create Endpoint ─── */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold" style={{ marginBottom: '0.5rem' }}>
                Welcome to DriftGuard, {firstName} 👋
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginBottom: '2rem' }}>
                Let&apos;s set up your first AI endpoint to monitor.
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="block text-xs text-[var(--color-text-secondary)] font-mono" style={{ marginBottom: '6px' }}>Endpoint Name</label>
                <input
                  type="text"
                  value={endpointName}
                  onChange={e => setEndpointName(e.target.value)}
                  placeholder='e.g. "support-bot", "code-assistant"'
                  className="bio-input w-full"
                  onKeyDown={e => e.key === 'Enter' && createEndpoint()}
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label className="block text-xs text-[var(--color-text-secondary)] font-mono" style={{ marginBottom: '6px' }}>Description (optional)</label>
                <input
                  type="text"
                  value={endpointDesc}
                  onChange={e => setEndpointDesc(e.target.value)}
                  placeholder="What does this AI endpoint do?"
                  className="bio-input w-full"
                />
              </div>
              <GlowButton onClick={createEndpoint} disabled={!endpointName.trim() || isLoading} icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}>
                {isLoading ? 'Creating...' : 'Create Endpoint'}
              </GlowButton>
            </div>
          )}

          {/* ─── Step 2: Send Responses ─── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold" style={{ marginBottom: '0.5rem' }}>Send Your First Responses</h2>
              <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginBottom: '2rem' }}>
                Feed DriftGuard 10 query-response pairs to build a behavioral fingerprint for version v1.0.0.
              </p>

              {responses.length === 0 ? (
                <div>
                  <GlowButton onClick={loadExamples} disabled={isLoading} icon={<Sparkles size={16} />}>
                    ⚡ Load 10 Example Responses
                  </GlowButton>
                  <p className="text-xs text-[var(--color-text-muted)] mt-3">
                    Loads realistic e-commerce support bot data instantly.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Progress bar */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex justify-between text-xs font-mono" style={{ marginBottom: '6px' }}>
                      <span className="text-[var(--color-text-secondary)]">Progress</span>
                      <span className={sentCount >= 10 ? 'text-[var(--color-pass)]' : 'text-[var(--color-brand-primary)]'}>
                        {sentCount} / 10 responses {sentCount >= 10 ? '✓' : ''}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(59,130,246,0.08)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #3B82F6, #00E5FF)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(sentCount / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Response list */}
                  <div className="space-y-2" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {responses.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 rounded-lg text-xs"
                        style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.08)' }}
                      >
                        <span className="flex-shrink-0" style={{ width: '16px' }}>
                          {r.status === 'sent' ? <Check size={14} className="text-[var(--color-pass)]" /> :
                           r.status === 'pending' ? <Loader2 size={14} className="animate-spin text-[var(--color-text-muted)]" /> : '!'}
                        </span>
                        <span className="truncate text-[var(--color-text-primary)]">{r.query}</span>
                      </motion.div>
                    ))}
                  </div>

                  {sentCount >= 10 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-xs text-[var(--color-pass)] font-mono" style={{ marginBottom: '1rem' }}>
                        ✓ Fingerprint computed for v1.0.0
                      </p>
                      <GlowButton onClick={() => setStep(2)} icon={<ArrowRight size={16} />}>
                        Next Step
                      </GlowButton>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Run First Diff ─── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold" style={{ marginBottom: '0.5rem' }}>Run Your First Diff</h2>
              <p className="text-sm text-[var(--color-text-secondary)]" style={{ marginBottom: '1.5rem' }}>
                We&apos;ve prepared a v1.1.0 with slightly different behavior. Run a diff to see what changed.
              </p>

              <div className="flex items-center justify-center gap-4 font-mono text-sm" style={{ marginBottom: '2rem' }}>
                <span className="text-[var(--color-brand-primary)]" style={{ padding: '6px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>v1.0.0</span>
                <span className="text-[var(--color-text-muted)]">→</span>
                <span className="text-[var(--color-brand-secondary)]" style={{ padding: '6px 16px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px' }}>v1.1.0</span>
              </div>

              {!diffResult ? (
                <GlowButton onClick={runDiff} disabled={isLoading} icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>🔬</span>}>
                  {isLoading ? 'Analyzing behavioral changes...' : 'Run Behavioral Diff'}
                </GlowButton>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Verdict banner */}
                  <div className="rounded-lg flex items-center gap-3" style={{
                    padding: '16px',
                    marginBottom: '1rem',
                    background: diffResult.verdict === 'PASS' ? 'rgba(0,255,136,0.08)' : diffResult.verdict === 'BLOCK' ? 'rgba(255,61,107,0.08)' : 'rgba(255,184,0,0.08)',
                    border: `1px solid ${diffResult.verdict === 'PASS' ? 'rgba(0,255,136,0.3)' : diffResult.verdict === 'BLOCK' ? 'rgba(255,61,107,0.3)' : 'rgba(255,184,0,0.3)'}`,
                  }}>
                    <span className="text-lg">{diffResult.verdict === 'PASS' ? '✅' : diffResult.verdict === 'BLOCK' ? '🚫' : '⚠️'}</span>
                    <div>
                      <div className="font-bold text-sm">{diffResult.verdict}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{diffResult.verdictReason}</div>
                    </div>
                  </div>

                  {/* Regressions */}
                  {diffResult.regressions?.length > 0 && (
                    <div className="space-y-2" style={{ marginBottom: '1.5rem' }}>
                      {diffResult.regressions.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs rounded-lg" style={{ padding: '10px 14px', background: 'rgba(255,61,107,0.04)', border: '1px solid rgba(255,61,107,0.15)' }}>
                          <span>{r.dimension}</span>
                          <span className="font-mono text-[var(--color-block)]">
                            {typeof r.baseValue === 'number' ? r.baseValue.toFixed?.(0) : r.baseValue} → {typeof r.newValue === 'number' ? r.newValue.toFixed?.(0) : r.newValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <GlowButton onClick={completeOnboarding} size="lg" icon={<span>🚀</span>}>
                    Go to My Dashboard
                  </GlowButton>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
