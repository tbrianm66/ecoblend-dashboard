import type {
  Agent,
  AgentAssessment,
  EvidenceItem,
  ReportItem,
  RiskItem,
  RoleKey,
  StageGate,
  Venture,
} from "./types";

export const ventures: Venture[] = [
  {
    id: "v-flax",
    name: "FlaxCore Composites",
    tagline: "Natural-fibre structural panels for EV battery enclosures",
    domain: "Composite structures",
    stage: "Prototyping",
    recommendation: "proceed",
    overallReadiness: 68,
    overallConfidence: 74,
    modules: [
      { kind: "VRL", label: "Venture Readiness", readiness: 70, confidence: 78, delta: 4 },
      { kind: "TRL", label: "Technical Readiness", readiness: 74, confidence: 81, delta: 6 },
      { kind: "BRL", label: "Business Readiness", readiness: 61, confidence: 64, delta: 2 },
      { kind: "SRL", label: "Sustainability Readiness", readiness: 82, confidence: 88, delta: 3 },
      { kind: "MRL", label: "Manufacturing Readiness", readiness: 55, confidence: 49, delta: -1 },
      { kind: "IP", label: "IP Defensibility", readiness: 64, confidence: 58, delta: 1 },
      { kind: "FIN", label: "Funding Readiness", readiness: 59, confidence: 52, delta: 0 },
      { kind: "GOV", label: "Governance", readiness: 72, confidence: 70, delta: 1 },
    ],
  },
  {
    id: "v-myco",
    name: "MycoForm Foams",
    tagline: "Mycelium-grown impact foams replacing expanded polystyrene",
    domain: "Material science",
    stage: "Simulation",
    recommendation: "pause",
    overallReadiness: 71,
    overallConfidence: 41,
    modules: [
      { kind: "VRL", label: "Venture Readiness", readiness: 73, confidence: 44, delta: 9 },
      { kind: "TRL", label: "Technical Readiness", readiness: 69, confidence: 38, delta: 7 },
      { kind: "BRL", label: "Business Readiness", readiness: 66, confidence: 40, delta: 5 },
      { kind: "SRL", label: "Sustainability Readiness", readiness: 90, confidence: 62, delta: 4 },
      { kind: "MRL", label: "Manufacturing Readiness", readiness: 48, confidence: 33, delta: 2 },
      { kind: "IP", label: "IP Defensibility", readiness: 58, confidence: 35, delta: 0 },
      { kind: "FIN", label: "Funding Readiness", readiness: 62, confidence: 30, delta: 3 },
      { kind: "GOV", label: "Governance", readiness: 60, confidence: 45, delta: 1 },
    ],
  },
  {
    id: "v-kine",
    name: "KinetiX Actuators",
    tagline: "Recyclable shape-memory actuators for kinematic assemblies",
    domain: "Kinematic systems",
    stage: "Concept",
    recommendation: "pivot",
    overallReadiness: 44,
    overallConfidence: 36,
    modules: [
      { kind: "VRL", label: "Venture Readiness", readiness: 42, confidence: 34, delta: -3 },
      { kind: "TRL", label: "Technical Readiness", readiness: 51, confidence: 40, delta: 2 },
      { kind: "BRL", label: "Business Readiness", readiness: 38, confidence: 28, delta: -2 },
      { kind: "SRL", label: "Sustainability Readiness", readiness: 67, confidence: 55, delta: 1 },
      { kind: "MRL", label: "Manufacturing Readiness", readiness: 33, confidence: 25, delta: 0 },
      { kind: "IP", label: "IP Defensibility", readiness: 47, confidence: 30, delta: 1 },
      { kind: "FIN", label: "Funding Readiness", readiness: 40, confidence: 22, delta: -1 },
      { kind: "GOV", label: "Governance", readiness: 55, confidence: 48, delta: 0 },
    ],
  },
];

