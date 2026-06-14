-- ============================================================
-- DriftGuard Enterprise Foundation Migration
-- Phase 1: Multi-tenancy, RBAC, Environments
-- ============================================================

-- ─── Organizations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Organization Members + RBAC ─────────────────────────────
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  role TEXT NOT NULL DEFAULT 'developer'
    CHECK (role IN ('owner', 'admin', 'developer', 'reviewer', 'viewer')),
  invited_by TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ─── Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, slug)
);

-- ─── Environments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL
    CHECK (name IN ('development', 'staging', 'production')),
  is_production BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- ─── Extend Core Tables with Tenant Columns ─────────────────
-- These are additive — they don't break existing data.
-- Existing rows get NULL, which is handled by app logic (seed data fallback).

ALTER TABLE endpoints
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

ALTER TABLE ai_responses
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

ALTER TABLE behavioral_fingerprints
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

ALTER TABLE behavioral_diffs
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

ALTER TABLE probe_results
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

-- ─── Deployments (Phase 3 prep — create table now) ──────────
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  endpoint_id TEXT NOT NULL,
  source_environment_id UUID REFERENCES environments(id),
  target_environment_id UUID NOT NULL REFERENCES environments(id),
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'evaluating', 'awaiting_approval', 'approved', 'rejected', 'deployed', 'rolled_back')),
  fingerprint_id TEXT,
  diff_id TEXT,
  dataset_eval_id TEXT,
  probe_run_id TEXT,
  verdict TEXT CHECK (verdict IN ('PASS', 'WARN', 'BLOCK')),
  approved_by TEXT,
  rejected_by TEXT,
  rejection_reason TEXT,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  audit JSONB DEFAULT '[]'
);

-- ─── Evaluation Datasets (Phase 2 prep) ─────────────────────
CREATE TABLE IF NOT EXISTS eval_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  version INT NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  response_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS dataset_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES eval_datasets(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  expected_response TEXT,
  category TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ─── Reviews (Phase 3 prep) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  deployment_id UUID REFERENCES deployments(id),
  diff_id TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'approved', 'rejected', 'needs_changes')),
  assigned_to TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('hallucination', 'toxicity', 'wrong_tone', 'regression', 'pii', 'bias', 'other')),
  dimension TEXT,
  note TEXT DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Traces (Phase 2 prep) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  endpoint_id TEXT NOT NULL,
  environment_id UUID REFERENCES environments(id),
  version TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  system_prompt TEXT,
  user_query TEXT NOT NULL,
  retrieved_context JSONB,
  tool_calls JSONB,
  model_config JSONB,
  latency_ms INT NOT NULL DEFAULT 0,
  token_count INT NOT NULL DEFAULT 0,
  final_response TEXT NOT NULL,
  error TEXT,
  session_id TEXT,
  end_user_id TEXT
);

-- ─── Audit Logs (Phase 5 prep) ──────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Scoped API Keys v2 (Phase 5 prep) ──────────────────────
CREATE TABLE IF NOT EXISTS api_keys_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default Key',
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- first 12 chars for identification
  scopes TEXT[] DEFAULT '{ingest,read}',
  environment_id UUID REFERENCES environments(id),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_rotated_at TIMESTAMPTZ,
  total_requests INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT false
);

-- ─── Alert Channels (Phase 5 prep) ──────────────────────────
CREATE TABLE IF NOT EXISTS alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL
    CHECK (type IN ('email', 'slack', 'teams', 'discord', 'webhook')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- encrypted webhook URLs, emails
  alert_types TEXT[] DEFAULT '{}',
  min_severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (min_severity IN ('info', 'warning', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Alert Thresholds (per-project) ─────────────────────────
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hallucination_warn FLOAT NOT NULL DEFAULT 0.1,
  hallucination_block FLOAT NOT NULL DEFAULT 0.2,
  latency_warn_ms INT NOT NULL DEFAULT 100,
  tone_shift_warn FLOAT NOT NULL DEFAULT 0.15,
  similarity_block FLOAT NOT NULL DEFAULT 0.7,
  UNIQUE(project_id)
);


-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

-- Users can only see orgs they belong to
CREATE POLICY "member_orgs" ON organizations
  FOR ALL USING (
    id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "own_memberships" ON org_members
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "org_projects" ON projects
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "project_environments" ON environments
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "org_deployments" ON deployments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "org_datasets" ON eval_datasets
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "dataset_entries_access" ON dataset_entries
  FOR ALL USING (
    dataset_id IN (
      SELECT id FROM eval_datasets WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true)
      )
    )
  );

CREATE POLICY "org_reviews" ON reviews
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "review_comments_access" ON review_comments
  FOR ALL USING (
    review_id IN (
      SELECT id FROM reviews WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true)
      )
    )
  );

CREATE POLICY "review_annotations_access" ON review_annotations
  FOR ALL USING (
    review_id IN (
      SELECT id FROM reviews WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true)
      )
    )
  );

CREATE POLICY "org_traces" ON traces
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "org_audit_logs" ON audit_logs
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "org_api_keys" ON api_keys_v2
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "org_alert_channels" ON alert_channels
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = current_setting('app.user_id', true))
  );

CREATE POLICY "project_thresholds" ON alert_thresholds
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members m ON m.org_id = p.org_id
      WHERE m.user_id = current_setting('app.user_id', true)
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Tenant hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_environments_project ON environments(project_id);

-- Core table tenant scoping
CREATE INDEX IF NOT EXISTS idx_endpoints_org_project ON endpoints(org_id, project_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_responses_org ON ai_responses(org_id, endpoint_id, version);
CREATE INDEX IF NOT EXISTS idx_fingerprints_env ON behavioral_fingerprints(environment_id, endpoint_id, version);
CREATE INDEX IF NOT EXISTS idx_diffs_env ON behavioral_diffs(environment_id, endpoint_id);

-- Deployments
CREATE INDEX IF NOT EXISTS idx_deployments_org ON deployments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_deployments_endpoint ON deployments(endpoint_id, target_environment_id);

-- Traces
CREATE INDEX IF NOT EXISTS idx_traces_endpoint ON traces(endpoint_id, version, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traces_session ON traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_org ON traces(org_id, timestamp DESC);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_logs(org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp DESC);

-- API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_v2_prefix ON api_keys_v2(key_prefix) WHERE NOT revoked;
CREATE INDEX IF NOT EXISTS idx_api_keys_v2_org ON api_keys_v2(org_id) WHERE NOT revoked;
