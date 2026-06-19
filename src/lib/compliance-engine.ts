// ============================================================
// Compliance Engine — Framework scoring & remediation
// ============================================================

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ComplianceScore {
  framework: string;
  readinessPercent: number;
  controlsCovered: number;
  totalControls: number;
  evidenceCoverage: number;
  riskExposure: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  id: string;
  framework: string;
  controlId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  action: string;
  priority: number;
  owner: string;
}

// ── Framework Definitions ────────────────────────────────────
export const FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'soc2', name: 'SOC 2', description: 'Service Organization Control 2 — Trust Services Criteria',
    controls: [
      { id: 'soc2-cc1', name: 'Control Environment', description: 'Organizational commitment to integrity', status: 'met', evidence: ['Code of conduct', 'Ethics policy'], priority: 'high' },
      { id: 'soc2-cc2', name: 'Communication & Info', description: 'Internal and external communication controls', status: 'met', evidence: ['Communication policy'], priority: 'medium' },
      { id: 'soc2-cc3', name: 'Risk Assessment', description: 'Risk identification and mitigation', status: 'partial', evidence: ['Risk register'], priority: 'critical' },
      { id: 'soc2-cc4', name: 'Monitoring Activities', description: 'Ongoing monitoring of controls', status: 'met', evidence: ['DriftGuard monitoring', 'Alert system'], priority: 'high' },
      { id: 'soc2-cc5', name: 'Control Activities', description: 'Policies and procedures', status: 'partial', evidence: ['Access controls'], priority: 'high' },
      { id: 'soc2-cc6', name: 'Logical Access', description: 'Logical and physical access controls', status: 'met', evidence: ['RBAC', 'Clerk auth'], priority: 'critical' },
      { id: 'soc2-cc7', name: 'System Operations', description: 'System operation monitoring', status: 'met', evidence: ['Behavioral monitoring', 'Probe runner'], priority: 'high' },
      { id: 'soc2-cc8', name: 'Change Management', description: 'Change management controls', status: 'partial', evidence: ['Deployment governance'], priority: 'critical' },
      { id: 'soc2-cc9', name: 'Risk Mitigation', description: 'Risk mitigation strategies', status: 'partial', evidence: ['Drift detection'], priority: 'high' },
      { id: 'soc2-a1', name: 'Availability', description: 'System availability commitments', status: 'not_met', evidence: [], priority: 'medium' },
      { id: 'soc2-pi1', name: 'Processing Integrity', description: 'Processing accuracy and completeness', status: 'met', evidence: ['Behavioral fingerprints', 'Diff engine'], priority: 'high' },
      { id: 'soc2-p1', name: 'Privacy', description: 'Personal information protection', status: 'partial', evidence: ['PII detection'], priority: 'critical' },
    ],
  },
  {
    id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation',
    controls: [
      { id: 'gdpr-1', name: 'Lawful Processing', description: 'Legal basis for data processing', status: 'partial', evidence: ['Privacy policy'], priority: 'critical' },
      { id: 'gdpr-2', name: 'Data Minimization', description: 'Collect only necessary data', status: 'met', evidence: ['Data retention policy'], priority: 'high' },
      { id: 'gdpr-3', name: 'Storage Limitation', description: 'Data retention limits', status: 'partial', evidence: [], priority: 'high' },
      { id: 'gdpr-4', name: 'Data Security', description: 'Technical and organizational measures', status: 'met', evidence: ['Encryption', 'RLS'], priority: 'critical' },
      { id: 'gdpr-5', name: 'Right to Access', description: 'Data subject access rights', status: 'not_met', evidence: [], priority: 'high' },
      { id: 'gdpr-6', name: 'Right to Erasure', description: 'Right to be forgotten', status: 'not_met', evidence: [], priority: 'high' },
      { id: 'gdpr-7', name: 'Data Breach Notification', description: '72-hour breach notification', status: 'partial', evidence: ['Alert system'], priority: 'critical' },
      { id: 'gdpr-8', name: 'DPO Appointment', description: 'Data Protection Officer', status: 'not_met', evidence: [], priority: 'medium' },
    ],
  },
  {
    id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act',
    controls: [
      { id: 'hipaa-1', name: 'Access Control', description: 'Unique user identification', status: 'met', evidence: ['Clerk auth', 'RBAC'], priority: 'critical' },
      { id: 'hipaa-2', name: 'Audit Controls', description: 'Hardware/software/procedural mechanisms', status: 'partial', evidence: ['Audit log'], priority: 'critical' },
      { id: 'hipaa-3', name: 'Integrity', description: 'Data integrity protections', status: 'met', evidence: ['Behavioral fingerprints'], priority: 'high' },
      { id: 'hipaa-4', name: 'Transmission Security', description: 'Encrypted transmission', status: 'met', evidence: ['TLS/SSL'], priority: 'critical' },
      { id: 'hipaa-5', name: 'PHI De-identification', description: 'Remove/mask PHI data', status: 'partial', evidence: ['PII masking engine'], priority: 'critical' },
      { id: 'hipaa-6', name: 'BAA', description: 'Business Associate Agreement', status: 'not_met', evidence: [], priority: 'critical' },
    ],
  },
  {
    id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management System',
    controls: [
      { id: 'iso-a5', name: 'Info Security Policies', description: 'Management direction for information security', status: 'partial', evidence: ['Security policy'], priority: 'high' },
      { id: 'iso-a6', name: 'Organization of Info Security', description: 'Internal organization', status: 'partial', evidence: ['RBAC'], priority: 'medium' },
      { id: 'iso-a8', name: 'Asset Management', description: 'Inventory and classification', status: 'met', evidence: ['Endpoint registry'], priority: 'medium' },
      { id: 'iso-a9', name: 'Access Control', description: 'Business requirements for access', status: 'met', evidence: ['Clerk auth', 'RBAC'], priority: 'critical' },
      { id: 'iso-a10', name: 'Cryptography', description: 'Proper use of cryptographic controls', status: 'met', evidence: ['Encryption'], priority: 'high' },
      { id: 'iso-a12', name: 'Operations Security', description: 'Operational procedures', status: 'partial', evidence: ['Monitoring'], priority: 'high' },
      { id: 'iso-a16', name: 'Incident Management', description: 'Security incident management', status: 'partial', evidence: ['Alert system'], priority: 'critical' },
      { id: 'iso-a18', name: 'Compliance', description: 'Identification of applicable legislation', status: 'not_met', evidence: [], priority: 'high' },
    ],
  },
  {
    id: 'pci-dss', name: 'PCI-DSS', description: 'Payment Card Industry Data Security Standard',
    controls: [
      { id: 'pci-1', name: 'Network Security', description: 'Install and maintain network security', status: 'met', evidence: ['Firewall', 'VPC'], priority: 'critical' },
      { id: 'pci-2', name: 'Secure Configurations', description: 'Secure system configurations', status: 'partial', evidence: [], priority: 'high' },
      { id: 'pci-3', name: 'Protect Stored Data', description: 'Protect stored account data', status: 'partial', evidence: ['Encryption'], priority: 'critical' },
      { id: 'pci-4', name: 'Encrypt Transmissions', description: 'Encrypt transmission of cardholder data', status: 'met', evidence: ['TLS'], priority: 'critical' },
      { id: 'pci-6', name: 'Secure Systems', description: 'Develop and maintain secure systems', status: 'partial', evidence: ['Code review'], priority: 'high' },
      { id: 'pci-10', name: 'Logging & Monitoring', description: 'Log and monitor all access', status: 'met', evidence: ['Audit log', 'DriftGuard monitoring'], priority: 'critical' },
    ],
  },
  {
    id: 'nist-ai', name: 'NIST AI RMF', description: 'NIST AI Risk Management Framework',
    controls: [
      { id: 'nist-gov', name: 'Govern', description: 'AI governance structure', status: 'met', evidence: ['Deployment governance', 'RBAC'], priority: 'critical' },
      { id: 'nist-map', name: 'Map', description: 'Map AI risks and impacts', status: 'met', evidence: ['Drift detection', 'Behavioral analysis'], priority: 'high' },
      { id: 'nist-measure', name: 'Measure', description: 'Measure and analyze AI risks', status: 'met', evidence: ['Probe runner', 'Fingerprints', 'Diffs'], priority: 'critical' },
      { id: 'nist-manage', name: 'Manage', description: 'Manage and mitigate AI risks', status: 'partial', evidence: ['Alerts', 'Reviews'], priority: 'critical' },
      { id: 'nist-trans', name: 'Transparency', description: 'AI system transparency', status: 'partial', evidence: ['Behavioral diffs', 'Audit trail'], priority: 'high' },
      { id: 'nist-fair', name: 'Fairness', description: 'Bias and fairness assessment', status: 'partial', evidence: ['Bias probes'], priority: 'high' },
      { id: 'nist-priv', name: 'Privacy', description: 'AI privacy protections', status: 'partial', evidence: ['PII detection'], priority: 'high' },
    ],
  },
];

