/**
 * Command Centre Dashboard — Database Helpers
 * Aggregates live data from all modules for the Command Centre dashboard
 */
import { getDb } from "./db";
import {
  ventures, financialSnapshots, irlScores, esgMetrics,
  productOpportunities, productOpportunityScores, opportunityReviews,
  venturePrograms, ventureTasks, ventureMilestones,
  executionRisks, ecosystemMapNodes, certificationTracking,
  experiments,
} from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// ── Portfolio Summary ─────────────────────────────────────────────────────────

export async function getPortfolioSummary() {
  const db = await getDb();
  if (!db) return null;

  const allVentures = await db.select().from(ventures);

  const active = allVentures.filter(v => v.status === "Active");
  const prelaunch = allVentures.filter(v => v.status === "Pre-Launch");
  const scaling = allVentures.filter(v => v.status === "Scaling");
  const paused = allVentures.filter(v => v.status === "Paused");
  const investmentReady = allVentures.filter(v => v.investmentReady);

  const avgVrl = allVentures.length > 0
    ? allVentures.reduce((s, v) => s + (v.vrl ?? 1), 0) / allVentures.length
    : 0;
  const avgTrl = allVentures.length > 0
    ? allVentures.reduce((s, v) => s + (v.trl ?? 1), 0) / allVentures.length
    : 0;

  return {
    total: allVentures.length,
    active: active.length,
    prelaunch: prelaunch.length,
    scaling: scaling.length,
    paused: paused.length,
    investmentReady: investmentReady.length,
    avgVrl: Math.round(avgVrl * 10) / 10,
    avgTrl: Math.round(avgTrl * 10) / 10,
    ventures: allVentures.map(v => ({
      id: v.id,
      name: v.name,
      color: v.color,
      status: v.status,
      vrl: v.vrl,
      trl: v.trl,
      lifecycleStage: v.lifecycleStage,
      investmentReady: v.investmentReady,
      strategicClassification: v.strategicClassification,
      productMarketFitSignal: v.productMarketFitSignal,
      experimentPassRate: v.experimentPassRate,
    })),
  };
}

// ── VRL Stage Distribution ────────────────────────────────────────────────────

export async function getVrlDistribution() {
  const db = await getDb();
  if (!db) return null;

  const allVentures = await db.select({
    id: ventures.id,
    name: ventures.name,
    color: ventures.color,
    vrl: ventures.vrl,
    vrlPercent: ventures.vrlPercent,
    trl: ventures.trl,
    status: ventures.status,
  }).from(ventures);

  const vrlStageLabels: Record<number, string> = {
    1: "Concept", 2: "Validation", 3: "Prototype", 4: "Pilot",
    5: "Market Entry", 6: "Growth", 7: "Scale", 8: "Expansion", 9: "Maturity",
  };

  const distribution = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(stage => ({
    stage,
    label: vrlStageLabels[stage] ?? `Stage ${stage}`,
    count: allVentures.filter(v => v.vrl === stage).length,
    ventures: allVentures.filter(v => v.vrl === stage).map(v => v.name),
  }));

  const syncGaps = allVentures.map(v => ({
    id: v.id,
    name: v.name,
    color: v.color ?? "#51AF37",
    vrl: v.vrl ?? 1,
    trl: v.trl ?? 1,
    gap: Math.abs((v.trl ?? 1) - (v.vrl ?? 1)),
    status: v.status,
  }));

  return { distribution, syncGaps, ventures: allVentures };
}

// ── Opportunity Funnel (POI) ──────────────────────────────────────────────────

