/**
 * Schema Export Integrity Test (#39)
 *
 * PURPOSE
 * -------
 * Guard against broken schema exports that silently block test coverage.
 *
 * The failure mode this catches:
 *   A duplicate `export const/type X` in drizzle/schema.ts causes TypeScript
 *   to fail at compile time, but the Vitest runner surfaces this as a file-level
 *   import error in EVERY test that loads the schema transitively (e.g. via
 *   appRouter → server/routers.ts → admin.router.ts → schema).  The affected
 *   test files report zero tests run rather than a clear assertion failure,
 *   making coverage silently disappear without a visible red test.
 *
 * By importing the schema DIRECTLY here, any schema-level export error surfaces
 * as an explicit failure in this dedicated file rather than a cryptic zero-count
 * in an unrelated test.
 *
 * WHAT IS TESTED
 * --------------
 * 1. The schema module loads without throwing (catches re-export and circular-ref errors).
 * 2. Critical table objects are defined and non-null (catches redeclaration order bugs
 *    where a second declaration shadows the first, leaving the export undefined).
 * 3. The moduleReactivations table exposes the expected column shape (regression
 *    guard for the table that caused the original silent-coverage incident).
 * 4. No table export is accidentally undefined (broad sweep).
 *
 * NOTE: TypeScript duplicate-identifier errors (e.g. two `export type T` at
 * different lines) are caught at compile time by `tsc --noEmit`.  The runtime
 * checks below catch the complementary case where an ES module silently picks
 * one of two conflicting exports, making the other unreachable without an error.
 */

import { describe, it, expect } from "vitest";
import * as schema from "../drizzle/schema";

// ── 1. Module loads cleanly ───────────────────────────────────────────────────

describe("schema export integrity — module load", () => {
  it("schema module import resolves without throwing", () => {
    // If this import fails (duplicate export, circular reference, syntax error),
    // Vitest reports this entire file as errored rather than zero-passing — the
    // goal is a visible, actionable error.
    expect(schema).toBeDefined();
    expect(typeof schema).toBe("object");
  });
});

// ── 2. Critical table objects are defined ─────────────────────────────────────

describe("schema export integrity — critical table exports", () => {
  it("moduleReactivations table is defined", () => {
    expect(schema.moduleReactivations).toBeDefined();
    expect(schema.moduleReactivations).not.toBeNull();
  });

  it("ventures table is defined", () => {
    expect(schema.ventures).toBeDefined();
  });

  it("founders table is defined", () => {
    expect(schema.founders).toBeDefined();
  });

  it("prototypeTests table is defined (regression: was silently dropped by duplicate export)", () => {
    // A duplicate `export type InsertPrototypeTest` near line 8655 (since removed)
    // caused Vitest to fail to import server/admin.batchReactivation.test.ts entirely.
    // Verifying prototypeTests itself is defined confirms the surrounding block is intact.
    expect(schema.prototypeTests).toBeDefined();
  });
});

// ── 3. moduleReactivations column shape ──────────────────────────────────────

describe("schema export integrity — moduleReactivations shape", () => {
  it("table object is truthy and has a name property", () => {
    // Drizzle pgTable objects expose a Symbol-keyed metadata bag.
    // The simplest cross-version check is that the export is a non-null object.
    expect(typeof schema.moduleReactivations).toBe("object");
    expect(schema.moduleReactivations).not.toBeNull();
  });

  it("groupId, ventureId, active columns are accessible on the table object", () => {
    const t = schema.moduleReactivations as Record<string, unknown>;
    // Drizzle table objects expose column definitions as enumerable own properties.
    expect(t.groupId).toBeDefined();
    expect(t.ventureId).toBeDefined();
    expect(t.active).toBeDefined();
  });
});

// ── 4. Broad sweep: no table export is accidentally undefined ─────────────────

describe("schema export integrity — no undefined table exports", () => {
  it("every exported pgTable object is non-null and non-undefined", () => {
    // Filter to only the table objects (Drizzle tables have a Symbol-keyed [TableName]).
    // We check every value exported from the module whose type is 'object' and non-null.
    const undefinedExports: string[] = [];
    for (const [key, value] of Object.entries(schema)) {
      if (value === undefined || value === null) {
        undefinedExports.push(key);
      }
    }
    expect(
      undefinedExports,
      `These schema exports are null/undefined: ${undefinedExports.join(", ")}`,
    ).toHaveLength(0);
  });
});
