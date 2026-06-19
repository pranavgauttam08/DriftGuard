'use client';
import { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { loadCollection, saveCollection, COLLECTIONS } from '@/lib/persistence';
import {
  ScrollText, Search, Download, Filter, Clock, User, Server, Shield,
  GitBranch, Settings, CheckCircle2, XCircle, ChevronDown,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  category: 'deployment' | 'endpoint' | 'config' | 'auth' | 'compliance' | 'review';
  user: string;
  resource: string;
  details: string;
  timestamp: string;
  environment: string;
  severity: 'info' | 'warning' | 'critical';
}

const DEMO_AUDIT: AuditEntry[] = [
  { id: 'a-1', action: 'deployment.approved', category: 'deployment', user: 'admin@company.com', resource: 'support-bot v1.3.0', details: 'Approved deployment to staging after behavioral diff passed', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), environment: 'staging', severity: 'info' },
  { id: 'a-2', action: 'deployment.rejected', category: 'deployment', user: 'reviewer@company.com', resource: 'support-bot v1.4.0', details: 'Rejected: hallucination score increased 256%', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), environment: 'production', severity: 'critical' },
  { id: 'a-3', action: 'endpoint.created', category: 'endpoint', user: 'dev@company.com', resource: 'analytics-ai', details: 'New endpoint registered with default configuration', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), environment: 'development', severity: 'info' },
  { id: 'a-4', action: 'api_key.rotated', category: 'config', user: 'admin@company.com', resource: 'Production Ingestion Key', details: 'API key rotated as part of 30-day rotation policy', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), environment: 'production', severity: 'warning' },
  { id: 'a-5', action: 'member.invited', category: 'auth', user: 'owner@company.com', resource: 'reviewer@company.com', details: 'Invited as Auditor role to DriftGuard organization', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), environment: 'all', severity: 'info' },
  { id: 'a-6', action: 'probe.executed', category: 'compliance', user: 'system', resource: 'support-bot v1.4.0', details: 'Executed 20 adversarial probes: 16 passed, 4 failed (jailbreak, hallucination)', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), environment: 'staging', severity: 'warning' },
  { id: 'a-7', action: 'config.changed', category: 'config', user: 'admin@company.com', resource: 'Drift Thresholds', details: 'Updated hallucination block threshold from 0.2 to 0.15', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), environment: 'production', severity: 'info' },
  { id: 'a-8', action: 'review.submitted', category: 'review', user: 'reviewer@company.com', resource: 'code-assistant v1.4.0', details: 'Review approved with notes: latency improvement confirmed', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), environment: 'staging', severity: 'info' },
  { id: 'a-9', action: 'pii.detected', category: 'compliance', user: 'system', resource: 'support-bot', details: 'PII scan found 12 email addresses and 3 phone numbers in responses', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), environment: 'production', severity: 'warning' },
  { id: 'a-10', action: 'rollback.executed', category: 'deployment', user: 'admin@company.com', resource: 'onboarding-guide v1.3.0', details: 'Rolled back to v1.2.0 due to topic consistency regression', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), environment: 'production', severity: 'critical' },
  { id: 'a-11', action: 'fingerprint.generated', category: 'endpoint', user: 'system', resource: 'code-assistant v1.4.0', details: 'Auto-generated behavioral fingerprint from 25 response samples', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), environment: 'staging', severity: 'info' },
  { id: 'a-12', action: 'compliance.scan', category: 'compliance', user: 'system', resource: 'SOC2 / GDPR / HIPAA', details: 'Automated compliance scan completed. Score: 67/100', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), environment: 'all', severity: 'info' },
];

const CATEGORY_ICONS: Record<string, any> = {
  deployment: GitBranch,
  endpoint: Server,
  config: Settings,
  auth: User,
  compliance: Shield,
  review: CheckCircle2,
};

const CATEGORY_COLORS: Record<string, string> = {
  deployment: '#00E5FF',
  endpoint: '#00FFD1',
  config: '#FFB800',
  auth: '#D4A574',
  compliance: '#00FF88',
  review: '#B388FF',
};