export async function getOpportunityFunnel() {
  const db = await getDb();
  if (!db) return null;

  const [allOpps, scoredOpps, reviews] = await Promise.all([
    db.select({
      id: productOpportunities.id,
      name: productOpportunities.name,
      status: productOpportunities.status,
      targetMarket: productOpportunities.targetMarket,
      createdAt: productOpportunities.createdAt,
    }).from(productOpportunities),
    db.select({
      productOpportunityId: productOpportunityScores.productOpportunityId,
      posScore: productOpportunityScores.posScore,
      posClassification: productOpportunityScores.posClassification,
    }).from(productOpportunityScores),
    db.select({
      productOpportunityId: opportunityReviews.productOpportunityId,
      decision: opportunityReviews.decision,
    }).from(opportunityReviews),
  ]);

  const identified = allOpps.length;
  const scored = scoredOpps.length;
  const approved = reviews.filter(r => r.decision === "Approve for VRL").length;
  const rejected = reviews.filter(r => r.decision === "Reject").length;
  const deferred = reviews.filter(r => r.decision === "Defer").length;

  const avgPos = scoredOpps.length > 0
    ? scoredOpps.reduce((s, o) => s + (o.posScore ?? 0), 0) / scoredOpps.length
    : 0;

  const classificationBreakdown = {
    exceptional: scoredOpps.filter(o => o.posClassification === "Exceptional Opportunity").length,
    high: scoredOpps.filter(o => o.posClassification === "High Opportunity").length,
    moderate: scoredOpps.filter(o => o.posClassification === "Moderate Opportunity").length,
    low: scoredOpps.filter(o => o.posClassification === "Low Opportunity").length,
  };

  return {
    identified,
    scored,
    approved,
    rejected,
    deferred,
    avgPos: Math.round(avgPos * 10) / 10,
    classificationBreakdown,
    conversionRate: identified > 0 ? Math.round((approved / identified) * 100) : 0,
    recentOpps: allOpps.slice(0, 5).map(o => ({
      ...o,
      posScore: scoredOpps.find(s => s.productOpportunityId === o.id)?.posScore ?? null,
      posClassification: scoredOpps.find(s => s.productOpportunityId === o.id)?.posClassification ?? null,
    })),
  };
}

// ── Project Management Health ─────────────────────────────────────────────────

export async function getPmHealth() {
  const db = await getDb();
  if (!db) return null;

  const [programs, tasks, pmMilestones, execRisks] = await Promise.all([
    db.select({
      id: venturePrograms.id,
      name: venturePrograms.name,
      status: venturePrograms.status,
      budget: venturePrograms.budget,
      budgetSpent: venturePrograms.budgetSpent,
      ventureId: venturePrograms.ventureId,
    }).from(venturePrograms),
    db.select({
      id: ventureTasks.id,
      kanbanStatus: ventureTasks.kanbanStatus,
      dueDate: ventureTasks.dueDate,
      priority: ventureTasks.priority,
    }).from(ventureTasks),
    db.select({
      id: ventureMilestones.id,
      status: ventureMilestones.status,
      targetDate: ventureMilestones.targetDate,
    }).from(ventureMilestones),
    db.select({
      id: executionRisks.id,
      riskLevel: executionRisks.riskLevel,
      status: executionRisks.status,
    }).from(executionRisks),
  ]);

  const activePrograms = programs.filter(p => p.status === "In Progress").length;
  const completedPrograms = programs.filter(p => p.status === "Completed").length;

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(t =>
    t.dueDate && t.dueDate < today && t.kanbanStatus !== "Done"
  ).length;
  const doneTasks = tasks.filter(t => t.kanbanStatus === "Done").length;
  const totalTasks = tasks.length;

  const completedMilestones = pmMilestones.filter(m => m.status === "Completed").length;
  const overdueMilestones = pmMilestones.filter(m =>
    m.targetDate && m.targetDate < today && m.status !== "Completed"
  ).length;

  const criticalRisks = execRisks.filter(r => r.riskLevel === "Critical" && r.status === "Open").length;
  const highRisks = execRisks.filter(r => r.riskLevel === "High" && r.status === "Open").length;

  const totalBudget = programs.reduce((s, p) => s + (p.budget ?? 0), 0);
  const totalSpent = programs.reduce((s, p) => s + (p.budgetSpent ?? 0), 0);
  const budgetUtilisation = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return {
    totalPrograms: programs.length,
    activePrograms,
    completedPrograms,
    totalTasks,
    doneTasks,
    overdueTasks,
    taskCompletionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    totalMilestones: pmMilestones.length,
    completedMilestones,
    overdueMilestones,
    criticalRisks,
    highRisks,
    totalBudget,
    totalSpent,
    budgetUtilisation,
  };
}

// ── Financial Performance ─────────────────────────────────────────────────────

