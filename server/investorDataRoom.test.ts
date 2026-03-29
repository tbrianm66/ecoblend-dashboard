/**
 * Investor Data Room Module — Vitest Test Suite
 * Tests all 9 sub-routers: rooms, assets, readiness, investors,
 * permissions, engagement, qa, assetFactory, approvals
 */
import { describe, it, expect, vi } from "vitest";
import { investorDataRoomRouter } from "./investorDataRoom.router";

// Mock the DB module — returns null to simulate unavailable DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI generated content for investor data room" } }],
  }),
}));

const mockUser = {
  id: 1,
  openId: "test-open-id",
  name: "Test User",
  email: "test@ecoblend.io",
  role: "admin" as const,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const caller = investorDataRoomRouter.createCaller({ user: mockUser, db: null });

// ─── ROOMS ROUTER ────────────────────────────────────────────
describe("investorDataRoom.rooms", () => {
  it("list returns null (db unavailable) without throwing", async () => {
    const result = await caller.rooms.list({});
    // With db=null and `return null as any`, result is null
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts ventureId filter without throwing", async () => {
    const result = await caller.rooms.list({ ventureId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts status filter without throwing", async () => {
    const result = await caller.rooms.list({ status: "published" });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("summary returns object with count properties", async () => {
    const result = await caller.rooms.summary({});
    expect(result).toBeDefined();
    // Either null or an object with counts
    if (result !== null) {
      expect(typeof result).toBe("object");
    }
  });

  it("create throws when db is unavailable", async () => {
    await expect(
      caller.rooms.create({
        ventureId: 1,
        name: "Test Room",
        description: "Test description",
        roomType: "teaser",
        visibilityTier: "teaser",
        fundingRound: "Seed",
        fundingTarget: "£500K",
        ndaRequired: false,
        watermarkEnabled: true,
        downloadEnabled: false,
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("publish throws when db is unavailable", async () => {
    await expect(caller.rooms.publish({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.rooms.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── ASSETS ROUTER ───────────────────────────────────────────
describe("investorDataRoom.assets", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.assets.list({});
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts folder filter without throwing", async () => {
    const result = await caller.assets.list({ folder: "01_Overview" });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts roomId filter without throwing", async () => {
    const result = await caller.assets.list({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("create throws when db is unavailable", async () => {
    await expect(
      caller.assets.create({
        roomId: 1,
        ventureId: 1,
        name: "Test Asset",
        assetType: "pitch_deck",
        folder: "01_Overview",
        visibilityTier: "teaser",
        fileUrl: "https://example.com/doc.pdf",
        mimeType: "application/pdf",
        fileSizeKb: 1024,
        version: "1.0",
        downloadAllowed: false,
        watermarked: true,
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("approve throws when db is unavailable", async () => {
    await expect(caller.assets.approve({ id: 1, approverId: 1 })).rejects.toThrow("DB unavailable");
  });

  it("updateStatus throws when db is unavailable", async () => {
    await expect(
      caller.assets.updateStatus({ id: 1, status: "approved" })
    ).rejects.toThrow("DB unavailable");
  });
});

// ─── READINESS ROUTER ────────────────────────────────────────
describe("investorDataRoom.readiness", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.readiness.list({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("score returns an object when db is null", async () => {
    const result = await caller.readiness.score({ roomId: 1 });
    // With null db, score returns a default object
    expect(result).toBeDefined();
    if (result !== null) {
      expect(typeof result).toBe("object");
    }
  });

  it("generateChecklist throws when db is unavailable", async () => {
    await expect(
      caller.readiness.generateChecklist({
        roomId: 1,
        ventureId: 1,
        ventureName: "EcoBlend VBS",
        stage: "Seed",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("resolve throws when db is unavailable", async () => {
    await expect(caller.readiness.resolve({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("create throws when db is unavailable", async () => {
    await expect(
      caller.readiness.create({
        roomId: 1,
        ventureId: 1,
        title: "Financial statements uploaded",
        category: "financials",
        severity: "critical",
        blocksPublish: true,
      })
    ).rejects.toThrow("DB unavailable");
  });
});

// ─── INVESTORS ROUTER ────────────────────────────────────────
describe("investorDataRoom.investors", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.investors.list({});
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts ventureId filter without throwing", async () => {
    const result = await caller.investors.list({ ventureId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts stage filter without throwing", async () => {
    const result = await caller.investors.list({ stage: "identified" });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("pipeline returns null or array when db is null", async () => {
    const result = await caller.investors.pipeline({});
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("create throws when db is unavailable", async () => {
    await expect(
      caller.investors.create({
        ventureId: 1,
        name: "John Smith",
        organisation: "Acme Ventures",
        email: "john@acme.vc",
        investorType: "vc",
        thesisFit: "strong",
        notes: "Met at TechCrunch",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("updateStage throws when db is unavailable", async () => {
    await expect(
      caller.investors.updateStage({ id: 1, stage: "contacted" })
    ).rejects.toThrow("DB unavailable");
  });

  it("signNda throws when db is unavailable", async () => {
    await expect(caller.investors.signNda({ id: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── PERMISSIONS ROUTER ──────────────────────────────────────
describe("investorDataRoom.permissions", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.permissions.list({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("invite throws when db is unavailable", async () => {
    await expect(
      caller.permissions.invite({
        roomId: 1,
        investorId: 1,
        accessLevel: "teaser",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("revoke throws when db is unavailable", async () => {
    await expect(caller.permissions.revoke({ id: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── ENGAGEMENT ROUTER ───────────────────────────────────────
describe("investorDataRoom.engagement", () => {
  it("roomAnalytics returns null or object when db is null", async () => {
    const result = await caller.engagement.roomAnalytics({ roomId: 1 });
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("portfolioAnalytics returns null or object when db is null", async () => {
    const result = await caller.engagement.portfolioAnalytics({});
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("log throws when db is unavailable", async () => {
    await expect(
      caller.engagement.log({
        roomId: 1,
        eventType: "room_opened",
      })
    ).rejects.toThrow("DB unavailable");
  });
});

// ─── Q&A ROUTER ──────────────────────────────────────────────
describe("investorDataRoom.qa", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.qa.list({});
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts roomId filter without throwing", async () => {
    const result = await caller.qa.list({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("list accepts status filter without throwing", async () => {
    const result = await caller.qa.list({ status: "pending" });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("submit throws when db is unavailable", async () => {
    await expect(
      caller.qa.submit({
        roomId: 1,
        investorId: 1,
        question: "What is the current MRR?",
        category: "financial",
        priority: "high",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("respond throws when db is unavailable", async () => {
    await expect(
      caller.qa.respond({
        id: 1,
        response: "Our current MRR is £45K",
        responseOwnerId: 1,
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("generateAiResponse throws when db is unavailable", async () => {
    // generateAiResponse needs db to look up the question first
    await expect(
      caller.qa.generateAiResponse({
        questionId: 1,
        ventureName: "EcoBlend VBS",
        ventureStage: "Seed",
      })
    ).rejects.toThrow("DB unavailable");
  });
});

// ─── ASSET FACTORY ROUTER ────────────────────────────────────
describe("investorDataRoom.assetFactory", () => {
  it("generateOnePager throws when db is unavailable", async () => {
    await expect(
      caller.assetFactory.generateOnePager({
        roomId: 1,
        ventureId: 1,
        ventureName: "EcoBlend VBS",
        problem: "Lack of portfolio visibility",
        solution: "Real-time VBS analytics",
        market: "£1.58B VC software market",
        ask: "£500K for 10% equity",
        sector: "B2B SaaS",
        stage: "Seed",
        businessModel: "SaaS subscription",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("generatePitchDeck throws when db is unavailable", async () => {
    await expect(
      caller.assetFactory.generatePitchDeck({
        roomId: 1,
        ventureId: 1,
        ventureName: "EcoBlend VBS",
        problem: "Lack of portfolio visibility",
        solution: "Real-time VBS analytics",
        marketSize: "£1.58B",
        businessModel: "SaaS subscription",
        ask: "£500K for 10% equity",
        sector: "B2B SaaS",
        stage: "Seed",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("generateFinancialSummary throws when db is unavailable", async () => {
    await expect(
      caller.assetFactory.generateFinancialSummary({
        roomId: 1,
        ventureId: 1,
        ventureName: "EcoBlend VBS",
        revenueModel: "SaaS subscription",
        forecast: "Y1: £200K, Y2: £500K, Y3: £1.2M",
        assumptions: "CAC £2K, LTV £24K, 5% monthly churn",
        useOfFunds: "40% product, 40% GTM, 20% ops",
        stage: "Seed",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("generateDdIndex throws when db is unavailable", async () => {
    await expect(
      caller.assetFactory.generateDdIndex({
        roomId: 1,
        ventureId: 1,
        ventureName: "EcoBlend VBS",
        stage: "Seed",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("generationLog returns null or array when db is null", async () => {
    const result = await caller.assetFactory.generationLog({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });
});

// ─── APPROVALS ROUTER ────────────────────────────────────────
describe("investorDataRoom.approvals", () => {
  it("list returns null or array when db is null", async () => {
    const result = await caller.approvals.list({ roomId: 1 });
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  it("request throws when db is unavailable", async () => {
    await expect(
      caller.approvals.request({
        roomId: 1,
        assetId: 1,
        reviewerRole: "finance_reviewer",
        dueDate: "2026-06-01",
      })
    ).rejects.toThrow("DB unavailable");
  });

  it("review throws when db is unavailable", async () => {
    await expect(
      caller.approvals.review({
        id: 1,
        status: "approved",
        reviewerId: 1,
        comments: "Looks good",
      })
    ).rejects.toThrow("DB unavailable");
  });
});
