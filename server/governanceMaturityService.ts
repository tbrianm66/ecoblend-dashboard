import { and, eq } from "drizzle-orm";
import {
  purposeCharters,
  missionLocks,
  governanceDirectors,
  boardPledges,
  reservedMatters,
  governanceDocuments,
  purposeDriftDetections,
  governanceReviewCycles,
  purposeMetrics,
  correctiveGovernanceActions,
  governanceMaturityScores,
} from "../drizzle/schema";
import { getDb } from "./db";

export interface MaturityResult {
  charterScore:          number;
  missionLockScore:      number;
  articlesScore:         number;
  boardPledgeScore:      number;
  reservedMattersScore:  number;
  investorPolicyScore:   number;
  purposeMetricsScore:   number;
  reviewCycleScore:      number;
  correctiveActionScore: number;
  totalScore:            number;
  maturityBand:          "foundation" | "developing" | "established" | "advanced";
  status:                "High Risk" | "At Risk" | "Developing" | "Strong";
  recommendation:        string;
  componentBreakdown:    Record<string, { weight: number; rawScore: number; weightedScore: number }>;
}

export async function computeGovernanceMaturityScore(ventureId: string): Promise<MaturityResult> {
  const db = (await getDb())!;

  // 1. Charter (15%) — draft=50, approved=100
  const charters = await db.select().from(purposeCharters).where(eq(purposeCharters.ventureId, ventureId));
  const approvedCharter = charters.some(c => c.approvalStatus === "approved");
  const draftCharter    = charters.length > 0;
  const charterRaw      = approvedCharter ? 100 : draftCharter ? 50 : 0;

  // 2. Mission lock (15%) — partial/in_progress=50, legally_binding=100
  const locks        = await db.select().from(missionLocks).where(eq(missionLocks.ventureId, ventureId));
  const binding      = locks.some(l => l.legalStatus === "legally_binding");
  const inProgress   = locks.some(l => l.implementationStatus === "in_progress" || l.implementationStatus === "complete");
  const missionRaw   = binding ? 100 : inProgress ? 50 : locks.length ? 35 : 0;

  // 3. Articles / constitutional controls (15%) — approved doc=100, draft=50
  const articles    = await db.select().from(governanceDocuments)
    .where(and(eq(governanceDocuments.ventureId, ventureId), eq(governanceDocuments.documentType, "articles_of_association")));
  const articlesRaw = articles.some(d => d.status === "approved") ? 100 : articles.length ? 50 : 0;

  // 4. Board pledge (10%) — all signed=100, ≥50%=50
  const directors  = await db.select().from(governanceDirectors).where(eq(governanceDirectors.ventureId, ventureId));
  const signed     = await db.select().from(boardPledges)
    .where(and(eq(boardPledges.ventureId, ventureId), eq(boardPledges.signedStatus, "signed")));
  const pledgeRaw  = directors.length === 0 ? 0
    : signed.length >= directors.length ? 100
    : signed.length / directors.length >= 0.5 ? 50 : 0;

  // 5. Reserved matters (10%) — ≥3 active=100, 1-2=50
  const matters    = await db.select().from(reservedMatters)
    .where(and(eq(reservedMatters.ventureId, ventureId), eq(reservedMatters.status, "active")));
  const mattersRaw = matters.length >= 3 ? 100 : matters.length >= 1 ? 50 : 0;

  // 6. Investor policy (10%) — approved doc=100, draft=50, no doc=0
  const invPolicy    = await db.select().from(governanceDocuments)
    .where(and(eq(governanceDocuments.ventureId, ventureId), eq(governanceDocuments.documentType, "investor_policy")));
  const invPolicyRaw = invPolicy.some(d => d.status === "approved") ? 100 : invPolicy.length ? 50 : 0;

  // 7. Purpose metrics (10%) — ≥3 active metrics=100, 1-2=50
  const metrics     = await db.select().from(purposeMetrics).where(eq(purposeMetrics.ventureId, ventureId));
  const metricsRaw  = metrics.length >= 3 ? 100 : metrics.length >= 1 ? 50 : 0;

  // 8. Review cycle (10%) — active cycle=100, none=0, overdue=0
  const reviews     = await db.select().from(governanceReviewCycles).where(eq(governanceReviewCycles.ventureId, ventureId));
  const overdue     = reviews.filter(r => r.reviewStatus === "overdue");
  const active      = reviews.filter(r => ["in_progress", "complete"].includes(r.reviewStatus ?? ""));
  const reviewRaw   = overdue.length > 0 ? 0 : active.length > 0 ? 100 : reviews.length > 0 ? 30 : 0;

  // 9. Corrective action process (5%) — active=100, open unresolved critical drift=0
  const openDrift      = await db.select().from(purposeDriftDetections)
    .where(and(eq(purposeDriftDetections.ventureId, ventureId), eq(purposeDriftDetections.status, "open")));
  const critUnassigned = openDrift.filter(d => d.severity === "critical" && !d.assignedTo);
  const actions        = await db.select().from(correctiveGovernanceActions)
    .where(eq(correctiveGovernanceActions.ventureId, ventureId));
  const correctiveRaw  = critUnassigned.length > 0 ? 0 : actions.length > 0 ? 100 : openDrift.length > 0 ? 50 : 100;

  // Weighted composite (matches test spec weights)
  const weights = {
    charter:         0.15,
    missionLock:     0.15,
    articles:        0.15,
    boardPledge:     0.10,
    reservedMatters: 0.10,
    investorPolicy:  0.10,
    purposeMetrics:  0.10,
    reviewCycle:     0.10,
    corrective:      0.05,
  };

  const total = Math.round(
    charterRaw      * weights.charter +
    missionRaw      * weights.missionLock +
    articlesRaw     * weights.articles +
    pledgeRaw       * weights.boardPledge +
    mattersRaw      * weights.reservedMatters +
    invPolicyRaw    * weights.investorPolicy +
    metricsRaw      * weights.purposeMetrics +
    reviewRaw       * weights.reviewCycle +
    correctiveRaw   * weights.corrective
  );

  const maturityBand: MaturityResult["maturityBand"] =
    total >= 75 ? "advanced" : total >= 50 ? "established" : total >= 25 ? "developing" : "foundation";

  const status: MaturityResult["status"] =
    total >= 75 ? "Strong" : total >= 50 ? "Developing" : total >= 25 ? "At Risk" : "High Risk";

  const recommendation = total >= 75
    ? "Governance maturity is sufficient for external investment consideration."
    : total >= 50
    ? "Core controls are in place but complete constitutional controls and board pledges before accepting capital."
    : total >= 25
    ? "Significant governance gaps exist. Complete charter, mission lock, and reserved matters before investor engagement."
    : "Do not accept external investment until constitutional controls, board mission pledge, investor policy, and governance review cycle are complete.";

  const result: MaturityResult = {
    charterScore:          Math.round(charterRaw  * weights.charter * 100) / 10,
    missionLockScore:      Math.round(missionRaw  * weights.missionLock * 100) / 10,
    articlesScore:         Math.round(articlesRaw * weights.articles * 100) / 10,
    boardPledgeScore:      Math.round(pledgeRaw   * weights.boardPledge * 100) / 10,
    reservedMattersScore:  Math.round(mattersRaw  * weights.reservedMatters * 100) / 10,
    investorPolicyScore:   Math.round(invPolicyRaw* weights.investorPolicy * 100) / 10,
    purposeMetricsScore:   Math.round(metricsRaw  * weights.purposeMetrics * 100) / 10,
    reviewCycleScore:      Math.round(reviewRaw   * weights.reviewCycle * 100) / 10,
    correctiveActionScore: Math.round(correctiveRaw * weights.corrective * 100) / 10,
    totalScore:            total,
    maturityBand,
    status,
    recommendation,
    componentBreakdown: {
      "Purpose Charter (15%)":                { weight: 15, rawScore: charterRaw,   weightedScore: Math.round(charterRaw   * weights.charter) },
      "Mission Lock Design (15%)":            { weight: 15, rawScore: missionRaw,   weightedScore: Math.round(missionRaw   * weights.missionLock) },
      "Articles / Constitutional (15%)":      { weight: 15, rawScore: articlesRaw,  weightedScore: Math.round(articlesRaw  * weights.articles) },
      "Board Mission Pledge (10%)":           { weight: 10, rawScore: pledgeRaw,    weightedScore: Math.round(pledgeRaw    * weights.boardPledge) },
      "Reserved Matters Register (10%)":      { weight: 10, rawScore: mattersRaw,   weightedScore: Math.round(mattersRaw   * weights.reservedMatters) },
      "Investor Policy (10%)":                { weight: 10, rawScore: invPolicyRaw, weightedScore: Math.round(invPolicyRaw * weights.investorPolicy) },
      "Purpose Metrics (10%)":                { weight: 10, rawScore: metricsRaw,   weightedScore: Math.round(metricsRaw   * weights.purposeMetrics) },
      "Governance Review Cycle (10%)":        { weight: 10, rawScore: reviewRaw,    weightedScore: Math.round(reviewRaw    * weights.reviewCycle) },
      "Corrective Action Process (5%)":       { weight:  5, rawScore: correctiveRaw,weightedScore: Math.round(correctiveRaw* weights.corrective) },
    },
  };

  // Persist snapshot
  await db.insert(governanceMaturityScores).values({
    ventureId,
    scoreDate:             new Date().toISOString().split("T")[0],
    charterScore:          result.charterScore,
    missionLockScore:      result.missionLockScore,
    articlesScore:         result.articlesScore,
    boardPledgeScore:      result.boardPledgeScore,
    reservedMattersScore:  result.reservedMattersScore,
    investorPolicyScore:   result.investorPolicyScore,
    purposeMetricsScore:   result.purposeMetricsScore,
    reviewCycleScore:      result.reviewCycleScore,
    correctiveActionScore: result.correctiveActionScore,
    totalScore:            total,
    maturityBand,
    status,
    recommendation,
  });

  return result;
}
