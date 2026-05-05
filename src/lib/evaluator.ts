import { BehavioralFingerprint, BehavioralDiff, RegressionItem, ImprovementItem } from '@/types';
import { cosineSimilarity } from './embeddings';
import { generateWithRetry } from './gemini';
import { v4 as uuidv4 } from 'uuid';

export async function diffFingerprints(
  base: BehavioralFingerprint,
  next: BehavioralFingerprint
): Promise<BehavioralDiff> {
  // 1. Semantic centroid similarity
  const similarityScore = cosineSimilarity(base.semanticCentroid, next.semanticCentroid);

  // 2. Tone shift — sum of absolute differences
  const toneShift =
    Math.abs(base.toneDistribution.formal - next.toneDistribution.formal) +
    Math.abs(base.toneDistribution.casual - next.toneDistribution.casual) +
    Math.abs(base.toneDistribution.technical - next.toneDistribution.technical) +
    Math.abs(base.toneDistribution.empathetic - next.toneDistribution.empathetic);

  // 3. Compute deltas for all dimensions
  const dimensions: { name: string; baseVal: number; newVal: number; higherIsBetter: boolean }[] = [
    { name: 'Topic Consistency', baseVal: base.topicConsistency, newVal: next.topicConsistency, higherIsBetter: true },
    { name: 'Formality', baseVal: base.toneDistribution.formal, newVal: next.toneDistribution.formal, higherIsBetter: true },
    { name: 'Technical Depth', baseVal: base.toneDistribution.technical, newVal: next.toneDistribution.technical, higherIsBetter: true },
    { name: 'Empathy', baseVal: base.toneDistribution.empathetic, newVal: next.toneDistribution.empathetic, higherIsBetter: true },
    { name: 'Refusal Rate', baseVal: base.refusalRate, newVal: next.refusalRate, higherIsBetter: false },
    { name: 'Hallucination Score', baseVal: base.hallucinationScore, newVal: next.hallucinationScore, higherIsBetter: false },
    { name: 'Avg Latency', baseVal: base.avgLatencyMs, newVal: next.avgLatencyMs, higherIsBetter: false },
    { name: 'Semantic Coherence', baseVal: similarityScore, newVal: 1.0, higherIsBetter: true },
  ];

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

      regressions.push({
        dimension: dim.name,
        baseValue: dim.baseVal,
        newValue: dim.newVal,
        delta,
        severity,
      });
    } else if (isImprovement && absDeltaPct > 0.05) {
      improvements.push({
        dimension: dim.name,
        baseValue: dim.baseVal,
        newValue: dim.newVal,
        delta,
      });
    }
  }

  // 4. Compute hallucination delta
  const hallucinationDelta = next.hallucinationScore - base.hallucinationScore;
  const latencyDelta = next.avgLatencyMs - base.avgLatencyMs;

  // 5. Determine verdict
  let verdict: BehavioralDiff['verdict'] = 'PASS';
  const hasCritical = regressions.some(r => r.severity === 'critical');
  const hasHigh = regressions.some(r => r.severity === 'high');

  if (hasCritical || hallucinationDelta > 0.2 || similarityScore < 0.7) {
    verdict = 'BLOCK';
  } else if (hasHigh || hallucinationDelta > 0.1 || similarityScore < 0.85) {
    verdict = 'WARN';
  }

  // 6. Generate verdict reason
  let verdictReason = '';
  try {
    const prompt = `You are an AI behavioral analyst. Given these behavioral diff results:
- Similarity: ${(similarityScore * 100).toFixed(1)}%
- Hallucination delta: ${(hallucinationDelta * 100).toFixed(1)}%
- Tone shift: ${(toneShift * 100).toFixed(1)}%
- Regressions: ${regressions.map(r => `${r.dimension} (${r.severity})`).join(', ') || 'none'}
- Improvements: ${improvements.map(i => i.dimension).join(', ') || 'none'}
- Verdict: ${verdict}

Write exactly 2 sentences explaining this behavioral diff for a developer. Be specific and actionable.`;

    verdictReason = await generateWithRetry(prompt);
  } catch {
    verdictReason = `Version ${next.version} shows ${regressions.length} regressions and ${improvements.length} improvements compared to ${base.version}. ${verdict === 'BLOCK' ? 'Deployment is blocked due to critical behavioral changes.' : verdict === 'WARN' ? 'Review recommended before deployment.' : 'Changes are within acceptable thresholds.'}`;
  }

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
  };
}
