-- DriftGuard User Isolation Migration
-- Run this in Supabase SQL Editor

-- Add user_id to all tables
ALTER TABLE endpoints ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_responses ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE behavioral_fingerprints ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE behavioral_diffs ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE probe_results ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

-- User API keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL UNIQUE DEFAULT concat('dg_live_', replace(gen_random_uuid()::text, '-', '')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT false,
  total_endpoints INTEGER DEFAULT 0,
  total_responses_ingested INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free'
);

-- Enable RLS on all tables
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users see only their own data
CREATE POLICY "users_own_endpoints" ON endpoints
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_responses" ON ai_responses
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_fingerprints" ON behavioral_fingerprints
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_diffs" ON behavioral_diffs
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_probes" ON probe_results
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_alerts" ON alerts
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_api_keys" ON user_api_keys
  FOR ALL USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "users_own_profiles" ON user_profiles
  FOR ALL USING (user_id = current_setting('app.user_id', true));

-- Indexes for user_id lookups
CREATE INDEX IF NOT EXISTS idx_endpoints_user ON endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON ai_responses(user_id, endpoint_id, version);
CREATE INDEX IF NOT EXISTS idx_fingerprints_user ON behavioral_fingerprints(user_id, endpoint_id);
CREATE INDEX IF NOT EXISTS idx_diffs_user ON behavioral_diffs(user_id, endpoint_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id, acknowledged);
CREATE INDEX IF NOT EXISTS idx_api_keys ON user_api_keys(api_key);
