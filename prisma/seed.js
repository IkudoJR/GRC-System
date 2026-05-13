require('dotenv').config();
const prisma = require('../src/lib/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Clear existing data ───────────────────────────────────────────────────
  await prisma.passwordChangeRequest.deleteMany();
  await prisma.controlCompliance.deleteMany();
  await prisma.riskControl.deleteMany();
  await prisma.assetRisk.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.compliance.deleteMany();
  await prisma.securityControl.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.archive.deleteMany();
  await prisma.asset.deleteMany();

  // ─── Create Users ──────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin', 12);
  const userPassword = await bcrypt.hash('analyst', 12);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const user = await prisma.user.create({
    data: {
      username: 'analyst',
      password: userPassword,
      role: 'USER',
      permissions: {
        create: [
          { entity: 'ASSET', canCreate: true, canRead: true, canUpdate: true, canDelete: false },
          { entity: 'RISK', canCreate: true, canRead: true, canUpdate: true, canDelete: false },
          { entity: 'CONTROL', canCreate: true, canRead: true, canUpdate: true, canDelete: false },
          { entity: 'COMPLIANCE', canCreate: false, canRead: true, canUpdate: false, canDelete: false }
        ]
      }
    }
  });

  console.log('✅ Users created (admin/admin, analyst/analyst)');

  // ─── Create Assets ─────────────────────────────────────────────────────────
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'Production Database Server',
        description: 'Primary PostgreSQL cluster hosting customer data, transaction records, and application state. Deployed across 3 availability zones.',
        classification: 'RESTRICTED',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Customer Web Portal',
        description: 'Public-facing React application serving 50K+ daily active users. Handles authentication, account management, and service requests.',
        classification: 'CONFIDENTIAL',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Internal HR System',
        description: 'Employee management platform containing PII, payroll information, and performance records for 500+ staff members.',
        classification: 'CONFIDENTIAL',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'API Gateway',
        description: 'Kong-based API gateway managing rate limiting, authentication, and routing for all microservices. Processes 2M+ requests/day.',
        classification: 'INTERNAL',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Legacy File Server',
        description: 'Windows Server 2016 hosting archived documents and legacy application backups. Scheduled for decommission Q3 2026.',
        classification: 'INTERNAL',
        status: 'INACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Cloud Storage (S3 Buckets)',
        description: 'AWS S3 storage containing application logs, user uploads, backup archives, and static assets across 12 buckets.',
        classification: 'CONFIDENTIAL',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Email Server (Exchange Online)',
        description: 'Microsoft 365 Exchange Online handling corporate communications for all departments. Integrated with DLP policies.',
        classification: 'INTERNAL',
        status: 'ACTIVE'
      }
    }),
    prisma.asset.create({
      data: {
        name: 'CI/CD Pipeline Infrastructure',
        description: 'GitHub Actions and ArgoCD pipeline infrastructure managing automated builds, tests, and deployments across all environments.',
        classification: 'INTERNAL',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log(`✅ ${assets.length} Assets created`);

  // ─── Create Risks ──────────────────────────────────────────────────────────
  const risks = await Promise.all([
    prisma.risk.create({
      data: {
        name: 'SQL Injection Attack',
        description: 'Unsanitized user inputs in web forms could allow attackers to execute arbitrary SQL queries, potentially exposing or modifying sensitive data.',
        severity: 'CRITICAL',
        status: 'OPEN'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Data Breach via Insider Threat',
        description: 'Employees with elevated access privileges may intentionally or accidentally exfiltrate sensitive customer data or intellectual property.',
        severity: 'HIGH',
        status: 'OPEN'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'DDoS Attack on Web Services',
        description: 'Distributed denial-of-service attacks targeting public endpoints could cause extended service outages and revenue loss.',
        severity: 'HIGH',
        status: 'MITIGATED'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Unpatched Software Vulnerabilities',
        description: 'Known CVEs in operating systems, libraries, or frameworks remain unpatched beyond SLA windows, creating exploitation vectors.',
        severity: 'MEDIUM',
        status: 'OPEN'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Phishing & Social Engineering',
        description: 'Targeted phishing campaigns against employees could compromise credentials and provide initial access for further attacks.',
        severity: 'HIGH',
        status: 'OPEN'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Cloud Misconfiguration',
        description: 'Improperly configured S3 buckets, security groups, or IAM policies could expose resources to unauthorized public access.',
        severity: 'CRITICAL',
        status: 'MITIGATED'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Ransomware Infection',
        description: 'Ransomware could encrypt critical systems and data, demanding payment for recovery keys and causing extended downtime.',
        severity: 'CRITICAL',
        status: 'OPEN'
      }
    }),
    prisma.risk.create({
      data: {
        name: 'Third-Party Vendor Compromise',
        description: 'Supply chain attacks through compromised vendor software or APIs could introduce malicious code into production systems.',
        severity: 'MEDIUM',
        status: 'ACCEPTED'
      }
    })
  ]);

  console.log(`✅ ${risks.length} Risks created`);

  // ─── Create Security Controls ──────────────────────────────────────────────
  const controls = await Promise.all([
    prisma.securityControl.create({
      data: {
        name: 'Web Application Firewall (WAF)',
        description: 'AWS WAF deployed in front of all public endpoints with OWASP Top 10 rule sets, custom SQL injection patterns, and rate limiting.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Multi-Factor Authentication (MFA)',
        description: 'TOTP-based MFA enforced for all user accounts and admin consoles. Hardware security keys required for infrastructure access.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Data Encryption at Rest & Transit',
        description: 'AES-256 encryption for all data at rest. TLS 1.3 enforced for all data in transit. AWS KMS for key management.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Intrusion Detection System (IDS)',
        description: 'Network and host-based IDS monitoring with automated alerting. CrowdStrike Falcon deployed across all endpoints.',
        riskFactor: 'MEDIUM',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Automated Vulnerability Scanning',
        description: 'Weekly Qualys vulnerability scans across all infrastructure. Container image scanning in CI/CD pipeline via Snyk.',
        riskFactor: 'MEDIUM',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Role-Based Access Control (RBAC)',
        description: 'Granular RBAC implemented across all systems following least-privilege principle. Quarterly access reviews mandatory.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Security Awareness Training',
        description: 'Mandatory quarterly security training for all employees. Monthly phishing simulations with remedial training for failures.',
        riskFactor: 'MEDIUM',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Backup & Disaster Recovery Plan',
        description: 'Automated daily backups with 30-day retention. Cross-region replication. DR drills conducted bi-annually with 4-hour RTO.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'Network Segmentation',
        description: 'VPC-based network segmentation isolating production, staging, and development environments. Zero-trust micro-segmentation planned.',
        riskFactor: 'MEDIUM',
        status: 'PLANNED'
      }
    }),
    prisma.securityControl.create({
      data: {
        name: 'SIEM & Log Management',
        description: 'Centralized logging via Splunk with 90-day hot retention. Automated correlation rules and SOC team 24/7 monitoring.',
        riskFactor: 'HIGH',
        status: 'IMPLEMENTED'
      }
    })
  ]);

  console.log(`✅ ${controls.length} Security Controls created`);

  // ─── Create Compliance Requirements ────────────────────────────────────────
  const compliances = await Promise.all([
    prisma.compliance.create({
      data: {
        requirement: 'GDPR Article 32 — Security of Processing',
        description: 'Implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including encryption, pseudonymization, and regular testing.',
        status: 'COMPLIANT'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'ISO 27001 — A.9 Access Control',
        description: 'Limit access to information and information processing facilities. Ensure authorized user access and prevent unauthorized access to systems and services.',
        status: 'COMPLIANT'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'SOC 2 — CC6.1 Logical Access Security',
        description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
        status: 'PARTIAL'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'PCI DSS 4.0 — Requirement 6: Secure Systems',
        description: 'Develop and maintain secure systems and software by establishing and applying security patching and secure development lifecycle practices.',
        status: 'PARTIAL'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'NIST CSF — PR.DS Data Security',
        description: 'Information and records (data) are managed consistent with the organization\'s risk strategy to protect the confidentiality, integrity, and availability of information.',
        status: 'COMPLIANT'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'HIPAA — 164.312 Technical Safeguards',
        description: 'Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons.',
        status: 'NOT_ASSESSED'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'ISO 27001 — A.12 Operations Security',
        description: 'Ensure correct and secure operations of information processing facilities. Protection against malware, backup, logging and monitoring.',
        status: 'COMPLIANT'
      }
    }),
    prisma.compliance.create({
      data: {
        requirement: 'GDPR Article 33 — Breach Notification',
        description: 'In the case of a personal data breach, the controller shall notify the supervisory authority within 72 hours of becoming aware of it.',
        status: 'PARTIAL'
      }
    })
  ]);

  console.log(`✅ ${compliances.length} Compliance Requirements created`);

  // ─── Create Relationships ──────────────────────────────────────────────────

  // Assets ↔ Risks
  await prisma.assetRisk.createMany({
    data: [
      { assetId: assets[0].id, riskId: risks[0].id }, // DB Server ↔ SQL Injection
      { assetId: assets[0].id, riskId: risks[1].id }, // DB Server ↔ Insider Threat
      { assetId: assets[0].id, riskId: risks[6].id }, // DB Server ↔ Ransomware
      { assetId: assets[1].id, riskId: risks[0].id }, // Web Portal ↔ SQL Injection
      { assetId: assets[1].id, riskId: risks[2].id }, // Web Portal ↔ DDoS
      { assetId: assets[1].id, riskId: risks[4].id }, // Web Portal ↔ Phishing
      { assetId: assets[2].id, riskId: risks[1].id }, // HR System ↔ Insider Threat
      { assetId: assets[2].id, riskId: risks[4].id }, // HR System ↔ Phishing
      { assetId: assets[3].id, riskId: risks[2].id }, // API Gateway ↔ DDoS
      { assetId: assets[3].id, riskId: risks[3].id }, // API Gateway ↔ Unpatched Vuln
      { assetId: assets[4].id, riskId: risks[3].id }, // Legacy Server ↔ Unpatched Vuln
      { assetId: assets[4].id, riskId: risks[6].id }, // Legacy Server ↔ Ransomware
      { assetId: assets[5].id, riskId: risks[5].id }, // S3 ↔ Cloud Misconfig
      { assetId: assets[5].id, riskId: risks[1].id }, // S3 ↔ Insider Threat
      { assetId: assets[6].id, riskId: risks[4].id }, // Email ↔ Phishing
      { assetId: assets[7].id, riskId: risks[7].id }, // CI/CD ↔ Vendor Compromise
      { assetId: assets[7].id, riskId: risks[3].id }, // CI/CD ↔ Unpatched Vuln
    ]
  });

  // Risks ↔ Controls
  await prisma.riskControl.createMany({
    data: [
      { riskId: risks[0].id, controlId: controls[0].id }, // SQL Injection ↔ WAF
      { riskId: risks[0].id, controlId: controls[4].id }, // SQL Injection ↔ Vuln Scanning
      { riskId: risks[1].id, controlId: controls[1].id }, // Insider Threat ↔ MFA
      { riskId: risks[1].id, controlId: controls[5].id }, // Insider Threat ↔ RBAC
      { riskId: risks[1].id, controlId: controls[9].id }, // Insider Threat ↔ SIEM
      { riskId: risks[2].id, controlId: controls[0].id }, // DDoS ↔ WAF
      { riskId: risks[2].id, controlId: controls[8].id }, // DDoS ↔ Network Segmentation
      { riskId: risks[3].id, controlId: controls[4].id }, // Unpatched Vuln ↔ Vuln Scanning
      { riskId: risks[4].id, controlId: controls[1].id }, // Phishing ↔ MFA
      { riskId: risks[4].id, controlId: controls[6].id }, // Phishing ↔ Security Training
      { riskId: risks[5].id, controlId: controls[5].id }, // Cloud Misconfig ↔ RBAC
      { riskId: risks[5].id, controlId: controls[4].id }, // Cloud Misconfig ↔ Vuln Scanning
      { riskId: risks[6].id, controlId: controls[2].id }, // Ransomware ↔ Encryption
      { riskId: risks[6].id, controlId: controls[3].id }, // Ransomware ↔ IDS
      { riskId: risks[6].id, controlId: controls[7].id }, // Ransomware ↔ Backup & DR
      { riskId: risks[7].id, controlId: controls[4].id }, // Vendor Compromise ↔ Vuln Scanning
      { riskId: risks[7].id, controlId: controls[8].id }, // Vendor Compromise ↔ Network Segmentation
    ]
  });

  // Controls ↔ Compliance
  await prisma.controlCompliance.createMany({
    data: [
      { controlId: controls[0].id, complianceId: compliances[3].id }, // WAF ↔ PCI DSS
      { controlId: controls[1].id, complianceId: compliances[1].id }, // MFA ↔ ISO 27001 Access
      { controlId: controls[1].id, complianceId: compliances[2].id }, // MFA ↔ SOC 2
      { controlId: controls[2].id, complianceId: compliances[0].id }, // Encryption ↔ GDPR Art.32
      { controlId: controls[2].id, complianceId: compliances[4].id }, // Encryption ↔ NIST CSF
      { controlId: controls[2].id, complianceId: compliances[5].id }, // Encryption ↔ HIPAA
      { controlId: controls[3].id, complianceId: compliances[6].id }, // IDS ↔ ISO 27001 Ops
      { controlId: controls[4].id, complianceId: compliances[3].id }, // Vuln Scanning ↔ PCI DSS
      { controlId: controls[4].id, complianceId: compliances[6].id }, // Vuln Scanning ↔ ISO 27001 Ops
      { controlId: controls[5].id, complianceId: compliances[1].id }, // RBAC ↔ ISO 27001 Access
      { controlId: controls[5].id, complianceId: compliances[2].id }, // RBAC ↔ SOC 2
      { controlId: controls[5].id, complianceId: compliances[5].id }, // RBAC ↔ HIPAA
      { controlId: controls[6].id, complianceId: compliances[0].id }, // Training ↔ GDPR Art.32
      { controlId: controls[7].id, complianceId: compliances[4].id }, // Backup ↔ NIST CSF
      { controlId: controls[7].id, complianceId: compliances[6].id }, // Backup ↔ ISO 27001 Ops
      { controlId: controls[9].id, complianceId: compliances[7].id }, // SIEM ↔ GDPR Breach Notif
      { controlId: controls[9].id, complianceId: compliances[6].id }, // SIEM ↔ ISO 27001 Ops
    ]
  });

  console.log('✅ All relationships created');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin / admin');
  console.log('   User:  analyst / analyst\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
