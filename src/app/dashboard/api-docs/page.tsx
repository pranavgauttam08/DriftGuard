'use client';
import TopBar from '@/components/dashboard/TopBar';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Book, Code, Key, Shield, Bell, Cpu, Database, ExternalLink, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  permission: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  bodyFields?: { name: string; type: string; required: boolean; description: string }[];
  example?: { request?: string; response: string };
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#00E5FF',
  POST: '#00FF88',
  PUT: '#FFB800',
  DELETE: '#FF3D6B',
  PATCH: '#B388FF',
};

const API_SECTIONS: { id: string; title: string; icon: any; endpoints: APIEndpoint[] }[] = [
  {
    id: 'deployments', title: 'Deployments', icon: Cpu,
    endpoints: [
      {
        method: 'GET', path: '/api/v1/deployments', description: 'List deployments for an endpoint',
        permission: 'dashboard:view',
        params: [
          { name: 'orgId', type: 'string', required: true, description: 'Organization ID' },
          { name: 'endpointId', type: 'string', required: false, description: 'Filter by endpoint' },
          { name: 'status', type: 'string', required: false, description: 'Filter: pending | gating | approved | blocked | rolled_back' },
        ],
        example: { response: '{\n  "deployments": [\n    {\n      "id": "dep-001",\n      "version": "v1.3.0",\n      "status": "gating",\n      "verdict": "WARN",\n      "environment": "staging"\n    }\n  ]\n}' },
      },
      {
        method: 'POST', path: '/api/v1/deployments', description: 'Create a new deployment',
        permission: 'deployments:create',
        bodyFields: [
          { name: 'orgId', type: 'string', required: true, description: 'Organization ID' },
          { name: 'action', type: '"create"', required: true, description: 'Must be "create"' },
          { name: 'endpointId', type: 'string', required: true, description: 'Target endpoint' },
          { name: 'version', type: 'string', required: true, description: 'Version label (e.g., v1.3.0)' },
          { name: 'targetEnvId', type: 'string', required: true, description: 'Target environment ID' },
        ],
        example: { response: '{\n  "deployment": { "id": "dep-002", "status": "pending" },\n  "message": "Deployment created"\n}' },
      },
      {
        method: 'POST', path: '/api/v1/deployments', description: 'Approve a deployment',
        permission: 'deployments:approve',
        bodyFields: [
          { name: 'action', type: '"approve"', required: true, description: 'Must be "approve"' },
          { name: 'deploymentId', type: 'string', required: true, description: 'Deployment to approve' },
        ],
        example: { response: '{ "message": "Deployment approved" }' },
      },
    ],
  },
  {
    id: 'reviews', title: 'Reviews', icon: Shield,
    endpoints: [
      {
        method: 'GET', path: '/api/v1/reviews', description: 'List behavioral reviews',
        permission: 'dashboard:view',
        params: [
          { name: 'orgId', type: 'string', required: true, description: 'Organization ID' },
          { name: 'status', type: 'string', required: false, description: 'Filter: pending | approved | rejected | changes_requested' },
        ],
        example: { response: '{\n  "reviews": [\n    {\n      "id": "rev-001",\n      "status": "pending",\n      "verdict": "WARN",\n      "assignedTo": "reviewer@company.com"\n    }\n  ]\n}' },
      },
      {
        method: 'POST', path: '/api/v1/reviews', description: 'Submit a review decision',
        permission: 'reviews:approve',
        bodyFields: [
          { name: 'action', type: '"approve" | "reject" | "request_changes"', required: true, description: 'Review decision' },
          { name: 'reviewId', type: 'string', required: true, description: 'Review to act on' },
          { name: 'comment', type: 'string', required: false, description: 'Reviewer comment' },
        ],
        example: { response: '{ "message": "Review approved" }' },
      },
    ],
  },
  {
    id: 'alerts', title: 'Alerts', icon: Bell,
    endpoints: [
      {
        method: 'GET', path: '/api/v1/alerts?resource=events', description: 'List alert events',
        permission: 'dashboard:view',
        params: [
          { name: 'orgId', type: 'string', required: true, description: 'Organization ID' },
          { name: 'resource', type: '"events"', required: true, description: 'Resource type' },
          { name: 'type', type: 'AlertType', required: false, description: 'Filter by alert type' },
          { name: 'severity', type: '"info" | "warning" | "critical"', required: false, description: 'Minimum severity' },
        ],
        example: { response: '{\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "deployment_block",\n      "severity": "critical",\n      "title": "Deployment Blocked: v3.0.0"\n    }\n  ],\n  "total": 12\n}' },
      },
      {
        method: 'GET', path: '/api/v1/alerts?resource=channels', description: 'List alert channels',
        permission: 'dashboard:view',
        example: { response: '{\n  "channels": [\n    {\n      "id": "ch-1",\n      "type": "slack",\n      "name": "#alerts",\n      "enabled": true\n    }\n  ]\n}' },
      },
      {
        method: 'POST', path: '/api/v1/alerts', description: 'Create an alert channel',
        permission: 'settings:manage',
        bodyFields: [
          { name: 'action', type: '"create_channel"', required: true, description: 'Action type' },
          { name: 'type', type: '"slack" | "email" | "teams" | "discord" | "webhook"', required: true, description: 'Channel type' },
          { name: 'name', type: 'string', required: true, description: 'Channel display name' },
          { name: 'config', type: 'ChannelConfig', required: true, description: 'Channel-specific configuration' },
          { name: 'alertTypes', type: 'AlertType[]', required: false, description: 'Alert types to receive' },
          { name: 'minSeverity', type: '"info" | "warning" | "critical"', required: false, description: 'Minimum severity threshold' },
        ],
        example: { response: '{\n  "channel": {\n    "id": "ch-new",\n    "type": "slack",\n    "enabled": true\n  }\n}' },
      },
    ],
  },
  {
    id: 'security', title: 'Security', icon: Key,
    endpoints: [
      {
        method: 'GET', path: '/api/v1/security?resource=api_keys', description: 'List API keys',
        permission: 'settings:manage',
        example: { response: '{\n  "keys": [\n    {\n      "id": "key-1",\n      "name": "Production",\n      "keyPrefix": "dg_live_abc...",\n      "scopes": ["ingest", "read"],\n      "totalRequests": 1423\n    }\n  ]\n}' },
      },
      {
        method: 'POST', path: '/api/v1/security', description: 'Create an API key',
        permission: 'settings:manage',
        bodyFields: [
          { name: 'action', type: '"create_api_key"', required: true, description: 'Action type' },
          { name: 'name', type: 'string', required: true, description: 'Key display name' },
          { name: 'scopes', type: 'string[]', required: true, description: 'Scopes: ingest, read, evaluate, deploy, admin' },
          { name: 'expiresInDays', type: 'number', required: false, description: 'Auto-expire after N days' },
        ],
        example: { response: '{\n  "key": { "id": "key-new", "keyPrefix": "dg_live_xyz..." },\n  "plainTextKey": "dg_live_xyz..." \n}' },
      },
      {
        method: 'GET', path: '/api/v1/security?resource=compliance_soc2', description: 'Run SOC2 compliance check',
        permission: 'settings:manage',
        example: { response: '{\n  "report": {\n    "framework": "soc2",\n    "overallStatus": "compliant",\n    "compliantCount": 7,\n    "nonCompliantCount": 0\n  }\n}' },
      },
      {
        method: 'GET', path: '/api/v1/security?resource=audit_logs', description: 'Query audit logs',
        permission: 'settings:manage',
        params: [
          { name: 'action', type: 'string', required: false, description: 'Filter by action type' },
          { name: 'resourceType', type: 'string', required: false, description: 'Filter by resource' },
          { name: 'limit', type: 'number', required: false, description: 'Page size (default: 50)' },
        ],
        example: { response: '{\n  "entries": [\n    {\n      "action": "deployment.created",\n      "userId": "dev@co.com",\n      "timestamp": "2024-01-15T..."\n    }\n  ],\n  "total": 234\n}' },
      },
    ],
  },
  {
    id: 'datasets', title: 'Datasets', icon: Database,
    endpoints: [
      {
        method: 'GET', path: '/api/v1/datasets', description: 'List evaluation datasets',
        permission: 'dashboard:view',
        example: { response: '{\n  "datasets": [\n    {\n      "id": "ds-1",\n      "name": "Support QA Set",\n      "itemCount": 150\n    }\n  ]\n}' },
      },
      {
        method: 'POST', path: '/api/v1/datasets', description: 'Create a dataset with items',
        permission: 'datasets:manage',
        bodyFields: [
          { name: 'action', type: '"create"', required: true, description: 'Action type' },
          { name: 'name', type: 'string', required: true, description: 'Dataset name' },
          { name: 'items', type: 'DatasetItem[]', required: true, description: 'Array of test items' },
        ],
        example: { response: '{ "dataset": { "id": "ds-new" }, "message": "Dataset created" }' },
      },
    ],
  },
];

