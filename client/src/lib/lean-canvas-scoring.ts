// ============================================================================
// Venture Model Canvas Scoring Utilities — Hybrid 10-Block Edition
// Implements the full 3-score model:
//   1. Canvas Completeness Score   (0–100, over 12 block-type keys)
//   2. Canvas Evidence Confidence  (0–100)
//   3. Model Readiness Score       (0–100, with caps)
//
// Block taxonomy (10 visual blocks / 12 data fields):
//   Infrastructure:  key_partners · key_activities · key_resources
//   Dual Value Prop: commercial_value_prop · mission_value_prop
//   Stakeholders:    customer_segments (payers) · beneficiary_segments (impact receivers)
//   Delivery:        channels
//   Economics:       cost_structure · revenue_streams
//   Mission Anchor:  mission_governance · impact_metrics
// ============================================================================

export const BLOCK_TYPES = [
  "key_partners",
  "key_activities",
  "key_resources",
  "commercial_value_prop",
  "mission_value_prop",
  "customer_segments",
  "beneficiary_segments",
  "channels",
  "cost_structure",
  "revenue_streams",
  "mission_governance",
  "impact_metrics",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_CONFIG: Record<
  BlockType,
  { label: string; color: string; prompt: string; hint: string; tooltip: string }
> = {
  key_partners: {
    label:   "Key Partners",
    color:   "#6366f1",
    prompt:  "Who are the strategic partners and suppliers enabling this venture?",
    hint:    "Alliances, IP licensors, ecosystem co-operators, impact networks.",
    tooltip: "Mission-locked ventures identify partners by both commercial leverage and mission alignment. Include entities that uphold governance commitments and share accountability for impact outcomes.",
  },
  key_activities: {
    label:   "Key Activities",
    color:   "#8b5cf6",
    prompt:  "What critical activities must the venture perform to deliver value and mission outcomes?",
    hint:    "Production, platform development, community engagement, impact measurement.",
    tooltip: "Include both revenue-generating and mission-delivery activities. Both must be resourced in your operating model — mission activities are not optional overhead.",
  },
  key_resources: {
    label:   "Key Resources",
    color:   "#a855f7",
    prompt:  "What physical, intellectual, human, or financial resources are essential?",
    hint:    "IP, proprietary data, specialist skills, manufacturing capacity, certifications.",
    tooltip: "Defensible resources for mission-locked ventures include impact data, governance credentials, ecosystem access, and certifications. These constitute structural competitive advantage.",
  },
  commercial_value_prop: {
    label:   "Commercial Value Proposition",
    color:   "#7c3aed",
    prompt:  "What measurable commercial outcome does this venture deliver for paying customers?",
    hint:    "Quantify: cost reduction %, time saved, defect rate, revenue uplift, ROI.",
    tooltip: "The commercial value proposition addresses the payer's rational economic decision. Must be quantified with evidence. Avoid generic phrases — tie directly to WTP data.",
  },
  mission_value_prop: {
    label:   "Mission / Impact Value Proposition",
    color:   "#16a34a",
    prompt:  "What social, environmental, or systemic impact does this venture deliver beyond commercial return?",
    hint:    "State the beneficiary, the problem addressed, and the measurable impact outcome.",
    tooltip: "The mission value prop is why this venture should exist beyond commercial return. Tie it to a specific SDG, systems-change goal, or governance commitment. Must be independently verifiable — not self-declared.",
  },
  customer_segments: {
    label:   "Customer Segments (Payers)",
    color:   "#10b981",
    prompt:  "Who are the paying customers — their role, behaviour, and purchasing authority?",
    hint:    "Job title, company size, buying cycle, decision-making unit.",
    tooltip: "For mission-locked ventures, distinguish who pays from who benefits. This block captures the payer. Use Beneficiary Segments for impact receivers who may not be direct customers.",
  },
  beneficiary_segments: {
    label:   "Beneficiary Segments (Impact Receivers)",
    color:   "#059669",
    prompt:  "Who receives the social, environmental, or ecosystem impact — and may not be the payer?",
    hint:    "Communities, ecosystems, downstream users, marginalised groups, future stakeholders.",
    tooltip: "Mission lock requires explicit identification of who the venture serves beyond direct commercial relationships. Include proxy beneficiaries (future generations, ecosystems) and describe how their outcomes are measured.",
  },
  channels: {
    label:   "Channels",
    color:   "#0ea5e9",
    prompt:  "How does the venture reach, engage, and deliver value to both payers and beneficiaries?",
    hint:    "Sales channels, delivery networks, community touchpoints, impact distribution.",
    tooltip: "Channels for mission-locked ventures serve both commercial conversion (payers) and impact distribution (beneficiaries). Note any tension between efficiency of commercial reach and equitable access for beneficiaries.",
  },
  cost_structure: {
    label:   "Cost Structure",
    color:   "#f59e0b",
    prompt:  "What are the key costs to build, deliver, and sustain the commercial model and mission commitments?",
    hint:    "Fixed vs variable, impact measurement costs, governance overhead, compliance.",
    tooltip: "Include mission delivery costs explicitly — impact measurement, governance, certification, and community engagement are operating costs of mission integrity, not optional extras.",
  },
  revenue_streams: {
    label:   "Revenue Streams",
    color:   "#22c55e",
    prompt:  "How does the venture capture commercial value — and reinvest in mission delivery?",
    hint:    "Pricing model, WTP evidence, revenue type, surplus allocation to mission.",
    tooltip: "Mission-locked revenue models often include tiered pricing, cross-subsidy, or grant blending. State what proportion of revenue is reinvested in mission delivery and the governance mechanism enforcing it.",
  },
  mission_governance: {
    label:   "Mission Lock & Legal Governance",
    color:   "#dc2626",
    prompt:  "What legal structures or governance mechanisms lock mission-alignment in perpetuity?",
    hint:    "Asset lock, purpose clause, B Corp, CIC constitution, steward ownership, benefit corporation charter.",
    tooltip: "Mission lock is the non-negotiable governance anchor of this canvas. Describe the legal entity type, asset lock provisions, board composition requirements, and what happens at wind-up or acquisition. Without this, mission is aspirational — not structural.",
  },
  impact_metrics: {
    label:   "Key Impact Metrics",
    color:   "#7c3aed",
    prompt:  "What specific, verifiable metrics prove mission outcomes are being delivered?",
    hint:    "Theory of change KPIs, SDG indicators, audit-ready impact data, SROI proxies.",
    tooltip: "Impact metrics must be independently verifiable, not self-reported. Link each metric to a theory-of-change assumption, specify the measurement cadence, data source, and who audits the evidence.",
  },
};

export const BLOCK_STATUS_OPTIONS = [
  { value: "assumption",   label: "Assumption",   color: "#6b7280", bg: "#f3f4f6" },
  { value: "testing",      label: "Testing",      color: "#f59e0b", bg: "#fffbeb" },
  { value: "validated",    label: "Validated",    color: "#16a34a", bg: "#f0fdf4" },
  { value: "invalidated",  label: "Invalidated",  color: "#dc2626", bg: "#fef2f2" },
  { value: "pivoted",      label: "Pivoted",      color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "incomplete",   label: "Incomplete",   color: "#9ca3af", bg: "#f9fafb" },
] as const;

export const EVIDENCE_STATUS_OPTIONS = [
  { value: "no_evidence",       label: "No Evidence",       color: "#9ca3af", bg: "#f3f4f6" },
  { value: "weak_evidence",     label: "Weak Evidence",     color: "#f59e0b", bg: "#fffbeb" },
  { value: "moderate_evidence", label: "Moderate Evidence", color: "#3b82f6", bg: "#eff6ff" },
  { value: "strong_evidence",   label: "Strong Evidence",   color: "#16a34a", bg: "#f0fdf4" },
  { value: "contradicted",      label: "Contradicted",      color: "#dc2626", bg: "#fef2f2" },
] as const;

export const REASON_FOR_CHANGE_OPTIONS = [
  { value: "new_canvas",              label: "New Canvas" },
  { value: "discovery_learning",      label: "Discovery Learning" },
  { value: "wtp_learning",            label: "WTP Learning" },
  { value: "competitor_learning",     label: "Competitor Learning" },
  { value: "demand_signal_learning",  label: "Demand Signal Learning" },
  { value: "pricing_learning",        label: "Pricing Learning" },
  { value: "unit_economics_learning", label: "Unit Economics Learning" },
  { value: "mvp_learning",            label: "MVP Learning" },
  { value: "gtm_learning",            label: "GTM Learning" },
  { value: "impact_evidence",         label: "Impact Evidence" },
  { value: "governance_update",       label: "Governance Update" },
  { value: "pivot",                   label: "Pivot" },
  { value: "stage_gate_review",       label: "Stage-Gate Review" },
];

export const OVERALL_STATUS_OPTIONS = [
  { value: "draft",                label: "Draft" },
  { value: "assumption_led",       label: "Assumption-Led" },
  { value: "testing",              label: "Testing" },
  { value: "partially_validated",  label: "Partially Validated" },
  { value: "validated",            label: "Validated" },
  { value: "pivot_required",       label: "Pivot Required" },
  { value: "archived",             label: "Archived" },
];

// ── Block content key map (lean_canvases DB column → blockType) ───────────────
export const BLOCK_CONTENT_KEY: Record<BlockType, string> = {
  key_partners:          "keyPartners",
  key_activities:        "keyActivities",
  key_resources:         "keyResources",
  commercial_value_prop: "commercialValueProp",
  mission_value_prop:    "missionValueProp",
  customer_segments:     "customerSegments",
  beneficiary_segments:  "beneficiarySegments",
  channels:              "channels",
  cost_structure:        "costStructure",
  revenue_streams:       "revenueStreams",
  mission_governance:    "missionGovernance",
  impact_metrics:        "impactMetrics",
};

const TOTAL_BLOCKS = BLOCK_TYPES.length; // 12

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Canvas Completeness Score: filled blocks / 12 × 100 */
export function calcCompletenessScore(canvas: Record<string, any>): number {
  const filled = BLOCK_TYPES.filter((bt) => {
    const key = BLOCK_CONTENT_KEY[bt];
    const val = canvas[key];
    return typeof val === "string" && val.trim().length > 0;
  }).length;
  return Math.round((filled / TOTAL_BLOCKS) * 100);
}

function evidenceStrengthToScore(evidenceStatus: string): number {
  switch (evidenceStatus) {
    case "strong_evidence":   return 100;
    case "moderate_evidence": return 70;
    case "weak_evidence":     return 40;
    case "no_evidence":       return 0;
    case "contradicted":      return 0;
    default:                  return 0;
  }
}

/** Block Evidence Confidence: per-spec formula */
export function calcBlockConfidence(block: {
  linkedHypothesisId?: string | null;
  evidenceStatus?: string;
  confidenceScore?: number;
  contradictionSummary?: string | null;
}): number {
  const hypScore       = block.linkedHypothesisId ? 100 : 0;
  const evidLinkScore  = (block.evidenceStatus && block.evidenceStatus !== "no_evidence") ? 100 : 0;
  const evidStrScore   = evidenceStrengthToScore(block.evidenceStatus ?? "no_evidence");
  const noContradScore = block.contradictionSummary ? 0 : 100;

  return Math.round(
    hypScore * 0.25 +
    evidLinkScore * 0.35 +
    evidStrScore * 0.25 +
    noContradScore * 0.15
  );
}

/** Canvas Evidence Confidence Score: average of all 12 block confidences */
export function calcEvidenceConfidenceScore(
  blocks: Array<{ blockType: string; linkedHypothesisId?: string | null; evidenceStatus?: string; contradictionSummary?: string | null }>
): number {
  if (blocks.length === 0) return 0;
  const total = BLOCK_TYPES.reduce((sum, bt) => {
    const block = blocks.find((b) => b.blockType === bt);
    return sum + (block ? calcBlockConfidence(block) : 0);
  }, 0);
  return Math.round(total / TOTAL_BLOCKS);
}

/** Model Readiness Score with spec caps (updated for hybrid VMC) */
export function calcModelReadinessScore(params: {
  completenessScore: number;
  evidenceConfidenceScore: number;
  wtpScore?: number | null;
  ueConfidenceScore?: number | null;
  bmRiskScore?: number | null;
  blocks: Array<{ blockType: string; evidenceStatus?: string; contradictionSummary?: string | null }>;
  canvas: Record<string, any>;
}): { score: number; caps: string[] } {
  const { completenessScore, evidenceConfidenceScore, wtpScore, ueConfidenceScore, bmRiskScore, blocks, canvas } = params;

  const wtpContrib  = wtpScore != null ? wtpScore : 0;
  const ueContrib   = ueConfidenceScore != null ? ueConfidenceScore : 0;
  const riskContrib = bmRiskScore != null ? Math.max(0, 100 - bmRiskScore) : 50;

  let score = Math.round(
    completenessScore * 0.30 +
    evidenceConfidenceScore * 0.40 +
    wtpContrib * 0.15 +
    ueContrib * 0.10 +
    riskContrib * 0.05
  );

  const caps: string[] = [];

  // Cap: no WTP → max 70
  if (wtpScore == null) {
    if (score > 70) { score = 70; caps.push("No WTP score — capped at 70"); }
  }

  // Cap: commercial UVP has no measurable outcome → max 60
  const uvpContent = (canvas["commercialValueProp"] ?? canvas["uniqueValueProp"] ?? "").toLowerCase();
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(uvpContent);
  if (uvpContent && !hasQuantified) {
    if (score > 60) { score = 60; caps.push("Commercial Value Prop lacks measurable outcome — capped at 60"); }
  }

  // Cap: revenue streams no WTP evidence → max 60
  const revBlock = blocks.find((b) => b.blockType === "revenue_streams");
  if (revBlock && (revBlock.evidenceStatus === "no_evidence" || !revBlock.evidenceStatus)) {
    if (score > 60) { score = 60; caps.push("Revenue Streams has no WTP evidence — capped at 60"); }
  }

  // Cap: customer segments not linked to hypothesis → max 50
  const segBlock = blocks.find((b) => b.blockType === "customer_segments");
  if (segBlock && (segBlock.evidenceStatus === "no_evidence" || !segBlock.evidenceStatus)) {
    if (score > 50) { score = 50; caps.push("Customer Segments has no customer-discovery evidence — capped at 50"); }
  }

  // Cap: mission governance missing → max 65
  const govContent = (canvas["missionGovernance"] ?? "").trim();
  if (!govContent) {
    if (score > 65) { score = 65; caps.push("Mission Lock & Governance not defined — capped at 65"); }
  }

  // Cap: >3 contradicted blocks → max 40
  const contradicted = blocks.filter((b) => b.evidenceStatus === "contradicted" || b.contradictionSummary).length;
  if (contradicted > 3) {
    if (score > 40) { score = 40; caps.push(`${contradicted} blocks contradicted by evidence — capped at 40`); }
  }

  return { score: Math.max(0, Math.min(100, score)), caps };
}

/** Completeness band label */
export function completenessLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Structurally complete",             color: "#16a34a" };
  if (score >= 70) return { label: "Complete — evidence review needed", color: "#2563eb" };
  if (score >= 40) return { label: "Partially complete",               color: "#f59e0b" };
  return { label: "Incomplete",                                         color: "#dc2626" };
}

