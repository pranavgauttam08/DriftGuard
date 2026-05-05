import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { query, response1, response2 } = await request.json();
    if (!query || !response1 || !response2) {
      return NextResponse.json({ error: 'query, response1, response2 required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ equivalenceScore: 0.85, explanation: 'API key not configured — returning mock evaluation.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Compare these two AI responses to the same query and provide analysis:

Query: "${query}"
Response A: "${response1.slice(0, 500)}"
Response B: "${response2.slice(0, 500)}"

Return JSON with:
- equivalenceScore: 0.0-1.0 semantic similarity
- toneComparison: brief comparison of tone
- explanation: 2 sentences explaining behavioral differences

Return ONLY valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json\s*/gi, '').replace(/```/g, '');
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ equivalenceScore: 0.5, explanation: 'Evaluation failed' }, { status: 500 });
  }
}
