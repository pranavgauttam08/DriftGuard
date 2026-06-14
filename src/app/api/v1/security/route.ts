import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission, RBACError } from '@/lib/rbac';
import { queryAuditLogs, exportAuditLogs } from '@/lib/security/audit';
import { createAPIKey, listAPIKeys, revokeAPIKey, rotateAPIKey } from '@/lib/security/api-keys';
import { runSOC2Checks, runGDPRChecks, generateComplianceExport } from '@/lib/security/compliance';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/security — Audit logs, API keys, compliance
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const resource = searchParams.get('resource') || 'audit_logs';

  if (!orgId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });

  try {
    await requirePermission(userId, orgId, 'settings:manage');

    switch (resource) {
      case 'audit_logs': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const action = searchParams.get('action') || undefined;
        const resourceType = searchParams.get('resourceType') || undefined;
        const result = await queryAuditLogs(orgId, { action: action as any, resourceType: resourceType as any, limit, offset });
        return NextResponse.json(result);
      }
      case 'api_keys': {
        const keys = await listAPIKeys(orgId);
        return NextResponse.json({ keys });
      }
      case 'compliance_soc2': {
        const report = await runSOC2Checks(orgId);
        return NextResponse.json({ report });
      }
      case 'compliance_gdpr': {
        const report = await runGDPRChecks(orgId);
        return NextResponse.json({ report });
      }
      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'resource must be: audit_logs, api_keys, compliance_soc2, compliance_gdpr' } }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof RBACError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    console.error('Security GET error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch security data' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/security — Create API key, revoke, rotate, export
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });

  try {
    const body = await request.json();
    const { action, orgId } = body;

    if (!orgId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } }, { status: 400 });
    await requirePermission(userId, orgId, 'settings:manage');

    switch (action) {
      case 'create_api_key': {
        const { name, scopes, environmentId, expiresInDays } = body;
        if (!name || !scopes) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'name and scopes are required' } }, { status: 400 });
        const result = await createAPIKey(orgId, userId, name, scopes, { environmentId, expiresInDays });
        return NextResponse.json({ key: result.key, plainTextKey: result.plainTextKey }, { status: 201 });
      }

      case 'revoke_api_key': {
        const { keyId } = body;
        if (!keyId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'keyId is required' } }, { status: 400 });
        await revokeAPIKey(keyId, userId, orgId);
        return NextResponse.json({ message: 'API key revoked' });
      }

      case 'rotate_api_key': {
        const { keyId: rotateKeyId } = body;
        if (!rotateKeyId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'keyId is required' } }, { status: 400 });
        const rotated = await rotateAPIKey(rotateKeyId, userId, orgId);
        return NextResponse.json({ key: rotated.key, plainTextKey: rotated.plainTextKey });
      }

      case 'export_audit': {
        const { startDate, endDate } = body;
        if (!startDate || !endDate) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'startDate and endDate are required' } }, { status: 400 });
        const logs = await exportAuditLogs(orgId, new Date(startDate), new Date(endDate));
        return NextResponse.json({ logs, count: logs.length });
      }

      case 'export_compliance': {
        const { framework, startDate: compStart, endDate: compEnd } = body;
        if (!framework) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'framework is required' } }, { status: 400 });
        const exportResult = await generateComplianceExport(orgId, framework, {
          start: new Date(compStart || Date.now() - 30 * 86400000),
          end: new Date(compEnd || Date.now()),
        });
        return NextResponse.json(exportResult);
      }

      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'action must be: create_api_key, revoke_api_key, rotate_api_key, export_audit, export_compliance' } }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof RBACError) return NextResponse.json({ error: { code: 'FORBIDDEN', message: error.message } }, { status: error.statusCode });
    console.error('Security POST error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to process security action' } }, { status: 500 });
  }
}
