'use client';
import { motion } from 'framer-motion';
import { Fingerprint, GitCompare, Map, ShieldAlert, GitBranch, Bell } from 'lucide-react';
import { useScrollReveal } from '@/hooks';

const features = [
  { icon: Fingerprint, title: 'Behavioral Fingerprinting', desc: '8-dimensional profile capturing tone, consistency, hallucination rate, and latency across every AI version.' },
  { icon: GitCompare, title: 'Git-Style Diffs', desc: 'Side-by-side behavioral comparisons with regression detection, severity classification, and human-readable verdicts.' },
  { icon: Map, title: 'Semantic Drift Map', desc: 'Force-directed 2D visualization of response embeddings showing how behavior clusters shift between versions.' },
  { icon: ShieldAlert, title: 'Adversarial Probes', desc: '20-probe test suite covering jailbreaks, injections, hallucinations, off-topic drift, and tone manipulation.' },
  { icon: GitBranch, title: 'CI/CD Integration', desc: 'Gate deployments with behavioral checks. Auto-block on critical regressions. GitHub Actions compatible.' },
  { icon: Bell, title: 'Real-Time Alerts', desc: 'Instant notifications for hallucination spikes, tone shifts, and semantic drift via Slack, email, or webhooks.' },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal();
  const Icon = feature.icon;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bio-card group" style={{ padding: '1.5rem' }}
    >
      <div className="rounded-lg flex items-center justify-center"
        style={{ width: '40px', height: '40px', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(0,255,209,0.12), rgba(0,229,255,0.06))' }}>
        <Icon size={20} className="text-[var(--color-biolume-primary)]" />
      </div>
      <h3 className="font-semibold text-[var(--color-surface-text)]" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
      <p className="text-[var(--color-muted-text)]" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{feature.desc}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section className="relative z-10" id="features" style={{ padding: 'clamp(4rem, 8vw, 8rem) clamp(2rem, 5vw, 5rem)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <motion.div ref={ref} initial={{ opacity: 0 }} animate={isVisible ? { opacity: 1 } : {}} className="text-center" style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '1rem' }}>
            Intelligence That <span className="bio-glow-text">Watches Itself</span>
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {features.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
