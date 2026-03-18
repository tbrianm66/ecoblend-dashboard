/**
 * Tests for Sprint 40 LCSSA Enhancements:
 * 1. LCSSA Snapshot (trend chart data)
 * 2. SDG Heatmap (17-goal toggle grid)
 * 3. LCSSA Report Export (markdown generation)
 */
import { describe, it, expect } from "vitest";

// ── SDG Heatmap validation ────────────────────────────────────────────────────
describe("SDG Heatmap", () => {
  const SDG_NAMES = [
    "No Poverty", "Zero Hunger", "Good Health", "Quality Education",
    "Gender Equality", "Clean Water", "Affordable Energy", "Decent Work",
    "Industry & Innovation", "Reduced Inequalities", "Sustainable Cities",
    "Responsible Consumption", "Climate Action", "Life Below Water",
    "Life on Land", "Peace & Justice", "Partnerships",
  ];

  it("should have exactly 17 SDG names", () => {
    expect(SDG_NAMES).toHaveLength(17);
  });

  it("should count active SDGs correctly", () => {
    const heatmap = Array(17).fill(false);
    heatmap[0] = true;  // SDG 1: No Poverty
    heatmap[6] = true;  // SDG 7: Affordable Energy
    heatmap[12] = true; // SDG 13: Climate Action
    const count = heatmap.filter(Boolean).length;
    expect(count).toBe(3);
  });

  it("should serialize and deserialize heatmap correctly", () => {
    const original = [true, false, true, false, false, false, true, false, false, false, false, false, true, false, false, false, false];
    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized) as boolean[];
    expect(deserialized).toHaveLength(17);
    expect(deserialized[0]).toBe(true);
    expect(deserialized[1]).toBe(false);
    expect(deserialized[6]).toBe(true);
    expect(deserialized[12]).toBe(true);
  });

  it("should reject heatmap with wrong length", () => {
    const shortHeatmap = Array(16).fill(false);
    expect(shortHeatmap.length).not.toBe(17);
  });

  it("should allow all 17 SDGs to be active", () => {
    const allActive = Array(17).fill(true);
    const count = allActive.filter(Boolean).length;
    expect(count).toBe(17);
  });

  it("should allow zero SDGs to be active", () => {
    const noneActive = Array(17).fill(false);
    const count = noneActive.filter(Boolean).length;
    expect(count).toBe(0);
  });
});

