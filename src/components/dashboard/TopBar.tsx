'use client';
import { Search, Bell } from 'lucide-react';
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TopBar({ title }: { title: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
      <div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ marginBottom: '4px', color: 'var(--color-text-muted)' }}>
          {breadcrumbs.map((bc, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">›</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-[var(--color-text-secondary)]' : ''}>{bc.label}</span>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-2 rounded-lg transition-all"
          style={{ padding: '8px 14px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Search...</span>
          <kbd className="text-[10px] font-mono rounded" style={{ padding: '2px 6px', background: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>⌘K</kbd>
        </button>
        <button className="relative rounded-lg transition-all" style={{ padding: '8px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
          <Bell size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center font-mono"
            style={{ width: '16px', height: '16px', fontSize: '9px', background: '#EF4444', color: '#fff', boxShadow: '0 0 8px rgba(239,68,68,0.4)' }}>
            3
          </span>
        </button>
        <OrganizationSwitcher
          hidePersonal={true}
          appearance={{
            elements: {
              organizationSwitcherTrigger: {
                color: 'var(--color-text-primary)',
                padding: '6px 12px',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                background: 'var(--color-bg-elevated)'
              }
            }
          }}
        />
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: '32px', height: '32px', border: '1px solid var(--color-border-default)' },
            },
          }}
        />
      </div>
    </div>
  );
}
