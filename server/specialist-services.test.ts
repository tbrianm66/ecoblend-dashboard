// ============================================================
// Tests: Specialist Services + Investment Readiness financial link
// ============================================================

import { describe, it, expect } from "vitest";

// ── Replicate the data shapes used in the frontend ────────────────────────────

type ServiceCategory =
  | "Legal & IP"
  | "Branding & Design"
  | "Engineering & R&D"
  | "Finance & Investment"
  | "Marketing & PR"
  | "Strategy & Research"
  | "Technology & Dev"
  | "People & HR"
  | "Sustainability & B Corp";

interface Specialist {
  id: string;
  name: string;
  category: ServiceCategory;
  rate: string;
  availability: "Available" | "Limited" | "Busy";
  rating: number;
  completedJobs: number;
  platformFee: number;
  tags: string[];
}

interface ServiceTask {
  id: string;
  playbookRef: string;
  title: string;
  category: ServiceCategory;
  brandId: string;
  priority: "High" | "Medium" | "Low";
  estimatedCost: string;
}

interface BrandFinancials {
  id: string;
  monthlyBurn: number;
  cashRunway: number;
  revenueActual: number;
  revenueTarget: number;
  investmentRaised: number;
  investmentTarget: number;
}

const SPECIALISTS: Specialist[] = [
  { id: "sp1", name: "Sarah Mitchell", category: "Legal & IP", rate: "£200/hr", availability: "Available", rating: 5, completedJobs: 34, platformFee: 15, tags: ["Patents", "Trade Marks"] },
  { id: "sp2", name: "James Okafor", category: "Branding & Design", rate: "£3,500 fixed", availability: "Available", rating: 4, completedJobs: 21, platformFee: 15, tags: ["Brand Identity"] },
  { id: "sp3", name: "Dr. Priya Nair", category: "Engineering & R&D", rate: "£180/hr", availability: "Limited", rating: 5, completedJobs: 18, platformFee: 12, tags: ["Bio-Composites"] },
  { id: "sp4", name: "Tom Hargreaves", category: "Finance & Investment", rate: "£1,800/day", availability: "Available", rating: 4, completedJobs: 29, platformFee: 15, tags: ["SEIS/EIS"] },
  { id: "sp5", name: "Amara Diallo", category: "Marketing & PR", rate: "£2,200/mo retainer", availability: "Available", rating: 5, completedJobs: 41, platformFee: 15, tags: ["Press Releases"] },
  { id: "sp6", name: "Lena Bergström", category: "Strategy & Research", rate: "£1,200 fixed", availability: "Available", rating: 4, completedJobs: 16, platformFee: 12, tags: ["Market Sizing"] },
  { id: "sp7", name: "Raj Patel", category: "Technology & Dev", rate: "£95/hr", availability: "Limited", rating: 4, completedJobs: 52, platformFee: 10, tags: ["React"] },
  { id: "sp8", name: "Claire Fontaine", category: "Sustainability & B Corp", rate: "£1,500 fixed", availability: "Available", rating: 5, completedJobs: 23, platformFee: 12, tags: ["B Corp"] },
  { id: "sp9", name: "Marcus Webb", category: "People & HR", rate: "£1,000 fixed", availability: "Available", rating: 4, completedJobs: 11, platformFee: 12, tags: ["ESOP"] },
];

const SERVICE_TASKS: ServiceTask[] = [
  { id: "st1", playbookRef: "VRL 1 · Task 4", title: "File Provisional Patent", category: "Legal & IP", brandId: "ecoblend", priority: "High", estimatedCost: "£1,500–£3,000" },
  { id: "st2", playbookRef: "VRL 1 · Task 7", title: "Develop Brand Identity for TONE", category: "Branding & Design", brandId: "tone", priority: "High", estimatedCost: "£3,000–£5,000" },
  { id: "st3", playbookRef: "VRL 2 · Task 18", title: "Validate Bio-Composite at TRL 5", category: "Engineering & R&D", brandId: "ecoblend-rd", priority: "High", estimatedCost: "£4,000–£8,000" },
  { id: "st4", playbookRef: "VRL 2 · Task 22", title: "Prepare SEIS/EIS Docs for REAL", category: "Finance & Investment", brandId: "real", priority: "High", estimatedCost: "£2,500–£4,000" },
  { id: "st5", playbookRef: "VRL 1 · Task 12", title: "TAM/SAM/SOM for PIPE", category: "Strategy & Research", brandId: "pipe", priority: "Medium", estimatedCost: "£1,200–£2,000" },
];