/** Model readiness band label */
export function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Strong model readiness",           color: "#16a34a" };
  if (score >= 60) return { label: "Ready for limited MVP definition", color: "#2563eb" };
  if (score >= 40) return { label: "Needs evidence",                  color: "#f59e0b" };
  return { label: "Not ready",                                         color: "#dc2626" };
}

// ── Warning detection ─────────────────────────────────────────────────────────

const GENERIC_UVP_WORDS = ["ai-powered", "sustainable", "innovative", "data-driven", "seamless", "next-generation", "cutting-edge", "world-class", "revolutionary", "disruptive"];
const VANITY_METRIC_WORDS = ["views", "followers", "likes", "impressions", "general interest", "social media", "pageviews", "visitors", "sign-ups"];
const WEAK_GOVERNANCE_WORDS = ["committed", "intend", "plan to", "aspire", "will consider", "hope to", "our values"];

export function detectUVPWarning(uvp: string): string | null {
  if (!uvp?.trim()) return null;
  const lower = uvp.toLowerCase();
  const hasGeneric = GENERIC_UVP_WORDS.some((w) => lower.includes(w));
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(lower);
  if (hasGeneric && !hasQuantified) return "Value proposition is generic. Link it to measurable customer value.";
  return null;
}

export function detectVanityMetricWarning(metrics: string): string | null {
  if (!metrics?.trim()) return null;
  const lower = metrics.toLowerCase();
  if (VANITY_METRIC_WORDS.some((w) => lower.includes(w))) return "Potential vanity metric. Use actionable, auditable metrics.";
  return null;
}

