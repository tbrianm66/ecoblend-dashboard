/**
 * useDashboardWebSocket — WebSocket hook for MRL Command Dashboard
 * Reconnect capped at 5 attempts (spec §10 constraint 6).
 * Spec: BEBUS-MRL-DASH-001 §7
 */
import { useEffect, useRef, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;

export function useDashboardWebSocket(ventureId: string | null) {
  const { setLive, setLastUpdated, setMrlScore, setTrl, setMrl, setDelta, setEta } = useDashboardStore();
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("[MRL-WS] Max reconnect attempts reached. Giving up.");
      setLive(false);
      return;
    }

    // Build WS URL — falls back gracefully if WS server is not available
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/ws/mrl${ventureId ? `?ventureId=${ventureId}` : ""}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        attemptsRef.current = 0;
        setLive(true);
        console.info("[MRL-WS] Connected");
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string);
          setLastUpdated(new Date());

          // Handle typed messages from the server
          if (msg.type === "mrl_update") {
            if (msg.mrlScore  !== undefined) setMrlScore(msg.mrlScore);
            if (msg.trl       !== undefined) setTrl(msg.trl);
            if (msg.mrl       !== undefined) setMrl(msg.mrl);
            if (msg.delta     !== undefined) setDelta(msg.delta);
            if (msg.eta       !== undefined) setEta(msg.eta);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        // Error is followed by onclose; let onclose handle reconnect
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setLive(false);
        wsRef.current = null;

        // Don't reconnect on clean close (code 1000)
        if (event.code === 1000) return;

        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn("[MRL-WS] Max reconnect attempts reached.");
          return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = BASE_DELAY_MS * Math.pow(2, attemptsRef.current - 1);
        console.info(`[MRL-WS] Reconnecting in ${delay}ms (attempt ${attemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        timerRef.current = setTimeout(connect, delay);
      };
    } catch (err) {
      // WebSocket construction can throw if URL is invalid
      console.warn("[MRL-WS] Could not construct WebSocket:", err);
      setLive(false);
    }
  }, [ventureId, setLive, setLastUpdated, setMrlScore, setTrl, setMrl, setDelta, setEta]);

  useEffect(() => {
    mountedRef.current = true;
    // Only attempt WebSocket in production-like environments
    // In dev, WS server may not be running — degrade gracefully
    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);
}
