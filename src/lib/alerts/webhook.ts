import { AlertChannel, AlertEvent } from '@/types/alert-config';
import * as crypto from 'crypto';

// ============================================================
// Generic Webhook Alert Channel
// ============================================================

export async function sendWebhookAlert(channel: AlertChannel, event: AlertEvent): Promise<void> {
  const config = channel.config as { type: 'webhook'; url: string; secret?: string; headers?: Record<string, string>; method?: 'POST' | 'PUT' };

  const payload = {
    event: {
      id: event.id,
      type: event.type,
      severity: event.severity,
      title: event.title,
      message: event.message,
      metadata: event.metadata,
      orgId: event.orgId,
      projectId: event.projectId,
      endpointId: event.endpointId,
      createdAt: event.createdAt.toISOString(),
    },
    source: 'driftguard',
    version: '1.0',
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'DriftGuard-Webhook/1.0',
    'X-DriftGuard-Event': event.type,
    'X-DriftGuard-Severity': event.severity,
    ...(config.headers || {}),
  };

  // HMAC signature for webhook verification
  if (config.secret) {
    const signature = crypto.createHmac('sha256', config.secret).update(body).digest('hex');
    headers['X-DriftGuard-Signature'] = `sha256=${signature}`;
  }

  const res = await fetch(config.url, {
    method: config.method || 'POST',
    headers,
    body,
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
  }
}