export function detectWeakGovernanceWarning(governance: string): string | null {
  if (!governance?.trim()) return null;
  const lower = governance.toLowerCase();
  if (WEAK_GOVERNANCE_WORDS.some((w) => lower.includes(w))) {
    return "Mission governance uses aspirational language. Specify the legal structure and binding mechanism.";
  }
  const hasLegalEntity = /cic|b.corp|benefit corp|steward|asset lock|purpose clause|constitution/.test(lower);
  if (!hasLegalEntity) return "No legal entity or binding mechanism identified. Mission lock requires a structural commitment.";
  return null;
}

export function getBlockWarnings(
  blockType: BlockType,
  content: string,
  blockMeta: { evidenceStatus?: string; linkedHypothesisId?: string | null } | undefined,
  canvas: Record<string, any>
): string[] {
  const warnings: string[] = [];
  const hasContent  = content?.trim().length > 0;
  const hasEvidence = blockMeta?.evidenceStatus && blockMeta.evidenceStatus !== "no_evidence";
  const hasHypothesis = !!blockMeta?.linkedHypothesisId;

  switch (blockType) {
    case "key_partners":
      if (!hasContent) warnings.push("Without defined partners, key activities and mission delivery may be under-resourced.");
      break;
    case "key_activities":
      if (!hasContent) warnings.push("Key activities must cover both commercial delivery and mission impact execution.");
      break;
    case "key_resources":
      if (!hasContent) warnings.push("Defensible resources are required to assess competitive position and mission sustainability.");
      break;
    case "commercial_value_prop": {
      const w = detectUVPWarning(content);
      if (w) warnings.push(w);
      if (!hasEvidence) warnings.push("Commercial Value Prop has no linked evidence. Link to WTP test or customer interview.");
      break;
    }
    case "mission_value_prop":
      if (!hasContent) warnings.push("Mission value prop is required — states why this venture exists beyond commercial return.");
      if (!hasEvidence) warnings.push("Mission impact claim has no evidence. Link to theory of change or impact audit.");
      break;
    case "customer_segments":
      if (!hasHypothesis) warnings.push("Customer segment not linked to a validated hypothesis.");
      if (!hasEvidence)   warnings.push("Payer segment is assumption-led — no customer-discovery evidence.");
      break;
    case "beneficiary_segments":
      if (!hasContent) warnings.push("Mission-locked ventures must identify beneficiaries distinct from paying customers.");
      break;
    case "channels":
      if (!hasEvidence) warnings.push("Channel assumption is untested. Identify whether channels serve both payers and beneficiaries.");
      break;
    case "cost_structure":
      if (!hasContent) warnings.push("Unit economics cannot be assessed without cost structure. Include mission delivery costs.");
      break;
    case "revenue_streams":
      if (!hasEvidence) warnings.push("Revenue model confidence is limited by weak WTP evidence.");
      break;
    case "mission_governance": {
      const w = detectWeakGovernanceWarning(content);
      if (w) warnings.push(w);
      if (!hasContent) warnings.push("Mission Lock block is empty. This is a structural gap for mission-locked ventures.");
      break;
    }
    case "impact_metrics": {
      const w = detectVanityMetricWarning(content);
      if (w) warnings.push(w);
      if (!hasContent) warnings.push("Impact metrics must be independently verifiable. Define KPIs linked to theory of change.");
      break;
    }
  }

  if (blockMeta?.evidenceStatus === "contradicted") {
    warnings.push("Evidence contradicts this canvas block. Review before advancing venture stage.");
  }

  return warnings;
}

