/**
 * Unit tests for the updated portfolio data structure and PR module logic.
 * Validates brand identities, PIPE venture, and PR data schemas.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Portfolio Brand Schema ────────────────────────────────────────────────────
const ventureSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  sector: z.string(),
  channel: z.enum(["B2B", "D2C", "B2B2C"]),
  status: z.enum(["Active", "Pre-Launch", "Scaling", "Paused"]),
  vrl: z.number().min(1).max(4),
  vrlPercent: z.number().min(0).max(100),
  trl: z.number().min(1).max(9),
  trlPercent: z.number().min(0).max(100),
  nominatedCharity: z.string(),
  charityFocus: z.string(),
  founder: z.string(),
  color: z.string(),
  investmentReady: z.boolean(),
  description: z.string(),
  bmc: z.string(),
  mmc: z.string(),
  isInternalLab: z.boolean().optional(),
});

// ── PR Module Schemas ─────────────────────────────────────────────────────────
const pressReleaseSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  title: z.string(),
  summary: z.string(),
  status: z.enum(["Draft", "Scheduled", "Published", "Archived"]),
  date: z.string(),
  outlet: z.string().optional(),
  url: z.string().optional(),
});

const newsletterSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  subject: z.string(),
  preview: z.string(),
  status: z.enum(["Draft", "Scheduled", "Sent"]),
  scheduledDate: z.string(),
  openRate: z.number().optional(),
  clickRate: z.number().optional(),
  recipients: z.number().optional(),
});

const mediaCoverageSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  headline: z.string(),
  outlet: z.string(),
  type: z.enum(["Article", "Interview", "Podcast", "Video", "Social", "Press Mention"]),
  date: z.string(),
  url: z.string().optional(),
  sentiment: z.enum(["Positive", "Neutral", "Negative"]),
});

// ── Simulated portfolio data matching data.ts ─────────────────────────────────
const mockVentures = [
  { id: "ecoblend-rd", name: "EcoRace", tagline: "Central IP & Technology Engine", sector: "Deep Tech", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 75, trl: 4, trlPercent: 60, nominatedCharity: "EcoRace Foundation", charityFocus: "Vulnerable children", founder: "Internal", color: "#51AF37", investmentReady: false, description: "Internal lab", bmc: "IP licensing", mmc: "Tech access", isInternalLab: true },
  { id: "ecoblend", name: "EcoComp", tagline: "Advanced Materials Formulation & Distribution", sector: "Materials Science", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 60, trl: 4, trlPercent: 70, nominatedCharity: "EcoRace Foundation", charityFocus: "Sustainable materials", founder: "TBC", color: "#51AF37", investmentReady: false, description: "Materials brand", bmc: "Supply agreements", mmc: "Circular economy" },
  { id: "bebus", name: "BEBUS", tagline: "Eco-Transport Solutions", sector: "Transport", channel: "B2B", status: "Active", vrl: 2, vrlPercent: 40, trl: 3, trlPercent: 80, nominatedCharity: "Clean Mobility", charityFocus: "Transport access", founder: "TBC", color: "#3A97D3", investmentReady: false, description: "Transport brand", bmc: "OEM supply", mmc: "Clean mobility" },
  { id: "tone", name: "TONE", tagline: "Eco-Creative Industry Brand", sector: "Creative Industries", channel: "D2C", status: "Active", vrl: 1, vrlPercent: 90, trl: 2, trlPercent: 50, nominatedCharity: "Arts Access", charityFocus: "Arts inclusion", founder: "TBC", color: "#F49C13", investmentReady: false, description: "Creative brand", bmc: "D2C sales", mmc: "Arts access" },
  { id: "real", name: "REAL", tagline: "Sports Protection — F1 Science for the Person", sector: "Sports Protection", channel: "D2C", status: "Pre-Launch", vrl: 1, vrlPercent: 55, trl: 2, trlPercent: 20, nominatedCharity: "Sport for All", charityFocus: "Youth sport", founder: "TBC", color: "#ef4444", investmentReady: false, description: "Sports protection brand", bmc: "D2C sales", mmc: "Youth sport" },
  { id: "pipe", name: "PIPE", tagline: "Eco-Water Sport & Performance Brand", sector: "Water Sports", channel: "D2C", status: "Pre-Launch", vrl: 1, vrlPercent: 30, trl: 1, trlPercent: 70, nominatedCharity: "Ocean Conservation Trust", charityFocus: "Ocean health", founder: "TBC", color: "#0ea5e9", investmentReady: false, description: "Water sport brand", bmc: "D2C sales", mmc: "Ocean health" },
];

describe("Portfolio Brand Structure", () => {
  it("validates all ventures against the schema", () => {
    for (const v of mockVentures) {
      expect(() => ventureSchema.parse(v)).not.toThrow();
    }
  });

  it("has exactly one internal lab", () => {
    const labs = mockVentures.filter(v => v.isInternalLab);
    expect(labs).toHaveLength(1);
    expect(labs[0].id).toBe("ecoblend-rd");
  });

  it("has exactly 5 portfolio brands (excluding internal lab)", () => {
    const brands = mockVentures.filter(v => !v.isInternalLab);
    expect(brands).toHaveLength(5);
  });

  it("includes PIPE as a new portfolio brand", () => {
    const pipe = mockVentures.find(v => v.id === "pipe");
    expect(pipe).toBeDefined();
    expect(pipe!.name).toBe("PIPE");
    expect(pipe!.sector).toBe("Water Sports");
    expect(pipe!.channel).toBe("D2C");
    expect(pipe!.color).toBe("#0ea5e9");
  });

  it("EcoComp is a materials formulation brand, not the internal lab", () => {
    const ecoblend = mockVentures.find(v => v.id === "ecoblend");
    expect(ecoblend).toBeDefined();
    expect(ecoblend!.isInternalLab).toBeUndefined();
    expect(ecoblend!.tagline).toContain("Materials");
  });

  it("TONE is an eco-creative industry brand", () => {
    const tone = mockVentures.find(v => v.id === "tone");
    expect(tone).toBeDefined();
    expect(tone!.tagline).toContain("Creative");
    expect(tone!.sector).toContain("Creative");
  });

  it("REAL uses F1 science for sports protection", () => {
    const real = mockVentures.find(v => v.id === "real");
    expect(real).toBeDefined();
    expect(real!.tagline).toContain("F1");
    expect(real!.sector).toContain("Sports Protection");
  });

  it("portfolio stats exclude the internal lab", () => {
    const brands = mockVentures.filter(v => !v.isInternalLab);
    const avgVrl = brands.reduce((a, v) => a + v.vrl, 0) / brands.length;
    expect(avgVrl).toBeGreaterThan(0);
    expect(brands.length).toBe(5);
  });

  it("investment readiness requires VRL 3+ and TRL 6+", () => {
    const brands = mockVentures.filter(v => !v.isInternalLab);
    for (const v of brands) {
      const shouldBeReady = v.vrl >= 3 && v.trl >= 6;
      expect(v.investmentReady).toBe(shouldBeReady);
    }
  });
});

describe("PR Module — Press Release Schema", () => {
  it("validates a valid press release", () => {
    const pr = {
      id: "pr1", brandId: "ecoblend",
      title: "EcoComp Launches Bio-Composite Range",
      summary: "EcoComp announces its first commercial material range.",
      status: "Draft", date: "2026-04-15",
    };
    expect(() => pressReleaseSchema.parse(pr)).not.toThrow();
  });

  it("validates a press release with optional outlet and url", () => {
    const pr = {
      id: "pr2", brandId: "real",
      title: "REAL Applies F1 Science to Sports Protection",
      summary: "REAL reveals its founding vision.",
      status: "Published", date: "2026-05-01",
      outlet: "Sports Tech World", url: "https://sportstechworld.com/real",
    };
    expect(() => pressReleaseSchema.parse(pr)).not.toThrow();
  });

  it("rejects invalid PR status", () => {
    const pr = { id: "pr3", brandId: "tone", title: "Test", summary: "Test", status: "Live", date: "2026-04-01" };
    expect(() => pressReleaseSchema.parse(pr)).toThrow();
  });
});

describe("PR Module — Newsletter Schema", () => {
  it("validates a valid newsletter campaign", () => {
    const nl = {
      id: "nl1", brandId: "ecoblend",
      subject: "EcoComp Materials Bulletin Q1 2026",
      preview: "Our first formulation portfolio is ready...",
      status: "Draft", scheduledDate: "2026-04-01",
    };
    expect(() => newsletterSchema.parse(nl)).not.toThrow();
  });

  it("validates a sent newsletter with metrics", () => {
    const nl = {
      id: "nl2", brandId: "tone",
      subject: "TONE Launch Newsletter",
      preview: "The eco-creative revolution starts here...",
      status: "Sent", scheduledDate: "2026-05-20",
      openRate: 42.5, clickRate: 8.3, recipients: 1200,
    };
    expect(() => newsletterSchema.parse(nl)).not.toThrow();
  });

  it("rejects invalid newsletter status", () => {
    const nl = { id: "nl3", brandId: "pipe", subject: "Test", preview: "Test", status: "Queued", scheduledDate: "2026-06-01" };
    expect(() => newsletterSchema.parse(nl)).toThrow();
  });
});

describe("PR Module — Media Coverage Schema", () => {
  it("validates a valid media coverage entry", () => {
    const mc = {
      id: "mc1", brandId: "ecoblend",
      headline: "EcoRace Studio Enters Materials Science",
      outlet: "GreenBiz", type: "Article", date: "2026-03-01",
      sentiment: "Positive",
    };
    expect(() => mediaCoverageSchema.parse(mc)).not.toThrow();
  });

  it("validates all media types", () => {
    const types = ["Article", "Interview", "Podcast", "Video", "Social", "Press Mention"];
    for (const type of types) {
      const mc = { id: "mc", brandId: "real", headline: "Test", outlet: "Test", type, date: "2026-01-01", sentiment: "Neutral" };
      expect(() => mediaCoverageSchema.parse(mc)).not.toThrow();
    }
  });

  it("rejects invalid sentiment value", () => {
    const mc = { id: "mc2", brandId: "pipe", headline: "Test", outlet: "Test", type: "Article", date: "2026-01-01", sentiment: "Mixed" };
    expect(() => mediaCoverageSchema.parse(mc)).toThrow();
  });
});
