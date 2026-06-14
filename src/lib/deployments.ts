import { Deployment, DeploymentAuditEntry, DeploymentStatus } from '@/types/deployment';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';
import { v4 as uuid } from 'uuid';

// ============================================================
// Deployment Gating Engine
// The core "Behavioral Version Control" workflow:
//   Fingerprint → Eval → Probes → Diff → Gate → Deploy/Block
// ============================================================

export interface CreateDeploymentInput {
  orgId: string;
  projectId: string;
  endpointId: string;
  endpointName?: string;
  version: string;
  targetEnvironmentId: string;
  sourceEnvironmentId?: string;
  createdBy: string;
}

/**
 * Create a new deployment and start the gating pipeline.
 */
export async function createDeployment(input: CreateDeploymentInput): Promise<Deployment> {
  const deployment: Deployment = {
    id: uuid(),
    orgId: input.orgId,
    projectId: input.projectId,
    endpointId: input.endpointId,
    endpointName: input.endpointName,
    sourceEnvironmentId: input.sourceEnvironmentId,
    targetEnvironmentId: input.targetEnvironmentId,
    version: input.version,
    status: 'pending',
    verdict: null,
    progress: 0,
    currentStep: 'Initializing',
    createdAt: new Date(),
    createdBy: input.createdBy,
    audit: [
      {
        timestamp: new Date(),
        action: 'deployment.created',
        userId: input.createdBy,
        details: `Deployment initiated for ${input.endpointName || input.endpointId} v${input.version}`,
      },
    ],
  };

  if (!isSupabaseConfigured()) return deployment;

  const { error } = await supabaseAdmin
    .from('deployments')
    .insert({
      id: deployment.id,
      org_id: input.orgId,
      project_id: input.projectId,
      endpoint_id: input.endpointId,
      source_environment_id: input.sourceEnvironmentId || null,
      target_environment_id: input.targetEnvironmentId,
      version: input.version,
      status: 'pending',
      verdict: null,
      progress: 0,
      current_step: 'Initializing',
      created_by: input.createdBy,
      audit: deployment.audit,
    });

  if (error) throw new Error(`Failed to create deployment: ${error.message}`);
  return deployment;
}

/**
 * Update deployment status and progress.
 */
export async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  updates: {
    progress?: number;
    currentStep?: string;
    verdict?: 'PASS' | 'WARN' | 'BLOCK' | null;
    fingerprintId?: string;
    diffId?: string;
    datasetEvalId?: string;
    probeRunId?: string;
    completedAt?: Date;
  } = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const updateData: Record<string, any> = { status };
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.currentStep) updateData.current_step = updates.currentStep;
  if (updates.verdict !== undefined) updateData.verdict = updates.verdict;
  if (updates.fingerprintId) updateData.fingerprint_id = updates.fingerprintId;
  if (updates.diffId) updateData.diff_id = updates.diffId;
  if (updates.datasetEvalId) updateData.dataset_eval_id = updates.datasetEvalId;
  if (updates.probeRunId) updateData.probe_run_id = updates.probeRunId;
  if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();

  const { error } = await supabaseAdmin
    .from('deployments')
    .update(updateData)
    .eq('id', deploymentId);

  if (error) throw new Error(`Failed to update deployment: ${error.message}`);
}

/**
 * Approve a deployment (reviewer/admin action).
 */
export async function approveDeployment(
  deploymentId: string,
  userId: string
): Promise<void> {
  const now = new Date();

  if (!isSupabaseConfigured()) return;

  const { data: existing } = await supabaseAdmin
    .from('deployments')
    .select('status, audit')
    .eq('id', deploymentId)
    .single();

  if (!existing || existing.status !== 'awaiting_approval') {
    throw new Error('Deployment is not awaiting approval');
  }

  const audit: DeploymentAuditEntry[] = [
    ...(existing.audit || []),
    { timestamp: now, action: 'deployment.approved', userId, details: 'Deployment approved for production' },
  ];

  const { error } = await supabaseAdmin
    .from('deployments')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: now.toISOString(),
      completed_at: now.toISOString(),
      progress: 100,
      current_step: 'Deployed',
      audit,
    })
    .eq('id', deploymentId);

  if (error) throw new Error(`Failed to approve deployment: ${error.message}`);
}