// ── Stage-gate readiness check ────────────────────────────────────────────────

export interface StageGateResult {
  ready: boolean;
  blockers: string[];
}

export function checkStageGateReadiness(
  completenessScore: number,
  modelReadinessScore: number,
  blocks: Array<{ blockType: string; evidenceStatus?: string; linkedHypothesisId?: string | null }>,
  canvas: Record<string, any>
): StageGateResult {
  const blockers: string[] = [];

  if (completenessScore < 70)
    blockers.push(`Canvas completeness is ${completenessScore}% — needs 70%+ to proceed.`);
  if (modelReadinessScore < 60)
    blockers.push(`Model Readiness Score is ${modelReadinessScore} — needs 60+ to proceed.`);

  const segBlock = blocks.find((b) => b.blockType === "customer_segments");
  if (!segBlock || !segBlock.linkedHypothesisId)
    blockers.push("Customer Segments block is not linked to a validated hypothesis.");

  const uvpContent = canvas["commercialValueProp"] ?? canvas["uniqueValueProp"] ?? "";
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(uvpContent.toLowerCase());
  if (!uvpContent || !hasQuantified)
    blockers.push("Commercial Value Prop must include a measurable customer outcome.");

  const revBlock = blocks.find((b) => b.blockType === "revenue_streams");
  if (!revBlock || (revBlock.evidenceStatus === "no_evidence" || !revBlock.evidenceStatus))
    blockers.push("Revenue Streams block has no WTP evidence or active WTP experiment.");

  const govContent = (canvas["missionGovernance"] ?? "").trim();
  if (!govContent)
    blockers.push("Mission Lock & Governance block is empty — required for mission-locked ventures.");

  const benefContent = (canvas["beneficiarySegments"] ?? "").trim();
  if (!benefContent)
    blockers.push("Beneficiary Segments block is empty — required to distinguish payers from impact receivers.");

  const metricsContent = canvas["impactMetrics"] ?? "";
  const vanityW = detectVanityMetricWarning(metricsContent);
  if (vanityW) blockers.push("Impact Metrics contain vanity metrics — replace with independently verifiable KPIs.");

  return { ready: blockers.length === 0, blockers };
}

