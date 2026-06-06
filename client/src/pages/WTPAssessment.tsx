/**
 * WTP Assessment — Commercial Validation Layer
 * 9 tabs: Overview | Commitment Log | Pricing Test | Budget Owner | Procurement | Objections | Evidence Ladder | Scorecard | Next Action
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle2, TrendingUp, Users, ShieldAlert, AlertTriangle,
  Layers, BarChart3, ArrowRight, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Lock, Unlock, Star, Target, FileText, Building2, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",       label: "Overview",        icon: BarChart3 },
  { id: "commitments",    label: "Commitment Log",  icon: CheckCircle2 },
  { id: "pricing",        label: "Pricing Test",    icon: TrendingUp },
  { id: "budget",         label: "Budget Owner",    icon: Building2 },
  { id: "procurement",    label: "Procurement",     icon: FileText },
  { id: "objections",     label: "Objections",      icon: ShieldAlert },
  { id: "ladder",         label: "Evidence Ladder", icon: Layers },
  { id: "scorecard",      label: "Scorecard",       icon: Star },
  { id: "nextaction",     label: "Next Action",     icon: ArrowRight },
];

const EVIDENCE_LEVELS = [
  { value: "1", label: "L1 — Customer says 'interesting'" },
  { value: "2", label: "L2 — Customer agrees to another meeting" },
  { value: "3", label: "L3 — Customer shares internal data" },
  { value: "4", label: "L4 — Customer introduces budget holder" },
  { value: "5", label: "L5 — Customer requests a proposal" },
  { value: "6", label: "L6 — Customer signs LOI / pilot agreement" },
  { value: "7", label: "L7 — Customer pays for pilot / PO" },
];

const PRICING_MODELS = [
  "paid_pilot", "subscription", "licence", "consultancy_plus_platform",
  "product_sales", "service_fee", "success_fee", "data_partnership",
  "co_development", "venture_studio_equity", "transaction_fee",
];

const COMMITMENT_TYPES = [
  "verbal_interest", "follow_up_meeting", "data_sharing", "budget_holder_intro",
  "proposal_request", "loi_signed", "pilot_agreed", "paid_pilot",
  "purchase_order", "co_development_agreement", "partnership_mou",
];

const OBJECTION_CATEGORIES = [
  "price_too_high", "unclear_roi", "no_budget", "wrong_budget_cycle",
  "procurement_barrier", "trust_barrier", "insufficient_proof", "switching_cost",
  "data_sharing_concern", "not_priority", "competitor_preferred", "timing_issue",
];

const PROCUREMENT_ROUTES = [
  "direct_purchase", "innovation_pilot", "framework_agreement", "tender",
  "supplier_onboarding", "partner_channel", "university_or_research_route",
  "internal_sponsor", "unknown",
];

const STATUS_COLORS: Record<string, string> = {
  validated: "#22c55e", strong: "#3b82f6", emerging: "#f59e0b",
  weak: "#ef4444", not_tested: "#6b7280",
};

const SCORE_COLORS = (s: number) =>
  s >= 80 ? "#22c55e" : s >= 60 ? "#3b82f6" : s >= 40 ? "#f59e0b" : "#ef4444";

function ScoreBadge({ score }: { score: number }) {
  const color = SCORE_COLORS(score);
  return (
    <span
      className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-sm"
      style={{ background: color }}
    >
      {score}
    </span>
  );
}

function EvidencePill({ level }: { level: number }) {
  const colors = ["", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#16a34a"];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-xs font-semibold"
      style={{ background: colors[level] ?? "#6b7280" }}
    >
      L{level}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WTPAssessment() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVentureId, setSelectedVentureId] = useState<string>("");
  const [showNewTestForm, setShowNewTestForm] = useState(false);
  const [showNewCommitForm, setShowNewCommitForm] = useState(false);
  const [showNewPricingForm, setShowNewPricingForm] = useState(false);
  const [showNewBudgetForm, setShowNewBudgetForm] = useState(false);
  const [showNewProcurementForm, setShowNewProcurementForm] = useState(false);

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: ventures = [] } = trpc.ventures.list.useQuery();
  const { data: evidenceLadder = [] } = trpc.wtpAssessment.getEvidenceLadder.useQuery();
  const { data: wtpTests = [], refetch: refetchTests } = trpc.wtpAssessment.listWTPTests.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: overview, refetch: refetchOverview } = trpc.wtpAssessment.getVentureWTPOverview.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );
  const { data: commitments = [], refetch: refetchCommitments } = trpc.wtpAssessment.listCommitments.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: pricingExps = [], refetch: refetchPricing } = trpc.wtpAssessment.listPricingExperiments.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: budgetValidations = [], refetch: refetchBudget } = trpc.wtpAssessment.listBudgetValidations.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: procurement = [], refetch: refetchProcurement } = trpc.wtpAssessment.listProcurementPathways.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: objections, refetch: refetchObjections } = trpc.wtpAssessment.getObjectionSummary.useQuery(
    { ventureId: selectedVentureId || undefined },
    { enabled: true }
  );
  const { data: scorecard, refetch: refetchScorecard } = trpc.wtpAssessment.getWTPScorecard.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );

  const refetchAll = () => {
    refetchTests(); refetchOverview(); refetchCommitments();
    refetchPricing(); refetchBudget(); refetchProcurement();
    refetchObjections(); refetchScorecard();
  };

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createTest = trpc.wtpAssessment.createWTPTest.useMutation({
    onSuccess: () => { toast.success("WTP test created"); setShowNewTestForm(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTest = trpc.wtpAssessment.deleteWTPTest.useMutation({
    onSuccess: () => { toast.success("Test deleted"); refetchAll(); },
  });
  const createCommitment = trpc.wtpAssessment.createCommitment.useMutation({
    onSuccess: () => { toast.success("Commitment logged"); setShowNewCommitForm(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCommitment = trpc.wtpAssessment.deleteCommitment.useMutation({
    onSuccess: () => { toast.success("Commitment deleted"); refetchAll(); },
  });
  const createPricing = trpc.wtpAssessment.createPricingExperiment.useMutation({
    onSuccess: () => { toast.success("Pricing experiment created"); setShowNewPricingForm(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePricing = trpc.wtpAssessment.deletePricingExperiment.useMutation({
    onSuccess: () => { toast.success("Experiment deleted"); refetchAll(); },
  });
  const createBudget = trpc.wtpAssessment.createBudgetValidation.useMutation({
    onSuccess: () => { toast.success("Budget validation added"); setShowNewBudgetForm(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });
  const createProcurement = trpc.wtpAssessment.createProcurementPathway.useMutation({
    onSuccess: () => { toast.success("Procurement pathway mapped"); setShowNewProcurementForm(false); refetchAll(); },
    onError: (e) => toast.error(e.message),
  });

  // ── New WTP Test form state ──────────────────────────────────────────────────
  const [testForm, setTestForm] = useState({
    customerName: "", organisation: "", contactRole: "", buyerRole: "",
    budgetOwnerConfirmed: "unknown" as "confirmed" | "partially_known" | "unknown",
    budgetOwnerName: "", budgetOwnerRole: "",
    currentSpend: "", valueDriver: "",
    pricingModelTested: "paid_pilot", priceTested: "", pricePeriod: "annually",
    testMethod: "pricing_interview",
    responseSummary: "", evidenceLevel: "1",
    pricingResponse: "needs_roi_proof" as "accepted" | "negotiating" | "needs_roi_proof" | "price_resistance" | "rejected",
    procurementPathwayStatus: "unknown", procurementPathwayNotes: "",
    objections: "", objectionCategory: "",
    nextCommercialAction: "", nextActionDueDate: "", status: "planned",
  });

  const [commitForm, setCommitForm] = useState({
    commitmentType: "verbal_interest", commitmentDescription: "",
    commitmentValue: "", commitmentCurrency: "GBP", commitmentDate: "",
    evidenceReference: "", status: "weak" as "weak" | "moderate" | "strong" | "confirmed" | "withdrawn",
  });

  const [pricingForm, setPricingForm] = useState({
    pricingModel: "subscription", pricePoint: "", currency: "GBP",
    billingPeriod: "annually", targetCustomerSegment: "", valueMetric: "",
    buyingTrigger: "", currentSpendReplaced: "", costReduced: "",
    riskRemoved: "", outcomeImproved: "",
    testMethod: "pricing_interview", testSampleSize: "0",
    positiveResponses: "0", negativeResponses: "0",
    learningSummary: "", recommendedPriceRange: "", recommendedNextTest: "",
    status: "proposed" as "proposed" | "running" | "completed" | "inconclusive" | "invalidated",
  });

  const [budgetForm, setBudgetForm] = useState({
    organisation: "", budgetOwnerKnown: false, budgetOwnerRole: "",
    budgetCategory: "innovation", budgetCycle: "annually",
    currentBudgetAvailable: "", estimatedBudgetRange: "",
    approvalRequired: true, approvalStakeholders: "",
    financialDecisionCriteria: "", notes: "",
    validationStatus: "unknown" as "unknown" | "partially_validated" | "validated" | "blocked" | "invalidated",
  });

  const [procurementForm, setProcurementForm] = useState({
    organisation: "", procurementRoute: "unknown",
    procurementComplexityScore: "3", expectedSalesCycleDays: "90",
    requiredDocuments: "", complianceRequirements: "",
    legalReviewRequired: false, dataSecurityReviewRequired: false,
    pilotPossibleWithoutFullProcurement: true,
    procurementRisks: "", nextProcurementStep: "",
    status: "unknown" as "unknown" | "mapped" | "blocked" | "feasible" | "high_friction" | "validated",
  });

  const selectedVenture = ventures.find(v => v.id === selectedVentureId);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI row */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "WTP Score", value: overview.avgScore, suffix: "/100", color: SCORE_COLORS(overview.avgScore) },
            { label: "Evidence Level", value: `L${overview.highestEvidenceLevel}`, suffix: " (highest)", color: "#3b82f6" },
            { label: "Commitments", value: overview.totalCommitments, suffix: " logged", color: "#8b5cf6" },
            { label: "LOIs / Paid Pilots", value: overview.loisSigned + overview.paidPilots, suffix: " confirmed", color: "#22c55e" },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{k.label}</p>
              <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}<span className="text-xs text-gray-400 font-normal">{k.suffix}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Status + Recommendation */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-700 mb-3">WTP Status</h3>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-semibold capitalize"
                style={{ background: STATUS_COLORS[overview.wtpStatus] ?? "#6b7280" }}
              >
                {overview.wtpStatus.replace("_", " ")}
              </span>
              <ScoreBadge score={overview.avgScore} />
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Tests run: <strong>{overview.totalTests}</strong></p>
              <p>Budget owners confirmed: <strong>{overview.budgetOwnersConfirmed}</strong></p>
              <p>Proposals requested: <strong>{overview.proposalsRequested}</strong></p>
              {overview.mainObjection && <p>Main objection: <strong className="text-red-500">{overview.mainObjection.replace(/_/g, " ")}</strong></p>}
            </div>
          </div>
          {overview.recommendation && (
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Decision Recommendation</h3>
              <p className="text-sm font-semibold text-gray-800 mb-1">{overview.recommendation.label}</p>
              <p className="text-xs text-gray-500 mb-3">{overview.recommendation.description}</p>
              {overview.recommendation.warnings.length > 0 && (
                <div className="space-y-1">
                  {overview.recommendation.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WTP Tests table */}
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700">WTP Test Log</h3>
          <Button size="sm" onClick={() => setShowNewTestForm(v => !v)} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
            <Plus size={13} /> New Test
          </Button>
        </div>

        {showNewTestForm && (
          <div className="p-5 border-b bg-gray-50 space-y-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Customer Name</label>
                <Input placeholder="Jane Smith" value={testForm.customerName} onChange={e => setTestForm(f => ({ ...f, customerName: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Organisation</label>
                <Input placeholder="Acme Corp" value={testForm.organisation} onChange={e => setTestForm(f => ({ ...f, organisation: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Role</label>
                <Input placeholder="Head of Operations" value={testForm.contactRole} onChange={e => setTestForm(f => ({ ...f, contactRole: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Level</label>
                <Select value={testForm.evidenceLevel} onValueChange={v => setTestForm(f => ({ ...f, evidenceLevel: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVIDENCE_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Pricing Response</label>
                <Select value={testForm.pricingResponse} onValueChange={v => setTestForm(f => ({ ...f, pricingResponse: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["accepted", "negotiating", "needs_roi_proof", "price_resistance", "rejected"].map(r => (
                      <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget Owner</label>
                <Select value={testForm.budgetOwnerConfirmed} onValueChange={v => setTestForm(f => ({ ...f, budgetOwnerConfirmed: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="partially_known">Partially Known</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Procurement Status</label>
                <Select value={testForm.procurementPathwayStatus} onValueChange={v => setTestForm(f => ({ ...f, procurementPathwayStatus: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unknown", "mapped", "blocked", "feasible", "high_friction", "validated"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Pricing Model Tested</label>
                <Select value={testForm.pricingModelTested} onValueChange={v => setTestForm(f => ({ ...f, pricingModelTested: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_MODELS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Price Tested (£)</label>
                <Input type="number" placeholder="5000" value={testForm.priceTested} onChange={e => setTestForm(f => ({ ...f, priceTested: e.target.value }))} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Response Summary</label>
              <Textarea placeholder="Describe the customer's response to the pricing conversation..." value={testForm.responseSummary} onChange={e => setTestForm(f => ({ ...f, responseSummary: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Objection Category</label>
                <Select value={testForm.objectionCategory} onValueChange={v => setTestForm(f => ({ ...f, objectionCategory: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select if applicable" /></SelectTrigger>
                  <SelectContent>{OBJECTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Next Commercial Action</label>
                <Input placeholder="Send proposal by..." value={testForm.nextCommercialAction} onChange={e => setTestForm(f => ({ ...f, nextCommercialAction: e.target.value }))} className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => {
                if (!selectedVentureId) { toast.error("Select a venture first"); return; }
                createTest.mutate({
                  ventureId: selectedVentureId,
                  customerName: testForm.customerName || undefined,
                  organisation: testForm.organisation || undefined,
                  contactRole: testForm.contactRole || undefined,
                  budgetOwnerConfirmed: testForm.budgetOwnerConfirmed,
                  pricingModelTested: testForm.pricingModelTested,
                  priceTested: testForm.priceTested ? parseFloat(testForm.priceTested) : undefined,
                  testMethod: testForm.testMethod as any,
                  responseSummary: testForm.responseSummary || undefined,
                  evidenceLevel: parseInt(testForm.evidenceLevel),
                  pricingResponse: testForm.pricingResponse,
                  procurementPathwayStatus: testForm.procurementPathwayStatus,
                  objectionCategory: testForm.objectionCategory || undefined,
                  nextCommercialAction: testForm.nextCommercialAction || undefined,
                  status: testForm.status as any,
                });
              }} disabled={createTest.isPending} style={{ background: "#22c55e" }}>
                {createTest.isPending ? "Saving..." : "Save Test"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewTestForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {wtpTests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No WTP tests recorded yet. Click "New Test" to begin commercial validation.</p>
          ) : (
            (wtpTests as any[]).map(t => (
              <div key={t.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <EvidencePill level={t.evidence_level ?? 1} />
                    <span className="text-sm font-semibold text-gray-800">{t.customer_name ?? "Unknown customer"}</span>
                    {t.organisation && <span className="text-xs text-gray-400">· {t.organisation}</span>}
                    <span className="text-xs text-gray-400">· {t.contact_role}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{t.response_summary ?? "No response summary"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {t.pricing_model_tested && <Badge variant="outline" className="text-xs">{t.pricing_model_tested.replace(/_/g, " ")}</Badge>}
                    {t.price_tested && <Badge variant="outline" className="text-xs">£{Number(t.price_tested).toLocaleString()}</Badge>}
                    {t.pricing_response && <Badge variant="outline" className="text-xs" style={{ color: t.pricing_response === "accepted" ? "#22c55e" : t.pricing_response === "rejected" ? "#ef4444" : "#f59e0b" }}>{t.pricing_response.replace(/_/g, " ")}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ScoreBadge score={Number(t.wtp_score) || 0} />
                  <Button size="sm" variant="outline" onClick={() => deleteTest.mutate({ id: t.id })} className="text-red-400 border-red-200 hover:bg-red-50 px-2">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderCommitments = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700">Commitment Log</h3>
          <Button size="sm" onClick={() => setShowNewCommitForm(v => !v)} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
            <Plus size={13} /> Log Commitment
          </Button>
        </div>

        {showNewCommitForm && (
          <div className="p-5 border-b bg-gray-50 space-y-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Commitment Type</label>
                <Select value={commitForm.commitmentType} onValueChange={v => setCommitForm(f => ({ ...f, commitmentType: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{COMMITMENT_TYPES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={commitForm.status} onValueChange={v => setCommitForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["weak", "moderate", "strong", "confirmed", "withdrawn"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Value (£)</label>
                <Input type="number" placeholder="10000" value={commitForm.commitmentValue} onChange={e => setCommitForm(f => ({ ...f, commitmentValue: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
                <Input type="date" value={commitForm.commitmentDate} onChange={e => setCommitForm(f => ({ ...f, commitmentDate: e.target.value }))} className="text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Reference</label>
                <Input placeholder="Email thread, meeting notes, signed document..." value={commitForm.evidenceReference} onChange={e => setCommitForm(f => ({ ...f, evidenceReference: e.target.value }))} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <Textarea placeholder="Describe the commitment in detail..." value={commitForm.commitmentDescription} onChange={e => setCommitForm(f => ({ ...f, commitmentDescription: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (!selectedVentureId) { toast.error("Select a venture first"); return; }
                createCommitment.mutate({
                  ventureId: selectedVentureId,
                  commitmentType: commitForm.commitmentType,
                  commitmentDescription: commitForm.commitmentDescription || undefined,
                  commitmentValue: commitForm.commitmentValue ? parseFloat(commitForm.commitmentValue) : undefined,
                  commitmentCurrency: commitForm.commitmentCurrency,
                  commitmentDate: commitForm.commitmentDate || undefined,
                  evidenceReference: commitForm.evidenceReference || undefined,
                  status: commitForm.status,
                });
              }} disabled={createCommitment.isPending} style={{ background: "#22c55e" }}>
                {createCommitment.isPending ? "Saving..." : "Log Commitment"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewCommitForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {(commitments as any[]).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No commitments logged yet.</p>
          ) : (
            (commitments as any[]).map(c => (
              <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{c.commitment_type?.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-xs" style={{ color: c.status === "confirmed" ? "#22c55e" : c.status === "withdrawn" ? "#ef4444" : "#f59e0b" }}>{c.status}</Badge>
                    {c.commitment_value && <span className="text-xs font-semibold text-gray-700">£{Number(c.commitment_value).toLocaleString()}</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.commitment_description ?? "No description"}</p>
                  {c.evidence_reference && <p className="text-xs text-blue-500 mt-1">Evidence: {c.evidence_reference}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => deleteCommitment.mutate({ id: c.id })} className="text-red-400 border-red-200 hover:bg-red-50 px-2 shrink-0">
                  <Trash2 size={13} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderPricingTest = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700">Pricing Experiments</h3>
          <Button size="sm" onClick={() => setShowNewPricingForm(v => !v)} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
            <Plus size={13} /> New Experiment
          </Button>
        </div>

        {showNewPricingForm && (
          <div className="p-5 border-b bg-gray-50 space-y-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Pricing Model</label>
                <Select value={pricingForm.pricingModel} onValueChange={v => setPricingForm(f => ({ ...f, pricingModel: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRICING_MODELS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Price Point (£)</label>
                <Input type="number" placeholder="5000" value={pricingForm.pricePoint} onChange={e => setPricingForm(f => ({ ...f, pricePoint: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Billing Period</label>
                <Select value={pricingForm.billingPeriod} onValueChange={v => setPricingForm(f => ({ ...f, billingPeriod: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["one_off", "monthly", "quarterly", "annually", "per_unit", "per_transaction"].map(p => (
                      <SelectItem key={p} value={p}>{p.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Segment</label>
                <Input placeholder="Bus operators, SMEs..." value={pricingForm.targetCustomerSegment} onChange={e => setPricingForm(f => ({ ...f, targetCustomerSegment: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Value Metric</label>
                <Input placeholder="Per bus, per seat, per route..." value={pricingForm.valueMetric} onChange={e => setPricingForm(f => ({ ...f, valueMetric: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sample Size</label>
                <Input type="number" placeholder="10" value={pricingForm.testSampleSize} onChange={e => setPricingForm(f => ({ ...f, testSampleSize: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Positive Responses</label>
                <Input type="number" placeholder="4" value={pricingForm.positiveResponses} onChange={e => setPricingForm(f => ({ ...f, positiveResponses: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Negative Responses</label>
                <Input type="number" placeholder="6" value={pricingForm.negativeResponses} onChange={e => setPricingForm(f => ({ ...f, negativeResponses: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={pricingForm.status} onValueChange={v => setPricingForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["proposed", "running", "completed", "inconclusive", "invalidated"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Buying Trigger</label>
                <Textarea placeholder="What triggers the customer to buy?" value={pricingForm.buyingTrigger} onChange={e => setPricingForm(f => ({ ...f, buyingTrigger: e.target.value }))} rows={2} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Learning Summary</label>
                <Textarea placeholder="What did you learn from this pricing test?" value={pricingForm.learningSummary} onChange={e => setPricingForm(f => ({ ...f, learningSummary: e.target.value }))} rows={2} className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (!selectedVentureId) { toast.error("Select a venture first"); return; }
                createPricing.mutate({
                  ventureId: selectedVentureId,
                  pricingModel: pricingForm.pricingModel,
                  pricePoint: pricingForm.pricePoint ? parseFloat(pricingForm.pricePoint) : undefined,
                  currency: pricingForm.currency,
                  billingPeriod: pricingForm.billingPeriod,
                  targetCustomerSegment: pricingForm.targetCustomerSegment || undefined,
                  valueMetric: pricingForm.valueMetric || undefined,
                  buyingTrigger: pricingForm.buyingTrigger || undefined,
                  testSampleSize: parseInt(pricingForm.testSampleSize) || 0,
                  positiveResponses: parseInt(pricingForm.positiveResponses) || 0,
                  negativeResponses: parseInt(pricingForm.negativeResponses) || 0,
                  learningSummary: pricingForm.learningSummary || undefined,
                  status: pricingForm.status,
                });
              }} disabled={createPricing.isPending} style={{ background: "#22c55e" }}>
                {createPricing.isPending ? "Saving..." : "Save Experiment"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewPricingForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {(pricingExps as any[]).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No pricing experiments recorded yet.</p>
          ) : (
            (pricingExps as any[]).map(p => (
              <div key={p.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{p.pricing_model?.replace(/_/g, " ")}</Badge>
                    {p.price_point && <span className="text-sm font-bold text-gray-800">£{Number(p.price_point).toLocaleString()} / {p.billing_period?.replace(/_/g, " ")}</span>}
                    <Badge variant="outline" className="text-xs" style={{ color: p.status === "completed" ? "#22c55e" : p.status === "invalidated" ? "#ef4444" : "#f59e0b" }}>{p.status}</Badge>
                  </div>
                  {p.target_customer_segment && <p className="text-xs text-gray-500">Segment: {p.target_customer_segment}</p>}
                  {p.test_sample_size > 0 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">Sample: {p.test_sample_size}</span>
                      <span className="text-xs text-green-600">✓ {p.positive_responses}</span>
                      <span className="text-xs text-red-500">✗ {p.negative_responses}</span>
                      <span className="text-xs font-semibold text-gray-700">Conversion: {Number(p.conversion_rate).toFixed(1)}%</span>
                    </div>
                  )}
                  {p.learning_summary && <p className="text-xs text-gray-400 mt-1 italic">{p.learning_summary}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => deletePricing.mutate({ id: p.id })} className="text-red-400 border-red-200 hover:bg-red-50 px-2 shrink-0">
                  <Trash2 size={13} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderBudgetOwner = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700">Budget Owner Validation</h3>
          <Button size="sm" onClick={() => setShowNewBudgetForm(v => !v)} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
            <Plus size={13} /> Add Validation
          </Button>
        </div>

        {showNewBudgetForm && (
          <div className="p-5 border-b bg-gray-50 space-y-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Organisation</label>
                <Input placeholder="Acme Corp" value={budgetForm.organisation} onChange={e => setBudgetForm(f => ({ ...f, organisation: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget Owner Role</label>
                <Input placeholder="CFO, Head of Procurement..." value={budgetForm.budgetOwnerRole} onChange={e => setBudgetForm(f => ({ ...f, budgetOwnerRole: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget Category</label>
                <Select value={budgetForm.budgetCategory} onValueChange={v => setBudgetForm(f => ({ ...f, budgetCategory: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["innovation", "operations", "engineering", "sustainability", "procurement", "digital_transformation", "compliance", "training", "capex", "opex", "research_and_development"].map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget Cycle</label>
                <Select value={budgetForm.budgetCycle} onValueChange={v => setBudgetForm(f => ({ ...f, budgetCycle: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["monthly", "quarterly", "annually", "biennial", "unknown"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Budget Available (£)</label>
                <Input type="number" placeholder="50000" value={budgetForm.currentBudgetAvailable} onChange={e => setBudgetForm(f => ({ ...f, currentBudgetAvailable: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Validation Status</label>
                <Select value={budgetForm.validationStatus} onValueChange={v => setBudgetForm(f => ({ ...f, validationStatus: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unknown", "partially_validated", "validated", "blocked", "invalidated"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Financial Decision Criteria</label>
              <Textarea placeholder="What criteria does the budget owner use to approve spend?" value={budgetForm.financialDecisionCriteria} onChange={e => setBudgetForm(f => ({ ...f, financialDecisionCriteria: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (!selectedVentureId) { toast.error("Select a venture first"); return; }
                createBudget.mutate({
                  ventureId: selectedVentureId,
                  organisation: budgetForm.organisation || undefined,
                  budgetOwnerKnown: budgetForm.budgetOwnerKnown,
                  budgetOwnerRole: budgetForm.budgetOwnerRole || undefined,
                  budgetCategory: budgetForm.budgetCategory,
                  budgetCycle: budgetForm.budgetCycle,
                  currentBudgetAvailable: budgetForm.currentBudgetAvailable ? parseFloat(budgetForm.currentBudgetAvailable) : undefined,
                  estimatedBudgetRange: budgetForm.estimatedBudgetRange || undefined,
                  approvalRequired: budgetForm.approvalRequired,
                  approvalStakeholders: budgetForm.approvalStakeholders || undefined,
                  financialDecisionCriteria: budgetForm.financialDecisionCriteria || undefined,
                  notes: budgetForm.notes || undefined,
                  validationStatus: budgetForm.validationStatus,
                });
              }} disabled={createBudget.isPending} style={{ background: "#22c55e" }}>
                {createBudget.isPending ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewBudgetForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {(budgetValidations as any[]).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No budget validations recorded yet.</p>
          ) : (
            (budgetValidations as any[]).map(b => (
              <div key={b.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{b.budget_category?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="text-xs" style={{ color: b.validation_status === "validated" ? "#22c55e" : b.validation_status === "blocked" ? "#ef4444" : "#f59e0b" }}>{b.validation_status?.replace(/_/g, " ")}</Badge>
                  {b.organisation && <span className="text-xs text-gray-500">{b.organisation}</span>}
                </div>
                {b.budget_owner_role && <p className="text-xs text-gray-500">Budget owner: {b.budget_owner_role}</p>}
                {b.current_budget_available && <p className="text-xs text-gray-500">Budget available: £{Number(b.current_budget_available).toLocaleString()} / {b.budget_cycle}</p>}
                {b.financial_decision_criteria && <p className="text-xs text-gray-400 mt-1 italic">{b.financial_decision_criteria}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderProcurement = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700">Procurement Pathway Mapping</h3>
          <Button size="sm" onClick={() => setShowNewProcurementForm(v => !v)} className="gap-1.5 text-xs" style={{ background: "#3A97D3" }}>
            <Plus size={13} /> Map Pathway
          </Button>
        </div>

        {showNewProcurementForm && (
          <div className="p-5 border-b bg-gray-50 space-y-3" style={{ borderColor: "#e5e7eb" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Organisation</label>
                <Input placeholder="Acme Corp" value={procurementForm.organisation} onChange={e => setProcurementForm(f => ({ ...f, organisation: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Procurement Route</label>
                <Select value={procurementForm.procurementRoute} onValueChange={v => setProcurementForm(f => ({ ...f, procurementRoute: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROCUREMENT_ROUTES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Complexity (1–5)</label>
                <Select value={procurementForm.procurementComplexityScore} onValueChange={v => setProcurementForm(f => ({ ...f, procurementComplexityScore: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1", "2", "3", "4", "5"].map(n => <SelectItem key={n} value={n}>{n} — {["Very Simple", "Simple", "Moderate", "Complex", "Very Complex"][parseInt(n) - 1]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Expected Sales Cycle (days)</label>
                <Input type="number" placeholder="90" value={procurementForm.expectedSalesCycleDays} onChange={e => setProcurementForm(f => ({ ...f, expectedSalesCycleDays: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={procurementForm.status} onValueChange={v => setProcurementForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unknown", "mapped", "blocked", "feasible", "high_friction", "validated"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Procurement Risks</label>
                <Textarea placeholder="What could block or delay procurement?" value={procurementForm.procurementRisks} onChange={e => setProcurementForm(f => ({ ...f, procurementRisks: e.target.value }))} rows={2} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Next Procurement Step</label>
                <Textarea placeholder="What is the next concrete step?" value={procurementForm.nextProcurementStep} onChange={e => setProcurementForm(f => ({ ...f, nextProcurementStep: e.target.value }))} rows={2} className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                if (!selectedVentureId) { toast.error("Select a venture first"); return; }
                createProcurement.mutate({
                  ventureId: selectedVentureId,
                  organisation: procurementForm.organisation || undefined,
                  procurementRoute: procurementForm.procurementRoute as any,
                  procurementComplexityScore: parseInt(procurementForm.procurementComplexityScore),
                  expectedSalesCycleDays: parseInt(procurementForm.expectedSalesCycleDays),
                  legalReviewRequired: procurementForm.legalReviewRequired,
                  dataSecurityReviewRequired: procurementForm.dataSecurityReviewRequired,
                  pilotPossibleWithoutFullProcurement: procurementForm.pilotPossibleWithoutFullProcurement,
                  procurementRisks: procurementForm.procurementRisks || undefined,
                  nextProcurementStep: procurementForm.nextProcurementStep || undefined,
                  status: procurementForm.status,
                });
              }} disabled={createProcurement.isPending} style={{ background: "#22c55e" }}>
                {createProcurement.isPending ? "Saving..." : "Save Pathway"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewProcurementForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {(procurement as any[]).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No procurement pathways mapped yet.</p>
          ) : (
            (procurement as any[]).map(p => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{p.procurement_route?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="text-xs" style={{ color: p.status === "validated" ? "#22c55e" : p.status === "blocked" ? "#ef4444" : "#f59e0b" }}>{p.status?.replace(/_/g, " ")}</Badge>
                  {p.organisation && <span className="text-xs text-gray-500">{p.organisation}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span>Complexity: {p.procurement_complexity_score}/5</span>
                  <span>Sales cycle: ~{p.expected_sales_cycle_days} days</span>
                  {p.legal_review_required && <span className="text-amber-600">⚠ Legal review required</span>}
                  {p.data_security_review_required && <span className="text-amber-600">⚠ Data security review required</span>}
                </div>
                {p.next_procurement_step && <p className="text-xs text-blue-500 mt-1">Next: {p.next_procurement_step}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderObjections = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Objection Frequency</h3>
          {!objections || objections.objectionCounts.length === 0 ? (
            <p className="text-sm text-gray-400">No objections recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {objections.objectionCounts.map(o => (
                <div key={o.category} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-40 shrink-0">{o.category.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (o.count / (objections.objectionCounts[0]?.count || 1)) * 100)}%`,
                        background: "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-4 text-right">{o.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Unresolved Objections</h3>
          <p className="text-3xl font-bold text-red-500 mb-2">{objections?.unresolvedCount ?? 0}</p>
          <p className="text-xs text-gray-400">WTP tests with unresolved objections that may block commercial validation.</p>
          {objections && objections.unresolvedCount > 0 && (
            <div className="mt-3 space-y-2">
              {(objections.tests as any[]).filter(t => t.objection_category && t.status !== "completed" && t.status !== "converted_to_paid_customer").slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-gray-600">{t.objection_category?.replace(/_/g, " ")}</span>
                  <span className="text-gray-400">· {t.status?.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvidenceLadder = () => (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-700">
          ⚠ The Evidence Ladder defines what counts as real WTP. Levels 1–2 are NOT commercial validation. Real WTP starts at Level 3 (data sharing) and is only confirmed at Level 7 (payment received).
        </p>
      </div>
      {(evidenceLadder as any[]).map(l => (
        <div
          key={l.level}
          className="bg-white rounded-xl border p-5 shadow-sm flex items-start gap-4"
          style={{ borderColor: l.isWTP ? "#22c55e" : "#e5e7eb", borderLeftWidth: l.isWTP ? 4 : 1, borderLeftColor: l.isWTP ? "#22c55e" : "#e5e7eb" }}
        >
          <div className="shrink-0">
            <EvidencePill level={l.level} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-gray-800">{l.label}</span>
              <Badge variant="outline" className="text-xs" style={{ color: l.isWTP ? "#22c55e" : "#6b7280" }}>
                {l.isWTP ? "✓ WTP Signal" : "Interest Only"}
              </Badge>
              <span className="text-xs font-semibold text-gray-400">{l.strength}</span>
            </div>
            <p className="text-xs text-green-700 mb-0.5">✓ Proves: {l.proves}</p>
            <p className="text-xs text-red-600">✗ Does NOT prove: {l.doesNotProve}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xl font-bold" style={{ color: SCORE_COLORS(l.score) }}>{l.score}</span>
            <p className="text-xs text-gray-400">score</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderScorecard = () => (
    <div className="space-y-4">
      {!scorecard ? (
        <p className="text-sm text-gray-400 text-center py-8">Select a venture to view the WTP Scorecard.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "WTP Tests", value: scorecard.testCount, icon: Target },
              { label: "Commitments", value: scorecard.commitmentCount, icon: CheckCircle2 },
              { label: "Budget Validations", value: scorecard.budgetValidationCount, icon: Building2 },
              { label: "Procurement Maps", value: scorecard.procurementCount, icon: FileText },
              { label: "Pricing Experiments", value: scorecard.pricingExperimentCount, icon: TrendingUp },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm text-center" style={{ borderColor: "#e5e7eb" }}>
                <k.icon size={20} className="mx-auto mb-2 text-gray-400" />
                <p className="text-2xl font-bold text-gray-800">{k.value}</p>
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-700 mb-3">WTP Score</h3>
              <div className="flex items-center gap-4">
                <ScoreBadge score={scorecard.avgScore} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{scorecard.wtpStatus.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-400">Commercial validation status</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${scorecard.avgScore}%`, background: SCORE_COLORS(scorecard.avgScore) }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>Do not build</span><span>Run more tests</span><span>Strengthen</span><span>Proceed</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Stage Gate</h3>
              <div className="flex items-center gap-3 mb-3">
                {scorecard.stageGateReady ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Unlock size={20} />
                    <span className="text-sm font-semibold">Stage Gate OPEN</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500">
                    <Lock size={20} />
                    <span className="text-sm font-semibold">Stage Gate LOCKED</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Stage gate opens when: WTP score ≥ 60, budget owner identified, pricing model tested, procurement pathway mapped, and all tests score ≥ 40.
              </p>
            </div>
          </div>

          {scorecard.recommendation && (
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Decision Recommendation</h3>
              <p className="text-sm font-semibold text-gray-800 mb-1">{scorecard.recommendation.label}</p>
              <p className="text-xs text-gray-500 mb-3">{scorecard.recommendation.description}</p>
              {scorecard.warnings.length > 0 && (
                <div className="space-y-1">
                  {scorecard.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderNextAction = () => {
    const allTests = (wtpTests as any[]);
    const overdue = allTests.filter(t => t.next_action_due_date && new Date(t.next_action_due_date) < new Date() && t.status !== "completed");
    const upcoming = allTests.filter(t => t.next_action_due_date && new Date(t.next_action_due_date) >= new Date() && t.status !== "completed");
    const noDate = allTests.filter(t => !t.next_action_due_date && t.next_commercial_action && t.status !== "completed");

    return (
      <div className="space-y-4">
        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Overdue Actions ({overdue.length})</h3>
            <div className="space-y-2">
              {overdue.map(t => (
                <div key={t.id} className="flex items-start gap-3 text-xs">
                  <span className="text-red-500 font-semibold shrink-0">{t.next_action_due_date}</span>
                  <span className="text-gray-700">{t.next_commercial_action ?? "No action defined"}</span>
                  <span className="text-gray-400">· {t.customer_name ?? "Unknown"} @ {t.organisation ?? "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Zap size={14} className="text-blue-500" /> Upcoming Actions ({upcoming.length})</h3>
            <div className="space-y-2">
              {upcoming.map(t => (
                <div key={t.id} className="flex items-start gap-3 text-xs border-b pb-2" style={{ borderColor: "#f3f4f6" }}>
                  <span className="text-blue-600 font-semibold shrink-0">{t.next_action_due_date}</span>
                  <span className="text-gray-700">{t.next_commercial_action ?? "No action defined"}</span>
                  <span className="text-gray-400">· {t.customer_name ?? "Unknown"} @ {t.organisation ?? "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {noDate.length > 0 && (
          <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Actions Without Due Dates ({noDate.length})</h3>
            <div className="space-y-2">
              {noDate.map(t => (
                <div key={t.id} className="flex items-start gap-3 text-xs">
                  <span className="w-2 h-2 rounded-full bg-gray-300 mt-1 shrink-0" />
                  <span className="text-gray-700">{t.next_commercial_action}</span>
                  <span className="text-gray-400">· {t.customer_name ?? "Unknown"} @ {t.organisation ?? "Unknown"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {overdue.length === 0 && upcoming.length === 0 && noDate.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No next actions defined. Add commercial actions when logging WTP tests.</p>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>
                Commercial Validation
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Lean Methodology Stage Gate</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              WTP Assessment
            </h1>
            <p className="text-sm text-gray-500 max-w-xl">
              Willingness to Pay validation — the commercial evidence layer that gates MVP investment decisions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select value={selectedVentureId} onValueChange={setSelectedVentureId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select venture..." />
                </SelectTrigger>
                <SelectContent>
                  {(ventures as any[]).map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: v.color ?? "#6b7280" }} />
                        {v.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={refetchAll} className="gap-1.5 text-xs">
              <RefreshCw size={13} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-8 flex gap-1 overflow-x-auto" style={{ borderColor: "#e5e7eb" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8 max-w-6xl mx-auto">
        {activeTab === "overview"     && renderOverview()}
        {activeTab === "commitments"  && renderCommitments()}
        {activeTab === "pricing"      && renderPricingTest()}
        {activeTab === "budget"       && renderBudgetOwner()}
        {activeTab === "procurement"  && renderProcurement()}
        {activeTab === "objections"   && renderObjections()}
        {activeTab === "ladder"       && renderEvidenceLadder()}
        {activeTab === "scorecard"    && renderScorecard()}
        {activeTab === "nextaction"   && renderNextAction()}
      </div>
    </div>
  );
}
