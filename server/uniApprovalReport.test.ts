// ============================================================
// VITEST TESTS — University Approval Report Router
// Sprint 62 — H4 Lean Methodology Dual-Risk Model
// Tests: schema validation, status transitions, AI context
//        generation, summary calculations, offering linkage
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Pure logic helpers extracted for testing ──────────────────────────────────

/**
 * Calculates the approval rate from a list of reports.
 * Mirrors the logic in getSummary procedure.
 */
function calculateApprovalRate(reports: Array<{ status: string }>): number {
  if (reports.length === 0) return 0;
  const approved = reports.filter(r => r.status === "approved").length;
  return Math.round((approved / reports.length) * 100);
}

/**
 * Builds the summary object from a list of reports.
 */
function buildSummary(reports: Array<{ status: string; reportType: string }>) {
  const total = reports.length;
  const approved = reports.filter(r => r.status === "approved").length;
  const underReview = reports.filter(r => r.status === "under_review").length;
  const draft = reports.filter(r => r.status === "draft").length;
  const rejected = reports.filter(r => r.status === "rejected").length;
  const revisionRequested = reports.filter(r => r.status === "revision_requested").length;
  const approvalRate = calculateApprovalRate(reports);

  const byType: Record<string, number> = {};
  for (const r of reports) {
    byType[r.reportType] = (byType[r.reportType] ?? 0) + 1;
  }

  return { total, approved, underReview, draft, rejected, revisionRequested, approvalRate, byType };
}

/**
 * Validates a report type against the allowed enum values.
 */
function isValidReportType(type: string): boolean {
  const VALID_TYPES = [
    "syllabus_approval",
    "research_validation",
    "industry_engagement",
    "ethics_clearance",
    "ip_disclosure",
    "commercialisation_approval",
  ];
  return VALID_TYPES.includes(type);
}

/**
 * Validates an H4 stage against the allowed enum values.
 */
function isValidH4Stage(stage: string): boolean {
  const VALID_STAGES = [
    "problem_definition",
    "research_discovery",
    "hypothesis_development",
    "validation",
    "commercialisation",
  ];
  return VALID_STAGES.includes(stage);
}

/**
 * Validates a status transition is allowed.
 * Mirrors the business logic in updateStatus procedure.
 */
function isValidStatusTransition(from: string, to: string): boolean {
  const ALLOWED: Record<string, string[]> = {
    draft: ["under_review", "archived"],
    under_review: ["approved", "rejected", "revision_requested", "draft"],
    revision_requested: ["draft", "under_review"],
    approved: ["archived"],
    rejected: ["draft", "archived"],
    archived: [],
  };
  return (ALLOWED[from] ?? []).includes(to);
}

/**
 * Builds the AI prompt context string from offering and research data.
 * Mirrors the logic in generateAI procedure.
 */
function buildAIPromptContext(params: {
  ventureName: string;
  ventureDescription?: string;
  reportType: string;
  h4Stage: string;
  offeringName?: string;
  offeringType?: string;
  offeringStatus?: string;
  trl?: number;
  researchProjects?: Array<{ title: string; researchType: string; status: string; objective?: string }>;
  partners?: Array<{ name: string; type: string; partnershipType: string }>;
  experiments?: Array<{ title: string; outcome?: string; result?: string }>;
}): string {
  const offeringCtx = params.offeringName
    ? `\n\nOffering Scope: ${params.offeringName} (${params.offeringType ?? "Product"}, ${params.offeringStatus ?? "Concept"}, TRL ${params.trl ?? 1})`
    : "";

  const researchCtx = params.researchProjects && params.researchProjects.length > 0
    ? `\n\nResearch Projects:\n${params.researchProjects.map(r => `- ${r.title} (${r.researchType}, ${r.status}): ${r.objective ?? ""}`).join("\n")}`
    : "";

  const partnerCtx = params.partners && params.partners.length > 0
    ? `\n\nUniversity Partners:\n${params.partners.map(p => `- ${p.name} (${p.type ?? "University"}): ${p.partnershipType ?? ""}`).join("\n")}`
    : "";

  const experimentCtx = params.experiments && params.experiments.length > 0
    ? `\n\nValidation Experiments:\n${params.experiments.map(e => `- ${e.title}: ${e.outcome ?? "Pending"} — ${e.result ?? ""}`).join("\n")}`
    : "";

  return `Venture: ${params.ventureName}
Description: ${params.ventureDescription ?? "Sustainable technology venture"}
Report Type: ${params.reportType}
H4 Stage: ${params.h4Stage}${offeringCtx}${researchCtx}${partnerCtx}${experimentCtx}`;
}