export const agents: Agent[] = [
  { id: "a-orch", name: "Orchestrator Agent", kind: "Coordination", version: "v1.4", status: "active", tier: "mvp" },
  { id: "a-intake", name: "Evidence Intake Agent", kind: "Ingestion", version: "v1.2", status: "active", tier: "mvp" },
  { id: "a-vra", name: "Venture Readiness Agent", kind: "Scoring", version: "v2.0", status: "active", tier: "mvp" },
  { id: "a-tech", name: "Technical / R&D Readiness Agent", kind: "Scoring", version: "v1.8", status: "idle", tier: "mvp" },
  { id: "a-bmv", name: "Business Model Validation Agent", kind: "Scoring", version: "v1.1", status: "queued", tier: "mvp" },
  { id: "a-sus", name: "Sustainability Readiness Agent", kind: "Scoring", version: "v1.6", status: "active", tier: "mvp" },
  { id: "a-eval", name: "Evaluator / Scoring Agent", kind: "Aggregation", version: "v2.1", status: "active", tier: "mvp" },
  { id: "a-mfg", name: "Manufacturing Readiness Agent", kind: "Scoring", version: "—", status: "idle", tier: "future" },
  { id: "a-ip", name: "IP & Data Moat Agent", kind: "Analysis", version: "—", status: "idle", tier: "future" },
  { id: "a-fin", name: "Finance & Funding Agent", kind: "Analysis", version: "—", status: "idle", tier: "future" },
  { id: "a-gov", name: "Governance & Compliance Agent", kind: "Analysis", version: "—", status: "idle", tier: "future" },
  { id: "a-acad", name: "Academic Evidence Agent", kind: "Ingestion", version: "—", status: "idle", tier: "future" },
];

export const evidence: EvidenceItem[] = [
  { id: "e-001", title: "Three-point bending test — flax panel batch B7", category: "Prototype test", source: "In-house lab", owner: "R. Mensah", uploadedAt: "2026-05-28", ventureId: "v-flax", linkedModule: "TRL", reviewStatus: "verified", confidence: 86, credibility: 90, scoreImpact: 6, version: 3 },
  { id: "e-002", title: "Cradle-to-gate LCA — FlaxCore vs aluminium", category: "Sustainability / LCA", source: "ISO 14040 study", owner: "L. Owen", uploadedAt: "2026-05-22", ventureId: "v-flax", linkedModule: "SRL", reviewStatus: "verified", confidence: 88, credibility: 92, scoreImpact: 5, version: 2 },
  { id: "e-003", title: "FEA buckling analysis — enclosure floor", category: "FEA / CFD", source: "Ansys export", owner: "D. Patel", uploadedAt: "2026-05-30", ventureId: "v-flax", linkedModule: "TRL", reviewStatus: "in review", confidence: 64, credibility: 70, scoreImpact: 3, version: 1 },
  { id: "e-004", title: "Tier-1 OEM letter of intent", category: "Market research", source: "Customer", owner: "S. Cole", uploadedAt: "2026-05-12", ventureId: "v-flax", linkedModule: "BRL", reviewStatus: "verified", confidence: 72, credibility: 80, scoreImpact: 4, version: 1 },
  { id: "e-101", title: "Mycelium growth-rate yield study", category: "Technical report", source: "University partner", owner: "A. Rossi", uploadedAt: "2026-05-25", ventureId: "v-myco", linkedModule: "TRL", reviewStatus: "in review", confidence: 38, credibility: 55, scoreImpact: 2, version: 1 },
  { id: "e-102", title: "Carbon sequestration claim dataset", category: "Carbon data", source: "Self-reported", owner: "A. Rossi", uploadedAt: "2026-05-18", ventureId: "v-myco", linkedModule: "SRL", reviewStatus: "disputed", confidence: 29, credibility: 35, scoreImpact: 1, version: 2 },
  { id: "e-103", title: "Founder interview — go-to-market thesis", category: "Founder interview", source: "Internal", owner: "Orchestrator", uploadedAt: "2026-05-20", ventureId: "v-myco", linkedModule: "BRL", reviewStatus: "pending", confidence: 40, credibility: 50, scoreImpact: 2, version: 1 },
  { id: "e-201", title: "Shape-memory cycle fatigue concept note", category: "CAD / engineering", source: "In-house", owner: "M. Haas", uploadedAt: "2026-05-15", ventureId: "v-kine", linkedModule: "TRL", reviewStatus: "pending", confidence: 33, credibility: 45, scoreImpact: 2, version: 1 },
  { id: "e-202", title: "Recyclability literature review", category: "Academic paper", source: "Peer-reviewed", owner: "Academic Agent", uploadedAt: "2026-05-10", ventureId: "v-kine", linkedModule: "SRL", reviewStatus: "verified", confidence: 55, credibility: 85, scoreImpact: 3, version: 1 },
];

