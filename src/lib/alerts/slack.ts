import { AlertChannel, AlertEvent } from '@/types/alert-config';

// ============================================================
// Slack Alert Channel
// ============================================================

const SEVERITY_COLORS: Record<string, string> = {
  info: '#00E5FF',
  warning: '#FFB800',
  critical: '#FF3D6B',
};

const SEVERITY_EMOJI: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

export async function sendSlackAlert(channel: AlertChannel, event: AlertEvent): Promise<void> {
  const config = channel.config as { type: 'slack'; webhookUrl: string; channel?: string; username?: string; iconEmoji?: string };

  const payload = {
    ...(config.channel ? { channel: config.channel } : {}),
    username: config.username || 'DriftGuard',
    icon_emoji: config.iconEmoji || ':shield:',
    attachments: [{
      color: SEVERITY_COLORS[event.severity] || '#5A7A7D',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${SEVERITY_EMOJI[event.severity] || ''} ${event.title}`, emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: event.message },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `*Type:* ${event.type.replace(/_/g, ' ')}` },
            { type: 'mrkdwn', text: `*Severity:* ${event.severity.toUpperCase()}` },
            ...(event.endpointId ? [{ type: 'mrkdwn', text: `*Endpoint:* ${event.endpointId}` }] : []),
            { type: 'mrkdwn', text: `*Time:* <!date^${Math.floor(event.createdAt.getTime() / 1000)}^{date_short} at {time}|${event.createdAt.toISOString()}>` },
          ],
        },
        // Metadata fields
        ...(Object.keys(event.metadata).length > 0 ? [{
          type: 'section',
          fields: Object.entries(event.metadata).slice(0, 8).map(([key, value]) => ({
            type: 'mrkdwn',
            text: `*${key}:*\n${typeof value === 'number' ? value.toFixed(4) : String(value)}`,
          })),
        }] : []),
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: '🔍 View in DriftGuard' }, url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://driftguard.dev'}/dashboard`, style: 'primary' },
            { type: 'button', text: { type: 'plain_text', text: '✅ Acknowledge' }, value: event.id, action_id: 'acknowledge_alert' },
          ],
        },
      ],
    }],
  };

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
  }
}
