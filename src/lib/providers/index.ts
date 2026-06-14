// ============================================================
// AI Provider Interface — Model-Agnostic Foundation
// Every provider implements this contract.
// ============================================================

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface ProviderResponse {
  text: string;
  model: string;
  provider: string;
  latencyMs: number;
  tokenCount?: number;
  finishReason?: string;
}

export interface AIProvider {
  /** Provider identifier (e.g., 'google', 'openai', 'anthropic') */
  name: string;
  /** Display name for UI */
  displayName: string;
  /** Whether this provider is currently configured (has API key) */
  isConfigured(): boolean;
  /** Generate a text response */
  generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse>;
  /** Generate an embedding vector */
  generateEmbedding(text: string): Promise<number[]>;
  /** List available models */
  listModels(): string[];
}

// ── Provider Registry ────────────────────────────────────

const providers = new Map<string, AIProvider>();

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): AIProvider | undefined {
  return providers.get(name);
}

export function getDefaultProvider(): AIProvider {
  // Priority: google > openai > anthropic > first available
  const priority = ['google', 'openai', 'anthropic'];
  for (const name of priority) {
    const provider = providers.get(name);
    if (provider?.isConfigured()) return provider;
  }
  // Return first configured provider
  for (const provider of providers.values()) {
    if (provider.isConfigured()) return provider;
  }
  // Fallback to Google (even unconfigured, it has graceful error handling)
  return providers.get('google') || createUnconfiguredProvider();
}

export function listProviders(): AIProvider[] {
  return Array.from(providers.values());
}

export function listConfiguredProviders(): AIProvider[] {
  return Array.from(providers.values()).filter(p => p.isConfigured());
}

function createUnconfiguredProvider(): AIProvider {
  return {
    name: 'none',
    displayName: 'No Provider Configured',
    isConfigured: () => false,
    generateResponse: async () => ({ text: 'No AI provider configured', model: 'none', provider: 'none', latencyMs: 0 }),
    generateEmbedding: async () => new Array(768).fill(0),
    listModels: () => [],
  };
}
