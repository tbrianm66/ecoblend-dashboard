/**
 * Sprint 73 — VRL Dashboard V4
 * Enhanced VRL Dashboard with Spin-Out Readiness Panel
 * V4 Architecture Brief — Section 3.2
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, AlertTriangle, Plus, TrendingUp, Target, Zap } from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  discover: "#3B85BA", define: "#8B5CF6", build: "#F69111", launch: "#56A837", spinout: "#EC4899",
};
const GATE_STATUS_ICON: Record<string, React.ReactNode> = {
  complete:    <CheckCircle size={14} className="text-green-500" />,
  in_progress: <Clock size={14} className="text-amber-500" />,
  blocked:     <AlertTriangle size={14} className="text-red-500" />,
  not_started: <XCircle size={14} className="text-gray-300" />,
};
const RECOMMENDATION_COLORS: Record<string, string> = {
  GO:       "bg-green-100 text-green-800 border-green-200",
  NOT_YET:  "bg-amber-100 text-amber-800 border-amber-200",
  BLOCKED:  "bg-red-100 text-red-800 border-red-200",
};

export default function VrlDashboardV4() {
  const [ventureId, setVentureId] = useState("ECB-001");
  const [activeTab, setActiveTab] = useState<"dashboard"|"spinout"|"actions">("dashboard");
  const [editGate, setEditGate] = useState<{ stage: string; status: string; score: number; notes: string; leadName: string } | null>(null);
  const [newAction, setNewAction] = useState({ action: "", owner: "", linkedModule: "" });
  const [showActionForm, setShowActionForm] = useState(false);

  const summary   = trpc.vrlDashboardV4.getDashboardSummary.useQuery({ ventureId }, { enabled: !!ventureId });
  const gates     = trpc.vrlDashboardV4.getStageGates.useQuery({ ventureId }, { enabled: !!ventureId });
  const checklist = trpc.vrlDashboardV4.getSpinoutChecklist.useQuery({ ventureId }, { enabled: !!ventureId });
  const actions   = trpc.vrlDashboardV4.getActionsLog.useQuery({ ventureId, limit: 20 }, { enabled: !!ventureId });
  const gateDefs  = trpc.vrlDashboardV4.getSpinoutGateDefinitions.useQuery();

  const upsertGate = trpc.vrlDashboardV4.upsertStageGate.useMutation({
    onSuccess: () => { toast.success("Stage gate updated"); gates.refetch(); summary.refetch(); setEditGate(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateSpinout = trpc.vrlDashboardV4.updateSpinoutGate.useMutation({
    onSuccess: () => { toast.success("Gate updated"); checklist.refetch(); summary.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const addAction = trpc.vrlDashboardV4.addAction.useMutation({
    onSuccess: () => { toast.success("Action added"); actions.refetch(); setShowActionForm(false); setNewAction({ action: "", owner: "", linkedModule: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateAction = trpc.vrlDashboardV4.updateActionStatus.useMutation({
    onSuccess: () => { toast.success("Action updated"); actions.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const s = summary.data;
  const spinoutStatus = s?.spinoutStatus ?? "BLOCKED";

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3B85BA15", color: "#3B85BA" }}>Sprint 73</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">VRL Dashboard V4 — Spin-Out Readiness</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>VRL Dashboard V4</h1>
            <p className="text-sm text-gray-500 max-w-xl">Enhanced VRL stage gate tracking with Spin-Out Readiness Panel. 5-stage pipeline with evidence-based gate scoring and action log.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-32 text-xs h-8" placeholder="Venture ID" />
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">VRL Score</div>
            <div className="text-3xl font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>{s?.overallVrlScore ?? 0}%</div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Spin-Out Score</div>
            <div className="text-3xl font-bold" style={{ color: "#EC4899", fontFamily: "'Prompt', sans-serif" }}>{s?.spinoutScore ?? 0}%</div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Spin-Out Status</div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${RECOMMENDATION_COLORS[spinoutStatus] ?? "bg-gray-100 text-gray-600"}`}>{spinoutStatus}</span>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending Actions</div>
            <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              {(actions.data ?? []).filter(a => a.status === "pending" || a.status === "in_progress").length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(["dashboard","spinout","actions"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50 border"}`}
              style={activeTab !== tab ? { borderColor: "#e5e7eb" } : {}}>
              {tab === "spinout" ? "Spin-Out Readiness" : tab === "actions" ? "Actions Log" : "Stage Gates"}
            </button>
          ))}
        </div>

        {/* Stage Gates Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-3">
            {(gates.data ?? []).map(gate => (
              <div key={gate.stage} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${STAGE_COLORS[gate.stage] ?? "#6B7280"}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {GATE_STATUS_ICON[gate.status]}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 capitalize">{gate.stage}</span>
                        <Badge variant="outline" className="text-xs capitalize" style={{ borderColor: STAGE_COLORS[gate.stage], color: STAGE_COLORS[gate.stage] }}>{gate.status.replace(/_/g, " ")}</Badge>
                        {gate.leadName && <span className="text-xs text-gray-400">Lead: {gate.leadName}</span>}
                      </div>
                      {gate.evidenceDocName && <p className="text-xs text-gray-400 mt-0.5">Evidence: {gate.evidenceDocName}</p>}
                      {gate.notes && <p className="text-xs text-gray-500 mt-1">{gate.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: STAGE_COLORS[gate.stage] }}>{parseFloat(gate.score as string || "0").toFixed(0)}%</div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditGate({ stage: gate.stage, status: gate.status, score: parseFloat(gate.score as string || "0"), notes: gate.notes ?? "", leadName: gate.leadName ?? "" })}>Edit</Button>
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${parseFloat(gate.score as string || "0")}%`, background: STAGE_COLORS[gate.stage] }} />
                </div>
              </div>
            ))}
            {/* Edit form */}
            {editGate && (
              <Card className="border-2" style={{ borderColor: "#3B85BA" }}>
                <CardHeader><CardTitle className="text-sm capitalize">Edit {editGate.stage} Gate</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs mb-1 block">Status</Label>
                      <Select value={editGate.status} onValueChange={v => setEditGate(g => g ? { ...g, status: v } : null)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["not_started","in_progress","complete","blocked"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Score (0-100)</Label>
                      <Input type="number" min={0} max={100} value={editGate.score} onChange={e => setEditGate(g => g ? { ...g, score: Number(e.target.value) } : null)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Lead Name</Label>
                      <Input value={editGate.leadName} onChange={e => setEditGate(g => g ? { ...g, leadName: e.target.value } : null)} className="h-8 text-xs" placeholder="e.g. Sarah Chen" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Notes</Label>
                      <Input value={editGate.notes} onChange={e => setEditGate(g => g ? { ...g, notes: e.target.value } : null)} className="h-8 text-xs" placeholder="Optional notes" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => upsertGate.mutate({ ventureId, stage: editGate.stage as any, status: editGate.status as any, score: editGate.score, notes: editGate.notes, leadName: editGate.leadName })} disabled={upsertGate.isPending}>
                      {upsertGate.isPending ? "Saving…" : "Save Gate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditGate(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Spin-Out Readiness Tab */}
        {activeTab === "spinout" && (
          <div>
            <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Spin-Out Readiness Checklist</h3>
                  <p className="text-xs text-gray-400 mt-0.5">6 gates must be met before spin-off sequence can be triggered</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: "#EC4899" }}>{checklist.data?.readinessScore ?? 0}%</div>
                    <div className="text-xs text-gray-400">{checklist.data?.metCount ?? 0}/{checklist.data?.totalGates ?? 6} gates met</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${RECOMMENDATION_COLORS[checklist.data?.overallStatus ?? "BLOCKED"] ?? ""}`}>
                    {checklist.data?.overallStatus ?? "BLOCKED"}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${checklist.data?.readinessScore ?? 0}%`, background: "#EC4899" }} />
              </div>
            </div>
            <div className="space-y-3">
              {(checklist.data?.items ?? []).map((item: any) => (
                <div key={item.gateKey} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${item.met ? "#56A837" : "#e5e7eb"}` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {item.met ? <CheckCircle size={16} className="text-green-500 mt-0.5" /> : <XCircle size={16} className="text-gray-300 mt-0.5" />}
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{item.gateLabel}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Min: {item.minThreshold}</div>
                        <div className="text-xs text-gray-400">Evidence: {item.evidenceRequired}</div>
                        {item.approver && <div className="text-xs text-gray-400">Approver: {item.approver}</div>}
                        {item.metAt && <div className="text-xs text-green-500 mt-1">Met: {new Date(item.metAt).toLocaleDateString()}</div>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs"
                      onClick={() => updateSpinout.mutate({ ventureId, gateKey: item.gateKey, met: !item.met })}>
                      {item.met ? "Mark Unmet" : "Mark Met"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Log Tab */}
        {activeTab === "actions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Actions Log</h3>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowActionForm(!showActionForm)}>
                <Plus size={13} /> Add Action
              </Button>
            </div>
            {showActionForm && (
              <Card className="mb-4 border-2" style={{ borderColor: "#56A837" }}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="col-span-2"><Label className="text-xs mb-1 block">Action</Label><Input value={newAction.action} onChange={e => setNewAction(a => ({ ...a, action: e.target.value }))} className="h-8 text-xs" placeholder="e.g. Complete ICP validation interviews" /></div>
                    <div><Label className="text-xs mb-1 block">Owner</Label><Input value={newAction.owner} onChange={e => setNewAction(a => ({ ...a, owner: e.target.value }))} className="h-8 text-xs" placeholder="e.g. Sarah Chen" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addAction.mutate({ ventureId, ...newAction })} disabled={!newAction.action || addAction.isPending}>
                      {addAction.isPending ? "Adding…" : "Add Action"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowActionForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-2">
              {(actions.data ?? []).map(action => (
                <div key={action.id} className="bg-white rounded-xl border p-4 flex items-start justify-between" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start gap-3">
                    {GATE_STATUS_ICON[action.status]}
                    <div>
                      <div className="text-sm text-gray-900">{action.action}</div>
                      <div className="flex items-center gap-3 mt-1">
                        {action.owner && <span className="text-xs text-gray-400">Owner: {action.owner}</span>}
                        {action.linkedModule && <span className="text-xs text-gray-400">Module: {action.linkedModule}</span>}
                        <span className="text-xs text-gray-300">{new Date(action.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Select value={action.status} onValueChange={v => updateAction.mutate({ id: action.id, status: v as any })}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending","in_progress","complete","cancelled"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {(actions.data ?? []).length === 0 && <div className="text-center py-10 text-sm text-gray-400">No actions logged yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
