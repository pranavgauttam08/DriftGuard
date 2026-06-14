import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { createReview, listReviews, approveReview, rejectReview, requestChanges, addComment, addAnnotation } from '@/lib/reviews';
import type { AnnotationType } from '@/types/deployment';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/reviews — List reviews for an organization
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const status = searchParams.get('status') || undefined;
  const endpointId = searchParams.get('endpointId') || undefined;
  const limit = parseInt(searchParams.get('limit') || '25');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!orgId) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
  }

  try {
    await requirePermission(userId, orgId, 'dashboard:view');
    const result = await listReviews(orgId, { status: status as any, endpointId, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('List reviews error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list reviews' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/reviews — Create a review, add comment, add annotation, or perform action
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { action, orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
    }

    switch (action) {
      case 'create': {
        const { diffId, endpointId, endpointName, version, verdict, assignedTo, priority, deploymentId } = body;
        if (!diffId || !endpointId || !version) {
          return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Required: diffId, endpointId, version' } }, { status: 400 });
        }
        await requirePermission(userId, orgId, 'review:create');
        const review = await createReview({
          orgId, deploymentId, diffId, endpointId, endpointName, version, verdict, assignedTo, priority, createdBy: userId,
        });
        return NextResponse.json({ review }, { status: 201 });
      }

      case 'approve': {
        const { reviewId } = body;
        if (!reviewId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'reviewId is required' } }, { status: 400 });
        await requirePermission(userId, orgId, 'review:approve');
        await approveReview(reviewId, userId);
        return NextResponse.json({ message: 'Review approved' });
      }

      case 'reject': {
        const { reviewId, reason } = body;
        if (!reviewId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'reviewId is required' } }, { status: 400 });
        await requirePermission(userId, orgId, 'review:approve');
        await rejectReview(reviewId, userId, reason);
        return NextResponse.json({ message: 'Review rejected' });
      }

      case 'request_changes': {
        const { reviewId, feedback } = body;
        if (!reviewId || !feedback) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'reviewId and feedback required' } }, { status: 400 });
        await requirePermission(userId, orgId, 'review:approve');
        await requestChanges(reviewId, userId, feedback);
        return NextResponse.json({ message: 'Changes requested' });
      }

      case 'comment': {
        const { reviewId, text } = body;
        if (!reviewId || !text) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'reviewId and text required' } }, { status: 400 });
        await requirePermission(userId, orgId, 'dashboard:view');
        const comment = await addComment(reviewId, userId, text);
        return NextResponse.json({ comment }, { status: 201 });
      }

      case 'annotate': {
        const { reviewId, type, note, dimension, severity } = body;
        if (!reviewId || !type || !note) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'reviewId, type, and note required' } }, { status: 400 });
        await requirePermission(userId, orgId, 'review:create');
        const annotation = await addAnnotation(reviewId, userId, type as AnnotationType, note, { dimension, severity });
        return NextResponse.json({ annotation }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'action must be: create, approve, reject, request_changes, comment, or annotate' } }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof RBACError) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    }
    console.error('Review action error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to perform review action' } }, { status: 500 });
  }
}
