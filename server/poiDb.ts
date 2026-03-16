// ─────────────────────────────────────────────────────────────────────────────
// POI MODULE — Database Helpers
// Product Opportunity Intelligence: pipeline, assessment, scoring, review
// POS = (Cost + Performance + Quality + Sustainability) / 4  (each 1–5)
// ─────────────────────────────────────────────────────────────────────────────

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  productCategories,
  productOpportunities,
  productBaselines,
  costAssessments,
  performanceAssessments,
  qualityAssessments,
  sustainabilityAssessments,
  productOpportunityScores,
  opportunityReviews,
  InsertProductCategory,
  InsertProductOpportunity,
  InsertProductBaseline,
  InsertCostAssessment,
  InsertPerformanceAssessment,
  InsertQualityAssessment,
  InsertSustainabilityAssessment,
  InsertOpportunityReview,
} from "../drizzle/schema";

// ── Product Categories ────────────────────────────────────────────────────────
export async function getAllProductCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCategories).orderBy(productCategories.name);
}

export async function insertProductCategory(data: InsertProductCategory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(productCategories).values(data);
}

// ── Product Opportunities ─────────────────────────────────────────────────────
export async function getAllProductOpportunities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productOpportunities).orderBy(desc(productOpportunities.createdAt));
}

export async function getProductOpportunityById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(productOpportunities).where(eq(productOpportunities.id, id));
  return rows[0] ?? null;
}

export async function insertProductOpportunity(data: InsertProductOpportunity) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(productOpportunities).values(data);
  return (result as any).insertId as number;
}

export async function updateProductOpportunity(id: number, data: Partial<InsertProductOpportunity>) {
  const db = await getDb();
  if (!db) return;
  await db.update(productOpportunities).set(data).where(eq(productOpportunities.id, id));
}

export async function deleteProductOpportunity(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productOpportunities).where(eq(productOpportunities.id, id));
}

