// ============================================================
// PII Detector — Regex-based PII detection and masking
// ============================================================

export type PIIType = 'email' | 'phone' | 'credit_card' | 'ssn' | 'passport' | 'address' | 'ip_address' | 'date_of_birth';

export interface PIIMatch {
  type: PIIType;
  value: string;
  masked: string;
  position: { start: number; end: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  severity: PIIMatch['severity'];
  mask: (v: string) => string;
}

const PII_PATTERNS: PIIPattern[] = [
  {
    type: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: 'medium',
    mask: (v) => v.replace(/(.{2}).+(@.+)/, '$1***$2'),
  },
  {
    type: 'phone', regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    severity: 'medium',
    mask: (v) => v.slice(0, -4).replace(/\d/g, '*') + v.slice(-4),
  },
  {
    type: 'credit_card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    severity: 'critical',
    mask: (v) => '****-****-****-' + v.replace(/[-\s]/g, '').slice(-4),
  },
  {
    type: 'ssn', regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    severity: 'critical',
    mask: (v) => '***-**-' + v.replace(/[-\s]/g, '').slice(-4),
  },
  {
    type: 'passport', regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
    severity: 'high',
    mask: (v) => v.slice(0, 2) + '*'.repeat(v.length - 2),
  },
  {
    type: 'ip_address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    severity: 'low',
    mask: (v) => v.split('.').map((p, i) => i < 2 ? p : '***').join('.'),
  },
];

/** Detect all PII in text */
export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];

  for (const pattern of PII_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Credit card Luhn validation
      if (pattern.type === 'credit_card') {
        const digits = match[0].replace(/[-\s]/g, '');
        if (!luhnCheck(digits)) continue;
      }

      matches.push({
        type: pattern.type,
        value: match[0],
        masked: pattern.mask(match[0]),
        position: { start: match.index, end: match.index + match[0].length },
        severity: pattern.severity,
      });
    }
  }

  return matches.sort((a, b) => a.position.start - b.position.start);
}

/** Mask all PII in text */
export function maskPII(text: string, types?: PIIType[]): string {
  const matches = detectPII(text);
  const filtered = types ? matches.filter(m => types.includes(m.type)) : matches;

  let result = text;
  // Replace from end to preserve positions
  for (const match of filtered.reverse()) {
    result = result.slice(0, match.position.start) + match.masked + result.slice(match.position.end);
  }

  return result;
}

/** Luhn algorithm for credit card validation */
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Get severity color */
export function getPIISeverityColor(severity: PIIMatch['severity']): string {
  switch (severity) {
    case 'critical': return '#FF3D6B';
    case 'high': return '#FFB800';
    case 'medium': return '#00E5FF';
    case 'low': return '#00FF88';
  }
}

/** PII type display info */
export const PII_TYPE_INFO: Record<PIIType, { label: string; icon: string }> = {
  email: { label: 'Email Address', icon: '📧' },
  phone: { label: 'Phone Number', icon: '📱' },
  credit_card: { label: 'Credit Card', icon: '💳' },
  ssn: { label: 'SSN / National ID', icon: '🆔' },
  passport: { label: 'Passport Number', icon: '🛂' },
  address: { label: 'Physical Address', icon: '📍' },
  ip_address: { label: 'IP Address', icon: '🌐' },
  date_of_birth: { label: 'Date of Birth', icon: '📅' },
};
