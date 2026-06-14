import { AIProvider, ModelConfig, ProviderResponse, registerProvider } from './index';

// ============================================================
// Azure OpenAI Provider
// ============================================================

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-06-01';

export const azureOpenaiProvider: AIProvider = {
  name: 'azure-openai',
  displayName: 'Azure OpenAI',

  isConfigured(): boolean {
    return AZURE_OPENAI_ENDPOINT.length > 0 && AZURE_OPENAI_KEY.length > 0;
  },

  async generateResponse(prompt: string, config?: ModelConfig): Promise<ProviderResponse> {
    const start = Date.now();

    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: config?.temperature ?? 0.7,
        max_tokens: config?.maxTokens ?? 1024,
        top_p: config?.topP ?? 1.0,
        frequency_penalty: config?.frequencyPenalty ?? 0,
        presence_penalty: config?.presencePenalty ?? 0,
        ...(config?.stopSequences ? { stop: config.stopSequences } : {}),
      }),
    });

    if (!res.ok) throw new Error(`Azure OpenAI error: ${res.status} - ${await res.text()}`);
    const data = await res.json();

    return {
      text: data.choices?.[0]?.message?.content || '',
      model: AZURE_OPENAI_DEPLOYMENT,
      provider: 'azure-openai',
      latencyMs: Date.now() - start,
      tokenCount: data.usage?.total_tokens,
      finishReason: data.choices?.[0]?.finish_reason,
    };
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) throw new Error(`Azure OpenAI embedding error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.embedding || new Array(1536).fill(0);
  },

  listModels(): string[] {
    return [AZURE_OPENAI_DEPLOYMENT];
  },
};

registerProvider(azureOpenaiProvider);