export async function getFinancialPerformance() {
  const db = await getDb();
  if (!db) return null;

  const allSnapshots = await db.select().from(financialSnapshots)
    .orderBy(desc(financialSnapshots.month));

  // Deduplicate to latest per venture
  const latestByVenture = new Map<string, typeof allSnapshots[0]>();
  for (const snap of allSnapshots) {
    if (!latestByVenture.has(snap.ventureId)) {
      latestByVenture.set(snap.ventureId, snap);
    }
  }
  const latest = Array.from(latestByVenture.values());

  const totalRevenue = latest.reduce((s, f) => s + (f.revenueActual ?? 0), 0);
  const totalTarget = latest.reduce((s, f) => s + (f.revenueTarget ?? 0), 0);
  const totalInvestment = latest.reduce((s, f) => s + (f.investmentRaised ?? 0), 0);
  const totalBurn = latest.reduce((s, f) => s + (f.monthlyBurn ?? 0), 0);
  const avgRunway = latest.length > 0
    ? latest.reduce((s, f) => s + (f.cashRunway ?? 0), 0) / latest.length
    : 0;

  const revenueAchievement = totalTarget > 0
    ? Math.round((totalRevenue / totalTarget) * 100)
    : 0;

  // Monthly trend (last 6 months across portfolio)
  const monthlyTrend: Record<string, { revenue: number; burn: number }> = {};
  for (const snap of allSnapshots) {
    if (!monthlyTrend[snap.month]) {
      monthlyTrend[snap.month] = { revenue: 0, burn: 0 };
    }
    monthlyTrend[snap.month].revenue += snap.revenueActual ?? 0;
    monthlyTrend[snap.month].burn += snap.monthlyBurn ?? 0;
  }
  const trendMonths = Object.keys(monthlyTrend).sort().slice(-6).map(month => ({
    month,
    revenue: monthlyTrend[month].revenue,
    burn: monthlyTrend[month].burn,
  }));

  return {
    totalRevenue,
    totalTarget,
    totalInvestment,
    totalBurn,
    avgRunway: Math.round(avgRunway),
    revenueAchievement,
    trendMonths,
    ventureBreakdown: latest.map(f => ({
      ventureId: f.ventureId,
      month: f.month,
      revenueActual: f.revenueActual ?? 0,
      revenueTarget: f.revenueTarget ?? 0,
      monthlyBurn: f.monthlyBurn ?? 0,
      cashRunway: f.cashRunway ?? 0,
      investmentRaised: f.investmentRaised ?? 0,
    })),
  };
}

// ── Per-Venture Revenue Sparklines ──────────────────────────────────────────

export async function getVentureRevenueSparklines() {
  const db = await getDb();
  if (!db) return [];

  // Fetch all ventures (for name + color) and all snapshots
  const [allVentures, allSnapshots] = await Promise.all([
    db.select().from(ventures),
    db.select().from(financialSnapshots).orderBy(financialSnapshots.month),
  ]);

  // Build a map: ventureId → sorted monthly revenue array (last 6 months)
  const byVenture = new Map<string, { month: string; revenue: number }[]>();
  for (const snap of allSnapshots) {
    if (!byVenture.has(snap.ventureId)) byVenture.set(snap.ventureId, []);
    byVenture.get(snap.ventureId)!.push({
      month: snap.month,
      revenue: snap.revenueActual ?? 0,
    });
  }

  return allVentures.map(v => {
    const points = (byVenture.get(v.id) ?? []).slice(-6);
    const values = points.map(p => p.revenue);
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const trend: "up" | "down" | "flat" =
      last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat";

    return {
      ventureId: v.id,
      ventureName: v.name,
      color: v.color ?? "#51AF37",
      latestRevenue: last,
      latestBurn: 0, // populated below
      points,
      trend,
    };
  }).map(item => {
    // Also pull latest burn rate from snapshots
    const snaps = byVenture.get(item.ventureId) ?? [];
    const latestSnap = snaps[snaps.length - 1];
    return {
      ...item,
      latestBurn: latestSnap
        ? (allSnapshots.find(s => s.ventureId === item.ventureId && s.month === latestSnap.month)?.monthlyBurn ?? 0)
        : 0,
    };
  });
}

// ── ESG / Impact Metrics ──────────────────────────────────────────────────────

