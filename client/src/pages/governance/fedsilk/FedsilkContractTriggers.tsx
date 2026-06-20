import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  F: "Founder Intent", E: "Equity & ESOP", D: "Decision Rights",
  S: "Stewardship", I: "IP Controls", L: "Legal Contracts", K: "Knowledge & Audit",
};

const STEP_COLORS: Record<string, string> = {
  F: "#0B2545", E: "#1B4D3E", D: "#7c3aed", S: "#3b82f6",
  I: "#B8862F", L: "#059669", K: "#dc2626",
};

const RISK_CFG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#dc2626", bg: "#fee2e2" },
  high:     { color: "#d97706", bg: "#fef3c7" },
  medium:   { color: "#3b82f6", bg: "#dbeafe" },
  low:      { color: "#16a34a", bg: "#dcfce7" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  not_started:  { label: "Not Started",  color: "#6b7280", bg: "#f3f4f6" },
  in_progress:  { label: "In Progress",  color: "#d97706", bg: "#fef3c7" },
  under_review: { label: "Under Review", color: "#3b82f6", bg: "#dbeafe" },
  approved:     { label: "Approved",     color: "#16a34a", bg: "#dcfce7" },
  executed:     { label: "Executed",     color: "#16a34a", bg: "#dcfce7" },
  blocked:      { label: "Blocked",      color: "#dc2626", bg: "#fee2e2" },
};

const PRIORITY_CFG: Record<string, string> = {
  immediate: "#dc2626", high: "#d97706", medium: "#3b82f6", low: "#6b7280",
};

const ENTITY_LABELS: Record<string, string> = {
  holding_co: "Holding Co", studio: "EcoRACE Studio", spv: "BEBUS SPV", charity: "Charity / Foundation", venture: "Venture",
};

export default function FedsilkContractTriggers() {
  const contractsQ = trpc.fedsilkGovernance.getContracts.useQuery({});
  const updateContract = trpc.fedsilkGovernance.updateContract.useMutation({
    onSuccess: () => { contractsQ.refetch(); toast.success("Contract updated"); },
    onError: () => toast.error("Update failed — please sign in"),
  });

  const [filterStep, setFilterStep] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: "", priority: "", riskLevel: "", notes: "" });

  const contracts = contractsQ.data ?? [];
  const filtered = filterStep === "all" ? contracts : contracts.filter(c => c.stepKey === filterStep);

  const missing  = contracts.filter(c => c.status === "not_started" && (c.priority === "immediate" || c.priority === "high")).length;
  const executed = contracts.filter(c => c.status === "executed" || c.status === "approved").length;
  const inProg   = contracts.filter(c => c.status === "in_progress" || c.status === "under_review").length;
  const critical = contracts.filter(c => c.riskLevel === "critical").length;

  function startEdit(c: typeof contracts[0]) {
    setEditingId(c.id);
    setEditForm({ status: c.status ?? "not_started", priority: c.priority ?? "medium", riskLevel: c.riskLevel ?? "medium", notes: c.notes ?? "" });
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Contract Triggers", value: contracts.length, color: "#0B2545" },
          { label: "Executed / Approved",     value: executed,         color: "#16a34a" },
          { label: "In Progress",             value: inProg,           color: "#d97706" },
          { label: "Missing (High Priority)", value: missing,          color: "#dc2626" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Context note */}
      <div className="rounded-xl border p-4 text-xs leading-relaxed" style={{ background: "#f0f4ff", borderColor: "#dbeafe", color: "#1e3a5f" }}>
        <strong>Contract Triggers</strong> — this register shows which legal contracts are required by each FEDSILK governance step.
        Each contract should be drafted, reviewed, executed, and archived in the{" "}
        <a href="/governance/legal" className="underline font-medium">Legal Repository</a> before the corresponding step is marked approved.
        Contracts marked <span style={{ color: "#dc2626", fontWeight: 600 }}>critical</span> must be in place before any external investment or SPV formation.
      </div>

      {/* Step filter */}
      <div className="flex flex-wrap gap-1">
        {["all", "F", "E", "D", "S", "I", "L", "K"].map(k => (
          <button key={k} onClick={() => setFilterStep(k)}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
            style={{
              background: filterStep === k ? "#0B2545" : "#f3f4f6",
              color: filterStep === k ? "white" : "#6b7280",
            }}>
            {k === "all" ? "All Steps" : `${k} — ${STEP_LABELS[k]}`}
          </button>
        ))}
      </div>

      {/* Contract cards by step */}
      {(filterStep === "all" ? ["F", "E", "D", "S", "I", "L", "K"] : [filterStep]).map(key => {
        const group = filtered.filter(c => c.stepKey === key);
        if (group.length === 0) return null;
        return (
          <div key={key} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "#f3f4f6", background: "#fafbfc" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: STEP_COLORS[key] }}>{key}</span>
              <span className="text-sm font-bold text-gray-800">{STEP_LABELS[key]}</span>
              <span className="text-xs text-gray-400 ml-1">— {group.length} contract{group.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y" style={{ divideColor: "#f1f5f9" }}>
              {group.map(c => {
                const rc = RISK_CFG[c.riskLevel ?? "medium"];
                const sc = STATUS_CFG[c.status ?? "not_started"] ?? STATUS_CFG["not_started"];
                const isEditing = editingId === c.id;
                return (
                  <div key={c.id}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <FileText size={13} style={{ color: STEP_COLORS[key], flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800">{c.contractName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {ENTITY_LABELS[c.entityLevel ?? ""] ?? c.entityLevel ?? ""}
                          {c.notes && <> · <span className="italic">{c.notes}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase"
                          style={{ color: PRIORITY_CFG[c.priority ?? "medium"] }}>
                          {c.priority}
                        </span>
                        <Badge className="text-[10px]" style={{ background: rc.bg, color: rc.color, border: "none" }}>
                          {(c.riskLevel ?? "").toUpperCase()}
                        </Badge>
                        <Badge className="text-[10px]" style={{ background: sc.bg, color: sc.color, border: "none" }}>
                          {sc.label}
                        </Badge>
                        {c.status === "not_started" && (c.priority === "immediate" || c.priority === "high") && (
                          <AlertTriangle size={12} style={{ color: "#dc2626" }} title="Missing high-priority contract" />
                        )}
                        <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2"
                          onClick={() => isEditing ? setEditingId(null) : startEdit(c)}>
                          {isEditing ? "Close" : "Edit"}
                        </Button>
                        <a href="/governance/legal" title="Open in Legal Repository">
                          <ExternalLink size={11} className="text-gray-300 hover:text-blue-500 transition-colors" />
                        </a>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="px-5 pb-3 pt-0" style={{ background: "#f8fafc" }}>
                        <div className="flex flex-wrap gap-3 items-end">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Status</label>
                            <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                              value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Priority</label>
                            <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                              value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                              {["immediate", "high", "medium", "low"].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Risk Level</label>
                            <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                              value={editForm.riskLevel} onChange={e => setEditForm(f => ({ ...f, riskLevel: e.target.value }))}>
                              {["critical", "high", "medium", "low"].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">Notes</label>
                            <input className="text-xs border rounded px-2 py-1.5 w-48" style={{ borderColor: "#dde3ec" }}
                              value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                          </div>
                          <Button size="sm" className="text-xs h-7" style={{ background: "#0B2545" }}
                            onClick={() => { updateContract.mutate({ id: c.id, ...editForm }); setEditingId(null); }}>
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
      })}
    </div>
  );
}
