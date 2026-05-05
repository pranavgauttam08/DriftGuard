'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CTASection from '@/components/landing/CTASection';
import ToastSystem from '@/components/ui/ToastSystem';

const OceanCanvas = dynamic(() => import('@/components/three/OceanCanvas'), { ssr: false });

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <OceanCanvas />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 lg:px-20 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(0,5,7,0.95), rgba(0,5,7,0.6), transparent)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full relative flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(0,255,209,0.2), transparent)' }}>
            <div className="w-4 h-4 rounded-full border border-[var(--color-biolume-primary)]" style={{ boxShadow: '0 0 8px rgba(0,255,209,0.5)' }} />
          </div>
          <span className="font-mono text-sm font-semibold bio-glow-text">DriftGuard</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-muted-text)]">
          <a href="#features" className="hover:text-[var(--color-surface-text)] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[var(--color-surface-text)] transition-colors">How It Works</a>
          <Link href="/sign-in" className="hover:text-[var(--color-surface-text)] transition-colors">Sign In</Link>
          <Link href="/sign-up" className="bio-button !py-2 !px-5 !text-xs">Get Started →</Link>
        </div>
      </nav>

      <div className="pt-20">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CTASection />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--color-biolume-border)] px-8 md:px-12 lg:px-20 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-mono text-xs text-[var(--color-ghost-text)]">© 2026 DriftGuard. Behavioral intelligence for AI.</span>
          <div className="flex gap-6 text-xs text-[var(--color-ghost-text)]">
            <span>Documentation</span><span>GitHub</span><span>Status</span>
          </div>
        </div>
      </footer>

      <ToastSystem />
    </main>
  );
}
