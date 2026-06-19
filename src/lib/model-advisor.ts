// ============================================================
// Model Advisor — Suitability scoring & recommendation engine
// ============================================================

import { MODEL_DATABASE, ModelInfo, calculateCost } from './ai-providers';

export interface UseCaseProfile {
  id: string;
  name: string;
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  accuracyNeed: number;     // 0-100
  latencyNeed: number;      // 0-100 (100 = need fast)
  riskTolerance: number;    // 0-100 (100 = high tolerance)
  complianceNeed: number;   // 0-100
  contextLength: 'short' | 'medium' | 'long' | 'very_long';
  recommendedModel: string;
  explanation: string;
}

export interface SuitabilityResult {
  model: ModelInfo;
  suitabilityScore: number;   // 0-100
  confidenceScore: number;    // 0-100
  reason: string;
  strengths: string[];
  weaknesses: string[];
  projectedMonthlyCost: number;
}

export interface ScenarioInput {
  users: number;
  requestsPerMonth: number;
  complexity: number;      // 1-5
  complianceNeeds: boolean;
  avgInputTokens?: number;
  avgOutputTokens?: number;
}

export interface ScenarioResult {
  recommendedModel: ModelInfo;
  projectedCost: number;
  projectedRisk: number;
  expectedAccuracy: number;
  alternatives: { model: ModelInfo; cost: number; accuracy: number }[];
  explanation: string;
}

// ── Use Case Profiles ────────────────────────────────────────
export const USE_CASES: UseCaseProfile[] = [
  { id: 'customer-support', name: 'Customer Support', complexity: 'medium', accuracyNeed: 80, latencyNeed: 85, riskTolerance: 40, complianceNeed: 60, contextLength: 'medium', recommendedModel: 'claude-sonnet', explanation: 'Sonnet balances quality and speed for support conversations. Haiku for simple FAQs.' },
  { id: 'faq-bot', name: 'FAQ Bot', complexity: 'low', accuracyNeed: 70, latencyNeed: 95, riskTolerance: 70, complianceNeed: 30, contextLength: 'short', recommendedModel: 'claude-haiku', explanation: 'Haiku is the most cost-effective choice for simple, repetitive question answering.' },
  { id: 'email-automation', name: 'Email Automation', complexity: 'medium', accuracyNeed: 85, latencyNeed: 50, riskTolerance: 30, complianceNeed: 70, contextLength: 'medium', recommendedModel: 'claude-sonnet', explanation: 'Sonnet provides the writing quality needed for professional email communication.' },
  { id: 'sales-assistant', name: 'Sales Assistant', complexity: 'medium', accuracyNeed: 80, latencyNeed: 80, riskTolerance: 50, complianceNeed: 50, contextLength: 'medium', recommendedModel: 'claude-sonnet', explanation: 'Sonnet handles nuanced sales conversations with good personalization ability.' },
  { id: 'healthcare-assistant', name: 'Healthcare Assistant', complexity: 'high', accuracyNeed: 95, latencyNeed: 60, riskTolerance: 10, complianceNeed: 95, contextLength: 'long', recommendedModel: 'claude-opus', explanation: 'Healthcare requires maximum accuracy and compliance. Opus minimizes hallucination risk.' },
  { id: 'banking-assistant', name: 'Banking Assistant', complexity: 'high', accuracyNeed: 95, latencyNeed: 70, riskTolerance: 10, complianceNeed: 95, contextLength: 'medium', recommendedModel: 'claude-opus', explanation: 'Financial advice demands highest accuracy. Opus provides best reasoning for complex queries.' },
  { id: 'research-agent', name: 'Research Agent', complexity: 'very_high', accuracyNeed: 90, latencyNeed: 30, riskTolerance: 40, complianceNeed: 40, contextLength: 'very_long', recommendedModel: 'claude-opus', explanation: 'Research tasks need deep reasoning and long context handling. Opus excels here.' },
  { id: 'legal-assistant', name: 'Legal Assistant', complexity: 'very_high', accuracyNeed: 98, latencyNeed: 30, riskTolerance: 5, complianceNeed: 90, contextLength: 'very_long', recommendedModel: 'claude-opus', explanation: 'Legal work requires near-perfect accuracy and careful analysis. Opus is the safest choice.' },
  { id: 'coding-assistant', name: 'Coding Assistant', complexity: 'high', accuracyNeed: 85, latencyNeed: 80, riskTolerance: 60, complianceNeed: 20, contextLength: 'long', recommendedModel: 'claude-sonnet', explanation: 'Sonnet offers excellent coding ability with good speed. Best balance for developer tools.' },
  { id: 'architecture-agent', name: 'Architecture Agent', complexity: 'very_high', accuracyNeed: 90, latencyNeed: 20, riskTolerance: 30, complianceNeed: 50, contextLength: 'very_long', recommendedModel: 'claude-opus', explanation: 'System design needs deep reasoning across large codebases. Opus handles complexity best.' },
  { id: 'enterprise-copilot', name: 'Enterprise Copilot', complexity: 'high', accuracyNeed: 85, latencyNeed: 75, riskTolerance: 30, complianceNeed: 80, contextLength: 'long', recommendedModel: 'claude-sonnet', explanation: 'Enterprise copilots need good quality with reasonable latency. Sonnet is the sweet spot.' },
  { id: 'multi-agent', name: 'Multi-Agent Systems', complexity: 'very_high', accuracyNeed: 85, latencyNeed: 40, riskTolerance: 40, complianceNeed: 60, contextLength: 'long', recommendedModel: 'claude-opus', explanation: 'Orchestrating multiple agents requires superior reasoning. Use Haiku for sub-agents, Opus for orchestrator.' },
  { id: 'autonomous-agents', name: 'Autonomous Agents', complexity: 'very_high', accuracyNeed: 92, latencyNeed: 30, riskTolerance: 15, complianceNeed: 70, contextLength: 'very_long', recommendedModel: 'claude-opus', explanation: 'Autonomous operation requires highest reliability. Opus minimizes error rates in unsupervised scenarios.' },
];

