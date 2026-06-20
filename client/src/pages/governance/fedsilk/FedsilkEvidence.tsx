import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, FileText, Filter } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  F: "Founder Intent", E: "Equity & ESOP", D: "Decision Rights",
  S: "Stewardship", I: "IP Controls", L: "Legal Contracts", K: "Knowledge & Audit",
};

const STEP_COLORS: Record<string, string> = {
  F: "#0B2545", E: "#1B4D3E", D: "#7c3aed", S: "#3b82f6",
  I: "#B8862F", L: "#059669", K: "#dc2626",
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#d97706", bg: "#fef3c7" },
  approved:    { label: "Approved",    color: "#16a34a", bg: "#dcfce7" },
  complete:    { label: "Complete",    color: "#16a34a", bg: "#dcfce7" },
  blocked:     { label: "Blocked",     color: "#dc2626", bg: "#fee2e2" },
};

const TYPE_LABELS: Record<string, string> = {
  board_minute: "Board Minute", contract: "Contract", policy: "Policy",
  register: "Register", decision_log: "Decision Log", approval: "Approval",
  risk_assessment: "Risk Assessment", attribution_note: "Attribution Note",
};

const ENTITY_LABELS: Record<string, string> = {
  holding_co: "Holding Co", studio: "Studio", spv: "SPV", charity: "Charity", venture: "Venture",
};

export default function FedsilkEvidence() {
  const evidenceQ = trpc.fedsilkGovernance.getEvidence.useQuery({});
  const updateEvidence = trpc.fedsilkGovernance.updateEvidence.useMutation({
    onSuccess: () => { evidenceQ.refetch(); toast.success("Evidence updated"); },
    onError: () => toast.error("Update failed — please sign in"),
  });

  const [filterStep, setFilterStep] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: "", owner: "", notes: "" });

  const allEvidence = evidenceQ.data ?? [];
  const filtered = allEvidence.filter(e =>
    (filterStep === "all" || e.stepKey === filterStep) &&
    (filterStatus === "all" || e.status === filterStatus)
  );

  const required  = allEvidence.filter(e => e.required).length;
  const complete  = allEvidence.filter(e => e.status === "approved" || e.status === "complete").length;
  const inProg    = allEvidence.filter(e => e.status === "in_progress").length;
  const notStart  = allEvidence.filter(e => e.status === "not_started").length;

  function startEdit(ev: typeof allEvidence[0]) {
    setEditingId(ev.id);
    setEditForm({ status: ev.status ?? "not_started", owner: ev.owner ?? "", notes: ev.notes ?? "" });
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Required Items", value: required, color: "#0B2545" },
          { label: "Complete / Approved", value: complete, color: "#16a34a" },
          { label: "In Progress", value: inProg, color: "#d97706" },
          { label: "Not Started", value: notStart, color: "#6b7280" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-[10px] text-gray-400 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Prompt',sans-serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border p-3" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-gray-400" />
          <span className="text-xs text-gray-500">Filter:</span>
        </div>
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
        <div className="flex flex-wrap gap-1 ml-auto">
          {["all", "not_started", "in_progress", "approved"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
              style={{
                background: filterStatus === s ? "#163662" : "#f3f4f6",
                color: filterStatus === s ? "white" : "#6b7280",
              }}>
              {s === "all" ? "All Statuses" : STATUS_BADGE[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2" style={{ borderColor: "#f3f4f6" }}>
          <FileText size={14} style={{ color: "#0B2545" }} />
          <span className="text-sm font-bold text-gray-800">Evidence Register</span>
          <span className="text-xs text-gray-400 ml-2">{filtered.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {["Step", "Evidence Item", "Entity", "Type", "Required", "Status", "Owner", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => {
                const statCfg = STATUS_BADGE[ev.status ?? "not_started"] ?? STATUS_BADGE["not_started"];
                const isEditing = editingId === ev.id;
                return (
                  <>
                    <tr key={ev.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white"
                          style={{ background: STEP_COLORS[ev.stepKey ?? "F"] }}>
                          {ev.stepKey}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[260px]">
                        <div>{ev.title}</div>
                        {ev.notes && <div className="text-[10px] text-gray-400 mt-0.5 italic">{ev.notes}</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className="text-[10px]" style={{ background: "#f0f4ff", color: "#3b82f6", border: "none" }}>
                          {ENTITY_LABELS[ev.entityLevel ?? ""] ?? ev.entityLevel ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{TYPE_LABELS[ev.evidenceType ?? ""] ?? ev.evidenceType ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        {ev.required
                          ? <span className="text-red-600 font-semibold text-[10px]">Required</span>
                          : <span className="text-gray-400 text-[10px]">Optional</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className="text-[10px]" style={{ background: statCfg.bg, color: statCfg.color, border: "none" }}>
                          {statCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{ev.owner ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2"
                          onClick={() => isEditing ? setEditingId(null) : startEdit(ev)}>
                          {isEditing ? "Close" : "Edit"}
                        </Button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Status</label>
                              <select className="text-xs border rounded px-2 py-1.5 bg-white" style={{ borderColor: "#dde3ec" }}
                                value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                                {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Owner</label>
                              <input className="text-xs border rounded px-2 py-1.5 w-40" style={{ borderColor: "#dde3ec" }}
                                value={editForm.owner} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))} />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Notes</label>
                              <input className="text-xs border rounded px-2 py-1.5 w-52" style={{ borderColor: "#dde3ec" }}
                                value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <Button size="sm" className="text-xs h-7" style={{ background: "#0B2545" }}
                              onClick={() => { updateEvidence.mutate({ id: ev.id, ...editForm }); setEditingId(null); }}>
                              Save
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-gray-400">No evidence items match the current filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}
