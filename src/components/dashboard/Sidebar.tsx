'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { LayoutDashboard, Clock, Map, AlertTriangle, ShieldAlert, Bell, Server, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/endpoints', label: 'Endpoints', icon: Server },
  { href: '/dashboard/timeline', label: 'Timeline', icon: Clock },
  { href: '/dashboard/drift', label: 'Drift Map', icon: Map },
  { href: '/dashboard/regressions', label: 'Regressions', icon: AlertTriangle },
  { href: '/dashboard/probes', label: 'Probe Runner', icon: ShieldAlert },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
];

const bottomNav = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  return (
    <aside className="h-screen fixed left-0 top-0 flex flex-col border-r border-[var(--color-biolume-border)] bg-[var(--color-deep)] z-40 max-md:hidden"
      style={{ width: '220px' }}>
      {/* Logo */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,255,209,0.08)' }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-full relative flex items-center justify-center" style={{ width: '28px', height: '28px', background: 'radial-gradient(circle, rgba(0,255,209,0.2), transparent)', boxShadow: '0 0 20px rgba(0,255,209,0.2)' }}>
            <div className="rounded-full border border-[var(--color-biolume-primary)]" style={{ width: '14px', height: '14px', boxShadow: '0 0 8px rgba(0,255,209,0.5)' }} />
          </div>
          <span className="font-mono text-sm font-semibold bio-glow-text">DriftGuard</span>
        </Link>
      </div>

      {/* User info */}
      {user && (
        <div className="flex items-center gap-3" style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,255,209,0.06)' }}>
          <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: '28px', height: '28px', background: 'rgba(0,255,209,0.15)', border: '1px solid rgba(0,255,209,0.2)' }}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[var(--color-biolume-primary)]">
                {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--color-surface-text)] truncate">{user.firstName || 'User'}</div>
            <div className="text-[10px] text-[var(--color-ghost-text)] truncate">{user.emailAddresses?.[0]?.emailAddress || ''}</div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: 2 }}
                className="flex items-center gap-3 rounded-lg text-sm transition-all"
                style={{
                  padding: '10px 12px',
                  color: isActive ? '#00FFD1' : '#5A7A7D',
                  background: isActive ? 'rgba(0,255,209,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #00FFD1' : '2px solid transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,255,209,0.4)' : 'none',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.label === 'Alerts' && (
                  <span className="ml-auto rounded-full flex items-center justify-center font-mono"
                    style={{ width: '20px', height: '20px', fontSize: '10px', background: 'rgba(255,61,107,0.2)', color: '#FF3D6B' }}>
                    3
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(0,255,209,0.06)' }}>
        {bottomNav.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 rounded-lg text-sm transition-all"
                style={{
                  padding: '10px 12px',
                  color: isActive ? '#00FFD1' : '#5A7A7D',
                  background: isActive ? 'rgba(0,255,209,0.06)' : 'transparent',
                }}>
                <Icon size={16} /><span>{item.label}</span>
              </div>
            </Link>
          );
        })}
        <button onClick={() => signOut({ redirectUrl: '/' })}
          className="w-full flex items-center gap-3 rounded-lg text-sm transition-all"
          style={{ padding: '10px 12px', color: '#5A7A7D' }}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>

      {/* Version */}
      <div style={{ padding: '12px 20px', fontSize: '10px', color: '#2A4A4D', fontFamily: 'var(--font-mono)' }}>v0.2.0</div>
    </aside>
  );
}