export async function getEsgMetrics() {
  const db = await getDb();
  if (!db) return null;

  const [allIrl, allEsg, certs] = await Promise.all([
    db.select().from(irlScores),
    db.select().from(esgMetrics).orderBy(desc(esgMetrics.updatedAt)),
    db.select().from(certificationTracking),
  ]);

  const avgIrl = allIrl.length > 0
    ? allIrl.reduce((s, i) => s + (i.irlScore ?? 0), 0) / allIrl.length
    : 0;

  // Latest ESG per venture
  const latestEsg = new Map<string, typeof allEsg[0]>();
  for (const esg of allEsg) {
    if (!latestEsg.has(esg.ventureId)) latestEsg.set(esg.ventureId, esg);
  }
  const esgList = Array.from(latestEsg.values());
  const avgEsg = esgList.length > 0
    ? esgList.reduce((s, e) => s + (e.esgScore ?? 0), 0) / esgList.length
    : 0;
  const bCorpCerts = certs.filter(c =>
    c.certificationName?.includes("B Corp") && c.status === "Certified"
  ).length;
  const isoCerts = certs.filter(c =>
    c.certificationName?.includes("ISO") && c.status === "Certified"
  ).length;
  const activeCerts = certs.filter(c => c.status === "Certified").length;

  return {
    avgIrl: Math.round(avgIrl * 10) / 10,
    avgEsg: Math.round(avgEsg * 10) / 10,
    bCorpCerts,
    isoCerts,
    activeCerts,
    irlBreakdown: allIrl.map(i => ({
      ventureId: i.ventureId,
      irlScore: i.irlScore,
      esgScore: i.esgScore,
    })),
    esgBreakdown: esgList.map(e => ({
      ventureId: e.ventureId,
      overallScore: e.esgScore,
      environmentScore: e.environmentalScore,
      socialScore: e.socialScore,
      governanceScore: e.governanceScore,
    })),
  };
}

// ── Ecosystem Map Nodes ───────────────────────────────────────────────────────

export async function getEcosystemNodes() {
  const db = await getDb();
  if (!db) return [];

  const [nodes, allVentures] = await Promise.all([
    db.select().from(ecosystemMapNodes),
    db.select({
      id: ventures.id,
      name: ventures.name,
      color: ventures.color,
      status: ventures.status,
      vrl: ventures.vrl,
      trl: ventures.trl,
    }).from(ventures),
  ]);

  return allVentures.map(v => {
    const node = nodes.find(n => n.ventureId === v.id);
    return {
      ventureId: v.id,
      name: v.name,
      color: v.color ?? "#51AF37",
      status: v.status,
      vrl: v.vrl,
      trl: v.trl,
      posX: node?.posX ?? Math.random() * 80 + 10,
      posY: node?.posY ?? Math.random() * 80 + 10,
      nodeSize: node?.nodeSize ?? 40,
      linkedVentureIds: node?.linkedVentureIds ?? null,
      linkType: node?.linkType ?? "None",
      displayLabel: node?.displayLabel ?? v.name,
    };
  });
}

export async function upsertEcosystemNode(data: {
  ventureId: string;
  posX?: number;
  posY?: number;
  nodeSize?: number;
  nodeColor?: string;
  linkedVentureIds?: string;
  linkType?: "Technology Sharing" | "Market Overlap" | "Shared Founder" | "Supply Chain" | "Co-Investment" | "None";
  displayLabel?: string;
  tooltipText?: string;
}) {
  const db = await getDb();
  if (!db) return { success: false };

  const existing = await db.select().from(ecosystemMapNodes)
    .where(eq(ecosystemMapNodes.ventureId, data.ventureId));

  if (existing.length > 0) {
    await db.update(ecosystemMapNodes)
      .set({ ...data })
      .where(eq(ecosystemMapNodes.ventureId, data.ventureId));
  } else {
    await db.insert(ecosystemMapNodes).values({ ...data });
  }
  return { success: true };
}

// ── Learning Velocity (Experiment Pass Rate) ──────────────────────────────────

export async function getLearningVelocity() {
  const db = await getDb();
  if (!db) return null;

  const allExperiments = await db.select({
    ventureId: experiments.ventureId,
    outcome: experiments.outcome,
  }).from(experiments);

  const byVenture = new Map<string, { total: number; passing: number }>();
  for (const exp of allExperiments) {
    if (!byVenture.has(exp.ventureId)) {
      byVenture.set(exp.ventureId, { total: 0, passing: 0 });
    }
    const entry = byVenture.get(exp.ventureId)!;
    entry.total++;
    if (exp.outcome === "Pass") entry.passing++;
  }

  const result = Array.from(byVenture.entries()).map(([ventureId, stats]) => ({
    ventureId,
    total: stats.total,
    passing: stats.passing,
    passRate: stats.total > 0 ? Math.round((stats.passing / stats.total) * 100) : 0,
  }));

  const totalPassing = allExperiments.filter(e => e.outcome === "Pass").length;
  const portfolioPassRate = allExperiments.length > 0
    ? Math.round((totalPassing / allExperiments.length) * 100)
    : 0;

  return {
    totalExperiments: allExperiments.length,
    portfolioPassRate,
    byVenture: result,
  };
}