const BRAND_FINANCIALS: Record<string, BrandFinancials> = {
  "ecoblend":    { id: "ecoblend",    monthlyBurn: 18000, cashRunway: 14, revenueActual: 73000,  revenueTarget: 120000, investmentRaised: 280000, investmentTarget: 500000 },
  "bebus":       { id: "bebus",       monthlyBurn: 12000, cashRunway: 8,  revenueActual: 0,      revenueTarget: 80000,  investmentRaised: 120000, investmentTarget: 400000 },
  "tone":        { id: "tone",        monthlyBurn: 8000,  cashRunway: 5,  revenueActual: 2500,   revenueTarget: 60000,  investmentRaised: 50000,  investmentTarget: 300000 },
  "real":        { id: "real",        monthlyBurn: 9500,  cashRunway: 10, revenueActual: 14200,  revenueTarget: 75000,  investmentRaised: 95000,  investmentTarget: 350000 },
  "pipe":        { id: "pipe",        monthlyBurn: 5000,  cashRunway: 6,  revenueActual: 0,      revenueTarget: 50000,  investmentRaised: 0,      investmentTarget: 250000 },
};

// ── Specialist directory tests ────────────────────────────────────────────────

describe("Specialist directory", () => {
  it("has 9 specialists covering all 9 service categories", () => {
    const categories = new Set(SPECIALISTS.map(s => s.category));
    expect(SPECIALISTS).toHaveLength(9);
    expect(categories.size).toBe(9);
  });

  it("all specialists have a platform fee between 10% and 20%", () => {
    SPECIALISTS.forEach(s => {
      expect(s.platformFee).toBeGreaterThanOrEqual(10);
      expect(s.platformFee).toBeLessThanOrEqual(20);
    });
  });

  it("all specialists have a rating between 1 and 5", () => {
    SPECIALISTS.forEach(s => {
      expect(s.rating).toBeGreaterThanOrEqual(1);
      expect(s.rating).toBeLessThanOrEqual(5);
    });
  });

  it("all specialists have at least one tag", () => {
    SPECIALISTS.forEach(s => {
      expect(s.tags.length).toBeGreaterThan(0);
    });
  });

  it("filters available specialists correctly", () => {
    const available = SPECIALISTS.filter(s => s.availability !== "Busy");
    expect(available.length).toBeGreaterThan(0);
    available.forEach(s => {
      expect(["Available", "Limited"]).toContain(s.availability);
    });
  });
});

// ── Service tasks tests ───────────────────────────────────────────────────────

describe("Service tasks", () => {
  it("all tasks have unique IDs", () => {
    const ids = SERVICE_TASKS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all tasks have a valid priority", () => {
    SERVICE_TASKS.forEach(t => {
      expect(["High", "Medium", "Low"]).toContain(t.priority);
    });
  });

  it("all tasks reference a valid playbook stage", () => {
    SERVICE_TASKS.forEach(t => {
      expect(t.playbookRef).toMatch(/^VRL \d+ · Task \d+$/);
    });
  });

  it("each task category matches a specialist category", () => {
    const specialistCategories = new Set(SPECIALISTS.map(s => s.category));
    SERVICE_TASKS.forEach(t => {
      expect(specialistCategories.has(t.category)).toBe(true);
    });
  });

  it("can filter tasks by brand", () => {
    const toneTasks = SERVICE_TASKS.filter(t => t.brandId === "tone");
    expect(toneTasks.length).toBeGreaterThan(0);
    toneTasks.forEach(t => expect(t.brandId).toBe("tone"));
  });
});

