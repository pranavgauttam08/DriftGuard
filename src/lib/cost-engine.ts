// ============================================================
// Cost Intelligence Engine
// Forecasting, comparison, optimization for AI model usage
// ============================================================

import { MODEL_DATABASE, ModelInfo, calculateCost } from './ai-providers';

export interface CostSnapshot {
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestCount: number;
}

export interface CostForecast {
  period: '30d' | '90d' | '180d' | '365d';
  expected: number;
  maximum: number;
  worstCase: number;
  growthCost: number;
  retryCost: number;
}

export interface ModelComparison {
  model: ModelInfo;
  monthlyCost: number;
  costPerRequest: number;
  qualityScore: number;   // 0-100
  latencyScore: number;   // 0-100 (100 = fast)
  riskScore: number;      // 0-100 (0 = low risk)
  roi: number;            // quality/cost ratio
}

export interface OptimizationSuggestion {
  id: string;
  currentModel: string;
  suggestedModel: string;
  savingsPercent: number;
  savingsUsd: number;
  reason: string;
  workloadType: string;
  riskDelta: string;     // 'lower' | 'same' | 'higher'
  qualityImpact: string; // 'better' | 'similar' | 'slightly_lower'
}

// ── Generate demo cost history ───────────────────────────────
export function generateCostHistory(days: number = 30): CostSnapshot[] {
  const history: CostSnapshot[] = [];
  const models = ['claude-sonnet', 'claude-haiku', 'claude-opus'];
  const now = Date.now();

  for (let d = days; d >= 0; d--) {
    const date = new Date(now - d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseFactor = isWeekend ? 0.4 : 1.0;

    for (const modelId of models) {
      const model = MODEL_DATABASE.find(m => m.id === modelId);
      if (!model) continue;

      // Sonnet is the primary model, Haiku for simple tasks, Opus rare
      const baseRequests = modelId === 'claude-sonnet' ? 1200 : modelId === 'claude-haiku' ? 800 : 120;
      const requestCount = Math.round(baseRequests * baseFactor * (0.8 + Math.random() * 0.4));
      const avgInputTokens = modelId === 'claude-opus' ? 2000 : 800;
      const avgOutputTokens = modelId === 'claude-opus' ? 1500 : 400;
      const inputTokens = requestCount * avgInputTokens;
      const outputTokens = requestCount * avgOutputTokens;
      const costUsd = calculateCost(modelId, inputTokens, outputTokens);

      history.push({ date, model: modelId, inputTokens, outputTokens, costUsd, requestCount });
    }
  }

  return history;
}

// ── Calculate current metrics ────────────────────────────────
export function calculateMetrics(history: CostSnapshot[]) {
  const last30 = history.filter(h => {
    const daysAgo = (Date.now() - new Date(h.date).getTime()) / (24 * 60 * 60 * 1000);
    return daysAgo <= 30;
  });

  const totalCost = last30.reduce((sum, h) => sum + h.costUsd, 0);
  const totalRequests = last30.reduce((sum, h) => sum + h.requestCount, 0);
  const todaysCost = last30.filter(h => h.date === new Date().toISOString().split('T')[0]).reduce((sum, h) => sum + h.costUsd, 0);
  const annualProjected = totalCost * 12;
  const avgDailyCost = totalCost / 30;

  // Budget (example: $500/month)
  const budget = 500;
  const budgetUtilization = (totalCost / budget) * 100;

  // Cost efficiency: how much useful output per dollar
  const totalOutputTokens = last30.reduce((sum, h) => sum + h.outputTokens, 0);
  const tokensPerDollar = totalCost > 0 ? totalOutputTokens / totalCost : 0;
  const efficiencyScore = Math.min(100, Math.round(tokensPerDollar / 1000));

  // Cost risk: based on growth trend and budget proximity
  const firstHalf = last30.filter(h => {
    const daysAgo = (Date.now() - new Date(h.date).getTime()) / (24 * 60 * 60 * 1000);
    return daysAgo > 15;
  }).reduce((sum, h) => sum + h.costUsd, 0);
  const secondHalf = totalCost - firstHalf;
  const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  const riskScore = Math.min(100, Math.max(0, Math.round(budgetUtilization * 0.4 + Math.max(0, growthRate) * 0.6)));

  return {
    totalCost,
    todaysCost,
    monthlyCost: totalCost,
    annualProjected,
    avgDailyCost,
    totalRequests,
    budget,
    budgetUtilization,
    efficiencyScore,
    riskScore,
    growthRate,
  };
}

// ── Generate forecasts ───────────────────────────────────────
export function generateForecasts(history: CostSnapshot[]): CostForecast[] {
  const metrics = calculateMetrics(history);
  const daily = metrics.avgDailyCost;
  const growth = Math.max(0, metrics.growthRate / 100);

  return [
    { period: '30d', expected: daily * 30, maximum: daily * 30 * 1.3, worstCase: daily * 30 * 1.8, growthCost: daily * 30 * growth, retryCost: daily * 30 * 0.05 },
    { period: '90d', expected: daily * 90 * (1 + growth * 0.5), maximum: daily * 90 * 1.5, worstCase: daily * 90 * 2.2, growthCost: daily * 90 * growth, retryCost: daily * 90 * 0.05 },
    { period: '180d', expected: daily * 180 * (1 + growth), maximum: daily * 180 * 1.8, worstCase: daily * 180 * 2.8, growthCost: daily * 180 * growth * 1.5, retryCost: daily * 180 * 0.06 },
    { period: '365d', expected: daily * 365 * (1 + growth * 1.5), maximum: daily * 365 * 2.2, worstCase: daily * 365 * 3.5, growthCost: daily * 365 * growth * 2, retryCost: daily * 365 * 0.07 },
  ];
}

// ── Model comparison ─────────────────────────────────────────
export function compareModels(monthlyRequests: number = 30000, avgInputTokens: number = 800, avgOutputTokens: number = 400): ModelComparison[] {
  const claudeModels = MODEL_DATABASE.filter(m => m.provider === 'anthropic');

  return claudeModels.map(model => {
    const inputTokens = monthlyRequests * avgInputTokens;
    const outputTokens = monthlyRequests * avgOutputTokens;
    const monthlyCost = calculateCost(model.id, inputTokens, outputTokens);
    const costPerRequest = monthlyCost / monthlyRequests;

    const qualityScore = model.tier === 'premium' ? 95 : model.tier === 'standard' ? 82 : 68;
    const latencyScore = model.tier === 'economy' ? 95 : model.tier === 'standard' ? 75 : 55;
    const riskScore = model.tier === 'economy' ? 35 : model.tier === 'standard' ? 18 : 8;
    const roi = monthlyCost > 0 ? qualityScore / (monthlyCost / 100) : 0;

    return { model, monthlyCost, costPerRequest, qualityScore, latencyScore, riskScore, roi };
  });
}

// ── Optimization suggestions ─────────────────────────────────
export function getOptimizationSuggestions(history: CostSnapshot[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check if Opus is being used for simple tasks
  const opusUsage = history.filter(h => h.model === 'claude-opus');
  const opusCost = opusUsage.reduce((sum, h) => sum + h.costUsd, 0);
  if (opusCost > 0) {
    const opusRequests = opusUsage.reduce((sum, h) => sum + h.requestCount, 0);
    const sonnetCost = calculateCost('claude-sonnet', opusRequests * 2000, opusRequests * 1500);
    const savings = opusCost - sonnetCost;
    if (savings > 0) {
      suggestions.push({
        id: 'opt-1', currentModel: 'Claude Opus', suggestedModel: 'Claude Sonnet',
        savingsPercent: Math.round((savings / opusCost) * 100),
        savingsUsd: savings,
        reason: 'Sonnet handles most enterprise workloads with comparable quality at 80% lower cost.',
        workloadType: 'General Enterprise',
        riskDelta: 'same', qualityImpact: 'similar',
      });
    }
  }

  // Check if Sonnet is being used for simple FAQ-like tasks
  const sonnetUsage = history.filter(h => h.model === 'claude-sonnet');
  const sonnetCost = sonnetUsage.reduce((sum, h) => sum + h.costUsd, 0);
  if (sonnetCost > 50) {
    suggestions.push({
      id: 'opt-2', currentModel: 'Claude Sonnet', suggestedModel: 'Claude Haiku',
      savingsPercent: 48,
      savingsUsd: sonnetCost * 0.48,
      reason: 'Use Claude Haiku for FAQ, classification, and routing workloads to save 48% on token costs.',
      workloadType: 'FAQ / Classification',
      riskDelta: 'same', qualityImpact: 'slightly_lower',
    });
  }

  // Suggest batching
  const totalRequests = history.reduce((sum, h) => sum + h.requestCount, 0);
  if (totalRequests > 10000) {
    suggestions.push({
      id: 'opt-3', currentModel: 'All Models', suggestedModel: 'Batch API',
      savingsPercent: 50,
      savingsUsd: history.reduce((sum, h) => sum + h.costUsd, 0) * 0.5,
      reason: 'Anthropic Batch API offers 50% discount for non-time-sensitive workloads. Ideal for evaluation runs.',
      workloadType: 'Batch Processing',
      riskDelta: 'lower', qualityImpact: 'better',
    });
  }

  return suggestions;
}
