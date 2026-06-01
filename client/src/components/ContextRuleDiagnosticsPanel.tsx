// ============================================================
// CONTEXT RULE DIAGNOSTICS PANEL
// Used in: /admin/widget-settings and /admin/widget-analytics
// Purpose: Explain why specific recommendations appear for a
//          given module/venture/page combination
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import {
  Search, CheckCircle2, XCircle, AlertTriangle, Info,
  ChevronDown, ChevronUp, Zap,
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

const MODULES = [
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

function RuleRow({
  rule,
  matched,
}: {
  rule: any;
  matched: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const reasons = matched ? rule.matchReasons || [] : rule.exclusionReasons || [];

  return (
    <div
      className={`rounded-lg border p-3 mb-2 ${
        matched
          ? "border-green-100 bg-green-50/50"
          : "border-red-50 bg-red-50/30"
      }`}
    >
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-2 min-w-0">
          {matched ? (
            <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {rule.playbook_title || rule.playbook_id || "Unknown Playbook"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Rule ID: {rule.id} · Priority: {rule.priority ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge
            variant="outline"
            className="text-[10px]"
            style={
              matched
                ? { color: "#56A837", borderColor: "#56A837" }
                : { color: "#9ca3af", borderColor: "#e5e7eb" }
            }
          >
            {matched ? "Matched" : "Excluded"}
          </Badge>
          {expanded ? (
            <ChevronUp size={12} className="text-gray-400" />
          ) : (
            <ChevronDown size={12} className="text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          {reasons.map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5">
              <Zap
                size={10}
                className={matched ? "text-green-500 mt-0.5" : "text-red-400 mt-0.5"}
              />
              <span className="text-[11px] text-gray-600">{r}</span>
            </div>
          ))}
          {reasons.length === 0 && (
            <p className="text-[11px] text-gray-400 italic">No reasons recorded</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-400">
            {rule.module && (
              <span>Module: <strong className="text-gray-600">{rule.module}</strong></span>
            )}
            {rule.min_vrl !== undefined && (
              <span>Min VRL: <strong className="text-gray-600">{rule.min_vrl}</strong></span>
            )}
            {rule.max_vrl !== undefined && (
              <span>Max VRL: <strong className="text-gray-600">{rule.max_vrl}</strong></span>
            )}
            {rule.min_trl !== undefined && (
              <span>Min TRL: <strong className="text-gray-600">{rule.min_trl}</strong></span>
            )}
            {rule.missing_evidence_trigger !== undefined && (
              <span>Missing Evidence Trigger: <strong className="text-gray-600">{rule.missing_evidence_trigger ? "Yes" : "No"}</strong></span>
            )}
            {rule.high_risk_trigger !== undefined && (
              <span>High Risk Trigger: <strong className="text-gray-600">{rule.high_risk_trigger ? "Yes" : "No"}</strong></span>
            )}
            {rule.low_score_trigger !== undefined && (
              <span>Low Score Trigger: <strong className="text-gray-600">{rule.low_score_trigger ? "Yes" : "No"}</strong></span>
            )}
            {rule.stage_gate_trigger !== undefined && (
              <span>Stage-Gate Trigger: <strong className="text-gray-600">{rule.stage_gate_trigger ? "Yes" : "No"}</strong></span>
            )}
            {rule.investor_warning_trigger !== undefined && (
              <span>Investor Warning Trigger: <strong className="text-gray-600">{rule.investor_warning_trigger ? "Yes" : "No"}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContextRuleDiagnosticsPanel() {
  const { ventures } = useVentures();
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [selectedVentureId, setSelectedVentureId] = useState<string>("none");
  const [runQuery, setRunQuery] = useState(false);

  const queryInput = useMemo(
    () => ({
      module: selectedModule,
      ventureId: selectedVentureId !== "none" ? selectedVentureId : undefined,
    }),
    [selectedModule, selectedVentureId]
  );

  const { data, isLoading, refetch } = trpc.contextual.adminGetContextDiagnostics.useQuery(
    queryInput,
    { enabled: runQuery }
  );

  const handleRun = () => {
    setRunQuery(true);
    if (runQuery) refetch();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#8b5cf615" }}
        >
          <Search size={16} style={{ color: "#8b5cf6" }} />
        </div>
        <div>
          <h2
            className="text-sm font-bold text-gray-900"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            Context Rule Diagnostics
          </h2>
          <p className="text-xs text-gray-400">
            Explain why recommendations appear for a given module and venture
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="flex items-end gap-3 flex-wrap mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Module
            </label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
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
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Venture (optional)
            </label>
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="Any venture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any venture</SelectItem>
                {ventures.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            className="gap-1.5 h-8"
            style={{ background: "#8b5cf6" }}
            onClick={handleRun}
            disabled={isLoading}
          >
            <Search size={12} />
            {isLoading ? "Running…" : "Run Diagnostics"}
          </Button>
        </div>

        {/* Results */}
        {!runQuery && (
          <div className="text-center py-8 text-gray-400">
            <Search size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              Select a module and click Run Diagnostics to see which rules apply.
            </p>
          </div>
        )}

        {runQuery && isLoading && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Evaluating context rules…</p>
          </div>
        )}

        {runQuery && !isLoading && data && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs font-semibold text-gray-700">
                  {data.matchedCount} matched
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-gray-700">
                  {data.excludedCount} excluded
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {data.totalRules} total rules evaluated for{" "}
                  <strong>{data.module}</strong>
                </span>
              </div>
              {data.venture && (
                <Badge variant="outline" className="text-xs">
                  Venture: {data.venture.name} (VRL {data.venture.vrl}, TRL{" "}
                  {data.venture.trl})
                </Badge>
              )}
            </div>

            {/* Matched Rules */}
            {data.matchedRules.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
                  Matched Rules ({data.matchedRules.length})
                </p>
                {data.matchedRules.map((rule: any) => (
                  <RuleRow key={rule.id} rule={rule} matched={true} />
                ))}
              </div>
            )}

            {/* Excluded Rules */}
            {data.excludedRules.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                  Excluded Rules ({data.excludedRules.length})
                </p>
                {data.excludedRules.map((rule: any) => (
                  <RuleRow key={rule.id} rule={rule} matched={false} />
                ))}
              </div>
            )}

            {data.matchedRules.length === 0 && data.excludedRules.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <AlertTriangle size={20} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">
                  No context rules found for this module. Add rules in the
                  Playbook Library to enable contextual recommendations.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
