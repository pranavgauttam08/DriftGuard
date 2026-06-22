'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProbeResult } from '@/types';
import GlowButton from '@/components/ui/GlowButton';
import StatusBadge from '@/components/ui/StatusBadge';
import { ShieldCheck, Play } from 'lucide-react';

interface ProbeRunnerProps {
  probeResults: ProbeResult[];
  onRunProbes?: () => Promise<ProbeResult[] | null>;
  isLoading?: boolean;
}

const CATEGORIES: ProbeResult['probeType'][] = ['jailbreak', 'injection', 'hallucination', 'off_topic', 'tone_break'];
const CAT_LABELS: Record<string, string> = { jailbreak: 'Jailbreak', injection: 'Injection', hallucination: 'Hallucination', off_topic: 'Off-Topic', tone_break: 'Tone Break' };

export default function ProbeRunner({ probeResults, onRunProbes, isLoading }: ProbeRunnerProps) {
  const [running, setRunning] = useState(false);
  const passCount = probeResults.filter(p => p.passed).length;
  const failCount = probeResults.filter(p => !p.passed).length;
  const criticalCount = probeResults.filter(p => p.severity === 'critical').length;

  const handleRun = async () => {
    setRunning(true);
    await onRunProbes?.();
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Adversarial Probe Suite</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">20 probes across 5 categories</p>
        </div>
        <GlowButton onClick={handleRun} disabled={running || isLoading} icon={running ? undefined : <Play size={16} />}>
          {running ? 'Running...' : 'Run Full Suite'}
        </GlowButton>
      </div>

      {/* Progress bar */}
      {running && (
        <div className="ag-card p-4">
          <div className="h-2 rounded-full bg-[rgba(59,130,246,0.1)] overflow-hidden">
            <motion.div className="h-full rounded-full bg-[var(--color-brand-primary)]"
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ duration: 20, ease: 'linear' }}
              style={{ boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="ag-card p-4 text-center">
          <div className="text-2xl font-bold font-mono text-[var(--color-pass)]">{passCount}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Passed</div>
        </div>
        <div className="ag-card p-4 text-center">
          <div className="text-2xl font-bold font-mono text-[var(--color-block)]">{failCount}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Failed</div>
        </div>
        <div className="ag-card p-4 text-center">
          <div className="text-2xl font-bold font-mono text-[var(--color-block)]">{criticalCount}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Critical</div>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid md:grid-cols-5 gap-4">
        {CATEGORIES.map(cat => {
          const results = probeResults.filter(p => p.probeType === cat);
          return (
            <div key={cat} className="space-y-2">
              <h3 className="text-xs font-mono text-[var(--color-brand-secondary)] uppercase tracking-wider mb-3">{CAT_LABELS[cat]}</h3>
              {results.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg border transition-all ${
                    r.passed ? 'border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.04)]' : 'border-[rgba(255,61,107,0.3)] bg-[rgba(255,61,107,0.04)]'
                  }`}
                  style={r.passed ? {} : { boxShadow: '0 0 15px rgba(255,61,107,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={12} className={r.passed ? 'text-[#00FF88]' : 'text-[#EF4444]'} />
                    <StatusBadge status={r.passed ? 'pass' : r.severity === 'critical' ? 'critical' : 'block'} size="sm" label={r.passed ? 'PASS' : 'FAIL'} />
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed mt-1">{r.explanation}</div>
                  <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">Score: {r.score.toFixed(2)}</div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
