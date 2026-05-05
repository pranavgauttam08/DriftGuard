'use client';
import Sidebar from '@/components/dashboard/Sidebar';
import CommandPalette from '@/components/dashboard/CommandPalette';
import ToastSystem from '@/components/ui/ToastSystem';
import { useDriftGuard } from '@/hooks';
import React, { createContext, useContext } from 'react';

type DriftGuardContextType = ReturnType<typeof useDriftGuard>;
const DriftGuardContext = createContext<DriftGuardContextType | null>(null);
export function useDriftGuardContext() {
  const ctx = useContext(DriftGuardContext);
  if (!ctx) throw new Error('useDriftGuardContext must be used within DashboardLayout');
  return ctx;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dg = useDriftGuard();
  return (
    <DriftGuardContext.Provider value={dg}>
      <div className="flex min-h-screen" style={{ background: 'var(--color-abyss)' }}>
        {/* Subtle CSS gradient background */}
        <div className="fixed inset-0 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse at 10% 90%, rgba(0,255,209,0.03) 0%, transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(0,229,255,0.02) 0%, transparent 50%)' }} />

        <Sidebar />

        <main style={{ flex: 1, marginLeft: '220px', padding: 'clamp(1.5rem, 3vw, 2.5rem)', position: 'relative', zIndex: 10, minHeight: '100vh', overflowX: 'hidden' }}>
          {children}
        </main>

        <CommandPalette />
        <ToastSystem />
      </div>
    </DriftGuardContext.Provider>
  );
}
