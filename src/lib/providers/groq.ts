import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Groq Provider — Ultra-fast inference
// ============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const groqProvider: AIProvider = {
  name: 'groq',
  displayName: 'Groq',

  isConfigured(): boolean {
    return GROQ_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = 'llama-3.1-8b-instant';

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
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

    if (!res.ok) throw new Error(`Groq API error: ${res.status} - ${await res.text()}`);
    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model,
      provider: 'groq',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  },

  async generateEmbedding(_text: string): Promise<number[]> {
    console.warn('Groq does not provide embeddings. Use Google or OpenAI.');
    return new Array(768).fill(0);
  },

  listModels(): string[] {
    return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  },
};

registerProvider(groqProvider);
