/**
 * Shared utility for resetVentureModuleReactivations.
 *
 * Exported separately from admin.router so it can be unit-tested without
 * importing the full Drizzle schema (which crashes the Vitest transform).
 */

import { TRPCError } from "@trpc/server";

/**
 * Trims leading/trailing whitespace from a raw ventureId and rejects the
 * "__global__" sentinel with a BAD_REQUEST error.
 *
 * This is the single source of truth for the normalisation that the router
 * mutation performs before issuing the DELETE.  Testing this function
 * directly means any regression (removing the trim, removing the sentinel
 * check) is caught without needing a live database.
 *
 * @throws TRPCError (BAD_REQUEST) when the trimmed value equals "__global__"
 */
export function normaliseResetVentureId(raw: string): string {
  const vid = raw.trim();
  if (vid === "__global__") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot reset global scope via this endpoint",
    });
  }
  return vid;
}