// ── Suitability Scoring ──────────────────────────────────────
export function evaluateSuitability(
  taskComplexity: number,    // 1-5
  accuracyNeed: number,      // 0-100
  latencyNeed: number,       // 0-100
  riskTolerance: number,     // 0-100
  complianceNeed: number,    // 0-100
  expectedTraffic: number,   // requests/month
): SuitabilityResult[] {
  const claudeModels = MODEL_DATABASE.filter(m => m.provider === 'anthropic');

  return claudeModels.map(model => {
    let score = 50;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Quality fit
    const modelQuality = model.tier === 'premium' ? 95 : model.tier === 'standard' ? 80 : 65;
    if (modelQuality >= accuracyNeed) {
      score += 15;
      strengths.push(`Quality (${modelQuality}) meets requirement (${accuracyNeed})`);
    } else {
      score -= 20;
      weaknesses.push(`Quality (${modelQuality}) below requirement (${accuracyNeed})`);
    }

    // Latency fit
    const modelSpeed = model.tier === 'economy' ? 95 : model.tier === 'standard' ? 75 : 50;
    if (modelSpeed >= latencyNeed) {
      score += 10;
      strengths.push('Response speed meets requirements');
    } else {
      score -= 10;
      weaknesses.push('May be too slow for your latency needs');
    }

    // Complexity fit
    const modelComplexity = model.tier === 'premium' ? 5 : model.tier === 'standard' ? 3.5 : 2;
    if (modelComplexity >= taskComplexity) {
      score += 15;
      strengths.push('Handles task complexity well');
    } else if (modelComplexity >= taskComplexity - 1) {
      score += 5;
    } else {
      score -= 15;
      weaknesses.push('Task may be too complex for this model');
    }

    // Risk
    if (riskTolerance < 30 && model.tier === 'premium') {
      score += 10;
      strengths.push('Lowest hallucination risk');
    } else if (riskTolerance < 30 && model.tier === 'economy') {
      score -= 15;
      weaknesses.push('Higher error rate may violate risk tolerance');
    }

    // Compliance
    if (complianceNeed > 70 && model.tier === 'premium') {
      score += 10;
      strengths.push('Best audit trail and compliance support');
    }

    // Cost efficiency at scale
    const monthlyCost = calculateCost(model.id, expectedTraffic * 800, expectedTraffic * 400);
    if (monthlyCost < 100) {
      score += 5;
      strengths.push('Very cost-effective at this scale');
    } else if (monthlyCost > 1000) {
      score -= 5;
      weaknesses.push(`High monthly cost: $${monthlyCost.toFixed(0)}`);
    }

    const confidence = Math.min(95, 60 + (score > 70 ? 25 : score > 50 ? 15 : 5));

    let reason = '';
    if (score >= 80) reason = `${model.name} is an excellent fit for your requirements.`;
    else if (score >= 60) reason = `${model.name} is a good fit with some trade-offs.`;
    else reason = `${model.name} may not be ideal for this use case.`;

    return {
      model,
      suitabilityScore: Math.max(0, Math.min(100, score)),
      confidenceScore: confidence,
      reason,
      strengths,
      weaknesses,
      projectedMonthlyCost: monthlyCost,
    };
  }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

// ── Scenario Simulator ───────────────────────────────────────
export function simulateScenario(input: ScenarioInput): ScenarioResult {
  const avgInput = input.avgInputTokens || (input.complexity <= 2 ? 500 : input.complexity <= 4 ? 1200 : 2500);
  const avgOutput = input.avgOutputTokens || (input.complexity <= 2 ? 200 : input.complexity <= 4 ? 600 : 1500);

  const claudeModels = MODEL_DATABASE.filter(m => m.provider === 'anthropic');
  const results = claudeModels.map(model => {
    const cost = calculateCost(model.id, input.requestsPerMonth * avgInput, input.requestsPerMonth * avgOutput);
    const accuracy = model.tier === 'premium' ? 95 : model.tier === 'standard' ? 82 : 68;
    const risk = model.tier === 'premium' ? 5 : model.tier === 'standard' ? 18 : 35;

    // Adjust for complexity
    const adjustedAccuracy = Math.max(40, accuracy - (input.complexity - 3) * (model.tier === 'economy' ? 8 : 3));
    const adjustedRisk = Math.min(80, risk + (input.complexity - 3) * (model.tier === 'economy' ? 10 : 3));

    return { model, cost, accuracy: adjustedAccuracy, risk: adjustedRisk };
  });

  // Pick best model based on weighted scoring
  const scored = results.map(r => {
    let score = r.accuracy * 0.4 - r.risk * 0.3 - (r.cost / 100) * 0.3;
    if (input.complianceNeeds && r.model.tier === 'premium') score += 10;
    if (input.complianceNeeds && r.model.tier === 'economy') score -= 15;
    return { ...r, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  return {
    recommendedModel: best.model,
    projectedCost: best.cost,
    projectedRisk: best.risk,
    expectedAccuracy: best.accuracy,
    alternatives: scored.slice(1).map(s => ({ model: s.model, cost: s.cost, accuracy: s.accuracy })),
    explanation: `Based on ${input.requestsPerMonth.toLocaleString()} monthly requests at complexity level ${input.complexity}, ${best.model.name} offers the best balance of quality (${best.accuracy}%), cost ($${best.cost.toFixed(2)}/mo), and risk (${best.risk}%).${input.complianceNeeds ? ' Compliance requirements factored into the recommendation.' : ''}`,
  };
}
