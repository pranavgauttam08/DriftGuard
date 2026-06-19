// ============================================================
// AI Providers — Unified interface for Claude, Gemini, OpenAI
// Handles connection testing, model queries, and pricing data.
// ============================================================

export type AIProvider = 'anthropic' | 'google' | 'openai';

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  inputCostPer1M: number;   // USD per 1M input tokens
  outputCostPer1M: number;  // USD per 1M output tokens
  maxContext: number;        // tokens
  tier: 'economy' | 'standard' | 'premium';
  capabilities: string[];
  bestFor: string[];
}

export interface QueryResult {
  response: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  model: string;
  provider: AIProvider;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: AIProvider;
  models: string[];
  error?: string;
}

// ── Model Database ───────────────────────────────────────────
export const MODEL_DATABASE: ModelInfo[] = [
  // Anthropic Claude
  {
    id: 'claude-haiku', name: 'Claude Haiku', provider: 'anthropic',
    inputCostPer1M: 0.25, outputCostPer1M: 1.25, maxContext: 200000,
    tier: 'economy', capabilities: ['fast', 'efficient', 'classification', 'routing'],
    bestFor: ['FAQ Bots', 'Classification', 'Simple Q&A', 'Data Extraction', 'Routing'],
  },
  {
    id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'anthropic',
    inputCostPer1M: 3.00, outputCostPer1M: 15.00, maxContext: 200000,
    tier: 'standard', capabilities: ['balanced', 'coding', 'analysis', 'writing', 'reasoning'],
    bestFor: ['Customer Support', 'Code Review', 'Content Writing', 'Sales Assistant', 'Email Automation'],
  },
  {
    id: 'claude-opus', name: 'Claude Opus', provider: 'anthropic',
    inputCostPer1M: 15.00, outputCostPer1M: 75.00, maxContext: 200000,
    tier: 'premium', capabilities: ['reasoning', 'complex-analysis', 'research', 'autonomous', 'multi-step'],
    bestFor: ['Research Agent', 'Legal Assistant', 'Healthcare', 'Architecture Agent', 'Multi-Agent Systems'],
  },
  // Google Gemini
  {
    id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'google',
    inputCostPer1M: 0.10, outputCostPer1M: 0.40, maxContext: 1000000,
    tier: 'economy', capabilities: ['fast', 'multimodal', 'efficient'],
    bestFor: ['FAQ Bots', 'Classification', 'Simple Tasks'],
  },
  {
    id: 'gemini-pro', name: 'Gemini 2.5 Pro', provider: 'google',
    inputCostPer1M: 1.25, outputCostPer1M: 10.00, maxContext: 1000000,
    tier: 'standard', capabilities: ['reasoning', 'coding', 'analysis', 'multimodal'],
    bestFor: ['Code Assistant', 'Analysis', 'Content Generation'],
  },
  // OpenAI
  {
    id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai',
    inputCostPer1M: 0.15, outputCostPer1M: 0.60, maxContext: 128000,
    tier: 'economy', capabilities: ['fast', 'efficient', 'versatile'],
    bestFor: ['FAQ Bots', 'Classification', 'Simple Tasks'],
  },
  {
    id: 'gpt-4o', name: 'GPT-4o', provider: 'openai',
    inputCostPer1M: 2.50, outputCostPer1M: 10.00, maxContext: 128000,
    tier: 'standard', capabilities: ['multimodal', 'reasoning', 'coding', 'analysis'],
    bestFor: ['Customer Support', 'Code Review', 'Content Writing'],
  },
  {
    id: 'o3', name: 'o3', provider: 'openai',
    inputCostPer1M: 10.00, outputCostPer1M: 40.00, maxContext: 200000,
    tier: 'premium', capabilities: ['deep-reasoning', 'research', 'complex-analysis', 'math'],
    bestFor: ['Research', 'Complex Analysis', 'Scientific Tasks'],
  },
];

// ── Cost Calculation ─────────────────────────────────────────
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = MODEL_DATABASE.find(m => m.id === modelId);
  if (!model) return 0;
  return (inputTokens / 1_000_000 * model.inputCostPer1M) + (outputTokens / 1_000_000 * model.outputCostPer1M);
}

// ── Provider API Endpoint Maps ───────────────────────────────
export const PROVIDER_CONFIG: Record<AIProvider, { name: string; testEndpoint: string; modelMap: Record<string, string> }> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    testEndpoint: '/api/ai/test',
    modelMap: {
      'claude-haiku': 'claude-sonnet-4-20250514',  // Using latest available
      'claude-sonnet': 'claude-sonnet-4-20250514',
      'claude-opus': 'claude-sonnet-4-20250514',
    },
  },
  google: {
    name: 'Google (Gemini)',
    testEndpoint: '/api/ai/test',
    modelMap: {
      'gemini-flash': 'gemini-2.0-flash',
      'gemini-pro': 'gemini-2.5-pro',
    },
  },
  openai: {
    name: 'OpenAI',
    testEndpoint: '/api/ai/test',
    modelMap: {
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4o': 'gpt-4o',
      'o3': 'o3',
    },
  },
};

// ── Get models for a provider ────────────────────────────────
export function getModelsForProvider(provider: AIProvider): ModelInfo[] {
  return MODEL_DATABASE.filter(m => m.provider === provider);
}

// ── Get Claude-specific models (for Model Advisor) ───────────
export function getClaudeModels(): ModelInfo[] {
  return MODEL_DATABASE.filter(m => m.provider === 'anthropic');
}

// ── Provider display info ────────────────────────────────────
export const PROVIDER_DISPLAY: Record<AIProvider, { name: string; color: string; icon: string }> = {
  anthropic: { name: 'Anthropic', color: '#D4A574', icon: '🟤' },
  google: { name: 'Google', color: '#4285F4', icon: '🔵' },
  openai: { name: 'OpenAI', color: '#10A37F', icon: '🟢' },
};
