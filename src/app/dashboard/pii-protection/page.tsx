'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import GlowButton from '@/components/ui/GlowButton';
import { EyeOff, Shield, Search, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { detectPII, maskPII, getPIISeverityColor, PII_TYPE_INFO, type PIIMatch, type PIIType } from '@/lib/pii-detector';

const SAMPLE_TEXTS = [
  'Customer John Doe reached out from john.doe@example.com and phone 555-123-4567 regarding order #12345.',
  'Payment was made with card 4532-1234-5678-9012. Shipping to 123 Main Street, Springfield IL.',
  'Patient SSN 123-45-6789 was referred by Dr. Smith. Contact: doctor@hospital.com or 800-555-0199.',
  'Passport AB1234567 holder requested account deletion. IP: 192.168.1.42',
];

export default function PIIProtectionPage() {
  const [inputText, setInputText] = useState('');
  const [scanResults, setScanResults] = useState<PIIMatch[] | null>(null);
  const [maskedText, setMaskedText] = useState('');
  const [enabledTypes, setEnabledTypes] = useState<Set<PIIType>>(new Set(['email', 'phone', 'credit_card', 'ssn', 'passport', 'ip_address']));
  const [copied, setCopied] = useState(false);

  const runScan = () => {
    const results = detectPII(inputText);
    setScanResults(results);
    setMaskedText(maskPII(inputText, Array.from(enabledTypes)));
  };

  const loadSample = (idx: number) => {
    setInputText(SAMPLE_TEXTS[idx]);
    setScanResults(null);
    setMaskedText('');
  };

  const toggleType = (type: PIIType) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const copyMasked = () => {
    navigator.clipboard.writeText(maskedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Demo risk scores per endpoint
  const endpointRisks = [
    { name: 'Support Bot', scans: 1250, piiFound: 47, risk: 38, types: ['email', 'phone'] },
    { name: 'Code Assistant', scans: 890, piiFound: 3, risk: 4, types: ['ip_address'] },
    { name: 'Onboarding Guide', scans: 445, piiFound: 22, risk: 18, types: ['email', 'phone', 'ssn'] },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <TopBar title="PII Protection" />

      {/* Risk Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {endpointRisks.map((ep, i) => (
          <motion.div key={ep.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="ag-card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{ep.name}</span>
              <span className="text-lg font-bold" style={{ color: ep.risk > 30 ? '#EF4444' : ep.risk > 15 ? '#F59E0B' : '#00FF88' }}>
                {ep.risk}%
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden mb-2" style={{ height: '3px', background: 'rgba(59,130,246,0.06)' }}>
              <div className="h-full rounded-full" style={{
                width: `${ep.risk}%`,
                background: ep.risk > 30 ? '#EF4444' : ep.risk > 15 ? '#F59E0B' : '#00FF88',
              }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>{ep.scans} responses scanned</span>
              <span>{ep.piiFound} PII instances</span>
            </div>
            <div className="flex gap-1 mt-2">
              {ep.types.map(t => (
                <span key={t} className="text-[8px] font-mono rounded-full"
                  style={{ padding: '1px 6px', background: 'rgba(255,184,0,0.06)', color: '#F59E0B' }}>
                  {PII_TYPE_INFO[t as PIIType]?.icon} {t}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scanner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ag-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[var(--color-brand-primary)]" />
            <h3 className="font-semibold text-[var(--color-text-primary)]">PII Scanner</h3>
          </div>
          <div className="flex gap-1">
            {SAMPLE_TEXTS.map((_, idx) => (
              <button key={idx} onClick={() => loadSample(idx)}
                className="text-[9px] font-mono rounded-full transition-all hover:bg-[rgba(59,130,246,0.08)]"
                style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.03)', color: '#5A7A7D', border: '1px solid rgba(59,130,246,0.08)' }}>
                Sample {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Type toggles */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.entries(PII_TYPE_INFO) as [PIIType, { label: string; icon: string }][]).map(([type, info]) => (
            <button key={type} onClick={() => toggleType(type)}
              className="text-[10px] font-mono rounded-full transition-all flex items-center gap-1"
              style={{
                padding: '4px 10px',
                background: enabledTypes.has(type) ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.02)',
                border: `1px solid ${enabledTypes.has(type) ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.06)'}`,
                color: enabledTypes.has(type) ? '#3B82F6' : '#5A7A7D',
              }}>
              {info.icon} {info.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <textarea className="bio-input w-full font-mono text-xs mb-3" rows={4}
          placeholder="Paste text to scan for PII..."
          value={inputText} onChange={e => { setInputText(e.target.value); setScanResults(null); }}
          style={{ resize: 'vertical' }} />

        <GlowButton size="sm" icon={<Search size={14} />} onClick={runScan} disabled={!inputText.trim()}>
          Scan for PII
        </GlowButton>
      </motion.div>

      {/* Results */}
      {scanResults !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Detections */}
          {scanResults.length > 0 ? (
            <div className="ag-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-[#F59E0B]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {scanResults.length} PII Instance{scanResults.length > 1 ? 's' : ''} Detected
                </span>
              </div>

              <div className="space-y-2">
                {scanResults.map((match, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg text-xs"
                    style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.02)', border: '1px solid rgba(59,130,246,0.06)' }}>
                    <span className="text-base">{PII_TYPE_INFO[match.type]?.icon}</span>
                    <span className="font-mono text-[var(--color-text-primary)]" style={{ minWidth: '100px' }}>
                      {PII_TYPE_INFO[match.type]?.label}
                    </span>
                    <code className="text-[#EF4444] line-through">{match.value}</code>
                    <span className="text-[var(--color-text-muted)]">→</span>
                    <code className="text-[#00FF88]">{match.masked}</code>
                    <span className="ml-auto text-[9px] font-mono rounded-full"
                      style={{ padding: '2px 6px', background: getPIISeverityColor(match.severity) + '12', color: getPIISeverityColor(match.severity) }}>
                      {match.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="ag-card flex items-center gap-2" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={16} className="text-[#00FF88]" />
              <span className="text-sm text-[#00FF88]">No PII detected — text is clean</span>
            </div>
          )}

          {/* Masked output */}
          {maskedText && scanResults.length > 0 && (
            <div className="ag-card" style={{ padding: '1.5rem' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <EyeOff size={16} className="text-[#00FF88]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Redacted Output</span>
                </div>
                <button onClick={copyMasked} className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  {copied ? <Check size={12} className="text-[#00FF88]" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap rounded-lg"
                style={{ padding: '12px', background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
                {maskedText}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
