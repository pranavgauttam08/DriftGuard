import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Mistral Provider
// ============================================================

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

export const mistralProvider: AIProvider = {
  name: 'mistral',
  displayName: 'Mistral AI',

  isConfigured(): boolean {
    return MISTRAL_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = 'mistral-small-latest';

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1024,
        top_p: config?.topP ?? 1.0,
      }),
    });

    if (!res.ok) throw new Error(`Mistral API error: ${res.status} - ${await res.text()}`);
    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'mistral',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({ model: 'mistral-embed', input: [text] }),
    });

    if (!res.ok) throw new Error(`Mistral embedding error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.embedding || new Array(1024).fill(0);
  },

  listModels(): string[] {
    return ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'mistral-embed'];
  },
};

registerProvider(mistralProvider);
