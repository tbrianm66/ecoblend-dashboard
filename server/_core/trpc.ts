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

// ── Gate 3: SCORING_INTEGRITY_REVIEWER procedure ─────────────────────────────
// Only users with role 'admin' OR 'scoring_integrity_reviewer' may resolve
// score disputes and confer EVIDENCED status.  Coaches and founders may never
// hold this gate.  The role is stored in users.role (unconstrained text).
//
// Builder–Verifier Separation principle (FHV-EB-AUD-001 §3):
//   The person who submitted or worked on a venture assessment cannot act as
//   the SCORING_INTEGRITY_REVIEWER for that same assessment.
//   Enforce this per-request with buildDisputeResolutionGuard in the router.
export const integrityReviewerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const role = ctx.user?.role;
    if (!ctx.user || (role !== "admin" && role !== "scoring_integrity_reviewer")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Scoring Integrity gate: only SCORING_INTEGRITY_REVIEWER or admin may " +
          "resolve disputes and confer EVIDENCED status. " +
          "Coaches and founders are excluded from this gate.",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
