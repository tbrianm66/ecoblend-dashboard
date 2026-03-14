/**
 * Knowledge Base Ingestion Pipeline
 *
 * Handles:
 *  1. Text extraction from PDF buffers (using pdf-parse)
 *  2. Chunking into ~500-word segments with overlap
 *  3. Storing chunks in MySQL for BM25-style FULLTEXT retrieval
 *  4. Keyword search returning top-k relevant chunks
 *
 * No external vector database required — MySQL FULLTEXT index provides
 * BM25-style relevance ranking natively via MATCH … AGAINST.
 */

import { getDb } from "./db";
import {
  knowledgeDocuments,
  knowledgeChunks,
  type InsertKnowledgeDocument,
  type InsertKnowledgeChunk,
} from "../drizzle/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { storagePut } from "./storage";

// ── Constants ─────────────────────────────────────────────────────────────────
const CHUNK_WORDS = 500;
const CHUNK_OVERLAP = 50; // words of overlap between consecutive chunks

// ── Text Chunking ─────────────────────────────────────────────────────────────

/**
 * Split plain text into overlapping word-window chunks.
 * Each chunk is ~CHUNK_WORDS words with CHUNK_OVERLAP words of context
 * carried over from the previous chunk.
 */
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORDS, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Count words in a string.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ── PDF Text Extraction ───────────────────────────────────────────────────────

/**
 * Extract plain text from a PDF buffer using pdf-parse.
 * Falls back to empty string on error.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid issues if pdf-parse is not installed
    const pdfParse = await import("pdf-parse").then((m: any) => m.default ?? m);
    const data = await pdfParse(buffer);
    return data.text ?? "";
  } catch (err) {
    console.error("[KnowledgeBase] PDF extraction failed:", err);
    return "";
  }
}

// ── Document Ingestion ────────────────────────────────────────────────────────

/**
 * Full ingestion pipeline for a document:
 *  1. Upload raw file to S3
 *  2. Extract text (PDF) or use provided text
 *  3. Chunk text
 *  4. Store document record + all chunks in DB
 *  5. Update document status to "ready"
 */
export async function ingestDocument(params: {
  documentId: number;
  text: string;
}): Promise<{ chunkCount: number; wordCount: number }> {
  const db = (await getDb())!;
  const { documentId, text } = params;

  // Mark as processing
  await db
    .update(knowledgeDocuments)
    .set({ status: "processing" })
    .where(eq(knowledgeDocuments.id, documentId));

  try {
    const chunks = chunkText(text);
    const totalWords = countWords(text);

    // Delete any existing chunks for this document (re-ingestion)
    await db
      .delete(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, documentId));

    // Insert all chunks
    const chunkRows: InsertKnowledgeChunk[] = chunks.map((content, i) => ({
      documentId,
      chunkIndex: i,
      content,
      wordCount: countWords(content),
    }));

    if (chunkRows.length > 0) {
      // Insert in batches of 50 to avoid oversized queries
      for (let i = 0; i < chunkRows.length; i += 50) {
        await db.insert(knowledgeChunks).values(chunkRows.slice(i, i + 50));
      }
    }

    // Update document with final stats
    await db
      .update(knowledgeDocuments)
      .set({
        status: "ready",
        chunkCount: chunks.length,
        wordCount: totalWords,
        errorMessage: null,
      })
      .where(eq(knowledgeDocuments.id, documentId));

    return { chunkCount: chunks.length, wordCount: totalWords };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db
      .update(knowledgeDocuments)
      .set({ status: "error", errorMessage })
      .where(eq(knowledgeDocuments.id, documentId));
    throw err;
  }
}

// ── Keyword Search ────────────────────────────────────────────────────────────

/**
 * Search knowledge base chunks using MySQL FULLTEXT MATCH … AGAINST.
 * Returns top-k chunks sorted by relevance score.
 *
 * Falls back to LIKE-based search if FULLTEXT index is not yet available.
 */