export const assessments: AgentAssessment[] = [
  { id: "as-001", agentId: "a-tech", agentName: "Technical / R&D Readiness Agent", ventureId: "v-flax", task: "Re-score TRL after bending test B7", evidenceReviewed: 3, outputSummary: "Bending strength now meets enclosure spec at 1.6× safety factor. TRL raised to 7.", scoreImpact: 6, confidence: 81, risksIdentified: 1, recommendedAction: "Proceed to prototype gate review", approval: "approved", timestamp: "2026-05-30 14:22", agentVersion: "v1.8", runtimeCost: "$0.04" },
  { id: "as-002", agentId: "a-sus", agentName: "Sustainability Readiness Agent", ventureId: "v-flax", task: "Validate LCA carbon delta", outputSummary: "62% embodied-carbon reduction vs aluminium confirmed against ISO 14040 study.", evidenceReviewed: 2, scoreImpact: 5, confidence: 88, risksIdentified: 0, recommendedAction: "Publish to investor data room", approval: "not required", timestamp: "2026-05-29 09:10", agentVersion: "v1.6", runtimeCost: "$0.03" },
  { id: "as-003", agentId: "a-eval", agentName: "Evaluator / Scoring Agent", ventureId: "v-myco", task: "Aggregate venture readiness", outputSummary: "Readiness is high (71) but evidence confidence is low (41). Marking venture PROVISIONAL.", evidenceReviewed: 3, scoreImpact: 0, confidence: 41, risksIdentified: 2, recommendedAction: "Pause: require third-party validation of carbon claims", approval: "required", timestamp: "2026-05-28 16:45", agentVersion: "v2.1", runtimeCost: "$0.06" },
  { id: "as-004", agentId: "a-intake", agentName: "Evidence Intake Agent", ventureId: "v-myco", task: "Classify carbon dataset", outputSummary: "Self-reported sequestration data flagged: no independent measurement chain. Credibility 35.", evidenceReviewed: 1, scoreImpact: -2, confidence: 35, risksIdentified: 1, recommendedAction: "Flag greenwashing risk to Sustainability lead", approval: "required", timestamp: "2026-05-27 11:30", agentVersion: "v1.2", runtimeCost: "$0.02" },
  { id: "as-005", agentId: "a-vra", agentName: "Venture Readiness Agent", ventureId: "v-kine", task: "Initial concept scoring", outputSummary: "Concept-stage readiness 44. Business model unproven, evidence base thin.", evidenceReviewed: 2, scoreImpact: 3, confidence: 36, risksIdentified: 3, recommendedAction: "Pivot business model before simulation gate", approval: "required", timestamp: "2026-05-26 13:05", agentVersion: "v2.0", runtimeCost: "$0.05" },
];

export const risks: RiskItem[] = [
  { id: "r-001", title: "Manufacturing scale-up unproven beyond lab batches", category: "Manufacturing", severity: "material", affectedModule: "MRL", evidenceGap: "No pilot-line cycle-time data", recommendedAction: "Commission pilot run with contract manufacturer", owner: "S. Cole", deadline: "2026-06-30", status: "open", approval: "required", ventureId: "v-flax", linkedAssessmentId: "as-001" },
  { id: "r-002", title: "Funding runway below 6 months at current burn", category: "Finance", severity: "monitor", affectedModule: "FIN", evidenceGap: "Updated financial model pending", recommendedAction: "Refresh runway scenarios and open bridge round", owner: "Finance lead", deadline: "2026-07-15", status: "mitigating", approval: "not required", ventureId: "v-flax" },
  { id: "r-003", title: "Carbon sequestration claim not independently verified", category: "Sustainability", severity: "blocking", affectedModule: "SRL", evidenceGap: "No third-party measurement chain", recommendedAction: "Engage accredited LCA verifier before any external claim", owner: "L. Owen", deadline: "2026-06-20", status: "open", approval: "required", ventureId: "v-myco", linkedEvidenceId: "e-102", linkedAssessmentId: "as-004" },
  { id: "r-004", title: "Readiness score not backed by sufficient evidence", category: "Data confidence", severity: "blocking", affectedModule: "VRL", evidenceGap: "Confidence 41 vs readiness 71", recommendedAction: "Hold gate until evidence confidence ≥ 60", owner: "Orchestrator", deadline: "2026-06-25", status: "open", approval: "required", ventureId: "v-myco", linkedAssessmentId: "as-003" },
  { id: "r-005", title: "Business model unvalidated with target buyers", category: "Commercial", severity: "material", affectedModule: "BRL", evidenceGap: "No willingness-to-pay evidence", recommendedAction: "Run WTP interviews with 5 OEM buyers", owner: "M. Haas", deadline: "2026-07-10", status: "open", approval: "not required", ventureId: "v-kine", linkedAssessmentId: "as-005" },
  { id: "r-006", title: "Actuator fatigue life below automotive threshold", category: "Technical", severity: "material", affectedModule: "TRL", evidenceGap: "Only concept note, no cycle testing", recommendedAction: "Build test rig for 10k-cycle fatigue trial", owner: "M. Haas", deadline: "2026-08-01", status: "open", approval: "not required", ventureId: "v-kine", linkedEvidenceId: "e-201" },
];

