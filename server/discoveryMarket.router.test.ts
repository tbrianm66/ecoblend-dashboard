/**
 * Discovery & Market Module — Authorization Test Suite
 *
 * Verifies the venture access model for write operations:
 *   - reads stay public
 *   - mutations require an authenticated user (protectedProcedure)
 *   - mutations verify the caller is authorised for the target venture
 *     (admin bypass, membership, first-touch claim, else FORBIDDEN)
 */
import { describe, it, expect, vi } from "vitest";
import { discoveryMarketRouter, assertVentureAccess } from "./discoveryMarket.router";

// Mock the DB module so importing the router never opens a real connection.
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Fake DB for assertVentureAccess unit tests ──────────────────────────────
// Each `select(...).from(...).where(...).limit(...)` resolves to the next array
// in `selectResults` (in call order). `insert(...).values(v)` records `v`.
function fakeDb(selectResults: unknown[][]) {
  let i = 0;
  const inserts: unknown[] = [];
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(selectResults[i++] ?? []),
        }),
      }),
    }),
    insert: () => ({
      values: (v: unknown) => {
        inserts.push(v);
        return { onConflictDoNothing: () => Promise.resolve(undefined) };
      },
    }),
    __inserts: inserts,
  };
  return db as any;
}

const admin = { id: 1, role: "admin" as const };
const member = { id: 2, role: "user" as const };
const stranger = { id: 3, role: "user" as const };

describe("assertVentureAccess", () => {
  it("throws NOT_FOUND when the venture does not exist", async () => {
    const d = fakeDb([[]]); // venture lookup -> empty
    await expect(assertVentureAccess(d, admin, "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("allows admins on any existing venture without a membership row", async () => {
    const d = fakeDb([[{ id: "v1" }]]); // venture exists
    await expect(assertVentureAccess(d, admin, "v1")).resolves.toBeUndefined();
    expect(d.__inserts).toHaveLength(0);
  });

  it("allows a user with an existing membership row", async () => {
    const d = fakeDb([
      [{ id: "v1" }], // venture exists
      [{ id: 99 }], // membership found
    ]);
    await expect(assertVentureAccess(d, member, "v1")).resolves.toBeUndefined();
    expect(d.__inserts).toHaveLength(0);
  });

  it("claims an unclaimed venture for the first authenticated editor", async () => {
    const d = fakeDb([
      [{ id: "v1" }], // venture exists
      [], // no membership for this user
      [], // venture has no members at all -> unclaimed
    ]);
    await expect(assertVentureAccess(d, member, "v1")).resolves.toBeUndefined();
    expect(d.__inserts).toEqual([
      { ventureId: "v1", userId: member.id, role: "owner" },
    ]);
  });

  it("denies a non-member on a venture that already has members", async () => {
    const d = fakeDb([
      [{ id: "v1" }], // venture exists
      [], // no membership for this user
      [{ id: 5 }], // venture already claimed by someone else
    ]);
    await expect(assertVentureAccess(d, stranger, "v1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(d.__inserts).toHaveLength(0);
  });
});

// ─── End-to-end: protectedProcedure rejects unauthenticated callers ──────────
describe("discoveryMarket mutations require authentication", () => {
  const anonCaller = discoveryMarketRouter.createCaller({ user: null } as any);

  it("rejects an unauthenticated segment upsert", async () => {
    await expect(
      anonCaller.segments.upsert({ ventureId: "v1", segmentName: "x" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an unauthenticated segment delete", async () => {
    await expect(
      anonCaller.segments.delete({ id: 1, ventureId: "v1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
