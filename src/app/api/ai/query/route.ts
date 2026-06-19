import { NextRequest, NextResponse } from 'next/server';
import { calculateCost } from '@/lib/ai-providers';

// POST /api/ai/query — Query an AI model and return response + metrics
export async function POST(req: NextRequest) {
  try {
    const { provider, model, messages, apiKey, systemPrompt } = await req.json();

    if (!provider || !model || !apiKey || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const startTime = Date.now();

    // ── Anthropic ────────────────────────────────────────────
    if (provider === 'anthropic') {
      const modelMap: Record<string, string> = {
        'claude-haiku': 'claude-sonnet-4-20250514',
        'claude-sonnet': 'claude-sonnet-4-20250514',
        'claude-opus': 'claude-sonnet-4-20250514',
      };
      const apiModel = modelMap[model] || model;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: apiModel,
          max_tokens: 1024,
          system: systemPrompt || undefined,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ error: (err as any)?.error?.message || `HTTP ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const responseText = data.content?.[0]?.text || '';
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const costUsd = calculateCost(model, inputTokens, outputTokens);

      return NextResponse.json({
        response: responseText,
        inputTokens,
        outputTokens,
        latencyMs,
        costUsd,
        model,
        provider: 'anthropic',
      });
    }

    // ── Google Gemini ─────────────────────────────────────────
    if (provider === 'google') {
      const modelMap: Record<string, string> = {
        'gemini-flash': 'gemini-2.0-flash',
        'gemini-pro': 'gemini-2.5-pro',
      };
      const apiModel = modelMap[model] || model;

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          }),
        }
      );

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return NextResponse.json({ error: `Gemini API error: HTTP ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = data.usageMetadata || {};
      const inputTokens = usage.promptTokenCount || 0;
      const outputTokens = usage.candidatesTokenCount || 0;
      const costUsd = calculateCost(model, inputTokens, outputTokens);

      return NextResponse.json({
        response: responseText,
        inputTokens,
        outputTokens,
        latencyMs,
        costUsd,
        model,
        provider: 'google',
      });
    }

    // ── OpenAI ────────────────────────────────────────────────
    if (provider === 'openai') {
      const apiModel = model;
      const apiMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModel,
          messages: apiMessages,
          max_tokens: 1024,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ error: (err as any)?.error?.message || `HTTP ${res.status}` }, { status: res.status });
      }

      const data = await res.json();
      const responseText = data.choices?.[0]?.message?.content || '';
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const costUsd = calculateCost(model, inputTokens, outputTokens);

      return NextResponse.json({
        response: responseText,
        inputTokens,
        outputTokens,
        latencyMs,
        costUsd,
        model,
        provider: 'openai',
      });
    }

    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Query failed' }, { status: 500 });
  }
}
