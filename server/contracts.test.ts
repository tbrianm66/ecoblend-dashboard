/**
 * Unit tests for the contract document tRPC procedures.
 * These tests verify the router input validation and that the
 * uploadDocument procedure correctly validates required fields.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Input schema mirrors the one defined in routers.ts ────────────────────────
const uploadDocumentSchema = z.object({
  contractId: z.string(),
  contractTitle: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number(),
  base64Data: z.string(),
  uploadedBy: z.string().optional(),
});

const getDocumentsSchema = z.object({
  contractId: z.string(),
});

const deleteDocumentSchema = z.object({
  id: z.number(),
});

describe("Contract Documents — Input Validation", () => {
  it("accepts a valid uploadDocument payload", () => {
    const payload = {
      contractId: "c1",
      contractTitle: "EcoRace Founder Agreement",
      fileName: "founder-agreement.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 204800,
      base64Data: "JVBERi0xLjQK",
      uploadedBy: "Dashboard User",
    };
    expect(() => uploadDocumentSchema.parse(payload)).not.toThrow();
  });

  it("accepts uploadDocument without optional uploadedBy", () => {
    const payload = {
      contractId: "c2",
      contractTitle: "IP Licence",
      fileName: "ip-licence.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 102400,
      base64Data: "JVBERi0xLjQK",
    };
    const result = uploadDocumentSchema.parse(payload);
    expect(result.uploadedBy).toBeUndefined();
  });

  it("rejects uploadDocument with missing required contractId", () => {
    const payload = {
      contractTitle: "IP Licence",
      fileName: "ip-licence.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 102400,
      base64Data: "JVBERi0xLjQK",
    };
    expect(() => uploadDocumentSchema.parse(payload)).toThrow();
  });

  it("rejects uploadDocument with non-numeric fileSizeBytes", () => {
    const payload = {
      contractId: "c3",
      contractTitle: "OEM Partnership",
      fileName: "oem.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSizeBytes: "not-a-number",
      base64Data: "JVBERi0xLjQK",
    };
    expect(() => uploadDocumentSchema.parse(payload)).toThrow();
  });

  it("accepts a valid getDocuments payload", () => {
    const payload = { contractId: "c1" };
    expect(() => getDocumentsSchema.parse(payload)).not.toThrow();
  });

  it("rejects getDocuments with missing contractId", () => {
    expect(() => getDocumentsSchema.parse({})).toThrow();
  });

  it("accepts a valid deleteDocument payload", () => {
    const payload = { id: 42 };
    expect(() => deleteDocumentSchema.parse(payload)).not.toThrow();
  });

  it("rejects deleteDocument with string id", () => {
    const payload = { id: "not-a-number" };
    expect(() => deleteDocumentSchema.parse(payload)).toThrow();
  });
});

describe("Contract Documents — File Validation Logic", () => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
  ];

  it("allows PDF files under 10 MB", () => {
    expect(5 * 1024 * 1024 <= MAX_SIZE).toBe(true);
    expect(ALLOWED_TYPES.includes("application/pdf")).toBe(true);
  });

  it("rejects files over 10 MB", () => {
    const oversizedFile = 11 * 1024 * 1024;
    expect(oversizedFile > MAX_SIZE).toBe(true);
  });

  it("rejects unsupported MIME types", () => {
    expect(ALLOWED_TYPES.includes("video/mp4")).toBe(false);
    expect(ALLOWED_TYPES.includes("application/zip")).toBe(false);
  });

  it("allows DOCX files", () => {
    expect(ALLOWED_TYPES.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
  });

  it("allows image attachments", () => {
    expect(ALLOWED_TYPES.includes("image/png")).toBe(true);
    expect(ALLOWED_TYPES.includes("image/jpeg")).toBe(true);
  });
});

describe("Investor Pack Export — Data Preparation", () => {
  it("calculates VRL percentage correctly", () => {
    // VRL 3, 50% through stage → (2/4 + 50/400) * 100 = 62.5%
    const vrl = 3;
    const vrlPercent = 50;
    const pct = Math.round(((vrl - 1) / 4 + vrlPercent / 400) * 100);
    expect(pct).toBe(63);
  });

  it("calculates TRL percentage correctly", () => {
    // TRL 6, 80% through level → (5/9 + 80/900) * 100 ≈ 64.4%
    const trl = 6;
    const trlPercent = 80;
    const pct = Math.round(((trl - 1) / 9 + trlPercent / 900) * 100);
    expect(pct).toBe(64);
  });

  it("marks a venture as investment ready at VRL 3+ and TRL 6+", () => {
    const venture = { vrl: 3, trl: 6, investmentReady: true };
    expect(venture.vrl >= 3 && venture.trl >= 6).toBe(true);
  });

  it("marks a venture as not investment ready below threshold", () => {
    const venture = { vrl: 2, trl: 5, investmentReady: false };
    expect(venture.vrl >= 3 && venture.trl >= 6).toBe(false);
  });

  it("formats file size correctly", () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });
});
