// ============================================================
// ECOBLEND — B Corp & ISO Tracker
// DB-backed: trpc.irl.listCertifications + trpc.irl.upsertCertification
// B Impact Assessment score tracker + ISO 14001 / ISO 26000 compliance
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useVentures } from "@/contexts/VentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Award, CheckCircle2, Circle, ChevronDown, ChevronUp, Info, Loader2, Plus, RefreshCw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Static ISO checklists (structure; completion state is local for now) ──────
interface IsoItem {
  id: string;
  clause: string;
  requirement: string;
  completed: boolean;
  priority: "Critical" | "Important" | "Recommended";
}

const INITIAL_ISO14001: IsoItem[] = [
  { id: "14001-1", clause: "4.1", requirement: "Understanding the organisation and its context", completed: false, priority: "Critical" },
  { id: "14001-2", clause: "4.2", requirement: "Understanding the needs and expectations of interested parties", completed: false, priority: "Critical" },
  { id: "14001-3", clause: "4.4", requirement: "Environmental Management System established and maintained", completed: false, priority: "Critical" },
  { id: "14001-4", clause: "5.1", requirement: "Leadership commitment and environmental policy signed", completed: false, priority: "Critical" },
  { id: "14001-5", clause: "6.1", requirement: "Environmental aspects and impacts identified and evaluated", completed: false, priority: "Critical" },
  { id: "14001-6", clause: "6.2", requirement: "Environmental objectives and plans established", completed: true, priority: "Critical" },
  { id: "14001-7", clause: "7.2", requirement: "Competence requirements for environmental roles defined", completed: false, priority: "Important" },
  { id: "14001-8", clause: "7.4", requirement: "Internal and external communication procedures in place", completed: false, priority: "Important" },
  { id: "14001-9", clause: "8.1", requirement: "Operational controls for significant environmental aspects", completed: false, priority: "Critical" },
  { id: "14001-10", clause: "9.1", requirement: "Monitoring and measurement procedures established", completed: false, priority: "Important" },
  { id: "14001-11", clause: "9.2", requirement: "Internal audit programme planned and implemented", completed: false, priority: "Important" },
  { id: "14001-12", clause: "10.2", requirement: "Nonconformity and corrective action process in place", completed: false, priority: "Recommended" },
];

const INITIAL_ISO26000: IsoItem[] = [
  { id: "26000-1", clause: "4.2", requirement: "Accountability — accepts scrutiny and responds to it", completed: false, priority: "Critical" },
  { id: "26000-2", clause: "4.3", requirement: "Transparency — discloses decisions and activities", completed: false, priority: "Critical" },
  { id: "26000-3", clause: "4.4", requirement: "Ethical behaviour — honesty, equity, and integrity", completed: true, priority: "Critical" },
  { id: "26000-4", clause: "4.5", requirement: "Respect for stakeholder interests documented", completed: false, priority: "Important" },
  { id: "26000-5", clause: "4.6", requirement: "Respect for the rule of law — legal compliance", completed: true, priority: "Critical" },
  { id: "26000-6", clause: "4.7", requirement: "Respect for international norms of behaviour", completed: false, priority: "Important" },
  { id: "26000-7", clause: "4.8", requirement: "Respect for human rights — due diligence conducted", completed: false, priority: "Critical" },
  { id: "26000-8", clause: "6.3", requirement: "Human rights policy and grievance mechanism in place", completed: false, priority: "Critical" },
  { id: "26000-9", clause: "6.4", requirement: "Labour practices — fair wages, no forced labour", completed: false, priority: "Critical" },
  { id: "26000-10", clause: "6.5", requirement: "Environmental responsibility integrated into operations", completed: false, priority: "Important" },
  { id: "26000-11", clause: "6.6", requirement: "Fair operating practices — anti-corruption measures", completed: false, priority: "Important" },
  { id: "26000-12", clause: "6.7", requirement: "Consumer issues — health, safety, and data protection", completed: false, priority: "Recommended" },
  { id: "26000-13", clause: "6.8", requirement: "Community involvement and development programmes", completed: false, priority: "Recommended" },
];