// ── Offering-Level Analytics ──────────────────────────────────────────────────
/**
 * Aggregates KPI snapshots, experiment outcomes, milestones, and risks
 * for a single offering — the core analytics unit in the Venture → Portfolio → Offering hierarchy.
 */
export async function getOfferingAnalytics(offeringId: string) {
  const db = await getDb();
  if (!db) return null;

  const {
    offeringKpiSnapshots,
    offerings,
    portfolios,
    milestones,
    risks,
    experiments: experimentsTable,
  } = await import("../drizzle/schema");
  const { eq: eqOp, desc: descOp } = await import("drizzle-orm");

  const offeringRows = await db.select().from(offerings).where(eqOp(offerings.id, offeringId)).limit(1);
  const offering = offeringRows[0] ?? null;
  if (!offering) return null;

  const portfolioRows = await db.select().from(portfolios).where(eqOp(portfolios.id, offering.portfolioId)).limit(1);
  const portfolio = portfolioRows[0] ?? null;

  const kpiSnapshots = await db
    .select()
    .from(offeringKpiSnapshots)
    .where(eqOp(offeringKpiSnapshots.offeringId, offeringId))
    .orderBy(descOp(offeringKpiSnapshots.snapshotDate))
    .limit(12);

  const offeringMilestones = await db
    .select()
    .from(milestones)
    .where(eqOp(milestones.offeringId, offeringId));
  const totalMilestones = offeringMilestones.length;
  const completedMilestones = offeringMilestones.filter((m) => m.completed).length;

  const offeringRisks = await db
    .select()
    .from(risks)
    .where(eqOp(risks.offeringId, offeringId));

  const offeringExperiments = await db
    .select()
    .from(experimentsTable)
    .where(eqOp(experimentsTable.offeringId, offeringId));
  const totalExperiments = offeringExperiments.length;
  const passingExperiments = offeringExperiments.filter((e) => e.outcome === "Pass").length;

  return {
    offering,
    portfolio,
    kpiSnapshots,
    latestKpi: kpiSnapshots[0] ?? null,
    milestones: {
      total: totalMilestones,
      completed: completedMilestones,
      completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
    },
    risks: {
      total: offeringRisks.length,
      high: offeringRisks.filter((r) => r.level === "High").length,
      medium: offeringRisks.filter((r) => r.level === "Medium").length,
      low: offeringRisks.filter((r) => r.level === "Low").length,
    },
    experiments: {
      total: totalExperiments,
      passing: passingExperiments,
      passRate: totalExperiments > 0 ? Math.round((passingExperiments / totalExperiments) * 100) : 0,
    },
  };
}

/**
 * Returns a portfolio-level rollup: all offerings under a portfolio with their
 * latest KPI snapshots and execution health scores.
 */
export async function getPortfolioOfferingRollup(portfolioId: string) {
  const db = await getDb();
  if (!db) return null;

  const { offerings, offeringKpiSnapshots, portfolios } = await import("../drizzle/schema");
  const { eq: eqOp, desc: descOp } = await import("drizzle-orm");

  const portfolioRows = await db.select().from(portfolios).where(eqOp(portfolios.id, portfolioId)).limit(1);
  const portfolio = portfolioRows[0] ?? null;
  if (!portfolio) return null;

  const allOfferings = await db.select().from(offerings).where(eqOp(offerings.portfolioId, portfolioId));

  const offeringsWithKpi = await Promise.all(
    allOfferings.map(async (o) => {
      const latestKpi = await db
        .select()
        .from(offeringKpiSnapshots)
        .where(eqOp(offeringKpiSnapshots.offeringId, o.id))
        .orderBy(descOp(offeringKpiSnapshots.snapshotDate))
        .limit(1);
      return { ...o, latestKpi: latestKpi[0] ?? null };
    })
  );

  return {
    portfolio,
    offerings: offeringsWithKpi,
    totalOfferings: allOfferings.length,
    activeOfferings: allOfferings.filter((o) => o.offeringStatus === "Live" || o.offeringStatus === "Scaling").length,
  };
}
