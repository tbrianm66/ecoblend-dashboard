// ============================================================
// Sprint 53 — Server-Sent Events (SSE) Infrastructure
// Provides real-time event streaming for:
//   - Workflow Engine trigger events
//   - Command Centre live operational feed
//   - Milestone and risk alerts
// ============================================================

import { Request, Response } from "express";

// ── Event Types ───────────────────────────────────────────────────────────────
export type SSEEventType =
  | "workflow_trigger"
  | "milestone_update"
  | "risk_alert"
  | "data_quality_alert"
  | "heartbeat"
  | "connected";

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
  id?: string;
}

// ── Client Registry ───────────────────────────────────────────────────────────
const MAX_CONNECTIONS = 100;

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
  userId?: string;
}

const clients = new Map<string, SSEClient>();
let eventIdCounter = 0;

// ── Broadcast to all connected clients ───────────────────────────────────────
export function broadcastSSEEvent(event: Omit<SSEEvent, "timestamp" | "id">) {
  if (clients.size === 0) return;
  const fullEvent: SSEEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    id: String(++eventIdCounter),
  };
  const payload = `id: ${fullEvent.id}\nevent: ${fullEvent.type}\ndata: ${JSON.stringify(fullEvent)}\n\n`;
  for (const [clientId, client] of Array.from(clients.entries())) {
    try {
      client.res.write(payload);
    } catch {
      // Client disconnected — remove from registry
      clients.delete(clientId);
    }
  }
}

// ── SSE Connection Handler ────────────────────────────────────────────────────
export function handleSSEConnection(req: Request, res: Response) {
  // Enforce connection cap to prevent resource exhaustion
  if (clients.size >= MAX_CONNECTIONS) {
    res.status(503).json({ error: "Too many connections" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Generate client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const client: SSEClient = {
    id: clientId,
    res,
    connectedAt: new Date(),
    userId: (req as any).user?.id,
  };
  clients.set(clientId, client);

  // Send connected event (no sensitive data)
  const connectedEvent: SSEEvent = {
    type: "connected",
    data: { message: "Connected to EcoBlend Venture OS live event stream" },
    timestamp: new Date().toISOString(),
    id: String(++eventIdCounter),
  };
  res.write(`id: ${connectedEvent.id}\nevent: connected\ndata: ${JSON.stringify(connectedEvent)}\n\n`);

  // Heartbeat every 30 seconds to keep connection alive (no operational data)
  const heartbeatInterval = setInterval(() => {
    try {
      const heartbeat: SSEEvent = {
        type: "heartbeat",
        data: {},
        timestamp: new Date().toISOString(),
        id: String(++eventIdCounter),
      };
      res.write(`id: ${heartbeat.id}\nevent: heartbeat\ndata: ${JSON.stringify(heartbeat)}\n\n`);
    } catch {
      clearInterval(heartbeatInterval);
      clients.delete(clientId);
    }
  }, 30000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
  });

  req.on("error", () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
  });
}

// ── Convenience emitters (called from workflow engine and other modules) ──────
export function emitWorkflowTrigger(payload: {
  triggerType: string;
  ventureId?: string;
  ventureName?: string;
  description: string;
  severity?: "info" | "warning" | "critical";
}) {
  broadcastSSEEvent({
    type: "workflow_trigger",
    data: { ...payload, severity: payload.severity || "info" },
  });
}

export function emitMilestoneUpdate(payload: {
  ventureId?: string;
  ventureName?: string;
  milestoneName: string;
  status: string;
  daysOverdue?: number;
}) {
  broadcastSSEEvent({
    type: "milestone_update",
    data: payload,
  });
}

export function emitRiskAlert(payload: {
  ventureId?: string;
  ventureName?: string;
  riskType: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}) {
  broadcastSSEEvent({
    type: "risk_alert",
    data: payload,
  });
}

export function emitDataQualityAlert(payload: {
  datasetName: string;
  dimension: string;
  score: number;
  threshold: number;
}) {
  broadcastSSEEvent({
    type: "data_quality_alert",
    data: payload,
  });
}

// ── Client stats (for admin/monitoring) ──────────────────────────────────────
export function getSSEStats() {
  return {
    connectedClients: clients.size,
    clients: Array.from(clients.values()).map(c => ({
      id: c.id,
      connectedAt: c.connectedAt.toISOString(),
      userId: c.userId,
    })),
    totalEventsEmitted: eventIdCounter,
  };
}
