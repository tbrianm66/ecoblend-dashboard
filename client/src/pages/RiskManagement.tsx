// ============================================================
// VENTURE RISK MANAGEMENT MODULE
// 6-Category Risk Register | L×I Scoring | VRL Linkage
// Risk Heatmap | Category Chart | Adjusted VRI | FMEA Tab
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, ShieldAlert, ShieldCheck, TrendingDown,
  Plus, Trash2, Edit2, BarChart2, Activity, Lock,
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────
const RISK_CATEGORIES = ["Technical","Market","Commercial","Financial","Operational","Strategic"] as const;
const RISK_STATUSES = ["Open","In Progress","Mitigated","Accepted","Closed"] as const;
const VRL_STAGES = [
  { id: 1, label: "Opportunity Identified" },
  { id: 2, label: "Problem Validated" },
  { id: 3, label: "Solution Validated" },
  { id: 4, label: "Business Model Validated" },
  { id: 5, label: "Market Validated" },
  { id: 6, label: "Scale Ready" },
];
const CATEGORY_COLORS: Record<string, string> = {
  Technical: "#3A97D3", Market: "#F49C13", Commercial: "#51AF37",
  Financial: "#e53e3e", Operational: "#805ad5", Strategic: "#2d3748",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRiskLevel(score: number): "Low"|"Medium"|"High"|"Critical" {
  if (score <= 5) return "Low";
  if (score <= 10) return "Medium";
  if (score <= 15) return "High";
  return "Critical";
}
function getRiskColor(level: string): string {
  switch (level) {
    case "Critical": return "#e53e3e";
    case "High": return "#F49C13";
    case "Medium": return "#3A97D3";
    default: return "#51AF37";
  }
}
function getRiskBg(level: string): string {
  switch (level) {
    case "Critical": return "bg-red-50 border-red-200";
    case "High": return "bg-orange-50 border-orange-200";
    case "Medium": return "bg-blue-50 border-blue-200";
    default: return "bg-green-50 border-green-200";
  }
}

// ── Risk Heatmap ──────────────────────────────────────────────────────────────
function RiskHeatmap({ risks }: { risks: any[] }) {
  const cells: Record<string, { count: number; level: string }> = {};
  for (let l = 1; l <= 5; l++) for (let i = 1; i <= 5; i++)
    cells[`${l}-${i}`] = { count: 0, level: getRiskLevel(l * i) };
  for (const r of risks) {
    const key = `${r.likelihood}-${r.impact}`;
    if (cells[key]) cells[key].count++;
  }
  const bgForLevel = (level: string) => {
    switch (level) {
      case "Critical": return "bg-red-500";
      case "High": return "bg-orange-400";
      case "Medium": return "bg-blue-300";
      default: return "bg-green-300";
    }
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} style={{ color: "#3A97D3" }} />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Risk Heatmap — Likelihood × Impact</span>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center justify-center" style={{ width: 20 }}>
          <span className="text-xs text-gray-400" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10 }}>Impact →</span>
        </div>
        <div className="flex-1">
          {[5,4,3,2,1].map(impact => (
            <div key={impact} className="flex gap-1 mb-1">
              <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{impact}</span>
              {[1,2,3,4,5].map(likelihood => {
                const cell = cells[`${likelihood}-${impact}`];
                return (
                  <div key={likelihood}
                    className={`flex-1 rounded flex items-center justify-center text-white text-xs font-bold ${bgForLevel(cell.level)}`}
                    style={{ minWidth: 28, minHeight: 28, opacity: cell.count > 0 ? 1 : 0.3 }}
                    title={`L${likelihood}×I${impact}=${likelihood*impact} (${cell.level}) — ${cell.count} risk(s)`}
                  >
                    {cell.count > 0 ? cell.count : ""}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex gap-1 mt-1">
            <span className="w-4" />
            {[1,2,3,4,5].map(l => <span key={l} className="flex-1 text-center text-xs text-gray-400">{l}</span>)}
          </div>
          <div className="text-center text-xs text-gray-400 mt-1">Likelihood →</div>
        </div>
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {["Low","Medium","High","Critical"].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${bgForLevel(level)}`} />
            <span className="text-xs text-gray-500">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Category Bar Chart ────────────────────────────────────────────────────────
function CategoryChart({ risks }: { risks: any[] }) {
  const counts = RISK_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = risks.filter(r => r.riskCategory === cat).length;
    return acc;
  }, {} as Record<string, number>);
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={14} style={{ color: "#51AF37" }} />
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Risks by Category</span>
      </div>
      <div className="flex flex-col gap-2">
        {RISK_CATEGORIES.map(cat => (
          <div key={cat} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24 flex-shrink-0">{cat}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                style={{ width: `${(counts[cat] / max) * 100}%`, background: CATEGORY_COLORS[cat], minWidth: counts[cat] > 0 ? 28 : 0 }}>
                {counts[cat] > 0 && <span className="text-white text-xs font-bold">{counts[cat]}</span>}
              </div>
            </div>
            {counts[cat] === 0 && <span className="text-xs text-gray-400">0</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk Dialog ───────────────────────────────────────────────────────────────
interface RiskFormData {
  riskCategory: string; riskTitle: string; riskDescription: string;
  likelihood: number; impact: number; vrlStageImpacted: string;
  mitigationPlan: string; riskOwner: string; status: string; reviewDate: string;
}
const EMPTY_FORM: RiskFormData = {
  riskCategory: "Technical", riskTitle: "", riskDescription: "",
  likelihood: 3, impact: 3, vrlStageImpacted: "",
  mitigationPlan: "", riskOwner: "", status: "Open", reviewDate: "",
};

function RiskDialog({ open, onClose, onSave, initial, saving }: {
  open: boolean; onClose: () => void; onSave: (d: RiskFormData) => void;
  initial?: Partial<RiskFormData>; saving?: boolean;
}) {
  const [form, setForm] = useState<RiskFormData>({ ...EMPTY_FORM, ...initial });
  const previewScore = form.likelihood * form.impact;
  const previewLevel = getRiskLevel(previewScore);
  const set = (k: keyof RiskFormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.riskTitle ? "Edit Risk" : "Add Venture Risk"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category *</Label>
              <Select value={form.riskCategory} onValueChange={v => set("riskCategory", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Risk Title *</Label>
            <Input className="h-8 text-xs mt-1" placeholder="e.g. Key supplier dependency for battery cells"
              value={form.riskTitle} onChange={e => set("riskTitle", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-xs mt-1 resize-none" rows={2}
              placeholder="Describe the risk scenario and potential impact..."
              value={form.riskDescription} onChange={e => set("riskDescription", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Likelihood (1–5): <strong>{form.likelihood}</strong></Label>
              <input type="range" min={1} max={5} step={1} value={form.likelihood}
                onChange={e => set("likelihood", Number(e.target.value))}
                className="w-full mt-1 accent-blue-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Rare</span><span>Almost Certain</span></div>
            </div>
            <div>
              <Label className="text-xs">Impact (1–5): <strong>{form.impact}</strong></Label>
              <input type="range" min={1} max={5} step={1} value={form.impact}
                onChange={e => set("impact", Number(e.target.value))}
                className="w-full mt-1 accent-orange-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Negligible</span><span>Catastrophic</span></div>
            </div>
          </div>
          <div className={`rounded-lg p-3 border text-center ${getRiskBg(previewLevel)}`}>
            <span className="text-xs text-gray-500">Risk Score: </span>
            <span className="font-bold text-lg" style={{ color: getRiskColor(previewLevel) }}>{previewScore}</span>
            <span className="text-xs text-gray-500"> — </span>
            <span className="font-semibold text-sm" style={{ color: getRiskColor(previewLevel) }}>{previewLevel}</span>
            <div className="text-xs text-gray-400 mt-1">
              {previewLevel === "Critical" && "⚠ This risk will block VRL advancement until mitigated"}
              {previewLevel === "High" && "This risk will apply a −10% penalty to the Adjusted VRI"}
              {previewLevel === "Medium" && "This risk will apply a −5% penalty to the Adjusted VRI"}
              {previewLevel === "Low" && "No VRI penalty applied"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">VRL Stage Impacted</Label>
              <Select value={form.vrlStageImpacted || "none"} onValueChange={v => set("vrlStageImpacted", v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {VRL_STAGES.map(s => <SelectItem key={s.id} value={String(s.id)}>VRL {s.id} — {s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Risk Owner</Label>
              <Input className="h-8 text-xs mt-1" placeholder="Name or team"
                value={form.riskOwner} onChange={e => set("riskOwner", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Mitigation Plan</Label>
            <Textarea className="text-xs mt-1 resize-none" rows={2}
              placeholder="Describe planned or active mitigation actions..."
              value={form.mitigationPlan} onChange={e => set("mitigationPlan", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Review Date</Label>
            <Input type="date" className="h-8 text-xs mt-1"
              value={form.reviewDate} onChange={e => set("reviewDate", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!form.riskTitle.trim() || saving} onClick={() => onSave(form)}
            style={{ background: "#1a2332", color: "white" }}>
            {saving ? "Saving…" : "Save Risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Risk Table Row ────────────────────────────────────────────────────────────
function RiskRow({ risk, onEdit, onDelete }: { risk: any; onEdit: () => void; onDelete: () => void }) {
  const level = risk.riskLevel as string;
  const color = getRiskColor(level);
  const vrlStage = risk.vrlStageImpacted ? VRL_STAGES.find(s => s.id === risk.vrlStageImpacted) : null;
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
      <td className="px-3 py-2.5">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${CATEGORY_COLORS[risk.riskCategory] ?? "#6b7280"}18`, color: CATEGORY_COLORS[risk.riskCategory] ?? "#6b7280" }}>
          {risk.riskCategory}
        </span>
      </td>
      <td className="px-3 py-2.5 max-w-xs">
        <div className="text-sm font-medium text-gray-900 truncate">{risk.riskTitle}</div>
        {risk.riskDescription && <div className="text-xs text-gray-400 truncate">{risk.riskDescription}</div>}
      </td>
      <td className="px-3 py-2.5 text-center"><span className="text-sm font-mono font-bold text-gray-700">{risk.likelihood}</span></td>
      <td className="px-3 py-2.5 text-center"><span className="text-sm font-mono font-bold text-gray-700">{risk.impact}</span></td>
      <td className="px-3 py-2.5 text-center">
        <span className="text-sm font-bold font-mono px-2 py-0.5 rounded" style={{ background: `${color}18`, color }}>{risk.riskScore}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>{level}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        {vrlStage ? (
          <span className="text-xs text-gray-500 flex items-center gap-1 justify-center">
            <Lock size={10} />VRL {vrlStage.id}
          </span>
        ) : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          ["Mitigated","Closed","Accepted"].includes(risk.status) ? "bg-green-50 text-green-700" :
          risk.status === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
        }`}>{risk.status}</span>
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-500">{risk.riskOwner || "—"}</td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200">
            <Edit2 size={11} className="text-gray-500" />
          </button>
          <button onClick={onDelete} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100">
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RiskManagement() {
  const { ventures } = useVentures();
  const [selectedVentureId, setSelectedVentureId] = useState(ventures[0]?.id ?? "ecoblend");
  const [activeTab, setActiveTab] = useState<"register"|"heatmap"|"fmea">("register");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any|null>(null);

  const utils = trpc.useUtils();
  const selectedVenture = ventures.find(v => v.id === selectedVentureId);

  const { data: risks = [], isLoading } = trpc.ventureRisk.list.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );
  const { data: blockerData } = trpc.ventureRisk.vrlBlockers.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );
  const { data: portfolioSummary } = trpc.ventureRisk.portfolioSummary.useQuery();
  const { data: adjustedVri } = trpc.ventureRisk.adjustedVri.useQuery(
    { ventureId: selectedVentureId, baseVrl: selectedVenture?.vrl ?? 1, baseVrlPercent: selectedVenture?.vrlPercent ?? 0 },
    { enabled: !!selectedVenture }
  );
  const { data: fmeaRisks = [] } = trpc.fmea.listRisks.useQuery(
    { ventureId: selectedVentureId }, { enabled: !!selectedVentureId }
  );

  const addRisk = trpc.ventureRisk.add.useMutation({
    onSuccess: () => {
      utils.ventureRisk.list.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.vrlBlockers.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.adjustedVri.invalidate();
      utils.ventureRisk.portfolioSummary.invalidate();
      setShowAddDialog(false);
      toast.success("Risk added to register");
    },
    onError: () => toast.error("Failed to add risk"),
  });
  const updateRisk = trpc.ventureRisk.update.useMutation({
    onSuccess: () => {
      utils.ventureRisk.list.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.vrlBlockers.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.adjustedVri.invalidate();
      utils.ventureRisk.portfolioSummary.invalidate();
      setEditingRisk(null);
      toast.success("Risk updated");
    },
    onError: () => toast.error("Failed to update risk"),
  });
  const deleteRisk = trpc.ventureRisk.delete.useMutation({
    onSuccess: () => {
      utils.ventureRisk.list.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.vrlBlockers.invalidate({ ventureId: selectedVentureId });
      utils.ventureRisk.adjustedVri.invalidate();
      utils.ventureRisk.portfolioSummary.invalidate();
      toast.success("Risk deleted");
    },
    onError: () => toast.error("Failed to delete risk"),
  });

  const filteredRisks = useMemo(() => risks.filter(r => {
    if (filterCategory !== "all" && r.riskCategory !== filterCategory) return false;
    if (filterLevel !== "all" && r.riskLevel !== filterLevel) return false;
    return true;
  }), [risks, filterCategory, filterLevel]);

  const criticalCount = risks.filter(r => r.riskLevel === "Critical" && ["Open","In Progress"].includes(r.status ?? "")).length;
  const highCount = risks.filter(r => r.riskLevel === "High" && ["Open","In Progress"].includes(r.status ?? "")).length;
  const mitigatedCount = risks.filter(r => ["Mitigated","Closed","Accepted"].includes(r.status ?? "")).length;
  const openCount = risks.filter(r => ["Open","In Progress"].includes(r.status ?? "")).length;

  const handleSaveNew = (form: RiskFormData) => {
    addRisk.mutate({
      ventureId: selectedVentureId,
      riskCategory: form.riskCategory as any,
      riskTitle: form.riskTitle,
      riskDescription: form.riskDescription || undefined,
      likelihood: form.likelihood,
      impact: form.impact,
      vrlStageImpacted: form.vrlStageImpacted ? Number(form.vrlStageImpacted) : undefined,
      mitigationPlan: form.mitigationPlan || undefined,
      riskOwner: form.riskOwner || undefined,
      status: form.status as any,
      reviewDate: form.reviewDate || undefined,
    });
  };
  const handleSaveEdit = (form: RiskFormData) => {
    if (!editingRisk) return;
    updateRisk.mutate({
      id: editingRisk.id,
      riskCategory: form.riskCategory as any,
      riskTitle: form.riskTitle,
      riskDescription: form.riskDescription || undefined,
      likelihood: form.likelihood,
      impact: form.impact,
      vrlStageImpacted: form.vrlStageImpacted ? Number(form.vrlStageImpacted) : null,
      mitigationPlan: form.mitigationPlan || undefined,
      riskOwner: form.riskOwner || undefined,
      status: form.status as any,
      reviewDate: form.reviewDate || null,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#e53e3e15", color: "#e53e3e" }}>
                Risk Management
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">6-Category Register · L×I Scoring · VRL Linkage · Adjusted VRI</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Venture Risk Register
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Track, score, and mitigate risks across Technical, Market, Commercial, Financial, Operational, and Strategic dimensions. Risk scores automatically adjust the Venture Readiness Index (VRI).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
              <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{ventures.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" className="gap-1.5 text-xs" style={{ background: "#1a2332", color: "white" }}
              onClick={() => setShowAddDialog(true)}>
              <Plus size={13} /> Add Risk
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Risks</div>
            <div className="text-3xl font-bold" style={{ color: "#1a2332", fontFamily: "'Prompt', sans-serif" }}>{risks.length}</div>
            <div className="text-xs text-gray-400">{openCount} open</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">Critical</div>
            <div className="text-3xl font-bold text-red-600" style={{ fontFamily: "'Prompt', sans-serif" }}>{criticalCount}</div>
            <div className="text-xs text-red-400">score &gt; 15</div>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1">High</div>
            <div className="text-3xl font-bold text-orange-500" style={{ fontFamily: "'Prompt', sans-serif" }}>{highCount}</div>
            <div className="text-xs text-orange-400">score 11–15</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-1">Mitigated</div>
            <div className="text-3xl font-bold text-green-600" style={{ fontFamily: "'Prompt', sans-serif" }}>{mitigatedCount}</div>
            <div className="text-xs text-green-500">closed / accepted</div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Adj. VRI %</div>
            {adjustedVri ? (
              <>
                <div className="text-3xl font-bold" style={{ color: adjustedVri.totalPenalty < 0 ? "#e53e3e" : "#51AF37", fontFamily: "'Prompt', sans-serif" }}>
                  {adjustedVri.adjustedPercent}%
                </div>
                <div className="text-xs text-gray-400">
                  Base {selectedVenture?.vrlPercent ?? 0}% {adjustedVri.totalPenalty < 0 ? `(${adjustedVri.totalPenalty}% penalty)` : "(no penalty)"}
                </div>
              </>
            ) : <div className="text-3xl font-bold text-gray-300">—</div>}
          </div>
        </div>

        {/* VRL Blocker Alert */}
        {blockerData?.hasBlockers && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                {blockerData.blockerCount} VRL Stage Blocker{blockerData.blockerCount > 1 ? "s" : ""} Detected
              </span>
            </div>
            <p className="text-xs text-red-600 mb-2">
              The following Critical risks must be mitigated before {selectedVenture?.name} can advance to the next VRL stage.
            </p>
            <div className="flex flex-wrap gap-2">
              {blockerData.blockers.map((b: any) => (
                <div key={b.id} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-red-200 shadow-sm">
                  <Lock size={11} className="text-red-400" />
                  <span className="text-xs font-medium text-red-700">{b.riskTitle}</span>
                  {b.vrlStageImpacted && <span className="text-xs text-red-400">→ VRL {b.vrlStageImpacted}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: `${getRiskColor(b.riskLevel)}18`, color: getRiskColor(b.riskLevel) }}>
                    {b.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          {[
            { id: "register", label: "Risk Register" },
            { id: "heatmap", label: "Heatmap & Charts" },
            { id: "fmea", label: "FMEA Engineering" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Register Tab ── */}
        {activeTab === "register" && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-xs text-gray-500 font-medium">Filter:</span>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {RISK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="All Levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {["Critical","High","Medium","Low"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-400 ml-auto">{filteredRisks.length} risk{filteredRisks.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                    {["Category","Risk","L","I","Score","Level","VRL Stage","Status","Owner",""].map(h => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">Loading risks...</td></tr>
                  ) : filteredRisks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-12 text-center">
                        <ShieldCheck size={32} className="mx-auto mb-2 text-green-300" />
                        <div className="text-sm text-gray-500 font-medium">No risks found</div>
                        <div className="text-xs text-gray-400 mt-1">Click "Add Risk" to begin tracking venture risks for {selectedVenture?.name}.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredRisks.map(risk => (
                      <RiskRow key={risk.id} risk={risk}
                        onEdit={() => setEditingRisk(risk)}
                        onDelete={() => { if (confirm("Delete this risk?")) deleteRisk.mutate({ id: risk.id }); }} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Heatmap Tab ── */}
        {activeTab === "heatmap" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <RiskHeatmap risks={risks} />
              </div>
              <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CategoryChart risks={risks} />
                {portfolioSummary && (
                  <div className="mt-6 pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown size={14} style={{ color: "#e53e3e" }} />
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Portfolio Risk Distribution</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {["Critical","High","Medium","Low"].map(level => (
                        <div key={level} className="text-center">
                          <div className="text-xl font-bold" style={{ color: getRiskColor(level), fontFamily: "'Prompt', sans-serif" }}>
                            {(portfolioSummary.byLevel as any)[level] ?? 0}
                          </div>
                          <div className="text-xs text-gray-400">{level}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {adjustedVri && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} style={{ color: "#F49C13" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Adjusted Venture Readiness Index (VRI)</span>
                </div>
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Base VRL Stage</div>
                    <div className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>{selectedVenture?.vrl ?? 1}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Base Stage %</div>
                    <div className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Prompt', sans-serif" }}>{selectedVenture?.vrlPercent ?? 0}%</div>
                  </div>
                  <div className="text-2xl text-gray-300">−</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Risk Penalty</div>
                    <div className="text-3xl font-bold text-red-500" style={{ fontFamily: "'Prompt', sans-serif" }}>{Math.abs(adjustedVri.totalPenalty)}%</div>
                    <div className="text-xs text-gray-400">{adjustedVri.riskCount} open risks</div>
                  </div>
                  <div className="text-2xl text-gray-300">=</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Adjusted VRI %</div>
                    <div className="text-3xl font-bold" style={{ color: adjustedVri.totalPenalty < 0 ? "#e53e3e" : "#51AF37", fontFamily: "'Prompt', sans-serif" }}>
                      {adjustedVri.adjustedPercent}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-xs text-gray-400" style={{ borderColor: "#e5e7eb" }}>
                  <strong>Penalty per open risk:</strong> Low = 0% · Medium = −5% · High = −10% · Critical = −20%
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FMEA Tab ── */}
        {activeTab === "fmea" && (
          <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <div className="p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: "#F49C13" }} />
                <span className="text-sm font-semibold text-gray-700">FMEA Engineering Risk Register</span>
                <span className="text-xs text-gray-400 ml-auto">{fmeaRisks.length} engineering failure modes</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Failure Mode & Effects Analysis — RPN = Severity × Occurrence × Detectability. Add engineering failure modes from the FMEA section.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                    {["Component","Failure Mode","Effect","S","O","D","RPN","Level","Status"].map(h => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fmeaRisks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-12 text-center">
                        <div className="text-sm text-gray-400">No FMEA engineering risks logged for {selectedVenture?.name}.</div>
                        <div className="text-xs text-gray-400 mt-1">Add engineering failure modes using the "Add Risk" button in the FMEA Engineering section.</div>
                      </td>
                    </tr>
                  ) : (
                    fmeaRisks.map((r: any) => {
                      const rpn = r.initialRpn;
                      const fmeaLevel = rpn > 100 ? "Critical" : rpn > 50 ? "High" : "Low";
                      return (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{r.componentName}</td>
                          <td className="px-3 py-2.5 text-sm font-medium text-gray-900 max-w-xs"><div className="truncate">{r.failureMode}</div></td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 max-w-xs"><div className="truncate">{r.failureEffect}</div></td>
                          <td className="px-3 py-2.5 text-center text-sm font-mono font-bold text-gray-700">{r.severity}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-mono font-bold text-gray-700">{r.occurrence}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-mono font-bold text-gray-700">{r.detection}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-sm font-bold font-mono px-2 py-0.5 rounded"
                              style={{ background: `${getRiskColor(fmeaLevel)}18`, color: getRiskColor(fmeaLevel) }}>{rpn}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${getRiskColor(fmeaLevel)}18`, color: getRiskColor(fmeaLevel) }}>{fmeaLevel}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              ["Verified","Implemented"].includes(r.status) ? "bg-green-50 text-green-700" :
                              r.status === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddDialog && (
        <RiskDialog open={showAddDialog} onClose={() => setShowAddDialog(false)}
          onSave={handleSaveNew} saving={addRisk.isPending} />
      )}
      {editingRisk && (
        <RiskDialog open={!!editingRisk} onClose={() => setEditingRisk(null)}
          onSave={handleSaveEdit} saving={updateRisk.isPending}
          initial={{
            riskCategory: editingRisk.riskCategory, riskTitle: editingRisk.riskTitle,
            riskDescription: editingRisk.riskDescription ?? "", likelihood: editingRisk.likelihood,
            impact: editingRisk.impact,
            vrlStageImpacted: editingRisk.vrlStageImpacted ? String(editingRisk.vrlStageImpacted) : "",
            mitigationPlan: editingRisk.mitigationPlan ?? "", riskOwner: editingRisk.riskOwner ?? "",
            status: editingRisk.status ?? "Open",
            reviewDate: editingRisk.reviewDate ? new Date(editingRisk.reviewDate).toISOString().split("T")[0] : "",
          }} />
      )}
    </div>
  );
}
