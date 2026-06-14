'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTenant } from '@/hooks/useTenant';
import {
  LayoutDashboard, Clock, Map, AlertTriangle, ShieldAlert, Bell, Server, Settings, LogOut,
  ChevronDown, Building2, FolderKanban, GitBranch, Database, ClipboardCheck, Shield, Activity,
  Crown, Book,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/endpoints', label: 'Endpoints', icon: Server },
  { href: '/dashboard/timeline', label: 'Timeline', icon: Clock },
  { href: '/dashboard/drift', label: 'Drift Map', icon: Map },
  { href: '/dashboard/regressions', label: 'Regressions', icon: AlertTriangle },
  { href: '/dashboard/probes', label: 'Probe Runner', icon: ShieldAlert },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
];

const enterpriseNav = [
  { href: '/dashboard/executive', label: 'Executive', icon: Crown },
  { href: '/dashboard/deployments', label: 'Deployments', icon: GitBranch },
  { href: '/dashboard/datasets', label: 'Datasets', icon: Database },
  { href: '/dashboard/traces', label: 'Traces', icon: Activity },
  { href: '/dashboard/reviews', label: 'Reviews', icon: ClipboardCheck },
];

const bottomNav = [
  { href: '/dashboard/api-docs', label: 'API Docs', icon: Book },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/settings/security', label: 'Security', icon: Shield },
];

