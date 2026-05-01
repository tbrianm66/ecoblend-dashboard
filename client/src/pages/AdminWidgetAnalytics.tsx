// ============================================================
// ADMIN WIDGET ANALYTICS DASHBOARD
// Route: /admin/widget-analytics
// Access: Platform Admin and Studio Director only
// Design: Precision Industrial — EcoBlend OS Admin Suite
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  BarChart3, TrendingUp, BookOpenCheck, Eye, CheckCircle2,
  XCircle, AlertTriangle, Download, Filter, RefreshCw,
  Activity, Layers, Users, FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Helpers ───────────────────────────────────────────────────
const pct = (num: number, den: number) =>
  den > 0 ? `${Math.round((num / den) * 100)}%` : "—";

const fmt = (n: number | string | undefined) =>
  n !== undefined && n !== null ? Number(n).toLocaleString() : "0";

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex gap-4 items-start">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}15` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
          {label}
        </p>
        <p
          className="text-2xl font-bold"
          style={{ color: "#1a2332", fontFamily: "'Prompt', sans-serif" }}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2
        className="text-base font-bold text-gray-900"
        style={{ fontFamily: "'Prompt', sans-serif" }}
      >
        {title}
      </h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────
function DataTable({
  headers,
  rows,
  emptyMsg = "No data yet",
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  emptyMsg?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-8 text-center text-gray-400 text-xs"
              >
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────
function exportCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ─────────────────────────────────────────────────
const MODULES = [
  "All Modules",
  "Venture Intake",
  "Discovery & Market Validation",
  "Proposition & Business Model",
  "Research & Technical Validation",
  "Risk Intelligence",
  "Readiness Scoring",
  "Investment Readiness",
  "Governance",
];

const WIDGET_TYPES = [
  "All Widgets",
  "MissingEvidenceCard",
  "ScoreImprovementCard",
  "RDStageGuidanceCard",
  "InvestmentPackReadinessCard",
  "RiskMitigationCard",
  "StageGateApprovalCard",
];

const DATE_RANGES = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "Last 180 days", value: 180 },
];

