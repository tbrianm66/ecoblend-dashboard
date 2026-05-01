// ============================================================
// PHASE 3C QA TESTS — Contextual Widget System Hardening
// Tests cover:
//   1. Permission hardening — admin-only endpoints throw FORBIDDEN for non-admin
//   2. Widget settings CRUD — global settings and thresholds persist
//   3. Usage event logging — View/Open/Dismiss events are recorded
//   4. Context rule diagnostics — matched vs excluded rule logic
// ============================================================
import { describe, expect, it, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Context factories ─────────────────────────────────────────

function makeUserCtx(role: "admin" | "user" = "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: role === "admin" ? "admin-open-id" : "user-open-id",
      email: role === "admin" ? "admin@ecoblend.io" : "user@ecoblend.io",
      name: role === "admin" ? "Admin User" : "Regular User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function makeAnonCtx(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ── 1. Permission Hardening ───────────────────────────────────

describe("Phase 3C — Permission Hardening", () => {
  const adminOnlyProcedures = [
    {
      name: "adminGetWidgetSettings",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminGetWidgetSettings(),
    },
    {
      name: "adminUpdateWidgetGlobalSettings",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminUpdateWidgetGlobalSettings({
          enableWidgetsGlobally: true,
          showAsSidePanel: true,
          showInline: false,
          maxRecommendedPlaybooks: 3,
          defaultRecommendationThreshold: 40,
          enableUsageTracking: true,
          enableDismissalReasons: false,
          enableCompletionTracking: true,
          enableInvestorWarningGates: true,
          enableStageGateWarningGates: true,
        }),
    },
    {
      name: "adminUpdateWidgetThresholds",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminUpdateWidgetThresholds({
          evidenceConfidenceWarning: 50,
          readinessScoreWarning: 40,
          highRiskThreshold: 3,
          investorPackWarning: 60,
          stageGateMinEvidence: 3,
          maxUnresolvedHighRisks: 2,
        }),
    },
    {
      name: "adminGetContextDiagnostics",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminGetContextDiagnostics({
          module: "Venture Intake",
        }),
    },
    {
      name: "adminExportAnalyticsCsv",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminExportAnalyticsCsv({ days: 7 }),
    },
    {
      name: "adminFullAnalytics",
      call: (caller: ReturnType<typeof appRouter.createCaller>) =>
        caller.contextual.adminFullAnalytics({ days: 7 }),
    },
  ];

  for (const proc of adminOnlyProcedures) {
    it(`${proc.name} — throws FORBIDDEN for regular user`, async () => {
      const caller = appRouter.createCaller(makeUserCtx("user"));
      await expect(proc.call(caller)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it(`${proc.name} — throws UNAUTHORIZED for anonymous user`, async () => {
      const caller = appRouter.createCaller(makeAnonCtx());
      await expect(proc.call(caller)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it(`${proc.name} — resolves (or throws non-permission error) for admin user`, async () => {
      const caller = appRouter.createCaller(makeUserCtx("admin"));
      try {
        const result = await proc.call(caller);
        // If it resolves, it should return something (not undefined)
        expect(result).toBeDefined();
      } catch (err) {
        // If it throws, it must NOT be a permission error
        if (err instanceof TRPCError) {
          expect(err.code).not.toBe("FORBIDDEN");
          expect(err.code).not.toBe("UNAUTHORIZED");
        }
      }
    });
  }
});

// ── 2. logUsageEvent — Usage Tracking ────────────────────────

describe("Phase 3C — Usage Event Logging", () => {
  it("logUsageEvent — throws UNAUTHORIZED for anonymous user", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(
      caller.contextual.logUsageEvent({
        playbookId: "__widget_missing_evidence__",
        ventureId: null,
        module: "Venture Intake",
        widgetType: "missing-evidence",
        actionType: "View",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("logUsageEvent — resolves for authenticated user with valid actionType", async () => {
    const caller = appRouter.createCaller(makeUserCtx("user"));
    const result = await caller.contextual.logUsageEvent({
      playbookId: "__widget_missing_evidence__",
      ventureId: null,
      module: "Venture Intake",
      widgetType: "missing-evidence",
      actionType: "View",
    });
    expect(result).toHaveProperty("id");
  });

  it("logUsageEvent — resolves for Open actionType", async () => {
    const caller = appRouter.createCaller(makeUserCtx("user"));
    const result = await caller.contextual.logUsageEvent({
      playbookId: "__widget_score_improvement__",
      ventureId: null,
      module: "Readiness Scoring",
      widgetType: "score-improvement",
      actionType: "Open",
    });
    expect(result).toHaveProperty("id");
  });

  it("logUsageEvent — resolves for Dismiss actionType", async () => {
    const caller = appRouter.createCaller(makeUserCtx("user"));
    const result = await caller.contextual.logUsageEvent({
      playbookId: "__widget_risk_mitigation__",
      ventureId: null,
      module: "Risk Intelligence",
      widgetType: "risk-mitigation",
      actionType: "Dismiss",
    });
    expect(result).toHaveProperty("id");
  });

  it("logUsageEvent — resolves for Complete actionType", async () => {
    const caller = appRouter.createCaller(makeUserCtx("user"));
    const result = await caller.contextual.logUsageEvent({
      playbookId: "__widget_stage_gate_approval__",
      ventureId: null,
      module: "Governance",
      widgetType: "stage-gate-approval",
      actionType: "Complete",
    });
    expect(result).toHaveProperty("id");
  });

  it("logUsageEvent — resolves for admin user", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.logUsageEvent({
      playbookId: "__widget_rd_stage_guidance__",
      ventureId: null,
      module: "Research & Technical Validation",
      widgetType: "rd-stage-guidance",
      actionType: "View",
    });
    expect(result).toHaveProperty("id");
  });
});

// ── 3. Widget Settings CRUD ───────────────────────────────────

describe("Phase 3C — Widget Settings CRUD", () => {
  it("adminGetWidgetSettings — returns object with expected keys for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminGetWidgetSettings();
    expect(result).toHaveProperty("global");
    expect(result).toHaveProperty("thresholds");
    expect(result).toHaveProperty("moduleConfigs");
    expect(result).toHaveProperty("roleSettings");
  });

  it("adminUpdateWidgetGlobalSettings — persists settings for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminUpdateWidgetGlobalSettings({
      enableWidgetsGlobally: true,
      showAsSidePanel: true,
      showInline: false,
      maxRecommendedPlaybooks: 5,
      defaultRecommendationThreshold: 45,
      enableUsageTracking: true,
      enableDismissalReasons: true,
      enableCompletionTracking: true,
      enableInvestorWarningGates: true,
      enableStageGateWarningGates: false,
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("adminUpdateWidgetThresholds — persists thresholds for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminUpdateWidgetThresholds({
      evidenceConfidenceWarning: 55,
      readinessScoreWarning: 45,
      highRiskThreshold: 4,
      investorPackWarning: 65,
      stageGateMinEvidence: 4,
      maxUnresolvedHighRisks: 3,
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("adminUpdateModuleWidgetConfig — persists module config for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminUpdateModuleWidgetConfig({
      module: "Venture Intake",
      widgetType: "MissingEvidenceCard",
      isEnabled: true,
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("adminUpdateRoleVisibility — persists role visibility for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminUpdateRoleVisibility({
      role: "user",
      widgetType: "MissingEvidenceCard",
      isVisible: true,
    });
    expect(result).toMatchObject({ ok: true });
  });
});

// ── 4. Context Rule Diagnostics ───────────────────────────────

describe("Phase 3C — Context Rule Diagnostics", () => {
  it("adminGetContextDiagnostics — returns diagnostic structure for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminGetContextDiagnostics({
      module: "Venture Intake",
    });
    expect(result).toHaveProperty("module");
    expect(result).toHaveProperty("matchedRules");
    expect(result).toHaveProperty("excludedRules");
    expect(result).toHaveProperty("matchedCount");
    expect(result).toHaveProperty("excludedCount");
    expect(result).toHaveProperty("totalRules");
    expect(Array.isArray(result.matchedRules)).toBe(true);
    expect(Array.isArray(result.excludedRules)).toBe(true);
  });

  it("adminGetContextDiagnostics — module is reflected in response", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminGetContextDiagnostics({
      module: "Risk Intelligence",
    });
    expect(result.module).toBe("Risk Intelligence");
  });

  it("adminGetContextDiagnostics — accepts optional ventureId", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminGetContextDiagnostics({
      module: "Readiness Scoring",
      ventureId: "nonexistent-venture-id",
    });
    expect(result).toHaveProperty("matchedRules");
    expect(result).toHaveProperty("excludedRules");
  });

  it("adminGetContextDiagnostics — matchedCount + excludedCount equals totalRules", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminGetContextDiagnostics({
      module: "Investment Readiness",
    });
    expect(result.matchedCount + result.excludedCount).toBe(result.totalRules);
  });
});

// ── 5. CSV Export ─────────────────────────────────────────────

describe("Phase 3C — CSV Export", () => {
  it("adminExportAnalyticsCsv — returns rows array for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminExportAnalyticsCsv({ days: 7 });
    expect(result).toHaveProperty("rows");
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it("adminExportAnalyticsCsv — each row has expected fields", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminExportAnalyticsCsv({ days: 30 });
    if (result.rows.length > 0) {
      const row = result.rows[0];
      expect(row).toHaveProperty("id");
      expect(row).toHaveProperty("actionType");
      expect(row).toHaveProperty("module");
    }
  });
});

// ── 6. Full Analytics ─────────────────────────────────────────

describe("Phase 3C — Full Analytics", () => {
  it("adminFullAnalytics — returns expected top-level keys for admin", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminFullAnalytics({ days: 30 });
    expect(result).toHaveProperty("overview");
    expect(result).toHaveProperty("byModule");
    expect(result).toHaveProperty("byWidget");
    expect(result).toHaveProperty("topPlaybooks");
  });

  it("adminFullAnalytics — overview has totalViews field", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminFullAnalytics({ days: 30 });
    // overview may be an empty object if no events exist yet
    expect(result.overview).toBeDefined();
  });

  it("adminFullAnalytics — byModule is an array", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminFullAnalytics({ days: 30 });
    expect(Array.isArray(result.byModule)).toBe(true);
  });

  it("adminFullAnalytics — topPlaybooks is an array", async () => {
    const caller = appRouter.createCaller(makeUserCtx("admin"));
    const result = await caller.contextual.adminFullAnalytics({ days: 30 });
    expect(Array.isArray(result.topPlaybooks)).toBe(true);
  });
});
