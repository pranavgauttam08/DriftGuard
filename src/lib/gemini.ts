import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
export const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await geminiFlash.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (
        lastError.message.includes('429') ||
        lastError.message.includes('RESOURCE_EXHAUSTED') ||
        lastError.message.includes('rate')
      ) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

export async function streamGenerate(
  prompt: string
): Promise<AsyncIterable<string>> {
  const result = await geminiFlash.generateContentStream(prompt);
  return (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  })();
}

export { genAI };
