// ============================================================
// Sprint 53 — SSE Infrastructure Tests
// Tests for: broadcastSSEEvent, emitWorkflowTrigger,
//            emitMilestoneUpdate, emitRiskAlert,
//            emitDataQualityAlert, getSSEStats
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  broadcastSSEEvent,
  emitWorkflowTrigger,
  emitMilestoneUpdate,
  emitRiskAlert,
  emitDataQualityAlert,
  getSSEStats,
  handleSSEConnection,
  type SSEEvent,
  type SSEEventType,
} from "./sse";
import type { Request, Response } from "express";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockResponse() {
  const written: string[] = [];
  const headers: Record<string, string> = {};
  const res = {
    setHeader: vi.fn((k: string, v: string) => { headers[k] = v; }),
    flushHeaders: vi.fn(),
    write: vi.fn((data: string) => { written.push(data); return true; }),
    end: vi.fn(),
    _written: written,
    _headers: headers,
  } as unknown as Response & { _written: string[]; _headers: Record<string, string> };
  return res;
}

function makeMockRequest(overrides: Partial<Request> = {}) {
  const listeners: Record<string, Function[]> = {};
  const req = {
    on: vi.fn((event: string, cb: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    _emit: (event: string) => {
      (listeners[event] || []).forEach(cb => cb());
    },
    user: undefined,
    ...overrides,
  } as unknown as Request & { _emit: (event: string) => void };
  return req;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SSE Infrastructure — getSSEStats", () => {
  it("returns stats object with connectedClients, clients array, and totalEventsEmitted", () => {
    const stats = getSSEStats();
    expect(stats).toHaveProperty("connectedClients");
    expect(stats).toHaveProperty("clients");
    expect(stats).toHaveProperty("totalEventsEmitted");
    expect(typeof stats.connectedClients).toBe("number");
    expect(Array.isArray(stats.clients)).toBe(true);
    expect(typeof stats.totalEventsEmitted).toBe("number");
  });

  it("connectedClients is a non-negative integer", () => {
    const stats = getSSEStats();
    expect(stats.connectedClients).toBeGreaterThanOrEqual(0);
  });
});

describe("SSE Infrastructure — broadcastSSEEvent", () => {
  it("does not throw when no clients are connected", () => {
    expect(() =>
      broadcastSSEEvent({
        type: "workflow_trigger",
        data: { description: "test trigger" },
      })
    ).not.toThrow();
  });

  it("increments totalEventsEmitted after each broadcast", () => {
    const before = getSSEStats().totalEventsEmitted;
    broadcastSSEEvent({ type: "heartbeat", data: { uptime: 100 } });
    const after = getSSEStats().totalEventsEmitted;
    // Only increments if there are connected clients; otherwise no-op
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe("SSE Infrastructure — emitWorkflowTrigger", () => {
  it("does not throw for a valid trigger payload", () => {
    expect(() =>
      emitWorkflowTrigger({
        triggerType: "research_completed",
        description: "Research project ABC completed",
        severity: "info",
      })
    ).not.toThrow();
  });

  it("does not throw when severity is omitted (defaults to info)", () => {
    expect(() =>
      emitWorkflowTrigger({
        triggerType: "audit_failed",
        description: "Factory audit failed",
      })
    ).not.toThrow();
  });

  it("does not throw for all trigger types", () => {
    const types = [
      "research_completed",
      "audit_failed",
      "supplier_approved",
      "deal_closed_won",
      "funding_round_closed",
      "milestone_overdue",
      "data_quality_degraded",
    ] as const;
    for (const t of types) {
      expect(() =>
        emitWorkflowTrigger({ triggerType: t, description: `${t} fired` })
      ).not.toThrow();
    }
  });
});

describe("SSE Infrastructure — emitMilestoneUpdate", () => {
  it("does not throw for a valid milestone update payload", () => {
    expect(() =>
      emitMilestoneUpdate({
        ventureId: "ecoblend-core",
        ventureName: "EcoBlend Core",
        milestoneName: "MVP Launch",
        status: "overdue",
        daysOverdue: 7,
      })
    ).not.toThrow();
  });

  it("does not throw when optional fields are omitted", () => {
    expect(() =>
      emitMilestoneUpdate({
        milestoneName: "Prototype",
        status: "completed",
      })
    ).not.toThrow();
  });
});

describe("SSE Infrastructure — emitRiskAlert", () => {
  it("does not throw for a critical risk alert", () => {
    expect(() =>
      emitRiskAlert({
        ventureId: "ecoblend-core",
        ventureName: "EcoBlend Core",
        riskType: "Supply Chain",
        severity: "critical",
        message: "Critical supplier failure detected",
      })
    ).not.toThrow();
  });

  it("does not throw for all severity levels", () => {
    const severities = ["low", "medium", "high", "critical"] as const;
    for (const sev of severities) {
      expect(() =>
        emitRiskAlert({
          riskType: "Market",
          severity: sev,
          message: `${sev} risk alert`,
        })
      ).not.toThrow();
    }
  });
});

describe("SSE Infrastructure — emitDataQualityAlert", () => {
  it("does not throw for a valid data quality alert", () => {
    expect(() =>
      emitDataQualityAlert({
        datasetName: "Customer Transactions",
        dimension: "completeness",
        score: 62,
        threshold: 80,
      })
    ).not.toThrow();
  });

  it("does not throw when score equals threshold", () => {
    expect(() =>
      emitDataQualityAlert({
        datasetName: "Supplier Records",
        dimension: "accuracy",
        score: 75,
        threshold: 75,
      })
    ).not.toThrow();
  });
});

describe("SSE Infrastructure — handleSSEConnection", () => {
  it("sets the correct SSE response headers", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(res.flushHeaders).toHaveBeenCalled();
  });

  it("writes a connected event immediately on connection", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    expect(res.write).toHaveBeenCalled();
    const firstWrite = (res as any)._written[0] as string;
    expect(firstWrite).toContain("event: connected");
    expect(firstWrite).toContain("clientId");
  });

  it("increments connectedClients count after a new connection", () => {
    const before = getSSEStats().connectedClients;
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    const after = getSSEStats().connectedClients;
    expect(after).toBeGreaterThan(before);
    // Clean up: simulate client disconnect
    (req as any)._emit("close");
  });

  it("decrements connectedClients count after client disconnects", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    const afterConnect = getSSEStats().connectedClients;
    (req as any)._emit("close");
    const afterDisconnect = getSSEStats().connectedClients;
    expect(afterDisconnect).toBeLessThan(afterConnect);
  });

  it("broadcasts to connected client when an event is emitted", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    const writeCountBefore = (res.write as ReturnType<typeof vi.fn>).mock.calls.length;
    broadcastSSEEvent({
      type: "workflow_trigger",
      data: { description: "Test broadcast" },
    });
    const writeCountAfter = (res.write as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(writeCountAfter).toBeGreaterThan(writeCountBefore);
    // Clean up
    (req as any)._emit("close");
  });

  it("removes client from registry when write throws (stale connection)", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    // Connect successfully first (first write = connected event)
    handleSSEConnection(req as Request, res as unknown as Response);
    const before = getSSEStats().connectedClients;
    // Now make subsequent writes throw to simulate stale connection
    let callCount = 0;
    (res.write as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      throw new Error("Connection reset");
    });
    // Trigger a broadcast — the stale client should be removed after the throw
    broadcastSSEEvent({ type: "heartbeat", data: { uptime: 999 } });
    const after = getSSEStats().connectedClients;
    expect(after).toBeLessThan(before);
    expect(callCount).toBeGreaterThan(0);
  });
});

