// seed-legal.mjs — Seeds contract layers, type registry, and legal risk items
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// ── 1. Contract Layers ────────────────────────────────────────────────────────
await conn.execute(`DELETE FROM contract_layers`);
await conn.execute(`
  INSERT INTO contract_layers (layerKey, name, description, color, sortOrder) VALUES
  ('platform-infrastructure', 'Platform Infrastructure', 'Cloud hosting, SLA, security, and maintenance contracts covering the technical foundation of the Venture OS.', '#3A97D3', 1),
  ('data-intelligence',       'Data & Intelligence',     'Data licensing, API access, DPA, AI model usage, and supply chain data agreements powering the LCSA and analytics modules.', '#51AF37', 2),
  ('user-commercial',         'User & Commercial',       'EULA, Terms of Service, Privacy Policy, consultancy, and partnership agreements governing user access and commercial relationships.', '#F49C13', 3),
  ('governance-compliance',   'Governance & Compliance', 'IP ownership, NDA, compliance, insurance, and regulatory reporting contracts ensuring legal and ESG framework adherence.', '#8b5cf6', 4)
`);
console.log("✓ Contract layers seeded");

// ── 2. Contract Type Registry (20 contracts) ──────────────────────────────────
await conn.execute(`DELETE FROM contract_type_registry`);
await conn.execute(`
  INSERT INTO contract_type_registry (layerKey, contractType, useCase, riskLevel, status) VALUES
  -- Platform Infrastructure Layer (4)
  ('platform-infrastructure', 'Cloud Hosting Agreement',        'Covers use of AWS/Azure/GCP infrastructure for hosting platform and data.',                                  'High',     'Active'),
  ('platform-infrastructure', 'Service Level Agreement (SLA)',  'Defines uptime, reliability, and support commitments for platform performance.',                             'High',     'Active'),
  ('platform-infrastructure', 'Cybersecurity Agreement',        'Covers data protection, encryption, and breach responsibilities.',                                           'Critical', 'Active'),
  ('platform-infrastructure', 'Maintenance & Support Agreement','Ongoing platform support, updates, and uptime management.',                                                  'Medium',   'Draft'),
  -- Data & Intelligence Layer (5)
  ('data-intelligence', 'Data Licensing Agreement',             'Defines rights to use commercial LCA/ESG datasets (Ecoinvent, etc.).',                                      'High',     'Active'),
  ('data-intelligence', 'API/Data Access Agreement',            'Access to external datasets and ESG databases via API integrations.',                                        'Medium',   'Active'),
  ('data-intelligence', 'Data Processing Agreement (DPA)',      'Defines how personal and sensitive data is processed under GDPR.',                                          'Critical', 'Active'),
  ('data-intelligence', 'AI Model Usage Agreement',             'Defines rights and responsibilities around AI outputs and models.',                                          'High',     'Draft'),
  ('data-intelligence', 'Supply Chain Data Agreements',         'Agreements with suppliers providing ESG and lifecycle data.',                                                'Medium',   'Pending'),
  -- User & Commercial Layer (7)
  ('user-commercial', 'End User License Agreement (EULA)',      'Defines how users can use the platform and its outputs.',                                                    'Medium',   'Active'),
  ('user-commercial', 'Terms of Service (ToS)',                 'General user terms, responsibilities, and liabilities.',                                                     'Medium',   'Active'),
  ('user-commercial', 'Privacy Policy',                         'Explains how user data is collected, stored, and used.',                                                     'High',     'Active'),
  ('user-commercial', 'Consultancy / Professional Services Agreement', 'For sustainability experts, engineers, and advisors engaged on the platform.',                        'Medium',   'Draft'),
  ('user-commercial', 'Joint Venture / Partnership Agreement',  'For collaboration with universities or industry partners.',                                                  'High',     'Pending'),
  ('user-commercial', 'Software License Agreements',            'Licensing of third-party tools like OpenLCA, databases, and analytics tools.',                              'Medium',   'Active'),
  ('user-commercial', 'Data Sharing Agreements',                'Controls how data is shared with partners, clients, and universities.',                                      'High',     'Draft'),
  -- Governance & Compliance Layer (4)
  ('governance-compliance', 'Intellectual Property (IP) Agreement', 'Defines ownership of platform, data models, and outputs.',                                              'Critical', 'Active'),
  ('governance-compliance', 'Confidentiality / NDA',            'Protects sensitive business and technical information.',                                                     'High',     'Active'),
  ('governance-compliance', 'Compliance & Regulatory Agreement','Ensures adherence to ESG, CSRD, ISO standards and reporting frameworks.',                                   'High',     'Draft'),
  ('governance-compliance', 'Insurance Contracts',              'Cyber insurance, professional indemnity, and liability coverage.',                                           'Medium',   'Pending')
`);
console.log("✓ Contract type registry seeded (20 contracts)");