const ENV_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  development: { bg: 'rgba(0,229,255,0.08)', text: '#00E5FF', dot: '#00E5FF' },
  staging: { bg: 'rgba(255,184,0,0.08)', text: '#FFB800', dot: '#FFB800' },
  production: { bg: 'rgba(0,255,136,0.08)', text: '#00FF88', dot: '#00FF88' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const tenant = useTenant();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

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

      {/* ── Organization Selector ──────────────────────────── */}
      <div className="relative" style={{ borderBottom: '1px solid rgba(0,255,209,0.06)' }}>
        <button
          onClick={() => { setOrgDropdownOpen(!orgDropdownOpen); setProjectDropdownOpen(false); }}
          className="w-full flex items-center gap-2 text-left transition-all hover:bg-[rgba(0,255,209,0.04)]"
          style={{ padding: '10px 16px' }}
        >
          <Building2 size={14} className="text-[var(--color-biolume-primary)] flex-shrink-0" />
          <span className="text-xs font-medium text-[var(--color-surface-text)] truncate flex-1">
            {tenant.org?.name || 'Select Org'}
          </span>
          <ChevronDown size={12} className={`text-[var(--color-ghost-text)] transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {orgDropdownOpen && tenant.organizations.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute left-3 right-3 z-50 rounded-lg overflow-hidden"
              style={{ top: '100%', background: 'rgba(1,20,24,0.98)', border: '1px solid rgba(0,255,209,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
            >
              {tenant.organizations.map(o => (
                <button
                  key={o.id}
                  onClick={() => { tenant.switchOrg(o.id); setOrgDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 text-xs text-left transition-all hover:bg-[rgba(0,255,209,0.06)]"
                  style={{ padding: '8px 12px', color: o.id === tenant.org?.id ? '#00FFD1' : '#E0F2F1' }}
                >
                  <Building2 size={12} />
                  <span className="truncate">{o.name}</span>
                  {o.id === tenant.org?.id && <span className="ml-auto text-[10px]">✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Project Selector ───────────────────────────────── */}
      <div className="relative" style={{ borderBottom: '1px solid rgba(0,255,209,0.06)' }}>
        <button
          onClick={() => { setProjectDropdownOpen(!projectDropdownOpen); setOrgDropdownOpen(false); }}
          className="w-full flex items-center gap-2 text-left transition-all hover:bg-[rgba(0,255,209,0.04)]"
          style={{ padding: '10px 16px' }}
        >
          <FolderKanban size={14} className="text-[var(--color-biolume-secondary)] flex-shrink-0" />
          <span className="text-xs font-medium text-[var(--color-surface-text)] truncate flex-1">
            {tenant.project?.name || 'Select Project'}
          </span>
          <ChevronDown size={12} className={`text-[var(--color-ghost-text)] transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {projectDropdownOpen && tenant.projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute left-3 right-3 z-50 rounded-lg overflow-hidden"
              style={{ top: '100%', background: 'rgba(1,20,24,0.98)', border: '1px solid rgba(0,255,209,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
            >
              {tenant.projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { tenant.switchProject(p.id); setProjectDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 text-xs text-left transition-all hover:bg-[rgba(0,255,209,0.06)]"
                  style={{ padding: '8px 12px', color: p.id === tenant.project?.id ? '#00FFD1' : '#E0F2F1' }}
                >
                  <FolderKanban size={12} />
                  <span className="truncate">{p.name}</span>
                  {p.id === tenant.project?.id && <span className="ml-auto text-[10px]">✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Environment Tabs ───────────────────────────────── */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(0,255,209,0.06)' }}>
        {tenant.environments.map(env => {
          const colors = ENV_COLORS[env.name] || ENV_COLORS.development;
          const isActive = tenant.environment?.id === env.id;
          return (
            <button
              key={env.id}
              onClick={() => tenant.switchEnvironment(env.name)}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono uppercase transition-all"
              style={{
                padding: '8px 4px',
                background: isActive ? colors.bg : 'transparent',
                color: isActive ? colors.text : '#3A5A5D',
                borderBottom: isActive ? `2px solid ${colors.text}` : '2px solid transparent',
              }}
            >
              <span className="rounded-full" style={{ width: '5px', height: '5px', background: isActive ? colors.dot : '#2A4A4D' }} />
              {env.name.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* User info */}
      {user && (
        <div className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,255,209,0.06)' }}>
          <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: '24px', height: '24px', background: 'rgba(0,255,209,0.15)', border: '1px solid rgba(0,255,209,0.2)' }}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[var(--color-biolume-primary)]">
                {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[var(--color-surface-text)] truncate">{user.firstName || 'User'}</div>
            <div className="text-[9px] text-[var(--color-ghost-text)] truncate font-mono uppercase">{tenant.role}</div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
        {/* Core section */}
        <div className="text-[9px] font-mono uppercase text-[var(--color-ghost-text)]" style={{ padding: '8px 12px 4px' }}>Core</div>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: 2 }}
                className="flex items-center gap-3 rounded-lg text-xs transition-all"
                style={{
                  padding: '8px 12px',
                  color: isActive ? '#00FFD1' : '#5A7A7D',
                  background: isActive ? 'rgba(0,255,209,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #00FFD1' : '2px solid transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,255,209,0.4)' : 'none',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.label === 'Alerts' && (
                  <span className="ml-auto rounded-full flex items-center justify-center font-mono"
                    style={{ width: '18px', height: '18px', fontSize: '9px', background: 'rgba(255,61,107,0.2)', color: '#FF3D6B' }}>
                    3
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Enterprise section */}
        <div className="text-[9px] font-mono uppercase text-[var(--color-ghost-text)]" style={{ padding: '12px 12px 4px' }}>Enterprise</div>
        {enterpriseNav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: 2 }}
                className="flex items-center gap-3 rounded-lg text-xs transition-all"
                style={{
                  padding: '8px 12px',
                  color: isActive ? '#00FFD1' : '#5A7A7D',
                  background: isActive ? 'rgba(0,255,209,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #00FFD1' : '2px solid transparent',
                  textShadow: isActive ? '0 0 10px rgba(0,255,209,0.4)' : 'none',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
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
              <div className="flex items-center gap-3 rounded-lg text-xs transition-all"
                style={{
                  padding: '8px 12px',
                  color: isActive ? '#00FFD1' : '#5A7A7D',
                  background: isActive ? 'rgba(0,255,209,0.06)' : 'transparent',
                }}>
                <Icon size={14} /><span>{item.label}</span>
              </div>
            </Link>
          );
        })}
        <button onClick={() => signOut({ redirectUrl: '/' })}
          className="w-full flex items-center gap-3 rounded-lg text-xs transition-all"
          style={{ padding: '8px 12px', color: '#5A7A7D' }}>
          <LogOut size={14} /><span>Sign Out</span>
        </button>
      </div>

      {/* Version */}
      <div style={{ padding: '8px 20px', fontSize: '10px', color: '#2A4A4D', fontFamily: 'var(--font-mono)' }}>v1.0.0-enterprise</div>
    </aside>
  );
}

