'use client';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useScrollReveal, useAnimatedCounter } from '@/hooks';
import GlowButton from '@/components/ui/GlowButton';
import BioCard from '@/components/ui/BioCard';
import StatusBadge from '@/components/ui/StatusBadge';

const NeuralOrb = dynamic(() => import('@/components/three/NeuralOrb'), { ssr: false });

const stats = [
  { label: 'Regression Catch Rate', value: 94, suffix: '%' },
  { label: 'Overhead', value: 2, prefix: '< ', suffix: 'ms' },
  { label: 'Works With', value: 0, custom: 'Any LLM' },
];

function AnimatedStat({ label, value, prefix, suffix, custom }: { label: string; value: number; prefix?: string; suffix?: string; custom?: string }) {
  const counter = useAnimatedCounter(value, 1200);
  const { ref, isVisible } = useScrollReveal();
  if (isVisible && !counter.started) counter.start();
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl font-bold bio-glow-text font-mono">
        {custom || `${prefix || ''}${counter.value}${suffix || ''}`}
      </div>
      <div className="text-xs text-[var(--color-muted-text)] mt-1">{label}</div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative z-10" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '4rem clamp(2rem, 5vw, 5rem)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-biolume-border)] bg-[var(--color-biolume-glass)]"
            style={{ padding: '8px 16px', marginBottom: '2rem' }}
          >
            <Shield size={14} className="text-[var(--color-biolume-primary)]" />
            <span className="font-mono text-xs text-[var(--color-biolume-primary)]" style={{ letterSpacing: '0.05em' }}>&lt; BEHAVIORAL VERSION CONTROL /&gt;</span>
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem' }}>
            <span className="text-[var(--color-surface-text)]">Your AI Has</span>
            <br />
            <span className="bio-glow-text" style={{ filter: 'drop-shadow(0 0 30px rgba(0,255,209,0.4))' }}>
              No Version Control.
            </span>
          </h1>

          <p className="text-[var(--color-muted-text)]" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.125rem)', maxWidth: '500px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            DriftGuard fingerprints every AI deployment, diffs behavioral changes like code, and blocks regressions before your users feel them.
          </p>

          <div className="flex flex-wrap gap-4" style={{ marginBottom: '3rem' }}>
            <Link href="/dashboard">
              <GlowButton icon={<ArrowRight size={16} />}>Start Monitoring</GlowButton>
            </Link>
            <Link href="/dashboard">
              <GlowButton variant="ghost">View Live Demo</GlowButton>
            </Link>
          </div>

          <div className="flex gap-10">
            {stats.map((s, i) => <AnimatedStat key={i} {...s} />)}
          </div>
        </motion.div>

        {/* Right — Orb */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
          className="relative flex justify-center items-center"
        >
          <div className="relative flex items-center justify-center" style={{ width: '100%', maxWidth: '450px', aspectRatio: '1' }}>
            <NeuralOrb />

            {/* Floating cards */}
            <BioCard className="absolute z-10 animate-bio-drift" delay={0.5}
              style={{ top: '1rem', left: '0', padding: '12px', maxWidth: '200px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                <span className="text-xs font-mono text-[var(--color-muted-text)]">v1.3 → v1.4</span>
                <StatusBadge status="block" size="sm" />
              </div>
              <div className="text-xs text-[var(--color-biolume-danger)]">Hallucination +23%</div>
            </BioCard>

            <BioCard className="absolute z-10 animate-bio-drift-slow" delay={0.7}
              style={{ bottom: '4rem', right: '0', padding: '12px', maxWidth: '180px' }}>
              <div className="text-xs font-mono text-[var(--color-muted-text)]" style={{ marginBottom: '4px' }}>Fingerprint</div>
              <div className="flex gap-1">
                {[0.9, 0.7, 0.85, 0.6, 0.95, 0.4].map((v, i) => (
                  <div key={i} style={{ width: '12px', borderRadius: '2px', height: `${v * 28}px`, background: `rgba(0,255,209,${0.3 + v * 0.5})` }} />
                ))}
              </div>
            </BioCard>

            <BioCard className="absolute z-10 animate-bio-drift-fast" delay={0.9}
              style={{ bottom: '0', left: '1rem', padding: '12px', maxWidth: '210px' }}>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-biolume-warning)]">⚠</span>
                <span className="text-xs">Tone shift · billing endpoint</span>
              </div>
            </BioCard>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