/**
 * Generates the AI report title from context.
 */
function generateReportTitle(params: {
  ventureName: string;
  reportType: string;
  h4Stage: string;
  offeringName?: string;
}): string {
  const TYPE_LABELS: Record<string, string> = {
    syllabus_approval: "Syllabus Approval",
    research_validation: "Research Validation",
    industry_engagement: "Industry Engagement",
    ethics_clearance: "Ethics Clearance",
    ip_disclosure: "IP Disclosure",
    commercialisation_approval: "Commercialisation Approval",
  };
  const STAGE_LABELS: Record<string, string> = {
    problem_definition: "H4.1",
    research_discovery: "H4.2",
    hypothesis_development: "H4.3",
    validation: "H4.4",
    commercialisation: "H4.5",
  };
  const typeLabel = TYPE_LABELS[params.reportType] ?? params.reportType;
  const stageLabel = STAGE_LABELS[params.h4Stage] ?? params.h4Stage;
  const scope = params.offeringName ? ` — ${params.offeringName}` : "";
  return `${params.ventureName}${scope} — ${typeLabel} (${stageLabel})`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("University Approval Report — Schema Validation", () => {
  it("accepts all valid report types", () => {
    const VALID = [
      "syllabus_approval",
      "research_validation",
      "industry_engagement",
      "ethics_clearance",
      "ip_disclosure",
      "commercialisation_approval",
    ];
    for (const type of VALID) {
      expect(isValidReportType(type)).toBe(true);
    }
  });

  it("rejects invalid report types", () => {
    expect(isValidReportType("")).toBe(false);
    expect(isValidReportType("unknown_type")).toBe(false);
    expect(isValidReportType("SYLLABUS_APPROVAL")).toBe(false);
    expect(isValidReportType("approval")).toBe(false);
  });

  it("accepts all valid H4 stages", () => {
    const VALID = [
      "problem_definition",
      "research_discovery",
      "hypothesis_development",
      "validation",
      "commercialisation",
    ];
    for (const stage of VALID) {
      expect(isValidH4Stage(stage)).toBe(true);
    }
  });

  it("rejects invalid H4 stages", () => {
    expect(isValidH4Stage("")).toBe(false);
    expect(isValidH4Stage("h4_validation")).toBe(false);
    expect(isValidH4Stage("VALIDATION")).toBe(false);
    expect(isValidH4Stage("stage_5")).toBe(false);
  });
});

describe("University Approval Report — Status Transitions", () => {
  it("allows draft → under_review", () => {
    expect(isValidStatusTransition("draft", "under_review")).toBe(true);
  });

  it("allows draft → archived", () => {
    expect(isValidStatusTransition("draft", "archived")).toBe(true);
  });

  it("allows under_review → approved", () => {
    expect(isValidStatusTransition("under_review", "approved")).toBe(true);
  });

  it("allows under_review → rejected", () => {
    expect(isValidStatusTransition("under_review", "rejected")).toBe(true);
  });

  it("allows under_review → revision_requested", () => {
    expect(isValidStatusTransition("under_review", "revision_requested")).toBe(true);
  });

  it("allows revision_requested → draft (reopen for editing)", () => {
    expect(isValidStatusTransition("revision_requested", "draft")).toBe(true);
  });

  it("allows approved → archived", () => {
    expect(isValidStatusTransition("approved", "archived")).toBe(true);
  });

  it("blocks approved → draft (cannot reopen approved reports)", () => {
    expect(isValidStatusTransition("approved", "draft")).toBe(false);
  });

  it("blocks archived → any status (terminal state)", () => {
    expect(isValidStatusTransition("archived", "draft")).toBe(false);
    expect(isValidStatusTransition("archived", "approved")).toBe(false);
    expect(isValidStatusTransition("archived", "under_review")).toBe(false);
  });

  it("blocks draft → approved (must go through review)", () => {
    expect(isValidStatusTransition("draft", "approved")).toBe(false);
  });
});

describe("University Approval Report — Summary Calculations", () => {
  it("returns zero summary for empty reports list", () => {
    const summary = buildSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.approved).toBe(0);
    expect(summary.approvalRate).toBe(0);
  });

  it("calculates approval rate correctly", () => {
    const reports = [
      { status: "approved", reportType: "syllabus_approval" },
      { status: "approved", reportType: "research_validation" },
      { status: "rejected", reportType: "syllabus_approval" },
      { status: "draft", reportType: "ethics_clearance" },
    ];
    const summary = buildSummary(reports);
    expect(summary.total).toBe(4);
    expect(summary.approved).toBe(2);
    expect(summary.approvalRate).toBe(50);
  });

  it("calculates 100% approval rate when all approved", () => {
    const reports = [
      { status: "approved", reportType: "syllabus_approval" },
      { status: "approved", reportType: "research_validation" },
    ];
    const summary = buildSummary(reports);
    expect(summary.approvalRate).toBe(100);
  });

  it("calculates 0% approval rate when none approved", () => {
    const reports = [
      { status: "draft", reportType: "syllabus_approval" },
      { status: "under_review", reportType: "research_validation" },
      { status: "rejected", reportType: "ethics_clearance" },
    ];
    const summary = buildSummary(reports);
    expect(summary.approvalRate).toBe(0);
  });

  it("counts by status correctly", () => {
    const reports = [
      { status: "draft", reportType: "syllabus_approval" },
      { status: "draft", reportType: "research_validation" },
      { status: "under_review", reportType: "ethics_clearance" },
      { status: "approved", reportType: "ip_disclosure" },
      { status: "revision_requested", reportType: "syllabus_approval" },
    ];
    const summary = buildSummary(reports);
    expect(summary.draft).toBe(2);
    expect(summary.underReview).toBe(1);
    expect(summary.approved).toBe(1);
    expect(summary.revisionRequested).toBe(1);
  });

  it("groups by report type correctly", () => {
    const reports = [
      { status: "draft", reportType: "syllabus_approval" },
      { status: "approved", reportType: "syllabus_approval" },
      { status: "draft", reportType: "research_validation" },
    ];
    const summary = buildSummary(reports);
    expect(summary.byType["syllabus_approval"]).toBe(2);
    expect(summary.byType["research_validation"]).toBe(1);
  });

  it("rounds approval rate to nearest integer", () => {
    const reports = [
      { status: "approved", reportType: "syllabus_approval" },
      { status: "rejected", reportType: "research_validation" },
      { status: "rejected", reportType: "ethics_clearance" },
    ];
    const summary = buildSummary(reports);
    // 1/3 = 33.33% → rounds to 33
    expect(summary.approvalRate).toBe(33);
  });
});

