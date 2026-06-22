'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { Cpu, ArrowRight, CheckCircle2, XCircle, AlertTriangle, Zap, Target, BarChart3, Play } from 'lucide-react';
import { MODEL_DATABASE } from '@/lib/ai-providers';
import { USE_CASES, evaluateSuitability, simulateScenario, type ScenarioInput, type ScenarioResult } from '@/lib/model-advisor';

type Tab = 'matrix' | 'suitability' | 'simulator';

export default function ModelAdvisorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('matrix');

  // Suitability inputs
  const [suitComplexity, setSuitComplexity] = useState(3);
  const [suitAccuracy, setSuitAccuracy] = useState(80);
  const [suitLatency, setSuitLatency] = useState(70);
  const [suitRisk, setSuitRisk] = useState(40);
  const [suitCompliance, setSuitCompliance] = useState(50);
  const [suitTraffic, setSuitTraffic] = useState(10000);

  const suitResults = useMemo(() =>
    evaluateSuitability(suitComplexity, suitAccuracy, suitLatency, suitRisk, suitCompliance, suitTraffic),
    [suitComplexity, suitAccuracy, suitLatency, suitRisk, suitCompliance, suitTraffic]
  );

  // Simulator inputs
  const [simInput, setSimInput] = useState<ScenarioInput>({
    users: 500, requestsPerMonth: 15000, complexity: 3, complianceNeeds: false,
  });
  const [simResult, setSimResult] = useState<ScenarioResult | null>(null);

  const runSimulation = () => {
    setSimResult(simulateScenario(simInput));
  };

  const claudeModels = MODEL_DATABASE.filter(m => m.provider === 'anthropic');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Model Advisor" />

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {[
          { id: 'matrix' as Tab, label: 'Capability Matrix', icon: BarChart3 },
          { id: 'suitability' as Tab, label: 'Suitability Engine', icon: Target },
          { id: 'simulator' as Tab, label: 'Scenario Simulator', icon: Play },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
              style={{
                padding: '8px 14px',
                background: activeTab === tab.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.06)'}`,
                color: activeTab === tab.id ? '#3B82F6' : '#5A7A7D',
              }}>
              <Icon size={12} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── CAPABILITY MATRIX ─────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
          <div className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-4">
            Use Case × Claude Model Recommendation Matrix
          </div>

          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)', minWidth: '160px' }}>Use Case</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>Recommended</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>Complexity</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>Accuracy</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>Speed</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>Risk</th>
                  <th className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase text-left" style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.08)', minWidth: '200px' }}>Why</th>
                </tr>
              </thead>
              <tbody>
                {USE_CASES.map((uc, i) => {
                  const recModel = MODEL_DATABASE.find(m => m.id === uc.recommendedModel);
                  const tierColor = recModel?.tier === 'premium' ? '#EF4444' : recModel?.tier === 'standard' ? '#F59E0B' : '#00FF88';
                  return (
                    <tr key={uc.id} className="hover:bg-[rgba(59,130,246,0.02)] transition-colors"
                      style={{ borderBottom: '1px solid rgba(59,130,246,0.04)' }}>
                      <td className="text-xs font-medium text-[var(--color-text-primary)]" style={{ padding: '10px 12px' }}>{uc.name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="text-[10px] font-mono rounded-full" style={{ padding: '3px 10px', background: tierColor + '12', color: tierColor, border: `1px solid ${tierColor}25` }}>
                          {recModel?.name}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="text-[10px] font-mono" style={{ color: uc.complexity === 'very_high' ? '#EF4444' : uc.complexity === 'high' ? '#F59E0B' : uc.complexity === 'medium' ? '#00E5FF' : '#00FF88' }}>
                          {uc.complexity}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div className="flex items-center gap-1">
                          <div className="rounded-full overflow-hidden" style={{ width: '40px', height: '3px', background: 'rgba(59,130,246,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${uc.accuracyNeed}%`, background: '#00FF88' }} />
                          </div>
                          <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{uc.accuracyNeed}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div className="flex items-center gap-1">
                          <div className="rounded-full overflow-hidden" style={{ width: '40px', height: '3px', background: 'rgba(59,130,246,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${uc.latencyNeed}%`, background: '#00E5FF' }} />
                          </div>
                          <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{uc.latencyNeed}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="text-[10px] font-mono" style={{ color: uc.riskTolerance < 20 ? '#EF4444' : uc.riskTolerance < 50 ? '#F59E0B' : '#00FF88' }}>
                          {uc.riskTolerance < 20 ? 'Very Low' : uc.riskTolerance < 50 ? 'Low' : 'Medium'}
                        </span>
                      </td>
                      <td className="text-[10px] text-[var(--color-text-secondary)]" style={{ padding: '10px 12px' }}>{uc.explanation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── SUITABILITY ENGINE ────────────────────────────────── */}
      {activeTab === 'suitability' && (
        <div className="space-y-4">
          {/* Input sliders */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-4">Configure Your Requirements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {[
                { label: 'Task Complexity', value: suitComplexity, set: setSuitComplexity, min: 1, max: 5, display: `${suitComplexity}/5` },
                { label: 'Accuracy Need', value: suitAccuracy, set: setSuitAccuracy, min: 0, max: 100, display: `${suitAccuracy}%` },
                { label: 'Speed Need', value: suitLatency, set: setSuitLatency, min: 0, max: 100, display: `${suitLatency}%` },
                { label: 'Risk Tolerance', value: suitRisk, set: setSuitRisk, min: 0, max: 100, display: `${suitRisk}%` },
                { label: 'Compliance Need', value: suitCompliance, set: setSuitCompliance, min: 0, max: 100, display: `${suitCompliance}%` },
                { label: 'Monthly Requests', value: suitTraffic, set: setSuitTraffic, min: 100, max: 100000, display: suitTraffic.toLocaleString() },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">{s.label}</label>
                    <span className="text-[10px] font-mono text-[#3B82F6]">{s.display}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} value={s.value}
                    onChange={e => s.set(Number(e.target.value))}
                    className="w-full" style={{ accentColor: '#3B82F6' }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {suitResults.map((result, i) => {
              const isTop = i === 0;
              return (
                <motion.div key={result.model.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="ag-card" style={{
                    padding: '1.5rem',
                    border: isTop ? '1px solid rgba(59,130,246,0.25)' : undefined,
                  }}>
                  {isTop && (
                    <div className="text-[9px] font-mono rounded-full inline-flex items-center gap-1 mb-3"
                      style={{ padding: '3px 10px', background: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                      <CheckCircle2 size={10} /> RECOMMENDED
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{result.model.name}</span>
                    <span className="text-lg font-bold" style={{
                      color: result.suitabilityScore >= 75 ? '#00FF88' : result.suitabilityScore >= 50 ? '#F59E0B' : '#EF4444',
                    }}>{result.suitabilityScore}</span>
                  </div>

                  {/* Score bar */}
                  <div className="rounded-full overflow-hidden mb-3" style={{ height: '4px', background: 'rgba(59,130,246,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${result.suitabilityScore}%`,
                      background: result.suitabilityScore >= 75 ? '#00FF88' : result.suitabilityScore >= 50 ? '#F59E0B' : '#EF4444',
                    }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] mb-3">
                    <span className="text-[var(--color-text-muted)]">Confidence: <span className="text-[#00E5FF]">{result.confidenceScore}%</span></span>
                    <span className="text-[var(--color-text-muted)]">Cost: <span className="text-[#F59E0B]">${result.projectedMonthlyCost.toFixed(2)}/mo</span></span>
                  </div>

                  <p className="text-[10px] text-[var(--color-text-secondary)] mb-3">{result.reason}</p>

                  {/* Strengths */}
                  {result.strengths.length > 0 && (
                    <div className="mb-2">
                      {result.strengths.map((s, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-[10px] text-[#00FF88] mb-0.5">
                          <CheckCircle2 size={10} className="mt-0.5 flex-shrink-0" /> {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.weaknesses.length > 0 && (
                    <div>
                      {result.weaknesses.map((w, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-[10px] text-[#F59E0B] mb-0.5">
                          <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SCENARIO SIMULATOR ────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
            <div className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase mb-4">Configure Scenario</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1.5">Number of Users</label>
                <input type="number" className="bio-input w-full" value={simInput.users}
                  onChange={e => setSimInput(p => ({ ...p, users: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1.5">Requests / Month</label>
                <input type="number" className="bio-input w-full" value={simInput.requestsPerMonth}
                  onChange={e => setSimInput(p => ({ ...p, requestsPerMonth: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase block mb-1.5">
                  Complexity ({simInput.complexity}/5)
                </label>
                <input type="range" min={1} max={5} value={simInput.complexity}
                  onChange={e => setSimInput(p => ({ ...p, complexity: Number(e.target.value) }))}
                  className="w-full" style={{ accentColor: '#3B82F6' }} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={simInput.complianceNeeds}
                    onChange={e => setSimInput(p => ({ ...p, complianceNeeds: e.target.checked }))}
                    style={{ accentColor: '#3B82F6' }} />
                  Compliance Required
                </label>
              </div>
            </div>

            <div className="mt-4">
              <GlowButton size="sm" icon={<Play size={14} />} onClick={runSimulation}>
                Run Simulation
              </GlowButton>
            </div>
          </motion.div>

          {/* Simulation results */}
          {simResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Recommended model */}
              <div className="ag-card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid rgba(59,130,246,0.25)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)' }}>
                    <Cpu size={18} style={{ color: '#3B82F6' }} />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-[#3B82F6] uppercase">Recommended Model</div>
                    <span className="text-lg font-bold text-[var(--color-text-primary)]">{simResult.recommendedModel.name}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Monthly Cost', value: `$${simResult.projectedCost.toFixed(2)}`, color: '#F59E0B' },
                    { label: 'Risk Score', value: `${simResult.projectedRisk}%`, color: simResult.projectedRisk > 25 ? '#EF4444' : '#00FF88' },
                    { label: 'Accuracy', value: `${simResult.expectedAccuracy}%`, color: '#00FF88' },
                    { label: 'Tier', value: simResult.recommendedModel.tier, color: '#00E5FF' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">{m.label}</div>
                      <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[var(--color-text-secondary)]">{simResult.explanation}</p>
              </div>

              {/* Alternatives */}
              {simResult.alternatives.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {simResult.alternatives.map(alt => (
                    <div key={alt.model.id} className="ag-card" style={{ padding: '1.25rem' }}>
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase">Alternative</span>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">{alt.model.name}</div>
                      <div className="flex items-center gap-4 mt-2 text-[10px]">
                        <span className="text-[#F59E0B]">${alt.cost.toFixed(2)}/mo</span>
                        <span className="text-[#00FF88]">Accuracy: {alt.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
