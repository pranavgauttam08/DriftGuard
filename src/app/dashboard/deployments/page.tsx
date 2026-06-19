'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTenant } from '@/hooks/useTenant';
import { useDriftGuardContext } from '../layout';
import {
  GitBranch, ArrowRight, CheckCircle2, XCircle, Clock, Loader2, RotateCcw,
  ShieldCheck, ChevronDown, ChevronRight, MessageSquare, FileText,
  ArrowUpRight, AlertTriangle, Activity, X, Zap,
} from 'lucide-react';

// Demo deployment data — represents real pipeline states
const INITIAL_DEPLOYMENTS = [
  {
    id: 'dep-001', endpointId: 'support-bot', endpointName: 'Customer Support Bot', version: 'v1.3.0',
    sourceEnv: 'staging', targetEnv: 'production',
    status: 'awaiting_approval' as const, verdict: 'WARN' as const,
    progress: 80, currentStep: 'Awaiting reviewer approval',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdBy: 'dev@company.com',
    steps: [
      { name: 'Fingerprint', status: 'completed' as const, duration: '12s' },
      { name: 'Dataset Eval', status: 'completed' as const, duration: '45s', passRate: '94%' },
      { name: 'Probe Suite', status: 'completed' as const, duration: '38s', passRate: '96%' },
      { name: 'Behavioral Diff', status: 'completed' as const, duration: '8s', verdict: 'WARN' },
      { name: 'Deploy', status: 'pending' as const },
    ],
    gates: [
      { name: 'PII Protection', status: 'pass' },
      { name: 'Compliance Checks', status: 'pass' },
      { name: 'Cost Envelope', status: 'pass' },
      { name: 'Model Suitability', status: 'warn' },
    ],
    regressions: [
      { dimension: 'Empathetic Tone', baseValue: 0.32, newValue: 0.20, delta: -0.12, severity: 'medium' as const },
    ],
    improvements: [
      { dimension: 'Avg Latency', baseValue: 420, newValue: 375, delta: -45 },
    ],
    rootCauses: [
      { dimension: 'Empathetic Tone', category: 'prompt_change', explanation: 'Recent system prompt update reduced acknowledgement phrases', confidence: 0.78 },
    ],
    compositeScore: 18,
    audit: [
      { timestamp: '2h ago', action: 'deployment.created', user: 'dev@company.com', details: 'Deployment initiated' },
      { timestamp: '2h ago', action: 'fingerprint.completed', user: 'system', details: 'Fingerprint computed (confidence: 0.87)' },
      { timestamp: '1h 55m ago', action: 'dataset_eval.completed', user: 'system', details: '47/50 entries passed (94%)' },
      { timestamp: '1h 50m ago', action: 'probes.completed', user: 'system', details: '46/48 probes passed' },
      { timestamp: '1h 48m ago', action: 'diff.completed', user: 'system', details: 'Verdict: WARN — 1 medium regression detected' },
      { timestamp: '1h 48m ago', action: 'review.created', user: 'system', details: 'Auto-assigned to reviewers' },
    ],
  },
  {
    id: 'dep-002', endpointId: 'code-assistant', endpointName: 'Code Assistant', version: 'v2.1.0',
    sourceEnv: 'staging', targetEnv: 'production',
    status: 'deployed' as const, verdict: 'PASS' as const,
    progress: 100, currentStep: 'Deployed',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdBy: 'dev@company.com',
    approvedBy: 'auto-approved',
    steps: [
      { name: 'Fingerprint', status: 'completed' as const, duration: '9s' },
      { name: 'Dataset Eval', status: 'completed' as const, duration: '62s', passRate: '98%' },
      { name: 'Probe Suite', status: 'completed' as const, duration: '41s', passRate: '100%' },
      { name: 'Behavioral Diff', status: 'completed' as const, duration: '6s', verdict: 'PASS' },
      { name: 'Deploy', status: 'completed' as const },
    ],
    gates: [
      { name: 'PII Protection', status: 'pass' },
      { name: 'Compliance Checks', status: 'pass' },
      { name: 'Cost Envelope', status: 'pass' },
      { name: 'Model Suitability', status: 'pass' },
    ],
    regressions: [],
    improvements: [
      { dimension: 'Semantic Consistency', baseValue: 0.89, newValue: 0.97, delta: 0.08 },
      { dimension: 'Topic Consistency', baseValue: 0.91, newValue: 0.94, delta: 0.03 },
    ],
    rootCauses: [],
    compositeScore: 0,
    audit: [
      { timestamp: '1d ago', action: 'deployment.created', user: 'dev@company.com', details: 'Deployment initiated' },
      { timestamp: '1d ago', action: 'diff.completed', user: 'system', details: 'Verdict: PASS — 0 regressions' },
      { timestamp: '1d ago', action: 'deployment.auto_approved', user: 'system', details: 'Auto-deployed (all gates passed)' },
    ],
  },
  {
    id: 'dep-003', endpointId: 'content-gen', endpointName: 'Content Generator', version: 'v3.0.0',
    sourceEnv: 'development', targetEnv: 'staging',
    status: 'rejected' as const, verdict: 'BLOCK' as const,
    progress: 100, currentStep: 'Rejected',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    createdBy: 'dev@company.com',
    rejectedBy: 'reviewer@company.com',
    rejectionReason: 'Hallucination score exceeded safe threshold. Must fix retrieval pipeline before re-attempting.',
    steps: [
      { name: 'Fingerprint', status: 'completed' as const, duration: '15s' },
      { name: 'Dataset Eval', status: 'completed' as const, duration: '58s', passRate: '72%' },
      { name: 'Probe Suite', status: 'completed' as const, duration: '52s', passRate: '87%' },
      { name: 'Behavioral Diff', status: 'completed' as const, duration: '9s', verdict: 'BLOCK' },
      { name: 'Deploy', status: 'failed' as const },
    ],
    gates: [
      { name: 'PII Protection', status: 'pass' },
      { name: 'Compliance Checks', status: 'fail' },
      { name: 'Cost Envelope', status: 'pass' },
      { name: 'Model Suitability', status: 'fail' },
    ],
    regressions: [
      { dimension: 'Hallucination Score', baseValue: 0.08, newValue: 0.33, delta: 0.25, severity: 'critical' as const },
      { dimension: 'Topic Consistency', baseValue: 0.92, newValue: 0.71, delta: -0.21, severity: 'high' as const },
    ],
    improvements: [],
    rootCauses: [
      { dimension: 'Hallucination Score', category: 'retrieval_degradation', explanation: 'RAG retrieval quality dropped — 34% of queries returned irrelevant context chunks', confidence: 0.85 },
      { dimension: 'Topic Consistency', category: 'data_shift', explanation: 'Fine-tuning data distribution changed — model responses are more scattered across topics', confidence: 0.62 },
    ],
    compositeScore: 65,
    audit: [
      { timestamp: '2d ago', action: 'deployment.created', user: 'dev@company.com', details: 'Deployment initiated' },
      { timestamp: '2d ago', action: 'diff.completed', user: 'system', details: 'Verdict: BLOCK — 2 regressions (1 critical)' },
      { timestamp: '2d ago', action: 'deployment.rejected', user: 'reviewer@company.com', details: 'Rejected: Hallucination exceeded safe threshold' },
    ],
  },
];

