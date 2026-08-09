/**
 * Shared utilities for module-reactivation mutations.
 *
 * Exported separately from admin.router so they can be unit-tested without
 * importing the full Drizzle schema (which crashes the Vitest transform).
 */

import { TRPCError } from "@trpc/server";

/**
 * Normalises the ventureId supplied to setModuleReactivation /
 * setModuleReactivationBatch before it is written to the DB.
 *
 * Rules:
 *   • undefined  → "__global__"
 *   • "" or whitespace-only  → "__global__"
 *   • Any other value        → trimmed string
 *
 * This is the single source of truth for the write-path normalisation.
 * Testing this function directly means any regression (e.g. removing the
 * .trim() call in the router) is caught without needing a live database.
 */
export function normaliseSetVentureId(raw?: string): string {
  if (!raw || !raw.trim()) return "__global__";
  return raw.trim();
}

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

/**
 * Executes the venture-reset DELETE against the database.
 *
 * Extracted from the router mutation so the delete predicate can be tested
 * without importing the Drizzle schema (which crashes the Vitest transform).
 *
 * The caller supplies the DB instance, the target table, Drizzle's `eq`
 * function, and the specific column to filter on.  Keeping the column as an
 * explicit parameter ensures the test can verify that the predicate uses
 * only `ventureId` and not any additional per-writer column (e.g. toggledBy).
 *
 * @param db              - Drizzle DB instance (or a compatible mock).
 * @param table           - The table to delete from (moduleReactivations in production).
 * @param eqFn            - Drizzle's `eq` function (or a mock that records calls).
 * @param ventureIdColumn - The ventureId column of the table.
 * @param vid             - The normalised venture ID to delete rows for.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execVentureReset(
  // Typed as `any` intentionally: the real Drizzle DB returns a proprietary
  // query-builder from `.delete().where()` that is not a plain Promise, so
  // importing its exact generic type here would drag in the full Drizzle
  // schema (crashing the Vitest transform).  The call is still await-able;
  // correctness is verified by the unit tests in admin.moduleReactivation.test.ts.
  db: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  table: unknown,
  eqFn: (col: unknown, val: string) => unknown,
  ventureIdColumn: unknown,
  vid: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await db.delete(table).where(eqFn(ventureIdColumn, vid));
}
