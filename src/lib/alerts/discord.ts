import { AlertChannel, AlertEvent } from '@/types/alert-config';

// ============================================================
// Discord Alert Channel (Embeds)
// ============================================================

const SEVERITY_COLORS: Record<string, number> = {
  info: 0x00E5FF,
  warning: 0xFFB800,
  critical: 0xFF3D6B,
};

export async function sendDiscordAlert(channel: AlertChannel, event: AlertEvent): Promise<void> {
  const config = channel.config as { type: 'discord'; webhookUrl: string; username?: string; avatarUrl?: string };

  const payload = {
    username: config.username || 'DriftGuard',
    avatar_url: config.avatarUrl || 'https://driftguard.dev/icon.png',
    embeds: [{
      title: event.title,
      description: event.message,
      color: SEVERITY_COLORS[event.severity] || 0x5A7A7D,
      fields: [
        { name: '🔹 Severity', value: event.severity.toUpperCase(), inline: true },
        { name: '🔹 Type', value: event.type.replace(/_/g, ' '), inline: true },
        ...(event.endpointId ? [{ name: '🔹 Endpoint', value: event.endpointId, inline: true }] : []),
        ...Object.entries(event.metadata).slice(0, 6).map(([key, value]) => ({
          name: key, value: typeof value === 'number' ? value.toFixed(4) : String(value), inline: true,
        })),
      ],
      timestamp: event.createdAt.toISOString(),
      footer: { text: 'DriftGuard — Behavioral Version Control', icon_url: 'https://driftguard.dev/icon.png' },
    }],
  };

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
  }
}
