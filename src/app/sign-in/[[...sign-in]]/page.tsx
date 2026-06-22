'use client';
import { SignIn } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

const OceanCanvas = dynamic(() => import('@/components/three/OceanCanvas'), { ssr: false });

export default function SignInPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <OceanCanvas />
      <div className="relative z-10 flex flex-col items-center" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
        {/* Logo + tagline */}
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: '1rem' }}>
            <div className="rounded-full relative flex items-center justify-center" style={{ width: '40px', height: '40px', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
              <div className="rounded-full border border-[var(--color-brand-primary)]" style={{ width: '20px', height: '20px', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
            </div>
            <span className="font-mono text-lg font-bold ag-glow-text">DriftGuard</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]" style={{ lineHeight: 1.6 }}>
            Monitor your AI. Catch regressions.<br />Ship with confidence.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: { width: '100%', boxShadow: '0 0 60px rgba(59,130,246,0.06)' },
            },
          }}
        />
      </div>
    </main>
  );
}
