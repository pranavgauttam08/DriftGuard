// ============================================================
// app/api/v1/seed/route.ts
// Quick seed script to populate controls for the active org
// ============================================================
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DOMAIN_CODES, SupabaseControl } from '@/hooks/useControls';

export async function GET() {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json({ error: 'You must be logged into an organization to seed data.' }, { status: 401 });
  }

  try {
    const controlsToInsert: Partial<SupabaseControl>[] = [];
    let idCounter = 1;

    // Generate 5-8 controls per domain
    for (const domain of DOMAIN_CODES) {
      const numControls = Math.floor(Math.random() * 4) + 5; // 5 to 8
      
      for (let i = 1; i <= numControls; i++) {
        const idString = String(i).padStart(2, '0');
        const controlId = `${domain}-${idString}`;
        
        // Randomly assign status to make the dashboard look realistic
        const rand = Math.random();
        let status: 'PASS' | 'WARN' | 'FAIL' | 'NOT_ASSESSED' = 'PASS';
        if (rand > 0.6) status = 'FAIL';
        else if (rand > 0.4) status = 'WARN';
        else if (rand > 0.3) status = 'NOT_ASSESSED';

        // Assign Risk Level
        const riskLevels = ['Critical', 'High', 'Medium', 'Low'];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)] as any;

        controlsToInsert.push({
          org_id: orgId,
          domain_code: domain,
          control_id: controlId,
          control_name: `Sample Control for ${domain} ${idString}`,
          description: `This is an automatically generated control for testing the compliance dashboard. It verifies standards within the ${domain} domain.`,
          frameworks: ['SOC2', 'GDPR', 'NIST'],
          risk_level: riskLevel,
          status: status,
          owner_name: 'System Auto-Seed',
          notes: 'Seeded for testing.',
        });
      }
    }

    const { error } = await (supabaseAdmin as any).from('controls').insert(controlsToInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${controlsToInsert.length} controls for org: ${orgId}. Go back to the dashboard!` 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