// ── Calculate Compliance Score ────────────────────────────────
export function calculateFrameworkScore(framework: ComplianceFramework): ComplianceScore {
  const total = framework.controls.length;
  const met = framework.controls.filter(c => c.status === 'met').length;
  const partial = framework.controls.filter(c => c.status === 'partial').length;
  const covered = met + partial * 0.5;
  const readiness = Math.round((covered / total) * 100);

  const totalEvidence = framework.controls.reduce((sum, c) => sum + c.evidence.length, 0);
  const maxEvidence = total * 3; // assume 3 pieces of evidence per control
  const evidenceCoverage = Math.round((totalEvidence / maxEvidence) * 100);

  const criticalNotMet = framework.controls.filter(c => c.status === 'not_met' && c.priority === 'critical').length;
  const riskExposure = Math.min(100, criticalNotMet * 25 + (total - met) * 5);

  const issues: ComplianceIssue[] = framework.controls
    .filter(c => c.status !== 'met')
    .map((c, i) => ({
      id: `issue-${framework.id}-${c.id}`,
      framework: framework.name,
      controlId: c.id,
      title: `${c.name} — ${c.status === 'not_met' ? 'Not Implemented' : 'Partially Implemented'}`,
      severity: c.status === 'not_met' && c.priority === 'critical' ? 'critical' : c.priority,
      impact: c.description,
      action: c.status === 'not_met'
        ? `Implement ${c.name} control and collect supporting evidence`
        : `Complete remaining requirements for ${c.name} and add additional evidence`,
      priority: c.priority === 'critical' ? 1 : c.priority === 'high' ? 2 : c.priority === 'medium' ? 3 : 4,
      owner: c.priority === 'critical' ? 'Security Lead' : 'Engineering',
    }));

  return {
    framework: framework.name,
    readinessPercent: readiness,
    controlsCovered: met,
    totalControls: total,
    evidenceCoverage,
    riskExposure,
    issues: issues.sort((a, b) => a.priority - b.priority),
  };
}

// ── Get overall compliance score ─────────────────────────────
export function getOverallScore(): number {
  const scores = FRAMEWORKS.map(f => calculateFrameworkScore(f));
  return Math.round(scores.reduce((sum, s) => sum + s.readinessPercent, 0) / scores.length);
}
