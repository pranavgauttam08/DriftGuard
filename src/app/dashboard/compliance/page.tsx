'use client';
// ============================================================
// app/dashboard/compliance/page.tsx
// Main Compliance Dashboard
// Connects to live Supabase data via useComplianceScore hook.
// Features Supabase Realtime updates and animated score rings.
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/dashboard/TopBar';
import DomainScoreRing from '@/components/governance/DomainScoreRing';
import ControlCard from '@/components/governance/ControlCard';
import { useComplianceScore, useRealtimeStatus } from '@/hooks/useControls';
import { useTenant } from '@/hooks/useTenant';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

// ── Animation Variants ───────────────────────────────────────
const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } };
const ringVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ── Helper to map score colors ───────────────────────────────
function getRingColor(score: number): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function getGradeBadgeColor(grade: string) {
  if (grade === 'A') return { bg: 'var(--color-grade-a-bg)', text: 'var(--color-grade-a-text)' };
  if (grade === 'B') return { bg: 'var(--color-grade-b-bg)', text: 'var(--color-grade-b-text)' };
  if (grade === 'C') return { bg: 'var(--color-grade-c-bg)', text: 'var(--color-grade-c-text)' };
  return { bg: 'var(--color-grade-df-bg)', text: 'var(--color-grade-df-text)' };
}

// ── Domain Code to Name Map ───────────────────────────────────
const DOMAIN_NAMES: Record<string, string> = {
  GL: 'Governance & Leadership',
  RM: 'Risk Management',
  RO: 'Roles & Responsibilities',
  LC: 'Lifecycle & CI/CD',
  SE: 'Security & Privacy',
  PR: 'Performance & Robustness',
  RS: 'Resilience & Safety',
  AA: 'Accountability & Audit',
  OM: 'Operations & Monitoring',
  IM: 'Incident Management',
  TP: 'Third-Party Risk',
  CO: 'Continuous Optimization',
};

// ── Skeleton Loader ──────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse mt-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-[80px] h-[80px] rounded-full" style={{ background: 'var(--color-bg-overlay)' }} />
          <div className="w-12 h-3 rounded" style={{ background: 'var(--color-bg-overlay)' }} />
          <div className="w-16 h-2 rounded" style={{ background: 'var(--color-bg-overlay)' }} />
        </div>
      ))}
    </div>
  );
}

