/**
 * EcoRace Lab Router Tests — Sprint 67
 * Tests for 8-stage AI engineering workflow system
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ecoraceLab } from "./ecoracelab.router";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ recommendedApproach: "Test approach", engineeringBrief: { coreProblem: "test" } }) } }],
  }),
}));

const mockUser = { id: "test-user", name: "Test User", email: "test@test.com", role: "admin" as const, openId: "open-id-1", createdAt: new Date() };
const caller = ecoraceLab.createCaller({ user: mockUser } as any);

// ─── Router Registration ──────────────────────────────────────────────────────

describe("ecoraceLab router registration", () => {
  it("should export ecoraceLab router with all sub-routers", () => {
    expect(ecoraceLab).toBeDefined();
    expect(typeof ecoraceLab).toBe("object");
  });

  it("should have projects sub-router", () => {
    expect(ecoraceLab._def.procedures).toBeDefined();
  });

  it("should be importable and usable as a router", () => {
    const procedures = ecoraceLab._def.procedures;
    expect(procedures).toBeDefined();
  });
});

// ─── Projects Sub-Router ──────────────────────────────────────────────────────

describe("ecoraceLab.projects", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.projects.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list accepts ventureId filter", async () => {
    const result = await caller.projects.list({ ventureId: "venture-1" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list accepts no arguments", async () => {
    const result = await caller.projects.list(undefined);
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns null when db is unavailable", async () => {
    const result = await caller.projects.get({ id: 1 });
    expect(result).toBeNull();
  });

  it("summary returns default stats when db is unavailable", async () => {
    const result = await caller.projects.summary();
    expect(result).toBeDefined();
    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.byStage).toBeDefined();
    expect(result.byPriority).toBeDefined();
  });

  it("summary byStage is an object", async () => {
    const result = await caller.projects.summary();
    expect(typeof result.byStage).toBe("object");
    expect(result.byStage).toBeDefined();
  });

  it("summary byPriority is an object", async () => {
    const result = await caller.projects.summary();
    expect(typeof result.byPriority).toBe("object");
    expect(result.byPriority).toBeDefined();
  });

  it("upsert throws when db is unavailable", async () => {
    await expect(caller.projects.upsert({ title: "Test Project" })).rejects.toThrow("DB unavailable");
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.projects.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── Stages Sub-Router ────────────────────────────────────────────────────────

describe("ecoraceLab.stages", () => {
  it("listByProject returns an array when db is unavailable", async () => {
    const result = await caller.stages.listByProject({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("get returns null when db is unavailable", async () => {
    const result = await caller.stages.get({ projectId: 1, stage: "opportunity" });
    expect(result).toBeNull();
  });

  it("get accepts all 8 valid stages", async () => {
    const stages = ["opportunity","concept","materials","simulation","prototype","manufacturing","validation","ip"] as const;
    for (const stage of stages) {
      const result = await caller.stages.get({ projectId: 1, stage });
      expect(result).toBeNull();
    }
  });

  it("updateStatus throws when db is unavailable", async () => {
    await expect(caller.stages.updateStatus({ id: 1, status: "completed" })).rejects.toThrow("DB unavailable");
  });

  it("runAgent throws when db is unavailable (project not found)", async () => {
    await expect(caller.stages.runAgent({ projectId: 1, stage: "opportunity" })).rejects.toThrow("DB unavailable");
  });

  it("runAgent accepts additionalContext", async () => {
    await expect(caller.stages.runAgent({ projectId: 1, stage: "concept", additionalContext: "Focus on lightweight materials" })).rejects.toThrow("DB unavailable");
  });
});

// ─── Materials Sub-Router ─────────────────────────────────────────────────────

describe("ecoraceLab.materials", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.materials.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list accepts projectId filter", async () => {
    const result = await caller.materials.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list accepts no arguments", async () => {
    const result = await caller.materials.list(undefined);
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert throws when db is unavailable", async () => {
    await expect(caller.materials.upsert({ name: "ECOCOMP-1", projectId: 1 })).rejects.toThrow("DB unavailable");
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.materials.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("generateFromStage throws when db is unavailable", async () => {
    await expect(caller.materials.generateFromStage({ projectId: 1 })).rejects.toThrow("DB unavailable");
  });

  it("upsert validates category enum", async () => {
    await expect(caller.materials.upsert({ name: "Test", category: "invalid_category" as any, projectId: 1 })).rejects.toThrow();
  });

  it("upsert accepts all valid material categories", async () => {
    const categories = ["polymer","composite","metal","ceramic","bio_based","recycled","nano","hybrid"] as const;
    for (const category of categories) {
      await expect(caller.materials.upsert({ name: "Test", category, projectId: 1 })).rejects.toThrow("DB unavailable");
    }
  });
});

// ─── Simulations Sub-Router ───────────────────────────────────────────────────

describe("ecoraceLab.simulations", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.simulations.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert throws when db is unavailable", async () => {
    await expect(caller.simulations.upsert({ projectId: 1, simType: "fea", title: "FEA Analysis" })).rejects.toThrow("DB unavailable");
  });

  it("upsert accepts all valid simulation types", async () => {
    const types = ["fea","thermal","fatigue","cfd","impact","vibration","lifecycle"] as const;
    for (const simType of types) {
      await expect(caller.simulations.upsert({ projectId: 1, simType, title: "Test" })).rejects.toThrow("DB unavailable");
    }
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.simulations.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("generatePlan throws when db is unavailable", async () => {
    await expect(caller.simulations.generatePlan({ projectId: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── IP Assets Sub-Router ─────────────────────────────────────────────────────

describe("ecoraceLab.ip", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.ip.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert throws when db is unavailable", async () => {
    await expect(caller.ip.upsert({ projectId: 1, title: "Patent: ECOCOMP Formulation" })).rejects.toThrow("DB unavailable");
  });

  it("upsert accepts all valid IP types", async () => {
    const types = ["patent","trade_secret","design_right","copyright","trademark","know_how"] as const;
    for (const ipType of types) {
      await expect(caller.ip.upsert({ projectId: 1, title: "Test IP", ipType })).rejects.toThrow("DB unavailable");
    }
  });

  it("upsert accepts all valid filing statuses", async () => {
    const statuses = ["draft","review","filed","granted","rejected","abandoned"] as const;
    for (const filingStatus of statuses) {
      await expect(caller.ip.upsert({ projectId: 1, title: "Test IP", filingStatus })).rejects.toThrow("DB unavailable");
    }
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.ip.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("generateFromStage throws when db is unavailable", async () => {
    await expect(caller.ip.generateFromStage({ projectId: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── Validation Sub-Router ────────────────────────────────────────────────────

describe("ecoraceLab.validation", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.validation.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsert throws when db is unavailable", async () => {
    await expect(caller.validation.upsert({ projectId: 1, validationType: "performance", title: "Load Test" })).rejects.toThrow("DB unavailable");
  });

  it("upsert accepts all valid validation types", async () => {
    const types = ["performance","compliance","lifecycle","safety","market","technical"] as const;
    for (const validationType of types) {
      await expect(caller.validation.upsert({ projectId: 1, validationType, title: "Test" })).rejects.toThrow("DB unavailable");
    }
  });

  it("delete throws when db is unavailable", async () => {
    await expect(caller.validation.delete({ id: 1 })).rejects.toThrow("DB unavailable");
  });

  it("generateFromStage throws when db is unavailable", async () => {
    await expect(caller.validation.generateFromStage({ projectId: 1 })).rejects.toThrow("DB unavailable");
  });
});

// ─── Agent Runs Sub-Router ────────────────────────────────────────────────────

describe("ecoraceLab.agentRuns", () => {
  it("list returns an array when db is unavailable", async () => {
    const result = await caller.agentRuns.list({ projectId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list accepts limit parameter", async () => {
    const result = await caller.agentRuns.list({ projectId: 1, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAgentDefinitions returns all 7 agents", async () => {
    const agents = await caller.agentRuns.getAgentDefinitions();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBe(7);
  });

  it("getAgentDefinitions includes all required agent fields", async () => {
    const agents = await caller.agentRuns.getAgentDefinitions();
    agents.forEach(agent => {
      expect(agent).toHaveProperty("id");
      expect(agent).toHaveProperty("name");
      expect(agent).toHaveProperty("stage");
      expect(agent).toHaveProperty("description");
    });
  });

  it("getAgentDefinitions includes all 7 specialist agents", async () => {
    const agents = await caller.agentRuns.getAgentDefinitions();
    const agentIds = agents.map(a => a.id);
    expect(agentIds).toContain("opportunity_translator");
    expect(agentIds).toContain("concept_engineer");
    expect(agentIds).toContain("materials_scientist");
    expect(agentIds).toContain("simulation_engineer");
    expect(agentIds).toContain("manufacturing_planner");
    expect(agentIds).toContain("validation_engineer");
    expect(agentIds).toContain("ip_generator");
  });
});

// ─── Dashboard Sub-Router ─────────────────────────────────────────────────────

describe("ecoraceLab.dashboard", () => {
  it("get returns null when db is unavailable", async () => {
    const result = await caller.dashboard.get({ projectId: 1 });
    expect(result).toBeNull();
  });
});

// ─── Input Validation ─────────────────────────────────────────────────────────

describe("ecoraceLab input validation", () => {
  it("projects.upsert requires title", async () => {
    await expect(caller.projects.upsert({ title: "" })).rejects.toThrow();
  });

  it("materials.upsert requires name", async () => {
    await expect(caller.materials.upsert({ name: "", projectId: 1 })).rejects.toThrow();
  });

  it("simulations.upsert requires title", async () => {
    await expect(caller.simulations.upsert({ projectId: 1, simType: "fea", title: "" })).rejects.toThrow();
  });

  it("ip.upsert requires title", async () => {
    await expect(caller.ip.upsert({ projectId: 1, title: "" })).rejects.toThrow();
  });

  it("validation.upsert requires title", async () => {
    await expect(caller.validation.upsert({ projectId: 1, validationType: "performance", title: "" })).rejects.toThrow();
  });

  it("stages.get validates stage enum", async () => {
    await expect(caller.stages.get({ projectId: 1, stage: "invalid_stage" as any })).rejects.toThrow();
  });

  it("stages.runAgent validates stage enum", async () => {
    await expect(caller.stages.runAgent({ projectId: 1, stage: "invalid_stage" as any })).rejects.toThrow();
  });

  it("projects.upsert validates status enum", async () => {
    await expect(caller.projects.upsert({ title: "Test", status: "invalid_status" as any })).rejects.toThrow();
  });

  it("projects.upsert validates priority enum", async () => {
    await expect(caller.projects.upsert({ title: "Test", priority: "ultra_critical" as any })).rejects.toThrow();
  });

  it("materials.upsert validates sustainability score range", async () => {
    await expect(caller.materials.upsert({ name: "Test", projectId: 1, sustainabilityScore: 150 })).rejects.toThrow();
  });
});
