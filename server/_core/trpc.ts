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
// Any mutation that writes to venture_scores must either:
//   (a) be a human-entered score  (aiGenerated absent or false), OR
//   (b) be AI-generated but carry both humanReviewedBy and humanReviewedAt,
//       proving a reviewer has approved it before persistence.
//
// Usage: swap protectedProcedure → reviewedScoreProcedure on any mutation that
// calls insertVentureScore / updateVentureScores.
const requireHumanReviewForAiScores = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const input = rawInput as Record<string, unknown> | null | undefined;
  if (input && typeof input === "object" && input.aiGenerated === true) {
    const hasReviewer = typeof input.humanReviewedBy === "string" && input.humanReviewedBy.trim().length > 0;
    const hasTimestamp = Boolean(input.humanReviewedAt);
    if (!hasReviewer || !hasTimestamp) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "AI-generated scores must be approved by a human reviewer before saving. " +
          "Provide both humanReviewedBy (reviewer name) and humanReviewedAt (ISO timestamp).",
      });
    }
  }

  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

export const reviewedScoreProcedure = t.procedure.use(requireHumanReviewForAiScores);
