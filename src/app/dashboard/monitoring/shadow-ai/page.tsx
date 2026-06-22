'use client';
import React from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import { Ghost, AlertTriangle, Shield, ExternalLink, Users, Globe } from 'lucide-react';

const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const SHADOW_AI_TOOLS = [
  { name: 'ChatGPT (Personal)', users: 23, department: 'Engineering', risk: 'high', domain: 'chat.openai.com', dataExposure: 'Code snippets, internal docs', lastSeen: '2 hrs ago' },
  { name: 'Claude (Personal)', users: 12, department: 'Product', risk: 'high', domain: 'claude.ai', dataExposure: 'Product specs, customer data', lastSeen: '4 hrs ago' },
  { name: 'Midjourney', users: 8, department: 'Marketing', risk: 'medium', domain: 'midjourney.com', dataExposure: 'Brand assets, concepts', lastSeen: '1 day ago' },
  { name: 'Copilot (Bing)', users: 15, department: 'Sales', risk: 'medium', domain: 'copilot.microsoft.com', dataExposure: 'Sales proposals, pricing', lastSeen: '6 hrs ago' },
  { name: 'Perplexity AI', users: 6, department: 'Research', risk: 'low', domain: 'perplexity.ai', dataExposure: 'General queries', lastSeen: '3 hrs ago' },
  { name: 'Gemini (Personal)', users: 9, department: 'Support', risk: 'high', domain: 'gemini.google.com', dataExposure: 'Customer tickets, PII risk', lastSeen: '1 hr ago' },
  { name: 'Jasper AI', users: 4, department: 'Marketing', risk: 'low', domain: 'jasper.ai', dataExposure: 'Marketing copy', lastSeen: '2 days ago' },
  { name: 'Hugging Face', users: 3, department: 'Data Science', risk: 'medium', domain: 'huggingface.co', dataExposure: 'Model experiments', lastSeen: '5 hrs ago' },
];

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: '#2D0707', text: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  medium: { bg: '#2D1D00', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  low:    { bg: '#052E16', text: '#10B981', border: 'rgba(16,185,129,0.3)' },
};

export default function ShadowAIPage() {
  const highRisk = SHADOW_AI_TOOLS.filter(t => t.risk === 'high').length;
  const totalUsers = SHADOW_AI_TOOLS.reduce((s, t) => s + t.users, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="Shadow AI Detector" />

      {/* ── Summary ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center gap-4">
          <div className="rounded-xl flex items-center justify-center" style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Ghost size={24} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {SHADOW_AI_TOOLS.length} Unauthorized AI Tools Detected
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span style={{ color: '#EF4444' }}>{highRisk} high risk</span> · {totalUsers} employees using unapproved AI services
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <div className="ag-card" style={{ padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} style={{ color: '#EF4444' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>High Risk</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#EF4444' }}>{highRisk}</div>
        </div>
        <div className="ag-card" style={{ padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} style={{ color: '#F59E0B' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Total Users</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#F59E0B' }}>{totalUsers}</div>
        </div>
        <div className="ag-card" style={{ padding: '1rem' }}>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} style={{ color: '#3B82F6' }} />
            <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-text-muted)' }}>Services</span>
          </div>
          <div className="text-2xl font-bold font-mono" style={{ color: '#3B82F6' }}>{SHADOW_AI_TOOLS.length}</div>
        </div>
      </div>

      {/* ── Detected Tools ──────────────────────────────────── */}
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-2">
        {SHADOW_AI_TOOLS.map(tool => {
          const risk = RISK_COLORS[tool.risk];
          return (
            <motion.div key={tool.name} variants={cardVariants} className="ag-card" style={{ padding: '1rem 1.25rem' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: risk.bg, border: `1px solid ${risk.border}` }}>
                    <Ghost size={16} style={{ color: risk.text }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{tool.name}</span>
                      <span className="text-[10px] font-mono rounded-full" style={{ padding: '1px 6px', background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`, textTransform: 'uppercase' }}>{tool.risk}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="flex items-center gap-1"><ExternalLink size={9} />{tool.domain}</span>
                      <span>{tool.department}</span>
                      <span>{tool.lastSeen}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    <Users size={12} /> {tool.users} users
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Exposure: {tool.dataExposure}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
