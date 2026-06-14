import { BehavioralFingerprint, BehavioralDiff, RootCause, Remediation, RegressionItem } from '@/types';
import { Trace } from '@/types/trace';
import { generateWithRetry } from './gemini';

// ============================================================
// Root Cause Analysis Engine
// Deep behavioral analysis that correlates regressions with traces
// to generate actionable explanations and remediations.
// ============================================================

export interface RootCauseAnalysis {
  regressions: RegressionRootCause[];
  overallSummary: string;
  suggestedActions: Remediation[];
  confidence: number;
  traceCorrelations: TraceCorrelation[];
}

export interface RegressionRootCause {
  dimension: string;
  severity: string;
  rootCause: RootCause;
  evidenceTraces: string[];
  remediations: Remediation[];
}

export interface TraceCorrelation {
  traceId: string;
  userQuery: string;
  dimension: string;
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}

/**
 * Perform deep root cause analysis by correlating regressions with traces.
 * This goes beyond the simple classification in evaluator.ts by:
 * 1. Analyzing trace-level patterns
 * 2. Identifying specific failing trace clusters
 * 3. Generating per-trace explanations
 * 4. Producing actionable remediation steps
 */
export async function analyzeRootCause(
  diff: BehavioralDiff,
  traces: Trace[],
  options: { baseFingerprint?: BehavioralFingerprint; newFingerprint?: BehavioralFingerprint } = {}
): Promise<RootCauseAnalysis> {
  const { baseFingerprint, newFingerprint } = options;

  if (diff.regressions.length === 0) {
    return {
      regressions: [],
      overallSummary: 'No regressions detected.',
      suggestedActions: [],
      confidence: 1.0,
      traceCorrelations: [],
    };
  }

  // ── 1. Cluster traces by regression dimension ──────────
  const traceCorrelations = correlateTracesWithRegressions(diff.regressions, traces);

  // ── 2. Analyze each regression with trace evidence ─────
  const regressionAnalyses = await Promise.all(
    diff.regressions.map(r => analyzeRegression(r, traces, traceCorrelations, baseFingerprint, newFingerprint))
  );

  // ── 3. Generate overall summary ───────────────────────
  const overallSummary = await generateOverallSummary(diff, regressionAnalyses, traces.length);

  // ── 4. Consolidate remediations ───────────────────────
  const allRemediations = regressionAnalyses.flatMap(ra => ra.remediations);
  const dedupedRemediations = deduplicateRemediations(allRemediations);

  // ── 5. Compute overall confidence ─────────────────────
  const avgConfidence = regressionAnalyses.reduce((sum, ra) => sum + ra.rootCause.confidence, 0) / regressionAnalyses.length;

  return {
    regressions: regressionAnalyses,
    overallSummary,
    suggestedActions: dedupedRemediations,
    confidence: avgConfidence,
    traceCorrelations,
  };
}

/**
 * Analyze a single regression using trace evidence.
 */
