'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { useTenant } from '@/hooks/useTenant';
import { Database, Plus, Upload, Download, Search, Tag, FileJson, FileSpreadsheet, Eye, Trash2 } from 'lucide-react';

const DEMO_DATASETS = [
  {
    id: 'ds-001', name: 'E-commerce Golden Set', description: 'Core benchmark dataset for support bot evaluation',
    version: 3, tags: ['support', 'golden', 'production'], responseCount: 250,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), createdBy: 'admin',
  },
  {
    id: 'ds-002', name: 'Code Review Scenarios', description: 'Technical coding questions and expected response patterns',
    version: 1, tags: ['code', 'technical'], responseCount: 120,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdBy: 'developer',
  },
  {
    id: 'ds-003', name: 'Adversarial Edge Cases', description: 'Tricky inputs designed to test safety guardrails',
    version: 2, tags: ['safety', 'adversarial', 'probes'], responseCount: 80,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdBy: 'reviewer',
  },
];

export default function DatasetsPage() {
  const tenant = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = [...new Set(DEMO_DATASETS.flatMap(d => d.tags))];
  const filtered = DEMO_DATASETS.filter(d => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedTag && !d.tags.includes(selectedTag)) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <TopBar title="Evaluation Datasets" />

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1" style={{ maxWidth: '320px' }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ghost-text)]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search datasets..."
              className="bio-input w-full"
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <div className="flex gap-1">
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className="text-[10px] font-mono rounded-full transition-all"
                style={{
                  padding: '4px 10px',
                  background: selectedTag === tag ? 'rgba(0,255,209,0.1)' : 'rgba(0,255,209,0.03)',
                  border: `1px solid ${selectedTag === tag ? 'rgba(0,255,209,0.3)' : 'rgba(0,255,209,0.08)'}`,
                  color: selectedTag === tag ? '#00FFD1' : '#5A7A7D',
                }}>
                <Tag size={8} className="inline mr-1" />{tag}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm" icon={<Upload size={14} />}>Import</GlowButton>
          <GlowButton size="sm" icon={<Plus size={14} />}>New Dataset</GlowButton>
        </div>
      </div>

      {/* Datasets grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filtered.map((ds, i) => (
          <motion.div
            key={ds.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bio-card"
            style={{ padding: '1.25rem' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[var(--color-biolume-secondary)]" />
                <span className="text-sm font-semibold text-[var(--color-surface-text)]">{ds.name}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-biolume-primary)]"
                style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,255,209,0.06)' }}>
                v{ds.version}
              </span>
            </div>

            <p className="text-xs text-[var(--color-muted-text)]" style={{ marginBottom: '0.75rem' }}>{ds.description}</p>

            <div className="flex flex-wrap gap-1" style={{ marginBottom: '0.75rem' }}>
              {ds.tags.map(tag => (
                <span key={tag} className="text-[9px] font-mono rounded-full"
                  style={{ padding: '2px 8px', background: 'rgba(0,255,209,0.04)', border: '1px solid rgba(0,255,209,0.1)', color: '#4A8F8A' }}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--color-ghost-text)]" style={{ marginBottom: '1rem' }}>
              <span>{ds.responseCount} entries</span>
              <span>{ds.createdAt.toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <GlowButton variant="ghost" size="sm" icon={<Eye size={12} />}>Browse</GlowButton>
              <GlowButton variant="ghost" size="sm" icon={<Download size={12} />}>Export</GlowButton>
              <button className="ml-auto text-[var(--color-ghost-text)] hover:text-[var(--color-biolume-danger)] transition-all" style={{ padding: '4px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Import format info */}
      <div className="bio-card" style={{ padding: '1.25rem' }}>
        <h3 className="text-sm font-semibold text-[var(--color-surface-text)]" style={{ marginBottom: '0.75rem' }}>Supported Import Formats</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-text)]">
            <FileJson size={16} className="text-[var(--color-biolume-primary)]" />
            <span>JSON Array</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-text)]">
            <FileSpreadsheet size={16} className="text-[var(--color-biolume-secondary)]" />
            <span>CSV (with headers)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-text)]">
            <Upload size={16} className="text-[var(--color-biolume-tertiary)]" />
            <span>API Upload</span>
          </div>
        </div>
      </div>
    </div>
  );
}
