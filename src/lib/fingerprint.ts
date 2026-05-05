import { AIResponse, BehavioralFingerprint } from '@/types';
import { embedBatch, computeCentroid, cosineSimilarity } from './embeddings';
import { generateWithRetry } from './gemini';
import { v4 as uuidv4 } from 'uuid';

export async function computeFingerprint(
  responses: AIResponse[],
  endpointId: string,
  version: string
): Promise<BehavioralFingerprint> {
  if (responses.length === 0) {
    throw new Error('Cannot compute fingerprint from zero responses');
  }

  // 1. Embed all response texts
  const texts = responses.map(r => r.response);
  const embeddings = await embedBatch(texts);

  // 2. Compute semantic centroid
  const semanticCentroid = computeCentroid(embeddings);

  // 3. Classify tone distribution using Gemini
  const toneDistribution = await classifyTone(responses);

  // 4. Count refusals
  const refusalPatterns = [
    "i can't", "i'm unable", "i cannot", "i don't have access",
    "i'm not able", "as an ai", "i'm sorry, but i can't",
    "i apologize, but", "unfortunately, i cannot"
  ];
  const refusalCount = responses.filter(r =>
    refusalPatterns.some(p => r.response.toLowerCase().includes(p))
  ).length;
  const refusalRate = refusalCount / responses.length;

  // 5. Score hallucination via Gemini
  const hallucinationScore = await scoreHallucination(responses);

  // 6. Compute latency percentiles
  const latencies = responses.map(r => r.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.reduce((s, v) => s + v, 0) / latencies.length;

  // 7. Compute token count stats
  const tokenCounts = responses.map(r => r.tokenCount);
  const avgTokenCount = tokenCounts.reduce((s, v) => s + v, 0) / tokenCounts.length;

  // 8. Output length percentiles
  const lengths = responses.map(r => r.response.length).sort((a, b) => a - b);
  const outputLengthP50 = lengths[Math.floor(lengths.length * 0.5)] || 0;
  const outputLengthP95 = lengths[Math.floor(lengths.length * 0.95)] || 0;

  // 9. Topic consistency — average pairwise cosine similarity
  let totalSim = 0;
  let pairCount = 0;
  const sampleSize = Math.min(embeddings.length, 30);
  for (let i = 0; i < sampleSize; i++) {
    for (let j = i + 1; j < sampleSize; j++) {
      totalSim += cosineSimilarity(embeddings[i], embeddings[j]);
      pairCount++;
    }
  }
  const topicConsistency = pairCount > 0 ? totalSim / pairCount : 1;

  return {
    id: uuidv4(),
    version,
    endpointId,
    createdAt: new Date(),
    semanticCentroid,
    toneDistribution,
    refusalRate,
    hallucinationScore,
    avgLatencyMs,
    avgTokenCount,
    topicConsistency,
    outputLengthP50,
    outputLengthP95,
    sampleCount: responses.length,
  };
}

async function classifyTone(
  responses: AIResponse[]
): Promise<{ formal: number; casual: number; technical: number; empathetic: number }> {
  try {
    const sampleTexts = responses.slice(0, 10).map((r, i) => `Response ${i + 1}: "${r.response.slice(0, 200)}"`).join('\n');
    const prompt = `Analyze the tone of these AI responses and return a JSON object with 4 values that sum to 1.0:
${sampleTexts}

Return ONLY valid JSON in this exact format, no markdown:
{"formal": 0.X, "casual": 0.X, "technical": 0.X, "empathetic": 0.X}`;

    const result = await generateWithRetry(prompt);
    const cleaned = result.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const total = parsed.formal + parsed.casual + parsed.technical + parsed.empathetic;
    return {
      formal: parsed.formal / total,
      casual: parsed.casual / total,
      technical: parsed.technical / total,
      empathetic: parsed.empathetic / total,
    };
  } catch {
    return { formal: 0.3, casual: 0.2, technical: 0.3, empathetic: 0.2 };
  }
}

async function scoreHallucination(responses: AIResponse[]): Promise<number> {
  try {
    const samples = responses.slice(0, 5);
    let totalScore = 0;

    for (const sample of samples) {
      const prompt = `Rate the factual consistency of this AI response on a scale of 0.0 to 1.0, where 0.0 means completely factual and 1.0 means heavily hallucinated.

Query: "${sample.query}"
Response: "${sample.response.slice(0, 500)}"

Return ONLY a single decimal number between 0.0 and 1.0, nothing else.`;

      const result = await generateWithRetry(prompt);
      const score = parseFloat(result);
      totalScore += isNaN(score) ? 0.1 : Math.min(1, Math.max(0, score));
    }
    return totalScore / samples.length;
  } catch {
    return 0.1;
  }
}
