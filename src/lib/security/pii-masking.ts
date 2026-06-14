// ============================================================
// PII Detection & Masking Engine
// Auto-detect and mask personally identifiable information
// ============================================================

export type PIIType = 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address' | 'name' | 'address';

export interface PIIDetection {
  type: PIIType;
  value: string;
  masked: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface MaskingConfig {
  enabledTypes: PIIType[];
  maskCharacter: string;
  preserveFormat: boolean;
  logDetections: boolean;
}

export const DEFAULT_MASKING_CONFIG: MaskingConfig = {
  enabledTypes: ['email', 'phone', 'ssn', 'credit_card', 'ip_address'],
  maskCharacter: '•',
  preserveFormat: true,
  logDetections: true,
};

// ── Detection patterns ───────────────────────────────────

const PII_PATTERNS: { type: PIIType; pattern: RegExp; mask: (match: string, config: MaskingConfig) => string; confidence: number }[] = [
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (match, config) => {
      const [local, domain] = match.split('@');
      return `${local[0]}${config.maskCharacter.repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
    },
    confidence: 0.95,
  },
  {
    type: 'phone',
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    mask: (match, config) => {
      if (config.preserveFormat) {
        return match.replace(/\d(?=\d{4})/g, config.maskCharacter);
      }
      return config.maskCharacter.repeat(match.length);
    },
    confidence: 0.85,
  },
  {
    type: 'ssn',
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    mask: (_match, config) => `${config.maskCharacter.repeat(3)}-${config.maskCharacter.repeat(2)}-${config.maskCharacter.repeat(4)}`,
    confidence: 0.90,
  },
  {
    type: 'credit_card',
    pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
    mask: (match, config) => {
      const digits = match.replace(/\D/g, '');
      return `${config.maskCharacter.repeat(12)}${digits.slice(-4)}`;
    },
    confidence: 0.92,
  },
  {
    type: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    mask: (match, config) => {
      const parts = match.split('.');
      return `${parts[0]}.${config.maskCharacter.repeat(3)}.${config.maskCharacter.repeat(3)}.${parts[3]}`;
    },
    confidence: 0.88,
  },
];

/**
 * Detect PII in text.
 */
export function detectPII(text: string, config: MaskingConfig = DEFAULT_MASKING_CONFIG): PIIDetection[] {
  const detections: PIIDetection[] = [];

  for (const { type, pattern, mask, confidence } of PII_PATTERNS) {
    if (!config.enabledTypes.includes(type)) continue;

    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      detections.push({
        type,
        value: match[0],
        masked: mask(match[0], config),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence,
      });
    }
  }

  return detections.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Mask all PII in text.
 */
export function maskPII(text: string, config: MaskingConfig = DEFAULT_MASKING_CONFIG): { masked: string; detections: PIIDetection[] } {
  const detections = detectPII(text, config);

  if (detections.length === 0) {
    return { masked: text, detections: [] };
  }

  let masked = text;
  // Apply masks in reverse order to preserve indices
  for (let i = detections.length - 1; i >= 0; i--) {
    const d = detections[i];
    masked = masked.substring(0, d.startIndex) + d.masked + masked.substring(d.endIndex);
  }

  return { masked, detections };
}

/**
 * Check if text contains PII.
 */
export function containsPII(text: string, config: MaskingConfig = DEFAULT_MASKING_CONFIG): boolean {
  return detectPII(text, config).length > 0;
}

/**
 * Get a summary of PII found in text.
 */
export function piiSummary(text: string, config: MaskingConfig = DEFAULT_MASKING_CONFIG): Record<PIIType, number> {
  const detections = detectPII(text, config);
  const counts: Partial<Record<PIIType, number>> = {};

  for (const d of detections) {
    counts[d.type] = (counts[d.type] || 0) + 1;
  }

  return counts as Record<PIIType, number>;
}
