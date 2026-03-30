/**
 * Playbook Module Router — Vitest Tests
 * Sprint 70 — Tests for all sub-routers: playbooks, steps, runs, kpis, assets, ai
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { playbookRouter } from "./playbook.router";

// Mock getDb to return null (no real DB in tests)
vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
// Mock invokeLLM to avoid real API calls in tests
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn().mockRejectedValue(new Error("LLM unavailable in test environment")) }));

const mockUser = { id: "test-user-1", name: "Test User", email: "test@ecoblend.io", role: "admin" as const };

const caller = playbookRouter.createCaller({
  user: mockUser,
  req: {} as any,
  res: {} as any,
});

// ─── Playbooks Sub-router ─────────────────────────────────────────────────────
describe("playbook.playbooks", () => {
  it("list returns empty array when DB is null", async () => {
    const result = await caller.playbooks.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("seed throws when DB is null", async () => {
    await expect(caller.playbooks.seed()).rejects.toThrow();
  });

  it("get throws when DB is null", async () => {
    await expect(caller.playbooks.get({ id: 1 })).rejects.toThrow();
  });

  it("create throws when DB is null", async () => {
    await expect(
      caller.playbooks.create({
        playbookId: "PB-TEST-01",
        title: "Test Playbook",
        subFolder: "avoid_catch22",
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("update throws when DB is null", async () => {
    await expect(
      caller.playbooks.update({ id: 1, status: "active" })
    ).rejects.toThrow();
  });

  it("delete throws when DB is null", async () => {
    await expect(caller.playbooks.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Steps Sub-router ─────────────────────────────────────────────────────────
describe("playbook.steps", () => {
  it("list returns empty array when DB is null", async () => {
    const result = await caller.steps.list({ playbookId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("create throws when DB is null", async () => {
    await expect(
      caller.steps.create({
        playbookId: 1,
        stepNumber: 1,
        title: "Step 1",
        action: "Do something",
      })
    ).rejects.toThrow();
  });

  it("update throws when DB is null", async () => {
    await expect(
      caller.steps.update({ id: 1, title: "Updated Step" })
    ).rejects.toThrow();
  });

  it("delete throws when DB is null", async () => {
    await expect(caller.steps.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Runs Sub-router ──────────────────────────────────────────────────────────
describe("playbook.runs", () => {
  it("list returns empty array when DB is null", async () => {
    const result = await caller.runs.list({ playbookId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("start throws when DB is null", async () => {
    await expect(caller.runs.start({ playbookId: 1 })).rejects.toThrow();
  });

  it("getRunDetail throws when DB is null", async () => {
    await expect(caller.runs.getRunDetail({ runId: 1 })).rejects.toThrow();
  });

  it("advanceStep throws when DB is null", async () => {
    await expect(
      caller.runs.advanceStep({ runId: 1, stepId: 1 })
    ).rejects.toThrow();
  });

  it("blockStep throws when DB is null", async () => {
    await expect(
      caller.runs.blockStep({ runId: 1, stepId: 1, blockerReason: "Blocked" })
    ).rejects.toThrow();
  });

  it("cancel throws when DB is null", async () => {
    await expect(caller.runs.cancel({ runId: 1 })).rejects.toThrow();
  });

  it("generateRunSummary throws when DB is null", async () => {
    await expect(
      caller.runs.generateRunSummary({ runId: 1, kpisAchieved: ["KPI 1"] })
    ).rejects.toThrow();
  });
});

// ─── KPIs Sub-router ──────────────────────────────────────────────────────────
describe("playbook.kpis", () => {
  it("list returns empty array when DB is null", async () => {
    const result = await caller.kpis.list({ playbookId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("record throws when DB is null", async () => {
    await expect(
      caller.kpis.record({
        playbookId: 1,
        kpiLabel: "Test KPI",
        targetValue: "10",
        actualValue: "12",
        unit: "points",
        achieved: true,
        notes: "",
      })
    ).rejects.toThrow();
  });

  it("delete throws when DB is null", async () => {
    await expect(caller.kpis.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Assets Sub-router ────────────────────────────────────────────────────────
describe("playbook.assets", () => {
  it("list returns empty array when DB is null", async () => {
    const result = await caller.assets.list({ playbookId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("link throws when DB is null", async () => {
    await expect(
      caller.assets.link({
        playbookId: 1,
        assetType: "pitch_deck",
        assetTitle: "Test Pitch Deck",
      })
    ).rejects.toThrow();
  });

  it("unlink throws when DB is null", async () => {
    await expect(caller.assets.unlink({ id: 1 })).rejects.toThrow();
  });
});

// ─── AI Sub-router ────────────────────────────────────────────────────────────
describe("playbook.ai", () => {
  it("generatePlaybook throws when AI call fails (no real API key in tests)", async () => {
    await expect(
      caller.ai.generatePlaybook({
        subFolder: "avoid_catch22",
        ventureContext: "Early-stage SaaS startup",
        specificChallenge: "Poor data quality in CRM",
        teamSize: "5 people",
        industry: "Technology",
      })
    ).rejects.toThrow();
  });

  it("analyzePortfolioPatterns throws when DB is null", async () => {
    await expect(caller.ai.analyzePortfolioPatterns()).rejects.toThrow();
  });
});

// ─── Input validation tests ───────────────────────────────────────────────────
describe("playbook input validation", () => {
  it("create rejects empty playbookId", async () => {
    await expect(
      caller.playbooks.create({
        playbookId: "",
        title: "Test",
        subFolder: "avoid_catch22",
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("create rejects empty title", async () => {
    await expect(
      caller.playbooks.create({
        playbookId: "PB-01",
        title: "",
        subFolder: "avoid_catch22",
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("create rejects invalid subFolder", async () => {
    await expect(
      caller.playbooks.create({
        playbookId: "PB-01",
        title: "Test",
        subFolder: "invalid_folder" as any,
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("create rejects invalid status", async () => {
    await expect(
      caller.playbooks.create({
        playbookId: "PB-01",
        title: "Test",
        subFolder: "avoid_catch22",
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("steps.create rejects stepNumber below 1", async () => {
    await expect(
      caller.steps.create({
        playbookId: 1,
        stepNumber: 0,
        title: "Step 0",
        action: "Do something",
      })
    ).rejects.toThrow();
  });

  it("runs.blockStep requires non-empty blockerReason", async () => {
    await expect(
      caller.runs.blockStep({ runId: 1, stepId: 1, blockerReason: "" })
    ).rejects.toThrow();
  });

  it("kpis.record rejects empty kpiLabel", async () => {
    await expect(
      caller.kpis.record({
        playbookId: 1,
        kpiLabel: "",
        achieved: false,
      })
    ).rejects.toThrow();
  });

  it("assets.link rejects invalid assetType", async () => {
    await expect(
      caller.assets.link({
        playbookId: 1,
        assetType: "invalid_type" as any,
        assetTitle: "Test",
      })
    ).rejects.toThrow();
  });
});

// ─── Subfolders validation ────────────────────────────────────────────────────
describe("playbook subFolder enum validation", () => {
  const validSubFolders = [
    "avoid_catch22",
    "democratize_quality",
    "embed_operations",
    "adapt_ai_genai",
    "scale_governance",
  ] as const;

  validSubFolders.forEach((folder) => {
    it(`accepts valid subFolder: ${folder}`, async () => {
      // Should throw DB error, not validation error
      await expect(
        caller.playbooks.create({
          playbookId: `PB-${folder}`,
          title: `Test ${folder}`,
          subFolder: folder,
          status: "draft",
        })
      ).rejects.toThrow(/DB unavailable/);
    });
  });
});
