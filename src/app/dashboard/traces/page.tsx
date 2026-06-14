'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { useTenant } from '@/hooks/useTenant';
import {
  Activity, Search, Filter, Clock, Zap, ChevronDown, ChevronRight,
  MessageSquare, Database, Wrench, Cpu, AlertTriangle, ExternalLink,
} from 'lucide-react';

// Demo trace data
const DEMO_TRACES = [
  {
    id: 'trace-001',
    endpointId: 'support-bot',
    version: 'v1.3.0',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    userQuery: 'How do I reset my password?',
    finalResponse: 'To reset your password, go to Settings > Security > Change Password. If you\'ve forgotten your password, click "Forgot Password" on the login page.',
    systemPrompt: 'You are a helpful customer support agent for Acme Corp. Be concise and empathetic.',
    retrievedContext: [
      { source: 'help-center/password-reset.md', text: 'Users can reset their password from Settings...', score: 0.94 },
      { source: 'help-center/account-security.md', text: 'For security purposes, passwords must be at least 12 characters...', score: 0.71 },
    ],
    toolCalls: [],
    modelConfig: { provider: 'google', model: 'gemini-2.0-flash', temperature: 0.3 },
    latencyMs: 342,
    tokenCount: 87,
    sessionId: 'sess-abc123',
    endUserId: 'user-42',
    error: null,
  },
  {
    id: 'trace-002',
    endpointId: 'support-bot',
    version: 'v1.3.0',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    userQuery: 'Can you refund my last purchase?',
    finalResponse: 'I\'d be happy to help with your refund request. I\'ve initiated a refund for order #12345. The amount of $49.99 should appear in your account within 3-5 business days.',
    systemPrompt: 'You are a helpful customer support agent for Acme Corp. Be concise and empathetic.',
    retrievedContext: [
      { source: 'policies/refund-policy.md', text: 'Refunds are processed within 3-5 business days...', score: 0.89 },
    ],
    toolCalls: [
      { name: 'process_refund', input: { orderId: '12345' }, output: '{"status": "initiated", "amount": 49.99}', latencyMs: 120 },
    ],
    modelConfig: { provider: 'google', model: 'gemini-2.0-flash', temperature: 0.3 },
    latencyMs: 891,
    tokenCount: 145,
    sessionId: 'sess-def456',
    endUserId: 'user-18',
    error: null,
  },
  {
    id: 'trace-003',
    endpointId: 'code-assistant',
    version: 'v2.1.0',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userQuery: 'Write a Python function to merge two sorted arrays',
    finalResponse: 'Here\'s an efficient merge function:\n\ndef merge_sorted(arr1, arr2):\n    result = []\n    i = j = 0\n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] <= arr2[j]: result.append(arr1[i]); i += 1\n        else: result.append(arr2[j]); j += 1\n    result.extend(arr1[i:])\n    result.extend(arr2[j:])\n    return result',
    systemPrompt: 'You are a senior Python developer. Write clean, efficient code with explanations.',
    retrievedContext: [],
    toolCalls: [],
    modelConfig: { provider: 'google', model: 'gemini-2.0-flash', temperature: 0.1, maxTokens: 1024 },
    latencyMs: 456,
    tokenCount: 210,
    sessionId: 'sess-ghi789',
    endUserId: null,
    error: null,
  },
  {
    id: 'trace-004',
    endpointId: 'content-gen',
    version: 'v3.0.0',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    userQuery: 'Generate a marketing tagline for our new AI product',
    finalResponse: '',
    systemPrompt: 'You are a creative marketing copywriter.',
    retrievedContext: [],
    toolCalls: [],
    modelConfig: { provider: 'google', model: 'gemini-2.0-flash', temperature: 0.9 },
    latencyMs: 15023,
    tokenCount: 0,
    sessionId: null,
    endUserId: null,
    error: 'TIMEOUT: Request exceeded 15s deadline',
  },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TracesPage() {
  const tenant = useTenant();
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);
  const [filterEndpoint, setFilterEndpoint] = useState<string>('');

  const filtered = filterEndpoint
    ? DEMO_TRACES.filter(t => t.endpointId === filterEndpoint)
    : DEMO_TRACES;

  const uniqueEndpoints = [...new Set(DEMO_TRACES.map(t => t.endpointId))];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Trace Explorer" />

      {/* Info callout */}
      <div className="rounded-xl" style={{ padding: '1rem 1.25rem', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
        <div className="flex items-center gap-2 text-xs text-[var(--color-biolume-secondary)]">
          <Activity size={14} />
          <span className="font-semibold">Behavioral Traces</span>
          <span className="text-[var(--color-muted-text)]">— Structured request/response capture for root-cause analysis. Not a generic observability tool.</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative" style={{ maxWidth: '280px', flex: 1 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ghost-text)]" />
          <input placeholder="Search traces..." className="bio-input w-full" style={{ paddingLeft: '36px' }} />
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setFilterEndpoint('')}
            className="text-[10px] font-mono rounded-lg transition-all"
            style={{
              padding: '6px 12px',
              background: !filterEndpoint ? 'rgba(0,255,209,0.1)' : 'transparent',
              border: `1px solid ${!filterEndpoint ? 'rgba(0,255,209,0.3)' : 'rgba(0,255,209,0.08)'}`,
              color: !filterEndpoint ? '#00FFD1' : '#5A7A7D',
            }}>All</button>
          {uniqueEndpoints.map(ep => (
            <button key={ep}
              onClick={() => setFilterEndpoint(filterEndpoint === ep ? '' : ep)}
              className="text-[10px] font-mono rounded-lg transition-all"
              style={{
                padding: '6px 12px',
                background: filterEndpoint === ep ? 'rgba(0,255,209,0.1)' : 'transparent',
                border: `1px solid ${filterEndpoint === ep ? 'rgba(0,255,209,0.3)' : 'rgba(0,255,209,0.08)'}`,
                color: filterEndpoint === ep ? '#00FFD1' : '#5A7A7D',
              }}>{ep}</button>
          ))}
        </div>

        <div className="ml-auto text-[10px] text-[var(--color-ghost-text)]">
          {filtered.length} traces
        </div>
      </div>

      {/* Trace list */}
      <div className="space-y-2">
        {filtered.map((trace, i) => {
          const isExpanded = expandedTrace === trace.id;
          const hasError = !!trace.error;
          const hasTools = trace.toolCalls.length > 0;
          const hasRAG = trace.retrievedContext.length > 0;

          return (
            <motion.div
              key={trace.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => setExpandedTrace(isExpanded ? null : trace.id)}
                className="bio-card w-full text-left transition-all"
                style={{
                  padding: '1rem 1.25rem',
                  borderColor: hasError ? 'rgba(255,61,107,0.2)' : isExpanded ? 'rgba(0,255,209,0.3)' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={12} className="text-[var(--color-ghost-text)]" /> : <ChevronRight size={12} className="text-[var(--color-ghost-text)]" />}

                  {/* Endpoint + Version */}
                  <span className="text-xs font-semibold text-[var(--color-surface-text)]">{trace.endpointId}</span>
                  <span className="text-[10px] font-mono text-[var(--color-ghost-text)]">{trace.version}</span>

                  {/* Badges */}
                  <div className="flex gap-1 ml-2">
                    {hasRAG && (
                      <span className="text-[9px] font-mono rounded-full flex items-center gap-1"
                        style={{ padding: '1px 6px', background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                        <Database size={8} />RAG
                      </span>
                    )}
                    {hasTools && (
                      <span className="text-[9px] font-mono rounded-full flex items-center gap-1"
                        style={{ padding: '1px 6px', background: 'rgba(255,184,0,0.08)', color: '#FFB800' }}>
                        <Wrench size={8} />Tools
                      </span>
                    )}
                    {hasError && (
                      <span className="text-[9px] font-mono rounded-full flex items-center gap-1"
                        style={{ padding: '1px 6px', background: 'rgba(255,61,107,0.1)', color: '#FF3D6B' }}>
                        <AlertTriangle size={8} />Error
                      </span>
                    )}
                  </div>

                  {/* Query preview */}
                  <span className="text-xs text-[var(--color-muted-text)] truncate flex-1 ml-2">
                    {trace.userQuery.slice(0, 60)}{trace.userQuery.length > 60 ? '...' : ''}
                  </span>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-[10px] text-[var(--color-ghost-text)] flex-shrink-0">
                    <span className="flex items-center gap-1"><Zap size={10} />{trace.latencyMs}ms</span>
                    <span>{trace.tokenCount} tok</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(trace.timestamp)}</span>
                  </div>
                </div>
              </button>

              {/* Expanded waterfall view */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bio-card" style={{ padding: '1.25rem', marginTop: '4px', borderColor: 'rgba(0,255,209,0.15)' }}>
                      {/* Waterfall steps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                        {/* System Prompt */}
                        {trace.systemPrompt && (
                          <WaterfallStep icon={<Cpu size={12} />} label="System Prompt" color="#5A7A7D">
                            <code className="text-[11px] text-[var(--color-muted-text)]">{trace.systemPrompt}</code>
                          </WaterfallStep>
                        )}

                        {/* User Query */}
                        <WaterfallStep icon={<MessageSquare size={12} />} label="User Query" color="#00E5FF">
                          <span className="text-xs text-[var(--color-surface-text)]">{trace.userQuery}</span>
                        </WaterfallStep>

                        {/* Retrieved Context */}
                        {trace.retrievedContext.length > 0 && (
                          <WaterfallStep icon={<Database size={12} />} label={`Retrieved Context (${trace.retrievedContext.length} chunks)`} color="#00E5FF">
                            {trace.retrievedContext.map((chunk: any, ci: number) => (
                              <div key={ci} className="rounded-lg mb-1" style={{ padding: '6px 10px', background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)' }}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-[var(--color-biolume-secondary)]">{chunk.source}</span>
                                  {chunk.score && <span className="text-[9px] font-mono text-[var(--color-ghost-text)]">score: {chunk.score.toFixed(2)}</span>}
                                </div>
                                <span className="text-[11px] text-[var(--color-muted-text)]">{chunk.text.slice(0, 120)}...</span>
                              </div>
                            ))}
                          </WaterfallStep>
                        )}

                        {/* Tool Calls */}
                        {trace.toolCalls.length > 0 && (
                          <WaterfallStep icon={<Wrench size={12} />} label={`Tool Calls (${trace.toolCalls.length})`} color="#FFB800">
                            {trace.toolCalls.map((tool: any, ti: number) => (
                              <div key={ti} className="rounded-lg mb-1" style={{ padding: '6px 10px', background: 'rgba(255,184,0,0.03)', border: '1px solid rgba(255,184,0,0.1)' }}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-mono font-semibold" style={{ color: '#FFB800' }}>{tool.name}()</span>
                                  <span className="text-[9px] font-mono text-[var(--color-ghost-text)]">{tool.latencyMs}ms</span>
                                </div>
                                <div className="text-[10px] text-[var(--color-ghost-text)]">
                                  <span className="text-[var(--color-muted-text)]">Input:</span> {JSON.stringify(tool.input)}
                                </div>
                                <div className="text-[10px] text-[var(--color-ghost-text)]">
                                  <span className="text-[var(--color-muted-text)]">Output:</span> {tool.output.slice(0, 100)}
                                </div>
                              </div>
                            ))}
                          </WaterfallStep>
                        )}

                        {/* Model Config */}
                        {trace.modelConfig && (
                          <WaterfallStep icon={<Cpu size={12} />} label="Model Config" color="#5A7A7D">
                            <div className="flex gap-3 text-[10px]">
                              <span className="font-mono text-[var(--color-muted-text)]">{trace.modelConfig.provider}/{trace.modelConfig.model}</span>
                              {trace.modelConfig.temperature !== undefined && <span className="text-[var(--color-ghost-text)]">temp: {trace.modelConfig.temperature}</span>}
                              {trace.modelConfig.maxTokens && <span className="text-[var(--color-ghost-text)]">max: {trace.modelConfig.maxTokens}</span>}
                            </div>
                          </WaterfallStep>
                        )}

                        {/* Response or Error */}
                        {trace.error ? (
                          <WaterfallStep icon={<AlertTriangle size={12} />} label="Error" color="#FF3D6B">
                            <code className="text-[11px]" style={{ color: '#FF3D6B' }}>{trace.error}</code>
                          </WaterfallStep>
                        ) : (
                          <WaterfallStep icon={<MessageSquare size={12} />} label="Response" color="#00FF88">
                            <span className="text-xs text-[var(--color-surface-text)] whitespace-pre-wrap">{trace.finalResponse.slice(0, 400)}{trace.finalResponse.length > 400 ? '...' : ''}</span>
                          </WaterfallStep>
                        )}
                      </div>

                      {/* Meta footer */}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-ghost-text)]" style={{ paddingTop: '10px', borderTop: '1px solid rgba(0,255,209,0.06)' }}>
                        <span>ID: {trace.id}</span>
                        {trace.sessionId && <span>Session: {trace.sessionId}</span>}
                        {trace.endUserId && <span>User: {trace.endUserId}</span>}
                        <span>{trace.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Waterfall step component for trace visualization.
 */
function WaterfallStep({ icon, label, color, children }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center" style={{ width: '20px', flexShrink: 0 }}>
        <div className="rounded-full flex items-center justify-center" style={{ width: '20px', height: '20px', background: color + '15', color }}>
          {icon}
        </div>
        <div className="flex-1" style={{ width: '1px', background: 'rgba(0,255,209,0.06)', minHeight: '8px' }} />
      </div>
      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="text-[10px] font-mono uppercase mb-1" style={{ color }}>{label}</div>
        <div className="rounded-lg" style={{ padding: '8px 10px', background: 'rgba(0,255,209,0.02)', border: '1px solid rgba(0,255,209,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
