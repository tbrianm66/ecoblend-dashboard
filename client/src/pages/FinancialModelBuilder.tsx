// ============================================================
// FINANCIAL MODEL BUILDER
// Sprint 52 — P&L, Runway, Exit Waterfall, Investor Reports,
//             Unit Economics, Overview
// Design: Precision Industrial — consistent with EcoBlend palette
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import MissionIntegrityBadge from "@/components/MissionIntegrityBadge";

import {
  TrendingUp, DollarSign, BarChart3, FileText, Zap, Calculator,
  Plus, Trash2, Edit, Send, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const BRAND = "#56A837";
const BLUE  = "#3B85BA";
const AMBER = "#F69111";
const RED   = "#ef4444";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `£${(n / 1_000).toFixed(0)}K`
  : `£${n}`;

const PL_CATEGORIES = [
  { value: "revenue",       label: "Revenue",       color: BRAND },
  { value: "cogs",          label: "COGS",           color: RED },
  { value: "gross_profit",  label: "Gross Profit",   color: BLUE },
  { value: "opex",          label: "OpEx",           color: AMBER },
  { value: "ebitda",        label: "EBITDA",         color: BLUE },
  { value: "depreciation",  label: "Depreciation",   color: "#6b7280" },
  { value: "ebit",          label: "EBIT",           color: BLUE },
  { value: "interest",      label: "Interest",       color: RED },
  { value: "tax",           label: "Tax",            color: RED },
  { value: "net_profit",    label: "Net Profit",     color: BRAND },
] as const;

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: summary } = trpc.finSummary.overview.useQuery();

  const kpis = [
    { label: "P&L Line Items",      value: summary?.plLines ?? 0,          icon: BarChart3,  color: BRAND },
    { label: "Runway Scenarios",    value: summary?.runwayScenarios ?? 0,  icon: TrendingUp, color: BLUE },
    { label: "Exit Waterfalls",     value: summary?.exitWaterfalls ?? 0,   icon: Zap,        color: AMBER },
    { label: "Investor Reports",    value: summary?.investorReports ?? 0,  icon: FileText,   color: BLUE },
    { label: "Unit Econ Entries",   value: summary?.unitEconEntries ?? 0,  icon: Calculator, color: BRAND },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border shadow-sm">
            <CardContent className="p-5 flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1">
                <k.icon size={14} style={{ color: k.color }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{k.label}</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: k.color, fontFamily: "'Prompt', sans-serif" }}>
                {k.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Financial Model Builder — Module Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { tab: "P&L Builder", desc: "5-year profit & loss model with revenue, COGS, OpEx, EBITDA, and net profit line items.", color: BRAND },
              { tab: "Runway Calculator", desc: "Model base/optimistic/pessimistic cash runway scenarios with burn rate, revenue growth, and break-even detection.", color: BLUE },
              { tab: "Exit Waterfall", desc: "Model exit proceeds distribution across investor tranches with liquidation preference and anti-dilution mechanics.", color: AMBER },
              { tab: "Investor Reports", desc: "AI-generated monthly/quarterly/annual investor update packs with highlights, challenges, and next steps.", color: BLUE },
              { tab: "Unit Economics", desc: "Track CAC, LTV, ARPU, churn, gross margin, payback period, and LTV:CAC ratio per period.", color: BRAND },
            ].map(m => (
              <div key={m.tab} className="p-4 rounded-xl border" style={{ borderLeft: `4px solid ${m.color}` }}>
                <div className="font-semibold text-sm text-gray-900 mb-1" style={{ color: m.color }}>{m.tab}</div>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── P&L Builder Tab ───────────────────────────────────────────────────────────
function PlBuilderTab() {
  const [ventureId, setVentureId] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ category: "revenue", lineItem: "", year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, unit: "GBP", notes: "" });

  const { data: lines = [], refetch } = trpc.finPl.list.useQuery({ ventureId: ventureId || undefined });
  const { data: summary } = trpc.finPl.summary.useQuery({ ventureId: ventureId || undefined });
  const upsert = trpc.finPl.upsert.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); setEditing(null); toast.success("Saved"); } });
  const del = trpc.finPl.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  const grouped = PL_CATEGORIES.map(cat => ({
    ...cat,
    lines: lines.filter(l => l.category === cat.value),
  })).filter(g => g.lines.length > 0);

  const openEdit = (line: any) => {
    setEditing(line);
    setForm({ category: line.category, lineItem: line.lineItem, year1: line.year1 || 0, year2: line.year2 || 0, year3: line.year3 || 0, year4: line.year4 || 0, year5: line.year5 || 0, unit: line.unit || "GBP", notes: line.notes || "" });
    setShowAdd(true);
  };

  const submit = () => {
    upsert.mutate({ ...form, category: form.category as "revenue" | "cogs" | "gross_profit" | "opex" | "ebitda" | "depreciation" | "ebit" | "interest" | "tax" | "net_profit", id: editing?.id, ventureId: ventureId || undefined, year1: Number(form.year1), year2: Number(form.year2), year3: Number(form.year3), year4: Number(form.year4), year5: Number(form.year5) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input placeholder="Filter by Venture ID (optional)" value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-64 text-sm" />
        </div>
        <Button size="sm" style={{ background: BRAND, color: "#fff" }} onClick={() => { setEditing(null); setForm({ category: "revenue", lineItem: "", year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, unit: "GBP", notes: "" }); setShowAdd(true); }}>
          <Plus size={13} className="mr-1" /> Add Line Item
        </Button>
      </div>

      {/* Summary bar chart */}
      {summary && summary.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-gray-700">5-Year Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4 font-semibold text-gray-500">Metric</th>
                    {[1,2,3,4,5].map(y => <th key={y} className="text-right py-1 px-2 font-semibold text-gray-500">Year {y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(["revenue","grossProfit","ebitda","netProfit"] as const).map(metric => (
                    <tr key={metric} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 font-medium text-gray-700 capitalize">{metric.replace(/([A-Z])/g, " $1")}</td>
                      {summary.map(s => {
                        const val = s[metric as keyof typeof s] as number;
                        const isNeg = val < 0;
                        return (
                          <td key={s.year} className="text-right py-1.5 px-2 font-mono" style={{ color: isNeg ? RED : BRAND }}>
                            {fmt(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line items grouped by category */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No P&L lines yet. Add your first line item above.</div>
      ) : (
        grouped.map(g => (
          <Card key={g.value} className="border shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-bold" style={{ color: g.color }}>{g.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4 font-semibold text-gray-500">Line Item</th>
                    {[1,2,3,4,5].map(y => <th key={y} className="text-right py-1 px-2 font-semibold text-gray-500">Y{y}</th>)}
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {g.lines.map(l => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-1.5 pr-4 text-gray-700">{l.lineItem}</td>
                      {[l.year1, l.year2, l.year3, l.year4, l.year5].map((v, i) => (
                        <td key={i} className="text-right py-1.5 px-2 font-mono text-gray-600">{fmt(v || 0)}</td>
                      ))}
                      <td className="py-1.5 flex gap-1 justify-end">
                        <button onClick={() => openEdit(l)} className="p-1 rounded hover:bg-gray-100"><Edit size={11} className="text-gray-400" /></button>
                        <button onClick={() => del.mutate({ id: l.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Line Item" : "Add P&L Line Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PL_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Line Item Name</Label>
                <Input value={form.lineItem} onChange={e => setForm(f => ({ ...f, lineItem: e.target.value }))} placeholder="e.g. Product Revenue" className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(y => (
                <div key={y}>
                  <Label className="text-xs">Year {y}</Label>
                  <Input type="number" value={(form as any)[`year${y}`]} onChange={e => setForm(f => ({ ...f, [`year${y}`]: Number(e.target.value) }))} className="text-sm" />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.lineItem} style={{ background: BRAND, color: "#fff" }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Runway Calculator Tab ─────────────────────────────────────────────────────
function RunwayTab() {
  const [ventureId, setVentureId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", cashBalance: 0, monthlyBurn: 0, monthlyRevenue: 0, growthRate: 0, scenario: "base" as const, assumptions: "" });

  const { data: scenarios = [], refetch } = trpc.finRunway.list.useQuery({ ventureId: ventureId || undefined });
  const upsert = trpc.finRunway.upsert.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); setEditing(null); toast.success("Saved"); } });
  const del = trpc.finRunway.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  const SCENARIO_COLORS: Record<string, string> = { base: BLUE, optimistic: BRAND, pessimistic: RED };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, cashBalance: s.cashBalance || 0, monthlyBurn: s.monthlyBurn || 0, monthlyRevenue: s.monthlyRevenue || 0, growthRate: s.growthRate || 0, scenario: s.scenario || "base", assumptions: s.assumptions || "" });
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter by Venture ID (optional)" value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-64 text-sm" />
        <Button size="sm" style={{ background: BLUE, color: "#fff" }} onClick={() => { setEditing(null); setForm({ name: "", cashBalance: 0, monthlyBurn: 0, monthlyRevenue: 0, growthRate: 0, scenario: "base", assumptions: "" }); setShowAdd(true); }}>
          <Plus size={13} className="mr-1" /> Add Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No runway scenarios yet. Add your first scenario above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map(s => {
            const color = SCENARIO_COLORS[s.scenario || "base"];
            const netBurn = (s.monthlyBurn || 0) - (s.monthlyRevenue || 0);
            return (
              <Card key={s.id} className="border shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Prompt', sans-serif" }}>{s.name}</div>
                      <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: color, color }}>{s.scenario}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-gray-100"><Edit size={12} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: s.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 mb-0.5">Cash Balance</div>
                      <div className="font-bold text-gray-900">{fmt(s.cashBalance || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Monthly Burn</div>
                      <div className="font-bold" style={{ color: RED }}>{fmt(s.monthlyBurn || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Monthly Revenue</div>
                      <div className="font-bold" style={{ color: BRAND }}>{fmt(s.monthlyRevenue || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Net Burn</div>
                      <div className="font-bold" style={{ color: netBurn > 0 ? RED : BRAND }}>{fmt(netBurn)}/mo</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 mb-0.5">Runway</div>
                      <div className="text-xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>
                        {s.runwayMonths === 999 ? "∞" : `${s.runwayMonths}mo`}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-0.5">Break-Even</div>
                      <div className="text-xl font-bold" style={{ color: BRAND, fontFamily: "'Prompt', sans-serif" }}>
                        {s.breakEvenMonth === null ? "N/A" : s.breakEvenMonth === 0 ? "Now" : `Mo ${s.breakEvenMonth}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Scenario" : "Add Runway Scenario"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Scenario Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Base Case" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Scenario Type</Label>
                <Select value={form.scenario} onValueChange={v => setForm(f => ({ ...f, scenario: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="optimistic">Optimistic</SelectItem>
                    <SelectItem value="pessimistic">Pessimistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "cashBalance", label: "Cash Balance (£)" },
                { key: "monthlyBurn", label: "Monthly Burn (£)" },
                { key: "monthlyRevenue", label: "Monthly Revenue (£)" },
                { key: "growthRate", label: "Revenue Growth Rate (%/mo)" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} className="text-sm" />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Assumptions</Label>
              <Textarea value={form.assumptions} onChange={e => setForm(f => ({ ...f, assumptions: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, id: editing?.id, ventureId: ventureId || undefined })} disabled={!form.name} style={{ background: BLUE, color: "#fff" }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Exit Waterfall Tab ────────────────────────────────────────────────────────
function WaterfallTab() {
  const [ventureId, setVentureId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showTranche, setShowTranche] = useState(false);
  const [selectedWaterfall, setSelectedWaterfall] = useState<number | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [editingTranche, setEditingTranche] = useState<any>(null);
  const [form, setForm] = useState({ exitValuation: 0, exitType: "acquisition" as const, preMoneyValuation: 0, totalInvested: 0, liquidationPref: "1x_non_participating" as const, antiDilution: "none" as const, notes: "" });
  const [trancheForm, setTrancheForm] = useState({ investorName: "", investorType: "angel" as const, shares: 0, ownershipPct: 0, invested: 0, pref: "common" as const, sortOrder: 0 });

  const { data: waterfalls = [], refetch } = trpc.finWaterfall.list.useQuery({ ventureId: ventureId || undefined });
  const { data: tranches = [], refetch: refetchTranches } = trpc.finWaterfall.getTranches.useQuery(
    { waterfallId: selectedWaterfall! },
    { enabled: !!selectedWaterfall }
  );
  const { data: calculation } = trpc.finWaterfall.calculate.useQuery(
    { waterfallId: selectedWaterfall! },
    { enabled: !!selectedWaterfall }
  );

  const upsert = trpc.finWaterfall.upsert.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); toast.success("Saved"); } });
  const del = trpc.finWaterfall.delete.useMutation({ onSuccess: () => { refetch(); if (selectedWaterfall) setSelectedWaterfall(null); toast.success("Deleted"); } });
  const upsertTranche = trpc.finWaterfall.upsertTranche.useMutation({ onSuccess: () => { refetchTranches(); setShowTranche(false); toast.success("Saved"); } });
  const delTranche = trpc.finWaterfall.deleteTranche.useMutation({ onSuccess: () => { refetchTranches(); toast.success("Deleted"); } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter by Venture ID (optional)" value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-64 text-sm" />
        <Button size="sm" style={{ background: AMBER, color: "#fff" }} onClick={() => { setEditing(null); setForm({ exitValuation: 0, exitType: "acquisition", preMoneyValuation: 0, totalInvested: 0, liquidationPref: "1x_non_participating", antiDilution: "none", notes: "" }); setShowAdd(true); }}>
          <Plus size={13} className="mr-1" /> New Waterfall
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Waterfall list */}
        <div className="space-y-3">
          {waterfalls.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No exit waterfalls yet.</div>
          ) : waterfalls.map(w => (
            <Card
              key={w.id}
              className={`border shadow-sm cursor-pointer transition-all ${selectedWaterfall === w.id ? "ring-2" : ""}`}
              style={{ borderLeft: `4px solid ${AMBER}`, ...(selectedWaterfall === w.id ? { ringColor: AMBER } : {}) }}
              onClick={() => setSelectedWaterfall(w.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{fmt(w.exitValuation || 0)} Exit</div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">{w.exitType?.replace(/_/g, " ")} · {w.liquidationPref?.replace(/_/g, " ")}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); del.mutate({ id: w.id }); }} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Pre-Money: </span><span className="font-mono">{fmt(w.preMoneyValuation || 0)}</span></div>
                  <div><span className="text-gray-400">Invested: </span><span className="font-mono">{fmt(w.totalInvested || 0)}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tranche detail */}
        {selectedWaterfall && (
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Investor Tranches</h3>
              <Button size="sm" variant="outline" onClick={() => { setEditingTranche(null); setTrancheForm({ investorName: "", investorType: "angel", shares: 0, ownershipPct: 0, invested: 0, pref: "common", sortOrder: 0 }); setShowTranche(true); }}>
                <Plus size={12} className="mr-1" /> Add Tranche
              </Button>
            </div>

            {tranches.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No tranches yet. Add investors above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-3 font-semibold text-gray-500">Investor</th>
                      <th className="text-left py-1 pr-3 font-semibold text-gray-500">Type</th>
                      <th className="text-right py-1 pr-3 font-semibold text-gray-500">Ownership %</th>
                      <th className="text-right py-1 pr-3 font-semibold text-gray-500">Invested</th>
                      <th className="text-right py-1 pr-3 font-semibold text-gray-500">Pref</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tranches.map(t => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-1.5 pr-3 font-medium text-gray-700">{t.investorName}</td>
                        <td className="py-1.5 pr-3 text-gray-500 capitalize">{t.investorType?.replace(/_/g, " ")}</td>
                        <td className="py-1.5 pr-3 text-right font-mono">{t.ownershipPct}%</td>
                        <td className="py-1.5 pr-3 text-right font-mono">{fmt(t.invested || 0)}</td>
                        <td className="py-1.5 pr-3 text-right">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: t.pref === "preferred" ? AMBER : "#e5e7eb", color: t.pref === "preferred" ? AMBER : "#6b7280" }}>{t.pref}</Badge>
                        </td>
                        <td className="py-1.5 flex gap-1">
                          <button onClick={() => delTranche.mutate({ id: t.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Calculation result */}
            {calculation && calculation.tranches.length > 0 && (
              <Card className="border shadow-sm" style={{ borderLeft: `4px solid ${AMBER}` }}>
                <CardHeader className="pb-1"><CardTitle className="text-sm font-bold" style={{ color: AMBER }}>Waterfall Distribution — {fmt(calculation.exitValuation)} Exit</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-3 font-semibold text-gray-500">Investor</th>
                        <th className="text-right py-1 pr-3 font-semibold text-gray-500">Pref Payout</th>
                        <th className="text-right py-1 pr-3 font-semibold text-gray-500">Pro-Rata</th>
                        <th className="text-right py-1 font-semibold text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.tranches.map((t: any) => (
                        <tr key={t.id} className="border-b last:border-0">
                          <td className="py-1.5 pr-3 font-medium text-gray-700">{t.investorName}</td>
                          <td className="py-1.5 pr-3 text-right font-mono text-gray-600">{fmt(t.prefPayout)}</td>
                          <td className="py-1.5 pr-3 text-right font-mono text-gray-600">{fmt(t.proRataPayout)}</td>
                          <td className="py-1.5 text-right font-mono font-bold" style={{ color: BRAND }}>{fmt(t.totalPayout)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Waterfall Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Exit Waterfall</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Exit Valuation (£)</Label>
                <Input type="number" value={form.exitValuation} onChange={e => setForm(f => ({ ...f, exitValuation: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Exit Type</Label>
                <Select value={form.exitType} onValueChange={v => setForm(f => ({ ...f, exitType: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["acquisition","ipo","secondary","mbo","liquidation"].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pre-Money Valuation (£)</Label>
                <Input type="number" value={form.preMoneyValuation} onChange={e => setForm(f => ({ ...f, preMoneyValuation: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Total Invested (£)</Label>
                <Input type="number" value={form.totalInvested} onChange={e => setForm(f => ({ ...f, totalInvested: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Liquidation Preference</Label>
                <Select value={form.liquidationPref} onValueChange={v => setForm(f => ({ ...f, liquidationPref: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1x_non_participating">1x Non-Participating</SelectItem>
                    <SelectItem value="1x_participating">1x Participating</SelectItem>
                    <SelectItem value="2x_non_participating">2x Non-Participating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Anti-Dilution</Label>
                <Select value={form.antiDilution} onValueChange={v => setForm(f => ({ ...f, antiDilution: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="broad_based">Broad-Based</SelectItem>
                    <SelectItem value="narrow_based">Narrow-Based</SelectItem>
                    <SelectItem value="full_ratchet">Full Ratchet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, ventureId: ventureId || undefined })} style={{ background: AMBER, color: "#fff" }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tranche Dialog */}
      <Dialog open={showTranche} onOpenChange={setShowTranche}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Investor Tranche</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Investor Name</Label>
                <Input value={trancheForm.investorName} onChange={e => setTrancheForm(f => ({ ...f, investorName: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Investor Type</Label>
                <Select value={trancheForm.investorType} onValueChange={v => setTrancheForm(f => ({ ...f, investorType: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["founder","angel","seed","series_a","series_b","employee","option_pool"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ownership %</Label>
                <Input type="number" value={trancheForm.ownershipPct} onChange={e => setTrancheForm(f => ({ ...f, ownershipPct: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Amount Invested (£)</Label>
                <Input type="number" value={trancheForm.invested} onChange={e => setTrancheForm(f => ({ ...f, invested: Number(e.target.value) }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Share Class</Label>
                <Select value={trancheForm.pref} onValueChange={v => setTrancheForm(f => ({ ...f, pref: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTranche(false)}>Cancel</Button>
            <Button onClick={() => upsertTranche.mutate({ ...trancheForm, waterfallId: selectedWaterfall! })} disabled={!trancheForm.investorName} style={{ background: AMBER, color: "#fff" }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Investor Reports Tab ──────────────────────────────────────────────────────
function InvestorReportsTab() {
  const [ventureId, setVentureId] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ ventureName: "", period: "", reportType: "monthly" as const, kpiData: "" });
  const [viewReport, setViewReport] = useState<any>(null);

  const { data: reports = [], refetch } = trpc.finReports.list.useQuery({ ventureId: ventureId || undefined });
  const generate = trpc.finReports.generate.useMutation({ onSuccess: () => { refetch(); setShowGenerate(false); toast.success("Report generated"); } });
  const markSent = trpc.finReports.markSent.useMutation({ onSuccess: () => { refetch(); toast.success("Marked as sent"); } });
  const del = trpc.finReports.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  const STATUS_COLORS: Record<string, string> = { draft: "#6b7280", review: AMBER, sent: BRAND, archived: "#9ca3af" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter by Venture ID (optional)" value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-64 text-sm" />
        <Button size="sm" style={{ background: BLUE, color: "#fff" }} onClick={() => setShowGenerate(true)}>
          <RefreshCw size={13} className="mr-1" /> Generate Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No investor reports yet. Generate your first report above.</div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <Card key={r.id} className="border shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setViewReport(r)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.period} · {r.reportType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs" style={{ borderColor: STATUS_COLORS[r.status || "draft"], color: STATUS_COLORS[r.status || "draft"] }}>{r.status}</Badge>
                    {r.status !== "sent" && (
                      <button onClick={e => { e.stopPropagation(); markSent.mutate({ id: r.id }); }} className="p-1 rounded hover:bg-green-50" title="Mark as sent">
                        <Send size={12} style={{ color: BRAND }} />
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); del.mutate({ id: r.id }); }} className="p-1 rounded hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </div>
                {r.highlights && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.highlights.split("\n")[0]}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Generate Investor Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Venture Name</Label>
                <Input value={genForm.ventureName} onChange={e => setGenForm(f => ({ ...f, ventureName: e.target.value }))} placeholder="e.g. EcoBlend" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Period</Label>
                <Input value={genForm.period} onChange={e => setGenForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. Q1 2026" className="text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Report Type</Label>
                <Select value={genForm.reportType} onValueChange={v => setGenForm(f => ({ ...f, reportType: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">KPI Data (optional — paste key metrics to include)</Label>
              <Textarea value={genForm.kpiData} onChange={e => setGenForm(f => ({ ...f, kpiData: e.target.value }))} rows={3} placeholder="Revenue: £50K, MRR: £8K, Customers: 12, Burn: £15K/mo..." className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={() => generate.mutate({ ...genForm, ventureId: ventureId || undefined })} disabled={!genForm.ventureName || !genForm.period || generate.isPending} style={{ background: BLUE, color: "#fff" }}>
              {generate.isPending ? "Generating..." : "Generate with AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewReport?.title}</DialogTitle></DialogHeader>
          {viewReport && (
            <div className="space-y-4 text-sm">
              {[
                { key: "highlights", label: "Highlights", color: BRAND },
                { key: "challenges", label: "Challenges", color: RED },
                { key: "nextSteps", label: "Next Steps", color: BLUE },
              ].map(s => viewReport[s.key] ? (
                <div key={s.key}>
                  <h4 className="font-bold mb-2" style={{ color: s.color }}>{s.label}</h4>
                  <div className="whitespace-pre-wrap text-gray-700 text-xs leading-relaxed">{viewReport[s.key]}</div>
                </div>
              ) : null)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Unit Economics Tab ────────────────────────────────────────────────────────
function UnitEconTab() {
  const [ventureId, setVentureId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ period: "", cac: 0, ltv: 0, arpu: 0, churnRate: 0, grossMargin: 0, notes: "" });

  const { data: entries = [], refetch } = trpc.finUnitEcon.list.useQuery({ ventureId: ventureId || undefined });
  const upsert = trpc.finUnitEcon.upsert.useMutation({ onSuccess: () => { refetch(); setShowAdd(false); setEditing(null); toast.success("Saved"); } });
  const del = trpc.finUnitEcon.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Deleted"); } });

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({ period: e.period || "", cac: e.cac || 0, ltv: e.ltv || 0, arpu: e.arpu || 0, churnRate: e.churnRate || 0, grossMargin: e.grossMargin || 0, notes: e.notes || "" });
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Filter by Venture ID (optional)" value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-64 text-sm" />
        <Button size="sm" style={{ background: BRAND, color: "#fff" }} onClick={() => { setEditing(null); setForm({ period: "", cac: 0, ltv: 0, arpu: 0, churnRate: 0, grossMargin: 0, notes: "" }); setShowAdd(true); }}>
          <Plus size={13} className="mr-1" /> Add Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No unit economics data yet. Add your first entry above.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {["Period","CAC","LTV","ARPU","Churn %","Gross Margin %","Payback (mo)","LTV:CAC",""].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const ltvCac = e.ltvCacRatio;
                const ltvCacColor = ltvCac === null ? "#6b7280" : ltvCac >= 3 ? BRAND : ltvCac >= 1 ? AMBER : RED;
                return (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-700">{e.period || "—"}</td>
                    <td className="py-2 pr-4 font-mono">{fmt(e.cac || 0)}</td>
                    <td className="py-2 pr-4 font-mono">{fmt(e.ltv || 0)}</td>
                    <td className="py-2 pr-4 font-mono">{fmt(e.arpu || 0)}</td>
                    <td className="py-2 pr-4 font-mono">{e.churnRate || 0}%</td>
                    <td className="py-2 pr-4 font-mono">{e.grossMargin || 0}%</td>
                    <td className="py-2 pr-4 font-mono">{e.paybackMonths ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono font-bold" style={{ color: ltvCacColor }}>{ltvCac !== null ? `${ltvCac}x` : "—"}</td>
                    <td className="py-2 flex gap-1">
                      <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-gray-100"><Edit size={11} className="text-gray-400" /></button>
                      <button onClick={() => del.mutate({ id: e.id })} className="p-1 rounded hover:bg-red-50"><Trash2 size={11} className="text-red-400" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Entry" : "Add Unit Economics Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Period</Label>
              <Input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. Q1 2026" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "cac", label: "CAC (£)" },
                { key: "ltv", label: "LTV (£)" },
                { key: "arpu", label: "ARPU (£/mo)" },
                { key: "churnRate", label: "Churn Rate (%)" },
                { key: "grossMargin", label: "Gross Margin (%)" },
              ].map(f => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input type="number" value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} className="text-sm" />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate({ ...form, id: editing?.id, ventureId: ventureId || undefined })} style={{ background: BRAND, color: "#fff" }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview",          icon: BarChart3 },
  { id: "pl",        label: "P&L Builder",        icon: DollarSign },
  { id: "runway",    label: "Runway Calculator",  icon: TrendingUp },
  { id: "waterfall", label: "Exit Waterfall",     icon: Zap },
  { id: "reports",   label: "Investor Reports",   icon: FileText },
  { id: "unitEcon",  label: "Unit Economics",     icon: Calculator },
];

export default function FinancialModelBuilder() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#56A83715", color: BRAND }}>
            Sprint 52
          </span>
          <span className="text-xs text-gray-400 font-mono">Financial Intelligence</span>
        </div>
        <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Financial Model Builder
        </h1>
              <MissionIntegrityBadge variant="chip" />
            </div>
        <p className="text-sm text-gray-500 mt-1">
          5-year P&L, runway scenarios, exit waterfall, AI investor reports, and unit economics — all in one place.
        </p>
      </div>

      <div className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-gray-100 p-1 rounded-lg">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <t.icon size={12} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="pl"><PlBuilderTab /></TabsContent>
          <TabsContent value="runway"><RunwayTab /></TabsContent>
          <TabsContent value="waterfall"><WaterfallTab /></TabsContent>
          <TabsContent value="reports"><InvestorReportsTab /></TabsContent>
          <TabsContent value="unitEcon"><UnitEconTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
