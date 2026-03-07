import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import {
  insertContractDocument,
  getContractDocuments,
  deleteContractDocument,
} from "./db";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Contract document upload and management
  contracts: router({
    // Get all documents for a contract
    getDocuments: publicProcedure
      .input(z.object({ contractId: z.string() }))
      .query(async ({ input }) => {
        const docs = await getContractDocuments(input.contractId);
        return docs;
      }),

    // Upload a document: client sends base64-encoded file + metadata
    uploadDocument: publicProcedure
      .input(
        z.object({
          contractId: z.string(),
          contractTitle: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          fileSizeBytes: z.number(),
          base64Data: z.string(), // base64-encoded file content
          uploadedBy: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const suffix = nanoid(8);
        const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `contract-docs/${input.contractId}/${suffix}-${safeFileName}`;

        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.base64Data, "base64");
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await insertContractDocument({
          contractId: input.contractId,
          contractTitle: input.contractTitle,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
          uploadedBy: input.uploadedBy ?? null,
        });

        return { success: true, url, fileKey };
      }),

    // Delete a document
    deleteDocument: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContractDocument(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
