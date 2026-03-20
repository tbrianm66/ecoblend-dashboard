import { getDb } from "./db";
import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import {
  finPlLines,
  finRunwayScenarios,
  finExitWaterfall,
  finWaterfallTranches,
  finInvestorReports,
  finUnitEconomics,
} from "../drizzle/schema";

// ── P&L Router ────────────────────────────────────────────────────────────────
export const finPlRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(finPlLines).orderBy(finPlLines.sortOrder, finPlLines.createdAt);
      if (input.ventureId) {
        return q.where(eq(finPlLines.ventureId, input.ventureId));
      }
      return q;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      category: z.enum(["revenue","cogs","gross_profit","opex","ebitda","depreciation","ebit","interest","tax","net_profit"]),
      lineItem: z.string(),
      year1: z.number().default(0),
      year2: z.number().default(0),
      year3: z.number().default(0),
      year4: z.number().default(0),
      year5: z.number().default(0),
      unit: z.string().default("GBP"),
      notes: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      if (id) {
        await db.update(finPlLines).set({ ...fields, updatedAt: new Date() }).where(eq(finPlLines.id, id));
        return { id };
      }
      const [result] = await db.insert(finPlLines).values({ ...fields });
      return { id: (result as any).insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finPlLines).where(eq(finPlLines.id, input.id));
      return { success: true };
    }),

  summary: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const q = db.select().from(finPlLines);
      const lines = input.ventureId
        ? await q.where(eq(finPlLines.ventureId, input.ventureId))
        : await q;

      const sum = (cat: string, yr: keyof typeof lines[0]) =>
        lines.filter(l => l.category === cat).reduce((a, l) => a + (Number(l[yr]) || 0), 0);

      const years = [1,2,3,4,5] as const;
      return years.map(y => {
        const yr = `year${y}` as keyof typeof lines[0];
        const revenue = sum("revenue", yr);
        const cogs = sum("cogs", yr);
        const grossProfit = revenue - cogs;
        const opex = sum("opex", yr);
        const ebitda = grossProfit - opex;
        const netProfit = ebitda - sum("depreciation", yr) - sum("interest", yr) - sum("tax", yr);
        return { year: y, revenue, cogs, grossProfit, opex, ebitda, netProfit };
      });
    }),
});

// ── Runway Router ─────────────────────────────────────────────────────────────
export const finRunwayRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(finRunwayScenarios).orderBy(desc(finRunwayScenarios.createdAt));
      return input.ventureId ? q.where(eq(finRunwayScenarios.ventureId, input.ventureId)) : q;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      name: z.string(),
      cashBalance: z.number().default(0),
      monthlyBurn: z.number().default(0),
      monthlyRevenue: z.number().default(0),
      growthRate: z.number().default(0),
      scenario: z.enum(["base","optimistic","pessimistic"]).default("base"),
      assumptions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;

      // Calculate runway and break-even
      const netBurn = fields.monthlyBurn - fields.monthlyRevenue;
      const runwayMonths = netBurn > 0 ? Math.floor(fields.cashBalance / netBurn) : 999;
      let breakEvenMonth: number | null = null;
      if (fields.monthlyRevenue < fields.monthlyBurn && fields.growthRate > 0) {
        let rev = fields.monthlyRevenue;
        for (let m = 1; m <= 120; m++) {
          rev = rev * (1 + fields.growthRate / 100);
          if (rev >= fields.monthlyBurn) { breakEvenMonth = m; break; }
        }
      } else if (fields.monthlyRevenue >= fields.monthlyBurn) {
        breakEvenMonth = 0;
      }

      const payload = { ...fields, runwayMonths, breakEvenMonth };
      if (id) {
        await db.update(finRunwayScenarios).set({ ...payload, updatedAt: new Date() }).where(eq(finRunwayScenarios.id, id));
        return { id };
      }
      const [result] = await db.insert(finRunwayScenarios).values(payload);
      return { id: (result as any).insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finRunwayScenarios).where(eq(finRunwayScenarios.id, input.id));
      return { success: true };
    }),
});

