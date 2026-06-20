import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Shield, XCircle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  F: "Founder Intent", E: "Equity & ESOP", D: "Decision Rights",
  S: "Stewardship", I: "IP Controls", L: "Legal Contracts", K: "Knowledge & Audit",
};

const STEP_COLORS: Record<string, string> = {
  F: "#0B2545", E: "#1B4D3E", D: "#7c3aed", S: "#3b82f6",
  I: "#B8862F", L: "#059669", K: "#dc2626",
};

const SEV_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#dc2626", bg: "#fee2e2", border: "#fecdd3" },
  high:     { label: "High",     color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  medium:   { label: "Medium",   color: "#3b82f6", bg: "#dbeafe", border: "#bfdbfe" },
  low:      { label: "Low",      color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:       { label: "Open",       color: "#dc2626", bg: "#fee2e2" },
  mitigated:  { label: "Mitigated",  color: "#16a34a", bg: "#dcfce7" },
  accepted:   { label: "Accepted",   color: "#6b7280", bg: "#f3f4f6" },
  escalated:  { label: "Escalated",  color: "#7c3aed", bg: "#ede9fe" },
};

export default function FedsilkRiskFlags() {
  const risksQ = trpc.fedsilkGovernance.getRisks.useQuery({});
  const updateRisk = trpc.fedsilkGovernance.updateRisk.useMutation({
    onSuccess: () => { risksQ.refetch(); toast.success("Risk updated"); },
    onError: () => toast.error("Update failed — please sign in"),
  });

  const [filterSev, setFilterSev] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: "open" as "open" | "mitigated" | "accepted" | "escalated", severity: "", notes: "" });

  const risks = risksQ.data ?? [];
  const filtered = risks.filter(r =>
    (filterSev === "all" || r.severity === filterSev) &&
    (filterStatus === "all" || r.status === filterStatus)
  );

  const openRisks     = risks.filter(r => r.status === "open").length;
  const criticalCount = risks.filter(r => r.severity === "critical" && r.status === "open").length;
  const highCount     = risks.filter(r => r.severity === "high" && r.status === "open").length;
  const mitigated     = risks.filter(r => r.status === "mitigated").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open Risks",       value: openRisks,     color: "#dc2626" },
          { label: "Critical",         value: criticalCount, color: "#dc2626" },
          { label: "High",             value: highCount,     color: "#d97706" },
          { label: "Mitigated",        value: mitigated,     color: "#16a34a" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border p-3" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex flex-wrap gap-1">
          {["all", "critical", "high", "medium", "low"].map(s => {
            const cfg = s === "all" ? null : SEV_CFG[s];
            return (
              <button key={s} onClick={() => setFilterSev(s)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
                style={{
                  background: filterSev === s ? (cfg?.color ?? "#0B2545") : (cfg?.bg ?? "#f3f4f6"),
                  color: filterSev === s ? "white" : (cfg?.color ?? "#6b7280"),
                  border: `1px solid ${cfg?.border ?? "#e5e7eb"}`,
                }}>
                {s === "all" ? "All Severities" : cfg?.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1 ml-auto">
          {["all", "open", "mitigated", "accepted", "escalated"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
              style={{
                background: filterStatus === s ? "#163662" : "#f3f4f6",
                color: filterStatus === s ? "white" : "#6b7280",
              }}>
              {s === "all" ? "All Statuses" : STATUS_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Risk cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center text-xs text-gray-400" style={{ borderColor: "#e5e7eb" }}>
            No risks match the current filters.
          </div>
        )}
        {filtered.map(risk => {
          const sev = SEV_CFG[risk.severity ?? "medium"];
          const sta = STATUS_CFG[risk.status ?? "open"] ?? STATUS_CFG["open"];
          const isEditing = editingId === risk.id;
          return (
            <div key={risk.id} className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${sev.color}` }}>
              <div className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className="text-[10px]" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                      {sev.label}
                    </Badge>
                    <Badge className="text-[10px]" style={{ background: sta.bg, color: sta.color, border: "none" }}>
                      {sta.label}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: STEP_COLORS[risk.stepKey ?? "F"] }}>{risk.stepKey}</span>
                      {STEP_LABELS[risk.stepKey ?? ""]}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{risk.riskName}</div>
                  <div className="text-[11px] text-gray-400 mb-2">{risk.category}</div>
                  {risk.recommendedAction && (
                    <div className="rounded p-2.5 text-[11px] leading-relaxed"
                      style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
                      <CheckCircle2 size={10} className="inline mr-1" />
                      <strong>Action:</strong> {risk.recommendedAction}
                    </div>
                  )}
                  {risk.owner && (
                    <div className="text-[10px] text-gray-400 mt-1.5">Owner: {risk.owner}</div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="text-[10px] h-7 px-2.5 flex-shrink-0"
                  style={{ borderColor: "#dde3ec" }}
                  onClick={() => {
                    if (isEditing) { setEditingId(null); return; }
                    setEditingId(risk.id);
                    setEditForm({
                      status: (risk.status as any) ?? "open",
                      severity: risk.severity ?? "medium",
                      notes: risk.notes ?? "",
                    });
                  }}>
                  {isEditing ? "Close" : "Update"}
                </Button>
              </div>
              {isEditing && (
                <div className="border-t px-5 py-3" style={{ borderColor: "#f3f4f6", background: "#f8fafc" }}>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Status</label>
                      <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                        value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}>
                        <option value="open">Open</option>
                        <option value="mitigated">Mitigated</option>
                        <option value="accepted">Accepted</option>
                        <option value="escalated">Escalated</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Severity</label>
                      <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                        value={editForm.severity}
                        onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Notes</label>
                      <input className="text-xs border rounded px-2 py-1.5 w-52" style={{ borderColor: "#dde3ec" }}
                        value={editForm.notes}
                        onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button size="sm" className="text-xs h-7" style={{ background: "#0B2545" }}
                      onClick={() => { updateRisk.mutate({ id: risk.id, ...editForm }); setEditingId(null); }}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
