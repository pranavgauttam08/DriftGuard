import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Ollama Provider — Local LLM inference
// ============================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export const ollamaProvider: AIProvider = {
  name: 'ollama',
  displayName: 'Ollama (Local)',

  isConfigured(): boolean {
    return !!process.env.OLLAMA_BASE_URL || !!process.env.OLLAMA_ENABLED;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();
    const model = process.env.OLLAMA_MODEL || 'llama3.1';

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: config?.temperature ?? 0.7,
          num_predict: config?.maxTokens ?? 1024,
          top_p: config?.topP ?? 0.95,
          ...(config?.stopSequences ? { stop: config.stopSequences } : {}),
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Ollama error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();

    return {
      text: data.response || '',
      model,
      provider: 'ollama',
      latencyMs: Date.now() - start,
      tokenCount: data.eval_count,
      finishReason: 'stop',
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

    const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text }),
    });

    if (!res.ok) throw new Error(`Ollama embedding error: ${res.status}`);
    const data = await res.json();
    return data.embeddings?.[0] || new Array(768).fill(0);
  },

  listModels(): string[] {
    return ['llama3.1', 'llama3.1:70b', 'mistral', 'codellama', 'phi3'];
  },
};

registerProvider(ollamaProvider);
