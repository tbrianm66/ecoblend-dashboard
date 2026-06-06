// ============================================================
// INVESTOR DATA ROOM MODULE
// 6 tabs: Rooms, Assets, Readiness, Investors, Analytics, Q&A
// Design: Precision Industrial — consistent with platform palette
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FolderOpen, Plus, Eye, Lock, Users, BarChart3, MessageSquare,
  CheckCircle2, AlertTriangle, XCircle, FileText, Upload,
  Send, RefreshCw, Zap, Shield, TrendingUp, Building2,
  ChevronRight, Clock, Download, Star, Archive,
} from "lucide-react";

// ─── COLOUR TOKENS ───────────────────────────────────────────
const C = {
  green:  "#56A837",
  blue:   "#3B85BA",
  amber:  "#F69111",
  red:    "#E05252",
  bg:     "#f8f9fb",
  border: "#e5e7eb",
  text:   "#1a2332",
  muted:  "#6b7280",
};

const FONT = "'Prompt', sans-serif";

// ─── STATUS BADGES ───────────────────────────────────────────
const statusColor: Record<string, string> = {
  draft:           "#6b7280",
  internal_review: "#F69111",
  approved:        "#56A837",
  published:       "#3B85BA",
  expired:         "#E05252",
  archived:        "#9ca3af",
  pending:         "#F69111",
  resolved:        "#56A837",
  waived:          "#3B85BA",
  critical:        "#E05252",
  high:            "#F69111",
  medium:          "#3B85BA",
  low:             "#56A837",
  identified:      "#9ca3af",
  contacted:       "#F69111",
  nda_signed:      "#3B85BA",
  room_invited:    "#8b5cf6",
  active_review:   "#56A837",
  meeting_booked:  "#F69111",
  term_sheet:      "#3B85BA",
  closed:          "#56A837",
  passed:          "#E05252",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] ?? "#6b7280";
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: `${color}15`, color }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── SECTION CARD ────────────────────────────────────────────
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: C.border }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── KPI CARD ────────────────────────────────────────────────
function KpiCard({ label, value, accent, icon: Icon }: { label: string; value: string | number; accent: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3" style={{ borderColor: C.border }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-xl font-bold" style={{ color: accent, fontFamily: FONT }}>{value}</div>
        <div className="text-xs text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── TABS ────────────────────────────────────────────────────
const TABS = [
  { id: "rooms",     label: "Data Rooms",  icon: FolderOpen },
  { id: "assets",    label: "Assets",      icon: FileText },
  { id: "readiness", label: "Readiness",   icon: CheckCircle2 },
  { id: "investors", label: "Investors",   icon: Users },
  { id: "analytics", label: "Analytics",   icon: BarChart3 },
  { id: "qa",        label: "Q&A",         icon: MessageSquare },
];

// ─── ROOMS TAB ───────────────────────────────────────────────
function RoomsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    ventureId: 1, name: "", description: "",
    roomType: "teaser" as const, visibilityTier: "teaser" as const,
    fundingRound: "", fundingTarget: "", ndaRequired: false,
    watermarkEnabled: true, downloadEnabled: false,
  });

  const roomsQuery = trpc.investorDataRoom.rooms.list.useQuery({});
  const summaryQuery = trpc.investorDataRoom.rooms.summary.useQuery({});
  const createMutation = trpc.investorDataRoom.rooms.create.useMutation({
    onSuccess: () => {
      toast.success("Data room created");
      setShowCreate(false);
      roomsQuery.refetch();
      summaryQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const publishMutation = trpc.investorDataRoom.rooms.publish.useMutation({
    onSuccess: () => { toast.success("Room published"); roomsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.investorDataRoom.rooms.delete.useMutation({
    onSuccess: () => { toast.success("Room archived"); roomsQuery.refetch(); },
  });

  const rooms = roomsQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Rooms"     value={summary?.total ?? 0}     accent={C.blue}  icon={FolderOpen} />
        <KpiCard label="Published"       value={summary?.published ?? 0} accent={C.green} icon={Eye} />
        <KpiCard label="Draft"           value={summary?.draft ?? 0}     accent={C.amber} icon={Clock} />
        <KpiCard label="Expired"         value={summary?.expired ?? 0}   accent={C.red}   icon={XCircle} />
      </div>

      {/* Create form */}
      {showCreate && (
        <SectionCard title="Create New Data Room">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Room Name *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: C.border }}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Series A — Teaser Room"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Room Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }}
                value={form.roomType}
                onChange={e => setForm(f => ({ ...f, roomType: e.target.value as any }))}
              >
                <option value="teaser">Teaser</option>
                <option value="full">Full</option>
                <option value="due_diligence">Due Diligence</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Funding Round</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }}
                value={form.fundingRound}
                onChange={e => setForm(f => ({ ...f, fundingRound: e.target.value }))}
                placeholder="e.g. Pre-Seed, Seed, Series A"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Funding Target</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }}
                value={form.fundingTarget}
                onChange={e => setForm(f => ({ ...f, fundingTarget: e.target.value }))}
                placeholder="e.g. £500,000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }}
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description for investors..."
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.ndaRequired} onChange={e => setForm(f => ({ ...f, ndaRequired: e.target.checked }))} />
                NDA Required
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.watermarkEnabled} onChange={e => setForm(f => ({ ...f, watermarkEnabled: e.target.checked }))} />
                Watermark
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.downloadEnabled} onChange={e => setForm(f => ({ ...f, downloadEnabled: e.target.checked }))} />
                Downloads
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || createMutation.isPending}
              style={{ background: C.green, color: "white" }}
            >
              {createMutation.isPending ? "Creating…" : "Create Room"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </SectionCard>
      )}

      {/* Rooms list */}
      <SectionCard
        title={`Data Rooms (${rooms.length})`}
        action={
          <Button size="sm" onClick={() => setShowCreate(true)} style={{ background: C.green, color: "white" }}>
            <Plus size={13} className="mr-1" /> New Room
          </Button>
        }
      >
        {rooms.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No data rooms yet. Create your first room to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((room: any) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ borderColor: C.border, borderLeft: `4px solid ${statusColor[room.status] ?? C.blue}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800" style={{ fontFamily: FONT }}>{room.name}</span>
                    <StatusBadge status={room.status} />
                    <Badge variant="outline" className="text-xs">{room.roomType}</Badge>
                    {room.ndaRequired && <Lock size={12} style={{ color: C.amber }} />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {room.fundingRound && <span>{room.fundingRound}</span>}
                    {room.fundingTarget && <span>Target: {room.fundingTarget}</span>}
                    <span>Access: {room.accessCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {room.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => publishMutation.mutate({ id: room.id })}
                      disabled={publishMutation.isPending}
                      style={{ borderColor: C.green, color: C.green }}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate({ id: room.id })}
                    style={{ borderColor: C.red, color: C.red }}
                  >
                    <Archive size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── ASSETS TAB ──────────────────────────────────────────────
function AssetsTab() {
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [showGenerate, setShowGenerate] = useState<"one_pager" | "pitch_deck" | "financial_summary" | "dd_index" | null>(null);
  const [genForm, setGenForm] = useState({
    roomId: 1, ventureId: 1, ventureName: "EcoBlend VBS",
    problem: "", solution: "", market: "", marketSize: "", ask: "",
    sector: "B2B SaaS", stage: "Seed",
    businessModel: "", revenueModel: "", forecast: "", assumptions: "", useOfFunds: "",
  });

  const assetsQuery = trpc.investorDataRoom.assets.list.useQuery({ folder: selectedFolder });
  const onePagerMutation = trpc.investorDataRoom.assetFactory.generateOnePager.useMutation({
    onSuccess: () => { toast.success("One-pager generated"); setShowGenerate(null); assetsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const pitchDeckMutation = trpc.investorDataRoom.assetFactory.generatePitchDeck.useMutation({
    onSuccess: () => { toast.success("Pitch deck generated"); setShowGenerate(null); assetsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const financialMutation = trpc.investorDataRoom.assetFactory.generateFinancialSummary.useMutation({
    onSuccess: () => { toast.success("Financial summary generated"); setShowGenerate(null); assetsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const ddMutation = trpc.investorDataRoom.assetFactory.generateDdIndex.useMutation({
    onSuccess: () => { toast.success("DD index generated"); setShowGenerate(null); assetsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const assets = assetsQuery.data ?? [];

  const FOLDERS = [
    "01_Overview", "02_Problem_Market", "03_Product_Technology",
    "04_Business_Model_Financials", "05_Execution_Operations",
    "06_Impact_Compliance", "07_Legal_Corporate",
    "08_Due_Diligence_QA", "09_Access_Logs_Archive",
  ];

  const folderLabel = (f: string) => f.replace(/^\d+_/, "").replace(/_/g, " ");

  return (
    <div className="flex flex-col gap-6">
      {/* AI Asset Factory */}
      <SectionCard title="AI Asset Factory">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: "one_pager",          label: "One-Pager",        icon: FileText,  color: C.green },
            { key: "pitch_deck",         label: "Pitch Deck",       icon: Star,      color: C.blue },
            { key: "financial_summary",  label: "Financial Summary", icon: TrendingUp, color: C.amber },
            { key: "dd_index",           label: "DD Index",         icon: Shield,    color: C.red },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setShowGenerate(key as any)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:shadow-md transition-all"
              style={{ borderColor: color, background: `${color}08` }}
            >
              <Icon size={22} style={{ color }} />
              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              <span className="text-xs text-gray-400">AI Generate</span>
            </button>
          ))}
        </div>

        {/* Generation form */}
        {showGenerate && (
          <div className="mt-4 p-4 rounded-xl border bg-gray-50" style={{ borderColor: C.border }}>
            <h4 className="text-sm font-bold text-gray-700 mb-3">
              Generate {showGenerate === "one_pager" ? "One-Pager" : showGenerate === "pitch_deck" ? "Pitch Deck" : showGenerate === "financial_summary" ? "Financial Summary" : "DD Index"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Venture Name</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                  value={genForm.ventureName} onChange={e => setGenForm(f => ({ ...f, ventureName: e.target.value }))} />
              </div>
              {(showGenerate === "one_pager" || showGenerate === "pitch_deck") && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Problem</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.problem} onChange={e => setGenForm(f => ({ ...f, problem: e.target.value }))} placeholder="Core problem being solved" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Solution</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.solution} onChange={e => setGenForm(f => ({ ...f, solution: e.target.value }))} placeholder="Your solution" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Market</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.market} onChange={e => setGenForm(f => ({ ...f, market: e.target.value }))} placeholder="Market size and opportunity" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">The Ask</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.ask} onChange={e => setGenForm(f => ({ ...f, ask: e.target.value }))} placeholder="e.g. £500K for 10% equity" />
                  </div>
                </>
              )}
              {showGenerate === "financial_summary" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Revenue Model</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.revenueModel} onChange={e => setGenForm(f => ({ ...f, revenueModel: e.target.value }))} placeholder="SaaS subscription, etc." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">3-Year Forecast</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.forecast} onChange={e => setGenForm(f => ({ ...f, forecast: e.target.value }))} placeholder="Y1: £200K, Y2: £500K, Y3: £1.2M" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Key Assumptions</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.assumptions} onChange={e => setGenForm(f => ({ ...f, assumptions: e.target.value }))} placeholder="CAC, LTV, churn assumptions" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Use of Funds</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                      value={genForm.useOfFunds} onChange={e => setGenForm(f => ({ ...f, useOfFunds: e.target.value }))} placeholder="40% product, 40% GTM, 20% ops" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                disabled={onePagerMutation.isPending || pitchDeckMutation.isPending || financialMutation.isPending || ddMutation.isPending}
                onClick={() => {
                  if (showGenerate === "one_pager") onePagerMutation.mutate({ ...genForm });
                  else if (showGenerate === "pitch_deck") pitchDeckMutation.mutate({ ...genForm, marketSize: genForm.marketSize || genForm.market });
                  else if (showGenerate === "financial_summary") financialMutation.mutate({ ...genForm });
                  else ddMutation.mutate({ roomId: genForm.roomId, ventureId: genForm.ventureId, ventureName: genForm.ventureName, stage: genForm.stage });
                }}
                style={{ background: C.green, color: "white" }}
              >
                <Zap size={13} className="mr-1" /> Generate with AI
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowGenerate(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Folder filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFolder(undefined)}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
          style={{
            borderColor: !selectedFolder ? C.blue : C.border,
            background: !selectedFolder ? `${C.blue}15` : "white",
            color: !selectedFolder ? C.blue : C.muted,
          }}
        >
          All Folders
        </button>
        {FOLDERS.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFolder(f)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
            style={{
              borderColor: selectedFolder === f ? C.green : C.border,
              background: selectedFolder === f ? `${C.green}15` : "white",
              color: selectedFolder === f ? C.green : C.muted,
            }}
          >
            {folderLabel(f)}
          </button>
        ))}
      </div>

      {/* Assets list */}
      <SectionCard title={`Assets (${assets.length})`}>
        {assets.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No assets yet. Use the AI Asset Factory above to generate documents.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {assets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-3">
                  <FileText size={16} style={{ color: C.blue }} />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{asset.name}</div>
                    <div className="text-xs text-gray-400">{folderLabel(asset.folder)} · {asset.assetType?.replace(/_/g, " ")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {asset.isAiGenerated && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.blue}15`, color: C.blue }}>AI</span>
                  )}
                  <StatusBadge status={asset.status} />
                  <Badge variant="outline" className="text-xs">{asset.visibilityTier}</Badge>
                  {asset.downloadAllowed && <Download size={12} style={{ color: C.green }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── READINESS TAB ───────────────────────────────────────────
function ReadinessTab() {
  const [roomId] = useState(1);
  const checksQuery = trpc.investorDataRoom.readiness.list.useQuery({ roomId });
  const scoreQuery = trpc.investorDataRoom.readiness.score.useQuery({ roomId });
  const generateMutation = trpc.investorDataRoom.readiness.generateChecklist.useMutation({
    onSuccess: (d) => { toast.success(`Generated ${d.created} readiness checks`); checksQuery.refetch(); scoreQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const resolveMutation = trpc.investorDataRoom.readiness.resolve.useMutation({
    onSuccess: () => { toast.success("Check resolved"); checksQuery.refetch(); scoreQuery.refetch(); },
  });

  const checks = checksQuery.data ?? [];
  const score = scoreQuery.data;

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...checks].sort((a: any, b: any) => (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 4));

  return (
    <div className="flex flex-col gap-6">
      {/* Score overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Readiness Score"    value={`${score?.score ?? 0}%`}             accent={score?.score && score.score >= 80 ? C.green : C.amber} icon={CheckCircle2} />
        <KpiCard label="Total Checks"       value={checks.length}                        accent={C.blue}  icon={Shield} />
        <KpiCard label="Critical Blocking"  value={score?.criticalBlocking ?? 0}         accent={C.red}   icon={XCircle} />
        <KpiCard label="Ready to Publish"   value={score?.readyToPublish ? "Yes" : "No"} accent={score?.readyToPublish ? C.green : C.red} icon={CheckCircle2} />
      </div>

      {/* Score bar */}
      {score && (
        <SectionCard title="Readiness Progress">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span style={{ color: C.text }}>Overall Readiness</span>
            <span style={{ color: score.score >= 80 ? C.green : C.amber }}>{score.score}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score.score}%`, background: score.score >= 80 ? C.green : C.amber }}
            />
          </div>
          {score.criticalBlocking > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: C.red }}>
              <AlertTriangle size={14} />
              {score.criticalBlocking} critical issue(s) must be resolved before publishing
            </div>
          )}
        </SectionCard>
      )}

      {/* Generate checklist */}
      <SectionCard title="Readiness Checklist">
        {checks.length === 0 ? (
          <div className="text-center py-8">
            <Shield size={32} className="mx-auto mb-2 opacity-30 text-gray-400" />
            <p className="text-sm text-gray-400 mb-4">No readiness checks yet.</p>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate({ roomId, ventureId: 1, ventureName: "EcoBlend VBS", stage: "Seed" })}
              disabled={generateMutation.isPending}
              style={{ background: C.blue, color: "white" }}
            >
              <RefreshCw size={13} className="mr-1" /> Generate Standard Checklist
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((check: any) => (
              <div
                key={check.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  borderColor: C.border,
                  background: check.status === "resolved" ? "#f0fdf4" : check.severity === "critical" && check.status === "pending" ? "#fef2f2" : "white",
                }}
              >
                <div className="flex items-center gap-3">
                  {check.status === "resolved" ? (
                    <CheckCircle2 size={16} style={{ color: C.green }} />
                  ) : check.severity === "critical" ? (
                    <XCircle size={16} style={{ color: C.red }} />
                  ) : (
                    <AlertTriangle size={16} style={{ color: C.amber }} />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-800">{check.title}</div>
                    <div className="text-xs text-gray-400 capitalize">{check.category} · {check.severity}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={check.status} />
                  {check.blocksPublish && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${C.red}15`, color: C.red }}>Blocks Publish</span>
                  )}
                  {check.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMutation.mutate({ id: check.id })}
                      style={{ borderColor: C.green, color: C.green }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── INVESTORS TAB ───────────────────────────────────────────
function InvestorsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    ventureId: 1, name: "", organisation: "", email: "",
    investorType: "vc" as const, thesisFit: "unknown" as const, notes: "",
  });

  const investorsQuery = trpc.investorDataRoom.investors.list.useQuery({});
  const pipelineQuery = trpc.investorDataRoom.investors.pipeline.useQuery({});
  const createMutation = trpc.investorDataRoom.investors.create.useMutation({
    onSuccess: () => { toast.success("Investor added"); setShowAdd(false); investorsQuery.refetch(); pipelineQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const stageMutation = trpc.investorDataRoom.investors.updateStage.useMutation({
    onSuccess: () => { investorsQuery.refetch(); pipelineQuery.refetch(); },
  });
  const ndaMutation = trpc.investorDataRoom.investors.signNda.useMutation({
    onSuccess: () => { toast.success("NDA marked as signed"); investorsQuery.refetch(); },
  });

  const investors = investorsQuery.data ?? [];
  const pipeline = pipelineQuery.data ?? [];

  const STAGES = ["identified","contacted","nda_signed","room_invited","active_review","meeting_booked","term_sheet","closed","passed"];

  return (
    <div className="flex flex-col gap-6">
      {/* Pipeline funnel */}
      <SectionCard title="Investor Pipeline">
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {pipeline.map((stage: any) => (
            <div key={stage.stage} className="flex flex-col items-center gap-1">
              <div
                className="w-full rounded-lg flex items-center justify-center font-bold text-lg"
                style={{
                  height: `${Math.max(32, 32 + stage.count * 12)}px`,
                  background: `${statusColor[stage.stage] ?? C.blue}20`,
                  color: statusColor[stage.stage] ?? C.blue,
                  fontFamily: FONT,
                }}
              >
                {stage.count}
              </div>
              <span className="text-xs text-gray-400 text-center capitalize leading-tight">
                {stage.stage.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Add investor form */}
      {showAdd && (
        <SectionCard title="Add Investor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Name *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Investor full name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Organisation</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Fund or firm name" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="investor@fund.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Investor Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.investorType} onChange={e => setForm(f => ({ ...f, investorType: e.target.value as any }))}>
                <option value="angel">Angel</option>
                <option value="vc">VC</option>
                <option value="family_office">Family Office</option>
                <option value="corporate">Corporate</option>
                <option value="accelerator">Accelerator</option>
                <option value="grant">Grant</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Thesis Fit</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.thesisFit} onChange={e => setForm(f => ({ ...f, thesisFit: e.target.value as any }))}>
                <option value="strong">Strong</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context or intro notes" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}
              style={{ background: C.green, color: "white" }}>
              {createMutation.isPending ? "Adding…" : "Add Investor"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </SectionCard>
      )}

      {/* Investors list */}
      <SectionCard
        title={`Investors (${investors.length})`}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)} style={{ background: C.blue, color: "white" }}>
            <Plus size={13} className="mr-1" /> Add Investor
          </Button>
        }
      >
        {investors.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No investors tracked yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {investors.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: statusColor[inv.stage] ?? C.blue }}>
                    {inv.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{inv.name}</div>
                    <div className="text-xs text-gray-400">{inv.organisation ?? inv.investorType} · Thesis: {inv.thesisFit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.stage} />
                  {!inv.ndaSigned && inv.stage !== "identified" && (
                    <Button size="sm" variant="outline" onClick={() => ndaMutation.mutate({ id: inv.id })}
                      style={{ borderColor: C.amber, color: C.amber }}>NDA</Button>
                  )}
                  {inv.ndaSigned && <span className="text-xs" style={{ color: C.green }}>NDA ✓</span>}
                  <select
                    className="text-xs border rounded px-2 py-1"
                    style={{ borderColor: C.border }}
                    value={inv.stage}
                    onChange={e => stageMutation.mutate({ id: inv.id, stage: e.target.value as any })}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── ANALYTICS TAB ───────────────────────────────────────────
function AnalyticsTab() {
  const portfolioQuery = trpc.investorDataRoom.engagement.portfolioAnalytics.useQuery({});
  const stats = portfolioQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Rooms"        value={stats?.totalRooms ?? 0}       accent={C.blue}  icon={FolderOpen} />
        <KpiCard label="Unique Investors"   value={stats?.totalInvestors ?? 0}   accent={C.green} icon={Users} />
        <KpiCard label="Total Room Views"   value={stats?.totalViews ?? 0}       accent={C.amber} icon={Eye} />
        <KpiCard label="Meeting Conversion" value={`${stats?.conversionRate ?? 0}%`} accent={C.red} icon={TrendingUp} />
      </div>

      <SectionCard title="Engagement Overview">
        {portfolioQuery.isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading analytics…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Room Performance</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Total Data Rooms",    value: stats?.totalRooms ?? 0,       color: C.blue },
                  { label: "Unique Investors",    value: stats?.totalInvestors ?? 0,   color: C.green },
                  { label: "Total Views",         value: stats?.totalViews ?? 0,       color: C.amber },
                  { label: "Meeting Conversion",  value: `${stats?.conversionRate ?? 0}%`, color: C.red },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: C.border }}>
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-bold" style={{ color, fontFamily: FONT }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Engagement Funnel</h4>
              <div className="flex flex-col gap-2">
                {[
                  { stage: "Room Invited",    pct: 100 },
                  { stage: "Room Viewed",     pct: 78 },
                  { stage: "Asset Opened",    pct: 55 },
                  { stage: "Q&A Submitted",   pct: 32 },
                  { stage: "Meeting Booked",  pct: stats?.conversionRate ?? 0 },
                ].map(({ stage, pct }) => (
                  <div key={stage}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{stage}</span>
                      <span className="font-semibold" style={{ color: C.blue }}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.blue }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Q&A TAB ─────────────────────────────────────────────────
function QaTab() {
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({
    roomId: 1, investorId: 1, question: "",
    category: "other" as const, priority: "normal" as const,
  });
  const [aiResponse, setAiResponse] = useState<Record<number, string>>({});

  const qaQuery = trpc.investorDataRoom.qa.list.useQuery({});
  const submitMutation = trpc.investorDataRoom.qa.submit.useMutation({
    onSuccess: () => { toast.success("Question submitted"); setShowSubmit(false); qaQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const respondMutation = trpc.investorDataRoom.qa.respond.useMutation({
    onSuccess: () => { toast.success("Response saved"); qaQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const aiMutation = trpc.investorDataRoom.qa.generateAiResponse.useMutation({
    onSuccess: (data, variables) => {
      setAiResponse(prev => ({ ...prev, [variables.questionId]: data.suggestedResponse }));
      toast.success("AI response generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const questions = qaQuery.data ?? [];

  const categoryColor: Record<string, string> = {
    financial: C.green, legal: C.red, technical: C.blue,
    market: C.amber, team: "#8b5cf6", product: C.green, compliance: C.amber, other: C.muted,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Questions" value={questions.length} accent={C.blue} icon={MessageSquare} />
        <KpiCard label="Pending" value={questions.filter((q: any) => q.status === "pending").length} accent={C.amber} icon={Clock} />
        <KpiCard label="Answered" value={questions.filter((q: any) => q.status === "answered").length} accent={C.green} icon={CheckCircle2} />
        <KpiCard label="Urgent" value={questions.filter((q: any) => q.priority === "urgent").length} accent={C.red} icon={AlertTriangle} />
      </div>

      {showSubmit && (
        <SectionCard title="Submit Question">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Question *</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                rows={3} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="What would you like to know about this venture?" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}>
                {["financial","legal","technical","market","team","product","compliance","other"].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Priority</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }}
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => submitMutation.mutate(form)} disabled={!form.question || submitMutation.isPending}
              style={{ background: C.blue, color: "white" }}>
              <Send size={13} className="mr-1" /> {submitMutation.isPending ? "Submitting…" : "Submit Question"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSubmit(false)}>Cancel</Button>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title={`Questions (${questions.length})`}
        action={
          <Button size="sm" onClick={() => setShowSubmit(true)} style={{ background: C.blue, color: "white" }}>
            <Plus size={13} className="mr-1" /> New Question
          </Button>
        }
      >
        {questions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No questions yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((q: any) => (
              <div key={q.id} className="p-4 rounded-xl border" style={{ borderColor: C.border }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${categoryColor[q.category] ?? C.muted}15`, color: categoryColor[q.category] ?? C.muted }}>
                      {q.category}
                    </span>
                    <StatusBadge status={q.status} />
                    <StatusBadge status={q.priority} />
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-medium mb-2">{q.question}</p>
                {q.response && (
                  <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="text-xs font-semibold text-green-700 mb-1">Response</div>
                    <p className="text-sm text-gray-700">{q.response}</p>
                  </div>
                )}
                {aiResponse[q.id] && (
                  <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="text-xs font-semibold text-blue-700 mb-1">AI Suggested Response</div>
                    <p className="text-sm text-gray-700">{aiResponse[q.id]}</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => respondMutation.mutate({ id: q.id, response: aiResponse[q.id], responseOwnerId: 1 })}
                      style={{ background: C.green, color: "white" }}
                    >
                      Use This Response
                    </Button>
                  </div>
                )}
                {q.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline"
                      onClick={() => aiMutation.mutate({ questionId: q.id, ventureName: "EcoBlend VBS", ventureStage: "Seed" })}
                      disabled={aiMutation.isPending}
                      style={{ borderColor: C.blue, color: C.blue }}>
                      <Zap size={12} className="mr-1" /> AI Draft Response
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function InvestorDataRoom() {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: C.border }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${C.blue}15`, color: C.blue }}>
                Capital Layer
              </span>
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-xs text-gray-400 font-mono">Investor Data Room</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: FONT }}>
              Investor Data Room
            </h1>
            <p className="text-sm text-gray-500 max-w-xl mt-0.5">
              Secure, governed data rooms for investor due diligence — 9-folder structure, AI asset generation, engagement analytics, and 5-role approval workflow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: `${C.green}15`, color: C.green }}>
              <Shield size={12} />
              Secure & Governed
            </div>
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: `${C.blue}15`, color: C.blue }}>
              <Building2 size={12} />
              9 Folders
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b bg-white" style={{ borderColor: C.border }}>
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all"
              style={{
                borderBottomColor: activeTab === tab.id ? C.blue : "transparent",
                color: activeTab === tab.id ? C.blue : C.muted,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-8">
        {activeTab === "rooms"     && <RoomsTab />}
        {activeTab === "assets"    && <AssetsTab />}
        {activeTab === "readiness" && <ReadinessTab />}
        {activeTab === "investors" && <InvestorsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "qa"        && <QaTab />}
      </div>
    </div>
  );
}
