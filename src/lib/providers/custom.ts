import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Custom HTTP Provider — Connect any API endpoint
// ============================================================

const CUSTOM_API_URL = process.env.CUSTOM_LLM_URL || '';
const CUSTOM_API_KEY = process.env.CUSTOM_LLM_API_KEY || '';

export const customProvider: AIProvider = {
  name: 'custom',
  displayName: 'Custom Endpoint',

  isConfigured(): boolean {
    return CUSTOM_API_URL.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (CUSTOM_API_KEY) headers['Authorization'] = `Bearer ${CUSTOM_API_KEY}`;

    // Supports OpenAI-compatible API format (most common)
    const res = await fetch(CUSTOM_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1024,
        top_p: config?.topP ?? 1.0,
        ...(config?.stopSequences ? { stop: config.stopSequences } : {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Custom API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    // Try OpenAI format, then fall back to plain text
    const text = data.choices?.[0]?.message?.content
      || data.response
      || data.text
      || data.output
      || JSON.stringify(data);

    return {
      text,
      model: data.model || 'custom',
      provider: 'custom',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason || 'stop',
    };
  },

  async generateEmbedding(_text: string): Promise<number[]> {
    console.warn('Custom provider does not support embeddings. Use a dedicated provider.');
    return new Array(768).fill(0);
  },

  listModels(): string[] {
    return ['custom-endpoint'];
  },
};

registerProvider(customProvider);
