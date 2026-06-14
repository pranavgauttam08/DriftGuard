// ============================================================
// Alert Configuration Types
// Enterprise alerting and notification system
// ============================================================

export type AlertType =
  | 'behavioral_drift'
  | 'hallucination_spike'
  | 'refusal_spike'
  | 'latency_regression'
  | 'probe_failure'
  | 'deployment_block'
  | 'deployment_approved'
  | 'review_requested'
  | 'review_completed'
  | 'environment_promotion'
  | 'api_key_expired'
  | 'security_event';

export type ChannelType = 'email' | 'slack' | 'teams' | 'discord' | 'webhook';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertChannel {
  id: string;
  orgId: string;
  type: ChannelType;
  name: string;
  config: ChannelConfig;
  alertTypes: AlertType[];
  minSeverity: AlertSeverity;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastDeliveredAt?: Date;
  failureCount: number;
}

export type ChannelConfig =
  | { type: 'email'; recipients: string[]; fromName?: string }
  | { type: 'slack'; webhookUrl: string; channel?: string; username?: string; iconEmoji?: string }
  | { type: 'teams'; webhookUrl: string }
  | { type: 'discord'; webhookUrl: string; username?: string; avatarUrl?: string }
  | { type: 'webhook'; url: string; secret?: string; headers?: Record<string, string>; method?: 'POST' | 'PUT' };

export interface AlertThresholds {
  id: string;
  orgId: string;
  projectId?: string; // null = org-wide defaults
  hallucinationWarn: number;    // default 0.10
  hallucinationBlock: number;   // default 0.20
  latencyWarnMs: number;        // default 100ms increase
  toneShiftWarn: number;        // default 0.15
  similarityBlock: number;      // default 0.70
  refusalSpikeWarn: number;     // default 0.10
  probeFailureBlock: number;    // default 0.20 (20% probe failure rate)
  updatedAt: Date;
}

export interface AlertEvent {
  id: string;
  orgId: string;
  projectId?: string;
  endpointId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, any>;
  deliveries: AlertDelivery[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AlertDelivery {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  status: 'pending' | 'delivered' | 'failed';
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
}

// ── Default thresholds ───────────────────────────────────

export const DEFAULT_THRESHOLDS: Omit<AlertThresholds, 'id' | 'orgId' | 'projectId' | 'updatedAt'> = {
  hallucinationWarn: 0.10,
  hallucinationBlock: 0.20,
  latencyWarnMs: 100,
  toneShiftWarn: 0.15,
  similarityBlock: 0.70,
  refusalSpikeWarn: 0.10,
  probeFailureBlock: 0.20,
};

// ── DB Row Types ─────────────────────────────────────────

export interface AlertChannelRow {
  id: string;
  org_id: string;
  type: ChannelType;
  name: string;
  config: any;
  alert_types: AlertType[];
  min_severity: AlertSeverity;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_delivered_at: string | null;
  failure_count: number;
}

export interface AlertEventRow {
  id: string;
  org_id: string;
  project_id: string | null;
  endpoint_id: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: any;
  deliveries: any;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}
