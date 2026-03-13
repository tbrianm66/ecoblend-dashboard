/**
 * BRL Seed Script — 100 Business Readiness Level Tasks
 * Run: node scripts/seed-brl.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const BRL_TASKS = [
  // ── STAGE 1: IDEA (Tasks 1–25) ─────────────────────────────────────────────
  // Platform: Fundamentals (managed on this dashboard)
  { taskNumber: 1,  title: "Define venture concept and problem statement", description: "Articulate the core problem, proposed solution, and target market in a one-page concept brief.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "pipeline", weight: 1.0 },
  { taskNumber: 2,  title: "Register legal entity (Ltd, LLP, or equivalent)", description: "Incorporate the business entity with Companies House or relevant authority.", category: "Legal & Entity", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "legal", weight: 1.5 },
  { taskNumber: 3,  title: "Open business bank account", description: "Open a dedicated business bank account for the venture.", category: "Financial", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "financial", weight: 1.0 },
  { taskNumber: 4,  title: "Define founding team and roles", description: "Document the founding team, their roles, equity split, and vesting schedule.", category: "People & Team", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "founders", weight: 1.0 },
  { taskNumber: 5,  title: "Draft co-founder agreement / shareholders agreement", description: "Legal agreement covering equity, IP assignment, decision-making, and exit provisions.", category: "Legal & Entity", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "legal", weight: 1.5 },
  { taskNumber: 6,  title: "Identify and name the venture brand", description: "Select and validate the venture brand name — check trademark availability and domain.", category: "Brand Identity", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "brand", weight: 1.0 },
  { taskNumber: 7,  title: "File provisional trademark / trade name registration", description: "File a provisional trademark application for the venture name and logo.", category: "Intellectual Property", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "ip", weight: 1.5 },
  { taskNumber: 8,  title: "Identify core IP and file provisional patent (if applicable)", description: "Document the core technology IP and file a provisional patent application.", category: "Intellectual Property", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "ip", weight: 1.5 },
  { taskNumber: 9,  title: "Define sustainability mission and ESG intent", description: "Write the venture's sustainability mission statement and initial ESG commitments.", category: "Governance & Compliance", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 10, title: "Conduct initial market sizing (TAM/SAM/SOM)", description: "Estimate the total addressable market, serviceable addressable market, and SOM.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "market", weight: 1.0 },
  { taskNumber: 11, title: "Identify 3–5 target customer segments", description: "Define the primary customer personas and their key pain points.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "interviews", weight: 1.0 },
  { taskNumber: 12, title: "Map 5 key competitors", description: "Identify and document 5 direct or indirect competitors with a brief competitive analysis.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "market", weight: 1.0 },
  { taskNumber: 13, title: "Draft initial Business Model Canvas (BMC)", description: "Complete a first-pass Business Model Canvas covering all 9 building blocks.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "pipeline", weight: 1.0 },
  { taskNumber: 14, title: "Create initial financial model (12-month P&L projection)", description: "Build a basic 12-month revenue and cost projection model.", category: "Financial", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "financial", weight: 1.0 },
  { taskNumber: 15, title: "Identify funding requirements and sources", description: "Define the initial funding requirement and identify potential sources (grants, angels, VC).", category: "Financial", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "investment", weight: 1.0 },
  { taskNumber: 16, title: "Apply for R&D or innovation grant (Innovate UK, etc.)", description: "Identify and apply for at least one relevant innovation grant.", category: "Financial", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "investment", weight: 1.0 },
  { taskNumber: 17, title: "Identify academic or research partners", description: "Identify at least one university or research institution as a potential partner.", category: "Partnerships & OEM", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "academic", weight: 1.0 },
  { taskNumber: 18, title: "Define TRL starting point and target TRL", description: "Assess the current Technology Readiness Level and set a 12-month TRL target.", category: "Technology & Product", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "trl", weight: 1.0 },
  { taskNumber: 19, title: "Set up basic accounting and bookkeeping system", description: "Implement a basic accounting system (Xero, QuickBooks, or equivalent).", category: "Financial", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "financial", weight: 1.0 },
  { taskNumber: 20, title: "Register for VAT (if applicable)", description: "Register for VAT with HMRC or relevant authority if turnover threshold applies.", category: "Legal & Entity", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "legal", weight: 1.0 },
  { taskNumber: 21, title: "Define venture KPIs and success metrics", description: "Set 5–10 key performance indicators for the first 12 months.", category: "Market & Customer", vrlStage: 1, platformScope: "Fundamentals", linkedModule: null, weight: 1.0 },
  { taskNumber: 22, title: "Create initial risk register", description: "Document the top 10 risks with likelihood, impact, and initial mitigation plans.", category: "Governance & Compliance", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "risk", weight: 1.0 },
  { taskNumber: 23, title: "Identify advisory board members", description: "Recruit at least 2 advisors with relevant industry or technical expertise.", category: "People & Team", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "founders", weight: 1.0 },
  { taskNumber: 24, title: "Set up data protection and GDPR compliance", description: "Implement basic GDPR compliance: privacy policy, data processing register, cookie policy.", category: "Governance & Compliance", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "legal", weight: 1.0 },
  { taskNumber: 25, title: "Define the venture's VRL Stage 1 evidence pack", description: "Compile the evidence required to advance from VRL Stage 1 to Stage 2.", category: "Governance & Compliance", vrlStage: 1, platformScope: "Fundamentals", linkedModule: "vrl", weight: 1.5 },

  // ── STAGE 2: VALIDATION (Tasks 26–50) ──────────────────────────────────────
  { taskNumber: 26, title: "Conduct 10+ customer discovery interviews", description: "Run structured customer discovery interviews and document key insights.", category: "Market & Customer", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "interviews", weight: 1.5 },
  { taskNumber: 27, title: "Build and test a proof-of-concept prototype", description: "Create a working proof-of-concept demonstrating the core technology or product.", category: "Technology & Product", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "experiments", weight: 1.5 },
  { taskNumber: 28, title: "Validate problem-solution fit with target customers", description: "Confirm that the proposed solution addresses the identified customer problem.", category: "Market & Customer", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "interviews", weight: 1.5 },
  { taskNumber: 29, title: "Produce technical datasheet or product specification", description: "Create a technical datasheet suitable for OEM or partner discussions.", category: "Partnerships & OEM", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "brand", weight: 1.0 },
  { taskNumber: 30, title: "Identify and approach 3 potential OEM or channel partners", description: "Initiate conversations with at least 3 potential OEM, distribution, or channel partners.", category: "Partnerships & OEM", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "specialists", weight: 1.0 },
  { taskNumber: 31, title: "File full patent application (if applicable)", description: "Convert provisional patent to a full patent application.", category: "Intellectual Property", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "ip", weight: 1.5 },
  { taskNumber: 32, title: "Develop ingredient brand identity (if applicable)", description: "Create the ingredient brand identity: name, logo, and visual system for B2B use.", category: "Brand Identity", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "brand", weight: 1.0 },
  { taskNumber: 33, title: "Produce brand guidelines document", description: "Document the brand guidelines: logo usage, colour palette, typography, tone of voice.", category: "Brand Identity", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "brand", weight: 1.0 },
  { taskNumber: 34, title: "Attach academic citations to key technology claims", description: "Link peer-reviewed papers to the core technology claims via the Academic Research module.", category: "Technology & Product", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "academic", weight: 1.0 },
  { taskNumber: 35, title: "Conduct regulatory mapping for target markets", description: "Identify all relevant regulations, certifications, and compliance requirements.", category: "Governance & Compliance", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "legal", weight: 1.0 },
  { taskNumber: 36, title: "Update financial model with validation data", description: "Revise the financial model based on customer discovery and prototype cost data.", category: "Financial", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "financial", weight: 1.0 },
  { taskNumber: 37, title: "Secure seed or pre-seed funding", description: "Close initial funding round (grant, angel, or pre-seed VC).", category: "Financial", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "investment", weight: 1.5 },
  { taskNumber: 38, title: "Establish university or research partnership (MOU)", description: "Sign a Memorandum of Understanding with at least one academic partner.", category: "Partnerships & OEM", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "academic", weight: 1.0 },
  { taskNumber: 39, title: "Build initial FMEA risk register for core technology", description: "Complete an FMEA analysis for the core technology failure modes.", category: "Technology & Product", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "risk", weight: 1.0 },
  { taskNumber: 40, title: "Define sustainability KPIs and baseline measurements", description: "Set measurable sustainability KPIs and record baseline environmental impact data.", category: "Governance & Compliance", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 41, title: "Recruit first key hire (technical or commercial lead)", description: "Make the first strategic hire to fill the most critical capability gap.", category: "People & Team", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "people", weight: 1.0 },
  { taskNumber: 42, title: "Set up payroll and employment contracts", description: "Implement payroll system and issue employment contracts for all staff.", category: "People & Team", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "people", weight: 1.0 },
  { taskNumber: 43, title: "Produce investor pitch deck (seed stage)", description: "Create a 10–12 slide investor pitch deck for seed-stage fundraising.", category: "Financial", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "investment", weight: 1.0 },
  { taskNumber: 44, title: "Identify and register for relevant industry certifications", description: "Identify the key certifications required (ISO, B Corp, CE, etc.) and begin the process.", category: "Governance & Compliance", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 45, title: "Conduct competitive intelligence deep-dive", description: "Produce a detailed competitive analysis with positioning map.", category: "Market & Customer", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "market", weight: 1.0 },
  { taskNumber: 46, title: "Define pricing model and unit economics", description: "Establish the pricing model, cost of goods sold, and gross margin targets.", category: "Financial", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "financial", weight: 1.0 },
  { taskNumber: 47, title: "Establish IP assignment agreements with all team members", description: "Ensure all founders, employees, and contractors have signed IP assignment agreements.", category: "Intellectual Property", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "ip", weight: 1.5 },
  { taskNumber: 48, title: "Set up CRM or customer pipeline management system", description: "Implement a basic CRM to track customer and partner conversations.", category: "Market & Customer", vrlStage: 2, platformScope: "Fundamentals", linkedModule: null, weight: 1.0 },
  { taskNumber: 49, title: "Produce VRL Stage 2 evidence pack", description: "Compile the evidence required to advance from VRL Stage 2 to Stage 3.", category: "Governance & Compliance", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "vrl", weight: 1.5 },
  { taskNumber: 50, title: "Complete EcoBlend Playbook Stage 2 milestones", description: "Mark all Stage 2 Playbook milestones as complete in the EcoBlend Playbook module.", category: "Governance & Compliance", vrlStage: 2, platformScope: "Fundamentals", linkedModule: "playbook", weight: 1.0 },

  // ── STAGE 3: MVP / KICK-OFF (Tasks 51–75) ──────────────────────────────────
  { taskNumber: 51, title: "Build and launch MVP (minimum viable product)", description: "Develop and launch the MVP with the minimum feature set required for market validation.", category: "Technology & Product", vrlStage: 3, platformScope: "Kick-off", linkedModule: "experiments", weight: 2.0 },
  { taskNumber: 52, title: "Sign first pilot partner or letter of intent", description: "Secure a signed pilot agreement or letter of intent from a target customer or OEM partner.", category: "Partnerships & OEM", vrlStage: 3, platformScope: "Kick-off", linkedModule: "legal", weight: 2.0 },
  { taskNumber: 53, title: "Complete B Corp impact assessment", description: "Complete the B Impact Assessment and submit the B Corp application.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "bcorp", weight: 1.5 },
  { taskNumber: 54, title: "Launch venture website (v1)", description: "Launch the venture website with core messaging, product/service overview, and contact form.", category: "Brand Identity", vrlStage: 3, platformScope: "Kick-off", linkedModule: "brand", weight: 1.0 },
  { taskNumber: 55, title: "Produce investor deck (Series A ready)", description: "Update the investor pitch deck to Series A standard with traction data.", category: "Financial", vrlStage: 3, platformScope: "Kick-off", linkedModule: "investment", weight: 1.5 },
  { taskNumber: 56, title: "Implement ESOP (Employee Share Option Plan)", description: "Establish the ESOP scheme and issue options to key employees.", category: "People & Team", vrlStage: 3, platformScope: "Kick-off", linkedModule: "people", weight: 1.5 },
  { taskNumber: 57, title: "Complete EcoBlend Playbook Stage 3 milestones", description: "Mark all Stage 3 Playbook milestones as complete.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "playbook", weight: 1.0 },
  { taskNumber: 58, title: "Achieve ISO 14001 or equivalent environmental certification", description: "Obtain ISO 14001 Environmental Management System certification.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "bcorp", weight: 1.5 },
  { taskNumber: 59, title: "Establish manufacturing or production process", description: "Define and document the manufacturing or production process with quality controls.", category: "Technology & Product", vrlStage: 3, platformScope: "Kick-off", linkedModule: "experiments", weight: 1.5 },
  { taskNumber: 60, title: "Secure supply chain and key supplier contracts", description: "Negotiate and sign contracts with key suppliers and manufacturers.", category: "Partnerships & OEM", vrlStage: 3, platformScope: "Kick-off", linkedModule: "legal", weight: 1.5 },
  { taskNumber: 61, title: "Complete full patent grant (if applicable)", description: "Receive granted patent status for core technology IP.", category: "Intellectual Property", vrlStage: 3, platformScope: "Kick-off", linkedModule: "ip", weight: 1.5 },
  { taskNumber: 62, title: "Raise seed or Series A funding round", description: "Close the seed or Series A funding round.", category: "Financial", vrlStage: 3, platformScope: "Kick-off", linkedModule: "investment", weight: 2.0 },
  { taskNumber: 63, title: "Establish board of directors", description: "Appoint a formal board of directors with at least one independent non-executive director.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "founders", weight: 1.0 },
  { taskNumber: 64, title: "Produce annual impact report (first edition)", description: "Publish the first annual impact report covering sustainability, social, and governance metrics.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 65, title: "Achieve first commercial revenue", description: "Record the first commercial revenue from a paying customer.", category: "Financial", vrlStage: 3, platformScope: "Kick-off", linkedModule: "financial", weight: 2.0 },
  { taskNumber: 66, title: "Implement quality management system (ISO 9001 or equivalent)", description: "Establish a quality management system aligned to ISO 9001.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 67, title: "Conduct full FMEA review and update risk register", description: "Perform a comprehensive FMEA review and update the risk register with MVP learnings.", category: "Technology & Product", vrlStage: 3, platformScope: "Kick-off", linkedModule: "risk", weight: 1.0 },
  { taskNumber: 68, title: "Define channel strategy and distribution model", description: "Document the go-to-market channel strategy and distribution model.", category: "Market & Customer", vrlStage: 3, platformScope: "Kick-off", linkedModule: null, weight: 1.0 },
  { taskNumber: 69, title: "Hire commercial lead (sales / business development)", description: "Recruit a dedicated commercial lead to drive revenue growth.", category: "People & Team", vrlStage: 3, platformScope: "Kick-off", linkedModule: "people", weight: 1.0 },
  { taskNumber: 70, title: "Establish customer success and support process", description: "Define the customer onboarding, support, and success process.", category: "Market & Customer", vrlStage: 3, platformScope: "Kick-off", linkedModule: null, weight: 1.0 },
  { taskNumber: 71, title: "Produce VRL Stage 3 evidence pack", description: "Compile the evidence required to advance from VRL Stage 3 to Stage 4.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "vrl", weight: 1.5 },
  { taskNumber: 72, title: "Obtain product liability and business insurance", description: "Secure appropriate product liability, professional indemnity, and business insurance.", category: "Legal & Entity", vrlStage: 3, platformScope: "Kick-off", linkedModule: "legal", weight: 1.0 },
  { taskNumber: 73, title: "Implement ERP or operations management system", description: "Deploy an ERP or operations management system to support scaling.", category: "Technology & Product", vrlStage: 3, platformScope: "Kick-off", linkedModule: null, weight: 1.0 },
  { taskNumber: 74, title: "Establish strategic partnership or JV agreement", description: "Sign a strategic partnership or joint venture agreement with a key industry partner.", category: "Partnerships & OEM", vrlStage: 3, platformScope: "Kick-off", linkedModule: "legal", weight: 1.5 },
  { taskNumber: 75, title: "Complete EcoBlend Playbook Stage 4 milestones", description: "Mark all Stage 4 Playbook milestones as complete.", category: "Governance & Compliance", vrlStage: 3, platformScope: "Kick-off", linkedModule: "playbook", weight: 1.0 },

  // ── STAGE 4: SCALE / GO-TO-MARKET (Tasks 76–100) — EXECUTION PLATFORM ──────
  { taskNumber: 76,  title: "Launch full go-to-market campaign", description: "Execute the full go-to-market launch campaign across all channels.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 2.0 },
  { taskNumber: 77,  title: "Establish retail or OEM distribution agreements", description: "Sign distribution agreements with retail partners or OEM customers.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 2.0 },
  { taskNumber: 78,  title: "Launch PR and media campaign", description: "Execute a PR campaign with press releases, media outreach, and journalist briefings.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "pr", weight: 1.5 },
  { taskNumber: 79,  title: "Activate social media and content marketing", description: "Launch the brand's social media presence with a content calendar.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.5 },
  { taskNumber: 80,  title: "Exhibit at key industry trade shows", description: "Exhibit at 2+ relevant industry trade shows or conferences.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.5 },
  { taskNumber: 81,  title: "Launch e-commerce or D2C sales channel", description: "Launch a direct-to-consumer e-commerce channel.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.5 },
  { taskNumber: 82,  title: "Implement performance marketing (paid ads)", description: "Launch paid digital advertising campaigns (Google, LinkedIn, Meta).", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.5 },
  { taskNumber: 83,  title: "Recruit brand ambassador or influencer partners", description: "Sign brand ambassador or influencer partnership agreements.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "pr", weight: 1.0 },
  { taskNumber: 84,  title: "Launch affiliate or referral programme", description: "Implement an affiliate or referral programme to drive customer acquisition.", category: "Go-to-Market", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.0 },
  { taskNumber: 85,  title: "Achieve product-market fit (PMF) confirmation", description: "Confirm product-market fit with quantitative retention and NPS data.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 2.0 },
  { taskNumber: 86,  title: "Scale manufacturing or production capacity", description: "Increase production capacity to meet growing demand.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 2.0 },
  { taskNumber: 87,  title: "Expand into second market or geography", description: "Launch in a second target market or geographic region.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 2.0 },
  { taskNumber: 88,  title: "Raise Series A or Series B funding", description: "Close a Series A or Series B funding round to fuel scaling.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "investment", weight: 2.0 },
  { taskNumber: 89,  title: "Build and publish annual sustainability report", description: "Publish a comprehensive annual sustainability report aligned to GRI standards.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 1.5 },
  { taskNumber: 90,  title: "Achieve B Corp certification", description: "Receive official B Corp certification from B Lab.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 2.0 },
  { taskNumber: 91,  title: "Implement customer loyalty programme", description: "Launch a customer loyalty or rewards programme.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "marketing", weight: 1.0 },
  { taskNumber: 92,  title: "Expand product or service line", description: "Launch a second product or service line based on market demand.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 1.5 },
  { taskNumber: 93,  title: "Establish international distribution or export strategy", description: "Define and execute an international distribution or export strategy.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 1.5 },
  { taskNumber: 94,  title: "Implement advanced analytics and BI dashboard", description: "Deploy business intelligence tools for real-time performance monitoring.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: null, weight: 1.0 },
  { taskNumber: 95,  title: "Achieve ISO 14001 recertification (annual)", description: "Complete annual ISO 14001 recertification audit.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 1.0 },
  { taskNumber: 96,  title: "Launch employee wellbeing and DEI programme", description: "Implement a formal employee wellbeing and diversity, equity, and inclusion programme.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "people", weight: 1.0 },
  { taskNumber: 97,  title: "Establish circular economy or take-back programme", description: "Launch a circular economy initiative (product take-back, recycling, or reuse programme).", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 1.5 },
  { taskNumber: 98,  title: "Achieve carbon neutral or net-zero certification", description: "Obtain carbon neutral or net-zero certification from a recognised body.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 2.0 },
  { taskNumber: 99,  title: "Prepare for exit or IPO readiness assessment", description: "Conduct an exit readiness assessment (trade sale, PE buyout, or IPO preparation).", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "investment", weight: 2.0 },
  { taskNumber: 100, title: "Publish annual impact and innovation report", description: "Publish a comprehensive annual report covering financial, impact, and innovation performance.", category: "Scaling", vrlStage: 4, platformScope: "Execution", linkedModule: "bcorp", weight: 1.5 },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log("Connected to database");

  // Check if already seeded
  const [rows] = await conn.execute("SELECT COUNT(*) as count FROM brl_tasks");
  const count = rows[0].count;
  if (count > 0) {
    console.log(`BRL tasks already seeded (${count} tasks found). Skipping.`);
    await conn.end();
    return;
  }

  console.log(`Seeding ${BRL_TASKS.length} BRL tasks...`);
  for (const task of BRL_TASKS) {
    await conn.execute(
      `INSERT INTO brl_tasks (taskNumber, title, description, category, vrlStage, platformScope, linkedModule, weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [task.taskNumber, task.title, task.description, task.category, task.vrlStage, task.platformScope, task.linkedModule ?? null, task.weight]
    );
  }
  console.log(`✓ Seeded ${BRL_TASKS.length} BRL tasks successfully`);
  await conn.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