export default function APIDocsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['deployments']));
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSections(next);
  };

  const toggleEndpoint = (key: string) => {
    const next = new Set(expandedEndpoints);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedEndpoints(next);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="API Reference" />

      {/* Intro */}
      <div className="bio-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-2 mb-3">
          <Book size={18} style={{ color: 'var(--color-biolume-primary)' }} />
          <h2 className="text-base font-semibold text-[var(--color-surface-text)]">DriftGuard API v1</h2>
        </div>
        <p className="text-sm text-[var(--color-muted-text)] leading-relaxed mb-4">
          All endpoints require authentication via Clerk and are scoped by organization. Include your API key in the
          <code className="text-xs px-1.5 py-0.5 rounded mx-1" style={{ background: 'var(--color-biolume-dim)', color: 'var(--color-biolume-primary)' }}>Authorization</code>
          header for programmatic access.
        </p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: 'var(--color-biolume-dim)', border: '1px solid var(--color-border)' }}>
            <span className="text-[10px] text-[var(--color-ghost-text)]">BASE URL</span>
            <code className="text-xs font-mono text-[var(--color-biolume-primary)]">https://your-app.vercel.app/api/v1</code>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: 'var(--color-biolume-dim)', border: '1px solid var(--color-border)' }}>
            <span className="text-[10px] text-[var(--color-ghost-text)]">AUTH</span>
            <code className="text-xs font-mono text-[var(--color-biolume-primary)]">Bearer dg_live_...</code>
          </div>
        </div>
      </div>

      {/* API Sections */}
      {API_SECTIONS.map(section => {
        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id} className="bio-card overflow-hidden">
            <button onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-[rgba(0,255,209,0.02)] transition-colors">
              <div className="flex items-center gap-3">
                <Icon size={16} style={{ color: 'var(--color-biolume-primary)' }} />
                <h3 className="text-sm font-semibold text-[var(--color-surface-text)]">{section.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-biolume-dim)', color: 'var(--color-muted-text)' }}>
                  {section.endpoints.length} endpoints
                </span>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 0 : -90 }}>
                <ChevronDown size={14} style={{ color: 'var(--color-ghost-text)' }} />
              </motion.div>
            </button>

            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ borderTop: '1px solid var(--color-border)' }}>
                {section.endpoints.map((ep, idx) => {
                  const epKey = `${section.id}-${idx}`;
                  const isEpExpanded = expandedEndpoints.has(epKey);

                  return (
                    <div key={epKey} style={{ borderBottom: idx < section.endpoints.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <button onClick={() => toggleEndpoint(epKey)} className="w-full flex items-center gap-3 p-4 hover:bg-[rgba(0,255,209,0.02)] transition-colors text-left">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded" style={{ background: `${METHOD_COLORS[ep.method]}15`, color: METHOD_COLORS[ep.method], minWidth: '44px', textAlign: 'center' }}>
                          {ep.method}
                        </span>
                        <code className="text-xs font-mono text-[var(--color-surface-text)]">{ep.path}</code>
                        <span className="text-xs text-[var(--color-muted-text)] flex-1">{ep.description}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>{ep.permission}</span>
                        {isEpExpanded ? <ChevronDown size={12} style={{ color: 'var(--color-ghost-text)' }} /> : <ChevronRight size={12} style={{ color: 'var(--color-ghost-text)' }} />}
                      </button>

                      {isEpExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4 space-y-3">
                          {/* Parameters */}
                          {ep.params && ep.params.length > 0 && (
                            <div>
                              <span className="text-[10px] text-[var(--color-ghost-text)] uppercase tracking-wider block mb-2">Query Parameters</span>
                              <div className="space-y-1">
                                {ep.params.map(p => (
                                  <div key={p.name} className="flex items-center gap-3 text-xs p-2 rounded" style={{ background: 'rgba(0,255,209,0.02)' }}>
                                    <code className="font-mono text-[var(--color-biolume-primary)]" style={{ minWidth: '100px' }}>{p.name}</code>
                                    <span className="text-[var(--color-ghost-text)]" style={{ minWidth: '60px' }}>{p.type}</span>
                                    {p.required && <span className="text-[9px] px-1 rounded bg-[#FF3D6B15] text-[#FF3D6B]">required</span>}
                                    <span className="text-[var(--color-muted-text)]">{p.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Body fields */}
                          {ep.bodyFields && ep.bodyFields.length > 0 && (
                            <div>
                              <span className="text-[10px] text-[var(--color-ghost-text)] uppercase tracking-wider block mb-2">Request Body</span>
                              <div className="space-y-1">
                                {ep.bodyFields.map(f => (
                                  <div key={f.name} className="flex items-center gap-3 text-xs p-2 rounded" style={{ background: 'rgba(0,255,209,0.02)' }}>
                                    <code className="font-mono text-[var(--color-biolume-primary)]" style={{ minWidth: '100px' }}>{f.name}</code>
                                    <span className="text-[var(--color-ghost-text)]" style={{ minWidth: '80px' }}>{f.type}</span>
                                    {f.required && <span className="text-[9px] px-1 rounded bg-[#FF3D6B15] text-[#FF3D6B]">required</span>}
                                    <span className="text-[var(--color-muted-text)]">{f.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Example response */}
                          {ep.example && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-[var(--color-ghost-text)] uppercase tracking-wider">Response Example</span>
                                <button onClick={() => copyToClipboard(ep.example!.response, epKey)} className="flex items-center gap-1 text-[10px] text-[var(--color-muted-text)] hover:text-[var(--color-biolume-primary)] transition-colors">
                                  {copiedCode === epKey ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                                </button>
                              </div>
                              <pre className="text-[11px] font-mono p-3 rounded-lg overflow-x-auto" style={{
                                background: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-biolume-primary)',
                              }}>{ep.example.response}</pre>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
