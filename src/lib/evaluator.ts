import { BehavioralFingerprint, BehavioralDiff, RegressionItem, ImprovementItem, RootCause, Remediation, DiffThresholds } from '@/types';
import { cosineSimilarity } from './embeddings';
import { generateWithRetry } from './gemini';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// Enhanced Diff Engine — Production-Grade
// ============================================================

export interface DiffOptions {
  /** Custom thresholds (overrides defaults) */
  thresholds?: Partial<DiffThresholds>;
  /** Enable root cause analysis via Gemini (default: true) */
  analyzeRootCauses?: boolean;
  /** Enable remediation suggestions (default: true) */
  suggestRemediations?: boolean;
  /** Tenant context */
  orgId?: string;
  projectId?: string;
  environmentId?: string;
  /** Link to deployment if triggered by deployment pipeline */
  deploymentId?: string;
}

// Default thresholds — can be overridden per-project
const DEFAULT_THRESHOLDS: DiffThresholds = {
  hallucinationWarn: 0.1,
  hallucinationBlock: 0.2,
  latencyWarnMs: 100,
  toneShiftWarn: 0.15,
  similarityBlock: 0.7,
};

export async function diffFingerprints(
  base: BehavioralFingerprint,
  next: BehavioralFingerprint,
  options: DiffOptions = {}
): Promise<BehavioralDiff> {
  const {
    thresholds: customThresholds,
    analyzeRootCauses = true,
    suggestRemediations = true,
    orgId,
    projectId,
    environmentId,
    deploymentId,
  } = options;

  const thresholds: DiffThresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };

  // ── 1. Semantic centroid similarity ─────────────────────
  const similarityScore = cosineSimilarity(base.semanticCentroid, next.semanticCentroid);

  // ── 2. Tone shift — sum of absolute differences ────────
  const toneShift =
    Math.abs(base.toneDistribution.formal - next.toneDistribution.formal) +
    Math.abs(base.toneDistribution.casual - next.toneDistribution.casual) +
    Math.abs(base.toneDistribution.technical - next.toneDistribution.technical) +
    Math.abs(base.toneDistribution.empathetic - next.toneDistribution.empathetic);

  // ── 3. Compute deltas for all dimensions ───────────────
  const dimensions: { name: string; baseVal: number; newVal: number; higherIsBetter: boolean }[] = [
    { name: 'Topic Consistency', baseVal: base.topicConsistency, newVal: next.topicConsistency, higherIsBetter: true },
    { name: 'Formality', baseVal: base.toneDistribution.formal, newVal: next.toneDistribution.formal, higherIsBetter: true },
    { name: 'Technical Depth', baseVal: base.toneDistribution.technical, newVal: next.toneDistribution.technical, higherIsBetter: true },
    { name: 'Empathetic Tone', baseVal: base.toneDistribution.empathetic, newVal: next.toneDistribution.empathetic, higherIsBetter: true },
    { name: 'Refusal Rate', baseVal: base.refusalRate, newVal: next.refusalRate, higherIsBetter: false },
    { name: 'Hallucination Score', baseVal: base.hallucinationScore, newVal: next.hallucinationScore, higherIsBetter: false },
    { name: 'Avg Latency', baseVal: base.avgLatencyMs, newVal: next.avgLatencyMs, higherIsBetter: false },
    { name: 'Semantic Coherence', baseVal: similarityScore, newVal: 1.0, higherIsBetter: true },
    // Enterprise dimensions
    { name: 'Output Length (p50)', baseVal: base.outputLengthP50, newVal: next.outputLengthP50, higherIsBetter: true },
    { name: 'Token Efficiency', baseVal: base.avgTokenCount, newVal: next.avgTokenCount, higherIsBetter: false },
  ];

  // Add toxicity/bias if available on both fingerprints
  if (base.toxicityScore !== undefined && next.toxicityScore !== undefined) {
    dimensions.push({ name: 'Toxicity Score', baseVal: base.toxicityScore, newVal: next.toxicityScore, higherIsBetter: false });
  }
  if (base.biasScore !== undefined && next.biasScore !== undefined) {
    dimensions.push({ name: 'Bias Score', baseVal: base.biasScore, newVal: next.biasScore, higherIsBetter: false });
  }
  if (base.piiDetected !== undefined && next.piiDetected !== undefined) {
    dimensions.push({
      name: 'PII Exposure',
      baseVal: base.piiDetected / Math.max(1, base.sampleCount),
      newVal: next.piiDetected / Math.max(1, next.sampleCount),
      higherIsBetter: false,
    });
  }

  const regressions: RegressionItem[] = [];
  const improvements: ImprovementItem[] = [];

  for (const dim of dimensions) {
    const delta = dim.newVal - dim.baseVal;
    const absDeltaPct = dim.baseVal !== 0
      ? Math.abs(delta / dim.baseVal)
      : Math.abs(delta);

    const isRegression = dim.higherIsBetter ? delta < 0 : delta > 0;
    const isImprovement = dim.higherIsBetter ? delta > 0 : delta < 0;

    if (isRegression && absDeltaPct > 0.05) {
      let severity: RegressionItem['severity'] = 'low';
      if (absDeltaPct > 0.5) severity = 'critical';
      else if (absDeltaPct > 0.3) severity = 'high';
      else if (absDeltaPct > 0.15) severity = 'medium';

      regressions.push({ dimension: dim.name, baseValue: dim.baseVal, newValue: dim.newVal, delta, severity });
    } else if (isImprovement && absDeltaPct > 0.05) {
      improvements.push({ dimension: dim.name, baseValue: dim.baseVal, newValue: dim.newVal, delta });
    }
  }

  // ── 4. Compute key deltas ──────────────────────────────
  const hallucinationDelta = next.hallucinationScore - base.hallucinationScore;
  const latencyDelta = next.avgLatencyMs - base.avgLatencyMs;

  // ── 5. Compute composite severity score (0-100) ────────
  const compositeScore = computeCompositeScore(regressions, similarityScore, hallucinationDelta, toneShift, thresholds);

  // ── 6. Determine verdict using configurable thresholds ─
  let verdict: BehavioralDiff['verdict'] = 'PASS';
  const hasCritical = regressions.some(r => r.severity === 'critical');
  const hasHigh = regressions.some(r => r.severity === 'high');

  if (hasCritical || hallucinationDelta > thresholds.hallucinationBlock || similarityScore < thresholds.similarityBlock) {
    verdict = 'BLOCK';
  } else if (hasHigh || hallucinationDelta > thresholds.hallucinationWarn || toneShift > thresholds.toneShiftWarn || similarityScore < 0.85) {
    verdict = 'WARN';
  }

  // ── 7. Root cause analysis ─────────────────────────────
  let rootCauses: RootCause[] = [];
  if (analyzeRootCauses && regressions.length > 0 && (verdict === 'WARN' || verdict === 'BLOCK')) {
    rootCauses = await analyzeRegressionRootCauses(regressions, base, next);
  }

  // ── 8. Remediation suggestions ─────────────────────────
  let remediations: Remediation[] = [];
  if (suggestRemediations && regressions.length > 0) {
    remediations = generateRemediations(regressions, rootCauses, verdict);
  }

  // ── 9. Generate verdict reason ─────────────────────────
  let verdictReason = '';
  try {
    const prompt = `You are an AI behavioral analyst for DriftGuard. Given these behavioral diff results:
- Similarity: ${(similarityScore * 100).toFixed(1)}%
- Hallucination delta: ${(hallucinationDelta * 100).toFixed(1)}%
- Tone shift: ${(toneShift * 100).toFixed(1)}%
- Composite severity: ${compositeScore}/100
- Regressions: ${regressions.map(r => `${r.dimension} (${r.severity})`).join(', ') || 'none'}
- Improvements: ${improvements.map(i => i.dimension).join(', ') || 'none'}
- Root causes: ${rootCauses.map(rc => rc.explanation).join('; ') || 'none identified'}
- Verdict: ${verdict}

Write exactly 2-3 sentences explaining this behavioral diff for a developer. Be specific and actionable. Focus on what changed and why it matters.`;

    verdictReason = await generateWithRetry(prompt);
  } catch {
    verdictReason = `Version ${next.version} shows ${regressions.length} regressions and ${improvements.length} improvements compared to ${base.version}. ${verdict === 'BLOCK' ? 'Deployment is blocked due to critical behavioral changes.' : verdict === 'WARN' ? 'Review recommended before deployment.' : 'Changes are within acceptable thresholds.'}`;
  }

  // ── 10. Determine auto-approval ────────────────────────
  const reviewStatus = verdict === 'PASS' ? 'auto_approved' as const : 'pending' as const;

  return {
    id: uuidv4(),
    baseVersion: base.version,
    newVersion: next.version,
    endpointId: base.endpointId,
    createdAt: new Date(),
    similarityScore,
    regressions,
    improvements,
    toneShift,
    hallucinationDelta,
    latencyDelta,
    verdict,
    verdictReason,
    // Enterprise extensions
    orgId,
    projectId,
    environmentId,
    rootCauses,
    remediations,
    compositeScore,
    thresholdsUsed: thresholds,
    reviewStatus,
    deploymentId,
  };
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Compute a composite severity score (0-100) across all regression dimensions.
 * Weighted: critical=25, high=15, medium=8, low=3, plus hallucination and similarity penalties.
 */
