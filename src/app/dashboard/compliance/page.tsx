'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { FRAMEWORKS, calculateFrameworkScore, getOverallScore, type ComplianceScore } from '@/lib/compliance-engine';

export default function CompliancePage() {
  const [expandedFramework, setExpandedFramework] = useState<string | null>(null);
  const overallScore = useMemo(() => getOverallScore(), []);
  const frameworkScores = useMemo(() => FRAMEWORKS.map(f => ({ framework: f, score: calculateFrameworkScore(f) })), []);

  const scoreColor = (pct: number) => pct >= 80 ? '#00FF88' : pct >= 60 ? '#FFB800' : '#FF3D6B';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Compliance Center" />

      {/* Overall Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-1">Overall Compliance Score</div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" style={{ color: scoreColor(overallScore) }}>{overallScore}</span>
              <span className="text-sm text-[var(--color-ghost-text)] mb-1">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Frameworks', value: FRAMEWORKS.length, color: '#00E5FF' },
              { label: 'Controls Met', value: frameworkScores.reduce((s, f) => s + f.score.controlsCovered, 0), color: '#00FF88' },
              { label: 'Issues', value: frameworkScores.reduce((s, f) => s + f.score.issues.length, 0), color: '#FFB800' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[9px] text-[var(--color-ghost-text)]">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Overall bar */}
        <div className="w-full rounded-full overflow-hidden mt-3" style={{ height: '6px', background: 'rgba(0,255,209,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${overallScore}%`, background: scoreColor(overallScore) }} />
        </div>
      </motion.div>

      {/* Framework Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {frameworkScores.map(({ framework, score }, i) => {
          const isExpanded = expandedFramework === framework.id;
          return (
            <motion.div key={framework.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bio-card" style={{ padding: '1.25rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} style={{ color: scoreColor(score.readinessPercent) }} />
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-surface-text)]">{framework.name}</span>
                    <span className="block text-[9px] text-[var(--color-ghost-text)]">{framework.description}</span>
                  </div>
                </div>
                <span className="text-xl font-bold" style={{ color: scoreColor(score.readinessPercent) }}>
                  {score.readinessPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: '4px', background: 'rgba(0,255,209,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${score.readinessPercent}%`, background: scoreColor(score.readinessPercent) }} />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-[10px] mb-3">
                <span className="text-[var(--color-muted-text)]">Controls: <span className="text-[#00FF88]">{score.controlsCovered}/{score.totalControls}</span></span>
                <span className="text-[var(--color-muted-text)]">Evidence: <span className="text-[#00E5FF]">{score.evidenceCoverage}%</span></span>
                <span className="text-[var(--color-muted-text)]">Risk: <span style={{ color: score.riskExposure > 50 ? '#FF3D6B' : '#FFB800' }}>{score.riskExposure}%</span></span>
              </div>

              {/* Expand/collapse */}
              <button onClick={() => setExpandedFramework(isExpanded ? null : framework.id)}
                className="text-[10px] text-[var(--color-biolume-primary)] hover:underline flex items-center gap-1">
                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {isExpanded ? 'Hide controls' : `${score.issues.length} issues to resolve`}
              </button>

              {/* Expanded: Controls list */}
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div className="space-y-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {framework.controls.map(control => (
                      <div key={control.id} className="flex items-start gap-2 text-xs rounded-lg"
                        style={{ padding: '8px 10px', background: 'rgba(0,255,209,0.02)' }}>
                        {control.status === 'met' ? <CheckCircle2 size={12} className="text-[#00FF88] mt-0.5 flex-shrink-0" /> :
                          control.status === 'partial' ? <AlertTriangle size={12} className="text-[#FFB800] mt-0.5 flex-shrink-0" /> :
                            <XCircle size={12} className="text-[#FF3D6B] mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <span className="font-medium text-[var(--color-surface-text)]">{control.name}</span>
                          <span className="block text-[10px] text-[var(--color-ghost-text)]">{control.description}</span>
                          {control.evidence.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {control.evidence.map(ev => (
                                <span key={ev} className="text-[8px] font-mono rounded-full"
                                  style={{ padding: '1px 6px', background: 'rgba(0,255,209,0.04)', color: '#4A8F8A' }}>
                                  {ev}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Remediation Engine */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#FFB800]" />
            <h3 className="font-semibold text-[var(--color-surface-text)]">Remediation Queue</h3>
          </div>
          <GlowButton variant="ghost" size="sm" icon={<FileText size={12} />}>Export Report</GlowButton>
        </div>

        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Priority', 'Framework', 'Issue', 'Severity', 'Action', 'Owner'].map(h => (
                  <th key={h} className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase text-left"
                    style={{ padding: '6px 10px', borderBottom: '1px solid rgba(0,255,209,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frameworkScores.flatMap(f => f.score.issues).sort((a, b) => a.priority - b.priority).slice(0, 12).map(issue => (
                <tr key={issue.id} className="hover:bg-[rgba(0,255,209,0.02)] transition-colors">
                  <td style={{ padding: '8px 10px' }}>
                    <span className="text-[10px] font-mono font-bold"
                      style={{ color: issue.priority === 1 ? '#FF3D6B' : issue.priority === 2 ? '#FFB800' : '#00E5FF' }}>
                      P{issue.priority}
                    </span>
                  </td>
                  <td className="text-[10px] font-mono text-[var(--color-muted-text)]" style={{ padding: '8px 10px' }}>{issue.framework}</td>
                  <td className="text-xs text-[var(--color-surface-text)]" style={{ padding: '8px 10px', maxWidth: '200px' }}>{issue.title}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="text-[9px] font-mono rounded-full" style={{
                      padding: '2px 8px',
                      background: issue.severity === 'critical' ? 'rgba(255,61,107,0.08)' : issue.severity === 'high' ? 'rgba(255,184,0,0.08)' : 'rgba(0,229,255,0.08)',
                      color: issue.severity === 'critical' ? '#FF3D6B' : issue.severity === 'high' ? '#FFB800' : '#00E5FF',
                    }}>{issue.severity}</span>
                  </td>
                  <td className="text-[10px] text-[var(--color-muted-text)]" style={{ padding: '8px 10px', maxWidth: '250px' }}>{issue.action}</td>
                  <td className="text-[10px] text-[var(--color-ghost-text)]" style={{ padding: '8px 10px' }}>{issue.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
