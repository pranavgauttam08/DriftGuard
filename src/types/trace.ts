// ============================================================
// DriftGuard Enterprise — Trace & Dataset Types
// ============================================================

// ── Traces ───────────────────────────────────────────────────
export interface Trace {
  id: string;
  orgId: string;
  endpointId: string;
  environmentId?: string;
  version: string;
  timestamp: Date;
  systemPrompt?: string;
  userQuery: string;
  retrievedContext?: RetrievedChunk[];
  toolCalls?: ToolCall[];
  modelConfig?: ModelConfig;
  latencyMs: number;
  tokenCount: number;
  finalResponse: string;
  error?: string;
  sessionId?: string;
  endUserId?: string; // end-user, not DriftGuard user
}

export interface RetrievedChunk {
  source: string;
  text: string;
  score?: number;
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output: string;
  latencyMs: number;
}

export interface ModelConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// ── Evaluation Datasets ──────────────────────────────────────
export interface EvalDataset {
  id: string;
  orgId: string;
  projectId?: string;
  name: string;
  description: string;
  version: number;
  tags: string[];
  responseCount: number;
  createdAt: Date;
  createdBy: string;
  isPublic: boolean;
}

export interface DatasetEntry {
  id: string;
  datasetId: string;
  query: string;
  expectedResponse?: string;
  category?: string;
  metadata: Record<string, any>;
}

// ── Evaluation Run ───────────────────────────────────────────
export interface EvalRun {
  id: string;
  datasetId: string;
  endpointId: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalEntries: number;
  completedEntries: number;
  results: EvalResult[];
  summary: EvalSummary;
  startedAt: Date;
  completedAt?: Date;
}

export interface EvalResult {
  entryId: string;
  query: string;
  expectedResponse?: string;
  actualResponse: string;
  semanticSimilarity: number;
  latencyMs: number;
  passed: boolean;
  notes?: string;
}

export interface EvalSummary {
  totalEntries: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  avgSimilarity: number;
  avgLatencyMs: number;
  regressions: string[]; // category names that regressed
}

// ── Database Row Types ───────────────────────────────────────
export interface TraceRow {
  id: string;
  org_id: string;
  endpoint_id: string;
  environment_id: string | null;
  version: string;
  timestamp: string;
  system_prompt: string | null;
  user_query: string;
  retrieved_context: any;
  tool_calls: any;
  model_config: any;
  latency_ms: number;
  token_count: number;
  final_response: string;
  error: string | null;
  session_id: string | null;
  end_user_id: string | null;
}

export interface EvalDatasetRow {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  description: string;
  version: number;
  tags: string[];
  response_count: number;
  created_at: string;
  created_by: string;
  is_public: boolean;
}

export interface DatasetEntryRow {
  id: string;
  dataset_id: string;
  query: string;
  expected_response: string | null;
  category: string | null;
  metadata: any;
}