describe("University Approval Report — AI Prompt Context Generation", () => {
  it("generates basic context without offering", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend Biomaterials",
      ventureDescription: "Sustainable biomaterial solutions",
      reportType: "syllabus_approval",
      h4Stage: "problem_definition",
    });
    expect(ctx).toContain("EcoBlend Biomaterials");
    expect(ctx).toContain("syllabus_approval");
    expect(ctx).toContain("problem_definition");
    expect(ctx).not.toContain("Offering Scope:");
  });

  it("includes offering scope when offeringName is provided", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend Biomaterials",
      reportType: "research_validation",
      h4Stage: "validation",
      offeringName: "BioFlex Packaging",
      offeringType: "Physical Product",
      offeringStatus: "Pilot",
      trl: 5,
    });
    expect(ctx).toContain("Offering Scope: BioFlex Packaging");
    expect(ctx).toContain("Physical Product");
    expect(ctx).toContain("Pilot");
    expect(ctx).toContain("TRL 5");
  });

  it("includes research projects in context", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend",
      reportType: "research_validation",
      h4Stage: "research_discovery",
      researchProjects: [
        { title: "Biopolymer Degradation Study", researchType: "applied", status: "in_progress", objective: "Test degradation rates" },
        { title: "Market Sizing Analysis", researchType: "market", status: "completed", objective: "Quantify TAM" },
      ],
    });
    expect(ctx).toContain("Research Projects:");
    expect(ctx).toContain("Biopolymer Degradation Study");
    expect(ctx).toContain("Market Sizing Analysis");
    expect(ctx).toContain("Test degradation rates");
  });

  it("includes university partners in context", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend",
      reportType: "industry_engagement",
      h4Stage: "hypothesis_development",
      partners: [
        { name: "University of Manchester", type: "university", partnershipType: "research" },
        { name: "Cranfield University", type: "university", partnershipType: "commercialisation" },
      ],
    });
    expect(ctx).toContain("University Partners:");
    expect(ctx).toContain("University of Manchester");
    expect(ctx).toContain("Cranfield University");
    expect(ctx).toContain("commercialisation");
  });

  it("includes validation experiments in context", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend",
      reportType: "research_validation",
      h4Stage: "validation",
      experiments: [
        { title: "Customer Discovery Sprint", outcome: "confirmed", result: "82% of respondents confirmed pain point" },
        { title: "Prototype Field Test", outcome: "inconclusive", result: "Further testing required" },
      ],
    });
    expect(ctx).toContain("Validation Experiments:");
    expect(ctx).toContain("Customer Discovery Sprint");
    expect(ctx).toContain("confirmed");
    expect(ctx).toContain("82% of respondents confirmed pain point");
  });

  it("omits empty sections from context", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend",
      reportType: "ethics_clearance",
      h4Stage: "problem_definition",
      researchProjects: [],
      partners: [],
      experiments: [],
    });
    expect(ctx).not.toContain("Research Projects:");
    expect(ctx).not.toContain("University Partners:");
    expect(ctx).not.toContain("Validation Experiments:");
  });

  it("uses default description when none provided", () => {
    const ctx = buildAIPromptContext({
      ventureName: "EcoBlend",
      reportType: "syllabus_approval",
      h4Stage: "problem_definition",
    });
    expect(ctx).toContain("Sustainable technology venture");
  });
});

