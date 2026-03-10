/**
 * Tests for Academic Research & Evidence tRPC procedures
 * Covers: listPapers, addPaper, deletePaper, listFellows, addFellow, deleteFellow,
 *         listPartnerships, addPartnership, deletePartnership, listClaims, addClaim, deleteClaim
 */
import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { db } from "./_core/context";

// Create a caller with no auth (public procedures)
const caller = appRouter.createCaller({ db, user: null } as any);

// ── Research Papers ───────────────────────────────────────────────────────────
describe("academic.papers", () => {
  it("listPapers returns an array", async () => {
    const papers = await caller.academic.listPapers();
    expect(Array.isArray(papers)).toBe(true);
  });

  it("addPaper and deletePaper round-trip", async () => {
    // Add
    await caller.academic.addPaper({
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

    // Delete
    await caller.academic.deletePaper({ id: added!.id });
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
    await caller.academic.addFellow({
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

    await caller.academic.deleteFellow({ id: added!.id });
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
    await caller.academic.addPartnership({
      universityName: "Test University",
      country: "UK",
      partnershipType: "Research Collaboration",
      status: "Prospective",
    });

    const partnerships = await caller.academic.listPartnerships();
    const added = partnerships.find(p => p.universityName === "Test University");
    expect(added).toBeDefined();
    expect(added?.country).toBe("UK");

    await caller.academic.deletePartnership({ id: added!.id });
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
    await caller.academic.addClaim({
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

    await caller.academic.deleteClaim({ id: added!.id });
    const after = await caller.academic.listClaims();
    expect(after.find(c => c.id === added!.id)).toBeUndefined();
  });
});
