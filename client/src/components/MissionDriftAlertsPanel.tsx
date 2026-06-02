// ============================================================
// MISSION DRIFT ALERTS PANEL
// Portfolio-wide automated alert notification centre
// Phase 5 Medium-Term — Automated Mission Drift Alerts
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Bell, BellOff, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Filter, RefreshCw, Shield,
} from "lucide-react";
import { toast } from "sonner";

type AlertStatus = "Active" | "Acknowledged" | "Resolved" | "All";

const SEVERITY_CONFIG = {
  Critical: { color: "#dc2626", bg: "#fee2e2", icon: XCircle, pulse: true },
  High:     { color: "#ea580c", bg: "#ffedd5", icon: AlertTriangle, pulse: false },
  Medium:   { color: "#d97706", bg: "#fef3c7", icon: AlertTriangle, pulse: false },
  Low:      { color: "#16a34a", bg: "#dcfce7", icon: Shield, pulse: false },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  FinancialVsMissionDivergence: "Financial vs Mission Divergence",
  StakeholderMisalignment: "Stakeholder Misalignment",
  GovernanceWeakness: "Governance Weakness",
  LeadershipContinuityRisk: "Leadership Continuity Risk",
  OverallMissionDrift: "Overall Mission Drift",
};

export default function MissionDriftAlertsPanel() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus>("Active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: alerts = [], isLoading, refetch } = trpc.missionIntegrity.getAllAlerts.useQuery(
    { status: statusFilter },
    { refetchInterval: 30_000 }
  );

  const acknowledge = trpc.missionIntegrity.acknowledgeAlert.useMutation({
    onSuccess: () => {
      utils.missionIntegrity.getAllAlerts.invalidate();
      utils.missionIntegrity.getPortfolioSummary.invalidate();
      toast.success("Alert acknowledged");
    },
    onError: () => toast.error("Failed to acknowledge alert"),
  });

  const resolve = trpc.missionIntegrity.resolveAlert.useMutation({
    onSuccess: () => {
      utils.missionIntegrity.getAllAlerts.invalidate();
      utils.missionIntegrity.getPortfolioSummary.invalidate();
      toast.success("Alert resolved");
    },
    onError: () => toast.error("Failed to resolve alert"),
  });

  const activeCount = alerts.filter((a: any) => a.status === "Active").length;
  const criticalCount = alerts.filter((a: any) => a.severity === "Critical").length;

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={18} style={{ color: activeCount > 0 ? "#dc2626" : "#6b7280" }} />
            {activeCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: "9px", background: "#dc2626" }}
              >
                {activeCount > 9 ? "9+" : activeCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Mission Drift Alerts
            </h3>
            <p className="text-xs text-gray-400">
              {activeCount > 0
                ? `${activeCount} active alert${activeCount !== 1 ? "s" : ""}${criticalCount > 0 ? ` · ${criticalCount} critical` : ""}`
                : "No active alerts — mission integrity holding"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw size={13} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 px-6 pt-3 pb-0">
        {(["Active", "Acknowledged", "Resolved", "All"] as AlertStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: statusFilter === s ? "#f3f4f6" : "transparent",
              color: statusFilter === s ? "#1a2332" : "#6b7280",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <RefreshCw size={16} className="animate-spin mr-2" />
            <span className="text-sm">Loading alerts…</span>
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <BellOff size={28} className="mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {statusFilter === "Active" ? "No active drift alerts" : `No ${statusFilter.toLowerCase()} alerts`}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {statusFilter === "Active" ? "Record a Mission Integrity score to trigger automated analysis" : ""}
            </p>
          </div>
        )}

        {alerts.map((alert: any) => {
          const sev = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Medium;
          const SevIcon = sev.icon;
          const isExpanded = expandedId === alert.id;
          const typeLabel = ALERT_TYPE_LABELS[alert.alertType] || alert.alertType;

          return (
            <div
              key={alert.id}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: alert.status === "Active" ? sev.color + "40" : "#e5e7eb",
                borderLeft: `3px solid ${alert.status === "Active" ? sev.color : "#e5e7eb"}`,
              }}
            >
              {/* Alert Header Row */}
              <div
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: sev.bg }}
                >
                  <SevIcon size={13} style={{ color: sev.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">{typeLabel}</span>
                    <Badge
                      className="text-[9px] px-1.5 py-0"
                      style={{ background: sev.bg, color: sev.color, border: "none" }}
                    >
                      {alert.severity}
                    </Badge>
                    {alert.status === "Acknowledged" && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-gray-100 text-gray-500 border-none">
                        Acknowledged
                      </Badge>
                    )}
                    {alert.status === "Resolved" && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-green-50 text-green-600 border-none">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {alert.ventureId}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-1">
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                  <div className="pt-3 space-y-3">
                    {/* Evidence */}
                    {alert.evidence && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Evidence</p>
                        <p className="text-xs text-gray-700">{alert.evidence}</p>
                      </div>
                    )}

                    {/* Recommended Action */}
                    {alert.recommendedAction && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Recommended Action</p>
                        <p className="text-xs text-gray-700">{alert.recommendedAction}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {alert.status === "Active" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          style={{ borderColor: "#d97706", color: "#d97706" }}
                          onClick={() => acknowledge.mutate({ alertId: alert.id })}
                          disabled={acknowledge.isPending}
                        >
                          <CheckCircle2 size={11} /> Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          style={{ borderColor: "#16a34a", color: "#16a34a" }}
                          onClick={() => resolve.mutate({ alertId: alert.id })}
                          disabled={resolve.isPending}
                        >
                          <CheckCircle2 size={11} /> Resolve
                        </Button>
                      </div>
                    )}
                    {alert.status === "Acknowledged" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          style={{ borderColor: "#16a34a", color: "#16a34a" }}
                          onClick={() => resolve.mutate({ alertId: alert.id })}
                          disabled={resolve.isPending}
                        >
                          <CheckCircle2 size={11} /> Mark Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
          <span className="text-xs text-gray-400">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} · Auto-refreshes every 30s
          </span>
          <span className="text-xs text-gray-400">
            Powered by Mission Integrity Engine
          </span>
        </div>
      )}
    </div>
  );
}
