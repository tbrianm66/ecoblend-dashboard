// ============================================================
// ADMIN WIDGET SETTINGS PAGE
// Route: /admin/widget-settings
// Access: Platform Admin only
// Sections:
//   1. Global Widget Controls
//   2. Threshold Settings
//   3. Module-Level Widget Configuration
//   4. Role Visibility Controls
// ============================================================
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Settings, ToggleLeft, Sliders, Layers, Users,
  Save, RefreshCw, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ── Section Card ──────────────────────────────────────────────
function SettingsCard({
  icon: Icon,
  title,
  sub,
  children,
  accent = "#56A837",
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  sub?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}15` }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
        <div>
          <h2
            className="text-sm font-bold text-gray-900"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            {title}
          </h2>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Toggle Row ────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-gray-800 cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── Number Input Row ──────────────────────────────────────────
function NumberRow({
  label,
  description,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 h-8 text-sm text-right"
        />
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

// ── Module Config Table ───────────────────────────────────────
const ALL_MODULES = [
  "Venture Intake",
  "Discovery & Market Validation",
  "Proposition & Business Model",
  "Research & Technical Validation",
  "Risk Intelligence",
  "Readiness Scoring",
  "Investment Readiness",
  "Governance",
  "Execution Planning",
];

const ALL_WIDGET_TYPES = [
  "MissingEvidenceCard",
  "ScoreImprovementCard",
  "RDStageGuidanceCard",
  "InvestmentPackReadinessCard",
  "RiskMitigationCard",
  "StageGateApprovalCard",
];

const ALL_ROLES = ["admin", "user"];

// ── Main Page ─────────────────────────────────────────────────
export default function AdminWidgetSettings() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (!loading && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.contextual.adminGetWidgetSettings.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  // ── Global settings state ─────────────────────────────────
  const [global, setGlobal] = useState({
    enableWidgetsGlobally: true,
    showAsSidePanel: true,
    showInline: false,
    maxRecommendedPlaybooks: 3,
    defaultRecommendationThreshold: 40,
    enableUsageTracking: true,
    enableDismissalReasons: true,
    enableCompletionTracking: true,
    enableInvestorWarningGates: true,
    enableStageGateWarningGates: true,
  });

  // ── Threshold state ───────────────────────────────────────
  const [thresholds, setThresholds] = useState({
    evidenceConfidenceWarning: 50,
    readinessScoreWarning: 40,
    highRiskThreshold: 3,
    investorPackWarning: 60,
    stageGateMinEvidence: 3,
    maxUnresolvedHighRisks: 2,
  });

  // Populate from server data
  useEffect(() => {
    if (!data) return;
    if (data.global && Object.keys(data.global).length > 0) {
      setGlobal((prev) => ({
        ...prev,
        enableWidgetsGlobally: Boolean(data.global.enableWidgetsGlobally ?? prev.enableWidgetsGlobally),
        showAsSidePanel: Boolean(data.global.showAsSidePanel ?? prev.showAsSidePanel),
        showInline: Boolean(data.global.showInline ?? prev.showInline),
        maxRecommendedPlaybooks: Number(data.global.maxRecommendedPlaybooks ?? prev.maxRecommendedPlaybooks),
        defaultRecommendationThreshold: Number(data.global.defaultRecommendationThreshold ?? prev.defaultRecommendationThreshold),
        enableUsageTracking: Boolean(data.global.enableUsageTracking ?? prev.enableUsageTracking),
        enableDismissalReasons: Boolean(data.global.enableDismissalReasons ?? prev.enableDismissalReasons),
        enableCompletionTracking: Boolean(data.global.enableCompletionTracking ?? prev.enableCompletionTracking),
        enableInvestorWarningGates: Boolean(data.global.enableInvestorWarningGates ?? prev.enableInvestorWarningGates),
        enableStageGateWarningGates: Boolean(data.global.enableStageGateWarningGates ?? prev.enableStageGateWarningGates),
      }));
    }
    if (data.thresholds && Object.keys(data.thresholds).length > 0) {
      setThresholds((prev) => ({
        ...prev,
        evidenceConfidenceWarning: Number(data.thresholds.evidenceConfidenceWarning ?? prev.evidenceConfidenceWarning),
        readinessScoreWarning: Number(data.thresholds.readinessScoreWarning ?? prev.readinessScoreWarning),
        highRiskThreshold: Number(data.thresholds.highRiskThreshold ?? prev.highRiskThreshold),
        investorPackWarning: Number(data.thresholds.investorPackWarning ?? prev.investorPackWarning),
        stageGateMinEvidence: Number(data.thresholds.stageGateMinEvidence ?? prev.stageGateMinEvidence),
        maxUnresolvedHighRisks: Number(data.thresholds.maxUnresolvedHighRisks ?? prev.maxUnresolvedHighRisks),
      }));
    }
  }, [data]);

  // ── Mutations ─────────────────────────────────────────────
  const updateGlobal = trpc.contextual.adminUpdateWidgetGlobalSettings.useMutation({
    onSuccess: () => {
      toast.success("Global settings saved");
      utils.contextual.adminGetWidgetSettings.invalidate();
    },
    onError: () => toast.error("Failed to save global settings"),
  });

  const updateThresholds = trpc.contextual.adminUpdateWidgetThresholds.useMutation({
    onSuccess: () => {
      toast.success("Threshold settings saved");
      utils.contextual.adminGetWidgetSettings.invalidate();
    },
    onError: () => toast.error("Failed to save thresholds"),
  });

  const updateModuleConfig = trpc.contextual.adminUpdateModuleWidgetConfig.useMutation({
    onSuccess: () => {
      toast.success("Module config updated");
      utils.contextual.adminGetWidgetSettings.invalidate();
    },
    onError: () => toast.error("Failed to update module config"),
  });

  const updateRoleVisibility = trpc.contextual.adminUpdateRoleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Role visibility updated");
      utils.contextual.adminGetWidgetSettings.invalidate();
    },
    onError: () => toast.error("Failed to update role visibility"),
  });

  // ── Module config helpers ─────────────────────────────────
  const getModuleConfig = (module: string, widgetType: string) => {
    const configs = data?.moduleConfigs || [];
    return configs.find(
      (c: any) => c.module === module && c.widget_type === widgetType
    );
  };

  const isModuleWidgetEnabled = (module: string, widgetType: string) => {
    const cfg = getModuleConfig(module, widgetType);
    return cfg ? Boolean(cfg.isEnabled) : true; // default enabled
  };

  // ── Role visibility helpers ───────────────────────────────
  const getRoleVisibility = (role: string, widgetType: string) => {
    const settings = data?.roleSettings || [];
    const s = settings.find(
      (r: any) => r.role === role && r.widget_type === widgetType
    );
    return s ? Boolean(s.isVisible) : true; // default visible
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw size={24} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading widget settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#56A83715", color: "#56A837" }}
              >
                Admin
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">
                Widget Settings
              </span>
            </div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Widget System Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure global behaviour, thresholds, module-level controls and
              role visibility for the contextual widget system.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-5xl">
        {/* 1. Global Controls */}
        <SettingsCard
          icon={ToggleLeft}
          title="Global Widget Controls"
          sub="Master switches for the contextual widget system"
          accent="#56A837"
        >
          <ToggleRow
            id="enableWidgetsGlobally"
            label="Enable Widgets Globally"
            description="Master switch — disabling this hides all contextual widgets across the platform."
            checked={global.enableWidgetsGlobally}
            onChange={(v) => setGlobal((p) => ({ ...p, enableWidgetsGlobally: v }))}
          />
          <ToggleRow
            id="showAsSidePanel"
            label="Show as Side Panel"
            description="Display widget cards in the right-side contextual panel."
            checked={global.showAsSidePanel}
            onChange={(v) => setGlobal((p) => ({ ...p, showAsSidePanel: v }))}
          />
          <ToggleRow
            id="showInline"
            label="Show Inline"
            description="Also render widget cards inline within module content areas."
            checked={global.showInline}
            onChange={(v) => setGlobal((p) => ({ ...p, showInline: v }))}
          />
          <ToggleRow
            id="enableUsageTracking"
            label="Enable Usage Tracking"
            description="Log widget view, open, complete and dismiss events for analytics."
            checked={global.enableUsageTracking}
            onChange={(v) => setGlobal((p) => ({ ...p, enableUsageTracking: v }))}
          />
          <ToggleRow
            id="enableDismissalReasons"
            label="Prompt for Dismissal Reasons"
            description="Ask users why they dismissed a recommendation."
            checked={global.enableDismissalReasons}
            onChange={(v) => setGlobal((p) => ({ ...p, enableDismissalReasons: v }))}
          />
          <ToggleRow
            id="enableCompletionTracking"
            label="Enable Completion Tracking"
            description="Track step-by-step playbook completion progress per venture."
            checked={global.enableCompletionTracking}
            onChange={(v) => setGlobal((p) => ({ ...p, enableCompletionTracking: v }))}
          />
          <ToggleRow
            id="enableInvestorWarningGates"
            label="Enable Investor Warning Gates"
            description="Block or warn when generating investor packs with low readiness scores."
            checked={global.enableInvestorWarningGates}
            onChange={(v) => setGlobal((p) => ({ ...p, enableInvestorWarningGates: v }))}
          />
          <ToggleRow
            id="enableStageGateWarningGates"
            label="Enable Stage-Gate Warning Gates"
            description="Surface blockers and pending approvals before stage-gate submissions."
            checked={global.enableStageGateWarningGates}
            onChange={(v) => setGlobal((p) => ({ ...p, enableStageGateWarningGates: v }))}
          />
          <NumberRow
            label="Max Recommended Playbooks"
            description="Maximum number of playbooks shown per widget card."
            value={global.maxRecommendedPlaybooks}
            onChange={(v) => setGlobal((p) => ({ ...p, maxRecommendedPlaybooks: v }))}
            min={1}
            max={10}
          />
          <NumberRow
            label="Default Recommendation Threshold"
            description="Minimum relevance score (0–100) for a playbook to appear."
            value={global.defaultRecommendationThreshold}
            onChange={(v) => setGlobal((p) => ({ ...p, defaultRecommendationThreshold: v }))}
            min={0}
            max={100}
            unit="%"
          />
          <div className="pt-4">
            <Button
              size="sm"
              className="gap-1.5"
              style={{ background: "#56A837" }}
              onClick={() => updateGlobal.mutate(global)}
              disabled={updateGlobal.isPending}
            >
              <Save size={13} />
              {updateGlobal.isPending ? "Saving…" : "Save Global Settings"}
            </Button>
          </div>
        </SettingsCard>

        {/* 2. Threshold Settings */}
        <SettingsCard
          icon={Sliders}
          title="Threshold Settings"
          sub="Numeric thresholds that control when warning states and blockers are triggered"
          accent="#3B85BA"
        >
          <NumberRow
            label="Evidence Confidence Warning"
            description="Show MissingEvidenceCard warning when average evidence confidence falls below this."
            value={thresholds.evidenceConfidenceWarning}
            onChange={(v) => setThresholds((p) => ({ ...p, evidenceConfidenceWarning: v }))}
            min={0}
            max={100}
            unit="%"
          />
          <NumberRow
            label="Readiness Score Warning"
            description="Show ScoreImprovementCard when VRL/TRL composite score falls below this."
            value={thresholds.readinessScoreWarning}
            onChange={(v) => setThresholds((p) => ({ ...p, readinessScoreWarning: v }))}
            min={0}
            max={100}
            unit="%"
          />
          <NumberRow
            label="High Risk Threshold"
            description="Show RiskMitigationCard when unmitigated high/critical risks exceed this count."
            value={thresholds.highRiskThreshold}
            onChange={(v) => setThresholds((p) => ({ ...p, highRiskThreshold: v }))}
            min={0}
            max={20}
            unit="risks"
          />
          <NumberRow
            label="Investor Pack Warning Score"
            description="Show InvestmentPackReadinessCard warning when investor readiness score falls below this."
            value={thresholds.investorPackWarning}
            onChange={(v) => setThresholds((p) => ({ ...p, investorPackWarning: v }))}
            min={0}
            max={100}
            unit="%"
          />
          <NumberRow
            label="Stage-Gate Minimum Evidence"
            description="Minimum number of approved evidence items required before stage-gate submission."
            value={thresholds.stageGateMinEvidence}
            onChange={(v) => setThresholds((p) => ({ ...p, stageGateMinEvidence: v }))}
            min={0}
            max={20}
            unit="items"
          />
          <NumberRow
            label="Max Unresolved High Risks"
            description="Maximum unresolved high/critical risks allowed before stage-gate is blocked."
            value={thresholds.maxUnresolvedHighRisks}
            onChange={(v) => setThresholds((p) => ({ ...p, maxUnresolvedHighRisks: v }))}
            min={0}
            max={10}
            unit="risks"
          />
          <div className="pt-4">
            <Button
              size="sm"
              className="gap-1.5"
              style={{ background: "#3B85BA" }}
              onClick={() => updateThresholds.mutate(thresholds)}
              disabled={updateThresholds.isPending}
            >
              <Save size={13} />
              {updateThresholds.isPending ? "Saving…" : "Save Thresholds"}
            </Button>
          </div>
        </SettingsCard>

        {/* 3. Module-Level Widget Configuration */}
        <SettingsCard
          icon={Layers}
          title="Module-Level Widget Configuration"
          sub="Enable or disable individual widget types per module"
          accent="#F69111"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wider w-48">
                    Module
                  </th>
                  {ALL_WIDGET_TYPES.map((wt) => (
                    <th
                      key={wt}
                      className="text-center py-2 px-2 font-semibold text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: 80 }}
                    >
                      <span className="font-mono text-[10px]">
                        {wt.replace("Card", "")}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map((mod) => (
                  <tr
                    key={mod}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="py-2 pr-4 text-gray-700 font-medium text-xs">
                      {mod}
                    </td>
                    {ALL_WIDGET_TYPES.map((wt) => (
                      <td key={wt} className="text-center py-2 px-2">
                        <Switch
                          checked={isModuleWidgetEnabled(mod, wt)}
                          onCheckedChange={(v) =>
                            updateModuleConfig.mutate({
                              module: mod,
                              widgetType: wt,
                              isEnabled: v,
                            })
                          }
                          className="scale-75"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>
              Changes take effect immediately. Disabled widgets are hidden from
              all users in that module regardless of role settings.
            </span>
          </div>
        </SettingsCard>

        {/* 4. Role Visibility Controls */}
        <SettingsCard
          icon={Users}
          title="Role Visibility Controls"
          sub="Control which widget types are visible to each user role"
          accent="#8b5cf6"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-500 uppercase tracking-wider w-24">
                    Role
                  </th>
                  {ALL_WIDGET_TYPES.map((wt) => (
                    <th
                      key={wt}
                      className="text-center py-2 px-2 font-semibold text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: 80 }}
                    >
                      <span className="font-mono text-[10px]">
                        {wt.replace("Card", "")}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_ROLES.map((role) => (
                  <tr
                    key={role}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="py-2 pr-4">
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                        style={
                          role === "admin"
                            ? { color: "#56A837", borderColor: "#56A837" }
                            : { color: "#3B85BA", borderColor: "#3B85BA" }
                        }
                      >
                        {role}
                      </Badge>
                    </td>
                    {ALL_WIDGET_TYPES.map((wt) => (
                      <td key={wt} className="text-center py-2 px-2">
                        <Switch
                          checked={getRoleVisibility(role, wt)}
                          onCheckedChange={(v) =>
                            updateRoleVisibility.mutate({
                              role,
                              widgetType: wt,
                              isVisible: v,
                            })
                          }
                          className="scale-75"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>
              Role visibility is evaluated after module-level config. A widget
              disabled at module level will not appear regardless of role
              settings.
            </span>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