/**
 * Reject a deployment with reason.
 */
export async function rejectDeployment(
  deploymentId: string,
  userId: string,
  reason: string
): Promise<void> {
  const now = new Date();

  if (!isSupabaseConfigured()) return;

  const { data: existing } = await supabaseAdmin
    .from('deployments')
    .select('status, audit')
    .eq('id', deploymentId)
    .single();

  if (!existing || !['awaiting_approval', 'pending'].includes(existing.status)) {
    throw new Error('Deployment cannot be rejected in current state');
  }

  const audit: DeploymentAuditEntry[] = [
    ...(existing.audit || []),
    { timestamp: now, action: 'deployment.rejected', userId, details: `Rejected: ${reason}` },
  ];

  const { error } = await supabaseAdmin
    .from('deployments')
    .update({
      status: 'rejected',
      rejected_by: userId,
      rejected_at: now.toISOString(),
      rejection_reason: reason,
      completed_at: now.toISOString(),
      progress: 100,
      current_step: 'Rejected',
      audit,
    })
    .eq('id', deploymentId);

  if (error) throw new Error(`Failed to reject deployment: ${error.message}`);
}

/**
 * Rollback a deployed version.
 */
export async function rollbackDeployment(
  deploymentId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const now = new Date();

  if (!isSupabaseConfigured()) return;

  const { data: existing } = await supabaseAdmin
    .from('deployments')
    .select('status, audit')
    .eq('id', deploymentId)
    .single();

  if (!existing || !['deployed', 'approved'].includes(existing.status)) {
    throw new Error('Deployment cannot be rolled back in current state');
  }

  const audit: DeploymentAuditEntry[] = [
    ...(existing.audit || []),
    { timestamp: now, action: 'deployment.rolled_back', userId, details: reason || 'Manual rollback' },
  ];

  const { error } = await supabaseAdmin
    .from('deployments')
    .update({
      status: 'rolled_back',
      rolled_back_at: now.toISOString(),
      rolled_back_by: userId,
      rollback_reason: reason || null,
      audit,
    })
    .eq('id', deploymentId);

  if (error) throw new Error(`Failed to rollback deployment: ${error.message}`);
}

/**
 * List deployments for a project.
 */
export async function listDeployments(
  orgId: string,
  projectId: string,
  options: { status?: DeploymentStatus; limit?: number; offset?: number } = {}
): Promise<{ deployments: Deployment[]; total: number }> {
  if (!isSupabaseConfigured()) return { deployments: [], total: 0 };

  const limit = Math.min(options.limit || 25, 100);
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('deployments')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .eq('project_id', projectId);

  if (options.status) query = query.eq('status', options.status);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list deployments: ${error.message}`);

  return {
    deployments: (data || []).map(mapDeploymentRow),
    total: count || 0,
  };
}

/**
 * Get a single deployment by ID.
 */
export async function getDeployment(deploymentId: string): Promise<Deployment | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabaseAdmin
    .from('deployments')
    .select('*')
    .eq('id', deploymentId)
    .single();

  if (error || !data) return null;
  return mapDeploymentRow(data);
}

// ── Row mapper ───────────────────────────────────────────────

function mapDeploymentRow(row: any): Deployment {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    endpointId: row.endpoint_id,
    sourceEnvironmentId: row.source_environment_id,
    targetEnvironmentId: row.target_environment_id,
    version: row.version,
    status: row.status as DeploymentStatus,
    fingerprintId: row.fingerprint_id,
    diffId: row.diff_id,
    datasetEvalId: row.dataset_eval_id,
    probeRunId: row.probe_run_id,
    verdict: row.verdict,
    progress: row.progress || 0,
    currentStep: row.current_step,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
    rejectedBy: row.rejected_by,
    rejectedAt: row.rejected_at ? new Date(row.rejected_at) : undefined,
    rejectionReason: row.rejection_reason,
    rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at) : undefined,
    rolledBackBy: row.rolled_back_by,
    rollbackReason: row.rollback_reason,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    audit: row.audit || [],
  };
}