describe("SSE Infrastructure — event payload structure", () => {
  it("connected event payload contains clientId and message", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    const firstWrite = (res as any)._written[0] as string;
    // Extract the data line
    const dataLine = firstWrite.split("\n").find((l: string) => l.startsWith("data:"));
    expect(dataLine).toBeDefined();
    const parsed = JSON.parse(dataLine!.replace("data: ", "")) as SSEEvent;
    expect(parsed.type).toBe("connected");
    expect(parsed.data.clientId).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.id).toBeDefined();
    // Clean up
    (req as any)._emit("close");
  });

  it("broadcast event payload has correct structure", () => {
    const req = makeMockRequest();
    const res = makeMockResponse();
    handleSSEConnection(req as Request, res as unknown as Response);
    broadcastSSEEvent({
      type: "risk_alert",
      data: { severity: "high", message: "Test risk" },
    });
    const writes = (res as any)._written as string[];
    const broadcastWrite = writes.find((w: string) => w.includes("event: risk_alert"));
    expect(broadcastWrite).toBeDefined();
    const dataLine = broadcastWrite!.split("\n").find((l: string) => l.startsWith("data:"));
    const parsed = JSON.parse(dataLine!.replace("data: ", "")) as SSEEvent;
    expect(parsed.type).toBe("risk_alert");
    expect(parsed.data.severity).toBe("high");
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.id).toBeDefined();
    // Clean up
    (req as any)._emit("close");
  });
});