export default function AuditCenterPage() {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return DEMO_AUDIT.filter(entry => {
      if (filterCategory && entry.category !== filterCategory) return false;
      if (filterSeverity && entry.severity !== filterSeverity) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return entry.action.includes(q) || entry.user.includes(q) || entry.resource.toLowerCase().includes(q) || entry.details.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterCategory, filterSeverity, searchQuery]);

  const exportAudit = () => {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driftguard-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Activity chart (last 10 days)
  const activityByDay = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 9; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      days[d] = 0;
    }
    DEMO_AUDIT.forEach(e => {
      const d = e.timestamp.split('T')[0];
      if (days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, []);
  const maxActivity = Math.max(...activityByDay.map(d => d.count), 1);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Audit Center" />

      {/* Activity chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '1.25rem' }}>
        <div className="text-[10px] font-mono text-[var(--color-ghost-text)] uppercase mb-3">Activity (Last 10 Days)</div>
        <div className="flex items-end gap-2" style={{ height: '60px' }}>
          {activityByDay.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(4, (day.count / maxActivity) * 100)}%`,
                  background: day.count > 2 ? '#FFB800' : '#00FFD1',
                  opacity: 0.7,
                }}
                title={`${day.date}: ${day.count} events`}
              />
              <span className="text-[7px] text-[var(--color-ghost-text)]">{day.date.split('-')[2]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1" style={{ maxWidth: '280px' }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ghost-text)]" />
          <input className="bio-input w-full" style={{ paddingLeft: '36px' }}
            placeholder="Search audit logs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="flex gap-1">
          {Object.keys(CATEGORY_ICONS).map(cat => (
            <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              className="text-[9px] font-mono rounded-full transition-all"
              style={{
                padding: '4px 8px',
                background: filterCategory === cat ? CATEGORY_COLORS[cat] + '15' : 'rgba(0,255,209,0.02)',
                border: `1px solid ${filterCategory === cat ? CATEGORY_COLORS[cat] + '40' : 'rgba(0,255,209,0.06)'}`,
                color: filterCategory === cat ? CATEGORY_COLORS[cat] : '#5A7A7D',
              }}>{cat}</button>
          ))}
        </div>

        <div className="flex gap-1">
          {['info', 'warning', 'critical'].map(sev => (
            <button key={sev} onClick={() => setFilterSeverity(filterSeverity === sev ? null : sev)}
              className="text-[9px] font-mono rounded-full transition-all"
              style={{
                padding: '4px 8px',
                background: filterSeverity === sev ? 'rgba(0,255,209,0.08)' : 'rgba(0,255,209,0.02)',
                border: `1px solid ${filterSeverity === sev ? 'rgba(0,255,209,0.25)' : 'rgba(0,255,209,0.06)'}`,
                color: filterSeverity === sev ? (sev === 'critical' ? '#FF3D6B' : sev === 'warning' ? '#FFB800' : '#00E5FF') : '#5A7A7D',
              }}>{sev}</button>
          ))}
        </div>

        <GlowButton variant="ghost" size="sm" icon={<Download size={12} />} onClick={exportAudit}>
          Export ({filtered.length})
        </GlowButton>
      </div>

      {/* Audit log entries */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bio-card" style={{ padding: '0' }}>
        <div className="space-y-0">
          {filtered.map((entry, i) => {
            const Icon = CATEGORY_ICONS[entry.category] || ScrollText;
            const catColor = CATEGORY_COLORS[entry.category] || '#5A7A7D';
            return (
              <div key={entry.id}
                className="flex items-start gap-3 transition-colors hover:bg-[rgba(0,255,209,0.02)]"
                style={{
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,255,209,0.04)' : 'none',
                }}>
                {/* Timeline dot */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className="rounded-full p-1.5" style={{ background: catColor + '12' }}>
                    <Icon size={12} style={{ color: catColor }} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-semibold rounded"
                      style={{ padding: '1px 6px', background: catColor + '10', color: catColor }}>
                      {entry.action}
                    </span>
                    <span className="text-[9px] font-mono rounded-full"
                      style={{
                        padding: '1px 6px',
                        background: entry.severity === 'critical' ? 'rgba(255,61,107,0.08)' : entry.severity === 'warning' ? 'rgba(255,184,0,0.08)' : 'rgba(0,229,255,0.05)',
                        color: entry.severity === 'critical' ? '#FF3D6B' : entry.severity === 'warning' ? '#FFB800' : '#00E5FF',
                      }}>{entry.severity}</span>
                    <span className="text-[9px] font-mono rounded-full"
                      style={{ padding: '1px 6px', background: 'rgba(0,255,209,0.04)', color: '#5A7A7D' }}>
                      {entry.environment}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--color-surface-text)] mb-0.5">
                    <span className="text-[var(--color-muted-text)]">{entry.user}</span>
                    <span className="text-[var(--color-ghost-text)]"> → </span>
                    <span className="font-medium">{entry.resource}</span>
                  </div>

                  <p className="text-[10px] text-[var(--color-ghost-text)]">{entry.details}</p>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-[var(--color-ghost-text)] flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                  <Clock size={10} /> {timeAgo(entry.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Immutability notice */}
      <div className="rounded-xl flex items-center gap-2 text-[10px] text-[var(--color-muted-text)]"
        style={{ padding: '10px 14px', background: 'rgba(0,255,209,0.02)', border: '1px solid rgba(0,255,209,0.06)' }}>
        <Shield size={12} className="text-[var(--color-biolume-primary)]" />
        All audit entries are immutable and tamper-proof. Logs are retained for 7 years per compliance requirements.
      </div>
    </div>
  );
}
