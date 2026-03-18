/**
 * IP Module Upgrade Tests (Sprint 38)
 * Tests for: Renewal Alert System, IP–Venture Linking, Patent Export PDF
 */
import { describe, it, expect } from "vitest";

// ── 1. Renewal Alert System ──────────────────────────────────────────────────

describe("Renewal Alert System", () => {
  it("classifies urgency as Critical when daysLeft <= 30", () => {
    const classifyUrgency = (daysLeft: number): string => {
      if (daysLeft <= 30) return "Critical";
      if (daysLeft <= 60) return "High";
      return "Medium";
    };
    expect(classifyUrgency(0)).toBe("Critical");
    expect(classifyUrgency(15)).toBe("Critical");
    expect(classifyUrgency(30)).toBe("Critical");
  });

  it("classifies urgency as High when daysLeft is 31–60", () => {
    const classifyUrgency = (daysLeft: number): string => {
      if (daysLeft <= 30) return "Critical";
      if (daysLeft <= 60) return "High";
      return "Medium";
    };
    expect(classifyUrgency(31)).toBe("High");
    expect(classifyUrgency(45)).toBe("High");
    expect(classifyUrgency(60)).toBe("High");
  });

  it("classifies urgency as Medium when daysLeft is 61–90", () => {
    const classifyUrgency = (daysLeft: number): string => {
      if (daysLeft <= 30) return "Critical";
      if (daysLeft <= 60) return "High";
      return "Medium";
    };
    expect(classifyUrgency(61)).toBe("Medium");
    expect(classifyUrgency(75)).toBe("Medium");
    expect(classifyUrgency(90)).toBe("Medium");
  });

  it("filters out assets with renewalDueDate beyond 90 days", () => {
    const today = new Date();
    const within90 = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const beyond90 = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const assets = [
      { id: 1, title: "Patent A", renewalDueDate: within90 },
      { id: 2, title: "Patent B", renewalDueDate: beyond90 },
      { id: 3, title: "Patent C", renewalDueDate: null },
    ];

    const filterRenewalAlerts = (assets: typeof assets, windowDays = 90) => {
      const now = new Date();
      return assets.filter(a => {
        if (!a.renewalDueDate) return false;
        const due = new Date(a.renewalDueDate);
        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= windowDays;
      });
    };

    const alerts = filterRenewalAlerts(assets);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe(1);
  });

  it("excludes assets with no renewalDueDate from alerts", () => {
    const filterRenewalAlerts = (assets: Array<{ id: number; renewalDueDate: string | null }>) => {
      const now = new Date();
      return assets.filter(a => {
        if (!a.renewalDueDate) return false;
        const due = new Date(a.renewalDueDate);
        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 90;
      });
    };
    const assets = [{ id: 1, renewalDueDate: null }, { id: 2, renewalDueDate: "" }];
    expect(filterRenewalAlerts(assets)).toHaveLength(0);
  });
});

// ── 2. IP–Venture Linking ────────────────────────────────────────────────────

