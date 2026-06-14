import { isSupabaseConfigured, supabaseAdmin } from './supabase';

// ============================================================
// Environment Promotion Engine
// Manages endpoint promotion across dev → staging → production
// ============================================================

export interface PromotionResult {
  success: boolean;
  deploymentId?: string;
  message: string;
}

export interface EnvironmentComparison {
  endpointId: string;
  sourceEnv: string;
  targetEnv: string;
  sourceVersion?: string;
  targetVersion?: string;
  hasDiff: boolean;
  diffId?: string;
  status: 'ahead' | 'behind' | 'in_sync' | 'diverged' | 'no_data';
}

/**
 * Get environment promotion status for an endpoint.
 * Shows which environments are ahead/behind/in sync.
 */
export async function getPromotionStatus(
  endpointId: string,
  projectId: string
): Promise<EnvironmentComparison[]> {
  if (!isSupabaseConfigured()) {
    // Return demo data
    return [
      {
        endpointId,
        sourceEnv: 'development',
        targetEnv: 'staging',
        sourceVersion: 'v1.4.0',
        targetVersion: 'v1.3.0',
        hasDiff: true,
        status: 'ahead',
      },
      {
        endpointId,
        sourceEnv: 'staging',
        targetEnv: 'production',
        sourceVersion: 'v1.3.0',
        targetVersion: 'v1.3.0',
        hasDiff: false,
        status: 'in_sync',
      },
    ];
  }

  try {
    // Get environments for the project
    const { data: envs } = await supabaseAdmin
      .from('environments')
      .select('id, name, is_production')
      .eq('project_id', projectId)
      .order('is_production', { ascending: true });

    if (!envs || envs.length < 2) return [];

    const comparisons: EnvironmentComparison[] = [];
    const envOrder = ['development', 'staging', 'production'];
    const sorted = envs.sort((a: any, b: any) => envOrder.indexOf(a.name) - envOrder.indexOf(b.name));

    for (let i = 0; i < sorted.length - 1; i++) {
      const source = sorted[i];
      const target = sorted[i + 1];

      // Get latest fingerprint version for each environment
      const [sourceFingerprint, targetFingerprint] = await Promise.all([
        getLatestVersion(endpointId, source.id),
        getLatestVersion(endpointId, target.id),
      ]);

      let status: EnvironmentComparison['status'] = 'no_data';
      if (sourceFingerprint && targetFingerprint) {
        if (sourceFingerprint === targetFingerprint) status = 'in_sync';
        else status = 'ahead';
      } else if (sourceFingerprint && !targetFingerprint) {
        status = 'ahead';
      } else if (!sourceFingerprint && targetFingerprint) {
        status = 'behind';
      }

      comparisons.push({
        endpointId,
        sourceEnv: source.name,
        targetEnv: target.name,
        sourceVersion: sourceFingerprint || undefined,
        targetVersion: targetFingerprint || undefined,
        hasDiff: status !== 'in_sync' && status !== 'no_data',
        status,
      });
    }

    return comparisons;
  } catch (error) {
    console.error('Failed to get promotion status:', error);
    return [];
  }
}

/**
 * Compare behavior of an endpoint across two environments.
 */
export async function compareEnvironments(
  endpointId: string,
  sourceEnvId: string,
  targetEnvId: string
): Promise<{
  sourceVersion?: string;
  targetVersion?: string;
  diffAvailable: boolean;
  fingerprintDelta?: {
    hallucinationDelta: number;
    toneShiftDelta: number;
    latencyDelta: number;
    similarityScore: number;
  };
}> {
  if (!isSupabaseConfigured()) {
    return {
      sourceVersion: 'v1.4.0',
      targetVersion: 'v1.3.0',
      diffAvailable: true,
      fingerprintDelta: {
        hallucinationDelta: 0.03,
        toneShiftDelta: 0.08,
        latencyDelta: 45,
        similarityScore: 0.92,
      },
    };
  }

  try {
    const [sourceVersion, targetVersion] = await Promise.all([
      getLatestVersion(endpointId, sourceEnvId),
      getLatestVersion(endpointId, targetEnvId),
    ]);

    if (!sourceVersion || !targetVersion) {
      return { sourceVersion: sourceVersion || undefined, targetVersion: targetVersion || undefined, diffAvailable: false };
    }

    // Check if a diff already exists between these versions
    const { data: diff } = await supabaseAdmin
      .from('behavioral_diffs')
      .select('similarity_score, hallucination_delta, tone_shift, latency_delta')
      .eq('endpoint_id', endpointId)
      .eq('base_version', targetVersion)
      .eq('new_version', sourceVersion)
      .single();

    return {
      sourceVersion,
      targetVersion,
      diffAvailable: !!diff,
      fingerprintDelta: diff ? {
        hallucinationDelta: diff.hallucination_delta,
        toneShiftDelta: diff.tone_shift,
        latencyDelta: diff.latency_delta,
        similarityScore: diff.similarity_score,
      } : undefined,
    };
  } catch {
    return { diffAvailable: false };
  }
}

/**
 * Get the latest fingerprinted version for an endpoint in an environment.
 */
async function getLatestVersion(endpointId: string, environmentId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('behavioral_fingerprints')
      .select('version')
      .eq('endpoint_id', endpointId)
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data?.version || null;
  } catch {
    return null;
  }
}
