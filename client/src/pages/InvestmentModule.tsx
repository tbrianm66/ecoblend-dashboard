// ============================================================
// ECOBLEND INVESTMENT MODULE PAGE — Sprint 66
// Design: Precision Industrial — hub-and-spoke + KPI cards
// Tabs: Readiness Score | Pitch Deck | Business Plan |
//       Execution Plan | Investor Matching | Fundraising
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  TrendingUp, FileText, BarChart3, Target, Users, DollarSign,
  Loader2, Sparkles, RefreshCw, Trash2, CheckCircle2, AlertTriangle,
  ChevronRight, Plus, ExternalLink, Pencil, Leaf,
} from "lucide-react";

// ─── Colour palette (matches platform design tokens) ─────────────────────────
const C = {
  green: "#56A837",
  blue: "#3B85BA",
  amber: "#F69111",
  red: "#ef4444",
  gray: "#6b7280",
};

const TABS = [
  { id: "readiness", label: "Readiness Score", icon: TrendingUp },
  { id: "pitch", label: "Pitch Deck", icon: FileText },
  { id: "business", label: "Business Plan", icon: BarChart3 },
  { id: "execution", label: "Execution Plan", icon: Target },
  { id: "investors", label: "Investor Matching", icon: Users },
  { id: "fundraising", label: "Fundraising", icon: DollarSign },
] as const;
type TabId = typeof TABS[number]["id"];

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n}`;
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{value}</text>
      </svg>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function SectionCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="border rounded-lg p-4" style={{ borderColor: "#e5e7eb" }}>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{title}</h4>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    draft: { bg: "#f3f4f6", color: "#6b7280" },
    in_review: { bg: "#fef3c7", color: "#d97706" },
    approved: { bg: "#d1fae5", color: "#059669" },
    sent: { bg: "#dbeafe", color: "#2563eb" },
    archived: { bg: "#f3f4f6", color: "#9ca3af" },
    identified: { bg: "#f3f4f6", color: "#6b7280" },
    researching: { bg: "#fef3c7", color: "#d97706" },
    warm_intro: { bg: "#ede9fe", color: "#7c3aed" },
    contacted: { bg: "#dbeafe", color: "#2563eb" },
    meeting_booked: { bg: "#d1fae5", color: "#059669" },
    dd_requested: { bg: "#fef3c7", color: "#d97706" },
    term_sheet: { bg: "#d1fae5", color: "#059669" },
    closed: { bg: "#d1fae5", color: "#059669" },
    passed: { bg: "#fee2e2", color: "#dc2626" },
    planning: { bg: "#f3f4f6", color: "#6b7280" },
    open: { bg: "#d1fae5", color: "#059669" },
    closing: { bg: "#fef3c7", color: "#d97706" },
  };
  const s = map[status] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Readiness Tab ────────────────────────────────────────────────────────────

function ReadinessTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: score, isLoading } = trpc.investmentModule.readiness.get.useQuery({ ventureId });
  const { data: portfolio } = trpc.investmentModule.readiness.portfolioSummary.useQuery();
  const calcMut = trpc.investmentModule.readiness.calculate.useMutation({
    onSuccess: () => {
      utils.investmentModule.readiness.get.invalidate();
      utils.investmentModule.readiness.portfolioSummary.invalidate();
      toast.success("Readiness score recalculated");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Portfolio KPIs */}
      {portfolio && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Portfolio Avg Score", value: `${portfolio.avgComposite}%`, color: C.green },
            { label: "Investment Ready", value: `${portfolio.readyCount} / ${portfolio.total}`, color: C.blue },
            { label: "Ventures Assessed", value: portfolio.total, color: C.amber },
          ].map(k => (
            <div key={k.label} className="bg-white border rounded-xl p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{k.label}</span>
              <div className="text-2xl font-bold mt-1" style={{ color: k.color, fontFamily: "'Prompt', sans-serif" }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Score detail */}
      <div className="bg-white border rounded-xl p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Investment Readiness Score
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Composite across 6 dimensions</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"
            style={{ borderColor: C.green, color: C.green }}
            onClick={() => calcMut.mutate({ ventureId })}
            disabled={calcMut.isPending}>
            {calcMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Recalculate
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : score ? (
          <div className="flex flex-col gap-6">
            {/* Composite score */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold" style={{ color: (score.compositeScore ?? 0) >= 60 ? C.green : C.amber, fontFamily: "'Prompt', sans-serif" }}>
                  {score.compositeScore ?? 0}
                </div>
                <span className="text-xs text-gray-400 mt-1">Composite Score</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <ScoreRing value={score.commercialScore ?? 0} label="Commercial" color={C.blue} />
                <ScoreRing value={score.technicalScore ?? 0} label="Technical" color={C.green} />
                <ScoreRing value={score.validationScore ?? 0} label="Validation" color={C.amber} />
                <ScoreRing value={score.supplyChainScore ?? 0} label="Supply Chain" color="#8b5cf6" />
                <ScoreRing value={score.impactScore ?? 0} label="Impact" color={C.green} />
                <ScoreRing value={score.investmentAttractiveness ?? 0} label="Attractiveness" color={C.blue} />
              </div>
            </div>

            {/* Strengths / Weaknesses / Gaps */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: "Strengths", items: JSON.parse(score.strengthsJson ?? "[]") as string[], color: C.green, icon: CheckCircle2 },
                { title: "Weaknesses", items: JSON.parse(score.weaknessesJson ?? "[]") as string[], color: C.red, icon: AlertTriangle },
                { title: "Gaps to Close", items: JSON.parse(score.gapsJson ?? "[]") as string[], color: C.amber, icon: ChevronRight },
              ].map(section => (
                <div key={section.title} className="border rounded-lg p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <section.icon size={14} style={{ color: section.color }} />
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: section.color }}>{section.title}</span>
                  </div>
                  {section.items.length === 0
                    ? <p className="text-xs text-gray-400 italic">None identified</p>
                    : section.items.map((item, i) => (
                      <p key={i} className="text-xs text-gray-600 mb-1.5 flex gap-1.5">
                        <span style={{ color: section.color }}>·</span> {item}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
            <TrendingUp size={32} />
            <p className="text-sm">No readiness score yet. Click Recalculate to generate.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic Output Tab ───────────────────────────────────────────────────────

type OutputType = "pitch_deck" | "business_plan" | "execution_plan" | "investor_summary";

interface OutputTabProps {
  ventureId: string;
  outputType: OutputType;
  title: string;
  description: string;
  generateLabel: string;
  onGenerate: () => void;
  isGenerating: boolean;
  sectionMap: { key: string; label: string }[];
}

function OutputTab({
  ventureId, outputType, title, description,
  generateLabel, onGenerate, isGenerating, sectionMap,
}: OutputTabProps) {
  const utils = trpc.useUtils();
  const { data: outputs, isLoading } = trpc.investmentModule.outputs.list.useQuery({ ventureId });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail } = trpc.investmentModule.outputs.get.useQuery(
    { id: selectedId! }, { enabled: selectedId !== null }
  );
  const updateStatus = trpc.investmentModule.outputs.updateStatus.useMutation({
    onSuccess: () => {
      utils.investmentModule.outputs.list.invalidate();
      toast.success("Status updated");
    },
  });
  const deleteMut = trpc.investmentModule.outputs.delete.useMutation({
    onSuccess: () => {
      utils.investmentModule.outputs.list.invalidate();
      setSelectedId(null);
      toast.success("Deleted");
    },
  });

  const filtered = (outputs ?? []).filter(o => o.outputType === outputType);
  const selected = selectedId ? detail : filtered[0] ?? null;

  return (
    <div className="flex gap-5" style={{ minHeight: 480 }}>
      {/* Left: list */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <Button size="sm" className="w-full gap-1.5 text-xs text-white"
          style={{ background: C.green }}
          onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {generateLabel}
        </Button>
        {isLoading ? (
          <div className="flex justify-center pt-6"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-6">No {title.toLowerCase()} generated yet</p>
        ) : (
          filtered.map(o => (
            <button key={o.id}
              className={`text-left border rounded-lg p-3 transition-all ${selectedId === o.id || (!selectedId && o.id === filtered[0]?.id) ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => setSelectedId(o.id)}>
              <p className="text-xs font-semibold text-gray-800 truncate">{o.title}</p>
              <div className="flex items-center justify-between mt-1">
                <StatusBadge status={o.status ?? "draft"} />
                <span className="text-xs text-gray-400">{new Date(o.createdAt!).toLocaleDateString()}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Right: detail */}
      <div className="flex-1 bg-white border rounded-xl p-6 shadow-sm overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
        {!selected ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <FileText size={32} />
            <p className="text-sm">{description}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{selected.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status ?? "draft"} />
                  <span className="text-xs text-gray-400">Generated {new Date(selected.createdAt!).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selected.status ?? "draft"}
                  onValueChange={(v) => updateStatus.mutate({ id: selected.id, status: v as "draft" | "in_review" | "approved" | "sent" | "archived" })}>
                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "in_review", "approved", "sent", "archived"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                  onClick={() => deleteMut.mutate({ id: selected.id })}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {sectionMap.map(({ key, label }) => {
                const value = (selected as Record<string, unknown>)[key] as string | null;
                return value ? <SectionCard key={key} title={label} content={value} /> : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Investor Matching Tab ────────────────────────────────────────────────────

function InvestorsTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: targets, isLoading } = trpc.investmentModule.targets.list.useQuery({ ventureId });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ investorName: "", fund: "", investorType: "vc" as const, notes: "", matchScore: 0 });

  const aiMatchMut = trpc.investmentModule.targets.aiMatch.useMutation({
    onSuccess: (d) => {
      utils.investmentModule.targets.list.invalidate();
      toast.success(`${d.investors.length} investor matches added`);
    },
    onError: (e) => toast.error(e.message),
  });
  const upsertMut = trpc.investmentModule.targets.upsert.useMutation({
    onSuccess: () => {
      utils.investmentModule.targets.list.invalidate();
      setShowAdd(false);
      toast.success("Investor added");
    },
  });
  const deleteMut = trpc.investmentModule.targets.delete.useMutation({
    onSuccess: () => { utils.investmentModule.targets.list.invalidate(); toast.success("Removed"); },
  });
  const updateMut = trpc.investmentModule.targets.upsert.useMutation({
    onSuccess: () => utils.investmentModule.targets.list.invalidate(),
  });

  const STATUSES = ["identified", "researching", "warm_intro", "contacted", "meeting_booked", "dd_requested", "term_sheet", "closed", "passed"] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Investor Targets</h3>
          <p className="text-xs text-gray-400 mt-0.5">{targets?.length ?? 0} investors tracked</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"
            style={{ borderColor: C.blue, color: C.blue }}
            onClick={() => aiMatchMut.mutate({ ventureId })}
            disabled={aiMatchMut.isPending}>
            {aiMatchMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            AI Match
          </Button>
          <Button size="sm" className="gap-1.5 text-xs text-white"
            style={{ background: C.green }}
            onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add Investor
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : (targets ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400 border rounded-xl" style={{ borderColor: "#e5e7eb" }}>
          <Users size={32} />
          <p className="text-sm">No investors yet. Use AI Match or add manually.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                {["Investor / Fund", "Type", "Match", "Sector Focus", "Status", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 py-2 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(targets ?? []).map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-gray-800">{t.investorName}</div>
                    {t.fund && <div className="text-xs text-gray-400">{t.fund}</div>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs text-gray-600 capitalize">{(t.investorType ?? "").replace(/_/g, " ")}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.matchScore ?? 0}%`, background: (t.matchScore ?? 0) >= 70 ? C.green : C.amber }} />
                      </div>
                      <span className="text-xs font-mono text-gray-500">{t.matchScore ?? 0}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-gray-500">{t.sectorFocus ?? "—"}</td>
                  <td className="py-2.5 px-3">
                    <Select value={t.outreachStatus ?? "identified"}
                      onValueChange={(v) => updateMut.mutate({ id: t.id, investorName: t.investorName, outreachStatus: v as typeof STATUSES[number] })}>
                      <SelectTrigger className="h-6 text-xs w-36 border-0 p-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2.5 px-3">
                    <button className="text-gray-300 hover:text-red-400 transition-colors"
                      onClick={() => deleteMut.mutate({ id: t.id })}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add investor dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Investor</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Investor Name *" value={form.investorName} onChange={e => setForm(f => ({ ...f, investorName: e.target.value }))} />
            <Input placeholder="Fund / Organisation" value={form.fund} onChange={e => setForm(f => ({ ...f, fund: e.target.value }))} />
            <Select value={form.investorType} onValueChange={v => setForm(f => ({ ...f, investorType: v as typeof form.investorType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["angel", "vc", "family_office", "corporate_vc", "impact_fund", "grant", "crowdfunding", "debt"].map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="text-white" style={{ background: C.green }}
              disabled={!form.investorName || upsertMut.isPending}
              onClick={() => upsertMut.mutate({ ventureId, ...form })}>
              {upsertMut.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Fundraising Tab ──────────────────────────────────────────────────────────

function FundraisingTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const { data: rounds, isLoading } = trpc.investmentModule.fundraising.list.useQuery({ ventureId });
  const { data: kpi } = trpc.investmentModule.kpis.get.useQuery({ ventureId });
  const [showAdd, setShowAdd] = useState(false);
  const [showKpi, setShowKpi] = useState(false);
  const [roundForm, setRoundForm] = useState({ roundName: "", roundType: "seed" as const, targetAmount: 0, raisedAmount: 0, status: "planning" as const, leadInvestor: "", notes: "" });
  const [kpiForm, setKpiForm] = useState({ askAmount: 0, preMoneyVal: 0, useOfFunds: "", revenueYear1: 0, revenueYear3: 0, revenueYear5: 0, burnRate: 0, runway: 0 });

  const upsertRound = trpc.investmentModule.fundraising.upsert.useMutation({
    onSuccess: () => { utils.investmentModule.fundraising.list.invalidate(); setShowAdd(false); toast.success("Round saved"); },
  });
  const deleteRound = trpc.investmentModule.fundraising.delete.useMutation({
    onSuccess: () => { utils.investmentModule.fundraising.list.invalidate(); toast.success("Round deleted"); },
  });
  const upsertKpi = trpc.investmentModule.kpis.upsert.useMutation({
    onSuccess: () => { utils.investmentModule.kpis.get.invalidate(); setShowKpi(false); toast.success("KPIs saved"); },
  });

  const totalRaised = (rounds ?? []).reduce((sum, r) => sum + (r.raisedAmount ?? 0), 0);
  const totalTarget = (rounds ?? []).reduce((sum, r) => sum + (r.targetAmount ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI summary */}
      {kpi && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Ask Amount", value: fmt(kpi.askAmount ?? 0), color: C.green },
            { label: "Pre-Money Val", value: fmt(kpi.preMoneyVal ?? 0), color: C.blue },
            { label: "Burn Rate", value: `${fmt(kpi.burnRate ?? 0)}/mo`, color: C.amber },
            { label: "Runway", value: `${kpi.runway ?? 0}m`, color: (kpi.runway ?? 0) >= 12 ? C.green : C.red },
          ].map(k => (
            <div key={k.label} className="bg-white border rounded-xl p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{k.label}</span>
              <div className="text-xl font-bold mt-1" style={{ color: k.color, fontFamily: "'Prompt', sans-serif" }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Fundraising Rounds</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmt(totalRaised)} raised of {fmt(totalTarget)} target across {(rounds ?? []).length} rounds
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"
            style={{ borderColor: C.blue, color: C.blue }}
            onClick={() => setShowKpi(true)}>
            <Pencil size={13} /> Edit KPIs
          </Button>
          <Button size="sm" className="gap-1.5 text-xs text-white"
            style={{ background: C.green }}
            onClick={() => setShowAdd(true)}>
            <Plus size={13} /> New Round
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : (rounds ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400 border rounded-xl" style={{ borderColor: "#e5e7eb" }}>
          <DollarSign size={32} />
          <p className="text-sm">No fundraising rounds yet. Add your first round.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(rounds ?? []).map(r => {
            const pct = r.targetAmount && r.targetAmount > 0 ? Math.min(100, ((r.raisedAmount ?? 0) / r.targetAmount) * 100) : 0;
            return (
              <div key={r.id} className="bg-white border rounded-xl p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{r.roundName}</span>
                      <StatusBadge status={r.status ?? "planning"} />
                      {r.roundType && <span className="text-xs text-gray-400 capitalize">{r.roundType.replace(/_/g, " ")}</span>}
                    </div>
                    {r.leadInvestor && <p className="text-xs text-gray-400 mt-0.5">Lead: {r.leadInvestor}</p>}
                  </div>
                  <button className="text-gray-300 hover:text-red-400 transition-colors"
                    onClick={() => deleteRound.mutate({ id: r.id })}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{fmt(r.raisedAmount ?? 0)} raised</span>
                      <span>{fmt(r.targetAmount ?? 0)} target</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct >= 100 ? C.green : C.blue }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600">{Math.round(pct)}%</span>
                </div>
                {r.notes && <p className="text-xs text-gray-400 mt-2">{r.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Round Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Fundraising Round</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Round Name *" value={roundForm.roundName} onChange={e => setRoundForm(f => ({ ...f, roundName: e.target.value }))} />
            <Select value={roundForm.roundType} onValueChange={v => setRoundForm(f => ({ ...f, roundType: v as typeof roundForm.roundType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pre_seed", "seed", "series_a", "series_b", "bridge", "grant", "convertible_note"].map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Target £" value={roundForm.targetAmount || ""} onChange={e => setRoundForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} />
              <Input type="number" placeholder="Raised £" value={roundForm.raisedAmount || ""} onChange={e => setRoundForm(f => ({ ...f, raisedAmount: Number(e.target.value) }))} />
            </div>
            <Input placeholder="Lead Investor" value={roundForm.leadInvestor} onChange={e => setRoundForm(f => ({ ...f, leadInvestor: e.target.value }))} />
            <Textarea placeholder="Notes" value={roundForm.notes} onChange={e => setRoundForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="text-white" style={{ background: C.green }}
              disabled={!roundForm.roundName || upsertRound.isPending}
              onClick={() => upsertRound.mutate({ ventureId, ...roundForm })}>
              {upsertRound.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Save Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Dialog */}
      <Dialog open={showKpi} onOpenChange={setShowKpi}>
        <DialogContent>
          <DialogHeader><DialogTitle>Investment KPIs</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Ask Amount £" value={kpiForm.askAmount || ""} onChange={e => setKpiForm(f => ({ ...f, askAmount: Number(e.target.value) }))} />
              <Input type="number" placeholder="Pre-Money Val £" value={kpiForm.preMoneyVal || ""} onChange={e => setKpiForm(f => ({ ...f, preMoneyVal: Number(e.target.value) }))} />
              <Input type="number" placeholder="Revenue Year 1 £" value={kpiForm.revenueYear1 || ""} onChange={e => setKpiForm(f => ({ ...f, revenueYear1: Number(e.target.value) }))} />
              <Input type="number" placeholder="Revenue Year 3 £" value={kpiForm.revenueYear3 || ""} onChange={e => setKpiForm(f => ({ ...f, revenueYear3: Number(e.target.value) }))} />
              <Input type="number" placeholder="Revenue Year 5 £" value={kpiForm.revenueYear5 || ""} onChange={e => setKpiForm(f => ({ ...f, revenueYear5: Number(e.target.value) }))} />
              <Input type="number" placeholder="Burn Rate £/mo" value={kpiForm.burnRate || ""} onChange={e => setKpiForm(f => ({ ...f, burnRate: Number(e.target.value) }))} />
              <Input type="number" placeholder="Runway (months)" value={kpiForm.runway || ""} onChange={e => setKpiForm(f => ({ ...f, runway: Number(e.target.value) }))} />
            </div>
            <Textarea placeholder="Use of Funds" value={kpiForm.useOfFunds} onChange={e => setKpiForm(f => ({ ...f, useOfFunds: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKpi(false)}>Cancel</Button>
            <Button className="text-white" style={{ background: C.green }}
              disabled={upsertKpi.isPending}
              onClick={() => upsertKpi.mutate({ ventureId, ...kpiForm, id: kpi?.id })}>
              {upsertKpi.isPending ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
              Save KPIs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvestmentModule() {
  const { ventures: allVentures } = useVentures();
  const ventures = allVentures.filter(v => !v.isInternalLab);
  const [activeTab, setActiveTab] = useState<TabId>("readiness");
  const [ventureId, setVentureId] = useState<string>(ventures[0]?.id ?? "");
  const utils = trpc.useUtils();

  const selectedVenture = ventures.find(v => v.id === ventureId);

  // Generation mutations
  const genPitch = trpc.investmentModule.outputs.generatePitchDeck.useMutation({
    onSuccess: () => { utils.investmentModule.outputs.list.invalidate(); toast.success("Pitch deck generated"); },
    onError: (e) => toast.error(e.message),
  });
  const genBusiness = trpc.investmentModule.outputs.generateBusinessPlan.useMutation({
    onSuccess: () => { utils.investmentModule.outputs.list.invalidate(); toast.success("Business plan generated"); },
    onError: (e) => toast.error(e.message),
  });
  const genExecution = trpc.investmentModule.outputs.generateExecutionPlan.useMutation({
    onSuccess: () => { utils.investmentModule.outputs.list.invalidate(); toast.success("Execution plan generated"); },
    onError: (e) => toast.error(e.message),
  });
  const genSummary = trpc.investmentModule.outputs.generateInvestorSummary.useMutation({
    onSuccess: () => { utils.investmentModule.outputs.list.invalidate(); toast.success("Investor summary generated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb", background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${C.green}15`, color: C.green }}>
                Investment Module
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Sprint 66</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Investment Readiness
            </h1>
            <p className="text-sm text-gray-500 max-w-xl mt-0.5">
              Composite readiness scoring, AI-generated investor outputs, and fundraising pipeline management.
            </p>
          </div>
          {/* Venture selector */}
          <div className="flex items-center gap-3">
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="w-52 text-sm">
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                {ventures.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: v.color }} />
                      {v.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVenture && (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" style={{ borderColor: selectedVenture.color, color: selectedVenture.color }}>
                  VRL {selectedVenture.vrl}
                </Badge>
                <Badge variant="outline" style={{ borderColor: C.blue, color: C.blue }}>
                  TRL {selectedVenture.trl}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-8 border-b flex gap-0" style={{ borderColor: "#e5e7eb" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${active ? "border-green-500 text-green-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              onClick={() => setActiveTab(tab.id)}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-8">
        {!ventureId ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <Leaf size={32} />
            <p className="text-sm">Select a venture to begin.</p>
          </div>
        ) : (
          <>
            {activeTab === "readiness" && <ReadinessTab ventureId={ventureId} />}

            {activeTab === "pitch" && (
              <OutputTab
                ventureId={ventureId}
                outputType="pitch_deck"
                title="Pitch Deck"
                description="Generate an AI-powered pitch deck narrative for this venture."
                generateLabel="Generate Pitch Deck"
                onGenerate={() => genPitch.mutate({ ventureId })}
                isGenerating={genPitch.isPending}
                sectionMap={[
                  { key: "problemSection", label: "Problem" },
                  { key: "opportunitySection", label: "Opportunity" },
                  { key: "solutionSection", label: "Solution" },
                  { key: "marketSection", label: "Market" },
                  { key: "tractionSection", label: "Traction" },
                  { key: "businessModelSection", label: "Business Model" },
                  { key: "supplyChainSection", label: "Supply Chain" },
                  { key: "teamSection", label: "Team" },
                  { key: "financialsSection", label: "Financials" },
                  { key: "askSection", label: "The Ask" },
                ]}
              />
            )}

            {activeTab === "business" && (
              <OutputTab
                ventureId={ventureId}
                outputType="business_plan"
                title="Business Plan"
                description="Generate a comprehensive investor-grade business plan."
                generateLabel="Generate Business Plan"
                onGenerate={() => genBusiness.mutate({ ventureId })}
                isGenerating={genBusiness.isPending}
                sectionMap={[
                  { key: "executiveSummarySection", label: "Executive Summary" },
                  { key: "marketAnalysisSection", label: "Market Analysis" },
                  { key: "productServiceSection", label: "Product & Service" },
                  { key: "commercialStrategySection", label: "Commercial Strategy" },
                  { key: "financialProjectionsSection", label: "Financial Projections" },
                  { key: "riskAnalysisSection", label: "Risk Analysis" },
                ]}
              />
            )}

            {activeTab === "execution" && (
              <OutputTab
                ventureId={ventureId}
                outputType="execution_plan"
                title="Execution Plan"
                description="Generate a 90-day execution plan with milestones and budget."
                generateLabel="Generate Execution Plan"
                onGenerate={() => genExecution.mutate({ ventureId })}
                isGenerating={genExecution.isPending}
                sectionMap={[
                  { key: "roadmap90DaySection", label: "90-Day Roadmap" },
                  { key: "productDevSection", label: "Product Development" },
                  { key: "supplyChainPlanSection", label: "Supply Chain Plan" },
                  { key: "teamPlanSection", label: "Team Plan" },
                  { key: "budgetSection", label: "Budget" },
                  { key: "milestonesSection", label: "Key Milestones" },
                ]}
              />
            )}

            {activeTab === "investors" && <InvestorsTab ventureId={ventureId} />}

            {activeTab === "fundraising" && <FundraisingTab ventureId={ventureId} />}
          </>
        )}
      </div>
    </div>
  );
}
