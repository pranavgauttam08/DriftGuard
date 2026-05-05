import { genAI } from './gemini';

export async function embedText(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding error:', error);
    // Return zero vector as fallback
    return new Array(768).fill(0);
  }
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  const batchSize = 20;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map(t => embedText(t)));
    results.push(...embeddings);
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function computeCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return new Array(768).fill(0);
  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += emb[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    centroid[i] /= embeddings.length;
  }
  return centroid;
}

export async function semanticEquivalenceScore(
  response1: string,
  response2: string
): Promise<number> {
  const [emb1, emb2] = await Promise.all([
    embedText(response1),
    embedText(response2),
  ]);
  return cosineSimilarity(emb1, emb2);
}
