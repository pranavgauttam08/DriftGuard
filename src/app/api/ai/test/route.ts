import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai/test — Test an AI provider connection
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ success: false, error: 'Provider and API key are required' }, { status: 400 });
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
        }),
      });

      if (res.ok) {
        return NextResponse.json({
          success: true,
          provider: 'anthropic',
          models: ['claude-haiku', 'claude-sonnet', 'claude-opus'],
        });
      } else {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          error: (err as any)?.error?.message || `HTTP ${res.status}`,
        });
      }
    }

    if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (res.ok) {
        return NextResponse.json({
          success: true,
          provider: 'google',
          models: ['gemini-flash', 'gemini-pro'],
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `HTTP ${res.status} — Invalid API key`,
        });
      }
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        return NextResponse.json({
          success: true,
          provider: 'openai',
          models: ['gpt-4o-mini', 'gpt-4o', 'o3'],
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `HTTP ${res.status} — Invalid API key`,
        });
      }
    }

    return NextResponse.json({ success: false, error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Connection failed' }, { status: 500 });
  }
}
