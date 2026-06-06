// ============================================================================
// MODULE C — WTP ASSESSMENT (Commercial Validation OS)
// Nine sub-tabs that test real buying commitment (money, budget, procurement,
// LOIs, paid pilots) — not enthusiasm. Backed by the `wtp` tRPC router and the
// pure scoring engine in shared/wtp.ts.
// ============================================================================
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DollarSign, Plus, Pencil, Trash2, CheckCircle2, XCircle, AlertTriangle,
  Clock, Handshake, Tag, Wallet, FileCheck, MessageSquareWarning,
  Gauge, ArrowRightCircle,
} from "lucide-react";
import {
  ModuleHeader, VentureSelector, ScoreCard, LeanDecisionPanel, EmptyState,
  NoVentureState, FormModal, Section, ToneBadge, DecisionWarning,
} from "@/components/discovery/primitives";
import type { Band } from "@shared/discoveryMarket";
import {
  calculateWTPScore, interpretWTPScore, humanise,
  interpretProcurementFriction, commitmentStatusBand,
  WTP_EVIDENCE_LADDER, WTP_TEST_STATUSES, WTP_PRICING_MODELS, WTP_TEST_METHODS,
  WTP_OBJECTION_CATEGORIES, BUDGET_OWNER_STATUSES, PRICING_RESPONSES,
  COMMITMENT_TYPES, COMMITMENT_STATUSES, PRICING_EXPERIMENT_STATUSES,
  BUDGET_VALIDATION_STATUSES, BUDGET_CATEGORIES, PROCUREMENT_ROUTES,
  PROCUREMENT_STATUSES, type WtpBand,
} from "@shared/wtp";