// ── Product Baselines ─────────────────────────────────────────────────────────
export async function getBaselineForOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(productBaselines).where(eq(productBaselines.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function upsertProductBaseline(data: InsertProductBaseline) {
  const db = await getDb();
  if (!db) return;
  const existing = await getBaselineForOpportunity(data.productOpportunityId);
  if (existing) {
    await db.update(productBaselines).set(data).where(eq(productBaselines.productOpportunityId, data.productOpportunityId));
  } else {
    await db.insert(productBaselines).values(data);
  }
}

// ── Cost Assessment ───────────────────────────────────────────────────────────
export async function getCostAssessment(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(costAssessments).where(eq(costAssessments.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function upsertCostAssessment(data: InsertCostAssessment) {
  const db = await getDb();
  if (!db) return;
  const costScore = ((data.manufacturingCostScore ?? 1) + (data.supplyChainCostScore ?? 1) + (data.lifecycleCostScore ?? 1)) / 3;
  const payload = { ...data, costScore };
  const existing = await getCostAssessment(data.productOpportunityId);
  if (existing) {
    await db.update(costAssessments).set(payload).where(eq(costAssessments.productOpportunityId, data.productOpportunityId));
  } else {
    await db.insert(costAssessments).values(payload);
  }
  await recomputePosScore(data.productOpportunityId);
}

// ── Performance Assessment ────────────────────────────────────────────────────
export async function getPerformanceAssessment(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(performanceAssessments).where(eq(performanceAssessments.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function upsertPerformanceAssessment(data: InsertPerformanceAssessment) {
  const db = await getDb();
  if (!db) return;
  const performanceScore = ((data.technicalCapabilityScore ?? 1) + (data.efficiencyScore ?? 1) + (data.functionalityScore ?? 1)) / 3;
  const payload = { ...data, performanceScore };
  const existing = await getPerformanceAssessment(data.productOpportunityId);
  if (existing) {
    await db.update(performanceAssessments).set(payload).where(eq(performanceAssessments.productOpportunityId, data.productOpportunityId));
  } else {
    await db.insert(performanceAssessments).values(payload);
  }
  await recomputePosScore(data.productOpportunityId);
}

// ── Quality Assessment ────────────────────────────────────────────────────────
export async function getQualityAssessment(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(qualityAssessments).where(eq(qualityAssessments.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function upsertQualityAssessment(data: InsertQualityAssessment) {
  const db = await getDb();
  if (!db) return;
  const qualityScore = ((data.reliabilityScore ?? 1) + (data.durabilityScore ?? 1) + (data.userExperienceScore ?? 1)) / 3;
  const payload = { ...data, qualityScore };
  const existing = await getQualityAssessment(data.productOpportunityId);
  if (existing) {
    await db.update(qualityAssessments).set(payload).where(eq(qualityAssessments.productOpportunityId, data.productOpportunityId));
  } else {
    await db.insert(qualityAssessments).values(payload);
  }
  await recomputePosScore(data.productOpportunityId);
}

// ── Sustainability Assessment ─────────────────────────────────────────────────
export async function getSustainabilityAssessment(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sustainabilityAssessments).where(eq(sustainabilityAssessments.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function upsertSustainabilityAssessment(data: InsertSustainabilityAssessment) {
  const db = await getDb();
  if (!db) return;
  const sustainabilityScore = ((data.carbonFootprintScore ?? 1) + (data.esgComplianceScore ?? 1) + (data.circularityScore ?? 1)) / 3;
  const payload = { ...data, sustainabilityScore };
  const existing = await getSustainabilityAssessment(data.productOpportunityId);
  if (existing) {
    await db.update(sustainabilityAssessments).set(payload).where(eq(sustainabilityAssessments.productOpportunityId, data.productOpportunityId));
  } else {
    await db.insert(sustainabilityAssessments).values(payload);
  }
  await recomputePosScore(data.productOpportunityId);
}

// ── POS Score Computation ─────────────────────────────────────────────────────
// POS = (Cost + Performance + Quality + Sustainability) / 4
export async function recomputePosScore(opportunityId: number) {
  const db = await getDb();
  if (!db) return;

  const [cost, perf, qual, sust] = await Promise.all([
    getCostAssessment(opportunityId),
    getPerformanceAssessment(opportunityId),
    getQualityAssessment(opportunityId),
    getSustainabilityAssessment(opportunityId),
  ]);

  const scores = [
    cost?.costScore ?? null,
    perf?.performanceScore ?? null,
    qual?.qualityScore ?? null,
    sust?.sustainabilityScore ?? null,
  ].filter((s): s is number => s !== null);

  if (scores.length === 0) return;

  const posScore = scores.reduce((a, b) => a + b, 0) / 4; // always divide by 4 for consistent scale

  let posClassification: "Low Opportunity" | "Moderate Opportunity" | "High Opportunity" | "Exceptional Opportunity" = "Low Opportunity";
  if (posScore >= 4.1) posClassification = "Exceptional Opportunity";
  else if (posScore >= 3.1) posClassification = "High Opportunity";
  else if (posScore >= 2.1) posClassification = "Moderate Opportunity";

  const payload = {
    productOpportunityId: opportunityId,
    costScore: cost?.costScore ?? 0,
    performanceScore: perf?.performanceScore ?? 0,
    qualityScore: qual?.qualityScore ?? 0,
    sustainabilityScore: sust?.sustainabilityScore ?? 0,
    posScore,
    posClassification,
  };

  const existing = await getPosScore(opportunityId);
  if (existing) {
    await db.update(productOpportunityScores).set(payload).where(eq(productOpportunityScores.productOpportunityId, opportunityId));
  } else {
    await db.insert(productOpportunityScores).values(payload);
  }
}

export async function getPosScore(opportunityId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(productOpportunityScores).where(eq(productOpportunityScores.productOpportunityId, opportunityId));
  return rows[0] ?? null;
}

export async function getAllPosScores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productOpportunityScores).orderBy(desc(productOpportunityScores.posScore));
}

// ── Opportunity Reviews ───────────────────────────────────────────────────────
export async function getReviewsForOpportunity(opportunityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunityReviews)
    .where(eq(opportunityReviews.productOpportunityId, opportunityId))
    .orderBy(desc(opportunityReviews.reviewedAt));
}

export async function insertOpportunityReview(data: InsertOpportunityReview) {
  const db = await getDb();
  if (!db) return;
  await db.insert(opportunityReviews).values(data);

  // If approved, update the opportunity status
  if (data.decision === "Approve for VRL") {
    await updateProductOpportunity(data.productOpportunityId, { status: "Approved for VRL" });
  } else if (data.decision === "Reject") {
    await updateProductOpportunity(data.productOpportunityId, { status: "Rejected" });
  }
}

// ── Full opportunity detail (all assessments joined) ─────────────────────────
export async function getFullOpportunityDetail(id: number) {
  const [opp, baseline, cost, perf, qual, sust, pos, reviews] = await Promise.all([
    getProductOpportunityById(id),
    getBaselineForOpportunity(id),
    getCostAssessment(id),
    getPerformanceAssessment(id),
    getQualityAssessment(id),
    getSustainabilityAssessment(id),
    getPosScore(id),
    getReviewsForOpportunity(id),
  ]);
  return { opp, baseline, cost, perf, qual, sust, pos, reviews };
}
