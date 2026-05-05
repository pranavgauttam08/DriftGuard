'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import GlowButton from '@/components/ui/GlowButton';
import { useScrollReveal } from '@/hooks';

export default function CTASection() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="relative z-10" style={{ padding: 'clamp(4rem, 8vw, 8rem) clamp(2rem, 5vw, 5rem)' }}>
      <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }} className="text-center" style={{ maxWidth: '700px', margin: '0 auto' }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-biolume-border)] bg-[var(--color-biolume-glass)]"
          style={{ padding: '8px 16px', marginBottom: '2rem' }}>
          <Zap size={14} className="text-[var(--color-biolume-warning)]" />
          <span className="font-mono text-xs text-[var(--color-biolume-warning)]">FREE FOR FIRST 10K RESPONSES</span>
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 800, marginBottom: '1.5rem' }}>
          Stop Shipping <span className="bio-glow-text">Blind.</span>
        </h2>
        <p className="text-[var(--color-muted-text)]" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.125rem)', marginBottom: '2.5rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Every AI update is a behavioral gamble. DriftGuard turns that gamble into a measured, gated deployment with full behavioral transparency.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/dashboard">
            <GlowButton size="lg" icon={<ArrowRight size={18} />}>Start Free</GlowButton>
          </Link>
          <Link href="/dashboard">
            <GlowButton variant="ghost" size="lg">Book a Demo</GlowButton>
          </Link>
        </div>
        <div className="flex justify-center gap-6 flex-wrap text-[var(--color-ghost-text)] text-xs font-mono" style={{ marginTop: '3rem' }}>
          <span>No credit card required</span>
          <span>·</span>
          <span>Setup in 5 minutes</span>
          <span>·</span>
          <span>Works with any LLM</span>
        </div>
      </motion.div>
    </section>
  );
}
