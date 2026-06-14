import { v4 as uuidv4 } from 'uuid';
import {
  AlertType, AlertSeverity, AlertChannel, AlertEvent, AlertDelivery,
  AlertThresholds, DEFAULT_THRESHOLDS, ChannelType,
} from '@/types/alert-config';
import { getTenantSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendSlackAlert } from './slack';
import { sendTeamsAlert } from './teams';
import { sendDiscordAlert } from './discord';
import { sendWebhookAlert } from './webhook';
import { sendEmailAlert } from './email';

// ============================================================
// Alert Dispatcher — Central alert routing engine
// ============================================================

export interface DispatchResult {
  eventId: string;
  deliveries: AlertDelivery[];
  totalChannels: number;
  delivered: number;
  failed: number;
}

/**
 * Fire an alert — routes to all matching channels for the org.
 */
export async function fireAlert(
  orgId: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  metadata: Record<string, any> = {},
  options: { projectId?: string; endpointId?: string } = {}
): Promise<DispatchResult> {
  // ── 1. Get matching channels ──────────────────────────
  const channels = await getMatchingChannels(orgId, type, severity);

  // ── 2. Create alert event ─────────────────────────────
  const event: AlertEvent = {
    id: uuidv4(),
    orgId,
    projectId: options.projectId,
    endpointId: options.endpointId,
    type,
    severity,
    title,
    message,
    metadata,
    deliveries: [],
    createdAt: new Date(),
  };

  // ── 3. Dispatch to each channel ───────────────────────
  const deliveries: AlertDelivery[] = [];

  for (const channel of channels) {
    const delivery = await deliverToChannel(channel, event);
    deliveries.push(delivery);
  }

  event.deliveries = deliveries;

  // ── 4. Persist event ──────────────────────────────────
  await persistAlertEvent(event);

  return {
    eventId: event.id,
    deliveries,
    totalChannels: channels.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
  };
}

/**
 * Deliver alert to a single channel.
 */
