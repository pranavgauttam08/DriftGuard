import { EvalDataset, DatasetEntry, EvalRun, EvalResult, EvalSummary } from '@/types/trace';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';
import { embedText, cosineSimilarity } from './embeddings';
import { v4 as uuid } from 'uuid';

// ============================================================
// Evaluation Datasets — CRUD + Evaluation Engine
// ============================================================

/**
 * Create a new evaluation dataset.
 */
export async function createDataset(
  orgId: string,
  name: string,
  description: string,
  createdBy: string,
  options: { projectId?: string; tags?: string[]; isPublic?: boolean } = {}
): Promise<EvalDataset> {
  const dataset: EvalDataset = {
    id: uuid(),
    orgId,
    projectId: options.projectId,
    name,
    description,
    version: 1,
    tags: options.tags || [],
    responseCount: 0,
    createdAt: new Date(),
    createdBy,
    isPublic: options.isPublic || false,
  };

  if (!isSupabaseConfigured()) return dataset;

  const { error } = await supabaseAdmin
    .from('eval_datasets')
    .insert({
      id: dataset.id,
      org_id: orgId,
      project_id: options.projectId || null,
      name,
      description,
      version: 1,
      tags: options.tags || [],
      response_count: 0,
      created_by: createdBy,
      is_public: options.isPublic || false,
    });

  if (error) throw new Error(`Failed to create dataset: ${error.message}`);
  return dataset;
}

/**
 * List datasets for an organization.
 */
export async function listDatasets(orgId: string, projectId?: string): Promise<EvalDataset[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabaseAdmin.from('eval_datasets').select('*').eq('org_id', orgId);
  if (projectId) query = query.eq('project_id', projectId);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list datasets: ${error.message}`);

  return (data || []).map(mapDatasetRow);
}

/**
 * Add entries to a dataset.
 */
export async function addEntries(
  datasetId: string,
  entries: Array<{ query: string; expectedResponse?: string; category?: string; metadata?: Record<string, any> }>
): Promise<DatasetEntry[]> {
  const created: DatasetEntry[] = entries.map(e => ({
    id: uuid(),
    datasetId,
    query: e.query,
    expectedResponse: e.expectedResponse,
    category: e.category,
    metadata: e.metadata || {},
  }));

  if (!isSupabaseConfigured()) return created;

  const { error } = await supabaseAdmin
    .from('dataset_entries')
    .insert(created.map(e => ({
      id: e.id,
      dataset_id: datasetId,
      query: e.query,
      expected_response: e.expectedResponse || null,
      category: e.category || null,
      metadata: e.metadata,
    })));

  if (error) throw new Error(`Failed to add entries: ${error.message}`);

  // Update response count
  await supabaseAdmin
    .from('eval_datasets')
    .update({ response_count: created.length })
    .eq('id', datasetId);

  return created;
}

/**
 * Get entries for a dataset (with pagination).
 */
export async function getEntries(
  datasetId: string,
  options: { page?: number; limit?: number; category?: string } = {}
): Promise<{ entries: DatasetEntry[]; total: number }> {
  if (!isSupabaseConfigured()) return { entries: [], total: 0 };

  const page = options.page || 1;
  const limit = Math.min(options.limit || 50, 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('dataset_entries')
    .select('*', { count: 'exact' })
    .eq('dataset_id', datasetId);

  if (options.category) query = query.eq('category', options.category);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to get entries: ${error.message}`);

  return {
    entries: (data || []).map(mapEntryRow),
    total: count || 0,
  };
}

/**
 * Import a dataset from JSON or CSV data.
 */
export async function importDataset(
  orgId: string,
  name: string,
  format: 'json' | 'csv',
  rawData: string,
  createdBy: string,
  options: { projectId?: string; tags?: string[] } = {}
): Promise<{ dataset: EvalDataset; entriesImported: number }> {
  let entries: Array<{ query: string; expectedResponse?: string; category?: string }> = [];

  if (format === 'json') {
    const parsed = JSON.parse(rawData);
    entries = (Array.isArray(parsed) ? parsed : []).map((item: any) => ({
      query: item.query || item.prompt || item.input || '',
      expectedResponse: item.expectedResponse || item.expected || item.output || undefined,
      category: item.category || item.tag || undefined,
    })).filter((e: any) => e.query.length > 0);
  } else if (format === 'csv') {
    const lines = rawData.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const queryIdx = headers.findIndex(h => ['query', 'prompt', 'input', 'question'].includes(h));
    const respIdx = headers.findIndex(h => ['expected', 'expectedresponse', 'output', 'answer', 'response'].includes(h));
    const catIdx = headers.findIndex(h => ['category', 'tag', 'type'].includes(h));

    if (queryIdx === -1) throw new Error('CSV must have a "query" or "prompt" column');

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols[queryIdx]?.trim()) {
        entries.push({
          query: cols[queryIdx].trim(),
          expectedResponse: respIdx >= 0 ? cols[respIdx]?.trim() : undefined,
          category: catIdx >= 0 ? cols[catIdx]?.trim() : undefined,
        });
      }
    }
  }

  if (entries.length === 0) throw new Error('No valid entries found in import data');

  const dataset = await createDataset(orgId, name, `Imported ${entries.length} entries (${format})`, createdBy, {
    projectId: options.projectId,
    tags: [...(options.tags || []), 'imported', format],
  });

  await addEntries(dataset.id, entries);
  dataset.responseCount = entries.length;

  return { dataset, entriesImported: entries.length };
}

