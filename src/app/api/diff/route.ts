import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { endpointId, baseVersion, newVersion } = await request.json();
    if (!endpointId || !baseVersion || !newVersion) {
      return NextResponse.json({ error: 'endpointId, baseVersion, newVersion required' }, { status: 400 });
    }

    const { seedDiffs } = await import('@/lib/seed');
    const diff = seedDiffs.find(d => d.endpointId === endpointId && d.baseVersion === baseVersion && d.newVersion === newVersion);
    if (diff) return NextResponse.json({ diff });

    return NextResponse.json({ error: 'Diff not found' }, { status: 404 });
  } catch (error) {
    console.error('Diff error:', error);
    return NextResponse.json({ error: 'Failed to compute diff' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpointId = searchParams.get('endpointId');
  const { seedDiffs } = await import('@/lib/seed');
  const diffs = endpointId ? seedDiffs.filter(d => d.endpointId === endpointId) : seedDiffs;
  return NextResponse.json({ diffs });
}