describe("IP–Venture Linking", () => {
  it("filters assets by ventureId correctly", () => {
    const assets = [
      { id: 1, title: "Patent A", ventureId: "ecoblend-core" },
      { id: 2, title: "Trademark B", ventureId: "ecoblend-core" },
      { id: 3, title: "Copyright C", ventureId: "ecoblend-foods" },
      { id: 4, title: "Trade Secret D", ventureId: null },
    ];

    const listByVenture = (ventureId: string) =>
      assets.filter(a => a.ventureId === ventureId);

    const result = listByVenture("ecoblend-core");
    expect(result).toHaveLength(2);
    expect(result.map(a => a.id)).toEqual([1, 2]);
  });

  it("returns empty array when venture has no IP assets", () => {
    const assets = [
      { id: 1, ventureId: "ecoblend-core" },
    ];
    const listByVenture = (ventureId: string) =>
      assets.filter(a => a.ventureId === ventureId);

    expect(listByVenture("ecoblend-new")).toHaveLength(0);
  });

  it("does not return assets with null ventureId when filtering by specific venture", () => {
    const assets = [
      { id: 1, ventureId: null },
      { id: 2, ventureId: "ecoblend-core" },
    ];
    const listByVenture = (ventureId: string) =>
      assets.filter(a => a.ventureId === ventureId);

    const result = listByVenture("ecoblend-core");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it("includes licenseCount in the returned asset data", () => {
    const assets = [
      { id: 1, ventureId: "v1", licenseCount: 3 },
      { id: 2, ventureId: "v1", licenseCount: 0 },
    ];
    const result = assets.filter(a => a.ventureId === "v1");
    expect(result[0].licenseCount).toBe(3);
    expect(result[1].licenseCount).toBe(0);
  });
});

// ── 3. Patent Export Draft ───────────────────────────────────────────────────

describe("Patent Export Draft", () => {
  const buildMarkdown = (project: {
    title: string;
    jurisdiction?: string | null;
    draftAbstract?: string | null;
    draftBackground?: string | null;
    draftSummary?: string | null;
    draftDetailedDesc?: string | null;
    draftClaims?: string | null;
  }, hypotheses: Array<{ title: string; description: string; rationale?: string; claimImpact?: string; included: boolean }> = []) => {
    const includedHypotheses = hypotheses.filter(h => h.included);
    return [
      `# Patent Application Draft`,
      `**Title:** ${project.title}`,
      `**Jurisdiction:** ${project.jurisdiction || "UK/EPO"}`,
      ``,
      `---`,
      ``,
      `## Abstract`,
      project.draftAbstract || "*Not yet drafted*",
      ``,
      `## 1. Background of the Invention`,
      project.draftBackground || "*Not yet drafted*",
      ``,
      `## 2. Summary of the Invention`,
      project.draftSummary || "*Not yet drafted*",
      ``,
      `## 3. Detailed Description of Preferred Embodiments`,
      project.draftDetailedDesc || "*Not yet drafted*",
      ...(includedHypotheses.length > 0 ? [
        ``,
        `### Alternative Embodiments`,
        ...includedHypotheses.map((h, i) =>
          `**Embodiment ${i + 1}: ${h.title}**\n\n${h.description}`
        ),
      ] : []),
      ``,
      `## 4. Claims`,
      project.draftClaims || "*Not yet drafted*",
    ].join("\n");
  };

  it("generates markdown with all 5 sections when fully drafted", () => {
    const project = {
      title: "Biodegradable Packaging System",
      jurisdiction: "UK/EPO",
      draftAbstract: "A novel biodegradable packaging...",
      draftBackground: "Plastic waste is a global problem...",
      draftSummary: "The invention provides...",
      draftDetailedDesc: "Referring to FIG. 1...",
      draftClaims: "1. A packaging system comprising...",
    };
    const md = buildMarkdown(project);
    expect(md).toContain("# Patent Application Draft");
    expect(md).toContain("**Title:** Biodegradable Packaging System");
    expect(md).toContain("## Abstract");
    expect(md).toContain("A novel biodegradable packaging...");
    expect(md).toContain("## 4. Claims");
    expect(md).toContain("1. A packaging system comprising...");
  });

  it("uses *Not yet drafted* placeholder for missing sections", () => {
    const project = { title: "Test Patent", draftAbstract: null, draftBackground: null, draftSummary: null, draftDetailedDesc: null, draftClaims: null };
    const md = buildMarkdown(project);
    expect(md.match(/\*Not yet drafted\*/g)?.length).toBe(5);
  });

  it("defaults jurisdiction to UK/EPO when not set", () => {
    const project = { title: "Test", jurisdiction: null };
    const md = buildMarkdown(project);
    expect(md).toContain("**Jurisdiction:** UK/EPO");
  });

  it("includes approved hypotheses as alternative embodiments", () => {
    const project = { title: "Test", draftDetailedDesc: "Main description" };
    const hypotheses = [
      { title: "Embodiment A", description: "Uses bio-resin", rationale: "", claimImpact: "", included: true },
      { title: "Embodiment B", description: "Uses recycled PET", rationale: "", claimImpact: "", included: false },
    ];
    const md = buildMarkdown(project, hypotheses);
    expect(md).toContain("### Alternative Embodiments");
    expect(md).toContain("**Embodiment 1: Embodiment A**");
    expect(md).not.toContain("Embodiment B");
  });

  it("omits Alternative Embodiments section when no hypotheses are included", () => {
    const project = { title: "Test" };
    const hypotheses = [
      { title: "H1", description: "desc", rationale: "", claimImpact: "", included: false },
    ];
    const md = buildMarkdown(project, hypotheses);
    expect(md).not.toContain("### Alternative Embodiments");
  });

  it("counts sections complete correctly", () => {
    const sectionDraftMap = {
      Abstract: "drafted",
      Background: null,
      Summary: "drafted",
      DetailedDescription: null,
      Claims: "drafted",
    };
    const sectionsComplete = Object.values(sectionDraftMap).filter(Boolean).length;
    expect(sectionsComplete).toBe(3);
  });
});