function computeCompositeScore(
  regressions: RegressionItem[],
  similarityScore: number,
  hallucinationDelta: number,
  toneShift: number,
  thresholds: DiffThresholds
): number {
  const SEVERITY_WEIGHTS = { critical: 25, high: 15, medium: 8, low: 3 };

  let score = 0;
  for (const r of regressions) {
    score += SEVERITY_WEIGHTS[r.severity] || 0;
  }

  // Similarity penalty
  if (similarityScore < thresholds.similarityBlock) score += 20;
  else if (similarityScore < 0.85) score += 10;
  else if (similarityScore < 0.95) score += 5;

  // Hallucination penalty
  if (hallucinationDelta > thresholds.hallucinationBlock) score += 20;
  else if (hallucinationDelta > thresholds.hallucinationWarn) score += 10;

  // Tone shift penalty
  if (toneShift > thresholds.toneShiftWarn * 2) score += 10;
  else if (toneShift > thresholds.toneShiftWarn) score += 5;

  return Math.min(100, score);
}

/**
 * Analyze root causes of regressions using Gemini.
 */
async function analyzeRegressionRootCauses(
  regressions: RegressionItem[],
  base: BehavioralFingerprint,
  next: BehavioralFingerprint
): Promise<RootCause[]> {
  try {
    const regressionSummary = regressions.map(r =>
      `${r.dimension}: ${r.baseValue.toFixed(3)} → ${r.newValue.toFixed(3)} (Δ ${r.delta.toFixed(3)}, ${r.severity})`
    ).join('\n');

    const prompt = `You are an AI behavioral analyst. Analyze the root causes of these behavioral regressions between version ${base.version} and ${next.version}:

${regressionSummary}

Context:
- Sample size: ${base.sampleCount} → ${next.sampleCount}
- Topic consistency: ${base.topicConsistency.toFixed(3)} → ${next.topicConsistency.toFixed(3)}
- Hallucination: ${base.hallucinationScore.toFixed(3)} → ${next.hallucinationScore.toFixed(3)}

For each regression, classify the likely root cause as one of:
- model_change: The underlying LLM model was updated
- prompt_change: System prompt or prompt template was modified
- retrieval_degradation: RAG retrieval quality declined
- data_shift: Training or fine-tuning data distribution changed
- config_change: Temperature, tokens, or other config parameters changed
- unknown: Cannot determine from available data

Return a JSON array with objects having: dimension, category, explanation, confidence (0-1).
Return ONLY valid JSON, no markdown.`;

    const result = await generateWithRetry(prompt);
    const cleaned = result.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return (Array.isArray(parsed) ? parsed : []).map((rc: any) => ({
      dimension: rc.dimension || 'Unknown',
      category: rc.category || 'unknown',
      explanation: rc.explanation || 'Unable to determine root cause.',
      confidence: Math.min(1, Math.max(0, rc.confidence || 0.5)),
    }));
  } catch {
    // Fallback: generate simple root causes from regression data
    return regressions.map(r => ({
      dimension: r.dimension,
      category: 'unknown' as const,
      explanation: `${r.dimension} regressed by ${Math.abs(r.delta).toFixed(3)} (${r.severity} severity). Further investigation needed.`,
      confidence: 0.3,
    }));
  }
}