// ── Export / summary ──────────────────────────────────────────────────────────

export function generateCanvasSummaryMarkdown(params: {
  venture: { id: string; name: string };
  canvas: Record<string, any>;
  blocks: Array<{ blockType: string; blockStatus?: string; evidenceStatus?: string; contradictionSummary?: string | null }>;
  completenessScore: number;
  evidenceConfidenceScore: number;
  modelReadinessScore: number;
  caps: string[];
}): string {
  const { venture, canvas, blocks, completenessScore, evidenceConfidenceScore, modelReadinessScore, caps } = params;
  const now = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const blockLine = (bt: BlockType) => {
    const cfg        = BLOCK_CONFIG[bt];
    const contentKey = BLOCK_CONTENT_KEY[bt];
    const content    = canvas[contentKey] ?? "—";
    const meta       = blocks.find((b) => b.blockType === bt);
    const status     = meta?.blockStatus ?? "assumption";
    const evid       = meta?.evidenceStatus ?? "no_evidence";
    return `### ${cfg.label}\n**Status:** ${status} | **Evidence:** ${evid}\n${content}`;
  };

  const blockSection  = BLOCK_TYPES.map(blockLine).join("\n\n");
  const capsSection   = caps.length > 0 ? `\n**Score Caps Applied:**\n${caps.map((c) => `- ${c}`).join("\n")}` : "";
  const missing       = BLOCK_TYPES.filter((bt) => {
    const val = canvas[BLOCK_CONTENT_KEY[bt]];
    return !val || (val as string).trim().length === 0;
  });

  return `# Venture Model Canvas Summary — ${venture.name}
**Version:** v${canvas.version ?? 1}${canvas.versionLabel ? ` · ${canvas.versionLabel}` : ""}
**Date:** ${now}
**Overall Status:** ${canvas.overallStatus ?? "draft"}

---

## Scores
- **Canvas Completeness:** ${completenessScore}%
- **Evidence Confidence:** ${evidenceConfidenceScore}%
- **Model Readiness:** ${modelReadinessScore}${capsSection}

---

## Infrastructure
${["key_partners", "key_activities", "key_resources"].map((bt) => blockLine(bt as BlockType)).join("\n\n")}

---

## Value Propositions
${["commercial_value_prop", "mission_value_prop"].map((bt) => blockLine(bt as BlockType)).join("\n\n")}

---

## Stakeholders & Delivery
${["customer_segments", "beneficiary_segments", "channels"].map((bt) => blockLine(bt as BlockType)).join("\n\n")}

---

## Economics
${["cost_structure", "revenue_streams"].map((bt) => blockLine(bt as BlockType)).join("\n\n")}

---

## Mission Anchor
${["mission_governance", "impact_metrics"].map((bt) => blockLine(bt as BlockType)).join("\n\n")}

---

## Gaps
${missing.length === 0 ? "All blocks completed." : missing.map((bt) => `- ${BLOCK_CONFIG[bt].label} — missing`).join("\n")}
`;
}
