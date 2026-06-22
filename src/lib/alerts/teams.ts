import { AlertChannel, AlertEvent } from '@/types/alert-config';

// ============================================================
// Microsoft Teams Alert Channel (Adaptive Cards)
// ============================================================

const SEVERITY_COLORS: Record<string, string> = {
  info: '#00E5FF',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export async function sendTeamsAlert(channel: AlertChannel, event: AlertEvent): Promise<void> {
  const config = channel.config as { type: 'teams'; webhookUrl: string };

  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: SEVERITY_COLORS[event.severity] || '5A7A7D',
    summary: event.title,
    sections: [{
      activityTitle: `${event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️'} ${event.title}`,
      activitySubtitle: `DriftGuard | ${event.type.replace(/_/g, ' ')}`,
      activityImage: 'https://driftguard.dev/icon.png',
      facts: [
        { name: 'Severity', value: event.severity.toUpperCase() },
        { name: 'Type', value: event.type.replace(/_/g, ' ') },
        ...(event.endpointId ? [{ name: 'Endpoint', value: event.endpointId }] : []),
        ...Object.entries(event.metadata).slice(0, 6).map(([key, value]) => ({
          name: key, value: typeof value === 'number' ? value.toFixed(4) : String(value),
        })),
      ],
      text: event.message,
      markdown: true,
    }],
    potentialAction: [{
      '@type': 'OpenUri',
      name: 'View in DriftGuard',
      targets: [{ os: 'default', uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://driftguard.dev'}/dashboard` }],
    }],
  };

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    throw new Error(`Teams webhook failed: ${res.status} ${await res.text()}`);
  }
}