export default function AdminWidgetAnalytics() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const [module, setModule] = useState("All Modules");
  const [widgetType, setWidgetType] = useState("All Widgets");

  // Guard: admin only
  if (!loading && user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const queryInput = useMemo(
    () => ({
      days,
      module: module === "All Modules" ? undefined : module,
      widgetType: widgetType === "All Widgets" ? undefined : widgetType,
    }),
    [days, module, widgetType]
  );

  const { data, isLoading, refetch } = trpc.contextual.adminFullAnalytics.useQuery(
    queryInput,
    { enabled: user?.role === "admin" }
  );

  const { data: csvData } = trpc.contextual.adminExportAnalyticsCsv.useQuery(
    { days, module: module === "All Modules" ? undefined : module },
    { enabled: user?.role === "admin" }
  );

  const ov = data?.overview || {};
  const recPerf = data?.recPerf || {};

  // Derived rates
  const openRate = pct(Number(recPerf.opened), Number(recPerf.displayed));
  const completionRate = pct(Number(recPerf.completed), Number(recPerf.opened));
  const dismissalRate = pct(Number(recPerf.dismissed), Number(recPerf.displayed));
  const evidenceConvRate = pct(Number(recPerf.evidenceLinked), Number(recPerf.opened));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#51AF3715", color: "#51AF37" }}
              >
                Admin
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">
                Widget Analytics
              </span>
            </div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Widget Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor contextual playbook and widget usage across all ventures
              and modules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              style={{ borderColor: "#3A97D3", color: "#3A97D3" }}
              onClick={() =>
                csvData?.rows && exportCsv(csvData.rows, `widget-analytics-${days}d.csv`)
              }
            >
              <Download size={13} /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          <Select
            value={String(days)}
            onValueChange={(v) => setDays(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="h-8 text-xs w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={widgetType} onValueChange={setWidgetType}>
            <SelectTrigger className="h-8 text-xs w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WIDGET_TYPES.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Section 1: Widget Usage Overview */}
        <section>
          <SectionHeader
            title="Widget Usage Overview"
            sub="Aggregate interaction signals across all contextual widgets"
          />
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Widget Views"
                value={fmt(ov.totalViews)}
                icon={Eye}
                accent="#51AF37"
              />
              <KpiCard
                label="Playbook Opens"
                value={fmt(ov.playbookOpens)}
                sub={`Open rate: ${openRate}`}
                icon={BookOpenCheck}
                accent="#3A97D3"
              />
              <KpiCard
                label="Playbook Completions"
                value={fmt(ov.playbookCompletions)}
                sub={`Completion rate: ${completionRate}`}
                icon={CheckCircle2}
                accent="#51AF37"
              />
              <KpiCard
                label="Dismissals"
                value={fmt(ov.dismissals)}
                sub={`Dismissal rate: ${dismissalRate}`}
                icon={XCircle}
                accent="#ef4444"
              />
              <KpiCard
                label="Evidence Linked"
                value={fmt(ov.evidenceLinked)}
                sub={`Evidence conversion: ${evidenceConvRate}`}
                icon={Activity}
                accent="#8b5cf6"
              />
              <KpiCard
                label="Approvals Supported"
                value={fmt(ov.approvalsSupported)}
                icon={CheckCircle2}
                accent="#F49C13"
              />
              <KpiCard
                label="Investor Warnings"
                value={fmt(ov.investorWarnings)}
                icon={AlertTriangle}
                accent="#F49C13"
              />
              <KpiCard
                label="Draft Packs w/ Warnings"
                value={fmt(ov.draftPacksWithWarnings)}
                icon={FileWarning}
                accent="#ef4444"
              />
            </div>
          )}
        </section>

        {/* Section 2: Recommendation Performance */}
        <section>
          <SectionHeader
            title="Recommendation Performance"
            sub="How well recommendations are converting to action"
          />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Displayed", value: fmt(recPerf.displayed), accent: "#6b7280" },
              { label: "Opened", value: fmt(recPerf.opened), accent: "#3A97D3" },
              { label: "Completed", value: fmt(recPerf.completed), accent: "#51AF37" },
              { label: "Dismissed", value: fmt(recPerf.dismissed), accent: "#ef4444" },
              { label: "Evidence Linked", value: fmt(recPerf.evidenceLinked), accent: "#8b5cf6" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  {item.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: item.accent, fontFamily: "'Prompt', sans-serif" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Usage by Module */}
        <section>
          <SectionHeader
            title="Usage by Module"
            sub="Widget interactions grouped by platform module"
          />
          <DataTable
            headers={["Module", "Views", "Opens", "Completions", "Open Rate"]}
            rows={(data?.byModule || []).map((r: any) => [
              r.module || "Unknown",
              fmt(r.views),
              fmt(r.opens),
              fmt(r.completions),
              pct(Number(r.opens), Number(r.views)),
            ])}
            emptyMsg="No module usage data for this period"
          />
        </section>

        {/* Section 4: Usage by Widget Type */}
        <section>
          <SectionHeader
            title="Usage by Widget Type"
            sub="Breakdown of which widget cards are generating the most engagement"
          />
          <DataTable
            headers={["Widget Type", "Views", "Opens", "Open Rate"]}
            rows={(data?.byWidget || []).map((r: any) => [
              <Badge
                key={r.widget_type}
                variant="outline"
                className="text-xs font-mono"
              >
                {r.widget_type || "Unknown"}
              </Badge>,
              fmt(r.views),
              fmt(r.opens),
              pct(Number(r.opens), Number(r.views)),
            ])}
            emptyMsg="No widget type data for this period"
          />
        </section>

        {/* Section 5: Playbook Engagement */}
        <section>
          <SectionHeader
            title="Playbook Engagement"
            sub="Top playbooks by views, opens, completions and dismissals"
          />
          <DataTable
            headers={[
              "Playbook",
              "Category",
              "Views",
              "Opens",
              "Completions",
              "Dismissals",
              "Open Rate",
            ]}
            rows={(data?.topPlaybooks || []).map((r: any) => [
              r.title || r.playbook_id || "Unknown",
              r.category ? (
                <Badge variant="outline" className="text-xs">
                  {r.category}
                </Badge>
              ) : (
                "—"
              ),
              fmt(r.views),
              fmt(r.opens),
              fmt(r.completions),
              fmt(r.dismissals),
              pct(Number(r.opens), Number(r.views)),
            ])}
            emptyMsg="No playbook engagement data for this period"
          />
        </section>

        {/* Section 6: Dismissal Reasons */}
        {(data?.dismissReasons || []).length > 0 && (
          <section>
            <SectionHeader
              title="Dismissal Reasons"
              sub="Why users are dismissing recommendations"
            />
            <DataTable
              headers={["Reason", "Count"]}
              rows={(data?.dismissReasons || []).map((r: any) => [
                r.dismissed_reason || "Not specified",
                fmt(r.count),
              ])}
            />
          </section>
        )}

        {/* Section 7: Playbooks with No Context Rules */}
        {(data?.orphanPlaybooks || []).length > 0 && (
          <section>
            <SectionHeader
              title="Playbooks Without Active Context Rules"
              sub="Published playbooks that will not appear contextually — consider adding context rules"
            />
            <DataTable
              headers={["Playbook ID", "Title", "Category", "Status"]}
              rows={(data?.orphanPlaybooks || []).map((r: any) => [
                <span key={r.id} className="font-mono text-xs text-gray-500">
                  {r.id}
                </span>,
                r.title || "—",
                r.category || "—",
                <Badge
                  key={r.status}
                  variant="outline"
                  className="text-xs"
                  style={{ color: "#51AF37", borderColor: "#51AF37" }}
                >
                  {r.status}
                </Badge>,
              ])}
            />
          </section>
        )}

        {/* Venture Impact Signals note */}
        <section>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Venture Impact Signals
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Correlation between widget interactions and downstream outcomes
                  (evidence completion, score improvements, risk mitigation, stage-gate
                  approvals) will be available once sufficient usage data has been
                  collected. These signals are correlational, not causal.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
