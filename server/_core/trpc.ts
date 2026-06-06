import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ── Human-review gate for venture scores ────────────────────────────────────
// Every mutation that writes to venture_scores must carry both humanReviewedBy
// and humanReviewedAt — regardless of whether the score is AI-generated or
// manually entered.  No score may be persisted without a named reviewer.
//
// Usage: swap protectedProcedure → reviewedScoreProcedure on any mutation that
// calls insertVentureScore / updateVentureScores.
const requireHumanReviewForAllScores = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const input = rawInput as Record<string, unknown> | null | undefined;
  if (input && typeof input === "object") {
    const hasReviewer =
      typeof input.humanReviewedBy === "string" && input.humanReviewedBy.trim().length > 0;
    const hasTimestamp = Boolean(input.humanReviewedAt);
    if (!hasReviewer || !hasTimestamp) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Score write blocked — human_reviewed_by is required. " +
          "Provide both humanReviewedBy (reviewer name) and humanReviewedAt (ISO timestamp) " +
          "for every score write, whether AI-generated or manually entered.",
      });
    }
  }

  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

export const reviewedScoreProcedure = t.procedure.use(requireHumanReviewForAllScores);
