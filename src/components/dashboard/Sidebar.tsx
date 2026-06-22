'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTenant } from '@/hooks/useTenant';
import {
  LayoutDashboard, Bell, Server, Clock, Map, AlertTriangle, ShieldAlert,
  ChevronDown, ChevronRight, Building2, FolderKanban, GitBranch, Database,
  ClipboardCheck, Shield, Activity, Crown, Book, DollarSign, Cpu, Settings,
  LogOut, Eye, FileCheck, BarChart3, Ghost, Scale, Lock, FileWarning,
  Siren, Package, Megaphone, Key, ScrollText,
} from 'lucide-react';

// ── Navigation Configuration ──────────────────────────────────────
interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: any; badge?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/alerts', label: 'Alerts', icon: Bell, badge: '3' },
    ],
  },
  {
    label: 'Behavioral',
    items: [
      { href: '/dashboard/endpoints', label: 'Endpoints', icon: Server },
      { href: '/dashboard/timeline', label: 'Timeline', icon: Clock },
      { href: '/dashboard/drift', label: 'Drift Map', icon: Map },
      { href: '/dashboard/probes', label: 'Probes', icon: ShieldAlert },
      { href: '/dashboard/regressions', label: 'Regressions', icon: AlertTriangle },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/dashboard/compliance', label: 'Hub', icon: FileCheck },
      { href: '/dashboard/compliance/soc2', label: 'SOC2', icon: Shield },
      { href: '/dashboard/compliance/gdpr', label: 'GDPR', icon: Lock },
      { href: '/dashboard/compliance/eu-ai-act', label: 'EU AI Act', icon: Scale },
      { href: '/dashboard/compliance/nist', label: 'NIST', icon: Shield },
      { href: '/dashboard/compliance/iso42001', label: 'ISO 42001', icon: FileCheck },
    ],
  },
  {
    label: 'Governance',
    items: [
      { href: '/dashboard/governance', label: 'Leadership', icon: Crown },
      { href: '/dashboard/governance/risk', label: 'Risk', icon: AlertTriangle },
      { href: '/dashboard/governance/lifecycle', label: 'Lifecycle', icon: GitBranch },
      { href: '/dashboard/governance/transparency', label: 'Transparency', icon: Megaphone },
    ],
  },
  {
    label: 'Security & Privacy',
    items: [
      { href: '/dashboard/security', label: 'Security', icon: Shield },
      { href: '/dashboard/security/privacy', label: 'Privacy', icon: Eye },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/dashboard/cost-intelligence', label: 'Cost Intel', icon: DollarSign },
      { href: '/dashboard/model-advisor', label: 'Model Advisor', icon: Cpu },
      { href: '/dashboard/monitoring/roi', label: 'AI ROI', icon: BarChart3 },
      { href: '/dashboard/monitoring/shadow-ai', label: 'Shadow AI', icon: Ghost },
    ],
  },
  {
    label: 'Incidents & Audit',
    items: [
      { href: '/dashboard/incidents', label: 'Incidents', icon: Siren },
      { href: '/dashboard/audit-center', label: 'Audit', icon: ScrollText },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { href: '/dashboard/deployments', label: 'Deployments', icon: GitBranch },
      { href: '/dashboard/thirdparty', label: 'Third Party', icon: Package },
      { href: '/dashboard/reviews', label: 'Reviews', icon: ClipboardCheck },
    ],
  },
];

