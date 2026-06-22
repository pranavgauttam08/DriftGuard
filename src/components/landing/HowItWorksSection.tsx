'use client';
import { motion } from 'framer-motion';
import { Upload, Cpu, Fingerprint, GitCompare, ShieldCheck } from 'lucide-react';
import { useScrollReveal } from '@/hooks';

const steps = [
  { icon: Upload, label: 'Ingest', desc: 'SDK sends query+response pairs' },
  { icon: Cpu, label: 'Embed', desc: 'Gemini generates semantic vectors' },
  { icon: Fingerprint, label: 'Fingerprint', desc: '8-dimensional behavioral profile' },
  { icon: GitCompare, label: 'Diff', desc: 'Compare against baseline version' },
  { icon: ShieldCheck, label: 'Gate', desc: 'PASS / WARN / BLOCK verdict' },
];

function Step({ step, index }: { step: typeof steps[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  const Icon = step.icon;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }} className="flex flex-col items-center text-center"
    >
      <div className="ag-card" style={{ padding: '20px', marginBottom: '16px', borderRadius: '16px' }}>
        <div className="rounded-full flex items-center justify-center"
          style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.08))' }}>
          <Icon size={24} className="text-[var(--color-brand-primary)]" />
        </div>
      </div>
      <div className="font-mono text-xs text-[var(--color-brand-secondary)]" style={{ marginBottom: '4px' }}>0{index + 1}</div>
      <div className="font-semibold text-[var(--color-text-primary)]" style={{ marginBottom: '4px' }}>{step.label}</div>
      <div className="text-xs text-[var(--color-text-secondary)]" style={{ maxWidth: '130px' }}>{step.desc}</div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="relative z-10" id="how-it-works" style={{ padding: 'clamp(4rem, 8vw, 8rem) clamp(2rem, 5vw, 5rem)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <motion.div ref={ref} initial={{ opacity: 0 }} animate={isVisible ? { opacity: 1 } : {}}
          className="text-center" style={{ marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '1rem' }}>
            How <span className="ag-glow-text">DriftGuard</span> Works
          </h2>
          <p className="text-[var(--color-text-secondary)]" style={{ maxWidth: '400px', margin: '0 auto' }}>Five steps from ingestion to deployment gating</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
          {steps.map((step, i) => (
            <Step key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