async function analyzeRegression(
  regression: RegressionItem,
  traces: Trace[],
  correlations: TraceCorrelation[],
  baseFingerprint?: BehavioralFingerprint,
  newFingerprint?: BehavioralFingerprint
): Promise<RegressionRootCause> {
  const relatedCorrelations = correlations.filter(c => c.dimension === regression.dimension);
  const evidenceTraces = relatedCorrelations.map(c => c.traceId);

  try {
    const traceExamples = traces
      .filter(t => evidenceTraces.includes(t.id))
      .slice(0, 5)
      .map(t => ({
        query: t.userQuery.slice(0, 200),
        response: t.finalResponse.slice(0, 300),
        hasRetrieval: (t.retrievedContext?.length || 0) > 0,
        hasTools: (t.toolCalls?.length || 0) > 0,
        latencyMs: t.latencyMs,
        hasError: !!t.error,
      }));

    const prompt = `You are a behavioral AI analyst for DriftGuard. Analyze this regression:

Dimension: ${regression.dimension}
Severity: ${regression.severity}
Base value: ${regression.baseValue.toFixed(4)}
New value: ${regression.newValue.toFixed(4)}
Delta: ${regression.delta.toFixed(4)}

${baseFingerprint ? `Base fingerprint context:
- Topic consistency: ${baseFingerprint.topicConsistency.toFixed(3)}
- Hallucination: ${baseFingerprint.hallucinationScore.toFixed(3)}
- Refusal rate: ${baseFingerprint.refusalRate.toFixed(3)}
- Tone: formal=${baseFingerprint.toneDistribution.formal.toFixed(2)}, empathetic=${baseFingerprint.toneDistribution.empathetic.toFixed(2)}` : ''}

${newFingerprint ? `New fingerprint context:
- Topic consistency: ${newFingerprint.topicConsistency.toFixed(3)}
- Hallucination: ${newFingerprint.hallucinationScore.toFixed(3)}
- Refusal rate: ${newFingerprint.refusalRate.toFixed(3)}
- Tone: formal=${newFingerprint.toneDistribution.formal.toFixed(2)}, empathetic=${newFingerprint.toneDistribution.empathetic.toFixed(2)}` : ''}

Sample traces showing the regression (${traceExamples.length} of ${evidenceTraces.length}):
${JSON.stringify(traceExamples, null, 2)}

Return a JSON object with:
{
  "category": "model_change|prompt_change|retrieval_degradation|data_shift|config_change|unknown",
  "explanation": "2-3 sentence explanation of the root cause, referencing specific trace patterns",
  "confidence": 0.0-1.0,
  "remediations": [{"priority": "immediate|next_release|backlog", "action": "what to do", "details": "why and how"}]
}
Return ONLY valid JSON.`;

    const result = await generateWithRetry(prompt);
    const cleaned = result.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      dimension: regression.dimension,
      severity: regression.severity,
      rootCause: {
        dimension: regression.dimension,
        category: parsed.category || 'unknown',
        explanation: parsed.explanation || `${regression.dimension} regressed significantly.`,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      },
      evidenceTraces,
      remediations: (parsed.remediations || []).map((r: any) => ({
        priority: r.priority || 'next_release',
        action: r.action || `Fix ${regression.dimension} regression`,
        details: r.details || '',
      })),
    };
  } catch {
    return {
      dimension: regression.dimension,
      severity: regression.severity,
      rootCause: {
        dimension: regression.dimension,
        category: 'unknown',
        explanation: `${regression.dimension} changed from ${regression.baseValue.toFixed(3)} to ${regression.newValue.toFixed(3)}. Unable to determine root cause automatically.`,
        confidence: 0.2,
      },
      evidenceTraces,
      remediations: [{
        priority: 'next_release' as const,
        action: `Investigate ${regression.dimension} regression manually`,
        details: `Examine ${evidenceTraces.length} correlated traces for patterns.`,
      }],
    };
  }
}

/**
 * Correlate traces with regression dimensions.
 * Identifies which traces are most likely contributing to each regression.
 */
