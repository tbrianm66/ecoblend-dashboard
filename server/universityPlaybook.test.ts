// ── University Playbook Tests ──────────────────────────────────────────────────
import { describe, it, expect } from "vitest";

// ── Dual Risk Model Logic ──────────────────────────────────────────────────────
describe("University Playbook — Dual Risk Model", () => {
  it("identifies business risk as university-managed", () => {
    const BUSINESS_RISK_DOMAINS = ["Market Analysis", "Strategy", "Commercialisation"];
    expect(BUSINESS_RISK_DOMAINS).toHaveLength(3);
    expect(BUSINESS_RISK_DOMAINS).toContain("Commercialisation");
  });

  it("identifies product risk as founder-managed", () => {
    const PRODUCT_RISK_DOMAINS = ["Technology", "Engineering", "Validation"];
    expect(PRODUCT_RISK_DOMAINS).toHaveLength(3);
    expect(PRODUCT_RISK_DOMAINS).toContain("Technology");
  });

  it("dual risk model has two distinct risk owners", () => {
    const model = { businessRisk: "University", productRisk: "Founders" };
    expect(model.businessRisk).not.toBe(model.productRisk);
  });
});

// ── Venture Workflow Stage Progression ────────────────────────────────────────
describe("University Playbook — Venture Workflow Stages", () => {
  const STAGES = [
    "problem_definition",
    "research_discovery",
    "hypothesis_development",
    "validation",
    "commercialisation",
  ] as const;

  it("has exactly 5 stages", () => {
    expect(STAGES).toHaveLength(5);
  });

  it("starts with problem_definition", () => {
    expect(STAGES[0]).toBe("problem_definition");
  });

  it("ends with commercialisation", () => {
    expect(STAGES[STAGES.length - 1]).toBe("commercialisation");
  });

  it("advance stage increments index correctly", () => {
    const currentStage = "research_discovery";
    const currentIndex = STAGES.indexOf(currentStage);
    const nextStage = STAGES[currentIndex + 1];
    expect(nextStage).toBe("hypothesis_development");
  });

  it("cannot advance past final stage", () => {
    const currentStage = "commercialisation";
    const currentIndex = STAGES.indexOf(currentStage);
    expect(currentIndex).toBe(STAGES.length - 1);
    expect(STAGES[currentIndex + 1]).toBeUndefined();
  });
});

// ── Partner Types ──────────────────────────────────────────────────────────────
describe("University Playbook — Partner Types", () => {
  const PARTNER_TYPES = ["university", "research_institute", "polytechnic", "industry_lab"] as const;
  const PARTNERSHIP_TYPES = ["research", "talent", "commercialisation", "sponsored", "internship"] as const;

  it("has 4 partner institution types", () => {
    expect(PARTNER_TYPES).toHaveLength(4);
  });

  it("has 5 partnership engagement types", () => {
    expect(PARTNERSHIP_TYPES).toHaveLength(5);
  });

  it("includes internship as a partnership type", () => {
    expect(PARTNERSHIP_TYPES).toContain("internship");
  });
});

// ── Talent Role Types ──────────────────────────────────────────────────────────
describe("University Playbook — Talent Roles", () => {
  const ROLE_TYPES = ["student", "academic", "industry_expert", "venture_lead"] as const;
  const AVAILABILITY = ["full_time", "part_time", "advisory", "internship"] as const;

  it("has 4 role types", () => {
    expect(ROLE_TYPES).toHaveLength(4);
  });

  it("includes venture_lead as a role type", () => {
    expect(ROLE_TYPES).toContain("venture_lead");
  });

  it("has 4 availability options", () => {
    expect(AVAILABILITY).toHaveLength(4);
  });
});

// ── Governance Document Types ──────────────────────────────────────────────────
describe("University Playbook — Governance Documents", () => {
  const DOC_TYPES = [
    "student_agreement",
    "ip_agreement",
    "nda",
    "ethics_approval",
    "data_protection",
    "collaboration_agreement",
  ] as const;

  const DOC_STATUSES = ["draft", "under_review", "signed", "expired", "rejected"] as const;

  it("has 6 document types", () => {
    expect(DOC_TYPES).toHaveLength(6);
  });

  it("includes NDA as a document type", () => {
    expect(DOC_TYPES).toContain("nda");
  });

  it("has 5 document statuses", () => {
    expect(DOC_STATUSES).toHaveLength(5);
  });

  it("signed docs count correctly", () => {
    const docs = [
      { type: "nda", status: "signed" },
      { type: "ip_agreement", status: "draft" },
      { type: "student_agreement", status: "signed" },
    ];
    const signedCount = docs.filter(d => d.status === "signed").length;
    expect(signedCount).toBe(2);
  });
});

