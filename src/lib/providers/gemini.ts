import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Google Gemini Provider
// ============================================================

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export const geminiProvider: AIProvider = {
  name: 'google',
  displayName: 'Google Gemini',

  isConfigured(): boolean {
    return GEMINI_API_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = 'gemini-2.0-flash';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: config?.temperature ?? 0.7,
            maxOutputTokens: config?.maxTokens ?? 1024,
            topP: config?.topP ?? 0.95,
            ...(config?.stopSequences ? { stopSequences: config.stopSequences } : {}),
          },
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      text,
      model,
      provider: 'google',
      latencyMs: Date.now() - start,
      tokenCount: data.usageMetadata?.totalTokenCount,
      finishReason: data.candidates?.[0]?.finishReason,
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini embedding error: ${res.status}`);
    const data = await res.json();
    return data.embedding?.values || new Array(768).fill(0);
  },

  listModels(): string[] {
    return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  },
};

// Auto-register
registerProvider(geminiProvider);
