// ============================================================
// DriftGuard — Controls Engine
// Scoring, filtering, crosswalk matrix, and analytics
// ============================================================

import { CONTROLS, MOCK_ASSESSMENTS, DOMAINS, FRAMEWORKS, Control, ControlAssessment } from './controls-data';

// ── Get controls with their assessments ─────────────────────
export interface ControlWithAssessment extends Control {
  assessment: ControlAssessment;
}

export function getControlsWithAssessments(): ControlWithAssessment[] {
  return CONTROLS.map(control => ({
    ...control,
    assessment: MOCK_ASSESSMENTS.find(a => a.controlId === control.id) || {
      controlId: control.id,
      status: 'pending' as const,
      owner: 'Unassigned',
      lastAssessed: 'Never',
      evidenceCount: 0,
    },
  }));
}

// ── Filter by domain ────────────────────────────────────────
export function getControlsByDomain(domainCode: string): ControlWithAssessment[] {
  return getControlsWithAssessments().filter(c => c.domainCode === domainCode);
}

// ── Filter by framework ─────────────────────────────────────
export function getControlsByFramework(frameworkName: string): ControlWithAssessment[] {
  return getControlsWithAssessments().filter(c =>
    c.frameworks.some(f => f.toLowerCase().includes(frameworkName.toLowerCase()))
  );
}

// ── Scoring ─────────────────────────────────────────────────
export interface ScoreResult {
  total: number;
  passing: number;
  warning: number;
  failing: number;
  pending: number;
  na: number;
  score: number; // 0-100
}

function computeScore(controls: ControlWithAssessment[]): ScoreResult {
  const total = controls.length;
  const passing = controls.filter(c => c.assessment.status === 'pass').length;
  const warning = controls.filter(c => c.assessment.status === 'warn').length;
  const failing = controls.filter(c => c.assessment.status === 'block').length;
  const pending = controls.filter(c => c.assessment.status === 'pending').length;
  const na = controls.filter(c => c.assessment.status === 'na').length;
  const assessed = total - pending - na;
  const score = assessed > 0 ? Math.round(((passing + warning * 0.5) / assessed) * 100) : 0;
  return { total, passing, warning, failing, pending, na, score };
}

export function getOverallScore(): ScoreResult {
  return computeScore(getControlsWithAssessments());
}

export function getDomainScore(domainCode: string): ScoreResult {
  return computeScore(getControlsByDomain(domainCode));
}

export function getFrameworkScore(frameworkName: string): ScoreResult {
  return computeScore(getControlsByFramework(frameworkName));
}

// ── Domain health summary ───────────────────────────────────
export interface DomainHealth {
  code: string;
  name: string;
  description: string;
  controlCount: number;
  score: ScoreResult;
}

export function getDomainHealthMap(): DomainHealth[] {
  return DOMAINS.map(domain => ({
    code: domain.code,
    name: domain.name,
    description: domain.description,
    controlCount: domain.controlCount,
    score: getDomainScore(domain.code),
  }));
}

// ── Framework crosswalk matrix ──────────────────────────────
export interface CrosswalkRow {
  control: ControlWithAssessment;
  frameworkMap: Record<string, boolean>;
}

export function getCrosswalkMatrix(): CrosswalkRow[] {
  const controls = getControlsWithAssessments();
  const frameworkNames = FRAMEWORKS.map(f => f.name);

  return controls.map(control => {
    const frameworkMap: Record<string, boolean> = {};
    frameworkNames.forEach(fw => {
      frameworkMap[fw] = control.frameworks.some(cf =>
        cf.toLowerCase().includes(fw.toLowerCase()) ||
        fw.toLowerCase().includes(cf.toLowerCase())
      );
    });
    return { control, frameworkMap };
  });
}

// ── Active alerts count ─────────────────────────────────────
export function getActiveAlertCount(): number {
  const controls = getControlsWithAssessments();
  return controls.filter(c => c.assessment.status === 'block' || c.assessment.status === 'warn').length;
}

// ── Critical risk controls ──────────────────────────────────
export function getCriticalControls(): ControlWithAssessment[] {
  return getControlsWithAssessments().filter(
    c => c.riskLevel === 'critical' && c.assessment.status !== 'pass'
  );
}

// Re-export data
export { CONTROLS, MOCK_ASSESSMENTS, DOMAINS, FRAMEWORKS };
