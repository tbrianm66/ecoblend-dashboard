export const LEAN_STAGES = [
  "venture_intake",
  "assumption_definition",
  "customer_discovery",
  "problem_validation",
  "competitor_mapping",
  "demand_signals",
  "wtp_assessment",
  "wtp_gate",
  "rnd_mvp_definition",
  "prototype_build",
  "solution_validation",
  "mvp_evidence_gate",
  "operations_mrl",
  "brand_gtm",
  "command_centre_review",
  "decision_gate",
] as const;

export type LeanStage = (typeof LEAN_STAGES)[number];

export const GATE_STAGES = new Set<LeanStage>([
  "problem_validation",
  "wtp_gate",
  "mvp_evidence_gate",
  "command_centre_review",
  "decision_gate",
]);

export const GATE_TYPE_FOR_STAGE: Partial<Record<LeanStage, string>> = {
  problem_validation:    "problem_validated",
  wtp_gate:              "wtp_validated",
  mvp_evidence_gate:     "mvp_evidence_strong",
  command_centre_review: "investment_ready",
  decision_gate:         "investment_ready",
};

export const PIVOT_REVERT_MAP: Partial<Record<string, LeanStage>> = {
  problem:          "customer_discovery",
  customer_segment: "customer_discovery",
  solution:         "rnd_mvp_definition",
  pricing:          "wtp_assessment",
  channel:          "brand_gtm",
  business_model:   "wtp_assessment",
};

export const STAGE_EXIT_CRITERIA: Record<
  LeanStage,
  {
    minInterviews?: number;
    minWtpScore?: number;
    minValidationRate?: number;
    requiresApprovedGate?: boolean;
  }
> = {
  venture_intake:        {},
  assumption_definition: {},
  customer_discovery:    { minInterviews: 3 },
  problem_validation:    { requiresApprovedGate: true },
  competitor_mapping:    {},
  demand_signals:        {},
  wtp_assessment:        { minWtpScore: 50 },
  wtp_gate:              { requiresApprovedGate: true },
  rnd_mvp_definition:    {},
  prototype_build:       {},
  solution_validation:   { minValidationRate: 0.6 },
  mvp_evidence_gate:     { requiresApprovedGate: true },
  operations_mrl:        {},
  brand_gtm:             {},
  command_centre_review: { requiresApprovedGate: true },
  decision_gate:         { requiresApprovedGate: true },
};

export const STAGE_LABELS: Record<LeanStage, string> = {
  venture_intake:        "Venture Intake",
  assumption_definition: "Assumption Definition",
  customer_discovery:    "Customer Discovery",
  problem_validation:    "Problem Validation Gate",
  competitor_mapping:    "Competitor Mapping",
  demand_signals:        "Demand Signals",
  wtp_assessment:        "WTP Assessment",
  wtp_gate:              "WTP Validation Gate",
  rnd_mvp_definition:    "R&D / MVP Definition",
  prototype_build:       "Build Prototype",
  solution_validation:   "Solution Validation",
  mvp_evidence_gate:     "MVP Evidence Gate",
  operations_mrl:        "Operations & MRL",
  brand_gtm:             "Brand & GTM",
  command_centre_review: "Command Centre Review",
  decision_gate:         "Decision Gate",
};