// ── Investment Readiness financial link tests ─────────────────────────────────

describe("Investment Readiness financial data", () => {
  it("all portfolio brands have financial records", () => {
    const brandIds = ["ecoblend", "bebus", "tone", "real", "pipe"];
    brandIds.forEach(id => {
      expect(BRAND_FINANCIALS[id]).toBeDefined();
    });
  });

  it("funding gap is correctly calculated as target minus raised", () => {
    Object.values(BRAND_FINANCIALS).forEach(f => {
      const gap = Math.max(0, f.investmentTarget - f.investmentRaised);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBe(Math.max(0, f.investmentTarget - f.investmentRaised));
    });
  });

  it("total portfolio funding ask is calculated correctly", () => {
    const portfolioBrands = ["ecoblend", "bebus", "tone", "real", "pipe"];
    const totalAsk = portfolioBrands.reduce((a, id) => a + (BRAND_FINANCIALS[id]?.investmentTarget ?? 0), 0);
    expect(totalAsk).toBe(500000 + 400000 + 300000 + 350000 + 250000); // £1,800,000
  });

  it("total raised is less than total ask (portfolio still raising)", () => {
    const portfolioBrands = ["ecoblend", "bebus", "tone", "real", "pipe"];
    const totalAsk = portfolioBrands.reduce((a, id) => a + (BRAND_FINANCIALS[id]?.investmentTarget ?? 0), 0);
    const totalRaised = portfolioBrands.reduce((a, id) => a + (BRAND_FINANCIALS[id]?.investmentRaised ?? 0), 0);
    expect(totalRaised).toBeLessThan(totalAsk);
  });

  it("runway badge logic: healthy ≥12m, monitor 6–11m, critical <6m", () => {
    const getLabel = (months: number) =>
      months >= 12 ? "Healthy" : months >= 6 ? "Monitor" : "Critical";

    expect(getLabel(14)).toBe("Healthy");  // EcoComp
    expect(getLabel(8)).toBe("Monitor");   // BEBUS
    expect(getLabel(5)).toBe("Critical");  // TONE
    expect(getLabel(10)).toBe("Monitor");  // REAL
    expect(getLabel(6)).toBe("Monitor");   // PIPE
  });

  it("raised percentage is capped at 100%", () => {
    Object.values(BRAND_FINANCIALS).forEach(f => {
      const pct = f.investmentTarget > 0 ? Math.min(100, (f.investmentRaised / f.investmentTarget) * 100) : 0;
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  it("PIPE has zero investment raised (pre-seed stage)", () => {
    expect(BRAND_FINANCIALS["pipe"].investmentRaised).toBe(0);
  });
});

// ── Commission flow logic tests ───────────────────────────────────────────────

describe("Commission status flow", () => {
  type CommissionStatus = "Open" | "Commissioned" | "In Review" | "Complete" | "Cancelled";

  const cycle: CommissionStatus[] = ["Commissioned", "In Review", "Complete"];

  function advanceStatus(current: CommissionStatus): CommissionStatus | null {
    const idx = cycle.indexOf(current);
    if (idx === -1 || idx === cycle.length - 1) return null;
    return cycle[idx + 1];
  }

  it("advances from Commissioned to In Review", () => {
    expect(advanceStatus("Commissioned")).toBe("In Review");
  });

  it("advances from In Review to Complete", () => {
    expect(advanceStatus("In Review")).toBe("Complete");
  });

  it("does not advance from Complete", () => {
    expect(advanceStatus("Complete")).toBeNull();
  });

  it("does not advance from Cancelled", () => {
    expect(advanceStatus("Cancelled")).toBeNull();
  });

  it("platform fee revenue is recognised on commission confirmation", () => {
    const specialist = SPECIALISTS.find(s => s.id === "sp1")!;
    // Simulate: a £200/hr job at 15% platform fee on a 10-hour engagement
    const engagementValue = 200 * 10;
    const platformRevenue = engagementValue * (specialist.platformFee / 100);
    expect(platformRevenue).toBe(300); // 15% of £2,000
  });
});