// Environment promotion data
const DEMO_PROMOTIONS = [
  { endpoint: 'support-bot', devVersion: 'v1.4.0', stagingVersion: 'v1.3.0', prodVersion: 'v1.2.0', devToStaging: 'ahead', stagingToProd: 'ahead' },
  { endpoint: 'code-assistant', devVersion: 'v2.2.0', stagingVersion: 'v2.1.0', prodVersion: 'v2.1.0', devToStaging: 'ahead', stagingToProd: 'in_sync' },
  { endpoint: 'content-gen', devVersion: 'v3.1.0', stagingVersion: 'v2.8.0', prodVersion: 'v2.8.0', devToStaging: 'ahead', stagingToProd: 'in_sync' },
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: '#5A7A7D', label: 'Pending' },
  fingerprinting: { icon: Loader2, color: '#00E5FF', label: 'Fingerprinting' },
  evaluating: { icon: Loader2, color: '#00E5FF', label: 'Evaluating' },
  probing: { icon: Loader2, color: '#00E5FF', label: 'Probing' },
  diffing: { icon: Loader2, color: '#00E5FF', label: 'Diffing' },
  awaiting_approval: { icon: ShieldCheck, color: '#FFB800', label: 'Awaiting Approval' },
  approved: { icon: CheckCircle2, color: '#00FF88', label: 'Approved' },
  rejected: { icon: XCircle, color: '#FF3D6B', label: 'Rejected' },
  deployed: { icon: CheckCircle2, color: '#00FFD1', label: 'Deployed' },
  rolled_back: { icon: RotateCcw, color: '#FF3D6B', label: 'Rolled Back' },
  cancelled: { icon: XCircle, color: '#5A7A7D', label: 'Cancelled' },
};

