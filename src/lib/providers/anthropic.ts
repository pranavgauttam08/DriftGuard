import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Anthropic Provider
// ============================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export const anthropicProvider: AIProvider = {
  name: 'anthropic',
  displayName: 'Anthropic Claude',

  isConfigured(): boolean {
    return ANTHROPIC_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = 'claude-sonnet-4-20250514';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: config?.maxTokens ?? 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        top_p: config?.topP ?? 0.95,
        ...(config?.stopSequences ? { stop_sequences: config.stopSequences } : {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Anthropic API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    return {
      text: data.content?.[0]?.text || '',
      model,
      provider: 'anthropic',
      latencyMs: Date.now() - start,
      tokenCount: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      finishReason: data.stop_reason,
    };
  },

  async generateEmbedding(_text: string): Promise<number[]> {
    // Anthropic does not offer a native embedding API
    // Fall back to zero vector — the system should use a different provider for embeddings
    console.warn('Anthropic does not provide embeddings. Use Google or OpenAI for embedding generation.');
    return new Array(768).fill(0);
  },

  listModels(): string[] {
    return ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
  },
};

registerProvider(anthropicProvider);
