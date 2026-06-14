'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { useTenant } from '@/hooks/useTenant';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Clock,
  MessageSquare, Tag, ChevronDown, ChevronRight, Send, Plus,
  Eye, Filter, User,
} from 'lucide-react';

const DEMO_REVIEWS = [
  {
    id: 'rev-001',
    endpointName: 'Customer Support Bot',
    endpointId: 'support-bot',
    version: 'v1.3.0',
    diffId: 'diff-abc',
    deploymentId: 'dep-001',
    status: 'open' as const,
    priority: 'high' as const,
    verdict: 'WARN',
    assignedTo: ['reviewer@company.com', 'lead@company.com'],
    createdBy: 'system',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    comments: [
      { id: 'c1', userId: 'system', text: 'Review created for support-bot v1.3.0 (verdict: WARN)', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), isSystem: true },
      { id: 'c2', userId: 'reviewer@company.com', text: 'The empathetic tone drop looks concerning. Can we check if the system prompt was changed recently?', timestamp: new Date(Date.now() - 90 * 60 * 1000), isSystem: false },
      { id: 'c3', userId: 'dev@company.com', text: 'Yes, we updated the prompt to be more concise. I\'ll add the empathy guidelines back.', timestamp: new Date(Date.now() - 60 * 60 * 1000), isSystem: false },
    ],
    annotations: [
      { id: 'a1', userId: 'reviewer@company.com', type: 'regression', dimension: 'Empathetic Tone', note: 'Tone decreased by 12% — likely due to prompt change', severity: 'warning' },
      { id: 'a2', userId: 'reviewer@company.com', type: 'quality_improvement', dimension: 'Latency', note: 'Latency improved by 45ms — good improvement', severity: 'info' },
    ],
    regressions: [
      { dimension: 'Empathetic Tone', delta: -0.12, severity: 'medium' },
    ],
    similarityScore: 0.91,
  },
  {
    id: 'rev-002',
    endpointName: 'Content Generator',
    endpointId: 'content-gen',
    version: 'v3.0.0',
    diffId: 'diff-def',
    deploymentId: 'dep-003',
    status: 'rejected' as const,
    priority: 'critical' as const,
    verdict: 'BLOCK',
    assignedTo: ['reviewer@company.com'],
    createdBy: 'system',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
    resolvedBy: 'reviewer@company.com',
    comments: [
      { id: 'c4', userId: 'system', text: 'Review created for content-gen v3.0.0 (verdict: BLOCK)', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), isSystem: true },
      { id: 'c5', userId: 'reviewer@company.com', text: 'Hallucination score is way too high. The RAG pipeline needs to be fixed first.', timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000), isSystem: false },
      { id: 'c6', userId: 'system', text: 'Review rejected', timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000), isSystem: true },
    ],
    annotations: [
      { id: 'a3', userId: 'reviewer@company.com', type: 'hallucination', dimension: 'Hallucination Score', note: 'Hallucination rate increased from 8% to 33% — unacceptable for production', severity: 'critical' },
      { id: 'a4', userId: 'reviewer@company.com', type: 'safety_concern', dimension: 'Topic Consistency', note: 'Model is producing off-topic responses in 29% of cases', severity: 'critical' },
    ],
    regressions: [
      { dimension: 'Hallucination Score', delta: 0.25, severity: 'critical' },
      { dimension: 'Topic Consistency', delta: -0.21, severity: 'high' },
    ],
    similarityScore: 0.68,
  },
  {
    id: 'rev-003',
    endpointName: 'Code Assistant',
    endpointId: 'code-assistant',
    version: 'v2.0.0',
    diffId: 'diff-ghi',
    status: 'approved' as const,
    priority: 'low' as const,
    verdict: 'PASS',
    assignedTo: ['reviewer@company.com'],
    createdBy: 'dev@company.com',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    resolvedBy: 'reviewer@company.com',
    comments: [
      { id: 'c7', userId: 'system', text: 'Review created for code-assistant v2.0.0 (verdict: PASS)', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), isSystem: true },
      { id: 'c8', userId: 'reviewer@company.com', text: 'All metrics look good. Approving.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), isSystem: false },
      { id: 'c9', userId: 'system', text: 'Review approved', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), isSystem: true },
    ],
    annotations: [],
    regressions: [],
    similarityScore: 0.96,
  },
];