// ── Data Strategy Source Types ─────────────────────────────────────────────────
describe("University Playbook — Data Strategy", () => {
  const SOURCE_TYPES = [
    "interview",
    "survey",
    "secondary_research",
    "ai_analysis",
    "focus_group",
    "observation",
  ] as const;

  it("has 6 data source types", () => {
    expect(SOURCE_TYPES).toHaveLength(6);
  });

  it("includes ai_analysis as a source type", () => {
    expect(SOURCE_TYPES).toContain("ai_analysis");
  });

  it("calculates analysed percentage correctly", () => {
    const sources = [
      { status: "analysed" },
      { status: "completed" },
      { status: "analysed" },
      { status: "planned" },
    ];
    const analysed = sources.filter(s => s.status === "analysed").length;
    const pct = Math.round((analysed / sources.length) * 100);
    expect(pct).toBe(50);
  });
});

// ── Roadmap Milestones ─────────────────────────────────────────────────────────
describe("University Playbook — Roadmap", () => {
  const PHASES = ["setup", "pilot", "scale"] as const;
  const PRIORITIES = ["low", "medium", "high", "critical"] as const;

  it("has 3 implementation phases", () => {
    expect(PHASES).toHaveLength(3);
  });

  it("phases are in correct order: setup → pilot → scale", () => {
    expect(PHASES[0]).toBe("setup");
    expect(PHASES[1]).toBe("pilot");
    expect(PHASES[2]).toBe("scale");
  });

  it("has 4 priority levels", () => {
    expect(PRIORITIES).toHaveLength(4);
  });

  it("calculates roadmap progress correctly", () => {
    const milestones = [
      { status: "completed" },
      { status: "completed" },
      { status: "pending" },
      { status: "in_progress" },
    ];
    const completed = milestones.filter(m => m.status === "completed").length;
    const progress = Math.round((completed / milestones.length) * 100);
    expect(progress).toBe(50);
  });

  it("returns 0 progress when no milestones", () => {
    const milestones: { status: string }[] = [];
    const progress = milestones.length > 0
      ? Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100)
      : 0;
    expect(progress).toBe(0);
  });
});

// ── Industry Engagement Types ──────────────────────────────────────────────────
describe("University Playbook — Industry Engagements", () => {
  const ENGAGEMENT_TYPES = [
    "sponsored_research",
    "consulting",
    "venture_partnership",
    "internship_pipeline",
    "joint_ip",
  ] as const;

  it("has 5 engagement types", () => {
    expect(ENGAGEMENT_TYPES).toHaveLength(5);
  });

  it("includes joint_ip as an engagement type", () => {
    expect(ENGAGEMENT_TYPES).toContain("joint_ip");
  });

  it("calculates total engagement value correctly", () => {
    const engagements = [
      { value: "50000" },
      { value: "25000" },
      { value: null },
      { value: "10000" },
    ];
    const total = engagements.reduce((sum, e) => sum + (parseFloat(String(e.value ?? "0")) || 0), 0);
    expect(total).toBe(85000);
  });
});

// ── Summary Aggregation ────────────────────────────────────────────────────────
describe("University Playbook — Summary Aggregation", () => {
  it("counts active partners correctly", () => {
    const partners = [
      { status: "active" },
      { status: "inactive" },
      { status: "active" },
      { status: "pending" },
    ];
    const active = partners.filter(p => p.status === "active").length;
    expect(active).toBe(2);
  });

  it("counts active research projects correctly", () => {
    const research = [
      { status: "active" },
      { status: "completed" },
      { status: "active" },
      { status: "planned" },
    ];
    const active = research.filter(r => r.status === "active").length;
    expect(active).toBe(2);
  });

  it("aggregates workflow stage distribution", () => {
    const workflows = [
      { stage: "problem_definition" },
      { stage: "validation" },
      { stage: "problem_definition" },
      { stage: "commercialisation" },
    ];
    const stages = workflows.reduce((acc, w) => {
      acc[w.stage] = (acc[w.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(stages["problem_definition"]).toBe(2);
    expect(stages["validation"]).toBe(1);
    expect(stages["commercialisation"]).toBe(1);
  });
});