/**
 * Export a dataset to JSON or CSV.
 */
export async function exportDataset(
  datasetId: string,
  format: 'json' | 'csv'
): Promise<string> {
  const { entries } = await getEntries(datasetId, { limit: 10000 });

  if (format === 'json') {
    return JSON.stringify(entries.map(e => ({
      query: e.query,
      expectedResponse: e.expectedResponse,
      category: e.category,
      metadata: e.metadata,
    })), null, 2);
  }

  // CSV format
  const headers = ['query', 'expectedResponse', 'category'];
  const rows = entries.map(e =>
    [e.query, e.expectedResponse || '', e.category || '']
      .map(v => `"${v.replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Evaluate an endpoint against a dataset.
 * This is the core "benchmark your AI" function.
 */
export async function evaluateAgainstDataset(
  datasetId: string,
  endpointId: string,
  version: string,
  responseGetter: (query: string) => Promise<{ response: string; latencyMs: number }>
): Promise<EvalRun> {
  const { entries } = await getEntries(datasetId, { limit: 10000 });

  const run: EvalRun = {
    id: uuid(),
    datasetId,
    endpointId,
    version,
    status: 'running',
    totalEntries: entries.length,
    completedEntries: 0,
    results: [],
    summary: { totalEntries: entries.length, passedCount: 0, failedCount: 0, passRate: 0, avgSimilarity: 0, avgLatencyMs: 0, regressions: [] },
    startedAt: new Date(),
  };

  const results: EvalResult[] = [];
  let totalSimilarity = 0;
  let totalLatency = 0;

  for (const entry of entries) {
    try {
      const { response, latencyMs } = await responseGetter(entry.query);

      let semanticSimilarity = 1;
      if (entry.expectedResponse) {
        const [embActual, embExpected] = await Promise.all([
          embedText(response),
          embedText(entry.expectedResponse),
        ]);
        semanticSimilarity = cosineSimilarity(embActual, embExpected);
      }

      const passed = semanticSimilarity >= 0.7;

      results.push({
        entryId: entry.id,
        query: entry.query,
        expectedResponse: entry.expectedResponse,
        actualResponse: response,
        semanticSimilarity,
        latencyMs,
        passed,
      });

      totalSimilarity += semanticSimilarity;
      totalLatency += latencyMs;
      run.completedEntries++;
    } catch (error: any) {
      results.push({
        entryId: entry.id,
        query: entry.query,
        expectedResponse: entry.expectedResponse,
        actualResponse: '',
        semanticSimilarity: 0,
        latencyMs: 0,
        passed: false,
        notes: `Error: ${error.message}`,
      });
      run.completedEntries++;
    }
  }

  run.results = results;
  run.status = 'completed';
  run.completedAt = new Date();

  // Compute summary
  const passedCount = results.filter(r => r.passed).length;
  run.summary = {
    totalEntries: entries.length,
    passedCount,
    failedCount: entries.length - passedCount,
    passRate: entries.length > 0 ? passedCount / entries.length : 0,
    avgSimilarity: entries.length > 0 ? totalSimilarity / entries.length : 0,
    avgLatencyMs: entries.length > 0 ? totalLatency / entries.length : 0,
    regressions: results
      .filter(r => !r.passed && r.semanticSimilarity < 0.5)
      .map(r => r.query.slice(0, 50)),
  };

  return run;
}

// ============================================================
// Row mappers
// ============================================================

function mapDatasetRow(row: any): EvalDataset {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    version: row.version,
    tags: row.tags || [],
    responseCount: row.response_count,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    isPublic: row.is_public,
  };
}

function mapEntryRow(row: any): DatasetEntry {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    query: row.query,
    expectedResponse: row.expected_response,
    category: row.category,
    metadata: row.metadata || {},
  };
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