// ── 3. Legal Risk Items ───────────────────────────────────────────────────────
await conn.execute(`DELETE FROM legal_risk_items`);
await conn.execute(`
  INSERT INTO legal_risk_items (riskArea, description, riskZone, mitigation, linkedLayer, linkedContracts, status) VALUES
  ('Data Privacy (GDPR)',
   'Risk of non-compliance with GDPR when processing personal data of platform users, founders, and supply chain contacts.',
   'High',
   'Implement strong Data Processing Agreements (DPA) and Privacy Policy. Conduct regular GDPR audits. Appoint a Data Protection Officer.',
   'data-intelligence',
   '["Data Processing Agreement (DPA)", "Privacy Policy"]',
   'Monitoring'),

  ('AI Model Liability',
   'Risk of legal liability arising from AI-generated outputs used in investment decisions, ESG reporting, or venture assessments.',
   'High',
   'Include clear AI disclaimers in EULA and Terms of Service. Define liability boundaries in AI Model Usage Agreement. Maintain human oversight of AI outputs.',
   'data-intelligence',
   '["AI Model Usage Agreement", "End User License Agreement (EULA)", "Terms of Service (ToS)"]',
   'Open'),

  ('ESG Reporting Accuracy',
   'Risk of inaccurate or misleading ESG and CSRD reporting claims leading to regulatory penalties or reputational damage.',
   'High',
   'Use auditable and certified data sources. Implement Compliance & Regulatory Agreement. Engage independent ESG auditors for annual verification.',
   'governance-compliance',
   '["Compliance & Regulatory Agreement", "Data Licensing Agreement"]',
   'Open'),

  ('IP Ownership',
   'Risk of disputes over ownership of platform IP, data models, AI outputs, and venture-specific innovations created on the platform.',
   'High',
   'Establish robust IP Agreement covering all platform outputs. Ensure founder IP assignment clauses in all engagement contracts. Register key IP assets.',
   'governance-compliance',
   '["Intellectual Property (IP) Agreement", "Consultancy / Professional Services Agreement"]',
   'Mitigated'),

  ('Supply Chain Data Reliability',
   'Risk of inaccurate or unverified ESG and lifecycle data from supply chain partners affecting LCSA module outputs.',
   'Medium',
   'Implement supplier verification processes. Include data accuracy warranties in Supply Chain Data Agreements. Cross-validate with certified third-party datasets.',
   'data-intelligence',
   '["Supply Chain Data Agreements", "Data Licensing Agreement"]',
   'Monitoring'),

  ('AI Decision Outputs',
   'High-risk zone: AI-generated investment recommendations, TRL assessments, and spin-off execution plans may be acted upon without adequate human review.',
   'High',
   'Mandate human review for all AI-generated decisions. Include AI disclaimer in all outputs. Define escalation protocols in AI Model Usage Agreement.',
   'data-intelligence',
   '["AI Model Usage Agreement", "Terms of Service (ToS)"]',
   'Open'),

  ('External Data Dependencies',
   'High-risk zone: Platform functionality depends on third-party data APIs (Ecoinvent, ESG databases). Service disruption or data changes could impact platform integrity.',
   'High',
   'Negotiate SLA provisions in API/Data Access Agreements. Maintain fallback datasets. Monitor API health and implement circuit-breaker patterns.',
   'data-intelligence',
   '["API/Data Access Agreement", "Service Level Agreement (SLA)", "Data Licensing Agreement"]',
   'Monitoring'),

  ('Regulatory Reporting Claims',
   'High-risk zone: CSRD and ESG regulatory reporting claims generated by the platform may be subject to legal scrutiny if not independently verified.',
   'High',
   'Align all reporting outputs with CSRD, ISO 14040/44, and GRI standards. Engage legal counsel for regulatory alignment. Include disclaimer in all reports.',
   'governance-compliance',
   '["Compliance & Regulatory Agreement", "Intellectual Property (IP) Agreement"]',
   'Open')
`);
console.log("✓ Legal risk items seeded (8 risks)");

await conn.end();
console.log("✅ Legal seed complete");
