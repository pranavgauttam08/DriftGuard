// ============================================================
// DriftGuard Enterprise — Deployment & Review Types
// ============================================================

// ── Deployments ──────────────────────────────────────────────

export type DeploymentStatus =
  | 'pending'
  | 'fingerprinting'
  | 'evaluating'
  | 'probing'
  | 'diffing'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'deployed'
  | 'rolled_back'
  | 'cancelled';

export interface Deployment {
  id: string;
  orgId: string;
  projectId: string;
  endpointId: string;
  endpointName?: string;
  sourceEnvironmentId?: string;
  targetEnvironmentId: string;
  version: string;
  status: DeploymentStatus;

  // Pipeline step outputs
  fingerprintId?: string;
  diffId?: string;
  datasetEvalId?: string;
  probeRunId?: string;

  // Verdict from diff engine
  verdict: 'PASS' | 'WARN' | 'BLOCK' | null;

  // Pipeline progress (0-100)
  progress: number;
  currentStep?: string;

  // Approval / rejection
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Rollback
  rolledBackAt?: Date;
  rolledBackBy?: string;
  rollbackReason?: string;

  // Timestamps
  createdAt: Date;
  createdBy: string;
  completedAt?: Date;

  // Audit trail
  audit: DeploymentAuditEntry[];
}

export interface DeploymentAuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  details: string;
}

// Pipeline step configuration
export interface DeploymentPipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: Record<string, any>;
  error?: string;
}

export interface DeploymentPipeline {
  deploymentId: string;
  steps: DeploymentPipelineStep[];
}

// ── Reviews ──────────────────────────────────────────────────

export type ReviewStatus = 'open' | 'approved' | 'rejected' | 'needs_changes';

export interface Review {
  id: string;
  orgId: string;
  deploymentId?: string;
  diffId: string;
  endpointId: string;
  endpointName?: string;
  version: string;
  status: ReviewStatus;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  comments: ReviewComment[];
  annotations: ReviewAnnotation[];
  verdict?: 'PASS' | 'WARN' | 'BLOCK';
  createdAt: Date;
  createdBy: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  userName?: string;
  text: string;
  timestamp: Date;
  isSystemGenerated?: boolean;
}

export interface ReviewAnnotation {
  id: string;
  reviewId: string;
  userId: string;
  userName?: string;
  type: AnnotationType;
  dimension?: string;
  note: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

export type AnnotationType =
  | 'hallucination'
  | 'toxicity'
  | 'wrong_tone'
  | 'regression'
  | 'pii'
  | 'bias'
  | 'factual_error'
  | 'safety_concern'
  | 'quality_improvement'
  | 'other';

// ── Database Row Types ───────────────────────────────────────

export interface DeploymentRow {
  id: string;
  org_id: string;
  project_id: string;
  endpoint_id: string;
  source_environment_id: string | null;
  target_environment_id: string;
  version: string;
  status: string;
  fingerprint_id: string | null;
  diff_id: string | null;
  dataset_eval_id: string | null;
  probe_run_id: string | null;
  verdict: string | null;
  progress: number;
  current_step: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  rollback_reason: string | null;
  created_at: string;
  created_by: string;
  completed_at: string | null;
  audit: any;
}

export interface ReviewRow {
  id: string;
  org_id: string;
  deployment_id: string | null;
  diff_id: string;
  endpoint_id: string;
  version: string;
  status: string;
  assigned_to: string[];
  priority: string;
  verdict: string | null;
  created_at: string;
  created_by: string;
  resolved_at: string | null;
  resolved_by: string | null;
}
