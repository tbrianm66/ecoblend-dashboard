// ============================================================================
// Lean Canvas Scoring Utilities
// Implements the full 3-score model from the spec:
//   1. Canvas Completeness Score   (0–100)
//   2. Canvas Evidence Confidence  (0–100)
//   3. Model Readiness Score       (0–100, with caps)
// ============================================================================

export const BLOCK_TYPES = [
  "customer_segments",
  "problem",
  "existing_alternatives",
  "unique_value_proposition",
  "solution",
  "channels",
  "revenue_streams",
  "cost_structure",
  "key_metrics",
  "unfair_advantage",
  "high_level_concept",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_CONFIG: Record<
  BlockType,
  { label: string; color: string; prompt: string; hint: string }
> = {
  customer_segments: {
    label: "Customer Segments",
    color: "#10b981",
    prompt: "Who are the specific customers, users, buyers, influencers, and decision-makers?",
    hint: "Be specific: job title, company type, buying behaviour.",
  },
  problem: {
    label: "Problem",
    color: "#ef4444",
    prompt: "What painful, frequent, urgent, or expensive problem is the customer trying to solve?",
    hint: "Include frequency, severity, and current workarounds.",
  },
  existing_alternatives: {
    label: "Existing Alternatives",
    color: "#f97316",
    prompt: "What does the customer use today instead of this solution?",
    hint: "Incumbent tools, manual processes, competitor products.",
  },
  unique_value_proposition: {
    label: "Unique Value Proposition",
    color: "#8b5cf6",
    prompt: "What measurable customer outcome does this venture create that alternatives do not?",
    hint: "Quantify: cost reduction, time saved, defect rate, revenue uplift.",
  },
  solution: {
    label: "Solution",
    color: "#3b82f6",
    prompt: "What is the smallest solution or MVP required to test the value proposition?",
    hint: "Keep it minimal — this should test, not build the full product.",
  },
  channels: {
    label: "Channels",
    color: "#0ea5e9",
    prompt: "How will the venture reach, engage, and convert the target customer?",
    hint: "Direct sales, partnerships, events, content, referrals.",
  },
  revenue_streams: {
    label: "Revenue Streams",
    color: "#22c55e",
    prompt: "How will this venture capture value?",
    hint: "Pricing model, revenue type, WTP evidence.",
  },
  cost_structure: {
    label: "Cost Structure",
    color: "#f59e0b",
    prompt: "What are the main costs required to build, deliver, sell, and support the solution?",
    hint: "Fixed vs variable, unit costs, key cost drivers.",
  },
  key_metrics: {
    label: "Key Metrics",
    color: "#6366f1",
    prompt: "What actionable metrics prove progress through validated learning?",
    hint: "Avoid vanity metrics. Use conversion, retention, CAC/LTV, validation rates.",
  },
  unfair_advantage: {
    label: "Unfair Advantage",
    color: "#ec4899",
    prompt: "What advantage would be difficult for competitors to copy?",
    hint: "Data, IP, relationships, domain knowledge, manufacturing access.",
  },
  high_level_concept: {
    label: "High-Level Concept",
    color: "#14b8a6",
    prompt: "How would you describe this venture in one clear sentence?",
    hint: "≤25 words. No jargon.",
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
  { value: "new_canvas",                 label: "New Canvas" },
  { value: "discovery_learning",         label: "Discovery Learning" },
  { value: "wtp_learning",               label: "WTP Learning" },
  { value: "competitor_learning",        label: "Competitor Learning" },
  { value: "demand_signal_learning",     label: "Demand Signal Learning" },
  { value: "pricing_learning",           label: "Pricing Learning" },
  { value: "unit_economics_learning",    label: "Unit Economics Learning" },
  { value: "mvp_learning",               label: "MVP Learning" },
  { value: "gtm_learning",               label: "GTM Learning" },
  { value: "pivot",                      label: "Pivot" },
  { value: "stage_gate_review",          label: "Stage-Gate Review" },
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

// ── Block content key map (lean_canvases column → blockType) ─────────────────
export const BLOCK_CONTENT_KEY: Record<BlockType, string> = {
  customer_segments:       "customerSegments",
  problem:                 "problem",
  existing_alternatives:   "existingAlternatives",
  unique_value_proposition:"uniqueValueProp",
  solution:                "solution",
  channels:                "channels",
  revenue_streams:         "revenueStreams",
  cost_structure:          "costStructure",
  key_metrics:             "keyMetrics",
  unfair_advantage:        "unfairAdvantage",
  high_level_concept:      "highLevelConcept",
};

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Canvas Completeness Score: filled blocks / 11 × 100 */
export function calcCompletenessScore(canvas: Record<string, any>): number {
  const filled = BLOCK_TYPES.filter((bt) => {
    const key = BLOCK_CONTENT_KEY[bt];
    const val = canvas[key];
    return typeof val === "string" && val.trim().length > 0;
  }).length;
  return Math.round((filled / 11) * 100);
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
  const hypScore      = block.linkedHypothesisId ? 100 : 0;
  const evidLinkScore = (block.evidenceStatus && block.evidenceStatus !== "no_evidence") ? 100 : 0;
  const evidStrScore  = evidenceStrengthToScore(block.evidenceStatus ?? "no_evidence");
  const noContradScore = block.contradictionSummary ? 0 : 100;

  return Math.round(
    hypScore * 0.25 +
    evidLinkScore * 0.35 +
    evidStrScore * 0.25 +
    noContradScore * 0.15
  );
}

/** Canvas Evidence Confidence Score: average of all 11 block confidences */
export function calcEvidenceConfidenceScore(
  blocks: Array<{ blockType: string; linkedHypothesisId?: string | null; evidenceStatus?: string; contradictionSummary?: string | null }>
): number {
  if (blocks.length === 0) return 0;
  const total = BLOCK_TYPES.reduce((sum, bt) => {
    const block = blocks.find((b) => b.blockType === bt);
    return sum + (block ? calcBlockConfidence(block) : 0);
  }, 0);
  return Math.round(total / 11);
}

/** Model Readiness Score with all spec caps */
export function calcModelReadinessScore(params: {
  completenessScore: number;
  evidenceConfidenceScore: number;
  wtpScore?: number | null;          // 0–100; null = missing
  ueConfidenceScore?: number | null; // 0–100; null = missing
  bmRiskScore?: number | null;       // 0–100; null = not available
  blocks: Array<{ blockType: string; evidenceStatus?: string; contradictionSummary?: string | null }>;
  canvas: Record<string, any>;
}): { score: number; caps: string[] } {
  const {
    completenessScore,
    evidenceConfidenceScore,
    wtpScore,
    ueConfidenceScore,
    bmRiskScore,
    blocks,
    canvas,
  } = params;

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

  // Cap: UVP has no measurable outcome → max 60
  const uvpContent = (canvas["uniqueValueProp"] ?? "").toLowerCase();
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(uvpContent);
  if (uvpContent && !hasQuantified) {
    if (score > 60) { score = 60; caps.push("UVP lacks measurable outcome — capped at 60"); }
  }

  // Cap: revenue streams no WTP evidence → max 60
  const revBlock = blocks.find((b) => b.blockType === "revenue_streams");
  if (revBlock && (revBlock.evidenceStatus === "no_evidence" || !revBlock.evidenceStatus)) {
    if (score > 60) { score = 60; caps.push("Revenue Streams has no WTP evidence — capped at 60"); }
  }

  // Cap: problem no customer discovery → max 50
  const probBlock = blocks.find((b) => b.blockType === "problem");
  if (probBlock && (probBlock.evidenceStatus === "no_evidence" || !probBlock.evidenceStatus)) {
    if (score > 50) { score = 50; caps.push("Problem has no customer discovery evidence — capped at 50"); }
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
  if (score >= 90) return { label: "Structurally complete",        color: "#16a34a" };
  if (score >= 70) return { label: "Complete — evidence review needed", color: "#2563eb" };
  if (score >= 40) return { label: "Partially complete",           color: "#f59e0b" };
  return { label: "Incomplete",                                    color: "#dc2626" };
}

/** Model readiness band label */
export function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Strong model readiness",          color: "#16a34a" };
  if (score >= 60) return { label: "Ready for limited MVP definition", color: "#2563eb" };
  if (score >= 40) return { label: "Needs evidence",                  color: "#f59e0b" };
  return { label: "Not ready",                                        color: "#dc2626" };
}

// ── Warning detection ─────────────────────────────────────────────────────────

const GENERIC_UVP_WORDS = ["ai-powered", "sustainable", "innovative", "data-driven", "seamless", "next-generation", "cutting-edge", "world-class", "revolutionary", "disruptive"];
const VANITY_METRIC_WORDS = ["views", "followers", "likes", "impressions", "general interest", "social media", "pageviews", "visitors", "sign-ups"];

export function detectUVPWarning(uvp: string): string | null {
  if (!uvp?.trim()) return null;
  const lower = uvp.toLowerCase();
  const hasGeneric = GENERIC_UVP_WORDS.some((w) => lower.includes(w));
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(lower);
  if (hasGeneric && !hasQuantified) {
    return "Value proposition is generic. Link it to measurable customer value.";
  }
  return null;
}

export function detectVanityMetricWarning(keyMetrics: string): string | null {
  if (!keyMetrics?.trim()) return null;
  const lower = keyMetrics.toLowerCase();
  const hasVanity = VANITY_METRIC_WORDS.some((w) => lower.includes(w));
  if (hasVanity) return "Potential vanity metric. Use actionable, auditable metrics.";
  return null;
}

export function detectSolutionBiasWarning(solution: string, problem: string): string | null {
  if (!solution?.trim() || !problem?.trim()) return null;
  if (solution.length > problem.length * 1.8) {
    return "Potential solution bias detected. Validate the customer problem before expanding the solution.";
  }
  return null;
}

export function detectHighLevelConceptWarning(concept: string): string | null {
  if (!concept?.trim()) return null;
  const wordCount = concept.trim().split(/\s+/).length;
  if (wordCount > 25) return "High-level concept should be concise enough for immediate understanding (≤25 words).";
  return null;
}

export function getBlockWarnings(
  blockType: BlockType,
  content: string,
  blockMeta: { evidenceStatus?: string; linkedHypothesisId?: string | null } | undefined,
  canvas: Record<string, any>
): string[] {
  const warnings: string[] = [];
  const hasContent = content?.trim().length > 0;
  const hasEvidence = blockMeta?.evidenceStatus && blockMeta.evidenceStatus !== "no_evidence";
  const hasHypothesis = !!blockMeta?.linkedHypothesisId;

  switch (blockType) {
    case "customer_segments":
      if (!hasHypothesis) warnings.push("Customer segment is not linked to validation evidence.");
      break;
    case "problem":
      if (!hasEvidence) warnings.push("Problem is still assumption-led.");
      break;
    case "existing_alternatives":
      if (!hasContent) warnings.push("Existing alternatives must be defined before positioning is credible.");
      break;
    case "unique_value_proposition": {
      const w = detectUVPWarning(content);
      if (w) warnings.push(w);
      if (!hasEvidence) warnings.push("UVP has no linked evidence.");
      break;
    }
    case "solution": {
      const w = detectSolutionBiasWarning(content, canvas["problem"] ?? "");
      if (w) warnings.push(w);
      break;
    }
    case "channels":
      if (!hasEvidence) warnings.push("Channel assumption is untested.");
      break;
    case "revenue_streams":
      if (!hasEvidence) warnings.push("Revenue model confidence is limited by weak WTP evidence.");
      break;
    case "cost_structure":
      if (!hasContent) warnings.push("Unit economics cannot be assessed without cost structure.");
      break;
    case "key_metrics": {
      const w = detectVanityMetricWarning(content);
      if (w) warnings.push(w);
      break;
    }
    case "unfair_advantage": {
      const lower = (content ?? "").toLowerCase();
      const generic = ["unique", "innovative", "best", "leading", "first"].some((w) => lower.includes(w));
      const specific = ["data", "ip", "patent", "relationship", "expertise", "knowledge", "formula", "access", "network"].some((w) => lower.includes(w));
      if (hasContent && generic && !specific) warnings.push("Unfair advantage is not defensible enough.");
      break;
    }
    case "high_level_concept": {
      const w = detectHighLevelConceptWarning(content);
      if (w) warnings.push(w);
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
    blockers.push(`Canvas completeness is ${completenessScore}% — needs 70%+ for R&D Hub.`);
  if (modelReadinessScore < 60)
    blockers.push(`Model Readiness Score is ${modelReadinessScore} — needs 60+ for R&D Hub.`);

  const probBlock = blocks.find((b) => b.blockType === "problem");
  if (!probBlock || probBlock.evidenceStatus === "no_evidence" || !probBlock.evidenceStatus)
    blockers.push("Problem block has no customer discovery evidence.");

  const segBlock = blocks.find((b) => b.blockType === "customer_segments");
  if (!segBlock || !segBlock.linkedHypothesisId)
    blockers.push("Customer Segments block has no linked hypothesis.");

  const uvpContent = canvas["uniqueValueProp"] ?? "";
  const hasQuantified = /\d+%|\d+x|\£|\$|\€|reduction|increase|uplift|saving|faster|cheaper|lower|higher|rate|ratio/.test(uvpContent.toLowerCase());
  if (!uvpContent || !hasQuantified)
    blockers.push("Unique Value Proposition must include a measurable customer outcome.");

  const revBlock = blocks.find((b) => b.blockType === "revenue_streams");
  if (!revBlock || (revBlock.evidenceStatus === "no_evidence" || !revBlock.evidenceStatus))
    blockers.push("Revenue Streams block has no WTP evidence or active WTP experiment.");

  const metricsContent = canvas["keyMetrics"] ?? "";
  const vanityW = detectVanityMetricWarning(metricsContent);
  if (vanityW) blockers.push("Key Metrics contain vanity metrics — replace with actionable metrics.");

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
    const cfg = BLOCK_CONFIG[bt];
    const contentKey = BLOCK_CONTENT_KEY[bt];
    const content = canvas[contentKey] ?? "—";
    const meta = blocks.find((b) => b.blockType === bt);
    const status = meta?.blockStatus ?? "assumption";
    const evid = meta?.evidenceStatus ?? "no_evidence";
    return `### ${cfg.label}\n**Status:** ${status} | **Evidence:** ${evid}\n${content}`;
  };

  const blockSection = BLOCK_TYPES.map(blockLine).join("\n\n");
  const capsSection = caps.length > 0 ? `\n**Score Caps Applied:**\n${caps.map((c) => `- ${c}`).join("\n")}` : "";

  const contradicted = blocks.filter((b) => b.evidenceStatus === "contradicted").length;
  const missing = BLOCK_TYPES.filter((bt) => {
    const val = canvas[BLOCK_CONTENT_KEY[bt]];
    return !val || (val as string).trim().length === 0;
  });

  return `# Lean Canvas Summary — ${venture.name}
**Version:** v${canvas.version ?? 1}${canvas.versionLabel ? ` · ${canvas.versionLabel}` : ""}
**Date:** ${now}
**Overall Status:** ${canvas.overallStatus ?? "draft"}

---

## Scores
- **Canvas Completeness:** ${completenessScore}%
- **Evidence Confidence:** ${evidenceConfidenceScore}%
- **Model Readiness:** ${modelReadinessScore}${capsSection}

---

## Blocks

${blockSection}

---

## Gaps
${missing.length === 0 ? "All blocks completed." : missing.map((bt) => `- ${BLOCK_CONFIG[bt].label} — missing`).join("\n")}
${contradicted > 0 ? `\n**⚠ ${contradicted} block(s) contradicted by evidence — review before advancing stage.**` : ""}

---

*Exported from EcoBLEND IO Venture Validation OS*`;
}