const GREEN = "#56A837";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Map the WTP engine's WtpBand (which can be "blue") onto the primitives Band. */
function asBand(b: WtpBand): Band {
  return { label: b.label, tone: b.tone === "blue" ? "grey" : b.tone };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function EnumSelect({
  value, onChange, options, placeholder = "Select…", allowEmpty = false,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  return (
    <Select
      value={value && value.length > 0 ? value : "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
    >
      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="__none__">—</SelectItem>}
        {options.map((o) => <SelectItem key={o} value={o}>{humanise(o)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
      <span className="text-xs text-gray-600">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function IconCircle({ icon, tone = GREEN }: { icon: React.ReactNode; tone?: string }) {
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: "rgba(86,168,55,0.10)", color: tone }}>
      {icon}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function WTPAssessment() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const [tab, setTab] = useState("overview");

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader
          title="WTP Assessment"
          purpose="Test real commercial commitment — money, budget, procurement, LOIs and paid pilots — not enthusiasm."
          icon={<DollarSign size={22} />}
          action={<VentureSelector />}
        />
        <NoVentureState />
      </div>
    );
  }

  const TABS: { value: string; label: string }[] = [
    { value: "overview", label: "WTP Overview" },
    { value: "commitments", label: "Customer Commitment Log" },
    { value: "pricing", label: "Pricing Test" },
    { value: "budget", label: "Budget Owner Validation" },
    { value: "procurement", label: "Procurement Pathway" },
    { value: "objections", label: "Commercial Objections" },
    { value: "ladder", label: "WTP Evidence Ladder" },
    { value: "scorecard", label: "WTP Scorecard" },
    { value: "next", label: "Next Commercial Action" },
  ];

  return (
    <Tabs value={tab} onValueChange={setTab} className="block flex-1 overflow-y-auto">
      <div className="sticky top-0 z-20 px-8 pt-5 pb-2 bg-white/95 backdrop-blur border-b">
        <ModuleHeader
          title="WTP Assessment"
          purpose="Climb the evidence ladder from 'interesting' to 'paid for a pilot' with a confirmed budget owner and a mapped procurement route."
          icon={<DollarSign size={22} />}
          action={<VentureSelector />}
        />
        <TabsList className="flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} data-testid={`tab-wtp-${t.value}`}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="p-8">
        <TabsContent value="overview" className="m-0"><OverviewTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="commitments" className="m-0"><CommitmentsTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="pricing" className="m-0"><PricingTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="budget" className="m-0"><BudgetTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="procurement" className="m-0"><ProcurementTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="objections" className="m-0"><ObjectionsTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="ladder" className="m-0"><LadderTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="scorecard" className="m-0"><ScorecardTab ventureId={ventureId} /></TabsContent>
        <TabsContent value="next" className="m-0"><NextActionTab ventureId={ventureId} /></TabsContent>
      </div>
    </Tabs>
  );
}

// ============================================================================
// TAB 1 — WTP OVERVIEW (+ stage gate, decision, warnings)
// ============================================================================
function OverviewTab({ ventureId }: { ventureId: string }) {
  const overview = trpc.wtp.overview.useQuery({ ventureId });
  const d = overview.data;

  if (overview.isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!d) return <EmptyState title="No data" description="Could not load the WTP overview." />;

  if (d.counts.tests === 0) {
    return (
      <EmptyState
        title="No commercial validation yet"
        description="Add your first WTP test to start measuring real buying commitment, not enthusiasm."
        icon={<DollarSign size={22} />}
      />
    );
  }

  const allWarnings = Array.from(new Set(d.scorecard.flatMap((s) => s.warnings)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScoreCard
          label="WTP Confidence"
          score={d.averageScore}
          band={asBand(d.interpretation)}
          interpretation={`${d.counts.tests} test${d.counts.tests > 1 ? "s" : ""} · highest evidence L${d.highestEvidenceLevel}`}
        />
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Venture WTP Status</span>
            <div className="mt-2"><ToneBadge band={asBand(d.ventureStatusBand)} /></div>
            <p className="text-xs text-gray-500 mt-3">{d.venture?.name} · stage {humanise(d.venture?.currentStage) || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Evidence Captured</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
              <span>Commitments</span><span className="font-semibold text-right">{d.counts.commitments}</span>
              <span>Pricing tests</span><span className="font-semibold text-right">{d.counts.pricingExperiments}</span>
              <span>Budget validations</span><span className="font-semibold text-right">{d.counts.budgetValidations}</span>
              <span>Procurement maps</span><span className="font-semibold text-right">{d.counts.procurementPathways}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeanDecisionPanel title="Commercial Decision" decisions={d.decisionRecommendation} />
        <StageGatePanel stageGate={d.stageGate} />
      </div>

      {allWarnings.length > 0 && (
        <Section title="WTP Warnings"><DecisionWarning messages={allWarnings} /></Section>
      )}
    </div>
  );
}

function StageGatePanel({ stageGate }: { stageGate: { ready: boolean; checklist: { label: string; passed: boolean }[] } }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Stage Gate · Commercial → MVP Validation</span>
          <ToneBadge band={{ label: stageGate.ready ? "Ready" : "Not ready", tone: stageGate.ready ? "green" : "amber" }} />
        </div>
        <ul className="space-y-2">
          {stageGate.checklist.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
              {c.passed
                ? <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                : <XCircle size={15} className="text-gray-300 shrink-0" />}
              {c.label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TAB 2 — CUSTOMER COMMITMENT LOG
// ============================================================================
function CommitmentsTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const list = trpc.wtp.commitments.list.useQuery({ ventureId });
  const tests = trpc.wtp.tests.list.useQuery({ ventureId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidate = () => { utils.wtp.commitments.list.invalidate(); utils.wtp.overview.invalidate(); };
  const upsert = trpc.wtp.commitments.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Commitment saved"); } });
  const del = trpc.wtp.commitments.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Commitment deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : { ventureId, commitmentType: "verbal_interest", status: "weak", commitmentCurrency: "GBP" });
    setOpen(true);
  };
  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <Section title="Customer Commitment Log" action={<Button size="sm" onClick={() => openForm()} style={{ background: GREEN }} data-testid="button-add-commitment"><Plus size={14} className="mr-1" />Log Commitment</Button>}>
        {rows.length > 0 ? (
          <DataTable
            cols={["Type", "Customer / description", "Value", "Date", "Strength", ""]}
            rows={rows.map((r) => ({
              key: r.id,
              cells: [
                <span className="font-medium text-gray-800">{humanise(r.commitmentType)}</span>,
                <span className="text-gray-600">{r.commitmentDescription || "—"}</span>,
                <span className="text-gray-600">{r.commitmentValue ? `${r.commitmentCurrency ?? ""} ${r.commitmentValue}` : "—"}</span>,
                <span className="text-gray-600">{r.commitmentDate || "—"}</span>,
                <ToneBadge band={asBand(commitmentStatusBand(r.status))} />,
              ],
              onEdit: () => openForm(r),
              onDelete: () => del.mutate({ id: r.id, ventureId }),
            }))}
          />
        ) : (
          <EmptyState icon={<Handshake size={22} />} title="No commitments logged"
            description="Track every escalation from verbal interest up to a purchase order."
            action={<Button size="sm" variant="outline" onClick={() => openForm()}>Log Commitment</Button>} />
        )}
      </Section>

      <FormModal open={open} onOpenChange={setOpen} title={form.id ? "Edit Commitment" : "Log Commitment"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, wtpTestId: form.wtpTestId ?? null })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Commitment type"><EnumSelect value={form.commitmentType} options={COMMITMENT_TYPES} onChange={(v) => setForm({ ...form, commitmentType: v })} /></Field>
          <Field label="Strength"><EnumSelect value={form.status} options={COMMITMENT_STATUSES} onChange={(v) => setForm({ ...form, status: v })} /></Field>
        </div>
        <Field label="Linked WTP test" hint="Optional — tie this commitment to a specific buyer test.">
          <Select value={form.wtpTestId ? String(form.wtpTestId) : "__none__"} onValueChange={(v) => setForm({ ...form, wtpTestId: v === "__none__" ? null : Number(v) })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {(tests.data ?? []).map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.customerName || t.organisation || `Test #${t.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description"><Textarea value={form.commitmentDescription ?? ""} onChange={(e) => setForm({ ...form, commitmentDescription: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Value"><Input value={form.commitmentValue ?? ""} onChange={(e) => setForm({ ...form, commitmentValue: e.target.value })} placeholder="e.g. 25,000" /></Field>
          <Field label="Currency"><Input value={form.commitmentCurrency ?? ""} onChange={(e) => setForm({ ...form, commitmentCurrency: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={form.commitmentDate ?? ""} onChange={(e) => setForm({ ...form, commitmentDate: e.target.value })} /></Field>
        </div>
        <Field label="Evidence reference" hint="Link or note proving this commitment (email, signed LOI, PO number)."><Input value={form.evidenceReference ?? ""} onChange={(e) => setForm({ ...form, evidenceReference: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

// ============================================================================
// TAB 3 — PRICING TEST
// ============================================================================
function PricingTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const list = trpc.wtp.pricingExperiments.list.useQuery({ ventureId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidate = () => { utils.wtp.pricingExperiments.list.invalidate(); utils.wtp.overview.invalidate(); };
  const upsert = trpc.wtp.pricingExperiments.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Pricing test saved"); } });
  const del = trpc.wtp.pricingExperiments.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Pricing test deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : { ventureId, pricingModel: "subscription", status: "proposed", currency: "GBP", testMethod: "pricing_interview", testSampleSize: 0, positiveResponses: 0, negativeResponses: 0 });
    setOpen(true);
  };
  const rows = list.data ?? [];
  const liveConv = useMemo(() => {
    const denom = Number(form.testSampleSize) || (Number(form.positiveResponses) || 0) + (Number(form.negativeResponses) || 0);
    return denom > 0 ? Math.round(((Number(form.positiveResponses) || 0) / denom) * 100) : 0;
  }, [form.testSampleSize, form.positiveResponses, form.negativeResponses]);

  return (
    <div className="space-y-4">
      <Section title="Pricing Tests" action={<Button size="sm" onClick={() => openForm()} style={{ background: GREEN }} data-testid="button-add-pricing"><Plus size={14} className="mr-1" />Add Pricing Test</Button>}>
        {rows.length > 0 ? (
          <DataTable
            cols={["Model", "Price", "Method", "Sample", "Conversion", "Status", ""]}
            rows={rows.map((r) => ({
              key: r.id,
              cells: [
                <span className="font-medium text-gray-800">{humanise(r.pricingModel)}</span>,
                <span className="text-gray-600">{r.pricePoint ? `${r.currency ?? ""} ${r.pricePoint}${r.billingPeriod ? ` / ${r.billingPeriod}` : ""}` : "—"}</span>,
                <span className="text-gray-600">{humanise(r.testMethod)}</span>,
                <span className="text-gray-600">{r.testSampleSize ?? 0}</span>,
                <span className="font-semibold text-gray-700">{r.conversionRate ?? 0}%</span>,
                <ToneBadge band={{ label: humanise(r.status), tone: r.status === "completed" ? "green" : r.status === "invalidated" ? "red" : "grey" }} />,
              ],
              onEdit: () => openForm(r),
              onDelete: () => del.mutate({ id: r.id, ventureId }),
            }))}
          />
        ) : (
          <EmptyState icon={<Tag size={22} />} title="No pricing tests"
            description="Test a real price point and model. Conversion = positive responses ÷ sample."
            action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add Pricing Test</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Pricing Test" : "Add Pricing Test"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, hypothesisId: form.hypothesisId ?? null, testSampleSize: Number(form.testSampleSize) || 0, positiveResponses: Number(form.positiveResponses) || 0, negativeResponses: Number(form.negativeResponses) || 0 })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pricing model"><EnumSelect value={form.pricingModel} options={WTP_PRICING_MODELS} onChange={(v) => setForm({ ...form, pricingModel: v })} /></Field>
          <Field label="Test method"><EnumSelect value={form.testMethod} options={WTP_TEST_METHODS} onChange={(v) => setForm({ ...form, testMethod: v })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Price point"><Input value={form.pricePoint ?? ""} onChange={(e) => setForm({ ...form, pricePoint: e.target.value })} placeholder="e.g. 1,200" /></Field>
          <Field label="Currency"><Input value={form.currency ?? ""} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
          <Field label="Billing period"><Input value={form.billingPeriod ?? ""} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })} placeholder="month / year" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target segment"><Input value={form.targetCustomerSegment ?? ""} onChange={(e) => setForm({ ...form, targetCustomerSegment: e.target.value })} /></Field>
          <Field label="Status"><EnumSelect value={form.status} options={PRICING_EXPERIMENT_STATUSES} onChange={(v) => setForm({ ...form, status: v })} /></Field>
        </div>
        <Field label="Value metric"><Input value={form.valueMetric ?? ""} onChange={(e) => setForm({ ...form, valueMetric: e.target.value })} placeholder="e.g. per tonne CO2 saved" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sample size"><Input type="number" value={form.testSampleSize ?? 0} onChange={(e) => setForm({ ...form, testSampleSize: e.target.value })} /></Field>
          <Field label="Positive responses"><Input type="number" value={form.positiveResponses ?? 0} onChange={(e) => setForm({ ...form, positiveResponses: e.target.value })} /></Field>
          <Field label="Negative responses"><Input type="number" value={form.negativeResponses ?? 0} onChange={(e) => setForm({ ...form, negativeResponses: e.target.value })} /></Field>
        </div>
        <div className="flex items-center justify-end gap-2 p-2.5 rounded-lg bg-gray-50">
          <span className="text-xs text-gray-500">Live conversion:</span>
          <span className="font-bold text-gray-700">{liveConv}%</span>
        </div>
        <Field label="Learning summary"><Textarea value={form.learningSummary ?? ""} onChange={(e) => setForm({ ...form, learningSummary: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recommended price range"><Input value={form.recommendedPriceRange ?? ""} onChange={(e) => setForm({ ...form, recommendedPriceRange: e.target.value })} /></Field>
          <Field label="Recommended next test"><Input value={form.recommendedNextTest ?? ""} onChange={(e) => setForm({ ...form, recommendedNextTest: e.target.value })} /></Field>
        </div>
      </FormModal>
    </div>
  );
}

// ============================================================================
// TAB 4 — BUDGET OWNER VALIDATION
// ============================================================================
function BudgetTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const list = trpc.wtp.budgetValidations.list.useQuery({ ventureId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidate = () => { utils.wtp.budgetValidations.list.invalidate(); utils.wtp.overview.invalidate(); };
  const upsert = trpc.wtp.budgetValidations.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Budget validation saved"); } });
  const del = trpc.wtp.budgetValidations.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Budget validation deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : { ventureId, validationStatus: "unknown", budgetOwnerKnown: false, approvalRequired: false });
    setOpen(true);
  };
  const rows = list.data ?? [];
  const statusTone = (s: string): Band["tone"] => s === "validated" ? "green" : s === "partially_validated" ? "amber" : s === "blocked" || s === "invalidated" ? "red" : "grey";

  return (
    <div className="space-y-4">
      <Section title="Budget Owner Validation" action={<Button size="sm" onClick={() => openForm()} style={{ background: GREEN }} data-testid="button-add-budget"><Plus size={14} className="mr-1" />Add Validation</Button>}>
        {rows.length > 0 ? (
          <DataTable
            cols={["Organisation", "Budget owner", "Category", "Cycle", "Status", ""]}
            rows={rows.map((r) => ({
              key: r.id,
              cells: [
                <span className="font-medium text-gray-800">{r.organisation || "—"}</span>,
                <span className="text-gray-600">{r.budgetOwnerKnown ? (r.budgetOwnerRole || "Known") : <span className="text-gray-400">Unknown</span>}</span>,
                <span className="text-gray-600">{humanise(r.budgetCategory)}</span>,
                <span className="text-gray-600">{r.budgetCycle || "—"}</span>,
                <ToneBadge band={{ label: humanise(r.validationStatus), tone: statusTone(r.validationStatus) }} />,
              ],
              onEdit: () => openForm(r),
              onDelete: () => del.mutate({ id: r.id, ventureId }),
            }))}
          />
        ) : (
          <EmptyState icon={<Wallet size={22} />} title="No budget validations"
            description="WTP is not validated until the economic buyer / budget owner is identified."
            action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add Validation</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Budget Validation" : "Add Budget Validation"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, wtpTestId: form.wtpTestId ?? null })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organisation"><Input value={form.organisation ?? ""} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></Field>
          <Field label="Validation status"><EnumSelect value={form.validationStatus} options={BUDGET_VALIDATION_STATUSES} onChange={(v) => setForm({ ...form, validationStatus: v })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SwitchRow label="Budget owner known" checked={!!form.budgetOwnerKnown} onChange={(c) => setForm({ ...form, budgetOwnerKnown: c })} />
          <SwitchRow label="Approval required" checked={!!form.approvalRequired} onChange={(c) => setForm({ ...form, approvalRequired: c })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget owner role"><Input value={form.budgetOwnerRole ?? ""} onChange={(e) => setForm({ ...form, budgetOwnerRole: e.target.value })} /></Field>
          <Field label="Budget category"><EnumSelect value={form.budgetCategory} options={BUDGET_CATEGORIES} allowEmpty onChange={(v) => setForm({ ...form, budgetCategory: v })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Budget cycle"><Input value={form.budgetCycle ?? ""} onChange={(e) => setForm({ ...form, budgetCycle: e.target.value })} placeholder="e.g. FY25 Q3" /></Field>
          <Field label="Current budget available"><Input value={form.currentBudgetAvailable ?? ""} onChange={(e) => setForm({ ...form, currentBudgetAvailable: e.target.value })} /></Field>
          <Field label="Estimated budget range"><Input value={form.estimatedBudgetRange ?? ""} onChange={(e) => setForm({ ...form, estimatedBudgetRange: e.target.value })} /></Field>
        </div>
        <Field label="Approval stakeholders"><Textarea value={form.approvalStakeholders ?? ""} onChange={(e) => setForm({ ...form, approvalStakeholders: e.target.value })} /></Field>
        <Field label="Financial decision criteria"><Textarea value={form.financialDecisionCriteria ?? ""} onChange={(e) => setForm({ ...form, financialDecisionCriteria: e.target.value })} /></Field>
        <Field label="Notes"><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

// ============================================================================
// TAB 5 — PROCUREMENT PATHWAY
// ============================================================================
function ProcurementTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const list = trpc.wtp.procurementPathways.list.useQuery({ ventureId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidate = () => { utils.wtp.procurementPathways.list.invalidate(); utils.wtp.overview.invalidate(); };
  const upsert = trpc.wtp.procurementPathways.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("Procurement pathway saved"); } });
  const del = trpc.wtp.procurementPathways.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("Procurement pathway deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : { ventureId, procurementRoute: "unknown", status: "unknown", procurementComplexityScore: 1, expectedSalesCycleDays: 0, legalReviewRequired: false, dataSecurityReviewRequired: false, pilotPossibleWithoutFullProcurement: false });
    setOpen(true);
  };
  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <Section title="Procurement Pathways" action={<Button size="sm" onClick={() => openForm()} style={{ background: GREEN }} data-testid="button-add-procurement"><Plus size={14} className="mr-1" />Map Pathway</Button>}>
        {rows.length > 0 ? (
          <DataTable
            cols={["Organisation", "Route", "Sales cycle", "Friction", "Status", ""]}
            rows={rows.map((r) => {
              const friction = interpretProcurementFriction(r.frictionScore ?? 0);
              return {
                key: r.id,
                cells: [
                  <span className="font-medium text-gray-800">{r.organisation || "—"}</span>,
                  <span className="text-gray-600">{humanise(r.procurementRoute)}</span>,
                  <span className="text-gray-600">{r.expectedSalesCycleDays ? `${r.expectedSalesCycleDays}d` : "—"}</span>,
                  <div className="flex items-center gap-2"><span className="font-semibold text-gray-700">{r.frictionScore ?? 0}</span><ToneBadge band={asBand(friction)} /></div>,
                  <ToneBadge band={{ label: humanise(r.status), tone: r.status === "validated" || r.status === "feasible" ? "green" : r.status === "blocked" ? "red" : r.status === "high_friction" ? "amber" : "grey" }} />,
                ],
                onEdit: () => openForm(r),
                onDelete: () => del.mutate({ id: r.id, ventureId }),
              };
            })}
          />
        ) : (
          <EmptyState icon={<FileCheck size={22} />} title="No procurement pathways"
            description="Adoption can be blocked even when buyer interest is high. Map the buying process."
            action={<Button size="sm" variant="outline" onClick={() => openForm()}>Map Pathway</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit Procurement Pathway" : "Map Procurement Pathway"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, wtpTestId: form.wtpTestId ?? null, procurementComplexityScore: Number(form.procurementComplexityScore) || 1, expectedSalesCycleDays: Number(form.expectedSalesCycleDays) || 0 })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organisation"><Input value={form.organisation ?? ""} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></Field>
          <Field label="Procurement route"><EnumSelect value={form.procurementRoute} options={PROCUREMENT_ROUTES} onChange={(v) => setForm({ ...form, procurementRoute: v })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Complexity (1–5)"><Input type="number" min={1} max={5} value={form.procurementComplexityScore ?? 1} onChange={(e) => setForm({ ...form, procurementComplexityScore: e.target.value })} /></Field>
          <Field label="Sales cycle (days)"><Input type="number" value={form.expectedSalesCycleDays ?? 0} onChange={(e) => setForm({ ...form, expectedSalesCycleDays: e.target.value })} /></Field>
          <Field label="Status"><EnumSelect value={form.status} options={PROCUREMENT_STATUSES} onChange={(v) => setForm({ ...form, status: v })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SwitchRow label="Legal review" checked={!!form.legalReviewRequired} onChange={(c) => setForm({ ...form, legalReviewRequired: c })} />
          <SwitchRow label="Data/security review" checked={!!form.dataSecurityReviewRequired} onChange={(c) => setForm({ ...form, dataSecurityReviewRequired: c })} />
          <SwitchRow label="Pilot w/o full procurement" checked={!!form.pilotPossibleWithoutFullProcurement} onChange={(c) => setForm({ ...form, pilotPossibleWithoutFullProcurement: c })} />
        </div>
        <Field label="Required documents"><Textarea value={form.requiredDocuments ?? ""} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} /></Field>
        <Field label="Compliance requirements"><Textarea value={form.complianceRequirements ?? ""} onChange={(e) => setForm({ ...form, complianceRequirements: e.target.value })} /></Field>
        <Field label="Procurement risks"><Textarea value={form.procurementRisks ?? ""} onChange={(e) => setForm({ ...form, procurementRisks: e.target.value })} /></Field>
        <Field label="Next procurement step"><Input value={form.nextProcurementStep ?? ""} onChange={(e) => setForm({ ...form, nextProcurementStep: e.target.value })} /></Field>
      </FormModal>
    </div>
  );
}

// ============================================================================
// TAB 6 — COMMERCIAL OBJECTIONS (aggregate, read-only from WTP tests)
// ============================================================================
function ObjectionsTab({ ventureId }: { ventureId: string }) {
  const objections = trpc.wtp.objections.useQuery({ ventureId });
  const rows = objections.data ?? [];

  if (objections.isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (rows.length === 0) {
    return (
      <EmptyState icon={<MessageSquareWarning size={22} />} title="No objections captured"
        description="Add an objection category to a WTP test to surface commercial blockers here." />
    );
  }

  return (
    <Section title="Commercial Objections">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((o) => (
          <Card key={o.category} className="border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <IconCircle icon={<MessageSquareWarning size={16} />} />
                  <span className="text-sm font-semibold text-gray-800">{humanise(o.category)}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.count}×</span>
              </div>
              {o.examples.length > 0 && (
                <ul className="space-y-1.5 mt-2">
                  {o.examples.map((ex, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />{ex}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// TAB 7 — WTP EVIDENCE LADDER (reference)
// ============================================================================
function LadderTab({ ventureId }: { ventureId: string }) {
  const overview = trpc.wtp.overview.useQuery({ ventureId });
  const highest = overview.data?.highestEvidenceLevel ?? 0;
  const strengthTone: Record<string, Band["tone"]> = { weak: "red", moderate: "amber", strong: "green", very_strong: "green" };

  return (
    <Section title="WTP Evidence Ladder">
      <p className="text-sm text-gray-500 mb-4 max-w-2xl">
        Climb from polite interest to a paid pilot. Levels 1–2 are <strong>not</strong> WTP validation — only money, a confirmed budget owner and a real commitment count.
      </p>
      <div className="space-y-2">
        {[...WTP_EVIDENCE_LADDER].reverse().map((rung) => {
          const reached = rung.level <= highest;
          return (
            <Card key={rung.level} className="border shadow-sm" style={reached ? { borderColor: "rgba(86,168,55,0.5)", background: "rgba(86,168,55,0.04)" } : undefined}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: reached ? GREEN : "rgba(107,114,128,0.1)", color: reached ? "white" : "#9ca3af" }}>
                    {rung.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{rung.label}</span>
                      <ToneBadge band={{ label: humanise(rung.strength), tone: strengthTone[rung.strength] ?? "grey" }} />
                      {reached && <span className="text-[10px] font-bold text-green-700">✓ reached</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <p className="text-xs text-gray-600"><span className="font-semibold text-green-700">Proves:</span> {rung.proves}</p>
                      <p className="text-xs text-gray-600"><span className="font-semibold text-red-700">Does not prove:</span> {rung.doesNotProve}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

// ============================================================================
// TAB 8 — WTP SCORECARD (per-test + full CRUD on wtp_tests)
// ============================================================================
function ScorecardTab({ ventureId }: { ventureId: string }) {
  const utils = trpc.useUtils();
  const overview = trpc.wtp.overview.useQuery({ ventureId });
  const tests = trpc.wtp.tests.list.useQuery({ ventureId });
  const hypotheses = trpc.discoveryMarket.hypotheses.list.useQuery({ ventureId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidate = () => {
    utils.wtp.overview.invalidate(); utils.wtp.tests.list.invalidate();
    utils.wtp.objections.invalidate(); utils.discoveryMarket.risks.list.invalidate();
  };
  const upsert = trpc.wtp.tests.upsert.useMutation({ onSuccess: () => { invalidate(); setOpen(false); toast.success("WTP test saved — risks & alerts updated"); } });
  const del = trpc.wtp.tests.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("WTP test deleted"); } });

  const openForm = (row?: any) => {
    setForm(row ? { ...row } : {
      ventureId, customerName: "", evidenceLevel: 1, budgetOwnerStatus: "unknown",
      pricingResponse: "none", procurementPathwayStatus: "unknown", status: "planned", economicBuyer: false,
    });
    setOpen(true);
  };

  const cards = overview.data?.scorecard ?? [];
  const liveScore = calculateWTPScore({
    evidenceLevel: form.evidenceLevel ?? 1,
    budgetOwnerStatus: form.budgetOwnerStatus,
    procurementPathwayStatus: form.procurementPathwayStatus,
    pricingResponse: form.pricingResponse,
  });

  return (
    <div className="space-y-4">
      <Section title="WTP Scorecard" action={<Button size="sm" onClick={() => openForm()} style={{ background: GREEN }} data-testid="button-add-wtp"><Plus size={14} className="mr-1" />Add WTP Test</Button>}>
        {cards.length > 0 ? (
          <div className="space-y-3">
            {cards.map((c) => (
              <Card key={c.id} className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <IconCircle icon={<Gauge size={16} />} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{c.customerName || c.organisation || `Test #${c.id}`}</span>
                          <ToneBadge band={asBand(c.interpretation)} />
                          <span className="text-xs text-gray-400">L{c.evidenceLevel} · {humanise(c.status)}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <Component label="Evidence ×50%" value={c.components.evidence} />
                          <Component label="Budget ×20%" value={c.components.budgetOwner} />
                          <Component label="Procurement ×15%" value={c.components.procurement} />
                          <Component label="Pricing ×15%" value={c.components.pricingResponse} />
                        </div>
                        {c.warnings.length > 0 && <div className="mt-3"><DecisionWarning messages={c.warnings} /></div>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold" style={{ color: TONE_FG[asBand(c.interpretation).tone] }}>{c.wtpScore}</div>
                      <div className="text-[10px] text-gray-400">/ 100</div>
                      <div className="mt-2 flex gap-1 justify-end">
                        <button
                          disabled={!tests.data}
                          onClick={() => {
                            const row = (tests.data ?? []).find((x) => x.id === c.id);
                            if (!row) { toast.error("Could not load this test for editing — try again."); return; }
                            openForm(row);
                          }}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                        ><Pencil size={13} /></button>
                        <button onClick={() => del.mutate({ id: c.id, ventureId })} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Gauge size={22} />} title="No WTP tests"
            description="WTP Score = Evidence×50% + Budget×20% + Procurement×15% + Pricing×15%."
            action={<Button size="sm" variant="outline" onClick={() => openForm()}>Add WTP Test</Button>} />
        )}
      </Section>

      <FormModal wide open={open} onOpenChange={setOpen} title={form.id ? "Edit WTP Test" : "Add WTP Test"} submitting={upsert.isPending}
        onSubmit={() => upsert.mutate({ ...form, problemHypothesisId: form.problemHypothesisId ?? null, customerSegmentId: form.customerSegmentId ?? null, evidenceLevel: Number(form.evidenceLevel) || 1 })}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer name"><Input value={form.customerName ?? ""} onChange={(e) => setForm({ ...form, customerName: e.target.value })} data-testid="input-wtp-customer" /></Field>
          <Field label="Organisation"><Input value={form.organisation ?? ""} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></Field>
          <Field label="Contact role"><Input value={form.contactRole ?? ""} onChange={(e) => setForm({ ...form, contactRole: e.target.value })} /></Field>
          <Field label="Buyer role"><Input value={form.buyerRole ?? ""} onChange={(e) => setForm({ ...form, buyerRole: e.target.value })} /></Field>
        </div>
        <Field label="Linked hypothesis" hint="Optional — connect this buyer test to a problem hypothesis.">
          <Select value={form.problemHypothesisId ? String(form.problemHypothesisId) : "__none__"} onValueChange={(v) => setForm({ ...form, problemHypothesisId: v === "__none__" ? null : Number(v) })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {(hypotheses.data ?? []).map((h: any) => <SelectItem key={h.id} value={String(h.id)}>{(h.hypothesisStatement ?? "").slice(0, 60) || `Hypothesis #${h.id}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Evidence level (WTP ladder)">
          <Select value={String(form.evidenceLevel ?? 1)} onValueChange={(val) => setForm({ ...form, evidenceLevel: Number(val) })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{WTP_EVIDENCE_LADDER.map((l) => <SelectItem key={l.level} value={String(l.level)}>L{l.level} — {l.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Budget owner status"><EnumSelect value={form.budgetOwnerStatus} options={BUDGET_OWNER_STATUSES} onChange={(v) => setForm({ ...form, budgetOwnerStatus: v })} /></Field>
          <Field label="Pricing response"><EnumSelect value={form.pricingResponse} options={PRICING_RESPONSES} onChange={(v) => setForm({ ...form, pricingResponse: v })} /></Field>
          <Field label="Procurement status"><EnumSelect value={form.procurementPathwayStatus} options={PROCUREMENT_STATUSES} onChange={(v) => setForm({ ...form, procurementPathwayStatus: v })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget owner name"><Input value={form.budgetOwnerName ?? ""} onChange={(e) => setForm({ ...form, budgetOwnerName: e.target.value })} /></Field>
          <Field label="Budget owner role"><Input value={form.budgetOwnerRole ?? ""} onChange={(e) => setForm({ ...form, budgetOwnerRole: e.target.value })} /></Field>
        </div>
        <SwitchRow label="Economic buyer (controls the budget)" checked={!!form.economicBuyer} onChange={(c) => setForm({ ...form, economicBuyer: c })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pricing model tested"><EnumSelect value={form.pricingModelTested} options={WTP_PRICING_MODELS} allowEmpty onChange={(v) => setForm({ ...form, pricingModelTested: v })} /></Field>
          <Field label="Price tested"><Input value={form.priceTested ?? ""} onChange={(e) => setForm({ ...form, priceTested: e.target.value })} /></Field>
          <Field label="Current spend"><Input value={form.currentSpend ?? ""} onChange={(e) => setForm({ ...form, currentSpend: e.target.value })} /></Field>
          <Field label="Test method"><EnumSelect value={form.testMethod} options={WTP_TEST_METHODS} onChange={(v) => setForm({ ...form, testMethod: v })} /></Field>
        </div>
        <Field label="Value driver"><Textarea value={form.valueDriver ?? ""} onChange={(e) => setForm({ ...form, valueDriver: e.target.value })} /></Field>
        <Field label="Response summary"><Textarea value={form.responseSummary ?? ""} onChange={(e) => setForm({ ...form, responseSummary: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Objection category"><EnumSelect value={form.objectionCategory} options={WTP_OBJECTION_CATEGORIES} allowEmpty onChange={(v) => setForm({ ...form, objectionCategory: v })} /></Field>
          <Field label="Recommended pricing model"><EnumSelect value={form.recommendedPricingModel} options={WTP_PRICING_MODELS} allowEmpty onChange={(v) => setForm({ ...form, recommendedPricingModel: v })} /></Field>
        </div>
        <Field label="Objections"><Textarea value={form.objections ?? ""} onChange={(e) => setForm({ ...form, objections: e.target.value })} /></Field>
        <Field label="Procurement notes"><Textarea value={form.procurementPathwayNotes ?? ""} onChange={(e) => setForm({ ...form, procurementPathwayNotes: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Next commercial action"><Input value={form.nextCommercialAction ?? ""} onChange={(e) => setForm({ ...form, nextCommercialAction: e.target.value })} /></Field>
          <Field label="Next action due date"><Input type="date" value={form.nextActionDueDate ?? ""} onChange={(e) => setForm({ ...form, nextActionDueDate: e.target.value })} /></Field>
        </div>
        <Field label="Status"><EnumSelect value={form.status} options={WTP_TEST_STATUSES} onChange={(v) => setForm({ ...form, status: v })} /></Field>
        <div className="flex items-center justify-end gap-2 p-2.5 rounded-lg bg-gray-50">
          <span className="text-xs text-gray-500">Live WTP score:</span>
          <span className="font-bold text-gray-700">{liveScore}</span>
          <ToneBadge band={asBand(interpretWTPScore(liveScore))} />
        </div>
      </FormModal>
    </div>
  );
}

const TONE_FG: Record<Band["tone"], string> = { green: "#15803d", amber: "#b45309", red: "#b91c1c", grey: "#4b5563" };

function Component({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className="text-lg font-bold text-gray-700">{value}</div>
    </div>
  );
}

// ============================================================================
// TAB 9 — NEXT COMMERCIAL ACTION
// ============================================================================
function NextActionTab({ ventureId }: { ventureId: string }) {
  const overview = trpc.wtp.overview.useQuery({ ventureId });
  const actions = overview.data?.nextActions ?? [];

  if (overview.isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (actions.length === 0) {
    return (
      <EmptyState icon={<ArrowRightCircle size={22} />} title="No commercial actions queued"
        description="Add a next commercial action to a WTP test to build the commercial action queue." />
    );
  }

  return (
    <Section title="Next Commercial Action Queue">
      <div className="space-y-2">
        {actions.map((a) => (
          <Card key={a.id} className="border shadow-sm" style={a.overdue ? { borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.03)" } : undefined}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <IconCircle icon={a.overdue ? <AlertTriangle size={16} /> : <Clock size={16} />} tone={a.overdue ? "#b91c1c" : GREEN} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.customerName || a.organisation || `Test #${a.id}`} · WTP {a.wtpScore}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {a.dueDate && <p className="text-xs text-gray-500">{a.dueDate}</p>}
                  {a.overdue && <ToneBadge band={{ label: "Overdue", tone: "red" }} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// Shared table primitive
// ============================================================================
function DataTable({ cols, rows }: {
  cols: string[];
  rows: { key: number | string; cells: React.ReactNode[]; onEdit?: () => void; onDelete?: () => void }[];
}) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
              {cols.map((c, i) => <th key={i} className="px-4 py-2.5 font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0 hover:bg-gray-50">
                {r.cells.map((cell, i) => <td key={i} className="px-4 py-2.5">{cell}</td>)}
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  {r.onEdit && <button onClick={r.onEdit} className="text-gray-400 hover:text-gray-700 mr-2"><Pencil size={13} /></button>}
                  {r.onDelete && <button onClick={r.onDelete} className="text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