async function deliverToChannel(channel: AlertChannel, event: AlertEvent): Promise<AlertDelivery> {
  const delivery: AlertDelivery = {
    channelId: channel.id,
    channelName: channel.name,
    channelType: channel.type,
    status: 'pending',
    retryCount: 0,
  };

  try {
    switch (channel.type) {
      case 'slack':
        await sendSlackAlert(channel, event);
        break;
      case 'teams':
        await sendTeamsAlert(channel, event);
        break;
      case 'discord':
        await sendDiscordAlert(channel, event);
        break;
      case 'webhook':
        await sendWebhookAlert(channel, event);
        break;
      case 'email':
        await sendEmailAlert(channel, event);
        break;
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();

    // Update channel last delivered
    await updateChannelDelivery(channel.id, true);
  } catch (error: any) {
    delivery.status = 'failed';
    delivery.error = error.message || 'Unknown delivery error';

    // Track failure count
    await updateChannelDelivery(channel.id, false);
    console.error(`Alert delivery failed for channel ${channel.name}:`, error.message);
  }

  return delivery;
}

/**
 * Get channels that match this alert type and severity.
 */
async function getMatchingChannels(orgId: string, type: AlertType, severity: AlertSeverity): Promise<AlertChannel[]> {
  if (!isSupabaseConfigured()) {
    return getDemoChannels(orgId, type, severity);
  }

  const supabase = getTenantSupabase('system', orgId);
  const { data } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('org_id', orgId)
    .eq('enabled', true)
    .contains('alert_types', [type]);

  if (!data) return [];

  const severityOrder: Record<AlertSeverity, number> = { info: 0, warning: 1, critical: 2 };
  return data
    .filter((ch: any) => severityOrder[severity] >= severityOrder[ch.min_severity as AlertSeverity])
    .map(rowToChannel);
}

/**
 * Get or create alert thresholds for a project.
 */
export async function getThresholds(orgId: string, projectId?: string): Promise<AlertThresholds> {
  if (!isSupabaseConfigured()) {
    return {
      id: 'default',
      orgId,
      projectId,
      ...DEFAULT_THRESHOLDS,
      updatedAt: new Date(),
    };
  }

  const supabase = getTenantSupabase('system', orgId);
  const query = supabase.from('alert_thresholds').select('*').eq('org_id', orgId);

  if (projectId) {
    query.eq('project_id', projectId);
  } else {
    query.is('project_id', null);
  }

  const { data } = await query.single();

  if (data) {
    return {
      id: data.id,
      orgId: data.org_id,
      projectId: data.project_id,
      hallucinationWarn: data.hallucination_warn,
      hallucinationBlock: data.hallucination_block,
      latencyWarnMs: data.latency_warn_ms,
      toneShiftWarn: data.tone_shift_warn,
      similarityBlock: data.similarity_block,
      refusalSpikeWarn: data.refusal_spike_warn,
      probeFailureBlock: data.probe_failure_block,
      updatedAt: new Date(data.updated_at),
    };
  }

  return { id: 'default', orgId, projectId, ...DEFAULT_THRESHOLDS, updatedAt: new Date() };
}

/**
 * Update alert thresholds.
 */
export async function updateThresholds(
  orgId: string,
  thresholds: Partial<Omit<AlertThresholds, 'id' | 'orgId' | 'updatedAt'>>,
  projectId?: string
): Promise<AlertThresholds> {
  const current = await getThresholds(orgId, projectId);
  const updated = { ...current, ...thresholds, updatedAt: new Date() };

  if (isSupabaseConfigured()) {
    const supabase = getTenantSupabase('system', orgId);
    await supabase.from('alert_thresholds').upsert({
      id: updated.id === 'default' ? uuidv4() : updated.id,
      org_id: orgId,
      project_id: projectId || null,
      hallucination_warn: updated.hallucinationWarn,
      hallucination_block: updated.hallucinationBlock,
      latency_warn_ms: updated.latencyWarnMs,
      tone_shift_warn: updated.toneShiftWarn,
      similarity_block: updated.similarityBlock,
      refusal_spike_warn: updated.refusalSpikeWarn,
      probe_failure_block: updated.probeFailureBlock,
      updated_at: updated.updatedAt.toISOString(),
    });
  }

  return updated;
}

/**
 * List alert history for an org.
 */
export async function listAlertEvents(
  orgId: string,
  options: { type?: AlertType; severity?: AlertSeverity; limit?: number; offset?: number } = {}
): Promise<{ events: AlertEvent[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { events: getDemoAlertEvents(orgId), total: 3 };
  }

  const { limit = 25, offset = 0 } = options;
  const supabase = getTenantSupabase('system', orgId);
  let query = supabase.from('alert_events').select('*', { count: 'exact' }).eq('org_id', orgId);

  if (options.type) query = query.eq('type', options.type);
  if (options.severity) query = query.eq('severity', options.severity);

  const { data, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  return {
    events: (data || []).map(rowToAlertEvent),
    total: count || 0,
  };
}

/**
 * Acknowledge an alert.
 */
export async function acknowledgeAlert(eventId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase(userId, '');
  await supabase.from('alert_events').update({
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId,
  }).eq('id', eventId);
}

/**
 * Manage alert channels — CRUD.
 */
export async function createChannel(channel: Omit<AlertChannel, 'id' | 'createdAt' | 'updatedAt' | 'lastDeliveredAt' | 'failureCount'>): Promise<AlertChannel> {
  const newChannel: AlertChannel = {
    ...channel,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    failureCount: 0,
  };

  if (isSupabaseConfigured()) {
    const supabase = getTenantSupabase('system', channel.orgId);
    await supabase.from('alert_channels').insert({
      id: newChannel.id,
      org_id: newChannel.orgId,
      type: newChannel.type,
      name: newChannel.name,
      config: newChannel.config,
      alert_types: newChannel.alertTypes,
      min_severity: newChannel.minSeverity,
      enabled: newChannel.enabled,
      created_at: newChannel.createdAt.toISOString(),
      updated_at: newChannel.updatedAt.toISOString(),
      failure_count: 0,
    });
  }

  return newChannel;
}

export async function listChannels(orgId: string): Promise<AlertChannel[]> {
  if (!isSupabaseConfigured()) return getDemoChannels(orgId);

  const supabase = getTenantSupabase('system', orgId);
  const { data } = await supabase.from('alert_channels').select('*').eq('org_id', orgId).order('created_at', { ascending: true });
  return (data || []).map(rowToChannel);
}

export async function deleteChannel(channelId: string, orgId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase('system', orgId);
  await supabase.from('alert_channels').delete().eq('id', channelId);
}

export async function toggleChannel(channelId: string, enabled: boolean, orgId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase('system', orgId);
  await supabase.from('alert_channels').update({ enabled, updated_at: new Date().toISOString() }).eq('id', channelId);
}

// ── Helpers ──────────────────────────────────────────────

async function persistAlertEvent(event: AlertEvent): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase('system', event.orgId);
  await supabase.from('alert_events').insert({
    id: event.id,
    org_id: event.orgId,
    project_id: event.projectId || null,
    endpoint_id: event.endpointId || null,
    type: event.type,
    severity: event.severity,
    title: event.title,
    message: event.message,
    metadata: event.metadata,
    deliveries: event.deliveries,
    created_at: event.createdAt.toISOString(),
  });
}

async function updateChannelDelivery(channelId: string, success: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getTenantSupabase('system', '');
  if (success) {
    await supabase.from('alert_channels').update({
      last_delivered_at: new Date().toISOString(),
      failure_count: 0,
    }).eq('id', channelId);
  } else {
    await supabase.rpc('increment_channel_failure', { channel_id: channelId });
  }
}

function rowToChannel(row: any): AlertChannel {
  return {
    id: row.id, orgId: row.org_id, type: row.type, name: row.name,
    config: row.config, alertTypes: row.alert_types, minSeverity: row.min_severity,
    enabled: row.enabled, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    lastDeliveredAt: row.last_delivered_at ? new Date(row.last_delivered_at) : undefined,
    failureCount: row.failure_count || 0,
  };
}

function rowToAlertEvent(row: any): AlertEvent {
  return {
    id: row.id, orgId: row.org_id, projectId: row.project_id, endpointId: row.endpoint_id,
    type: row.type, severity: row.severity, title: row.title, message: row.message,
    metadata: row.metadata, deliveries: row.deliveries || [],
    createdAt: new Date(row.created_at),
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    acknowledgedBy: row.acknowledged_by,
  };
}

// ── Demo data ────────────────────────────────────────────

function getDemoChannels(orgId: string, _type?: AlertType, _severity?: AlertSeverity): AlertChannel[] {
  return [
    {
      id: 'ch-slack', orgId, type: 'slack', name: '#driftguard-alerts',
      config: { type: 'slack' as const, webhookUrl: 'https://hooks.slack.com/...', channel: '#driftguard-alerts' },
      alertTypes: ['behavioral_drift', 'deployment_block', 'hallucination_spike', 'probe_failure'],
      minSeverity: 'warning', enabled: true, createdAt: new Date(), updatedAt: new Date(), failureCount: 0,
    },
    {
      id: 'ch-email', orgId, type: 'email', name: 'Engineering Team',
      config: { type: 'email' as const, recipients: ['team@company.com'] },
      alertTypes: ['deployment_block', 'security_event', 'api_key_expired'],
      minSeverity: 'critical', enabled: true, createdAt: new Date(), updatedAt: new Date(), failureCount: 0,
    },
  ];
}

function getDemoAlertEvents(orgId: string): AlertEvent[] {
  return [
    {
      id: 'evt-1', orgId, type: 'deployment_block', severity: 'critical',
      title: 'Deployment Blocked: content-gen v3.0.0',
      message: 'Hallucination score exceeded threshold (0.33 > 0.20). Deployment to staging blocked.',
      metadata: { endpointId: 'content-gen', version: 'v3.0.0', dimension: 'Hallucination Score', value: 0.33, threshold: 0.20 },
      deliveries: [{ channelId: 'ch-slack', channelName: '#driftguard-alerts', channelType: 'slack', status: 'delivered', deliveredAt: new Date(Date.now() - 48 * 60 * 60 * 1000), retryCount: 0 }],
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      id: 'evt-2', orgId, type: 'review_requested', severity: 'warning',
      title: 'Review Required: support-bot v1.3.0',
      message: 'Behavioral diff verdict: WARN. Empathetic Tone regressed by 12%.',
      metadata: { endpointId: 'support-bot', version: 'v1.3.0', verdict: 'WARN' },
      deliveries: [{ channelId: 'ch-slack', channelName: '#driftguard-alerts', channelType: 'slack', status: 'delivered', deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), retryCount: 0 }],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'evt-3', orgId, type: 'deployment_approved', severity: 'info',
      title: 'Deployment Approved: code-assistant v2.1.0',
      message: 'Auto-approved deployment to production. All behavioral gates passed.',
      metadata: { endpointId: 'code-assistant', version: 'v2.1.0', verdict: 'PASS' },
      deliveries: [],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];
}