export async function searchKnowledge(params: {
  query: string;
  domain?: string;
  topK?: number;
}): Promise<Array<{ documentId: number; chunkIndex: number; content: string; score: number; documentTitle: string; domain: string; author: string | null; publishedYear: number | null }>> {
  const db = (await getDb())!;
  const { query, topK = 5 } = params;

  if (!query.trim()) return [];

  try {
    // MySQL FULLTEXT search with relevance score
    const results = await db.execute(sql`
      SELECT
        kc.document_id   AS documentId,
        kc.chunk_index   AS chunkIndex,
        kc.content,
        MATCH(kc.content) AGAINST(${query} IN NATURAL LANGUAGE MODE) AS score,
        kd.title         AS documentTitle,
        kd.domain,
        kd.author,
        kd.published_year AS publishedYear
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kd.status = 'ready'
        ${params.domain ? sql`AND kd.domain = ${params.domain}` : sql``}
        AND MATCH(kc.content) AGAINST(${query} IN NATURAL LANGUAGE MODE) > 0
      ORDER BY score DESC
      LIMIT ${topK}
    `);

    const rows = Array.isArray(results) ? (results[0] as unknown as any[]) : [];
    return rows.map((r: any) => ({
      documentId: Number(r.documentId),
      chunkIndex: Number(r.chunkIndex),
      content: String(r.content),
      score: Number(r.score),
      documentTitle: String(r.documentTitle),
      domain: String(r.domain),
      author: r.author ? String(r.author) : null,
      publishedYear: r.publishedYear ? Number(r.publishedYear) : null,
    }));
  } catch {
    // Fallback: simple LIKE search if FULLTEXT index not available
    const likeQuery = `%${query.split(/\s+/).slice(0, 3).join("%")}%`;
    const results = await db.execute(sql`
      SELECT
        kc.document_id   AS documentId,
        kc.chunk_index   AS chunkIndex,
        kc.content,
        1.0              AS score,
        kd.title         AS documentTitle,
        kd.domain,
        kd.author,
        kd.published_year AS publishedYear
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kd.status = 'ready'
        AND kc.content LIKE ${likeQuery}
      LIMIT ${topK}
    `);
    const rows = Array.isArray(results) ? (results[0] as unknown as any[]) : [];
    return rows.map((r: any) => ({
      documentId: Number(r.documentId),
      chunkIndex: Number(r.chunkIndex),
      content: String(r.content),
      score: Number(r.score),
      documentTitle: String(r.documentTitle),
      domain: String(r.domain),
      author: r.author ? String(r.author) : null,
      publishedYear: r.publishedYear ? Number(r.publishedYear) : null,
    }));
  }
}

/**
 * Build a knowledge context block for injection into LLM system prompts.
 * Returns a formatted string of the top-k relevant chunks with source attribution.
 */
export async function buildKnowledgeContext(query: string, domain?: string, topK = 4): Promise<string> {
  const chunks = await searchKnowledge({ query, domain, topK });
  if (chunks.length === 0) return "";

  const lines = chunks.map((c, i) => {
    const source = [
      c.documentTitle,
      c.author ? `by ${c.author}` : null,
      c.publishedYear ? `(${c.publishedYear})` : null,
    ].filter(Boolean).join(" ");
    return `[${i + 1}] Source: ${source}\n${c.content}`;
  });

  return `\n\n---\nRELEVANT KNOWLEDGE BASE CONTEXT (use to inform your response):\n\n${lines.join("\n\n")}\n---\n`;
}

// ── DB Helpers ────────────────────────────────────────────────────────────────

export async function createKnowledgeDocument(data: InsertKnowledgeDocument) {
  const db = (await getDb())!;
  const [result] = await db.insert(knowledgeDocuments).values(data);
  return result;
}

export async function listKnowledgeDocuments() {
  const db = (await getDb())!;
  return db.select().from(knowledgeDocuments).orderBy(desc(knowledgeDocuments.createdAt));
}

export async function getKnowledgeDocument(id: number) {
  const db = (await getDb())!;
  const [doc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
  return doc ?? null;
}

export async function deleteKnowledgeDocument(id: number) {
  const db = (await getDb())!;
  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, id));
  await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
}

export async function getChunksByDocument(documentId: number) {
  const db = (await getDb())!;
  return db
    .select()
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.documentId, documentId))
    .orderBy(knowledgeChunks.chunkIndex);
}

export async function getKnowledgeStats() {
  const db = (await getDb())!;

  // Use Drizzle query builder to avoid raw SQL column name mismatches
  const readyDocs = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.status, "ready"));

  const documentCount = readyDocs.length;
  const totalChunks = readyDocs.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0);
  const totalWords = readyDocs.reduce((sum, d) => sum + (d.wordCount ?? 0), 0);
  const domainCount = new Set(readyDocs.map((d) => d.domain)).size;

  return { documentCount, totalChunks, totalWords, domainCount };
}

// ── S3 Upload Helper ──────────────────────────────────────────────────────────

export async function uploadDocumentToS3(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const suffix = Date.now().toString(36);
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `knowledge-base/${suffix}-${safeFilename}`;
  return storagePut(key, buffer, contentType);
}