// ── Exit Waterfall Router ─────────────────────────────────────────────────────
export const finWaterfallRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(finExitWaterfall).orderBy(desc(finExitWaterfall.createdAt));
      return input.ventureId ? q.where(eq(finExitWaterfall.ventureId, input.ventureId)) : q;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      exitValuation: z.number().default(0),
      exitType: z.enum(["acquisition","ipo","secondary","mbo","liquidation"]).default("acquisition"),
      preMoneyValuation: z.number().default(0),
      totalInvested: z.number().default(0),
      liquidationPref: z.enum(["none","1x_non_participating","1x_participating","2x_non_participating"]).default("1x_non_participating"),
      antiDilution: z.enum(["none","broad_based","narrow_based","full_ratchet"]).default("none"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      if (id) {
        await db.update(finExitWaterfall).set({ ...fields, updatedAt: new Date() }).where(eq(finExitWaterfall.id, id));
        return { id };
      }
      const [result] = await db.insert(finExitWaterfall).values(fields);
      return { id: (result as any).insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finExitWaterfall).where(eq(finExitWaterfall.id, input.id));
      return { success: true };
    }),

  getTranches: publicProcedure
    .input(z.object({ waterfallId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(finWaterfallTranches)
        .where(eq(finWaterfallTranches.waterfallId, input.waterfallId))
        .orderBy(finWaterfallTranches.sortOrder);
    }),

  upsertTranche: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      waterfallId: z.number(),
      investorName: z.string(),
      investorType: z.enum(["founder","angel","seed","series_a","series_b","employee","option_pool"]).default("angel"),
      shares: z.number().default(0),
      ownershipPct: z.number().default(0),
      invested: z.number().default(0),
      pref: z.enum(["common","preferred"]).default("common"),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      if (id) {
        await db.update(finWaterfallTranches).set(fields).where(eq(finWaterfallTranches.id, id));
        return { id };
      }
      const [result] = await db.insert(finWaterfallTranches).values(fields);
      return { id: (result as any).insertId };
    }),

  deleteTranche: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finWaterfallTranches).where(eq(finWaterfallTranches.id, input.id));
      return { success: true };
    }),

  calculate: publicProcedure
    .input(z.object({ waterfallId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [waterfall] = await db.select().from(finExitWaterfall).where(eq(finExitWaterfall.id, input.waterfallId));
      if (!waterfall) return null;
      const tranches = await db.select().from(finWaterfallTranches)
        .where(eq(finWaterfallTranches.waterfallId, input.waterfallId))
        .orderBy(finWaterfallTranches.sortOrder);

      const exitVal = waterfall.exitValuation || 0;
      let remaining = exitVal;
      const results = [];

      // Step 1: Liquidation preference for preferred shareholders
      const preferred = tranches.filter(t => t.pref === "preferred");
      const common = tranches.filter(t => t.pref === "common");

      for (const t of preferred) {
        const prefMultiplier = waterfall.liquidationPref === "2x_non_participating" ? 2 : 1;
        const prefAmount = Math.min(remaining, (t.invested || 0) * prefMultiplier);
        remaining -= prefAmount;
        results.push({ ...t, prefPayout: prefAmount, proRataPayout: 0, totalPayout: prefAmount });
      }

      // Step 2: Pro-rata distribution of remaining to all shareholders
      const totalOwnership = tranches.reduce((s, t) => s + (t.ownershipPct || 0), 0) || 100;
      for (const t of common) {
        const proRata = Math.floor(remaining * (t.ownershipPct || 0) / totalOwnership);
        results.push({ ...t, prefPayout: 0, proRataPayout: proRata, totalPayout: proRata });
      }

      // For participating preferred: add pro-rata on top of preference
      if (waterfall.liquidationPref === "1x_participating") {
        for (const r of results.filter(r => r.pref === "preferred")) {
          const proRata = Math.floor(remaining * (r.ownershipPct || 0) / totalOwnership);
          r.proRataPayout = proRata;
          r.totalPayout += proRata;
        }
      }

      return { waterfall, tranches: results, exitValuation: exitVal, distributed: exitVal - remaining };
    }),
});

