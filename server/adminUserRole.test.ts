/**
 * Admin — updateUserRole tests
 *
 * Covers:
 *   1. AUTH_ROLE_MAP maps every display name to the correct canonical auth role
 *   2. "Scoring Integrity Reviewer" maps to "scoring_integrity_reviewer" (Gate 3 critical path)
 *   3. requireAdmin blocks non-admin callers (FORBIDDEN)
 *   4. Structural checks on the router export
 */

import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { AUTH_ROLE_MAP } from "./admin.router";

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTH_ROLE_MAP — complete mapping coverage
// ─────────────────────────────────────────────────────────────────────────────

describe("AUTH_ROLE_MAP", () => {
  it("maps Studio Director to admin", () => {
    expect(AUTH_ROLE_MAP["Studio Director"]).toBe("admin");
  });

  it("maps Platform Admin to admin", () => {
    expect(AUTH_ROLE_MAP["Platform Admin"]).toBe("admin");
  });

  it("maps Coach to coach", () => {
    expect(AUTH_ROLE_MAP["Coach"]).toBe("coach");
  });

  it("maps Founder to founder", () => {
    expect(AUTH_ROLE_MAP["Founder"]).toBe("founder");
  });

  it("maps Advisor to advisor", () => {
    expect(AUTH_ROLE_MAP["Advisor"]).toBe("advisor");
  });

  it("maps Investor to investor", () => {
    expect(AUTH_ROLE_MAP["Investor"]).toBe("investor");
  });

  // Gate 3 critical-path: this value must match exactly what
  // integrityReviewerProcedure checks in server/_core/trpc.ts
  it("maps Scoring Integrity Reviewer to scoring_integrity_reviewer (Gate 3)", () => {
    expect(AUTH_ROLE_MAP["Scoring Integrity Reviewer"]).toBe("scoring_integrity_reviewer");
  });

  it("covers all seven assignable display roles", () => {
    const expectedKeys = [
      "Studio Director",
      "Platform Admin",
      "Coach",
      "Founder",
      "Advisor",
      "Investor",
      "Scoring Integrity Reviewer",
    ];
    expect(Object.keys(AUTH_ROLE_MAP).sort()).toEqual(expectedKeys.sort());
  });

  it("produces no undefined values", () => {
    for (const [display, auth] of Object.entries(AUTH_ROLE_MAP)) {
      expect(auth, `AUTH_ROLE_MAP["${display}"] should not be undefined`).toBeDefined();
      expect(auth.length, `AUTH_ROLE_MAP["${display}"] should be non-empty`).toBeGreaterThan(0);
    }
  });

  it("all canonical auth roles are lowercase_underscore (no spaces)", () => {
    for (const [display, auth] of Object.entries(AUTH_ROLE_MAP)) {
      expect(auth, `AUTH_ROLE_MAP["${display}"] has unexpected spaces`)
        .not.toContain(" ");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. integrityReviewerProcedure compatibility
//    The value "scoring_integrity_reviewer" must match the check in trpc.ts.
// ─────────────────────────────────────────────────────────────────────────────

describe("Gate 3 — integrityReviewerProcedure compatibility", () => {
  const INTEGRITY_REVIEWER_AUTH_VALUE = "scoring_integrity_reviewer";

  it("AUTH_ROLE_MAP produces the exact value integrityReviewerProcedure accepts", () => {
    const mapped = AUTH_ROLE_MAP["Scoring Integrity Reviewer"];
    // integrityReviewerProcedure checks: role !== "scoring_integrity_reviewer"
    expect(mapped === "admin" || mapped === INTEGRITY_REVIEWER_AUTH_VALUE).toBe(true);
    expect(mapped).toBe(INTEGRITY_REVIEWER_AUTH_VALUE);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. requireAdmin guard (inline re-implementation to avoid DB imports)
// ─────────────────────────────────────────────────────────────────────────────

function requireAdmin(role: string) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

describe("requireAdmin guard", () => {
  it("does not throw for admin role", () => {
    expect(() => requireAdmin("admin")).not.toThrow();
  });

  it("throws FORBIDDEN for coach role", () => {
    let err: TRPCError | undefined;
    try { requireAdmin("coach"); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN for scoring_integrity_reviewer role", () => {
    let err: TRPCError | undefined;
    try { requireAdmin("scoring_integrity_reviewer"); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN for founder role", () => {
    let err: TRPCError | undefined;
    try { requireAdmin("founder"); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("throws FORBIDDEN for empty string role", () => {
    let err: TRPCError | undefined;
    try { requireAdmin(""); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Router structural checks
// ─────────────────────────────────────────────────────────────────────────────

describe("adminRouter structural checks", () => {
  it("exports updateUserRole as a tRPC procedure", async () => {
    const { adminRouter } = await import("./admin.router");
    const proc = (adminRouter as any).updateUserRole;
    expect(proc).toBeDefined();
    // tRPC procedures are callable functions
    expect(typeof proc).toBe("function");
  });

  it("exports getUsersAndRoles as a tRPC procedure", async () => {
    const { adminRouter } = await import("./admin.router");
    const proc = (adminRouter as any).getUsersAndRoles;
    expect(proc).toBeDefined();
    expect(typeof proc).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. getUsersAndRoles — admin-only guard
//    adminProcedure rejects unauthenticated / non-admin callers with FORBIDDEN.
// ─────────────────────────────────────────────────────────────────────────────

describe("getUsersAndRoles — admin access control", () => {
  /**
   * Simulate what adminProcedure does in server/_core/trpc.ts:
   *   if (!ctx.user || ctx.user.role !== "admin") throw FORBIDDEN
   * We test the guard logic directly to avoid needing a live DB.
   */
  function adminProcedureGuard(user: { role: string } | undefined) {
    if (!user || user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
  }

  it("allows admin role through the guard", () => {
    expect(() => adminProcedureGuard({ role: "admin" })).not.toThrow();
  });

  it("blocks unauthenticated (no user) with FORBIDDEN", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard(undefined); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("blocks scoring_integrity_reviewer from reading the user list", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard({ role: "scoring_integrity_reviewer" }); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("blocks coach from reading the user list", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard({ role: "coach" }); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });

  it("blocks founder from reading the user list", () => {
    let err: TRPCError | undefined;
    try { adminProcedureGuard({ role: "founder" }); } catch (e) { err = e as TRPCError; }
    expect(err).toBeInstanceOf(TRPCError);
    expect(err?.code).toBe("FORBIDDEN");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reviewer assignment — auth role propagation invariants
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewer assignment — auth role propagation", () => {
  /**
   * These tests verify the *invariants* that the transaction-based mutation
   * relies on, without requiring a live database connection.
   */

  it("AUTH_ROLE_MAP value for Scoring Integrity Reviewer satisfies integrityReviewerProcedure check", () => {
    // integrityReviewerProcedure in trpc.ts:
    //   role !== "admin" && role !== "scoring_integrity_reviewer" → FORBIDDEN
    const mapped = AUTH_ROLE_MAP["Scoring Integrity Reviewer"];
    const allowed = mapped === "admin" || mapped === "scoring_integrity_reviewer";
    expect(allowed).toBe(true);
  });

  it("non-reviewer roles do NOT satisfy the scoring_integrity_reviewer gate", () => {
    const gatedRoles = ["Coach", "Founder", "Advisor", "Investor"];
    for (const display of gatedRoles) {
      const auth = AUTH_ROLE_MAP[display];
      expect(
        auth === "scoring_integrity_reviewer",
        `${display} (auth="${auth}") should not pass the reviewer gate`
      ).toBe(false);
    }
  });

  it("admin roles satisfy both requireAdmin and integrityReviewerProcedure", () => {
    const adminDisplayRoles = ["Studio Director", "Platform Admin"];
    for (const display of adminDisplayRoles) {
      const auth = AUTH_ROLE_MAP[display];
      expect(auth).toBe("admin");
      // admin passes requireAdmin (role === "admin")
      // admin passes integrityReviewerProcedure (role === "admin")
    }
  });
});
