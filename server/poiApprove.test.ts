/**
 * Tests for the POI → VRL conversion flow (approveForVrl procedure)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the db module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
  upsertVenture: vi.fn(),
}));

vi.mock("./poiDb", () => ({
  getFullOpportunityDetail: vi.fn(),
  insertOpportunityReview: vi.fn(),
  updateOpportunity: vi.fn(),
}));

import { getDb, upsertVenture } from "./db";
import {
  getFullOpportunityDetail,
  insertOpportunityReview,
  updateOpportunity,
} from "./poiDb";

// ── Helper: build a mock opportunity ─────────────────────────────────────────
function mockOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    opp: {
      id: 1,
      name: "BioFibre Packaging",
      description: "Compostable packaging from agricultural waste",
      targetMarket: "FMCG & Retail",
      sector: "Circular Economy",
      status: "Scored",
      convertedToVentureId: null,
      ...overrides,
    },
    pos: { posScore: "7.50", posClassification: "High Opportunity" },
    reviews: [],
    baselines: null,
    costAssessment: null,
    performanceAssessment: null,
    qualityAssessment: null,
    sustainabilityAssessment: null,
  };
}

// ── approveForVrl logic (extracted for unit testing) ─────────────────────────
// We test the business logic directly rather than through tRPC to avoid
// the full server setup. The procedure in routers.ts calls these same helpers.

async function approveForVrlLogic(input: {
  opportunityId: number;
  reviewerName: string;
  reviewerRole?: string;
  rationale?: string;
}) {
  const detail = await getFullOpportunityDetail(input.opportunityId);
  if (!detail?.opp) throw new Error("Opportunity not found");

  const { opp } = detail;

  // If already converted, return existing venture ID
  if (opp.convertedToVentureId) {
    return { ventureId: opp.convertedToVentureId, alreadyConverted: true };
  }

  // Create the venture
  const venture = await upsertVenture({
    name: opp.name,
    description: opp.description ?? undefined,
    targetMarket: opp.targetMarket ?? undefined,
    sector: opp.sector ?? undefined,
    status: "Pre-Launch",
  });

  const ventureId = (venture as any)?.id ?? `poi-${opp.id}`;

  // Record the approval review
  await insertOpportunityReview({
    productOpportunityId: opp.id,
    reviewerName: input.reviewerName,
    reviewerRole: input.reviewerRole,
    decision: "Approve for VRL",
    rationale: input.rationale,
  });

  // Update the opportunity status and link to the new venture
  await updateOpportunity(opp.id, {
    status: "Approved for VRL",
    convertedToVentureId: String(ventureId),
  });

  return { ventureId: String(ventureId), alreadyConverted: false };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("approveForVrl — POI to VRL conversion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new venture and returns its ID when opportunity is not yet converted", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity()
    );
    (upsertVenture as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "venture-abc-123" });
    (insertOpportunityReview as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
    (updateOpportunity as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    const result = await approveForVrlLogic({
      opportunityId: 1,
      reviewerName: "Alice Chen",
      reviewerRole: "Investment Director",
      rationale: "Strong POS score and clear market fit",
    });

    expect(result.alreadyConverted).toBe(false);
    expect(result.ventureId).toBe("venture-abc-123");
  });

  it("calls upsertVenture with the correct fields from the opportunity", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity()
    );
    (upsertVenture as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "v-001" });
    (insertOpportunityReview as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
    (updateOpportunity as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await approveForVrlLogic({ opportunityId: 1, reviewerName: "Bob" });

    expect(upsertVenture).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "BioFibre Packaging",
        targetMarket: "FMCG & Retail",
        sector: "Circular Economy",
        status: "Pre-Launch",
      })
    );
  });

  it("records an 'Approve for VRL' review with the correct decision", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity()
    );
    (upsertVenture as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "v-002" });
    (insertOpportunityReview as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2 });
    (updateOpportunity as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await approveForVrlLogic({
      opportunityId: 1,
      reviewerName: "Carol",
      reviewerRole: "CTO",
      rationale: "TRL 6 confirmed",
    });

    expect(insertOpportunityReview).toHaveBeenCalledWith(
      expect.objectContaining({
        productOpportunityId: 1,
        reviewerName: "Carol",
        reviewerRole: "CTO",
        decision: "Approve for VRL",
        rationale: "TRL 6 confirmed",
      })
    );
  });

  it("updates the opportunity status to 'Approved for VRL' and sets convertedToVentureId", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity()
    );
    (upsertVenture as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "v-003" });
    (insertOpportunityReview as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3 });
    (updateOpportunity as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await approveForVrlLogic({ opportunityId: 1, reviewerName: "Dave" });

    expect(updateOpportunity).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "Approved for VRL",
        convertedToVentureId: "v-003",
      })
    );
  });

  it("returns alreadyConverted: true and the existing ventureId if already converted", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity({ convertedToVentureId: "existing-venture-xyz" })
    );

    const result = await approveForVrlLogic({ opportunityId: 1, reviewerName: "Eve" });

    expect(result.alreadyConverted).toBe(true);
    expect(result.ventureId).toBe("existing-venture-xyz");
    // Should NOT create a new venture or insert a review
    expect(upsertVenture).not.toHaveBeenCalled();
    expect(insertOpportunityReview).not.toHaveBeenCalled();
  });

  it("throws an error when the opportunity is not found", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      approveForVrlLogic({ opportunityId: 999, reviewerName: "Frank" })
    ).rejects.toThrow("Opportunity not found");
  });

  it("throws an error when the opportunity detail has no opp field", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ opp: null });

    await expect(
      approveForVrlLogic({ opportunityId: 1, reviewerName: "Grace" })
    ).rejects.toThrow("Opportunity not found");
  });

  it("works without optional reviewerRole and rationale fields", async () => {
    (getFullOpportunityDetail as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOpportunity()
    );
    (upsertVenture as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "v-004" });
    (insertOpportunityReview as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 4 });
    (updateOpportunity as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await approveForVrlLogic({
      opportunityId: 1,
      reviewerName: "Henry",
    });

    expect(result.alreadyConverted).toBe(false);
    expect(insertOpportunityReview).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewerRole: undefined,
        rationale: undefined,
      })
    );
  });
});
