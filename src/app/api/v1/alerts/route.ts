import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { listAlertEvents, listChannels, createChannel, deleteChannel, toggleChannel, getThresholds, updateThresholds, acknowledgeAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/alerts — List alert events or channels
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const resource = searchParams.get('resource') || 'events'; // 'events' | 'channels' | 'thresholds'

  if (!orgId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });

  try {
    await requirePermission(userId, orgId, 'dashboard:view');

    switch (resource) {
      case 'events': {
        const type = searchParams.get('type') || undefined;
        const severity = searchParams.get('severity') || undefined;
        const limit = parseInt(searchParams.get('limit') || '25');
        const offset = parseInt(searchParams.get('offset') || '0');
        const result = await listAlertEvents(orgId, { type: type as any, severity: severity as any, limit, offset });
        return NextResponse.json(result);
      }
      case 'channels': {
        const channels = await listChannels(orgId);
        return NextResponse.json({ channels });
      }
      case 'thresholds': {
        const projectId = searchParams.get('projectId') || undefined;
        const thresholds = await getThresholds(orgId, projectId);
        return NextResponse.json({ thresholds });
      }
      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'resource must be: events, channels, or thresholds' } }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof RBACError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    console.error('Alerts GET error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch alerts data' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/alerts — Create channel, update thresholds, acknowledge alert
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { action, orgId } = body;

    if (!orgId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });

    switch (action) {
      case 'create_channel': {
        await requirePermission(userId, orgId, 'settings:manage');
        const { type, name, config, alertTypes, minSeverity, enabled } = body;
        if (!type || !name || !config) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'type, name, and config are required' } }, { status: 400 });
        const channel = await createChannel({ orgId, type, name, config, alertTypes: alertTypes || [], minSeverity: minSeverity || 'warning', enabled: enabled !== false });
        return NextResponse.json({ channel }, { status: 201 });
      }

      case 'delete_channel': {
        await requirePermission(userId, orgId, 'settings:manage');
        const { channelId } = body;
        if (!channelId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'channelId is required' } }, { status: 400 });
        await deleteChannel(channelId, orgId);
        return NextResponse.json({ message: 'Channel deleted' });
      }

      case 'toggle_channel': {
        await requirePermission(userId, orgId, 'settings:manage');
        const { channelId: toggleId, enabled: toggleEnabled } = body;
        if (!toggleId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'channelId is required' } }, { status: 400 });
        await toggleChannel(toggleId, toggleEnabled, orgId);
        return NextResponse.json({ message: `Channel ${toggleEnabled ? 'enabled' : 'disabled'}` });
      }

      case 'update_thresholds': {
        await requirePermission(userId, orgId, 'settings:manage');
        const { projectId, thresholds } = body;
        const updated = await updateThresholds(orgId, thresholds, projectId);
        return NextResponse.json({ thresholds: updated });
      }

      case 'acknowledge': {
        await requirePermission(userId, orgId, 'dashboard:view');
        const { eventId } = body;
        if (!eventId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'eventId is required' } }, { status: 400 });
        await acknowledgeAlert(eventId, userId);
        return NextResponse.json({ message: 'Alert acknowledged' });
      }

      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'action must be: create_channel, delete_channel, toggle_channel, update_thresholds, or acknowledge' } }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof RBACError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    console.error('Alerts POST error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to process alert action' } }, { status: 500 });
  }
}