// ── Investor Reports Router ───────────────────────────────────────────────────
export const finReportsRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(finInvestorReports).orderBy(desc(finInvestorReports.createdAt));
      return input.ventureId ? q.where(eq(finInvestorReports.ventureId, input.ventureId)) : q;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      title: z.string(),
      period: z.string().optional(),
      reportType: z.enum(["monthly","quarterly","annual","ad_hoc"]).default("monthly"),
      status: z.enum(["draft","review","sent","archived"]).default("draft"),
      highlights: z.string().optional(),
      challenges: z.string().optional(),
      nextSteps: z.string().optional(),
      kpiSnapshot: z.string().optional(),
      generatedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      if (id) {
        await db.update(finInvestorReports).set({ ...fields, updatedAt: new Date() }).where(eq(finInvestorReports.id, id));
        return { id };
      }
      const [result] = await db.insert(finInvestorReports).values(fields);
      return { id: (result as any).insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finInvestorReports).where(eq(finInvestorReports.id, input.id));
      return { success: true };
    }),

  generate: publicProcedure
    .input(z.object({
      ventureId: z.string().optional(),
      offeringId: z.string().optional(),
      offeringName: z.string().optional(),
      ventureName: z.string(),
      period: z.string(),
      reportType: z.enum(["monthly","quarterly","annual","ad_hoc"]),
      kpiData: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert startup CFO writing a professional investor update report for EcoBlend Ventures. 
Write in a clear, concise, professional tone. Structure the report with: Highlights, Challenges, Next Steps. 
Keep each section to 3-5 bullet points. Be specific and data-driven where possible.`,
          },
          {
            role: "user",
            content: `Generate a ${input.reportType} investor update report for ${input.ventureName} for period: ${input.period}.
${input.kpiData ? `KPI Data: ${input.kpiData}` : ""}
Return a JSON object with keys: highlights, challenges, nextSteps (each as a string with bullet points using "• " prefix).`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "investor_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                highlights: { type: "string" },
                challenges: { type: "string" },
                nextSteps: { type: "string" },
              },
              required: ["highlights", "challenges", "nextSteps"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "";
      let parsed = { highlights: "", challenges: "", nextSteps: "" };
      try { parsed = JSON.parse(content || "{}"); } catch {}

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(finInvestorReports).values({
        ventureId: input.ventureId,
        title: `${input.ventureName}${input.offeringName ? ` / ${input.offeringName}` : ""} — ${input.reportType.charAt(0).toUpperCase() + input.reportType.slice(1)} Update (${input.period})`,
        period: input.period,
        reportType: input.reportType,
        status: "draft",
        highlights: parsed.highlights,
        challenges: parsed.challenges,
        nextSteps: parsed.nextSteps,
        kpiSnapshot: input.kpiData,
        generatedBy: "AI",
      });
      return { id: (result as any).insertId, ...parsed };
    }),

  markSent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(finInvestorReports)
        .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
        .where(eq(finInvestorReports.id, input.id));
      return { success: true };
    }),
});

// ── Unit Economics Router ─────────────────────────────────────────────────────
export const finUnitEconRouter = router({
  list: publicProcedure
    .input(z.object({ ventureId: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = db.select().from(finUnitEconomics).orderBy(desc(finUnitEconomics.createdAt));
      return input.ventureId ? q.where(eq(finUnitEconomics.ventureId, input.ventureId)) : q;
    }),

  upsert: publicProcedure
    .input(z.object({
      id: z.number().optional(),
      ventureId: z.string().optional(),
      period: z.string().optional(),
      cac: z.number().default(0),
      ltv: z.number().default(0),
      arpu: z.number().default(0),
      churnRate: z.number().default(0),
      grossMargin: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      const paybackMonths = fields.cac > 0 && fields.arpu > 0
        ? Math.ceil(fields.cac / (fields.arpu * fields.grossMargin / 100))
        : null;
      const ltvCacRatio = fields.cac > 0 ? Math.round((fields.ltv / fields.cac) * 10) / 10 : null;
      const payload = { ...fields, paybackMonths, ltvCacRatio };
      if (id) {
        await db.update(finUnitEconomics).set({ ...payload, updatedAt: new Date() }).where(eq(finUnitEconomics.id, id));
        return { id };
      }
      const [result] = await db.insert(finUnitEconomics).values(payload);
      return { id: (result as any).insertId };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(finUnitEconomics).where(eq(finUnitEconomics.id, input.id));
      return { success: true };
    }),
});

// ── Summary Router ────────────────────────────────────────────────────────────
export const finSummaryRouter = router({
  overview: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const [plCount] = await db.select({ count: finPlLines.id }).from(finPlLines);
    const [runwayCount] = await db.select({ count: finRunwayScenarios.id }).from(finRunwayScenarios);
    const [reportCount] = await db.select({ count: finInvestorReports.id }).from(finInvestorReports);
    const [waterfallCount] = await db.select({ count: finExitWaterfall.id }).from(finExitWaterfall);
    const [unitEconCount] = await db.select({ count: finUnitEconomics.id }).from(finUnitEconomics);
    return {
      plLines: plCount?.count ?? 0,
      runwayScenarios: runwayCount?.count ?? 0,
      investorReports: reportCount?.count ?? 0,
      exitWaterfalls: waterfallCount?.count ?? 0,
      unitEconEntries: unitEconCount?.count ?? 0,
    };
  }),
});
