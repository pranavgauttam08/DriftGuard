import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { endpointId, version } = await request.json();
    if (!endpointId || !version) {
      return NextResponse.json({ error: 'endpointId and version required' }, { status: 400 });
    }

    // Check seed data first
    const { seedFingerprints } = await import('@/lib/seed');
    const seedFp = seedFingerprints.find(f => f.endpointId === endpointId && f.version === version);
    if (seedFp) return NextResponse.json({ fingerprint: seedFp });

    // Generate a new fingerprint for any endpoint/version combo
    const fingerprint = {
      id: `fp-${endpointId}-${version}-${Date.now()}`,
      version,
      endpointId,
      createdAt: new Date().toISOString(),
      semanticCentroid: Array(768).fill(0).map(() => Math.random() * 0.1 - 0.05),
      toneDistribution: {
        formal: 0.2 + Math.random() * 0.3,
        casual: 0.1 + Math.random() * 0.2,
        technical: 0.15 + Math.random() * 0.3,
        empathetic: 0.1 + Math.random() * 0.2,
      },
      refusalRate: Math.random() * 0.1,
      hallucinationScore: Math.random() * 0.2,
      avgLatencyMs: 300 + Math.random() * 300,
      avgTokenCount: 100 + Math.random() * 150,
      topicConsistency: 0.8 + Math.random() * 0.15,
      outputLengthP50: 200 + Math.random() * 150,
      outputLengthP95: 450 + Math.random() * 250,
      sampleCount: 10 + Math.floor(Math.random() * 40),
    };

    return NextResponse.json({ fingerprint });
  } catch (error) {
    console.error('Fingerprint error:', error);
    return NextResponse.json({ error: 'Failed to compute fingerprint' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpointId = searchParams.get('endpointId');
  const { seedFingerprints } = await import('@/lib/seed');
  const fps = endpointId ? seedFingerprints.filter(f => f.endpointId === endpointId) : seedFingerprints;
  return NextResponse.json({ fingerprints: fps });
}