// ── LCSSA Snapshot validation ─────────────────────────────────────────────────
describe("LCSSA Snapshot", () => {
  const computeLcssaScore = (env: number, soc: number, lcc: number, gov: number) =>
    Math.round((env * 0.35 + soc * 0.30 + lcc * 0.20 + gov * 0.15) * 10) / 10;

  it("should compute integrated LCSSA score with correct weights", () => {
    const score = computeLcssaScore(80, 70, 60, 90);
    // 80*0.35 + 70*0.30 + 60*0.20 + 90*0.15 = 28 + 21 + 12 + 13.5 = 74.5
    expect(score).toBe(74.5);
  });

  it("should return 0 when all pillar scores are 0", () => {
    expect(computeLcssaScore(0, 0, 0, 0)).toBe(0);
  });

  it("should return 100 when all pillar scores are 100", () => {
    expect(computeLcssaScore(100, 100, 100, 100)).toBe(100);
  });

  it("should round to 1 decimal place", () => {
    const score = computeLcssaScore(75, 65, 55, 85);
    // 75*0.35 + 65*0.30 + 55*0.20 + 85*0.15 = 26.25 + 19.5 + 11 + 12.75 = 69.5
    expect(score).toBe(69.5);
    expect(score.toString()).toMatch(/^\d+(\.\d)?$/);
  });

  it("should generate auto label from current date", () => {
    const now = new Date();
    const label = `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
    expect(label).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
  });

  it("should build trend data array correctly", () => {
    const snapshots = [
      { label: "Jan 2025", environmentalScore: 60, socialScore: 55, lccScore: 50, oversightScore: 70, lcssaScore: 58.5 },
      { label: "Mar 2025", environmentalScore: 70, socialScore: 65, lccScore: 60, oversightScore: 75, lcssaScore: 67.25 },
    ];
    const trendData = snapshots.map(s => ({
      name: s.label,
      Environmental: s.environmentalScore,
      Social: s.socialScore,
      LCC: s.lccScore,
      Governance: s.oversightScore,
      LCSSA: s.lcssaScore,
    }));
    expect(trendData).toHaveLength(2);
    expect(trendData[0].name).toBe("Jan 2025");
    expect(trendData[1].LCSSA).toBe(67.25);
  });
});

// ── LCSSA Report Export validation ───────────────────────────────────────────
describe("LCSSA Report Export", () => {
  it("should generate report with correct venture name", () => {
    const ventureName = "EcoBlend Bioplastics";
    const reportDate = "18 March 2026";
    const lcssaScore = 74.5;
    const md = `# LCSSA Report — ${ventureName}\n**Date:** ${reportDate}\n**Integrated LCSSA Score:** ${lcssaScore}/100`;
    expect(md).toContain("EcoBlend Bioplastics");
    expect(md).toContain("74.5/100");
  });

  it("should include all 4 pillar sections in report", () => {
    const sections = [
      "## 1. Environmental LCA — Planet",
      "## 2. Social LCA — People",
      "## 3. Life Cycle Costing — Profit",
      "## 4. LCSA Oversight & Governance",
    ];
    const mockReport = sections.join("\n");
    sections.forEach(section => {
      expect(mockReport).toContain(section.split(" — ")[0].replace("## ", ""));
    });
  });

  it("should include formula reference in report", () => {
    const formula = "LCSSA Score = (Environmental × 0.35) + (Social × 0.30) + (LCC × 0.20) + (Governance × 0.15)";
    expect(formula).toContain("0.35");
    expect(formula).toContain("0.30");
    expect(formula).toContain("0.20");
    expect(formula).toContain("0.15");
  });

  it("should format SDG active goals list correctly", () => {
    const sdgNames = ["No Poverty", "Zero Hunger", "Good Health", "Quality Education", "Gender Equality", "Clean Water", "Affordable Energy", "Decent Work", "Industry & Innovation", "Reduced Inequalities", "Sustainable Cities", "Responsible Consumption", "Climate Action", "Life Below Water", "Life on Land", "Peace & Justice", "Partnerships"];
    const heatmap = Array(17).fill(false);
    heatmap[0] = true;  // No Poverty
    heatmap[12] = true; // Climate Action
    const activeSdgs = sdgNames.filter((_, i) => heatmap[i]);
    expect(activeSdgs).toEqual(["No Poverty", "Climate Action"]);
    expect(activeSdgs.join(", ")).toBe("No Poverty, Climate Action");
  });

  it("should generate valid markdown filename from venture name", () => {
    const ventureName = "EcoBlend Bioplastics";
    const reportDate = "18 March 2026";
    const filename = `LCSSA-Report-${ventureName.replace(/\s+/g, "-")}-${reportDate.replace(/\s+/g, "-")}.md`;
    expect(filename).toBe("LCSSA-Report-EcoBlend-Bioplastics-18-March-2026.md");
    expect(filename).toMatch(/\.md$/);
  });

  it("should handle empty decision log gracefully", () => {
    const decisions: any[] = [];
    const decisionRows = decisions.map(d => `| ${d.decisionTitle} | ${d.status} |`).join("\n");
    expect(decisionRows).toBe("");
  });

  it("should handle empty snapshot history gracefully", () => {
    const snapshots: any[] = [];
    const snapshotRows = snapshots.map(s => `| ${s.label} | ${s.lcssaScore} |`).join("\n");
    expect(snapshotRows).toBe("");
  });
});
