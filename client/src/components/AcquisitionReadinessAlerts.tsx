// ============================================================
// ACQUISITION READINESS ALERTS — Phase 5 Medium-Term
// Monitors for predatory acquisition signals and triggers
// protective alerts based on venture scoring dimensions.
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle, Shield, TrendingUp, CheckCircle2,
  ChevronDown, ChevronUp, RefreshCw, Target,
  DollarSign, Cpu, Globe, Users, Lock, Scale,
} from "lucide-react";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Critical" },
  High: { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", label: "High" },
  Medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Medium" },
  Low: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Low" },
};

const RISK_LEVEL_CONFIG: Record<string, { color: string; bg: string }> = {
  Critical: { color: "#dc2626", bg: "#fef2f2" },
  High: { color: "#ea580c", bg: "#fff7ed" },
  Medium: { color: "#d97706", bg: "#fffbeb" },
  Low: { color: "#16a34a", bg: "#f0fdf4" },
};

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  financialAttractiveness: DollarSign,
  ipValue: Cpu,
  marketPosition: Globe,
  teamQuality: Users,
  missionProtectionStrength: Lock,
  governanceMaturity: Scale,
};

interface ScoreFormData {
  ventureId: string;
  ventureName: string;
  financialAttractiveness: number;
  ipValue: number;
  marketPosition: number;
  teamQuality: number;
  missionProtectionStrength: number;
  governanceMaturity: number;
  notes: string;
}

const DEFAULT_SCORE: ScoreFormData = {
  ventureId: "",
  ventureName: "",
  financialAttractiveness: 50,
  ipValue: 50,
  marketPosition: 50,
  teamQuality: 50,
  missionProtectionStrength: 50,
  governanceMaturity: 50,
  notes: "",
};

