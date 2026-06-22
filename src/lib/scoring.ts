// ============================================================
// lib/scoring.ts — Compliance scoring utilities
// Design system: Antigravity. NO hardcoded hex values.
// ============================================================

export type ControlStatus = 'PASS' | 'WARN' | 'FAIL' | 'NOT_ASSESSED';

export interface ControlRow {
  domain_code: string;
  status: ControlStatus;
}

export interface DomainScore {
  domainCode: string;
  score: number;          // 0–100
  grade: string;          // A / B / C / D / F
  passing: number;
  warning: number;
  failing: number;
  notAssessed: number;
  total: number;
}

export interface ComplianceReport {
  overallScore: number;
  overallGrade: string;
  domains: DomainScore[];
  criticalFailures: ControlRow[];
}

// ── Point values ─────────────────────────────────────────────
const STATUS_POINTS: Record<ControlStatus, number> = {
  PASS:         1,
  WARN:         0.5,
  FAIL:         0,
  NOT_ASSESSED: 0,
};

/**
 * Calculate the score for a single domain from its controls.
 * Returns a 0–100 number.
 */
export function calculateDomainScore(controls: ControlRow[]): DomainScore {
  const domainCode = controls[0]?.domain_code ?? 'UNKNOWN';
  if (controls.length === 0) {
    return { domainCode, score: 0, grade: 'F', passing: 0, warning: 0, failing: 0, notAssessed: 0, total: 0 };
  }

  let points = 0;
  let passing = 0;
  let warning = 0;
  let failing = 0;
  let notAssessed = 0;

  for (const c of controls) {
    const status = c.status as ControlStatus;
    points += STATUS_POINTS[status] ?? 0;
    if (status === 'PASS')         passing++;
    else if (status === 'WARN')    warning++;
    else if (status === 'FAIL')    failing++;
    else                           notAssessed++;
  }

  const rawScore = (points / controls.length) * 100;
  const score = Math.round(rawScore);

  return {
    domainCode,
    score,
    grade: getScoreGrade(score),
    passing,
    warning,
    failing,
    notAssessed,
    total: controls.length,
  };
}

/**
 * Average domain scores to get an overall platform score.
 */
export function calculateOverallScore(domainScores: DomainScore[]): number {
  if (domainScores.length === 0) return 0;
  const sum = domainScores.reduce((acc, d) => acc + d.score, 0);
  return Math.round(sum / domainScores.length);
}

/**
 * Convert a 0–100 score to a letter grade.
 */
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Return a CSS variable name (NOT a hex value) for a given score.
 * The caller renders: style={{ color: getScoreColor(score) }}
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-pass)';
  if (score >= 50) return 'var(--color-warn)';
  return 'var(--color-block)';
}
