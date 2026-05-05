export interface AIResponse {
  id: string;
  endpointId: string;
  userId?: string;
  version: string;
  query: string;
  response: string;
  latencyMs: number;
  tokenCount: number;
  timestamp: Date;
  embedding?: number[];
}

export interface BehavioralFingerprint {
  id: string;
  version: string;
  endpointId: string;
  userId?: string;
  createdAt: Date;
  semanticCentroid: number[];
  toneDistribution: {
    formal: number;
    casual: number;
    technical: number;
    empathetic: number;
  };
  refusalRate: number;
  hallucinationScore: number;
  avgLatencyMs: number;
  avgTokenCount: number;
  topicConsistency: number;
  outputLengthP50: number;
  outputLengthP95: number;
  sampleCount: number;
}

export interface BehavioralDiff {
  id: string;
  baseVersion: string;
  newVersion: string;
  endpointId: string;
  userId?: string;
  createdAt: Date;
  similarityScore: number;
  regressions: RegressionItem[];
  improvements: ImprovementItem[];
  toneShift: number;
  hallucinationDelta: number;
  latencyDelta: number;
  verdict: 'PASS' | 'WARN' | 'BLOCK';
  verdictReason: string;
}

export interface RegressionItem {
  dimension: string;
  baseValue: number;
  newValue: number;
  delta: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ImprovementItem {
  dimension: string;
  baseValue: number;
  newValue: number;
  delta: number;
}

export interface ProbeResult {
  id: string;
  probeType: 'jailbreak' | 'injection' | 'hallucination' | 'off_topic' | 'tone_break';
  query: string;
  response: string;
  passed: boolean;
  score: number;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface Alert {
  id: string;
  type: 'regression' | 'hallucination_spike' | 'refusal_spike' | 'latency_degradation' | 'drift_detected';
  endpointId: string;
  userId?: string;
  version: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

export interface Endpoint {
  id: string;
  name: string;
  description: string;
  userId?: string;
  createdAt: Date;
  latestVersion: string;
  totalResponses: number;
  status: 'healthy' | 'warning' | 'critical';
  lastActiveAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  createdAt: Date;
  onboardingCompleted: boolean;
  totalEndpoints: number;
  totalResponsesIngested: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface UserApiKey {
  id: string;
  userId: string;
  apiKey: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  totalRequests: number;
}

export type DashboardView = 'overview' | 'timeline' | 'drift' | 'regressions' | 'probes' | 'alerts' | 'endpoints' | 'settings';

export interface AdversarialProbe {
  id: string;
  type: ProbeResult['probeType'];
  name: string;
  query: string;
  expectedBehavior: string;
}