function correlateTracesWithRegressions(
  regressions: RegressionItem[],
  traces: Trace[]
): TraceCorrelation[] {
  const correlations: TraceCorrelation[] = [];

  for (const regression of regressions) {
    for (const trace of traces) {
      let impact: 'high' | 'medium' | 'low' = 'low';
      let explanation = '';

      // Hallucination correlation
      if (regression.dimension === 'Hallucination Score') {
        const hasRetrieval = (trace.retrievedContext?.length || 0) > 0;
        if (!hasRetrieval && trace.finalResponse.length > 200) {
          impact = 'high';
          explanation = 'Response generated without retrieval context — high hallucination risk';
        } else if (hasRetrieval) {
          const lowScoreChunks = (trace.retrievedContext || []).filter((c: any) => (c.score || 0) < 0.6);
          if (lowScoreChunks.length > 0) {
            impact = 'medium';
            explanation = `${lowScoreChunks.length} retrieval chunks had low relevance scores`;
          }
        }
      }

      // Latency correlation
      if (regression.dimension === 'Avg Latency' || regression.dimension.includes('Latency')) {
        if (trace.latencyMs > regression.newValue * 1.5) {
          impact = 'high';
          explanation = `Trace latency (${trace.latencyMs}ms) significantly above average`;
        } else if (trace.latencyMs > regression.newValue) {
          impact = 'medium';
          explanation = `Trace latency (${trace.latencyMs}ms) above average`;
        }
      }

      // Tone correlation
      if (regression.dimension.includes('Tone') || regression.dimension.includes('Empathetic')) {
        const response = trace.finalResponse.toLowerCase();
        const hasAcknowledgements = /sorry|understand|appreciate|help|happy to/.test(response);
        if (!hasAcknowledgements && response.length > 50) {
          impact = 'medium';
          explanation = 'Response lacks empathetic acknowledgement phrases';
        }
      }

      // Error correlation
      if (trace.error) {
        impact = 'high';
        explanation = `Trace errored: ${trace.error.slice(0, 80)}`;
      }

      // Topic consistency
      if (regression.dimension === 'Topic Consistency' && trace.finalResponse.length < 20) {
        impact = 'medium';
        explanation = 'Very short response may indicate off-topic behavior';
      }

      if (impact !== 'low' || Math.random() < 0.1) {
        correlations.push({
          traceId: trace.id,
          userQuery: trace.userQuery.slice(0, 100),
          dimension: regression.dimension,
          impact,
          explanation: explanation || 'General pattern match',
        });
      }
    }
  }

  // Limit to top correlations per dimension
  const byDimension = new Map<string, TraceCorrelation[]>();
  for (const c of correlations) {
    if (!byDimension.has(c.dimension)) byDimension.set(c.dimension, []);
    byDimension.get(c.dimension)!.push(c);
  }

  const result: TraceCorrelation[] = [];
  for (const [, dimCorrelations] of byDimension) {
    const sorted = dimCorrelations.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.impact] - order[b.impact];
    });
    result.push(...sorted.slice(0, 10));
  }

  return result;
}

/**
 * Generate an overall summary of the root cause analysis.
 */
async function generateOverallSummary(
  diff: BehavioralDiff,
  analyses: RegressionRootCause[],
  traceCount: number
): Promise<string> {
  try {
    const categories = analyses.map(a => a.rootCause.category);
    const uniqueCategories = [...new Set(categories)];

    const prompt = `Summarize this behavioral diff analysis in 2-3 sentences for a developer:

Version: ${diff.baseVersion} → ${diff.newVersion}
Verdict: ${diff.verdict}
Similarity: ${((diff.similarityScore || 0) * 100).toFixed(1)}%
Regressions: ${analyses.map(a => `${a.dimension} (${a.severity}, cause: ${a.rootCause.category})`).join(', ')}
Root cause categories: ${uniqueCategories.join(', ')}
Traces analyzed: ${traceCount}

Focus on what changed, why, and what to do next.`;

    return await generateWithRetry(prompt);
  } catch {
    const criticalCount = analyses.filter(a => a.severity === 'critical').length;
    return `Version ${diff.newVersion} shows ${analyses.length} regression${analyses.length > 1 ? 's' : ''}${criticalCount > 0 ? ` (${criticalCount} critical)` : ''}. ${diff.verdict === 'BLOCK' ? 'Deployment is blocked.' : 'Review recommended.'}`;
  }
}

/**
 * Deduplicate remediations that have similar actions.
 */
function deduplicateRemediations(remediations: Remediation[]): Remediation[] {
  const seen = new Set<string>();
  const unique: Remediation[] = [];

  for (const r of remediations) {
    const key = r.action.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  // Sort by priority
  const priorityOrder = { immediate: 0, next_release: 1, backlog: 2 };
  return unique.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
}