/**
 * Generate remediation suggestions based on regressions and root causes.
 */
function generateRemediations(
  regressions: RegressionItem[],
  rootCauses: RootCause[],
  verdict: string
): Remediation[] {
  const remediations: Remediation[] = [];
  const rootCauseMap = new Map(rootCauses.map(rc => [rc.dimension, rc]));

  for (const r of regressions) {
    const rc = rootCauseMap.get(r.dimension);
    const priority: Remediation['priority'] = r.severity === 'critical' ? 'immediate' : r.severity === 'high' ? 'immediate' : 'next_release';

    const action = getRemediationAction(r, rc);
    const details = getRemediationDetails(r, rc);

    remediations.push({ priority, action, details });
  }

  // Add deployment-level recommendation
  if (verdict === 'BLOCK') {
    remediations.unshift({
      priority: 'immediate',
      action: 'Do not deploy this version to production',
      details: 'Critical behavioral regressions detected. Investigate root causes, apply fixes, and re-evaluate before attempting deployment.',
    });
  }

  return remediations;
}

function getRemediationAction(r: RegressionItem, rc?: RootCause): string {
  const actions: Record<string, string> = {
    'Hallucination Score': 'Reduce hallucination rate by adding retrieval grounding or fact-checking layers',
    'Empathetic Tone': 'Restore empathetic tone by adjusting system prompt or reverting prompt changes',
    'Topic Consistency': 'Investigate retrieval pipeline for quality degradation',
    'Refusal Rate': 'Review safety guardrails for over-triggering',
    'Avg Latency': 'Profile and optimize response generation pipeline',
    'Toxicity Score': 'Strengthen content safety filters',
    'Bias Score': 'Audit training data and prompts for bias patterns',
    'PII Exposure': 'Enable PII masking and review data handling',
  };

  if (rc?.category === 'prompt_change') return `Review and revert recent system prompt changes affecting ${r.dimension}`;
  if (rc?.category === 'model_change') return `Evaluate new model version impact on ${r.dimension}`;
  if (rc?.category === 'retrieval_degradation') return `Debug RAG pipeline — ${r.dimension} degradation suggests retrieval quality issues`;

  return actions[r.dimension] || `Investigate and fix ${r.dimension} regression`;
}

function getRemediationDetails(r: RegressionItem, rc?: RootCause): string {
  return `${r.dimension} changed from ${r.baseValue.toFixed(3)} to ${r.newValue.toFixed(3)} (Δ ${r.delta.toFixed(3)}). Severity: ${r.severity}. ${rc ? `Likely cause: ${rc.explanation}` : 'Root cause analysis inconclusive.'}`;
}
