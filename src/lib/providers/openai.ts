import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// OpenAI Provider
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export const openaiProvider: AIProvider = {
  name: 'openai',
  displayName: 'OpenAI',

  isConfigured(): boolean {
    return OPENAI_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = 'gpt-4o-mini';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1024,
        top_p: config?.topP ?? 1.0,
        frequency_penalty: config?.frequencyPenalty ?? 0,
        presence_penalty: config?.presencePenalty ?? 0,
        ...(config?.stopSequences ? { stop: config.stopSequences } : {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'openai',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI embedding error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.embedding || new Array(1536).fill(0);
  },

  listModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'];
  },
};

registerProvider(openaiProvider);
