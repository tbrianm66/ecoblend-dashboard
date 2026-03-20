// ============================================================
// Sprint 53 — Live Event Feed Component
// Displays real-time SSE events in a scrollable panel.
// Used by Command Centre and Workflow Engine pages.
// ============================================================

import { useRef, useEffect } from "react";
import { useLiveEvents, LiveEvent, SSEEventType } from "@/hooks/useLiveEvents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, AlertTriangle, TrendingUp, Database, Wifi, WifiOff, Trash2, RefreshCw
} from "lucide-react";

// ── Event type config ─────────────────────────────────────────────────────────
const EVENT_CONFIG: Record<SSEEventType, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}> = {
  workflow_trigger: {
    label: "Workflow",
    icon: Zap,
    color: "#51AF37",
    bg: "rgba(81,175,55,0.08)",
  },
  milestone_update: {
    label: "Milestone",
    icon: TrendingUp,
    color: "#3A97D3",
    bg: "rgba(58,151,211,0.08)",
  },
  risk_alert: {
    label: "Risk Alert",
    icon: AlertTriangle,
    color: "#F49C13",
    bg: "rgba(244,156,19,0.08)",
  },
  data_quality_alert: {
    label: "Data Quality",
    icon: Database,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
  },
  heartbeat: {
    label: "Heartbeat",
    icon: Wifi,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.05)",
  },
  connected: {
    label: "Connected",
    icon: Wifi,
    color: "#51AF37",
    bg: "rgba(81,175,55,0.08)",
  },
};

function formatEventData(event: LiveEvent): string {
  const d = event.data;
  if (event.type === "workflow_trigger") {
    return String(d.description || d.triggerType || "Trigger fired");
  }
  if (event.type === "milestone_update") {
    return `${d.milestoneName || "Milestone"} → ${d.status || "updated"}${d.daysOverdue ? ` (${d.daysOverdue}d overdue)` : ""}`;
  }
  if (event.type === "risk_alert") {
    return String(d.message || `${d.riskType} risk alert`);
  }
  if (event.type === "data_quality_alert") {
    return `${d.datasetName}: ${d.dimension} score ${d.score} below threshold ${d.threshold}`;
  }
  if (event.type === "heartbeat") {
    return `${d.clients} client(s) connected · uptime ${Math.floor(Number(d.uptime || 0))}s`;
  }
  if (event.type === "connected") {
    return String(d.message || "Connected to live event stream");
  }
  return JSON.stringify(d);
}

function getSeverityColor(event: LiveEvent): string {
  if (event.type === "risk_alert") {
    const sev = String(event.data.severity || "");
    if (sev === "critical") return "#ef4444";
    if (sev === "high") return "#F49C13";
    if (sev === "medium") return "#eab308";
    return "#6b7280";
  }
  if (event.type === "workflow_trigger") {
    const sev = String(event.data.severity || "info");
    if (sev === "critical" || sev === "warning") return "#F49C13";
    return "#51AF37";
  }
  return EVENT_CONFIG[event.type]?.color || "#6b7280";
}

interface LiveEventFeedProps {
  /** Maximum events to display (default: 30) */
  maxEvents?: number;
  /** Filter to specific event types */
  filter?: SSEEventType[];
  /** Height of the scrollable list */
  height?: string;
  /** Whether to show heartbeat events */
  showHeartbeat?: boolean;
  /** Title of the panel */
  title?: string;
}

export default function LiveEventFeed({
  maxEvents = 30,
  filter,
  height = "400px",
  showHeartbeat = false,
  title = "Live Event Stream",
}: LiveEventFeedProps) {
  const effectiveFilter = filter ?? (showHeartbeat ? undefined : (
    ["workflow_trigger", "milestone_update", "risk_alert", "data_quality_alert", "connected"] as SSEEventType[]
  ));
  const { events, connected, error, clearEvents, reconnect } = useLiveEvents({
    maxEvents,
    filter: effectiveFilter,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events.length]);

  const displayEvents = [...events].reverse(); // newest at bottom

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{ borderColor: "#e5e7eb", background: "#fff" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: connected ? "#51AF37" : "#ef4444" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "#1a2332", fontFamily: "'Prompt', sans-serif" }}
          >
            {title}
          </span>
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: connected ? "#51AF37" : "#ef4444",
              color: connected ? "#51AF37" : "#ef4444",
              background: connected ? "rgba(81,175,55,0.06)" : "rgba(239,68,68,0.06)",
            }}
          >
            {connected ? "LIVE" : "OFFLINE"}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-mono">{events.length} events</span>
          {!connected && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs gap-1"
              onClick={reconnect}
            >
              <RefreshCw size={10} /> Reconnect
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs gap-1"
            onClick={clearEvents}
          >
            <Trash2 size={10} /> Clear
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="px-4 py-2 text-xs flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", borderBottom: "1px solid rgba(239,68,68,0.15)" }}
        >
          <WifiOff size={12} />
          {error}
        </div>
      )}

      {/* Event list */}
      <div
        className="overflow-y-auto flex-1 px-3 py-2"
        style={{ height, minHeight: "120px" }}
      >
        {displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <Wifi size={24} style={{ opacity: 0.3 }} />
            <span className="text-xs">
              {connected ? "Waiting for events..." : "Connecting to live stream..."}
            </span>
          </div>
        ) : (
          displayEvents.map((event, i) => {
            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.workflow_trigger;
            const Icon = config.icon;
            const color = getSeverityColor(event);
            const ts = new Date(event.timestamp);
            const timeStr = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

            return (
              <div
                key={event.id || i}
                className="flex items-start gap-2.5 py-2 border-b last:border-b-0"
                style={{ borderColor: "#f3f4f6" }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: config.bg }}
                >
                  <span style={{ color, display: "flex" }}><Icon size={12} /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-semibold"
                      style={{ color }}
                    >
                      {config.label}
                    </span>
                    {event.data.ventureName != null && (
                      <span className="text-xs text-gray-400 truncate">
                        · {String(event.data.ventureName)}
                      </span>
                    )}
                    <span className="text-xs text-gray-300 font-mono ml-auto shrink-0">
                      {timeStr}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {formatEventData(event)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