const STEP_STATUS_COLORS: Record<string, string> = {
  completed: '#00FF88',
  running: '#00E5FF',
  pending: '#5A7A7D',
  failed: '#FF3D6B',
};

type TabView = 'pipeline' | 'promotion';

export default function DeploymentsPage() {
  const tenant = useTenant();
  const dg = useDriftGuardContext();
  const [deployments, setDeployments] = useState(INITIAL_DEPLOYMENTS);
  const [selectedDep, setSelectedDep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('pipeline');
  const [showAudit, setShowAudit] = useState(false);
  const [showNewDeployModal, setShowNewDeployModal] = useState(false);

  // New Deployment form state
  const [newDep, setNewDep] = useState({
    endpointName: '',
    version: '',
    sourceEnv: 'staging',
    targetEnv: 'production',
  });
  const [isCreating, setIsCreating] = useState(false);

  const selected = deployments.find(d => d.id === selectedDep);

  const handleCreateDeployment = async () => {
    if (!newDep.endpointName.trim() || !newDep.version.trim()) return;

    setIsCreating(true);

    // Simulate the pipeline steps running one-by-one
    const depId = `dep-${Date.now()}`;
    const newDeployment: any = {
      id: depId,
      endpointId: newDep.endpointName.toLowerCase().replace(/\s+/g, '-'),
      endpointName: newDep.endpointName,
      version: newDep.version.startsWith('v') ? newDep.version : `v${newDep.version}`,
      sourceEnv: newDep.sourceEnv,
      targetEnv: newDep.targetEnv,
      status: 'fingerprinting',
      verdict: null,
      progress: 0,
      currentStep: 'Computing behavioral fingerprint...',
      createdAt: new Date(),
      createdBy: 'you@company.com',
      steps: [
        { name: 'Fingerprint', status: 'running', duration: null },
        { name: 'Dataset Eval', status: 'pending' },
        { name: 'Probe Suite', status: 'pending' },
        { name: 'Behavioral Diff', status: 'pending' },
        { name: 'Deploy', status: 'pending' },
      ],
      gates: [
        { name: 'PII Protection', status: 'pending' },
        { name: 'Compliance Checks', status: 'pending' },
        { name: 'Cost Envelope', status: 'pending' },
        { name: 'Model Suitability', status: 'pending' },
      ],
      regressions: [],
      improvements: [],
      rootCauses: [],
      compositeScore: 0,
      audit: [
        { timestamp: 'just now', action: 'deployment.created', user: 'you@company.com', details: 'Deployment initiated' },
      ],
    };

    setDeployments(prev => [newDeployment, ...prev]);
    setShowNewDeployModal(false);
    setNewDep({ endpointName: '', version: '', sourceEnv: 'staging', targetEnv: 'production' });
    setSelectedDep(depId);

    // Simulate pipeline progression
    const simulateStep = (stepIdx: number, status: string, progress: number, delay: number, stepStatus: string, extras?: any) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          setDeployments((prev: any[]) => prev.map((d: any) => {
            if (d.id !== depId) return d;
            const steps = [...d.steps];
            steps[stepIdx] = { ...steps[stepIdx], status: stepStatus as any, ...extras };
            if (stepIdx + 1 < steps.length && stepStatus === 'completed') {
              steps[stepIdx + 1] = { ...steps[stepIdx + 1], status: 'running' as any };
            }
            return {
              ...d,
              status: status as any,
              progress,
              steps,
              audit: [
                ...d.audit,
                { timestamp: 'just now', action: `${steps[stepIdx].name.toLowerCase().replace(' ', '_')}.${stepStatus}`, user: 'system', details: `${steps[stepIdx].name} ${stepStatus}` },
              ],
            };
          }));
          resolve();
        }, delay);
      });
    };

    // Run pipeline simulation
    await simulateStep(0, 'fingerprinting', 15, 1500, 'completed', { duration: '11s' });
    await simulateStep(1, 'evaluating', 35, 2000, 'completed', { duration: '42s', passRate: '96%' });
    await simulateStep(2, 'probing', 55, 2500, 'completed', { duration: '35s', passRate: '98%' });
    await simulateStep(3, 'diffing', 75, 1500, 'completed', { duration: '7s', verdict: 'PASS' });

    // Final: set verdict to PASS and status to awaiting_approval
    setTimeout(() => {
      setDeployments((prev: any[]) => prev.map((d: any) => {
        if (d.id !== depId) return d;
        const steps = [...d.steps];
        steps[4] = { ...steps[4], status: 'pending' as any };
        return {
          ...d,
          status: 'awaiting_approval' as any,
          verdict: 'PASS' as any,
          progress: 85,
          currentStep: 'Awaiting approval',
          improvements: [
            { dimension: 'Response Quality', baseValue: 0.82, newValue: 0.89, delta: 0.07 },
          ],
          gates: [
            { name: 'PII Protection', status: 'pass' },
            { name: 'Compliance Checks', status: 'pass' },
            { name: 'Cost Envelope', status: 'pass' },
            { name: 'Model Suitability', status: 'pass' },
          ],
          audit: [
            ...d.audit,
            { timestamp: 'just now', action: 'review.created', user: 'system', details: 'All gates passed — awaiting reviewer approval' },
          ],
        };
      }));
      setIsCreating(false);
    }, 8500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Deployments" />

      {/* Tab switcher */}
      <div className="flex items-center gap-1">
        <button onClick={() => setActiveTab('pipeline')}
          className="text-xs font-medium rounded-lg transition-all"
          style={{
            padding: '8px 16px',
            background: activeTab === 'pipeline' ? 'rgba(0,255,209,0.08)' : 'transparent',
            border: `1px solid ${activeTab === 'pipeline' ? 'rgba(0,255,209,0.25)' : 'rgba(0,255,209,0.06)'}`,
            color: activeTab === 'pipeline' ? '#00FFD1' : '#5A7A7D',
          }}>
          <GitBranch size={12} className="inline mr-1" /> Pipeline
        </button>
        <button onClick={() => setActiveTab('promotion')}
          className="text-xs font-medium rounded-lg transition-all"
          style={{
            padding: '8px 16px',
            background: activeTab === 'promotion' ? 'rgba(0,255,209,0.08)' : 'transparent',
            border: `1px solid ${activeTab === 'promotion' ? 'rgba(0,255,209,0.25)' : 'rgba(0,255,209,0.06)'}`,
            color: activeTab === 'promotion' ? '#00FFD1' : '#5A7A7D',
          }}>
          <ArrowUpRight size={12} className="inline mr-1" /> Environment Promotion
        </button>
        <div className="ml-auto">
          <GlowButton size="sm" icon={<GitBranch size={14} />} onClick={() => setShowNewDeployModal(true)}>New Deployment</GlowButton>
        </div>
      </div>

      {activeTab === 'pipeline' ? (
        <>
          {/* Pipeline visualization */}
          <div className="bio-card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-0">
              {['Fingerprint', 'Eval Dataset', 'Probe Suite', 'Diff + Verdict', 'Deploy'].map((step, i) => (
                <div key={step} className="flex items-center" style={{ flex: i < 4 ? 1 : 'none' }}>
                  <div className="flex flex-col items-center">
                    <div className="rounded-full flex items-center justify-center text-[10px] font-mono"
                      style={{
                        width: '28px', height: '28px',
                        background: 'rgba(0,255,209,0.08)', border: '1px solid rgba(0,255,209,0.2)',
                        color: '#00FFD1',
                      }}>{i + 1}</div>
                    <span className="text-[9px] text-[var(--color-ghost-text)] mt-1 text-center" style={{ maxWidth: '70px' }}>{step}</span>
                  </div>
                  {i < 4 && (
                    <div className="flex-1 h-px mx-2" style={{ background: 'rgba(0,255,209,0.1)', marginTop: '-16px' }}>
                      <div className="data-flow-line h-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deployments list */}
          <div className="space-y-3">
            {deployments.map((dep, i) => {
              const config = STATUS_CONFIG[dep.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const isSelected = selectedDep === dep.id;

              return (
                <motion.div key={dep.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <button
                    onClick={() => setSelectedDep(isSelected ? null : dep.id)}
                    className="bio-card w-full text-left transition-all"
                    style={{ padding: '1.25rem', borderColor: isSelected ? 'rgba(0,255,209,0.4)' : undefined }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                      <div className="flex items-center gap-3">
                        <StatusIcon size={16} style={{ color: config.color }} className={dep.status.includes('ing') ? 'animate-spin' : ''} />
                        <div>
                          <span className="text-sm font-semibold text-[var(--color-surface-text)]">{dep.endpointName}</span>
                          <span className="text-xs text-[var(--color-ghost-text)] ml-2 font-mono">{dep.version}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {dep.verdict && <StatusBadge status={dep.verdict.toLowerCase() as any} />}
                        <span className="text-[10px] font-mono rounded-lg" style={{ padding: '3px 8px', background: config.color + '15', color: config.color }}>
                          {config.label}
                        </span>
                        {isSelected ? <ChevronDown size={12} className="text-[var(--color-ghost-text)]" /> : <ChevronRight size={12} className="text-[var(--color-ghost-text)]" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full rounded-full overflow-hidden" style={{ height: '2px', background: 'rgba(0,255,209,0.06)', marginBottom: '0.5rem' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${dep.progress}%` }}
                        style={{ background: dep.verdict === 'BLOCK' ? '#FF3D6B' : dep.verdict === 'WARN' ? '#FFB800' : '#00FF88' }} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--color-muted-text)]">
                      <span className="font-mono">{dep.sourceEnv} <ArrowRight size={10} className="inline" /> {dep.targetEnv}</span>
                      <span>{dep.createdAt.toLocaleDateString()}</span>
                      {dep.compositeScore > 0 && (
                        <span className="font-mono" style={{ color: dep.compositeScore > 40 ? '#FF3D6B' : dep.compositeScore > 15 ? '#FFB800' : '#00FF88' }}>
                          severity: {dep.compositeScore}/100
                        </span>
                      )}
                      {dep.regressions.length > 0 && (
                        <span className="text-[var(--color-biolume-danger)]">{dep.regressions.length} regression{dep.regressions.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isSelected && selected && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bio-card" style={{ padding: '1.25rem', marginTop: '4px', borderColor: 'rgba(0,255,209,0.2)' }}>

                          {/* Pipeline step detail */}
                          <div className="text-[10px] font-mono text-[var(--color-ghost-text)] mb-2 uppercase">Pipeline Steps</div>
                          <div className="flex items-center gap-2 mb-4">
                            {selected.steps.map((step: any, si: number) => (
                              <div key={step.name} className="flex items-center gap-1 text-[10px] font-mono rounded-lg"
                                style={{
                                  padding: '4px 10px',
                                  background: (STEP_STATUS_COLORS[step.status] || '#5A7A7D') + '10',
                                  border: `1px solid ${(STEP_STATUS_COLORS[step.status] || '#5A7A7D') + '30'}`,
                                  color: STEP_STATUS_COLORS[step.status] || '#5A7A7D',
                                }}>
                                {step.status === 'completed' ? <CheckCircle2 size={10} /> : step.status === 'running' ? <Loader2 size={10} className="animate-spin" /> : step.status === 'failed' ? <XCircle size={10} /> : <Clock size={10} />}
                                {step.name}
                                {step.duration && <span className="text-[var(--color-ghost-text)] ml-1">{step.duration}</span>}
                                {step.passRate && <span className="ml-1">{step.passRate}</span>}
                                {step.verdict && <span className="ml-1">{step.verdict}</span>}
                              </div>
                            ))}
                          </div>

                          {/* Release Gates */}
                          {selected.gates && selected.gates.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div className="text-[10px] font-mono text-[var(--color-ghost-text)] mb-2 uppercase">Release Gates</div>
                              <div className="flex flex-wrap items-center gap-2 mb-4">
                                {selected.gates.map((gate: any) => (
                                  <div key={gate.name} className="flex items-center gap-1 text-[10px] font-mono rounded-lg"
                                    style={{
                                      padding: '4px 10px',
                                      background: gate.status === 'pass' ? 'rgba(0,255,136,0.1)' : gate.status === 'fail' ? 'rgba(255,61,107,0.1)' : gate.status === 'warn' ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,209,0.04)',
                                      border: `1px solid ${gate.status === 'pass' ? 'rgba(0,255,136,0.3)' : gate.status === 'fail' ? 'rgba(255,61,107,0.3)' : gate.status === 'warn' ? 'rgba(255,184,0,0.3)' : 'rgba(0,255,209,0.1)'}`,
                                      color: gate.status === 'pass' ? '#00FF88' : gate.status === 'fail' ? '#FF3D6B' : gate.status === 'warn' ? '#FFB800' : '#5A7A7D',
                                    }}>
                                    {gate.status === 'pass' ? <CheckCircle2 size={10} /> : gate.status === 'fail' ? <XCircle size={10} /> : gate.status === 'warn' ? <AlertTriangle size={10} /> : <Loader2 size={10} className={gate.status === 'running' ? 'animate-spin' : ''} />}
                                    {gate.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Root causes */}
                          {selected.rootCauses && selected.rootCauses.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div className="text-[10px] font-mono text-[var(--color-biolume-warning)] mb-2 uppercase">Root Cause Analysis</div>
                              {selected.rootCauses.map((rc: any, ri: number) => (
                                <div key={ri} className="flex items-start gap-3 text-xs rounded-lg"
                                  style={{ padding: '10px 12px', background: 'rgba(255,184,0,0.03)', border: '1px solid rgba(255,184,0,0.1)', marginBottom: '4px' }}>
                                  <AlertTriangle size={12} className="text-[var(--color-biolume-warning)] mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-semibold text-[var(--color-surface-text)]">{rc.dimension}</span>
                                    <span className="text-[9px] font-mono ml-2 rounded" style={{ padding: '1px 6px', background: 'rgba(255,184,0,0.08)', color: '#FFB800' }}>{rc.category.replace('_', ' ')}</span>
                                    <p className="text-[var(--color-muted-text)] mt-1">{rc.explanation}</p>
                                    <span className="text-[9px] text-[var(--color-ghost-text)]">Confidence: {(rc.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Regressions */}
                          {selected.regressions.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div className="text-[10px] font-mono text-[var(--color-biolume-danger)] mb-2 uppercase">Regressions</div>
                              {selected.regressions.map((r: any, ri: number) => (
                                <div key={ri} className="flex items-center justify-between text-xs rounded-lg"
                                  style={{ padding: '8px 12px', background: 'rgba(255,61,107,0.04)', border: '1px solid rgba(255,61,107,0.12)', marginBottom: '4px' }}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--color-surface-text)]">{r.dimension}</span>
                                    <span className="text-[9px] font-mono rounded" style={{
                                      padding: '1px 6px',
                                      background: r.severity === 'critical' ? 'rgba(255,61,107,0.1)' : 'rgba(255,184,0,0.08)',
                                      color: r.severity === 'critical' ? '#FF3D6B' : '#FFB800',
                                    }}>{r.severity}</span>
                                  </div>
                                  <span className="font-mono">
                                    <span className="text-[var(--color-ghost-text)]">{typeof r.baseValue === 'number' ? r.baseValue.toFixed(2) : r.baseValue}</span>
                                    <span className="text-[var(--color-ghost-text)] mx-1">→</span>
                                    <span className="text-[var(--color-biolume-danger)]">{typeof r.newValue === 'number' ? r.newValue.toFixed(2) : r.newValue}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Improvements */}
                          {selected.improvements.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div className="text-[10px] font-mono text-[#00FF88] mb-2 uppercase">Improvements</div>
                              {selected.improvements.map((imp: any, ii: number) => (
                                <div key={ii} className="flex items-center justify-between text-xs rounded-lg"
                                  style={{ padding: '8px 12px', background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)', marginBottom: '4px' }}>
                                  <span className="text-[var(--color-surface-text)]">{imp.dimension}</span>
                                  <span className="font-mono text-[#00FF88]">Δ {typeof imp.delta === 'number' ? (imp.delta > 0 ? '+' : '') + imp.delta.toFixed(2) : imp.delta}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Audit trail toggle */}
                          <button onClick={() => setShowAudit(!showAudit)} className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-ghost-text)] hover:text-[var(--color-biolume-primary)] transition-all mb-2">
                            <FileText size={10} />{showAudit ? 'Hide' : 'Show'} Audit Trail ({selected.audit.length} events)
                          </button>
                          {showAudit && (
                            <div className="rounded-lg mb-4" style={{ padding: '8px', background: 'rgba(0,255,209,0.02)', border: '1px solid rgba(0,255,209,0.06)' }}>
                              {selected.audit.map((entry: any, ai: number) => (
                                <div key={ai} className="flex items-center gap-3 text-[10px]" style={{ padding: '4px 8px' }}>
                                  <span className="text-[var(--color-ghost-text)] w-16 flex-shrink-0">{entry.timestamp}</span>
                                  <span className="font-mono rounded" style={{ padding: '1px 4px', background: 'rgba(0,255,209,0.04)', color: '#4A8F8A', minWidth: '120px' }}>{entry.action}</span>
                                  <span className="text-[var(--color-muted-text)] truncate">{entry.details}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3">
                            {selected.status === 'awaiting_approval' && (
                              <>
                                <GlowButton size="sm" icon={<CheckCircle2 size={14} />}
                                  onClick={() => {
                                    setDeployments((prev: any[]) => prev.map((d: any) => d.id === selected.id ? {
                                      ...d, status: 'deployed' as any, progress: 100, currentStep: 'Deployed',
                                      steps: d.steps.map((s: any, i: number) => i === 4 ? { ...s, status: 'completed' as any } : s),
                                      audit: [...d.audit, { timestamp: 'just now', action: 'deployment.approved', user: 'you', details: 'Approved & deployed' }],
                                    } : d));
                                  }}
                                >Approve & Deploy</GlowButton>
                                <GlowButton variant="danger" size="sm" icon={<XCircle size={14} />}
                                  onClick={() => {
                                    setDeployments((prev: any[]) => prev.map((d: any) => d.id === selected.id ? {
                                      ...d, status: 'rejected' as any, progress: 100, currentStep: 'Rejected',
                                      steps: d.steps.map((s: any, i: number) => i === 4 ? { ...s, status: 'failed' as any } : s),
                                      rejectionReason: 'Rejected by reviewer',
                                      audit: [...d.audit, { timestamp: 'just now', action: 'deployment.rejected', user: 'you', details: 'Deployment rejected' }],
                                    } : d));
                                  }}
                                >Reject</GlowButton>
                              </>
                            )}
                            {['deployed', 'approved'].includes(selected.status) && (
                              <GlowButton variant="danger" size="sm" icon={<RotateCcw size={14} />}
                                onClick={() => {
                                  setDeployments((prev: any[]) => prev.map((d: any) => d.id === selected.id ? {
                                    ...d, status: 'rolled_back' as any, currentStep: 'Rolled back',
                                    audit: [...d.audit, { timestamp: 'just now', action: 'deployment.rolled_back', user: 'you', details: 'Deployment rolled back' }],
                                  } : d));
                                }}
                              >Rollback</GlowButton>
                            )}
                          </div>

                          {(selected as any).rejectionReason && (
                            <div className="rounded-lg text-xs mt-3" style={{ padding: '10px 14px', background: 'rgba(255,61,107,0.04)', border: '1px solid rgba(255,61,107,0.12)' }}>
                              <span className="text-[var(--color-biolume-danger)] font-mono">Rejection reason:</span>{' '}
                              <span className="text-[var(--color-muted-text)]">{(selected as any).rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        /* Environment Promotion View */
        <div className="space-y-3">
          <div className="bio-card" style={{ padding: '1.25rem' }}>
            <div className="text-[10px] font-mono text-[var(--color-ghost-text)] mb-3 uppercase">Environment Status</div>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-[var(--color-ghost-text)] mb-2" style={{ paddingLeft: '120px' }}>
              <span>Development</span>
              <span className="text-center">→</span>
              <span>Staging</span>
              <span className="text-right">Production</span>
            </div>
          </div>

          {DEMO_PROMOTIONS.map((promo, i) => (
            <motion.div key={promo.endpoint} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bio-card" style={{ padding: '1.25rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                <span className="text-sm font-semibold text-[var(--color-surface-text)]">{promo.endpoint}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg text-center" style={{ padding: '10px', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                  <span className="text-[10px] text-[var(--color-ghost-text)] block">DEV</span>
                  <span className="text-xs font-mono text-[#00E5FF]">{promo.devVersion}</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight size={14} style={{ color: promo.devToStaging === 'ahead' ? '#FFB800' : '#00FF88' }} />
                  <span className="text-[8px] font-mono" style={{ color: promo.devToStaging === 'ahead' ? '#FFB800' : '#00FF88' }}>
                    {promo.devToStaging === 'ahead' ? 'PROMOTE' : 'IN SYNC'}
                  </span>
                </div>
                <div className="flex-1 rounded-lg text-center" style={{ padding: '10px', background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.1)' }}>
                  <span className="text-[10px] text-[var(--color-ghost-text)] block">STAGING</span>
                  <span className="text-xs font-mono text-[#FFB800]">{promo.stagingVersion}</span>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight size={14} style={{ color: promo.stagingToProd === 'ahead' ? '#FFB800' : '#00FF88' }} />
                  <span className="text-[8px] font-mono" style={{ color: promo.stagingToProd === 'ahead' ? '#FFB800' : '#00FF88' }}>
                    {promo.stagingToProd === 'ahead' ? 'PROMOTE' : 'IN SYNC'}
                  </span>
                </div>
                <div className="flex-1 rounded-lg text-center" style={{ padding: '10px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}>
                  <span className="text-[10px] text-[var(--color-ghost-text)] block">PRODUCTION</span>
                  <span className="text-xs font-mono text-[#00FF88]">{promo.prodVersion}</span>
                </div>
              </div>

              {(promo.devToStaging === 'ahead' || promo.stagingToProd === 'ahead') && (
                <div className="flex gap-2 mt-3">
                  {promo.devToStaging === 'ahead' && (
                    <GlowButton size="sm" variant="ghost" icon={<ArrowUpRight size={12} />}>Promote to Staging</GlowButton>
                  )}
                  {promo.stagingToProd === 'ahead' && (
                    <GlowButton size="sm" icon={<ArrowUpRight size={12} />}>Promote to Production</GlowButton>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NEW DEPLOYMENT MODAL
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNewDeployModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowNewDeployModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bio-card w-full max-w-lg"
              style={{ padding: '2rem', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button onClick={() => setShowNewDeployModal(false)}
                className="absolute top-4 right-4 text-[var(--color-ghost-text)] hover:text-[var(--color-surface-text)] transition-colors">
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(0,255,209,0.08)' }}>
                  <Zap size={18} style={{ color: '#00FFD1' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-surface-text)]">New Deployment</h2>
                  <p className="text-[10px] text-[var(--color-ghost-text)]">Run the full behavioral gating pipeline</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Endpoint Name */}
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase tracking-wider block mb-1.5">
                    Endpoint / AI System Name
                  </label>
                  <input
                    className="bio-input w-full"
                    placeholder="e.g. Customer Support Bot"
                    value={newDep.endpointName}
                    onChange={e => setNewDep(p => ({ ...p, endpointName: e.target.value }))}
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase tracking-wider block mb-1.5">
                    Version
                  </label>
                  <input
                    className="bio-input w-full"
                    placeholder="e.g. v2.0.0"
                    value={newDep.version}
                    onChange={e => setNewDep(p => ({ ...p, version: e.target.value }))}
                  />
                </div>

                {/* Source and Target Environment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase tracking-wider block mb-1.5">
                      Source Environment
                    </label>
                    <select className="bio-input w-full" value={newDep.sourceEnv} onChange={e => setNewDep(p => ({ ...p, sourceEnv: e.target.value }))}>
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase tracking-wider block mb-1.5">
                      Target Environment
                    </label>
                    <select className="bio-input w-full" value={newDep.targetEnv} onChange={e => setNewDep(p => ({ ...p, targetEnv: e.target.value }))}>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>

                {/* Pipeline info */}
                <div className="rounded-lg" style={{ padding: '10px 14px', background: 'rgba(0,255,209,0.03)', border: '1px solid rgba(0,255,209,0.08)' }}>
                  <div className="text-[10px] text-[var(--color-muted-text)] leading-relaxed">
                    <strong className="text-[var(--color-biolume-primary)]">Pipeline will run:</strong> Fingerprint → Dataset Eval → Probe Suite (50 probes) → Behavioral Diff → Verdict
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <GlowButton variant="ghost" size="sm" onClick={() => setShowNewDeployModal(false)}>Cancel</GlowButton>
                  <GlowButton size="sm" icon={<GitBranch size={14} />}
                    onClick={handleCreateDeployment}
                    disabled={!newDep.endpointName.trim() || !newDep.version.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Start Deployment'}
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