const BOTTOM_NAV = [
  { href: '/dashboard/api-docs', label: 'API Docs', icon: Book },
  { href: '/dashboard/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const ENV_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  development: { bg: 'rgba(96,165,250,0.08)', text: '#60A5FA', dot: '#60A5FA' },
  staging:     { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', dot: '#F59E0B' },
  production:  { bg: 'rgba(16,185,129,0.08)', text: '#10B981', dot: '#10B981' },
};

// ── Brand Colors ─────────────────────────────────────────────────
const BRAND = '#3B82F6';
const BRAND_GLOW = '#60A5FA';
const TEXT_PRIMARY = '#F1F5F9';
const TEXT_SECONDARY = '#94A3B8';
const TEXT_MUTED = '#475569';
const SURFACE = '#0D1117';
const BORDER = '#1E2536';

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const tenant = useTenant();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className="h-screen fixed left-0 top-0 flex flex-col z-40 max-md:hidden"
      style={{ width: '260px', background: SURFACE, borderRight: `1px solid ${BORDER}` }}
    >
      {/* ── Logo ────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-lg relative flex items-center justify-center" style={{
            width: '32px', height: '32px',
            background: `linear-gradient(135deg, ${BRAND}20, ${BRAND}08)`,
            border: `1px solid ${BRAND}40`,
          }}>
            <Shield size={16} style={{ color: BRAND }} />
          </div>
          <div>
            <span className="font-semibold text-sm ag-glow-text" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>DriftGuard</span>
            <span className="block text-[9px] font-mono uppercase" style={{ color: TEXT_MUTED, letterSpacing: '0.1em' }}>AI Governance</span>
          </div>
        </Link>
      </div>

      {/* ── Organization Selector ──────────────────────────── */}
      <div className="relative" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => { setOrgDropdownOpen(!orgDropdownOpen); setProjectDropdownOpen(false); }}
          className="w-full flex items-center gap-2 text-left transition-all"
          style={{ padding: '10px 16px' }}
          onMouseEnter={e => (e.currentTarget.style.background = `${BRAND}08`)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Building2 size={14} style={{ color: BRAND, flexShrink: 0 }} />
          <span className="text-xs font-medium truncate flex-1" style={{ color: TEXT_PRIMARY }}>
            {tenant.org?.name || 'Select Org'}
          </span>
          <ChevronDown size={12} className={`transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} style={{ color: TEXT_MUTED }} />
        </button>
        <AnimatePresence>
          {orgDropdownOpen && tenant.organizations.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute left-3 right-3 z-50 rounded-lg overflow-hidden"
              style={{ top: '100%', background: '#0A0F18', border: `1px solid ${BORDER}`, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}
            >
              {tenant.organizations.map(o => (
                <button
                  key={o.id}
                  onClick={() => { tenant.switchOrg(o.id); setOrgDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 text-xs text-left transition-all"
                  style={{ padding: '8px 12px', color: o.id === tenant.org?.id ? BRAND : TEXT_PRIMARY }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${BRAND}0A`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
      <div className="relative" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => { setProjectDropdownOpen(!projectDropdownOpen); setOrgDropdownOpen(false); }}
          className="w-full flex items-center gap-2 text-left transition-all"
          style={{ padding: '10px 16px' }}
          onMouseEnter={e => (e.currentTarget.style.background = `${BRAND}08`)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <FolderKanban size={14} style={{ color: BRAND_GLOW, flexShrink: 0 }} />
          <span className="text-xs font-medium truncate flex-1" style={{ color: TEXT_PRIMARY }}>
            {tenant.project?.name || 'Select Project'}
          </span>
          <ChevronDown size={12} className={`transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} style={{ color: TEXT_MUTED }} />
        </button>
        <AnimatePresence>
          {projectDropdownOpen && tenant.projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute left-3 right-3 z-50 rounded-lg overflow-hidden"
              style={{ top: '100%', background: '#0A0F18', border: `1px solid ${BORDER}`, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}
            >
              {tenant.projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { tenant.switchProject(p.id); setProjectDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 text-xs text-left transition-all"
                  style={{ padding: '8px 12px', color: p.id === tenant.project?.id ? BRAND : TEXT_PRIMARY }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${BRAND}0A`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
      <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {tenant.environments.map(env => {
          const colors = ENV_COLORS[env.name] || ENV_COLORS.development;
          const active = tenant.environment?.id === env.id;
          return (
            <button
              key={env.id}
              onClick={() => tenant.switchEnvironment(env.name)}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono uppercase transition-all"
              style={{
                padding: '8px 4px',
                background: active ? colors.bg : 'transparent',
                color: active ? colors.text : TEXT_MUTED,
                borderBottom: active ? `2px solid ${colors.text}` : '2px solid transparent',
              }}
            >
              <span className="rounded-full" style={{ width: '5px', height: '5px', background: active ? colors.dot : '#252D3D' }} />
              {env.name.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* ── User Info ──────────────────────────────────────── */}
      {user && (
        <div className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: '24px', height: '24px', background: `${BRAND}15`, border: `1px solid ${BRAND}30` }}>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono" style={{ color: BRAND }}>
                {(user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium truncate" style={{ color: TEXT_PRIMARY }}>{user.firstName || 'User'}</div>
            <div className="text-[9px] truncate font-mono uppercase" style={{ color: TEXT_MUTED }}>{tenant.role}</div>
          </div>
        </div>
      )}

      {/* ── Main Navigation ────────────────────────────────── */}
      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const isCollapsed = collapsedGroups[group.label];
          const hasActiveChild = group.items.some(item => isActive(item.href));

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center gap-1 text-[9px] font-mono uppercase transition-all"
                style={{
                  padding: '8px 12px 4px',
                  color: hasActiveChild ? BRAND : TEXT_MUTED,
                  letterSpacing: '0.1em',
                }}
              >
                <ChevronRight size={8} className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                {group.label}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {group.items.map(item => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div whileHover={{ x: 2 }}
                            className="flex items-center gap-3 rounded-md text-xs transition-all"
                            style={{
                              padding: '7px 12px',
                              color: active ? BRAND : TEXT_SECONDARY,
                              background: active ? `${BRAND}0C` : 'transparent',
                              borderLeft: active ? `2px solid ${BRAND}` : '2px solid transparent',
                            }}
                          >
                            <Icon size={14} />
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto rounded-full flex items-center justify-center font-mono"
                                style={{ width: '18px', height: '18px', fontSize: '9px', background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                                {item.badge}
                              </span>
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom Nav ─────────────────────────────────────── */}
      <div className="px-3 py-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        {BOTTOM_NAV.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 rounded-md text-xs transition-all"
                style={{
                  padding: '7px 12px',
                  color: active ? BRAND : TEXT_SECONDARY,
                  background: active ? `${BRAND}0C` : 'transparent',
                }}>
                <Icon size={14} /><span>{item.label}</span>
              </div>
            </Link>
          );
        })}
        <button onClick={() => signOut({ redirectUrl: '/' })}
          className="w-full flex items-center gap-3 rounded-md text-xs transition-all"
          style={{ padding: '7px 12px', color: TEXT_SECONDARY }}>
          <LogOut size={14} /><span>Sign Out</span>
        </button>
      </div>

      {/* ── Version ────────────────────────────────────────── */}
      <div style={{ padding: '8px 20px', fontSize: '10px', color: TEXT_MUTED, fontFamily: 'var(--font-mono)' }}>v3.0.0-antigravity</div>
    </aside>
  );
}