const ANNOTATION_COLORS: Record<string, string> = {
  hallucination: '#FF3D6B',
  toxicity: '#FF3D6B',
  regression: '#FFB800',
  wrong_tone: '#FFB800',
  pii: '#FF3D6B',
  bias: '#FF3D6B',
  factual_error: '#FF3D6B',
  safety_concern: '#FF3D6B',
  quality_improvement: '#00FF88',
  other: '#5A7A7D',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#FFB800',
  approved: '#00FF88',
  rejected: '#FF3D6B',
  needs_changes: '#00E5FF',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#5A7A7D',
  medium: '#00E5FF',
  high: '#FFB800',
  critical: '#FF3D6B',
};

type StatusFilter = 'all' | 'open' | 'approved' | 'rejected' | 'needs_changes';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ReviewsPage() {
  const tenant = useTenant();
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [newComment, setNewComment] = useState('');

  const filtered = statusFilter === 'all'
    ? DEMO_REVIEWS
    : DEMO_REVIEWS.filter(r => r.status === statusFilter);

  const statusCounts = {
    all: DEMO_REVIEWS.length,
    open: DEMO_REVIEWS.filter(r => r.status === 'open').length,
    approved: DEMO_REVIEWS.filter(r => r.status === 'approved').length,
    rejected: DEMO_REVIEWS.filter(r => r.status === 'rejected').length,
    needs_changes: DEMO_REVIEWS.filter(r => r.status === 'needs_changes').length,
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Reviews" />

      {/* Status filter tabs */}
      <div className="flex items-center gap-1">
        {(['all', 'open', 'approved', 'rejected', 'needs_changes'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="text-[10px] font-mono rounded-lg transition-all flex items-center gap-1"
            style={{
              padding: '6px 12px',
              background: statusFilter === s ? 'rgba(0,255,209,0.08)' : 'transparent',
              border: `1px solid ${statusFilter === s ? 'rgba(0,255,209,0.25)' : 'rgba(0,255,209,0.06)'}`,
              color: statusFilter === s ? '#00FFD1' : '#5A7A7D',
            }}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            <span className="rounded-full text-[9px]" style={{ padding: '0 5px', background: 'rgba(0,255,209,0.06)' }}>
              {statusCounts[s]}
            </span>
          </button>
        ))}
        <div className="ml-auto">
          <GlowButton size="sm" icon={<Plus size={14} />}>New Review</GlowButton>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.map((review, i) => {
          const isExpanded = expandedReview === review.id;

          return (
            <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <button
                onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                className="bio-card w-full text-left transition-all"
                style={{
                  padding: '1.25rem',
                  borderColor: isExpanded ? 'rgba(0,255,209,0.4)' : undefined,
                  borderLeftWidth: '3px',
                  borderLeftColor: STATUS_COLORS[review.status] || '#5A7A7D',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-surface-text)]">{review.endpointName}</span>
                    <span className="text-xs font-mono text-[var(--color-ghost-text)]">{review.version}</span>
                    {review.verdict && (
                      <span className="text-[9px] font-mono rounded" style={{
                        padding: '1px 6px',
                        background: (review.verdict === 'BLOCK' ? '#FF3D6B' : review.verdict === 'WARN' ? '#FFB800' : '#00FF88') + '15',
                        color: review.verdict === 'BLOCK' ? '#FF3D6B' : review.verdict === 'WARN' ? '#FFB800' : '#00FF88',
                      }}>{review.verdict}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono rounded" style={{ padding: '2px 6px', background: (PRIORITY_COLORS[review.priority] || '#5A7A7D') + '15', color: PRIORITY_COLORS[review.priority] }}>{review.priority}</span>
                    <span className="text-[10px] font-mono rounded-lg" style={{ padding: '3px 8px', background: (STATUS_COLORS[review.status] || '#5A7A7D') + '15', color: STATUS_COLORS[review.status] }}>{review.status.replace('_', ' ')}</span>
                    {isExpanded ? <ChevronDown size={12} className="text-[var(--color-ghost-text)]" /> : <ChevronRight size={12} className="text-[var(--color-ghost-text)]" />}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-[var(--color-muted-text)]">
                  <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(review.createdAt)}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={10} />{review.comments.filter(c => !c.isSystem).length} comments</span>
                  <span className="flex items-center gap-1"><Tag size={10} />{review.annotations.length} annotations</span>
                  {review.regressions.length > 0 && (
                    <span className="text-[var(--color-biolume-danger)] flex items-center gap-1"><AlertTriangle size={10} />{review.regressions.length} regressions</span>
                  )}
                  <span className="flex items-center gap-1"><User size={10} />{review.assignedTo.length} reviewer{review.assignedTo.length > 1 ? 's' : ''}</span>
                  <span className="font-mono">sim: {(review.similarityScore * 100).toFixed(0)}%</span>
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bio-card" style={{ padding: '1.25rem', marginTop: '4px', borderColor: 'rgba(0,255,209,0.15)' }}>

                      {/* Annotations */}
                      {review.annotations.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <div className="text-[10px] font-mono text-[var(--color-ghost-text)] mb-2 uppercase">Annotations</div>
                          <div className="flex flex-wrap gap-2">
                            {review.annotations.map((ann: any) => (
                              <div key={ann.id} className="rounded-lg" style={{
                                padding: '8px 12px',
                                background: (ANNOTATION_COLORS[ann.type] || '#5A7A7D') + '08',
                                border: `1px solid ${(ANNOTATION_COLORS[ann.type] || '#5A7A7D') + '20'}`,
                                maxWidth: '400px',
                              }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-mono rounded-full" style={{
                                    padding: '1px 6px',
                                    background: (ANNOTATION_COLORS[ann.type] || '#5A7A7D') + '15',
                                    color: ANNOTATION_COLORS[ann.type] || '#5A7A7D',
                                  }}>{ann.type.replace('_', ' ')}</span>
                                  {ann.dimension && <span className="text-[9px] text-[var(--color-ghost-text)]">{ann.dimension}</span>}
                                  <span className="text-[8px] rounded" style={{
                                    padding: '1px 4px',
                                    background: ann.severity === 'critical' ? 'rgba(255,61,107,0.1)' : ann.severity === 'warning' ? 'rgba(255,184,0,0.08)' : 'rgba(0,255,209,0.04)',
                                    color: ann.severity === 'critical' ? '#FF3D6B' : ann.severity === 'warning' ? '#FFB800' : '#4A8F8A',
                                  }}>{ann.severity}</span>
                                </div>
                                <span className="text-[11px] text-[var(--color-muted-text)]">{ann.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments thread */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div className="text-[10px] font-mono text-[var(--color-ghost-text)] mb-2 uppercase">Discussion</div>
                        <div className="space-y-2">
                          {review.comments.map((comment: any) => (
                            <div key={comment.id} className="flex gap-2"
                              style={{ opacity: comment.isSystem ? 0.6 : 1 }}>
                              <div className="rounded-full flex-shrink-0 flex items-center justify-center" style={{
                                width: '24px', height: '24px', marginTop: '2px',
                                background: comment.isSystem ? 'rgba(0,255,209,0.06)' : 'rgba(0,229,255,0.08)',
                                color: comment.isSystem ? '#4A8F8A' : '#00E5FF',
                              }}>
                                {comment.isSystem ? <ClipboardCheck size={10} /> : <User size={10} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-semibold text-[var(--color-surface-text)]">
                                    {comment.isSystem ? 'System' : comment.userId}
                                  </span>
                                  <span className="text-[9px] text-[var(--color-ghost-text)]">{timeAgo(comment.timestamp)}</span>
                                </div>
                                <div className="text-xs text-[var(--color-muted-text)] rounded-lg" style={{
                                  padding: comment.isSystem ? '4px 8px' : '8px 12px',
                                  background: comment.isSystem ? 'transparent' : 'rgba(0,255,209,0.02)',
                                  border: comment.isSystem ? 'none' : '1px solid rgba(0,255,209,0.06)',
                                  fontStyle: comment.isSystem ? 'italic' : 'normal',
                                }}>
                                  {comment.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* New comment input */}
                        {review.status === 'open' && (
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="bio-input flex-1 text-xs"
                              style={{ padding: '8px 12px' }}
                            />
                            <button className="rounded-lg transition-all hover:bg-[rgba(0,255,209,0.06)]" style={{ padding: '8px', color: '#5A7A7D' }}>
                              <Send size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3" style={{ borderTop: '1px solid rgba(0,255,209,0.06)', paddingTop: '1rem' }}>
                        {review.status === 'open' && (
                          <>
                            <GlowButton size="sm" icon={<CheckCircle2 size={14} />}>Approve</GlowButton>
                            <GlowButton variant="danger" size="sm" icon={<XCircle size={14} />}>Reject</GlowButton>
                            <GlowButton variant="ghost" size="sm" icon={<MessageSquare size={14} />}>Request Changes</GlowButton>
                            <GlowButton variant="ghost" size="sm" icon={<Tag size={14} />}>Add Annotation</GlowButton>
                          </>
                        )}
                        {review.status !== 'open' && review.resolvedBy && (
                          <div className="text-xs text-[var(--color-muted-text)]">
                            {review.status === 'approved' ? '✅' : '❌'} {review.status.charAt(0).toUpperCase() + review.status.slice(1)} by {review.resolvedBy}
                            {review.resolvedAt && ` · ${timeAgo(review.resolvedAt)}`}
                          </div>
                        )}
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
