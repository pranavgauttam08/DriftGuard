// app/api/v1/audit/route.ts — Server-side audit log writer
// Uses service role key — bypasses RLS to ensure logs can never be blocked.
import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orgId, actorUserId, actorEmail, actorRole,
      eventType, resourceType, resourceId, resourceName,
      oldValue, newValue,
    } = body;

    if (!orgId || !actorUserId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await writeAuditLog({
      orgId,
      actorUserId,
      actorEmail,
      actorRole,
      eventType,
      resourceType,
      resourceId,
      resourceName,
      oldValue,
      newValue,
      request: req,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[API /audit]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
