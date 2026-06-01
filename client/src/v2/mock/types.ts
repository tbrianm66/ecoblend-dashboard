export type RoleKey =
  | "founder"
  | "investor"
  | "engineer"
  | "sustainability"
  | "manufacturing"
  | "academic"
  | "admin";

export type ModuleKind = "VRL" | "TRL" | "BRL" | "SRL" | "MRL" | "IP" | "FIN" | "GOV";

export type GateName = "Concept" | "Simulation" | "Prototyping" | "Track Integration";

export type GateDecision = "approved" | "rejected" | "conditional" | "pending evidence";

export type RiskSeverity = "blocking" | "material" | "monitor" | "advisory";

export type RiskCategory =
  | "Technical"
  | "Commercial"
  | "Sustainability"
  | "Manufacturing"
  | "IP"
  | "Finance"
  | "People"
  | "Governance"
  | "Data confidence";

export type EvidenceCategory =
  | "Technical report"
  | "CAD / engineering"
  | "FEA / CFD"
  | "Prototype test"
  | "Sustainability / LCA"
  | "Carbon data"
  | "Supplier data"
  | "Market research"
  | "Customer interview"
  | "Founder interview"
  | "Financial model"
  | "IP note"
  | "Academic paper"
  | "Governance doc"
  | "Investor material";

export type AgentReviewStatus = "pending" | "in review" | "verified" | "disputed";

export type ApprovalState = "not required" | "required" | "approved" | "rejected";

export interface ModuleScore {
  kind: ModuleKind;
  label: string;
  readiness: number; // 0-100
  confidence: number; // 0-100
  delta: number; // recent change in readiness
}

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  stage: GateName;
  recommendation: "proceed" | "pause" | "pivot" | "kill";
  overallReadiness: number;
  overallConfidence: number;
  modules: ModuleScore[];
}

export interface Agent {
  id: string;
  name: string;
  kind: string;
  version: string;
  status: "active" | "idle" | "queued";
  tier: "mvp" | "future";
}

export interface EvidenceItem {
  id: string;
  title: string;
  category: EvidenceCategory;
  source: string;
  owner: string;
  uploadedAt: string;
  ventureId: string;
  linkedModule: ModuleKind;
  reviewStatus: AgentReviewStatus;
  confidence: number; // evidence confidence 0-100
  credibility: number; // source credibility 0-100
  scoreImpact: number; // contribution to readiness
  version: number;
}

export interface AgentAssessment {
  id: string;
  agentId: string;
  agentName: string;
  ventureId: string;
  task: string;
  evidenceReviewed: number;
  outputSummary: string;
  scoreImpact: number;
  confidence: number;
  risksIdentified: number;
  recommendedAction: string;
  approval: ApprovalState;
  timestamp: string;
  agentVersion: string;
  runtimeCost: string;
}

export interface RiskItem {
  id: string;
  title: string;
  category: RiskCategory;
  severity: RiskSeverity;
  affectedModule: ModuleKind;
  evidenceGap: string;
  recommendedAction: string;
  owner: string;
  deadline: string;
  status: "open" | "mitigating" | "resolved";
  approval: ApprovalState;
  ventureId: string;
  linkedEvidenceId?: string;
  linkedAssessmentId?: string;
}

export interface StageGate {
  id: string;
  ventureId: string;
  gate: GateName;
  projectType: "iterative" | "moonshot";
  entryCriteria: string;
  exitCriteria: string;
  evidenceSubmitted: number;
  agentRecommendation: string;
  humanApprover: string;
  fundingStatus: "locked" | "conditional" | "unlocked";
  decision: GateDecision;
}

export interface ReportItem {
  id: string;
  title: string;
  ventureId: string;
  status: "draft" | "in review" | "approved" | "published";
  generatedBy: string[];
  evidenceUsed: number;
  confidence: number;
  reviewer: string;
  accessLevel: "internal" | "investor" | "partner" | "public";
  version: string;
  updatedAt: string;
}
