import { v4 as uuidv4 } from 'uuid';
import { getTenantSupabase, isSupabaseConfigured } from '@/lib/supabase';

// ============================================================
// Audit Logging — Every mutating action is recorded
// ============================================================

export type AuditAction =
  | 'org.created' | 'org.updated' | 'org.deleted'
  | 'project.created' | 'project.updated' | 'project.deleted'
  | 'endpoint.created' | 'endpoint.deleted'
  | 'deployment.created' | 'deployment.approved' | 'deployment.rejected' | 'deployment.rolled_back'
  | 'review.created' | 'review.approved' | 'review.rejected' | 'review.changes_requested'
  | 'api_key.created' | 'api_key.revoked' | 'api_key.rotated'
  | 'alert_channel.created' | 'alert_channel.deleted' | 'alert_channel.toggled'
  | 'thresholds.updated'
  | 'member.invited' | 'member.removed' | 'member.role_changed'
  | 'data.ingested' | 'data.deleted' | 'data.exported'
  | 'settings.updated'
  | 'security.pii_detected' | 'security.access_denied';

export type ResourceType =
  | 'org' | 'project' | 'endpoint' | 'deployment' | 'review'
  | 'api_key' | 'alert_channel' | 'member' | 'data' | 'settings';

export interface AuditEntry {
  id: string;
  orgId: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Write an audit log entry.
 */
export async function writeAuditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
  const auditEntry: AuditEntry = {
    ...entry,
    id: uuidv4(),
    timestamp: new Date(),
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${auditEntry.action} | ${auditEntry.resourceType}:${auditEntry.resourceId} | user:${auditEntry.userId}`);
  }

  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase(entry.userId, entry.orgId);
  await supabase.from('audit_logs').insert({
    id: auditEntry.id,
    org_id: auditEntry.orgId,
    user_id: auditEntry.userId,
    action: auditEntry.action,
    resource_type: auditEntry.resourceType,
    resource_id: auditEntry.resourceId,
    details: auditEntry.details,
    ip_address: auditEntry.ipAddress || null,
    user_agent: auditEntry.userAgent || null,
    timestamp: auditEntry.timestamp.toISOString(),
  });
}

/**
 * Query audit logs with filters.
 */
export async function queryAuditLogs(
  orgId: string,
  options: {
    userId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ entries: AuditEntry[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { entries: getDemoAuditEntries(orgId), total: 5 };
  }

  const { limit = 50, offset = 0 } = options;
  const supabase = getTenantSupabase('system', orgId);
  let query = supabase.from('audit_logs').select('*', { count: 'exact' }).eq('org_id', orgId);

  if (options.userId) query = query.eq('user_id', options.userId);
  if (options.action) query = query.eq('action', options.action);
  if (options.resourceType) query = query.eq('resource_type', options.resourceType);
  if (options.resourceId) query = query.eq('resource_id', options.resourceId);
  if (options.startDate) query = query.gte('timestamp', options.startDate.toISOString());
  if (options.endDate) query = query.lte('timestamp', options.endDate.toISOString());

  const { data, count } = await query
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    entries: (data || []).map((row: any) => ({
      id: row.id,
      orgId: row.org_id,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: row.details || {},
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: new Date(row.timestamp),
    })),
    total: count || 0,
  };
}

/**
 * Export audit logs as JSON for compliance reporting.
 */
export async function exportAuditLogs(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<AuditEntry[]> {
  const allEntries: AuditEntry[] = [];
  let offset = 0;
  const batchSize = 100;

  while (true) {
    const { entries } = await queryAuditLogs(orgId, { startDate, endDate, limit: batchSize, offset });
    allEntries.push(...entries);
    if (entries.length < batchSize) break;
    offset += batchSize;
  }

  return allEntries;
}

// ── Demo data ────────────────────────────────────────────

function getDemoAuditEntries(orgId: string): AuditEntry[] {
  return [
    { id: 'audit-1', orgId, userId: 'dev@company.com', action: 'deployment.created', resourceType: 'deployment', resourceId: 'dep-001', details: { version: 'v1.3.0', endpoint: 'support-bot' }, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 'audit-2', orgId, userId: 'system', action: 'review.created', resourceType: 'review', resourceId: 'rev-001', details: { verdict: 'WARN', autoAssigned: true }, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: 'audit-3', orgId, userId: 'reviewer@company.com', action: 'deployment.rejected', resourceType: 'deployment', resourceId: 'dep-003', details: { reason: 'Hallucination exceeded threshold' }, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    { id: 'audit-4', orgId, userId: 'admin@company.com', action: 'api_key.created', resourceType: 'api_key', resourceId: 'key-001', details: { name: 'Production Ingest', scopes: ['ingest'] }, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    { id: 'audit-5', orgId, userId: 'admin@company.com', action: 'member.invited', resourceType: 'member', resourceId: 'dev@company.com', details: { role: 'developer' }, timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000) },
  ];
}
