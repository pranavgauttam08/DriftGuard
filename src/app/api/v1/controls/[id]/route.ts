// ============================================================
// app/api/v1/controls/[id]/route.ts
// PATCH  → update control status (rate-limited, audited)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { writeAuditLog } from '@/lib/audit';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: controlId } = await params;
    const body = await req.json();
    const { orgId, status, actorUserId, actorEmail, actorRole, oldStatus, controlName } = body;

    if (!orgId || !status || !controlId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Rate limit check (per org) ────────────────────────
    const { success, remaining, reset } = await checkRateLimit(`controls:${orgId}`);
    if (!success) {
      // Fire audit event for exceeded rate limit
      await writeAuditLog({
        orgId,
        actorUserId:  actorUserId ?? 'unknown',
        actorEmail:   actorEmail  ?? 'unknown',
        actorRole:    actorRole   ?? 'unknown',
        eventType:    'ratelimit.exceeded',
        resourceType: 'control',
        resourceId:   controlId,
        resourceName: controlName ?? controlId,
        request: req,
      });
      return rateLimitResponse(remaining, reset) as NextResponse;
    }

    // ── Fetch old value for audit log ─────────────────────
    const { data: existing } = await (supabaseAdmin as any)
      .from('controls')
      .select('status, control_name')
      .eq('id', controlId)
      .eq('org_id', orgId)
      .single();

    // ── Update status ─────────────────────────────────────
    const { error } = await (supabaseAdmin as any)
      .from('controls')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', controlId)
      .eq('org_id', orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Write audit log ───────────────────────────────────
    await writeAuditLog({
      orgId,
      actorUserId:  actorUserId  ?? 'unknown',
      actorEmail:   actorEmail   ?? 'unknown',
      actorRole:    actorRole    ?? 'unknown',
      eventType:    'control.status_changed',
      resourceType: 'control',
      resourceId:   controlId,
      resourceName: existing?.control_name ?? controlId,
      oldValue:     { status: oldStatus ?? existing?.status },
      newValue:     { status },
      request: req,
    });

    return NextResponse.json({ ok: true, remaining });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