export default function AcquisitionReadinessAlerts() {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [scoreForm, setScoreForm] = useState<ScoreFormData>(DEFAULT_SCORE);
  const [activeView, setActiveView] = useState<"alerts" | "scores" | "framework">("alerts");

  const { data: portfolioRisk, refetch: refetchRisk, isLoading: riskLoading } = trpc.acquisitionReadiness.getPortfolioRisk.useQuery();
  const { data: framework } = trpc.acquisitionReadiness.getFramework.useQuery();
  const { data: ventures } = trpc.ventures.list.useQuery();

  const recordScore = trpc.acquisitionReadiness.recordScore.useMutation({
    onSuccess: (result) => {
      toast.success(`Score recorded — Risk Level: ${result.riskLevel}. ${result.alertsGenerated} alert(s) generated.`);
      refetchRisk();
      setShowScoreForm(false);
      setScoreForm(DEFAULT_SCORE);
    },
    onError: () => toast.error("Failed to record score"),
  });

  const acknowledgeAlert = trpc.acquisitionReadiness.acknowledgeAlert.useMutation({
    onSuccess: () => { toast.success("Alert acknowledged"); refetchRisk(); },
    onError: () => toast.error("Failed to acknowledge alert"),
  });

  const resolveAlert = trpc.acquisitionReadiness.resolveAlert.useMutation({
    onSuccess: () => { toast.success("Alert resolved"); refetchRisk(); },
    onError: () => toast.error("Failed to resolve alert"),
  });

  const alerts = (portfolioRisk?.alerts ?? []) as any[];
  const scores = (portfolioRisk?.scores ?? []) as any[];
  const dimensions = framework?.dimensions ?? [];

  const criticalCount = alerts.filter((a: any) => a.severity === "Critical").length;
  const highCount = alerts.filter((a: any) => a.severity === "High").length;

  const handleScoreSubmit = () => {
    if (!scoreForm.ventureId) { toast.error("Please select a venture"); return; }
    recordScore.mutate({
      ventureId: scoreForm.ventureId,
      ventureName: scoreForm.ventureName,
      financialAttractiveness: scoreForm.financialAttractiveness,
      ipValue: scoreForm.ipValue,
      marketPosition: scoreForm.marketPosition,
      teamQuality: scoreForm.teamQuality,
      missionProtectionStrength: scoreForm.missionProtectionStrength,
      governanceMaturity: scoreForm.governanceMaturity,
      notes: scoreForm.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} style={{ color: "#dc2626" }} />
            <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Acquisition Readiness Alerts
            </h2>
            {criticalCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#ea580c" }}>
                {highCount} High
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Monitor acquisition vulnerability signals and protect mission integrity from predatory acquirers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => refetchRisk()}
            disabled={riskLoading}
          >
            <RefreshCw size={12} className={riskLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "#dc2626" }}
            onClick={() => setShowScoreForm(!showScoreForm)}
          >
            <Target size={12} />
            Assess Venture
          </Button>
        </div>
      </div>

      {/* Score Assessment Form */}
      {showScoreForm && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Acquisition Readiness Assessment</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Venture</label>
              <select
                className="w-full text-sm border rounded-lg px-3 py-2"
                style={{ borderColor: "#e5e7eb" }}
                value={scoreForm.ventureId}
                onChange={e => {
                  const v = (ventures ?? []).find((v: any) => v.id === e.target.value);
                  setScoreForm(f => ({ ...f, ventureId: e.target.value, ventureName: v?.name ?? "" }));
                }}
              >
                <option value="">Select venture...</option>
                {(ventures ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
              <input
                type="text"
                className="w-full text-sm border rounded-lg px-3 py-2"
                style={{ borderColor: "#e5e7eb" }}
                placeholder="Optional assessment notes..."
                value={scoreForm.notes}
                onChange={e => setScoreForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {dimensions.map(dim => {
              const Icon = DIMENSION_ICONS[dim.key] ?? Target;
              const val = (scoreForm as any)[dim.key] as number;
              const isRisk = dim.key === "missionProtectionStrength" || dim.key === "governanceMaturity";
              const isHighRisk = isRisk ? val < dim.highRiskThreshold : val > dim.highRiskThreshold;
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color: isHighRisk ? "#dc2626" : "#6b7280" }} />
                      <label className="text-xs font-semibold text-gray-700">{dim.label}</label>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: isHighRisk ? "#dc2626" : "#1a2332" }}>
                      {val}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={e => setScoreForm(f => ({ ...f, [dim.key]: parseInt(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: isHighRisk ? "#dc2626" : "#51AF37" }}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">{dim.description}</p>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowScoreForm(false)}>Cancel</Button>
            <Button
              size="sm"
              className="text-xs gap-1.5"
              style={{ background: "#dc2626" }}
              onClick={handleScoreSubmit}
              disabled={recordScore.isPending}
            >
              <Target size={12} />
              {recordScore.isPending ? "Assessing..." : "Run Assessment"}
            </Button>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#f3f4f6" }}>
        {[
          { key: "alerts", label: `Active Alerts (${alerts.length})` },
          { key: "scores", label: `Venture Scores (${scores.length})` },
          { key: "framework", label: "Assessment Framework" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as any)}
            className="flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all"
            style={{
              background: activeView === tab.key ? "white" : "transparent",
              color: activeView === tab.key ? "#1a2332" : "#6b7280",
              boxShadow: activeView === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Alerts View */}
      {activeView === "alerts" && (
        <div>
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#e5e7eb" }}>
              <Shield size={32} className="mx-auto mb-3" style={{ color: "#16a34a" }} />
              <p className="text-sm font-semibold text-gray-700">No Active Acquisition Alerts</p>
              <p className="text-xs text-gray-400 mt-1">
                Run an acquisition readiness assessment to identify vulnerabilities.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => {
                const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.Medium;
                const isExpanded = expandedAlert === alert.id;
                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-xl border overflow-hidden"
                    style={{ borderColor: cfg.border, borderLeft: `4px solid ${cfg.color}` }}
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer"
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} style={{ color: cfg.color, marginTop: 2 }} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{alert.venture_name}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: "#f3f4f6" }}>
                        <p className="text-sm text-gray-600 mt-3 mb-3">{alert.description}</p>
                        {alert.recommended_action && (
                          <div className="rounded-lg p-3 mb-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div className="flex items-start gap-2">
                              <CheckCircle2 size={14} style={{ color: "#16a34a", marginTop: 1 }} />
                              <div>
                                <p className="text-xs font-bold text-green-800 mb-0.5">Recommended Action</p>
                                <p className="text-xs text-green-700">{alert.recommended_action}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {alert.trigger_value != null && (
                          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                            <span>Trigger: <strong style={{ color: cfg.color }}>{alert.trigger_value}</strong></span>
                            <span>Threshold: <strong>{alert.threshold_value}</strong></span>
                            <span>Type: <strong>{alert.alert_type}</strong></span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1"
                            onClick={() => acknowledgeAlert.mutate({ alertId: alert.id })}
                            disabled={acknowledgeAlert.isPending}
                          >
                            <CheckCircle2 size={11} /> Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs gap-1"
                            style={{ background: "#16a34a" }}
                            onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                            disabled={resolveAlert.isPending}
                          >
                            <Shield size={11} /> Mark Resolved
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Venture Scores View */}
      {activeView === "scores" && (
        <div>
          {scores.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#e5e7eb" }}>
              <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">No Scores Recorded Yet</p>
              <p className="text-xs text-gray-400 mt-1">Run an acquisition readiness assessment to see scores here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {scores.map((score: any) => {
                const riskCfg = RISK_LEVEL_CONFIG[score.acquisition_risk_level] ?? RISK_LEVEL_CONFIG.Medium;
                return (
                  <div key={score.venture_id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{score.venture_id}</p>
                        <p className="text-xs text-gray-400">Last assessed: {new Date(score.recorded_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: riskCfg.color, fontFamily: "'Prompt', sans-serif" }}>
                          {score.overall_score}
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: riskCfg.bg, color: riskCfg.color }}>
                          {score.acquisition_risk_level} Risk
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score.overall_score}%`, background: riskCfg.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assessment Framework View */}
      {activeView === "framework" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Risk Level Definitions</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(framework?.riskLevels ?? {}).map(([level, config]: [string, any]) => (
                <div key={level} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: config.color + "10", border: `1px solid ${config.color}30` }}>
                  <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: config.color }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: config.color }}>{level}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {dimensions.map(dim => {
            const Icon = DIMENSION_ICONS[dim.key] ?? Target;
            return (
              <div key={dim.key} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f3f4f6" }}>
                    <Icon size={16} style={{ color: "#1a2332" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{dim.label}</h4>
                      <Badge variant="outline" className="text-[10px]">{Math.round(dim.weight * 100)}% weight</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{dim.description}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Protective Actions:</p>
                  <ul className="space-y-1">
                    {dim.protectiveActions.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <Shield size={10} style={{ color: "#16a34a", marginTop: 2 }} />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
