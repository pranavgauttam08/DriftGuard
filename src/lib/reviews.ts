import { Review, ReviewComment, ReviewAnnotation, ReviewStatus, AnnotationType } from '@/types/deployment';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';
import { v4 as uuid } from 'uuid';

// ============================================================
// Human Review Engine
// Structured review workflow for behavioral changes
// ============================================================

export interface CreateReviewInput {
  orgId: string;
  deploymentId?: string;
  diffId: string;
  endpointId: string;
  endpointName?: string;
  version: string;
  verdict?: 'PASS' | 'WARN' | 'BLOCK';
  assignedTo?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
}

/**
 * Create a new review for a behavioral diff.
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const review: Review = {
    id: uuid(),
    orgId: input.orgId,
    deploymentId: input.deploymentId,
    diffId: input.diffId,
    endpointId: input.endpointId,
    endpointName: input.endpointName,
    version: input.version,
    status: 'open',
    assignedTo: input.assignedTo || [],
    priority: input.priority || 'medium',
    comments: [],
    annotations: [],
    verdict: input.verdict,
    createdAt: new Date(),
    createdBy: input.createdBy,
  };

  if (!isSupabaseConfigured()) return review;

  const { error } = await supabaseAdmin
    .from('reviews')
    .insert({
      id: review.id,
      org_id: input.orgId,
      deployment_id: input.deploymentId || null,
      diff_id: input.diffId,
      endpoint_id: input.endpointId,
      version: input.version,
      status: 'open',
      assigned_to: review.assignedTo,
      priority: review.priority,
      verdict: input.verdict || null,
      created_by: input.createdBy,
    });

  if (error) throw new Error(`Failed to create review: ${error.message}`);

  // Auto-add system comment
  await addComment(review.id, 'system', `Review created for ${input.endpointName || input.endpointId} v${input.version}${input.verdict ? ` (verdict: ${input.verdict})` : ''}`, true);

  return review;
}

/**
 * List reviews for an organization.
 */
export async function listReviews(
  orgId: string,
  options: { status?: ReviewStatus; endpointId?: string; limit?: number; offset?: number } = {}
): Promise<{ reviews: Review[]; total: number }> {
  if (!isSupabaseConfigured()) return { reviews: [], total: 0 };

  const limit = Math.min(options.limit || 25, 100);
  const offset = options.offset || 0;

  let query = supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);

  if (options.status) query = query.eq('status', options.status);
  if (options.endpointId) query = query.eq('endpoint_id', options.endpointId);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list reviews: ${error.message}`);

  const reviews = (data || []).map(mapReviewRow);

  // Fetch comments and annotations for each review
  for (const review of reviews) {
    const [comments, annotations] = await Promise.all([
      getComments(review.id),
      getAnnotations(review.id),
    ]);
    review.comments = comments;
    review.annotations = annotations;
  }

  return { reviews, total: count || 0 };
}

/**
 * Approve a review.
 */
export async function approveReview(reviewId: string, userId: string): Promise<void> {
  await updateReviewStatus(reviewId, 'approved', userId);
  await addComment(reviewId, userId, 'Review approved', true);
}

/**
 * Reject a review.
 */
export async function rejectReview(reviewId: string, userId: string, reason?: string): Promise<void> {
  await updateReviewStatus(reviewId, 'rejected', userId);
  await addComment(reviewId, userId, `Review rejected${reason ? `: ${reason}` : ''}`, true);
}

/**
 * Request changes on a review.
 */
export async function requestChanges(reviewId: string, userId: string, feedback: string): Promise<void> {
  await updateReviewStatus(reviewId, 'needs_changes', userId);
  await addComment(reviewId, userId, `Changes requested: ${feedback}`, true);
}

/**
 * Add a comment to a review.
 */
export async function addComment(
  reviewId: string,
  userId: string,
  text: string,
  isSystemGenerated = false
): Promise<ReviewComment> {
  const comment: ReviewComment = {
    id: uuid(),
    reviewId,
    userId,
    text,
    timestamp: new Date(),
    isSystemGenerated,
  };

  if (!isSupabaseConfigured()) return comment;

  const { error } = await supabaseAdmin
    .from('review_comments')
    .insert({
      id: comment.id,
      review_id: reviewId,
      user_id: userId,
      text,
      is_system_generated: isSystemGenerated,
    });

  if (error) throw new Error(`Failed to add comment: ${error.message}`);
  return comment;
}

/**
 * Add an annotation to a review.
 */
export async function addAnnotation(
  reviewId: string,
  userId: string,
  type: AnnotationType,
  note: string,
  options: { dimension?: string; severity?: 'info' | 'warning' | 'critical' } = {}
): Promise<ReviewAnnotation> {
  const annotation: ReviewAnnotation = {
    id: uuid(),
    reviewId,
    userId,
    type,
    dimension: options.dimension,
    note,
    severity: options.severity || 'warning',
    timestamp: new Date(),
  };

  if (!isSupabaseConfigured()) return annotation;

  const { error } = await supabaseAdmin
    .from('review_annotations')
    .insert({
      id: annotation.id,
      review_id: reviewId,
      user_id: userId,
      type,
      dimension: options.dimension || null,
      note,
      severity: annotation.severity,
    });

  if (error) throw new Error(`Failed to add annotation: ${error.message}`);
  return annotation;
}

// ── Internal helpers ─────────────────────────────────────────

async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus,
  resolvedBy: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const update: Record<string, any> = { status };
  if (['approved', 'rejected'].includes(status)) {
    update.resolved_at = new Date().toISOString();
    update.resolved_by = resolvedBy;
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .update(update)
    .eq('id', reviewId);

  if (error) throw new Error(`Failed to update review: ${error.message}`);
}

async function getComments(reviewId: string): Promise<ReviewComment[]> {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('review_comments')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  return (data || []).map((row: any) => ({
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    text: row.text,
    timestamp: new Date(row.created_at),
    isSystemGenerated: row.is_system_generated,
  }));
}

async function getAnnotations(reviewId: string): Promise<ReviewAnnotation[]> {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabaseAdmin
    .from('review_annotations')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  return (data || []).map((row: any) => ({
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    type: row.type as AnnotationType,
    dimension: row.dimension,
    note: row.note,
    severity: row.severity,
    timestamp: new Date(row.created_at),
  }));
}

function mapReviewRow(row: any): Review {
  return {
    id: row.id,
    orgId: row.org_id,
    deploymentId: row.deployment_id,
    diffId: row.diff_id,
    endpointId: row.endpoint_id,
    version: row.version,
    status: row.status as ReviewStatus,
    assignedTo: row.assigned_to || [],
    priority: row.priority || 'medium',
    comments: [],
    annotations: [],
    verdict: row.verdict,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    resolvedBy: row.resolved_by,
  };
}