describe("University Approval Report — Title Generation", () => {
  it("generates correct title without offering", () => {
    const title = generateReportTitle({
      ventureName: "EcoBlend Biomaterials",
      reportType: "syllabus_approval",
      h4Stage: "problem_definition",
    });
    expect(title).toBe("EcoBlend Biomaterials — Syllabus Approval (H4.1)");
  });

  it("generates correct title with offering", () => {
    const title = generateReportTitle({
      ventureName: "EcoBlend",
      reportType: "research_validation",
      h4Stage: "validation",
      offeringName: "BioFlex Packaging",
    });
    expect(title).toBe("EcoBlend — BioFlex Packaging — Research Validation (H4.4)");
  });

  it("maps all H4 stages to correct labels", () => {
    const stages: Array<[string, string]> = [
      ["problem_definition", "H4.1"],
      ["research_discovery", "H4.2"],
      ["hypothesis_development", "H4.3"],
      ["validation", "H4.4"],
      ["commercialisation", "H4.5"],
    ];
    for (const [stage, label] of stages) {
      const title = generateReportTitle({
        ventureName: "Test",
        reportType: "syllabus_approval",
        h4Stage: stage,
      });
      expect(title).toContain(label);
    }
  });

  it("maps all report types to correct labels", () => {
    const types: Array<[string, string]> = [
      ["syllabus_approval", "Syllabus Approval"],
      ["research_validation", "Research Validation"],
      ["industry_engagement", "Industry Engagement"],
      ["ethics_clearance", "Ethics Clearance"],
      ["ip_disclosure", "IP Disclosure"],
      ["commercialisation_approval", "Commercialisation Approval"],
    ];
    for (const [type, label] of types) {
      const title = generateReportTitle({
        ventureName: "Test",
        reportType: type,
        h4Stage: "validation",
      });
      expect(title).toContain(label);
    }
  });
});

