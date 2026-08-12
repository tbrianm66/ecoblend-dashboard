/**
 * Tests for Academic Research & Evidence tRPC procedures
 * Covers: listPapers, addPaper, deletePaper, listFellows, addFellow, deleteFellow,
 *         listPartnerships, addPartnership, deletePartnership, listClaims, addClaim, deleteClaim
 */
import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { db } from "./_core/context";
import type { TrpcContext } from "./_core/context";

// Read-only caller (no auth — for list queries)
const caller = appRouter.createCaller({ db, user: null } as any);

// Authenticated caller for write mutations (addPaper, deletePaper, etc.)
const authCtx: TrpcContext = {
  user: { id: 1, openId: "test-admin", email: "admin@test.ecoblend.io", name: "Test Admin",
          loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
};
const callerAuth = appRouter.createCaller(authCtx);

// ── Research Papers ───────────────────────────────────────────────────────────
describe("academic.papers", () => {
  it("listPapers returns an array", async () => {
    const papers = await caller.academic.listPapers();
    expect(Array.isArray(papers)).toBe(true);
  });

  it("addPaper and deletePaper round-trip", async () => {
    // Add (auth required)
    await callerAuth.academic.addPaper({
      title: "Test Paper on VRL Frameworks",
      authors: "Smith, J., Jones, A.",
      year: 2024,
      category: "VRL Framework",
      evidenceType: "Peer Reviewed",
      relevanceScore: 8,
      ventureIds: "ecoblend",
    });

    const papers = await caller.academic.listPapers();
    const added = papers.find(p => p.title === "Test Paper on VRL Frameworks");
    expect(added).toBeDefined();
    expect(added?.authors).toBe("Smith, J., Jones, A.");
    expect(added?.relevanceScore).toBe(8);

    // Delete (auth required)
    await callerAuth.academic.deletePaper({ id: added!.id });
    const after = await caller.academic.listPapers();
    expect(after.find(p => p.id === added!.id)).toBeUndefined();
  });
});

// ── Fellow Researchers ────────────────────────────────────────────────────────
describe("academic.fellows", () => {
  it("listFellows returns an array", async () => {
    const fellows = await caller.academic.listFellows();
    expect(Array.isArray(fellows)).toBe(true);
  });

  it("addFellow and deleteFellow round-trip", async () => {
    await callerAuth.academic.addFellow({
      name: "Dr. Test Researcher",
      institution: "University of Testing",
      collaborationType: "Academic Advisor",
      status: "Active",
      publications: 12,
    });

    const fellows = await caller.academic.listFellows();
    const added = fellows.find(f => f.name === "Dr. Test Researcher");
    expect(added).toBeDefined();
    expect(added?.institution).toBe("University of Testing");

    await callerAuth.academic.deleteFellow({ id: added!.id });
    const after = await caller.academic.listFellows();
    expect(after.find(f => f.id === added!.id)).toBeUndefined();
  });
});

// ── University Partnerships ───────────────────────────────────────────────────
describe("academic.partnerships", () => {
  it("listPartnerships returns an array", async () => {
    const partnerships = await caller.academic.listPartnerships();
    expect(Array.isArray(partnerships)).toBe(true);
  });

  it("addPartnership and deletePartnership round-trip", async () => {
    await callerAuth.academic.addPartnership({
      universityName: "Test University",
      country: "UK",
      partnershipType: "Research Collaboration",
      status: "Prospective",
    });

    const partnerships = await caller.academic.listPartnerships();
    const added = partnerships.find(p => p.universityName === "Test University");
    expect(added).toBeDefined();
    expect(added?.country).toBe("UK");

    await callerAuth.academic.deletePartnership({ id: added!.id });
    const after = await caller.academic.listPartnerships();
    expect(after.find(p => p.id === added!.id)).toBeUndefined();
  });
});

// ── Evidence Claims ───────────────────────────────────────────────────────────
describe("academic.claims", () => {
  it("listClaims returns an array", async () => {
    const claims = await caller.academic.listClaims();
    expect(Array.isArray(claims)).toBe(true);
  });

  it("addClaim and deleteClaim round-trip", async () => {
    await callerAuth.academic.addClaim({
      ventureId: "ecoblend",
      claimText: "Market research confirms demand for eco-friendly blending solutions.",
      claimType: "Market Validation",
      trlLevel: 4,
      vrlStage: 2,
      strength: "Strong",
    });

    const claims = await caller.academic.listClaims();
    const added = claims.find(c => c.ventureId === "ecoblend" && c.claimText.includes("eco-friendly blending"));
    expect(added).toBeDefined();
    expect(added?.strength).toBe("Strong");
    expect(added?.trlLevel).toBe(4);

    await callerAuth.academic.deleteClaim({ id: added!.id });
    const after = await caller.academic.listClaims();
    expect(after.find(c => c.id === added!.id)).toBeUndefined();
  });
});
