// ============================================================
// lib/audit.ts — Immutable audit log writer (server-side only)
// Uses the service role key so RLS cannot block writes.
// ============================================================

import { supabaseAdmin } from '@/lib/supabase';

export interface AuditLogPayload {
  orgId: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  request?: Pick<Request, 'headers'> | null;
}

/**
 * Write a single immutable record to the audit_logs table.
 * This function is intentionally fire-and-forget (void return) —
 * audit write failures must never block the main user action.
 */
export async function writeAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    const ip =
      (payload.request?.headers as any)?.get?.('x-forwarded-for') ?? 'unknown';
    const ua =
      (payload.request?.headers as any)?.get?.('user-agent') ?? 'unknown';

    const { error } = await (supabaseAdmin as any)
      .from('audit_logs')
      .insert({
        org_id:        payload.orgId,
        actor_user_id: payload.actorUserId,
        actor_email:   payload.actorEmail,
        actor_role:    payload.actorRole,
        event_type:    payload.eventType,
        resource_type: payload.resourceType,
        resource_id:   payload.resourceId,
        resource_name: payload.resourceName,
        old_value:     payload.oldValue ?? null,
        new_value:     payload.newValue ?? null,
        ip_address:    ip,
        user_agent:    ua,
      });

    if (error) {
      // Log to server console but never throw — audit must not block business logic
      console.error('[AuditLog] Failed to write:', error.message);
    }
  } catch (err) {
    console.error('[AuditLog] Unexpected error:', err);
  }
}

/**
 * Convenience: write a control status change audit record.
 */
export async function auditControlStatusChanged(
  orgId: string,
  actorUserId: string,
  actorEmail: string,
  actorRole: string,
  controlId: string,
  controlName: string,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  return writeAuditLog({
    orgId,
    actorUserId,
    actorEmail,
    actorRole,
    eventType:    'control.status_changed',
    resourceType: 'control',
    resourceId:   controlId,
    resourceName: controlName,
    oldValue:     { status: oldStatus },
    newValue:     { status: newStatus },
  });
}

/**
 * Convenience: write a user login audit record.
 */
export async function auditUserLogin(
  orgId: string,
  actorUserId: string,
  actorEmail: string,
  actorRole: string,
  request?: Pick<Request, 'headers'> | null,
): Promise<void> {
  return writeAuditLog({
    orgId,
    actorUserId,
    actorEmail,
    actorRole,
    eventType:    'user.login',
    resourceType: 'session',
    resourceId:   actorUserId,
    resourceName: actorEmail,
    request,
  });
}