export default function ComplianceDashboardPage() {
  const { org } = useTenant();
  const orgId = org?.id ?? '';
  
  // Connect to live data
  const { data: report, isLoading, isError, error } = useComplianceScore(orgId);
  const realtimeStatus = useRealtimeStatus(orgId);

  // If no data yet (not even cached), don't render 0s.
  const isPending = isLoading || !report;

  // Derived state
  const totalPassing = report?.domains.reduce((acc, d) => acc + d.passing, 0) ?? 0;
  const totalControls = report?.domains.reduce((acc, d) => acc + d.total, 0) ?? 0;
  const criticalFailures = report?.criticalFailures.filter(c => c.risk_level === 'Critical') ?? [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex items-center justify-between">
        <TopBar title="Compliance Hub" />
        
        {/* ── LIVE Badge ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded-full border"
             style={{ 
               background: 'var(--color-bg-overlay)',
               borderColor: 'var(--color-border-subtle)',
               color: realtimeStatus === 'SUBSCRIBED' ? 'var(--color-text-success)' : 'var(--color-text-warning)'
             }}>
          <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'SUBSCRIBED' ? 'animate-pulse' : ''}`}
               style={{ background: 'currentColor' }} />
          {realtimeStatus === 'SUBSCRIBED' ? 'LIVE' : 'Reconnecting...'}
        </div>
      </div>

      {/* ── ERROR STATE ──────────────────────────────────────── */}
      {isError && (
         <div className="ag-card p-4 flex flex-col gap-2" style={{ background: 'var(--color-background-danger)', borderColor: 'var(--color-border-danger)' }}>
            <div className="flex items-center gap-3">
               <AlertTriangle size={20} style={{ color: 'var(--color-text-danger)' }} />
               <span style={{ color: 'var(--color-text-danger)', fontWeight: 'bold' }}>Failed to load compliance data.</span>
            </div>
            {error?.message && (
               <div className="text-xs font-mono p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--color-text-danger)' }}>
                  Error details: {error.message}
               </div>
            )}
         </div>
      )}

      {/* ── TOP SECTION: Overall Score Hero ──────────────────── */}
      {!isPending && !isError && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ag-card relative overflow-hidden" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          
          {/* Critical Failures Alert Banner inside Hero */}
          {criticalFailures.length > 0 && (
            <div className="absolute top-0 left-0 w-full px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold"
                 style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', borderBottom: '1px solid var(--color-border-danger)' }}>
               <AlertTriangle size={14} />
               {criticalFailures.length} critical controls require immediate attention: 
               {criticalFailures.slice(0, 3).map(c => c.control_id).join(', ')}
               {criticalFailures.length > 3 ? '...' : ''}
            </div>
          )}

          <div className="flex flex-col items-center justify-center pt-4">
             <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.025em' }}>
                AI Governance Score
             </h2>
             
             {/* Huge Score Ring */}
             <DomainScoreRing 
                score={report.overallScore} 
                domainCode="ALL" 
                domainName="Platform Average"
                passing={totalPassing} 
                total={totalControls} 
                color={getRingColor(report.overallScore)} 
                size="lg" 
             />

             {/* Grade Badge */}
             <div className="mt-6 px-4 py-1 rounded-full text-sm font-bold font-mono"
                  style={{ 
                    background: getGradeBadgeColor(report.overallGrade).bg, 
                    color: getGradeBadgeColor(report.overallGrade).text 
                  }}>
                Grade {report.overallGrade}
             </div>

             <p className="text-sm mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                {totalPassing} of {totalControls} controls passing
             </p>
          </div>
        </motion.div>
      )}

      {/* ── MIDDLE SECTION: 12 Domain Rings ──────────────────── */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Compliance by Domain</h3>
        
        {isPending ? (
           <DashboardSkeleton />
        ) : (
           <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-8 gap-x-4">
             {report.domains.map(domain => (
               <motion.div key={domain.domainCode} variants={ringVariants} className="flex justify-center">
                 <DomainScoreRing
                   score={domain.score}
                   domainCode={domain.domainCode}
                   domainName={DOMAIN_NAMES[domain.domainCode] || domain.domainCode}
                   passing={domain.passing}
                   total={domain.total}
                   color={getRingColor(domain.score)}
                   size="sm"
                 />
               </motion.div>
             ))}
           </motion.div>
        )}
      </div>

      {/* ── BOTTOM SECTION: Controls Requiring Action ────────── */}
      {!isPending && !isError && (
        <div className="mt-4">
           <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Controls Requiring Attention</h3>
           
           {report.criticalFailures.length === 0 ? (
              <div className="ag-card flex items-center justify-center gap-2 py-6 text-sm" style={{ background: 'var(--color-background-success)', borderColor: 'var(--color-text-success)', color: 'var(--color-text-success)' }}>
                 <CheckCircle size={16} />
                 ✓ No critical failures — great work!
              </div>
           ) : (
              <div className="flex flex-col gap-3">
                 {/* Only showing FAIL controls, sorted by Critical first */}
                 {report.criticalFailures
                    .sort((a, b) => {
                       if (a.risk_level === 'Critical' && b.risk_level !== 'Critical') return -1;
                       if (b.risk_level === 'Critical' && a.risk_level !== 'Critical') return 1;
                       return 0;
                    })
                    .slice(0, 5) // limit to top 5 for dashboard
                    .map((control: any) => (
                       <ControlCard key={control.id} control={control} orgId={orgId} />
                    ))}
              </div>
           )}
        </div>
      )}

    </div>
  );
}
