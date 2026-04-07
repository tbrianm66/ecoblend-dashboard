import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const templates = [
  // Stage 1 — Pre-Readiness / Idea Validation
  { id: "tmpl-s1-01", vrlStage: 1, title: "Define core problem statement", description: "Write a one-sentence problem statement validated by at least 3 potential customers", category: "market", defaultDueOffsetDays: 5, metric: "Problem statement document with 3 customer validation quotes", priority: "high" },
  { id: "tmpl-s1-02", vrlStage: 1, title: "Complete 5 customer discovery interviews", description: "Conduct structured interviews with target customers to validate pain points", category: "market", defaultDueOffsetDays: 7, metric: "5 interview transcripts or notes submitted", priority: "high" },
  { id: "tmpl-s1-03", vrlStage: 1, title: "Map initial TRL assessment", description: "Self-assess current technology readiness level using TRL 1-9 framework", category: "product", defaultDueOffsetDays: 4, metric: "TRL assessment form completed with evidence", priority: "medium" },
  { id: "tmpl-s1-04", vrlStage: 1, title: "Identify 3 key assumptions to test", description: "List the riskiest assumptions about your venture and design experiments to test them", category: "execution", defaultDueOffsetDays: 3, metric: "Assumption register with test designs created", priority: "high" },
  { id: "tmpl-s1-05", vrlStage: 1, title: "Register venture on EcoBlend OS", description: "Complete venture profile including sector, impact dimensions, and founding team", category: "structural", defaultDueOffsetDays: 2, metric: "Venture profile 100% complete on platform", priority: "medium" },
  // Stage 2 — Emerging / Concept Development
  { id: "tmpl-s2-01", vrlStage: 2, title: "Build and test minimum viable prototype", description: "Create a low-fidelity prototype and gather feedback from 5 target users", category: "product", defaultDueOffsetDays: 7, metric: "Prototype tested with 5 users, feedback documented", priority: "high" },
  { id: "tmpl-s2-02", vrlStage: 2, title: "Complete MRL Level 2 assessment", description: "Assess manufacturing readiness: identify key manufacturing processes and equipment requirements", category: "product", defaultDueOffsetDays: 5, metric: "MRL Level 2 form completed with evidence", priority: "high" },
  { id: "tmpl-s2-03", vrlStage: 2, title: "Define go-to-market channel hypothesis", description: "Identify primary and secondary customer acquisition channels with rationale", category: "market", defaultDueOffsetDays: 5, metric: "GTM channel document with cost estimates", priority: "medium" },
  { id: "tmpl-s2-04", vrlStage: 2, title: "Establish weekly coach check-in rhythm", description: "Schedule and attend weekly 30-minute check-in with assigned coach", category: "execution", defaultDueOffsetDays: 7, metric: "First 4 check-ins completed on schedule", priority: "high" },
  { id: "tmpl-s2-05", vrlStage: 2, title: "Draft initial IP landscape review", description: "Identify 3 existing patents or IP that could affect your venture", category: "structural", defaultDueOffsetDays: 6, metric: "IP landscape document with 3 identified risks/opportunities", priority: "medium" },
  // Stage 3 — Developing / Investment Readiness
  { id: "tmpl-s3-01", vrlStage: 3, title: "Achieve investment readiness score >= 60", description: "Complete all VRL investment readiness dimensions to reach a composite score of 60+", category: "structural", defaultDueOffsetDays: 7, metric: "VRL composite score >= 60 on platform", priority: "high" },
  { id: "tmpl-s3-02", vrlStage: 3, title: "Produce 12-month financial model", description: "Build a monthly P&L, cash flow, and unit economics model", category: "market", defaultDueOffsetDays: 7, metric: "Financial model reviewed and approved by coach", priority: "high" },
  { id: "tmpl-s3-03", vrlStage: 3, title: "Complete ESG baseline assessment", description: "Measure current environmental, social, and governance baseline across all 4 impact dimensions", category: "sustainability", defaultDueOffsetDays: 6, metric: "ESG baseline report completed on platform", priority: "medium" },
  { id: "tmpl-s3-04", vrlStage: 3, title: "Secure first paying customer or LOI", description: "Close first commercial transaction or obtain a signed Letter of Intent from a target customer", category: "market", defaultDueOffsetDays: 7, metric: "Payment receipt or signed LOI uploaded", priority: "high" },
  { id: "tmpl-s3-05", vrlStage: 3, title: "Achieve TRL Level 5 or above", description: "Validate technology in relevant environment and document evidence", category: "product", defaultDueOffsetDays: 7, metric: "TRL 5 evidence pack submitted", priority: "high" },
  // Stage 4 — Established / Scale Readiness
  { id: "tmpl-s4-01", vrlStage: 4, title: "Achieve MRL Level 6: Pilot production run", description: "Complete a pilot production run demonstrating manufacturing process capability", category: "product", defaultDueOffsetDays: 7, metric: "Pilot production report with quality metrics", priority: "high" },
  { id: "tmpl-s4-02", vrlStage: 4, title: "Establish supply chain tier 1 agreements", description: "Sign agreements with at least 2 tier 1 suppliers for key components", category: "structural", defaultDueOffsetDays: 7, metric: "2 signed supplier agreements uploaded", priority: "high" },
  { id: "tmpl-s4-03", vrlStage: 4, title: "Complete Series A readiness audit", description: "Run full VRL WGM audit and close all HIGH-risk dimensions before investor meetings", category: "structural", defaultDueOffsetDays: 7, metric: "VRL WGM audit with 0 HIGH-risk dimensions", priority: "high" },
  { id: "tmpl-s4-04", vrlStage: 4, title: "Build and train core team (5+ FTEs)", description: "Hire and onboard at least 5 full-time employees across product, sales, and operations", category: "execution", defaultDueOffsetDays: 7, metric: "5 FTE contracts signed and onboarding complete", priority: "medium" },
  { id: "tmpl-s4-05", vrlStage: 4, title: "Achieve 3-month revenue run rate target", description: "Demonstrate consistent monthly revenue for 3 consecutive months at or above target", category: "market", defaultDueOffsetDays: 7, metric: "3 months of revenue data meeting target on platform", priority: "high" },
];

for (const t of templates) {
  await conn.execute(
    "INSERT IGNORE INTO coaching_commitment_templates (id, vrlStage, title, description, category, defaultDueOffsetDays, metric, priority, isActive) VALUES (?,?,?,?,?,?,?,?,1)",
    [t.id, t.vrlStage, t.title, t.description, t.category, t.defaultDueOffsetDays, t.metric, t.priority]
  );
}
console.log("Seeded", templates.length, "commitment templates OK");
await conn.end();
