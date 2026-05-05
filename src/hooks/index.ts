'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Endpoint, BehavioralFingerprint, BehavioralDiff, Alert, ProbeResult } from '@/types';
import { seedEndpoints, seedFingerprints, seedDiffs, seedAlerts, seedProbeResults } from '@/lib/seed';

// ============================================================
// useDriftGuard — Master state hook
// All dashboard pages read from this single source of truth.
// When you add/modify data here, ALL pages update instantly.
// ============================================================
export function useDriftGuard() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(seedEndpoints);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(seedEndpoints[0]);
  const [fingerprints, setFingerprints] = useState<BehavioralFingerprint[]>(seedFingerprints);
  const [diffs, setDiffs] = useState<BehavioralDiff[]>(seedDiffs);
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [probeResults, setProbeResults] = useState<ProbeResult[]>(seedProbeResults);
  const [isLoading, setIsLoading] = useState(false);

  // ── Endpoint CRUD ──────────────────────────────────────────
  const addEndpoint = useCallback((endpoint: Endpoint) => {
    setEndpoints(prev => {
      // Avoid duplicates
      if (prev.some(e => e.id === endpoint.id)) return prev;
      return [...prev, endpoint];
    });
  }, []);

  const removeEndpoint = useCallback((endpointId: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== endpointId));
    setFingerprints(prev => prev.filter(f => f.endpointId !== endpointId));
    setDiffs(prev => prev.filter(d => d.endpointId !== endpointId));
    setAlerts(prev => prev.filter(a => a.endpointId !== endpointId));
    // If the removed endpoint was selected, switch to first available
    setSelectedEndpoint(prev => {
      if (prev?.id === endpointId) {
        const remaining = endpoints.filter(e => e.id !== endpointId);
        return remaining[0] || null;
      }
      return prev;
    });
  }, [endpoints]);

  // ── Data ingestion tracking ────────────────────────────────
  // When a response is ingested for an endpoint, update its count and
  // auto-generate fingerprint/diff data so other pages reflect the change
  const ingestResponse = useCallback((endpointId: string, version: string) => {
    // Update endpoint response count and last active time
    setEndpoints(prev => prev.map(ep => {
      if (ep.id !== endpointId) return ep;
      const newTotal = ep.totalResponses + 1;
      // Auto-determine status based on thresholds
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (newTotal > 100) status = 'warning';  // Many responses might indicate issues
      
      // Check if there are regressions for this endpoint
      const epDiffs = diffs.filter(d => d.endpointId === endpointId);
      const latestDiff = epDiffs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (latestDiff?.verdict === 'BLOCK') status = 'critical';
      else if (latestDiff?.verdict === 'WARN') status = 'warning';

      return {
        ...ep,
        totalResponses: newTotal,
        latestVersion: version,
        lastActiveAt: new Date(),
        status,
      };
    }));
  }, [diffs]);

  // ── Batch ingest complete → auto-generate fingerprint ──────
  const onBatchComplete = useCallback((endpointId: string, version: string, count: number) => {
    // Generate a new fingerprint for this version
    const existingFp = fingerprints.find(f => f.endpointId === endpointId && f.version === version);
    if (!existingFp) {
      const newFp: BehavioralFingerprint = {
        id: `fp-${endpointId}-${version}-${Date.now()}`,
        version,
        endpointId,
        createdAt: new Date(),
        semanticCentroid: Array(768).fill(0).map(() => Math.random() * 0.1 - 0.05),
        toneDistribution: {
          formal: 0.3 + Math.random() * 0.2,
          casual: 0.1 + Math.random() * 0.15,
          technical: 0.2 + Math.random() * 0.2,
          empathetic: 0.15 + Math.random() * 0.15,
        },
        refusalRate: Math.random() * 0.08,
        hallucinationScore: Math.random() * 0.15, // Mostly healthy
        avgLatencyMs: 350 + Math.random() * 200,
        avgTokenCount: 120 + Math.random() * 100,
        topicConsistency: 0.85 + Math.random() * 0.1,
        outputLengthP50: 250 + Math.random() * 100,
        outputLengthP95: 500 + Math.random() * 200,
        sampleCount: count,
      };
      setFingerprints(prev => [...prev, newFp]);

      // If there's a previous version, auto-generate a diff
      const allVersions = fingerprints
        .filter(f => f.endpointId === endpointId)
        .map(f => f.version)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort();
      
      if (allVersions.length > 0) {
        const prevVersion = allVersions[allVersions.length - 1];
        const prevFp = fingerprints.find(f => f.endpointId === endpointId && f.version === prevVersion);
        
        if (prevFp) {
          const hallDelta = newFp.hallucinationScore - prevFp.hallucinationScore;
          const latDelta = newFp.avgLatencyMs - prevFp.avgLatencyMs;
          const tcDelta = newFp.topicConsistency - prevFp.topicConsistency;

          // Determine verdict based on deltas
          let verdict: 'PASS' | 'WARN' | 'BLOCK' = 'PASS';
          let verdictReason = 'Behavioral fingerprint is stable. No significant regressions detected.';
          const regressions: any[] = [];
          const improvements: any[] = [];

          if (hallDelta > 0.15) {
            verdict = 'BLOCK';
            verdictReason = `Critical: hallucination score increased ${(hallDelta * 100).toFixed(0)}%. Deployment blocked.`;
            regressions.push({ dimension: 'Hallucination Score', baseValue: prevFp.hallucinationScore, newValue: newFp.hallucinationScore, delta: hallDelta, severity: 'critical' });
          } else if (hallDelta > 0.05) {
            verdict = 'WARN';
            verdictReason = `Warning: hallucination score increased ${(hallDelta * 100).toFixed(0)}%. Monitor closely.`;
            regressions.push({ dimension: 'Hallucination Score', baseValue: prevFp.hallucinationScore, newValue: newFp.hallucinationScore, delta: hallDelta, severity: 'high' });
          }

          if (latDelta > 100) {
            if (verdict === 'PASS') verdict = 'WARN';
            regressions.push({ dimension: 'Avg Latency', baseValue: prevFp.avgLatencyMs, newValue: newFp.avgLatencyMs, delta: latDelta, severity: 'medium' });
          } else if (latDelta < -50) {
            improvements.push({ dimension: 'Avg Latency', baseValue: prevFp.avgLatencyMs, newValue: newFp.avgLatencyMs, delta: latDelta });
          }

          if (tcDelta < -0.1) {
            if (verdict === 'PASS') verdict = 'WARN';
            regressions.push({ dimension: 'Topic Consistency', baseValue: prevFp.topicConsistency, newValue: newFp.topicConsistency, delta: tcDelta, severity: 'high' });
          } else if (tcDelta > 0.05) {
            improvements.push({ dimension: 'Topic Consistency', baseValue: prevFp.topicConsistency, newValue: newFp.topicConsistency, delta: tcDelta });
          }

          if (hallDelta < -0.02) {
            improvements.push({ dimension: 'Hallucination Score', baseValue: prevFp.hallucinationScore, newValue: newFp.hallucinationScore, delta: hallDelta });
          }

          const newDiff: BehavioralDiff = {
            id: `diff-${endpointId}-${prevVersion}-${version}-${Date.now()}`,
            baseVersion: prevVersion,
            newVersion: version,
            endpointId,
            createdAt: new Date(),
            similarityScore: 0.7 + Math.random() * 0.25,
            regressions,
            improvements,
            toneShift: Math.random() * 0.3,
            hallucinationDelta: hallDelta,
            latencyDelta: latDelta,
            verdict,
            verdictReason,
          };
          setDiffs(prev => [...prev, newDiff]);

          // Generate alerts for regressions
          if (verdict === 'BLOCK' || verdict === 'WARN') {
            const newAlert: Alert = {
              id: `alert-${Date.now()}`,
              type: hallDelta > 0.1 ? 'hallucination_spike' : 'regression',
              endpointId,
              version,
              message: verdictReason,
              severity: verdict === 'BLOCK' ? 'critical' : 'warning',
              timestamp: new Date(),
              acknowledged: false,
            };
            setAlerts(prev => [newAlert, ...prev]);
          }

          // Update endpoint status based on verdict
          setEndpoints(prev => prev.map(ep => {
            if (ep.id !== endpointId) return ep;
            return {
              ...ep,
              status: verdict === 'BLOCK' ? 'critical' : verdict === 'WARN' ? 'warning' : ep.status,
            };
          }));
        }
      }
    }
  }, [fingerprints, diffs]);

  const fetchEndpoints = useCallback(async () => {
    // Merge seed + API endpoints
    try {
      const res = await fetch('/api/endpoints');
      const data = await res.json();
      if (data.endpoints?.length) {
        const apiEndpoints: Endpoint[] = data.endpoints.map((e: any) => ({
          id: e.id,
          name: e.name || e.id,
          description: e.description || '',
          createdAt: new Date(e.created_at || e.createdAt || Date.now()),
          latestVersion: e.latest_version || e.latestVersion || 'v1.0.0',
          totalResponses: e.total_responses || e.totalResponses || 0,
          status: (e.status || 'healthy') as 'healthy' | 'warning' | 'critical',
          lastActiveAt: e.last_active_at ? new Date(e.last_active_at) : undefined,
        }));
        // Merge without duplicates
        setEndpoints(prev => {
          const ids = new Set(prev.map(e => e.id));
          const newOnes = apiEndpoints.filter(e => !ids.has(e.id));
          return [...prev, ...newOnes];
        });
      }
    } catch { /* API not available — seed data is fine */ }
  }, []);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  const fetchFingerprints = useCallback((endpointId: string) => {
    return fingerprints.filter(f => f.endpointId === endpointId);
  }, [fingerprints]);

  const fetchDiffs = useCallback((endpointId: string) => {
    return diffs.filter(d => d.endpointId === endpointId);
  }, [diffs]);

  const triggerFingerprint = useCallback(async (endpointId: string, version: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId, version }),
      });
      const data = await res.json();
      if (data.fingerprint) {
        setFingerprints(prev => [...prev, data.fingerprint]);
      }
      return data.fingerprint;
    } catch (e) {
      console.error('Fingerprint error:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerDiff = useCallback(async (endpointId: string, baseVersion: string, newVersion: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId, baseVersion, newVersion }),
      });
      const data = await res.json();
      if (data.diff) {
        setDiffs(prev => [...prev, data.diff]);
      }
      return data.diff;
    } catch (e) {
      console.error('Diff error:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runProbes = useCallback(async (endpointId: string, version: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/probes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId, version }),
      });
      const data = await res.json();
      if (data.results) {
        setProbeResults(data.results);
      }
      return data.results;
    } catch (e) {
      console.error('Probe error:', e);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  const selectEndpoint = useCallback((endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
  }, []);

  return {
    endpoints, selectedEndpoint, fingerprints, diffs, alerts, probeResults, isLoading,
    fetchEndpoints, fetchFingerprints, fetchDiffs, triggerFingerprint, triggerDiff,
    runProbes, acknowledgeAlert, selectEndpoint,
    // NEW: methods for real-time data flow
    addEndpoint, removeEndpoint, ingestResponse, onBatchComplete, setEndpoints,
  };
}

// ============================================================
// useBioluminescent — Mouse tracking for parallax
// ============================================================
export function useBioluminescent() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return mouse;
}

// ============================================================
// useScrollReveal — Intersection Observer entrance animation
// ============================================================
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        obs.disconnect();
      }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}

// ============================================================
// useAnimatedCounter — Count-up animation
// ============================================================
export function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  const start = useCallback(() => {
    setStarted(true);
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { value, start, started };
}
