'use client';
import { Search, Bell } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TopBar({ title }: { title: string }) {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);

  // ⌘K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Dispatch custom event for CommandPalette
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Build breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-ghost-text)] font-mono" style={{ marginBottom: '4px' }}>
          {breadcrumbs.map((bc, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1">›</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-[var(--color-muted-text)]' : ''}>{bc.label}</span>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-surface-text)]">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex items-center gap-2 rounded-lg transition-all"
          style={{ padding: '8px 14px', background: 'rgba(0,255,209,0.04)', border: '1px solid rgba(0,255,209,0.1)' }}
        >
          <Search size={14} className="text-[var(--color-ghost-text)]" />
          <span className="text-xs text-[var(--color-ghost-text)]">Search...</span>
          <kbd className="text-[10px] font-mono text-[var(--color-ghost-text)] rounded" style={{ padding: '2px 6px', background: 'rgba(0,255,209,0.06)', border: '1px solid rgba(0,255,209,0.1)' }}>⌘K</kbd>
        </button>
        <button className="relative rounded-lg transition-all" style={{ padding: '8px', background: 'rgba(0,255,209,0.04)', border: '1px solid rgba(0,255,209,0.1)' }}>
          <Bell size={16} className="text-[var(--color-muted-text)]" />
          <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center font-mono"
            style={{ width: '16px', height: '16px', fontSize: '9px', background: '#FF3D6B', color: '#fff', boxShadow: '0 0 8px rgba(255,61,107,0.4)' }}>
            3
          </span>
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: '32px', height: '32px', border: '1px solid rgba(0,255,209,0.2)' },
            },
          }}
        />
      </div>
    </div>
  );
}
