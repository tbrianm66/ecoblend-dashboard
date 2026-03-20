// ============================================================
// Sprint 53 — useLiveEvents hook
// Connects to the /api/events SSE endpoint and provides
// a stream of real-time events to React components.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

export type SSEEventType =
  | "workflow_trigger"
  | "milestone_update"
  | "risk_alert"
  | "data_quality_alert"
  | "heartbeat"
  | "connected";

export interface LiveEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  timestamp: string;
  id?: string;
}

interface UseLiveEventsOptions {
  /** Maximum number of events to keep in memory (default: 50) */
  maxEvents?: number;
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Filter to only these event types */
  filter?: SSEEventType[];
}

interface UseLiveEventsResult {
  events: LiveEvent[];
  connected: boolean;
  error: string | null;
  clearEvents: () => void;
  reconnect: () => void;
}

export function useLiveEvents(options: UseLiveEventsOptions = {}): UseLiveEventsResult {
  const { maxEvents = 50, autoConnect = true, filter } = options;
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const es = new EventSource("/api/events");
    esRef.current = es;

    const handleEvent = (type: SSEEventType) => (e: MessageEvent) => {
      try {
        const parsed: LiveEvent = JSON.parse(e.data);
        if (filter && !filter.includes(type)) return;
        setEvents(prev => {
          const next = [parsed, ...prev];
          return next.slice(0, maxEvents);
        });
      } catch {
        // Ignore malformed events
      }
    };

    es.addEventListener("connected", (e: MessageEvent) => {
      setConnected(true);
      setError(null);
      handleEvent("connected")(e);
    });

    es.addEventListener("workflow_trigger", handleEvent("workflow_trigger"));
    es.addEventListener("milestone_update", handleEvent("milestone_update"));
    es.addEventListener("risk_alert", handleEvent("risk_alert"));
    es.addEventListener("data_quality_alert", handleEvent("data_quality_alert"));
    es.addEventListener("heartbeat", handleEvent("heartbeat"));

    es.onerror = () => {
      setConnected(false);
      setError("Connection lost — reconnecting in 5 seconds...");
      es.close();
      esRef.current = null;
      // Auto-reconnect after 5 seconds
      reconnectTimerRef.current = setTimeout(connect, 5000);
    };
  }, [maxEvents, filter]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [autoConnect, connect]);

  const clearEvents = useCallback(() => setEvents([]), []);
  const reconnect = useCallback(() => connect(), [connect]);

  return { events, connected, error, clearEvents, reconnect };
}
