import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// OpenRouter Provider — Access 200+ models through one API
// ============================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export const openrouterProvider: AIProvider = {
  name: 'openrouter',
  displayName: 'OpenRouter',

  isConfigured(): boolean {
    return OPENROUTER_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://driftguard.dev',
        'X-Title': 'DriftGuard',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1024,
        top_p: config?.topP ?? 1.0,
        ...(config?.stopSequences ? { stop: config.stopSequences } : {}),
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter error: ${res.status} - ${await res.text()}`);
    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'openrouter',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  },

  async generateEmbedding(_text: string): Promise<number[]> {
    console.warn('OpenRouter does not support embeddings. Use a dedicated provider.');
    return new Array(768).fill(0);
  },

  listModels(): string[] {
    return [
      'anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-2.0-flash',
      'meta-llama/llama-3.1-405b', 'mistralai/mistral-large',
    ];
  },
};

registerProvider(openrouterProvider);