export const stageGates: StageGate[] = [
  { id: "g-flax", ventureId: "v-flax", gate: "Prototyping", projectType: "iterative", entryCriteria: "Validated coupon-level mechanical data", exitCriteria: "Full-scale prototype passes enclosure load case", evidenceSubmitted: 4, agentRecommendation: "Approve with manufacturing-risk condition", humanApprover: "Studio Investment Committee", fundingStatus: "conditional", decision: "conditional" },
  { id: "g-myco", ventureId: "v-myco", gate: "Simulation", projectType: "moonshot", entryCriteria: "Material model calibrated to lab samples", exitCriteria: "Simulated impact performance within 10% of target", evidenceSubmitted: 3, agentRecommendation: "Hold — evidence confidence too low", humanApprover: "Studio Investment Committee", fundingStatus: "locked", decision: "pending evidence" },
  { id: "g-kine", ventureId: "v-kine", gate: "Concept", projectType: "moonshot", entryCriteria: "Defined problem & technical hypothesis", exitCriteria: "Feasibility evidence + business thesis", evidenceSubmitted: 2, agentRecommendation: "Conditional — pivot business model", humanApprover: "R&D Director", fundingStatus: "locked", decision: "conditional" },
];

export const reports: ReportItem[] = [
  { id: "rep-001", title: "Venture Readiness Report", ventureId: "v-flax", status: "approved", generatedBy: ["Venture Readiness Agent", "Evaluator Agent"], evidenceUsed: 9, confidence: 74, reviewer: "Studio IC", accessLevel: "investor", version: "v2.1", updatedAt: "2026-05-30" },
  { id: "rep-002", title: "Technical Validation Report", ventureId: "v-flax", status: "in review", generatedBy: ["Technical / R&D Readiness Agent"], evidenceUsed: 5, confidence: 81, reviewer: "R&D Director", accessLevel: "internal", version: "v1.3", updatedAt: "2026-05-30" },
  { id: "rep-003", title: "Sustainability Evidence Review", ventureId: "v-flax", status: "published", generatedBy: ["Sustainability Readiness Agent"], evidenceUsed: 4, confidence: 88, reviewer: "Sustainability lead", accessLevel: "partner", version: "v2.0", updatedAt: "2026-05-29" },
  { id: "rep-004", title: "Investor Readiness Pack", ventureId: "v-flax", status: "draft", generatedBy: ["Evaluator Agent", "Finance & Funding Agent"], evidenceUsed: 11, confidence: 66, reviewer: "—", accessLevel: "investor", version: "v0.4", updatedAt: "2026-05-31" },
  { id: "rep-005", title: "Sustainability Evidence Review", ventureId: "v-myco", status: "in review", generatedBy: ["Sustainability Readiness Agent"], evidenceUsed: 2, confidence: 41, reviewer: "Sustainability lead", accessLevel: "internal", version: "v0.9", updatedAt: "2026-05-28" },
  { id: "rep-006", title: "R&D Stage-Gate Report", ventureId: "v-kine", status: "draft", generatedBy: ["Technical / R&D Readiness Agent"], evidenceUsed: 2, confidence: 36, reviewer: "—", accessLevel: "internal", version: "v0.2", updatedAt: "2026-05-26" },
];

export const ventureName = (id: string) => ventures.find((v) => v.id === id)?.name ?? id;

export interface RoleConfig {
  key: RoleKey;
  label: string;
  focus: string;
  emphasis: string[];
}

export const roles: RoleConfig[] = [
  { key: "founder", label: "Founder / Venture Lead", focus: "Actions, evidence gaps, sprint tasks, readiness, blocking risks", emphasis: ["VRL", "BRL"] },
  { key: "investor", label: "Investor", focus: "Readiness, evidence confidence, key risks, data-room status", emphasis: ["VRL", "FIN"] },
  { key: "engineer", label: "Engineer / R&D Lead", focus: "TRL, R&D gates, prototype & simulation evidence, technical KPIs", emphasis: ["TRL", "MRL"] },
  { key: "sustainability", label: "Sustainability Specialist", focus: "SRL, LCA evidence, carbon data, greenwashing risk", emphasis: ["SRL"] },
  { key: "manufacturing", label: "Manufacturing Partner", focus: "MRL, supplier readiness, process capability, cost-to-scale", emphasis: ["MRL"] },
  { key: "academic", label: "Academic Partner", focus: "Research evidence, literature support, methodology quality", emphasis: ["TRL", "SRL"] },
  { key: "admin", label: "ECOBLEND Reviewer / Admin", focus: "Users, permissions, audit logs, approvals, agent & scoring config", emphasis: ["GOV"] },
];
