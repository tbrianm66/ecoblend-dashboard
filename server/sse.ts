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
const MAX_CONNECTIONS_PER_USER = 5;

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
  userId: string;
  isAdmin: boolean;
  authorizedVentureIds: Set<string> | null; // null = admin, can see all ventures
}

const clients = new Map<string, SSEClient>();
const userConnectionCounts = new Map<string, number>();
let eventIdCounter = 0;

function incrementUserCount(userId: string): void {
  userConnectionCounts.set(userId, (userConnectionCounts.get(userId) ?? 0) + 1);
}

function decrementUserCount(userId: string): void {
  const n = (userConnectionCounts.get(userId) ?? 1) - 1;
  if (n <= 0) userConnectionCounts.delete(userId);
  else userConnectionCounts.set(userId, n);
}

// ── Broadcast to authorized clients only ─────────────────────────────────────
export function broadcastSSEEvent(
  event: Omit<SSEEvent, "timestamp" | "id">,
  eventVentureId?: string
) {
  if (clients.size === 0) return;
  const fullEvent: SSEEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    id: String(++eventIdCounter),
  };
  const payload = `id: ${fullEvent.id}\nevent: ${fullEvent.type}\ndata: ${JSON.stringify(fullEvent)}\n\n`;

  for (const [clientId, client] of Array.from(clients.entries())) {
    // Venture-level authorization: admins see everything;
    // non-admins only receive events for their authorized ventures.
    if (eventVentureId && !client.isAdmin) {
      if (!client.authorizedVentureIds?.has(eventVentureId)) continue;
    }
    try {
      client.res.write(payload);
    } catch {
      clients.delete(clientId);
      decrementUserCount(client.userId);
    }
  }
}

// ── SSE Connection Handler ────────────────────────────────────────────────────
export interface SSEUserContext {
  userId: string;
  isAdmin: boolean;
  authorizedVentureIds: Set<string> | null;
}

export function handleSSEConnection(
  req: Request,
  res: Response,
  userCtx: SSEUserContext
) {
  // Enforce global connection cap
  if (clients.size >= MAX_CONNECTIONS) {
    res.status(503).json({ error: "Too many connections" });
    return;
  }

  // Enforce per-user connection cap
  if ((userConnectionCounts.get(userCtx.userId) ?? 0) >= MAX_CONNECTIONS_PER_USER) {
    res.status(429).json({ error: "Too many connections for this user" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const client: SSEClient = {
    id: clientId,
    res,
    connectedAt: new Date(),
    userId: userCtx.userId,
    isAdmin: userCtx.isAdmin,
    authorizedVentureIds: userCtx.authorizedVentureIds,
  };
  clients.set(clientId, client);
  incrementUserCount(userCtx.userId);

  // Send connected event (no sensitive data)
  const connectedEvent: SSEEvent = {
    type: "connected",
    data: { message: "Connected to EcoBlend Venture OS live event stream" },
    timestamp: new Date().toISOString(),
    id: String(++eventIdCounter),
  };
  res.write(`id: ${connectedEvent.id}\nevent: connected\ndata: ${JSON.stringify(connectedEvent)}\n\n`);

  // Heartbeat every 30 seconds — no operational data
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
      decrementUserCount(userCtx.userId);
    }
  }, 30000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
    decrementUserCount(userCtx.userId);
  });

  req.on("error", () => {
    clearInterval(heartbeatInterval);
    clients.delete(clientId);
    decrementUserCount(userCtx.userId);
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
  broadcastSSEEvent(
    {
      type: "workflow_trigger",
      data: { triggerType: payload.triggerType, severity: payload.severity || "info" },
    },
    payload.ventureId
  );
}

export function emitMilestoneUpdate(payload: {
  ventureId?: string;
  ventureName?: string;
  milestoneName: string;
  status: string;
  daysOverdue?: number;
}) {
  broadcastSSEEvent(
    {
      type: "milestone_update",
      data: { milestoneName: payload.milestoneName, status: payload.status, daysOverdue: payload.daysOverdue },
    },
    payload.ventureId
  );
}

export function emitRiskAlert(payload: {
  ventureId?: string;
  ventureName?: string;
  riskType: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}) {
  broadcastSSEEvent(
    {
      type: "risk_alert",
      data: { riskType: payload.riskType, severity: payload.severity },
    },
    payload.ventureId
  );
}

export function emitDataQualityAlert(payload: {
  ventureId?: string;
  datasetName: string;
  dimension: string;
  score: number;
  threshold: number;
}) {
  broadcastSSEEvent(
    {
      type: "data_quality_alert",
      data: { dimension: payload.dimension, score: payload.score, threshold: payload.threshold },
    },
    payload.ventureId
  );
}

// ── Client stats (for admin/monitoring) ──────────────────────────────────────
export function getSSEStats() {
  return {
    connectedClients: clients.size,
    totalEventsEmitted: eventIdCounter,
  };
}