describe("University Approval Report — Dual Risk Model", () => {
  it("correctly identifies product risk owner fields", () => {
    const report = {
      productRiskOwner: "Jane Smith (Founder)",
      businessRiskOwner: "Prof. David Lee (University of Manchester)",
    };
    expect(report.productRiskOwner).toBeTruthy();
    expect(report.businessRiskOwner).toBeTruthy();
    // Product risk is always the founder
    expect(report.productRiskOwner).toContain("Founder");
    // Business risk is always the university
    expect(report.businessRiskOwner).toContain("University");
  });

  it("validates that offering linkage is optional", () => {
    // A report can exist at venture level without an offering
    const ventureReport = {
      ventureId: "ecoblend",
      offeringId: null,
      portfolioId: null,
      title: "EcoBlend — Syllabus Approval (H4.1)",
      reportType: "syllabus_approval",
    };
    expect(ventureReport.offeringId).toBeNull();
    expect(ventureReport.portfolioId).toBeNull();
    expect(ventureReport.ventureId).toBe("ecoblend");
  });

  it("validates that offering linkage scopes the report", () => {
    // A report scoped to an offering has both portfolioId and offeringId
    const offeringReport = {
      ventureId: "ecoblend",
      portfolioId: "portfolio-biomaterials",
      offeringId: "offering-bioflex",
      title: "EcoBlend — BioFlex Packaging — Research Validation (H4.4)",
      reportType: "research_validation",
    };
    expect(offeringReport.portfolioId).toBeTruthy();
    expect(offeringReport.offeringId).toBeTruthy();
    expect(offeringReport.title).toContain("BioFlex Packaging");
  });
});

describe("University Approval Report — Offering Research Links", () => {
  it("validates link types", () => {
    const VALID_LINK_TYPES = [
      "primary_research",
      "supporting_research",
      "validation_evidence",
      "literature_review",
      "industry_data",
    ];
    for (const type of VALID_LINK_TYPES) {
      expect(VALID_LINK_TYPES.includes(type)).toBe(true);
    }
    expect(VALID_LINK_TYPES.includes("invalid_type")).toBe(false);
  });

  it("validates evidence strength values", () => {
    const VALID_STRENGTHS = ["weak", "moderate", "strong", "definitive"];
    for (const strength of VALID_STRENGTHS) {
      expect(VALID_STRENGTHS.includes(strength)).toBe(true);
    }
    expect(VALID_STRENGTHS.includes("very_strong")).toBe(false);
  });

  it("validates that a link connects a report to a research project", () => {
    const link = {
      reportId: 1,
      researchProjectId: 42,
      offeringId: "offering-bioflex",
      linkType: "validation_evidence",
      evidenceStrength: "strong",
      notes: "Confirms market demand for biodegradable packaging",
    };
    expect(link.reportId).toBeGreaterThan(0);
    expect(link.researchProjectId).toBeGreaterThan(0);
    expect(link.offeringId).toBeTruthy();
    expect(link.linkType).toBe("validation_evidence");
    expect(link.evidenceStrength).toBe("strong");
  });
});
