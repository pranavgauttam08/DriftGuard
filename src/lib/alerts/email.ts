import { AlertChannel, AlertEvent } from '@/types/alert-config';

// ============================================================
// Email Alert Channel
// Supports Resend, SendGrid, or generic SMTP via API
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.ALERT_EMAIL_FROM || 'alerts@driftguard.dev';

const SEVERITY_COLORS: Record<string, string> = {
  info: '#00E5FF',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export async function sendEmailAlert(channel: AlertChannel, event: AlertEvent): Promise<void> {
  const config = channel.config as { type: 'email'; recipients: string[]; fromName?: string };

  if (!RESEND_API_KEY) {
    console.warn('Email alerts not configured — RESEND_API_KEY missing');
    return;
  }

  const html = buildEmailHtml(event);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${config.fromName || 'DriftGuard'} <${EMAIL_FROM}>`,
      to: config.recipients,
      subject: `[${event.severity.toUpperCase()}] ${event.title}`,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email delivery failed: ${res.status} ${await res.text()}`);
  }
}

function buildEmailHtml(event: AlertEvent): string {
  const color = SEVERITY_COLORS[event.severity] || '#5A7A7D';
  const metadataRows = Object.entries(event.metadata)
    .slice(0, 8)
    .map(([key, value]) => `<tr><td style="padding:4px 12px;color:#888;font-size:13px;">${key}</td><td style="padding:4px 12px;color:#fff;font-size:13px;font-family:monospace;">${typeof value === 'number' ? value.toFixed(4) : String(value)}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <!-- Header -->
    <div style="margin-bottom:24px;">
      <img src="https://driftguard.dev/logo.png" alt="DriftGuard" width="120" style="display:block;margin-bottom:16px;" />
      <div style="border-left:4px solid ${color};padding-left:16px;">
        <h1 style="margin:0;font-size:18px;color:#fff;">${event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️'} ${event.title}</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">${event.type.replace(/_/g, ' ')} · ${event.severity.toUpperCase()}</p>
      </div>
    </div>

    <!-- Message -->
    <div style="background:#111920;border:1px solid #1a2530;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;color:#ccc;font-size:14px;line-height:1.6;">${event.message}</p>
    </div>

    <!-- Metadata -->
    ${metadataRows ? `
    <div style="background:#111920;border:1px solid #1a2530;border-radius:8px;overflow:hidden;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #1a2530;">
          <td colspan="2" style="padding:8px 12px;color:#5A7A7D;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Details</td>
        </tr>
        ${metadataRows}
      </table>
    </div>` : ''}

    <!-- CTA -->
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://driftguard.dev'}/dashboard" style="display:inline-block;padding:10px 24px;background:${color};color:#000;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;">View in DriftGuard</a>

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1a2530;">
      <p style="margin:0;font-size:11px;color:#5A7A7D;">DriftGuard — Behavioral Version Control for AI Systems</p>
      <p style="margin:4px 0 0;font-size:11px;color:#5A7A7D;">${event.createdAt.toISOString()}</p>
    </div>
  </div>
</body>
</html>`;
}