const priorityColors: Record<string, string> = {
  Critical: "#ef4444",
  Important: "#f59e0b",
  Recommended: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#9ca3af",
  "Gap Analysis": "#f59e0b",
  "In Progress": "#3B85BA",
  "Under Review": "#7c3aed",
  "Certified": "#22c55e",
  "Lapsed": "#ef4444",
};

const CERT_NAMES = [
  "B Corp", "ISO 14001", "ISO 26000", "ISO 50001", "ISO 9001",
  "ISO 45001", "GRI Standards", "UN Global Compact",
  "Science Based Targets (SBTi)", "Carbon Neutral Certified", "Other",
] as const;

const CERT_STATUSES = [
  "Not Started", "Gap Analysis", "In Progress", "Under Review", "Certified", "Lapsed",
] as const;

function IsoChecklist({ title, standard, items, onToggle, color }: {
  title: string;
  standard: string;
  items: IsoItem[];
  onToggle: (id: string) => void;
  color: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const completed = items.filter(i => i.completed).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid #e5e7eb" : "none", background: "#f9fafb" }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Award size={16} style={{ color }} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{title}</div>
            <div className="text-xs text-gray-400 font-mono">{standard}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">{completed}/{items.length} requirements</div>
            <div className="text-sm font-bold font-mono" style={{ color }}>{pct}%</div>
          </div>
          <div className="w-24">
            <Progress value={pct} className="h-2" />
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onToggle(item.id)}
            >
              <div className="flex-shrink-0 mt-0.5" style={{ color: item.completed ? color : "#d1d5db" }}>
                {item.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-gray-400">{item.clause}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: `${priorityColors[item.priority]}15`, color: priorityColors[item.priority] }}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm" style={{ color: item.completed ? "#9ca3af" : "#374151", textDecoration: item.completed ? "line-through" : "none" }}>
                  {item.requirement}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function BCorpIso() {
  const { ventures } = useVentures();
  const [selectedVentureId, setSelectedVentureId] = useState<string>(ventures[0]?.id ?? "");
  const [iso14001, setIso14001] = useState<IsoItem[]>(INITIAL_ISO14001);
  const [iso26000, setIso26000] = useState<IsoItem[]>(INITIAL_ISO26000);
  const [expandedBia, setExpandedBia] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCertName, setNewCertName] = useState<typeof CERT_NAMES[number]>("B Corp");
  const [newCertStatus, setNewCertStatus] = useState<typeof CERT_STATUSES[number]>("Not Started");
  const [newBImpactScore, setNewBImpactScore] = useState<string>("");
  const [newProgressPct, setNewProgressPct] = useState<string>("0");

  const utils = trpc.useUtils();

  // DB-backed certifications for selected venture
  const { data: certifications, isLoading } = trpc.irl.getCertifications.useQuery(
    { ventureId: selectedVentureId },
    { enabled: !!selectedVentureId }
  );

  const upsertCert = trpc.irl.upsertCertification.useMutation({
    onSuccess: () => {
      utils.irl.getCertifications.invalidate({ ventureId: selectedVentureId });
      toast.success("Certification updated");
      setShowAddDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCert = trpc.irl.deleteCertification.useMutation({
    onSuccess: () => {
      utils.irl.getCertifications.invalidate({ ventureId: selectedVentureId });
      toast.success("Certification removed");
    },
    onError: (e) => toast.error(e.message),
  });

  // Find B Corp certification from DB
  const bCorpCert = (certifications as any[])?.find((c: any) => c.certificationName === "B Corp");
  const bImpactScore = bCorpCert?.bImpactScore ?? 0;
  const bCorpStatus = bCorpCert?.status ?? "Not Started";
  const bCorpEligible = bImpactScore >= 80;

  // B Impact sub-scores from DB
  const biaCategories = [
    { id: "governance", name: "Governance", maxScore: 20, score: bCorpCert?.bImpactGovernance ?? 4, description: "Mission, ethics, transparency, and accountability.", keyQuestions: ["Is social/environmental mission embedded in legal documents?", "Does the board include independent or stakeholder directors?", "Are financial statements publicly available?", "Is there a formal ethics and anti-corruption policy?"] },
    { id: "workers", name: "Workers", maxScore: 40, score: bCorpCert?.bImpactWorkers ?? 8, description: "Compensation, benefits, training, ownership, and workplace culture.", keyQuestions: ["Do all workers earn a living wage?", "Is there an ESOP or profit-sharing scheme?", "Are there formal training and development programmes?", "Is there a health and wellbeing policy?"] },
    { id: "community", name: "Community", maxScore: 40, score: bCorpCert?.bImpactCommunity ?? 6, description: "Suppliers, diversity, economic impact, civic engagement.", keyQuestions: ["Does the company source from local or minority-owned suppliers?", "Is there a formal diversity and inclusion policy?", "Does the company donate ≥1% of revenues to charity?", "Are there community engagement programmes?"] },
    { id: "environment", name: "Environment", maxScore: 20, score: bCorpCert?.bImpactEnvironment ?? 5, description: "Environmental management, carbon footprint, water use.", keyQuestions: ["Is there a formal environmental management system (ISO 14001)?", "Has the company measured its carbon footprint?", "Are there targets to reduce energy and water consumption?", "Does the supply chain have environmental standards?"] },
    { id: "customers", name: "Customers", maxScore: 20, score: bCorpCert?.bImpactCustomers ?? 3, description: "Product/service quality, data privacy, and customer impact.", keyQuestions: ["Does the product/service directly address a social or environmental need?", "Is there a formal customer data privacy policy?", "Are there mechanisms to measure customer social impact?", "Is there a customer complaints and redress process?"] },
  ];

  const totalScore = biaCategories.reduce((a, c) => a + c.score, 0);
  const maxScore = biaCategories.reduce((a, c) => a + c.maxScore, 0);

  const handleScoreChange = (field: string, value: number) => {
    if (!bCorpCert) return;
    const fieldMap: Record<string, string> = {
      governance: "bImpactGovernance",
      workers: "bImpactWorkers",
      community: "bImpactCommunity",
      environment: "bImpactEnvironment",
      customers: "bImpactCustomers",
    };
    const newScores = {
      bImpactGovernance: bCorpCert.bImpactGovernance ?? 4,
      bImpactWorkers: bCorpCert.bImpactWorkers ?? 8,
      bImpactCommunity: bCorpCert.bImpactCommunity ?? 6,
      bImpactEnvironment: bCorpCert.bImpactEnvironment ?? 5,
      bImpactCustomers: bCorpCert.bImpactCustomers ?? 3,
      [fieldMap[field]]: value,
    };
    const newTotal = Object.values(newScores).reduce((a, b) => a + b, 0);
    upsertCert.mutate({
      id: bCorpCert.id,
      ventureId: selectedVentureId,
      certificationName: "B Corp",
      bImpactScore: newTotal,
      ...newScores,
    });
  };

  const iso14001Pct = Math.round((iso14001.filter(i => i.completed).length / iso14001.length) * 100);
  const iso26000Pct = Math.round((iso26000.filter(i => i.completed).length / iso26000.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#f59e0b15", color: "#f59e0b" }}>
            Accreditation
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">B Corp & ISO Standards</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          B Corp & ISO Tracker
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          Track progress towards B Corp certification (minimum 80 points) and compliance with ISO 14001 and ISO 26000 — all persisted to the database.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* Venture selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Venture:</span>
          <div className="flex gap-2 flex-wrap">
            {ventures.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVentureId(v.id)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold border transition-all"
                style={{
                  background: selectedVentureId === v.id ? v.color : "white",
                  color: selectedVentureId === v.id ? "white" : v.color,
                  borderColor: v.color,
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : (
          <>
            {/* B Corp Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">B Impact Score</div>
                <div className="text-3xl font-bold font-mono" style={{ color: bCorpEligible ? "#22c55e" : "#f59e0b" }}>{totalScore}</div>
                <div className="text-xs text-gray-400">of {maxScore} maximum</div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">B Corp Status</div>
                <div className="text-base font-bold mt-1" style={{ color: STATUS_COLORS[bCorpStatus] ?? "#9ca3af" }}>
                  {bCorpStatus}
                </div>
                <div className="text-xs text-gray-400">{bCorpEligible ? "Score ≥ 80 achieved" : `${80 - totalScore} points to threshold`}</div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">ISO 14001</div>
                <div className="text-3xl font-bold font-mono" style={{ color: "#22c55e" }}>{iso14001Pct}%</div>
                <div className="text-xs text-gray-400">{iso14001.filter(i => i.completed).length}/{iso14001.length} requirements</div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">ISO 26000</div>
                <div className="text-3xl font-bold font-mono" style={{ color: "#1d4ed8" }}>{iso26000Pct}%</div>
                <div className="text-xs text-gray-400">{iso26000.filter(i => i.completed).length}/{iso26000.length} requirements</div>
              </div>
            </div>

            {/* DB Certification Tracker */}
            <div className="vos-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="vos-section-title">Certification Tracker</h2>
                  <p className="text-xs text-gray-400 mt-0.5">All certifications stored in the database — add, update, or remove records below.</p>
                </div>
                <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1.5">
                  <Plus size={13} /> Add Certification
                </Button>
              </div>

              {(!certifications || (certifications as any[]).length === 0) ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Award size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No certifications tracked yet.</p>
                  <p className="text-xs mt-1">Click "Add Certification" to start tracking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(certifications as any[]).map((cert: any) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: `${STATUS_COLORS[cert.status] ?? "#e5e7eb"}30`, background: `${STATUS_COLORS[cert.status] ?? "#9ca3af"}08` }}>
                      <div className="flex items-center gap-3">
                        <Award size={18} style={{ color: STATUS_COLORS[cert.status] ?? "#9ca3af" }} />
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{cert.certificationName}</div>
                          <div className="text-xs text-gray-400">
                            {cert.certifyingBody ? `${cert.certifyingBody} · ` : ""}
                            Progress: {cert.progressPercent ?? 0}%
                            {cert.bImpactScore ? ` · B Impact: ${cert.bImpactScore}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${STATUS_COLORS[cert.status] ?? "#9ca3af"}15`, color: STATUS_COLORS[cert.status] ?? "#9ca3af" }}>
                          {cert.status}
                        </span>
                        <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cert.progressPercent ?? 0}%`, background: STATUS_COLORS[cert.status] ?? "#9ca3af" }} />
                        </div>
                        <button
                          onClick={() => deleteCert.mutate({ id: cert.id })}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B Impact Assessment */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>B Impact Assessment</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bCorpCert ? "Scores are saved to the database. Click a category to view key questions." : "Add a 'B Corp' certification record above to enable score editing."}
                  </p>
                </div>
                <div className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{
                  background: bCorpEligible ? "#f0fdf4" : "#fffbeb",
                  color: bCorpEligible ? "#22c55e" : "#f59e0b",
                  border: `1px solid ${bCorpEligible ? "#bbf7d0" : "#fde68a"}`,
                }}>
                  {bCorpEligible ? "✓ Threshold reached" : `Target: 80 pts (${80 - totalScore} remaining)`}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {biaCategories.map(cat => {
                  const pct = Math.round((cat.score / cat.maxScore) * 100);
                  const isExpanded = expandedBia === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className="bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderColor: isExpanded ? "#22c55e" : "#e5e7eb", borderWidth: isExpanded ? 2 : 1 }}
                      onClick={() => setExpandedBia(isExpanded ? null : cat.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                          <Info size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-end gap-1 mb-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            min={0}
                            max={cat.maxScore}
                            value={cat.score}
                            disabled={!bCorpCert}
                            onChange={e => handleScoreChange(cat.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-2xl font-bold font-mono border-0 border-b-2 bg-transparent focus:outline-none text-center disabled:opacity-50"
                            style={{ color: "#22c55e", borderColor: "#22c55e" }}
                          />
                          <span className="text-sm text-gray-400 mb-1">/ {cat.maxScore}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 50 ? "#22c55e" : "#f59e0b" }} />
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{pct}%</div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: "#f3f4f6" }}>
                          <p className="text-xs text-gray-500 mb-3">{cat.description}</p>
                          <div className="space-y-1.5">
                            {cat.keyQuestions.map((q, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-gray-300 flex-shrink-0 mt-0.5">○</span>
                                <span className="text-xs text-gray-600">{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Total B Impact Score</span>
                  <span className="text-sm font-bold font-mono" style={{ color: bCorpEligible ? "#22c55e" : "#f59e0b" }}>{totalScore} / {maxScore}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(totalScore / maxScore) * 100}%`, background: bCorpEligible ? "#22c55e" : "#f59e0b" }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: `${(80 / maxScore) * 100}%` }} title="B Corp threshold (80 pts)" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">0</span>
                  <span className="text-xs text-gray-400">80 (threshold)</span>
                  <span className="text-xs text-gray-400">{maxScore}</span>
                </div>
              </div>
            </div>

            {/* ISO Checklists */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>ISO Standards Compliance</h2>
              <IsoChecklist
                title="ISO 14001 — Environmental Management System"
                standard="ISO 14001:2015"
                items={iso14001}
                onToggle={(id) => {
                  setIso14001(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
                  toast.success("ISO 14001 requirement updated");
                }}
                color="#22c55e"
              />
              <IsoChecklist
                title="ISO 26000 — Social Responsibility"
                standard="ISO 26000:2010"
                items={iso26000}
                onToggle={(id) => {
                  setIso26000(prev => prev.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
                  toast.success("ISO 26000 requirement updated");
                }}
                color="#1d4ed8"
              />
            </div>

            {/* Roadmap */}
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Accreditation Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { phase: "Phase 1 — Foundation", timeline: "Months 1–6", color: "#22c55e", items: ["Complete B Impact Assessment baseline", "Implement ISO 14001 environmental policy", "Establish ESOP and living wage policy", "Register as Community Interest Company (CIC)"] },
                  { phase: "Phase 2 — Verification", timeline: "Months 7–12", color: "#f59e0b", items: ["Achieve B Impact score ≥ 80", "Complete ISO 14001 internal audit", "Submit B Corp application to B Lab", "Engage third-party ISO 26000 assessment"] },
                  { phase: "Phase 3 — Certification", timeline: "Year 2", color: "#1d4ed8", items: ["B Corp certification awarded", "ISO 14001 external audit and certification", "Publish first annual impact report", "Join B Corp community and global network"] },
                ].map(phase => (
                  <div key={phase.phase} className="rounded-lg p-4" style={{ background: `${phase.color}08`, border: `1px solid ${phase.color}25` }}>
                    <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: phase.color }}>{phase.phase}</div>
                    <div className="text-xs text-gray-400 font-mono mb-3">{phase.timeline}</div>
                    <ul className="space-y-1.5">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="flex-shrink-0 mt-0.5" style={{ color: phase.color }}>→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Certification Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Certification</Label>
              <Select value={newCertName} onValueChange={(v) => setNewCertName(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERT_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newCertStatus} onValueChange={(v) => setNewCertStatus(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress (%)</Label>
              <Input type="number" min={0} max={100} value={newProgressPct} onChange={e => setNewProgressPct(e.target.value)} className="mt-1" />
            </div>
            {newCertName === "B Corp" && (
              <div>
                <Label>B Impact Score (0–140)</Label>
                <Input type="number" min={0} max={140} value={newBImpactScore} onChange={e => setNewBImpactScore(e.target.value)} className="mt-1" placeholder="e.g. 80" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                upsertCert.mutate({
                  ventureId: selectedVentureId,
                  certificationName: newCertName,
                  status: newCertStatus,
                  progressPercent: parseInt(newProgressPct) || 0,
                  ...(newCertName === "B Corp" && newBImpactScore ? { bImpactScore: parseInt(newBImpactScore) } : {}),
                });
              }}
              disabled={upsertCert.isPending}
            >
              {upsertCert.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
