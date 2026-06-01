/**
 * OfferingDetail — Independent Execution Unit Drill-Down
 * Sprint 61: Each offering operates as an independent unit with its own
 * KPI snapshots, financial models, and execution linkage (workflows, risks, milestones, CRM, supply chain).
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Zap,
  BarChart3,
  DollarSign,
  Users,
  Star,
  Trash2,
  Link2,
  Workflow,
  ShieldAlert,
  CheckSquare,
  Briefcase,
  Package,
  Activity,
} from "lucide-react";

// ── KPI Snapshot Form ─────────────────────────────────────────────────────────
function KpiSnapshotForm({
  offeringId,
  onClose,
}: {
  offeringId: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().split("T")[0]);
  const [revenue, setRevenue] = useState("");
  const [cogs, setCogs] = useState("");
  const [grossMargin, setGrossMargin] = useState("");
  const [unitsSold, setUnitsSold] = useState("");
  const [activeCustomers, setActiveCustomers] = useState("");
  const [cac, setCac] = useState("");
  const [ltv, setLtv] = useState("");
  const [nps, setNps] = useState("");
  const [trlAtSnapshot, setTrlAtSnapshot] = useState("");
  const [brlAtSnapshot, setBrlAtSnapshot] = useState("");
  const [notes, setNotes] = useState("");

  const upsert = trpc.portfoliosOfferings.offerings.upsertKpiSnapshot.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.listKpiSnapshots.invalidate({ offeringId });
      toast.success("KPI snapshot saved");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div>
        <Label>Snapshot Date *</Label>
        <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Revenue (£)</Label>
          <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="e.g. 12500.00" />
        </div>
        <div>
          <Label>COGS (£)</Label>
          <Input value={cogs} onChange={(e) => setCogs(e.target.value)} placeholder="e.g. 4200.00" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Gross Margin (%)</Label>
          <Input type="number" value={grossMargin} onChange={(e) => setGrossMargin(e.target.value)} placeholder="e.g. 66.4" />
        </div>
        <div>
          <Label>Units Sold</Label>
          <Input type="number" value={unitsSold} onChange={(e) => setUnitsSold(e.target.value)} />
        </div>
        <div>
          <Label>Active Customers</Label>
          <Input type="number" value={activeCustomers} onChange={(e) => setActiveCustomers(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>CAC (£)</Label>
          <Input value={cac} onChange={(e) => setCac(e.target.value)} />
        </div>
        <div>
          <Label>LTV (£)</Label>
          <Input value={ltv} onChange={(e) => setLtv(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>NPS (-100 to 100)</Label>
          <Input type="number" min={-100} max={100} value={nps} onChange={(e) => setNps(e.target.value)} />
        </div>
        <div>
          <Label>TRL at Snapshot</Label>
          <Input type="number" min={1} max={9} value={trlAtSnapshot} onChange={(e) => setTrlAtSnapshot(e.target.value)} />
        </div>
        <div>
          <Label>BRL at Snapshot</Label>
          <Input type="number" min={0} max={100} value={brlAtSnapshot} onChange={(e) => setBrlAtSnapshot(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            upsert.mutate({
              offeringId,
              snapshotDate,
              revenue: revenue || undefined,
              cogs: cogs || undefined,
              grossMargin: grossMargin ? parseFloat(grossMargin) : undefined,
              unitsSold: unitsSold ? parseInt(unitsSold) : undefined,
              activeCustomers: activeCustomers ? parseInt(activeCustomers) : undefined,
              cac: cac || undefined,
              ltv: ltv || undefined,
              nps: nps ? parseInt(nps) : undefined,
              trlAtSnapshot: trlAtSnapshot ? parseInt(trlAtSnapshot) : undefined,
              brlAtSnapshot: brlAtSnapshot ? parseInt(brlAtSnapshot) : undefined,
              notes: notes || undefined,
            })
          }
          disabled={!snapshotDate || upsert.isPending}
        >
          {upsert.isPending ? "Saving…" : "Save Snapshot"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Financial Model Form ──────────────────────────────────────────────────────
function FinancialModelForm({
  offeringId,
  onClose,
}: {
  offeringId: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [modelName, setModelName] = useState("Base Case");
  const [revenueYear1, setRevenueYear1] = useState("");
  const [revenueYear2, setRevenueYear2] = useState("");
  const [revenueYear3, setRevenueYear3] = useState("");
  const [cogsPercent, setCogsPercent] = useState("");
  const [opexMonthly, setOpexMonthly] = useState("");
  const [breakEvenMonth, setBreakEvenMonth] = useState("");
  const [fundingRequired, setFundingRequired] = useState("");
  const [assumptions, setAssumptions] = useState("");

  const upsert = trpc.portfoliosOfferings.offerings.upsertFinancialModel.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.listFinancialModels.invalidate({ offeringId });
      toast.success("Financial model saved");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      <div>
        <Label>Model Name</Label>
        <Input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. Base Case, Bull Case" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Revenue Y1 (£)</Label>
          <Input value={revenueYear1} onChange={(e) => setRevenueYear1(e.target.value)} />
        </div>
        <div>
          <Label>Revenue Y2 (£)</Label>
          <Input value={revenueYear2} onChange={(e) => setRevenueYear2(e.target.value)} />
        </div>
        <div>
          <Label>Revenue Y3 (£)</Label>
          <Input value={revenueYear3} onChange={(e) => setRevenueYear3(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>COGS % of Revenue</Label>
          <Input type="number" value={cogsPercent} onChange={(e) => setCogsPercent(e.target.value)} placeholder="e.g. 35" />
        </div>
        <div>
          <Label>Monthly OpEx (£)</Label>
          <Input value={opexMonthly} onChange={(e) => setOpexMonthly(e.target.value)} />
        </div>
        <div>
          <Label>Break-even Month</Label>
          <Input type="number" value={breakEvenMonth} onChange={(e) => setBreakEvenMonth(e.target.value)} placeholder="e.g. 18" />
        </div>
      </div>
      <div>
        <Label>Funding Required (£)</Label>
        <Input value={fundingRequired} onChange={(e) => setFundingRequired(e.target.value)} />
      </div>
      <div>
        <Label>Key Assumptions</Label>
        <Textarea value={assumptions} onChange={(e) => setAssumptions(e.target.value)} rows={3} placeholder="List key assumptions…" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            upsert.mutate({
              offeringId,
              modelName,
              revenueYear1: revenueYear1 || undefined,
              revenueYear2: revenueYear2 || undefined,
              revenueYear3: revenueYear3 || undefined,
              cogsPercent: cogsPercent ? parseFloat(cogsPercent) : undefined,
              opexMonthly: opexMonthly || undefined,
              breakEvenMonth: breakEvenMonth ? parseInt(breakEvenMonth) : undefined,
              fundingRequired: fundingRequired || undefined,
              assumptions: assumptions || undefined,
            })
          }
          disabled={upsert.isPending}
        >
          {upsert.isPending ? "Saving…" : "Save Model"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── KPI Metric Card ───────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: accent, fontFamily: "'Prompt', sans-serif" }}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OfferingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const offeringId = params.id;

  const [showAddKpi, setShowAddKpi] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);

  const { data: offering, isLoading } = trpc.portfoliosOfferings.offerings.get.useQuery(
    { id: offeringId },
    { enabled: !!offeringId }
  );

  const { data: kpiSnapshots = [] } = trpc.portfoliosOfferings.offerings.listKpiSnapshots.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: financialModels = [] } = trpc.portfoliosOfferings.offerings.listFinancialModels.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: workflowLinks = [] } = trpc.portfoliosOfferings.links.listWorkflowLinks.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: riskLinks = [] } = trpc.portfoliosOfferings.links.listRiskLinks.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: milestoneLinks = [] } = trpc.portfoliosOfferings.links.listMilestoneLinks.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: crmLinks = [] } = trpc.portfoliosOfferings.links.listCrmLinks.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const { data: supplyChainLinks = [] } = trpc.portfoliosOfferings.links.listSupplyChainLinks.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  // Live aggregated analytics from Command Centre
  const { data: analytics } = trpc.commandCentre.getOfferingAnalytics.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  const utils = trpc.useUtils();
  const deleteKpi = trpc.portfoliosOfferings.offerings.deleteKpiSnapshot.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.listKpiSnapshots.invalidate({ offeringId });
      toast.success("Snapshot deleted");
    },
  });
  const deleteModel = trpc.portfoliosOfferings.offerings.deleteFinancialModel.useMutation({
    onSuccess: () => {
      utils.portfoliosOfferings.offerings.listFinancialModels.invalidate({ offeringId });
      toast.success("Model deleted");
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading offering…
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Package size={40} />
        <p>Offering not found</p>
        <Button variant="outline" onClick={() => navigate("/portfolio-manager")}>
          Back to Portfolio Manager
        </Button>
      </div>
    );
  }

  const latestKpi = kpiSnapshots[0];
  const offeringColor = offering.color ?? "#56A837";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 py-6 border-b"
        style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${offeringColor}` }}
      >
        <button
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors"
          onClick={() => navigate("/portfolio-manager")}
        >
          <ArrowLeft size={13} /> Back to Portfolio Manager
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {offering.offeringType === "Physical Product" ? "📦"
                  : offering.offeringType === "Digital Product" ? "💻"
                  : offering.offeringType === "Service" ? "🛠️"
                  : offering.offeringType === "SaaS" ? "☁️"
                  : offering.offeringType === "Subscription" ? "🔄"
                  : "🏪"}
              </span>
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "'Prompt', sans-serif", color: offeringColor }}
              >
                {offering.name}
              </h1>
              {offering.offeringStatus && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: offeringColor,
                    color: offeringColor,
                    background: `${offeringColor}12`,
                  }}
                >
                  {offering.offeringStatus}
                </Badge>
              )}
            </div>
            {offering.description && (
              <p className="text-sm text-gray-500 max-w-2xl">{offering.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {offering.offeringType && <span>{offering.offeringType}</span>}
              {offering.revenueModel && (
                <span className="flex items-center gap-1">
                  <TrendingUp size={10} /> {offering.revenueModel}
                </span>
              )}
              {offering.targetSegment && <span>→ {offering.targetSegment}</span>}
              {offering.pricePoint && <span className="font-mono">{offering.pricePoint}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {offering.trl && (
              <div className="text-center">
                <p className="text-xs text-gray-400">TRL</p>
                <p className="text-xl font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>
                  {offering.trl}
                </p>
              </div>
            )}
            {offering.brlScore !== null && offering.brlScore !== undefined && (
              <div className="text-center">
                <p className="text-xs text-gray-400">BRL</p>
                <p className="text-xl font-bold" style={{ color: "#56A837", fontFamily: "'Prompt', sans-serif" }}>
                  {offering.brlScore}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest KPI summary */}
      {latestKpi && (
        <div className="px-8 py-4 border-b bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            Latest KPI Snapshot — {new Date(latestKpi.snapshotDate).toLocaleDateString()}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Revenue" value={latestKpi.revenue ? `£${parseFloat(latestKpi.revenue).toLocaleString()}` : null} icon={DollarSign} accent="#56A837" />
            <MetricCard label="Gross Margin" value={latestKpi.grossMargin ? `${latestKpi.grossMargin}%` : null} icon={TrendingUp} accent="#3B85BA" />
            <MetricCard label="Units Sold" value={latestKpi.unitsSold?.toLocaleString()} icon={Package} accent="#F69111" />
            <MetricCard label="Customers" value={latestKpi.activeCustomers?.toLocaleString()} icon={Users} accent="#8B5CF6" />
            <MetricCard label="CAC" value={latestKpi.cac ? `£${parseFloat(latestKpi.cac).toLocaleString()}` : null} icon={Activity} accent="#E05C5C" />
            <MetricCard label="LTV" value={latestKpi.ltv ? `£${parseFloat(latestKpi.ltv).toLocaleString()}` : null} icon={BarChart3} accent="#06B6D4" />
            <MetricCard label="NPS" value={latestKpi.nps} icon={Star} accent={latestKpi.nps && latestKpi.nps > 0 ? "#56A837" : "#E05C5C"} />
          </div>
        </div>
      )}

      {/* Execution Health Analytics (live from DB) */}
      {analytics && (
        <div className="px-8 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Execution Health</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Milestones</p>
              <p className="text-xl font-bold" style={{ color: offeringColor, fontFamily: "'Prompt', sans-serif" }}>
                {analytics.milestones.completed}/{analytics.milestones.total}
              </p>
              <p className="text-xs text-gray-400">{analytics.milestones.completionRate}% complete</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Risks</p>
              <p className="text-xl font-bold" style={{ color: analytics.risks.high > 0 ? "#E05C5C" : "#56A837", fontFamily: "'Prompt', sans-serif" }}>
                {analytics.risks.total}
              </p>
              <p className="text-xs text-gray-400">{analytics.risks.high} high · {analytics.risks.medium} medium</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Experiments</p>
              <p className="text-xl font-bold" style={{ color: "#3B85BA", fontFamily: "'Prompt', sans-serif" }}>
                {analytics.experiments.passRate}%
              </p>
              <p className="text-xs text-gray-400">{analytics.experiments.passing}/{analytics.experiments.total} passing</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-8">
        <Tabs defaultValue="kpi">
          <TabsList className="mb-6">
            <TabsTrigger value="kpi">KPI Snapshots ({kpiSnapshots.length})</TabsTrigger>
            <TabsTrigger value="financial">Financial Models ({financialModels.length})</TabsTrigger>
            <TabsTrigger value="execution">Execution Links</TabsTrigger>
          </TabsList>

          {/* KPI Snapshots Tab */}
          <TabsContent value="kpi">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">KPI Snapshots</h2>
              <Button size="sm" onClick={() => setShowAddKpi(true)} style={{ background: offeringColor }}>
                <Plus size={13} className="mr-1" /> Add Snapshot
              </Button>
            </div>
            {kpiSnapshots.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                <BarChart3 size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-gray-400 text-sm mb-3">No KPI snapshots yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddKpi(true)}>
                  <Plus size={13} className="mr-1" /> Record First Snapshot
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {kpiSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="bg-white rounded-xl border p-4 shadow-sm"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(snap.snapshotDate).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                        {snap.notes && <p className="text-xs text-gray-400 mt-0.5">{snap.notes}</p>}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Delete this snapshot?")) deleteKpi.mutate({ id: snap.id });
                        }}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                      {snap.revenue && (
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Revenue</p>
                          <p className="font-bold text-green-700">£{parseFloat(snap.revenue).toLocaleString()}</p>
                        </div>
                      )}
                      {snap.grossMargin !== null && snap.grossMargin !== undefined && (
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Margin</p>
                          <p className="font-bold text-blue-700">{snap.grossMargin}%</p>
                        </div>
                      )}
                      {snap.unitsSold !== null && snap.unitsSold !== undefined && (
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Units</p>
                          <p className="font-bold text-amber-700">{snap.unitsSold.toLocaleString()}</p>
                        </div>
                      )}
                      {snap.activeCustomers !== null && snap.activeCustomers !== undefined && (
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Customers</p>
                          <p className="font-bold text-purple-700">{snap.activeCustomers.toLocaleString()}</p>
                        </div>
                      )}
                      {snap.cac && (
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">CAC</p>
                          <p className="font-bold text-red-700">£{parseFloat(snap.cac).toLocaleString()}</p>
                        </div>
                      )}
                      {snap.ltv && (
                        <div className="bg-cyan-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">LTV</p>
                          <p className="font-bold text-cyan-700">£{parseFloat(snap.ltv).toLocaleString()}</p>
                        </div>
                      )}
                      {snap.nps !== null && snap.nps !== undefined && (
                        <div className={`rounded-lg p-2 text-center ${snap.nps > 0 ? "bg-green-50" : "bg-red-50"}`}>
                          <p className="text-gray-400">NPS</p>
                          <p className={`font-bold ${snap.nps > 0 ? "text-green-700" : "text-red-700"}`}>{snap.nps}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Financial Models Tab */}
          <TabsContent value="financial">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">Financial Models</h2>
              <Button size="sm" onClick={() => setShowAddModel(true)} style={{ background: offeringColor }}>
                <Plus size={13} className="mr-1" /> Add Model
              </Button>
            </div>
            {financialModels.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                <DollarSign size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-gray-400 text-sm mb-3">No financial models yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddModel(true)}>
                  <Plus size={13} className="mr-1" /> Create First Model
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financialModels.map((model) => (
                  <Card key={model.id} className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-gray-900">{model.modelName}</CardTitle>
                        <button
                          onClick={() => {
                            if (confirm("Delete this model?")) deleteModel.mutate({ id: model.id });
                          }}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Y1 Revenue</p>
                          <p className="font-bold text-green-700">{model.revenueYear1 ? `£${parseFloat(model.revenueYear1).toLocaleString()}` : "—"}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Y2 Revenue</p>
                          <p className="font-bold text-blue-700">{model.revenueYear2 ? `£${parseFloat(model.revenueYear2).toLocaleString()}` : "—"}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <p className="text-gray-400">Y3 Revenue</p>
                          <p className="font-bold text-purple-700">{model.revenueYear3 ? `£${parseFloat(model.revenueYear3).toLocaleString()}` : "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {model.cogsPercent !== null && model.cogsPercent !== undefined && (
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-400">COGS %</span>
                            <span className="font-bold text-gray-700">{model.cogsPercent}%</span>
                          </div>
                        )}
                        {model.breakEvenMonth && (
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-400">Break-even</span>
                            <span className="font-bold text-gray-700">Month {model.breakEvenMonth}</span>
                          </div>
                        )}
                        {model.fundingRequired && (
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-400">Funding</span>
                            <span className="font-bold text-gray-700">£{parseFloat(model.fundingRequired).toLocaleString()}</span>
                          </div>
                        )}
                        {model.opexMonthly && (
                          <div className="flex justify-between bg-gray-50 rounded p-2">
                            <span className="text-gray-400">Monthly OpEx</span>
                            <span className="font-bold text-gray-700">£{parseFloat(model.opexMonthly).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {model.assumptions && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <p className="font-medium text-gray-600 mb-1">Assumptions</p>
                          <p className="whitespace-pre-wrap">{model.assumptions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Execution Links Tab */}
          <TabsContent value="execution">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Workflows */}
              <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Workflow size={14} style={{ color: "#56A837" }} /> Workflow Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workflowLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No workflow links yet</p>
                  ) : (
                    <div className="space-y-1">
                      {workflowLinks.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <Link2 size={10} className="text-gray-400" />
                          Trigger Log #{l.triggerLogId}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risks */}
              <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ShieldAlert size={14} style={{ color: "#E05C5C" }} /> Risk Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {riskLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No risk links yet</p>
                  ) : (
                    <div className="space-y-1">
                      {riskLinks.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <Link2 size={10} className="text-gray-400" />
                          Risk #{l.riskId}
                          {l.riskType && <Badge variant="outline" className="text-xs ml-auto">{l.riskType}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CheckSquare size={14} style={{ color: "#3B85BA" }} /> Milestone Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {milestoneLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No milestone links yet</p>
                  ) : (
                    <div className="space-y-1">
                      {milestoneLinks.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <Link2 size={10} className="text-gray-400" />
                          Milestone #{l.milestoneId}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CRM */}
              <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Briefcase size={14} style={{ color: "#F69111" }} /> CRM Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {crmLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No CRM links yet</p>
                  ) : (
                    <div className="space-y-1">
                      {crmLinks.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <Link2 size={10} className="text-gray-400" />
                          {l.pipelineId ? `Pipeline #${l.pipelineId}` : `Deal #${l.dealId}`}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Supply Chain */}
              <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Package size={14} style={{ color: "#8B5CF6" }} /> Supply Chain Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {supplyChainLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No supply chain links yet</p>
                  ) : (
                    <div className="space-y-1">
                      {supplyChainLinks.map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <Link2 size={10} className="text-gray-400" />
                          Project #{l.projectId}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-600">
              <p className="font-medium mb-1">How to link execution data to this offering</p>
              <p>Use the <code className="bg-blue-100 px-1 rounded">trpc.portfoliosOfferings.links.*</code> mutations to link workflow trigger logs, risks, milestones, CRM pipelines/deals, and supply chain projects directly to this offering. Links are created programmatically when execution events fire.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showAddKpi} onOpenChange={setShowAddKpi}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New KPI Snapshot — {offering.name}</DialogTitle>
          </DialogHeader>
          <KpiSnapshotForm offeringId={offeringId} onClose={() => setShowAddKpi(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModel} onOpenChange={setShowAddModel}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Financial Model — {offering.name}</DialogTitle>
          </DialogHeader>
          <FinancialModelForm offeringId={offeringId} onClose={() => setShowAddModel(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
