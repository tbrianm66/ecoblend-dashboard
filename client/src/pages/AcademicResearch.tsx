// ============================================================
// ACADEMIC RESEARCH & EVIDENCE MODULE — DATABASE-BACKED
// Design: Venture OS — Apple-style clarity, Inter font, 8px grid
// Sections: Research Papers · Fellow Researchers ·
//           University Partnerships · Evidence Claims
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BookOpen, Users, Building2, BarChart2,
  Plus, Search, ExternalLink, Trash2,
  GraduationCap, Globe, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, TrendingUp,
  FlaskConical, Star, Link2, FileText,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ResearchPaper = {
  id: number;
  title: string;
  authors: string;
  journal?: string | null;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
  abstract?: string | null;
  keywords?: string | null;
  category?: string | null;
  evidenceType?: string | null;
  relevanceScore?: number | null;
  ventureIds?: string | null;
  trlLevelsSupported?: string | null;
  vrlStagesSupported?: string | null;
  notes?: string | null;
  addedBy?: string | null;
};

type FellowResearcher = {
  id: number;
  name: string;
  title?: string | null;
  institution?: string | null;
  department?: string | null;
  specialisation?: string | null;
  email?: string | null;
  linkedIn?: string | null;
  orcid?: string | null;
  collaborationType?: string | null;
  status?: string | null;
  ventureIds?: string | null;
  bio?: string | null;
  publications?: number | null;
};

type UniversityPartnership = {
  id: number;
  universityName: string;
  country?: string | null;
  department?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  partnershipType?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  ventureIds?: string | null;
  fundingLinked?: boolean | null;
  fundingAmount?: number | null;
};

type EvidenceClaim = {
  id: number;
  ventureId: string;
  paperId?: number | null;
  claimText: string;
  claimType?: string | null;
  trlLevel?: number | null;
  vrlStage?: number | null;
  strength?: string | null;
  notes?: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "VRL Framework", "TRL Framework", "Lean Methodology", "Social Enterprise",
  "Impact Investing", "Circular Economy", "Sports Technology", "Eco Materials",
  "Venture Building", "University Spin-out", "Other",
] as const;

const EVIDENCE_TYPES = [
  "Peer Reviewed", "Conference Paper", "Thesis", "Industry Report",
  "Government Report", "Book Chapter", "Working Paper",
] as const;

const COLLAB_TYPES = [
  "Academic Advisor", "Co-Researcher", "Industry Fellow",
  "Visiting Scholar", "PhD Supervisor", "Peer Reviewer", "Consultant",
] as const;

const PARTNERSHIP_TYPES = [
  "Research Collaboration", "Spin-out Support", "Knowledge Transfer",
  "Student Placement", "Grant Co-applicant", "Advisory Board", "MoU",
] as const;

const CLAIM_TYPES = [
  "Market Validation", "Technology Feasibility", "Social Impact",
  "Competitive Advantage", "Regulatory Compliance", "Financial Model",
  "Team Capability", "Methodology Support",
] as const;

const VENTURE_LABELS: Record<string, string> = {
  ecoblend: "EcoBlend",
  tone: "TONE",
  real: "REAL",
  pipe: "PIPE",
  bebus: "BEBUS",
};

const VENTURE_COLORS: Record<string, string> = {
  ecoblend: "#51AF37",
  tone: "#F49C13",
  real: "#3A97D3",
  pipe: "#8b5cf6",
  bebus: "#ef4444",
};

const CATEGORY_COLOURS: Record<string, string> = {
  "VRL Framework": "#51AF37",
  "TRL Framework": "#3A97D3",
  "Lean Methodology": "#F49C13",
  "Social Enterprise": "#8b5cf6",
  "Impact Investing": "#d97706",
  "Circular Economy": "#51AF37",
  "Sports Technology": "#ef4444",
  "Eco Materials": "#06b6d4",
  "Venture Building": "#F49C13",
  "University Spin-out": "#1d4ed8",
  "Other": "#6b7280",
};

// ── Helper components ─────────────────────────────────────────────────────────
function RelevanceDot({ score }: { score: number | null | undefined }) {
  const s = score ?? 5;
  const color = s >= 8 ? "#51AF37" : s >= 5 ? "#F49C13" : "#ef4444";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {s}/10
    </span>
  );
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status ?? "Prospective";
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "#51AF3715", color: "#51AF37" },
    Prospective: { bg: "#3A97D315", color: "#3A97D3" },
    Past: { bg: "#6b728015", color: "#6b7280" },
    Completed: { bg: "#51AF3715", color: "#51AF37" },
    Paused: { bg: "#F49C1315", color: "#F49C13" },
  };
  const style = map[s] ?? { bg: "#6b728015", color: "#6b7280" };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color }}>
      {s}
    </span>
  );
}

function StrengthBadge({ strength }: { strength: string | null | undefined }) {
  const s = strength ?? "Moderate";
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    Strong: { bg: "#51AF3715", color: "#51AF37", icon: <CheckCircle2 size={11} /> },
    Moderate: { bg: "#F49C1315", color: "#F49C13", icon: <AlertCircle size={11} /> },
    Weak: { bg: "#ef444415", color: "#ef4444", icon: <Clock size={11} /> },
  };
  const style = map[s] ?? map.Moderate;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color }}>
      {style.icon} {s}
    </span>
  );
}

function VentureTags({ ventureIds }: { ventureIds: string | null | undefined }) {
  if (!ventureIds) return null;
  const ids = ventureIds.split(",").map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map(id => (
        <span key={id} className="text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${VENTURE_COLORS[id] ?? "#6b7280"}18`, color: VENTURE_COLORS[id] ?? "#6b7280" }}>
          {VENTURE_LABELS[id] ?? id}
        </span>
      ))}
    </div>
  );
}

// ── SECTION: Research Papers ──────────────────────────────────────────────────
function PapersSection() {
  const { data: papers = [], refetch } = trpc.academic.listPapers.useQuery();
  const addPaper = trpc.academic.addPaper.useMutation({
    onSuccess: () => { refetch(); toast.success("Paper added to library"); setShowAdd(false); resetForm(); }
  });
  const deletePaper = trpc.academic.deletePaper.useMutation({
    onSuccess: () => { refetch(); toast.success("Paper removed"); }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", authors: "", journal: "", year: "", doi: "", url: "",
    abstract: "", keywords: "", category: "Other", evidenceType: "Peer Reviewed",
    relevanceScore: "7", ventureIds: "", trlLevelsSupported: "", vrlStagesSupported: "",
    notes: "", addedBy: "",
  });

  const resetForm = () => setForm({
    title: "", authors: "", journal: "", year: "", doi: "", url: "",
    abstract: "", keywords: "", category: "Other", evidenceType: "Peer Reviewed",
    relevanceScore: "7", ventureIds: "", trlLevelsSupported: "", vrlStagesSupported: "",
    notes: "", addedBy: "",
  });

  const filtered = useMemo(() =>
    papers.filter(p => {
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authors.toLowerCase().includes(search.toLowerCase()) ||
        (p.journal ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || p.category === filterCategory;
      return matchSearch && matchCat;
    }), [papers, search, filterCategory]);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.authors.trim()) { toast.error("Title and authors are required"); return; }
    addPaper.mutate({
      title: form.title, authors: form.authors,
      journal: form.journal || undefined, year: form.year ? parseInt(form.year) : undefined,
      doi: form.doi || undefined, url: form.url || undefined,
      abstract: form.abstract || undefined, keywords: form.keywords || undefined,
      category: form.category as any, evidenceType: form.evidenceType as any,
      relevanceScore: parseInt(form.relevanceScore),
      ventureIds: form.ventureIds || undefined,
      trlLevelsSupported: form.trlLevelsSupported || undefined,
      vrlStagesSupported: form.vrlStagesSupported || undefined,
      notes: form.notes || undefined, addedBy: form.addedBy || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3A97D315" }}>
            <BookOpen size={16} style={{ color: "#3A97D3" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Research Papers</h2>
            <p className="text-xs text-gray-400">{papers.length} papers · {papers.filter(p => p.evidenceType === "Peer Reviewed").length} peer reviewed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input className="pl-8 h-8 text-xs w-44" placeholder="Search papers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowAdd(true)}
            style={{ background: "#3A97D3", color: "white" }}>
            <Plus size={13} /> Add Paper
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          {papers.length === 0
            ? "No research papers yet. Add your first citation to build the evidence library."
            : "No papers match your filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(paper => {
            const catColor = CATEGORY_COLOURS[paper.category ?? "Other"] ?? "#6b7280";
            return (
              <div key={paper.id} className="vos-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {paper.category && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${catColor}15`, color: catColor }}>
                              {paper.category}
                            </span>
                          )}
                          {paper.evidenceType && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5" style={{ borderColor: "#3A97D340", color: "#3A97D3" }}>
                              {paper.evidenceType}
                            </Badge>
                          )}
                          {paper.year && <span className="text-xs text-gray-400">{paper.year}</span>}
                          <RelevanceDot score={paper.relevanceScore} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {paper.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{paper.authors}</p>
                        {paper.journal && <p className="text-xs text-gray-400 italic mt-0.5">{paper.journal}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {paper.trlLevelsSupported && paper.trlLevelsSupported.split(",").map(l => (
                        <span key={l} className="text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          style={{ background: "#1d4ed815", color: "#1d4ed8" }}>
                          <FlaskConical size={9} /> TRL {l.trim()}
                        </span>
                      ))}
                      {paper.vrlStagesSupported && paper.vrlStagesSupported.split(",").map(l => (
                        <span key={l} className="text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          style={{ background: "#51AF3715", color: "#51AF37" }}>
                          <TrendingUp size={9} /> VRL {l.trim()}
                        </span>
                      ))}
                    </div>
                    {paper.ventureIds && <div className="mt-2"><VentureTags ventureIds={paper.ventureIds} /></div>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {paper.url && (
                      <a href={paper.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0"><ExternalLink size={12} /></Button>
                      </a>
                    )}
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                      onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}>
                      {expandedId === paper.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                      onClick={() => { if (confirm("Remove this paper?")) deletePaper.mutate({ id: paper.id }); }}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>

                {expandedId === paper.id && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "#e5e7eb" }}>
                    {paper.abstract && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Abstract</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{paper.abstract}</p>
                      </div>
                    )}
                    {paper.doi && <p className="text-xs text-gray-400">DOI: <span className="font-mono">{paper.doi}</span></p>}
                    {paper.keywords && <p className="text-xs text-gray-400">Keywords: {paper.keywords}</p>}
                    {paper.notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-xs text-gray-600">{paper.notes}</p>
                      </div>
                    )}
                    {paper.addedBy && <p className="text-xs text-gray-400">Added by: {paper.addedBy}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen size={16} style={{ color: "#3A97D3" }} /> Add Research Paper
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Title *</label>
              <Input className="text-sm" placeholder="Full paper title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Authors *</label>
              <Input className="text-sm" placeholder="e.g. Smith, J., Jones, A." value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Journal / Publisher</label>
                <Input className="text-sm" placeholder="Journal name" value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Year</label>
                <Input className="text-sm" type="number" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">DOI</label>
                <Input className="text-sm" placeholder="10.xxxx/xxxxx" value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">URL</label>
                <Input className="text-sm" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Abstract</label>
              <Textarea className="text-sm" rows={3} placeholder="Paper abstract..." value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Type</label>
                <Select value={form.evidenceType} onValueChange={v => setForm(f => ({ ...f, evidenceType: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVIDENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Relevance (1–10)</label>
                <Input className="text-sm" type="number" min={1} max={10} value={form.relevanceScore} onChange={e => setForm(f => ({ ...f, relevanceScore: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">TRL Levels (e.g. 3,4)</label>
                <Input className="text-sm" placeholder="3,4,5" value={form.trlLevelsSupported} onChange={e => setForm(f => ({ ...f, trlLevelsSupported: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">VRL Stages (e.g. 1,2)</label>
                <Input className="text-sm" placeholder="1,2" value={form.vrlStagesSupported} onChange={e => setForm(f => ({ ...f, vrlStagesSupported: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Venture IDs (e.g. ecoblend,tone)</label>
              <Input className="text-sm" placeholder="ecoblend,tone,real,pipe,bebus" value={form.ventureIds} onChange={e => setForm(f => ({ ...f, ventureIds: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Keywords</label>
              <Input className="text-sm" placeholder="comma-separated keywords" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Internal Notes</label>
              <Textarea className="text-sm" rows={2} placeholder="How this paper supports the venture..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Added By</label>
              <Input className="text-sm" placeholder="Your name" value={form.addedBy} onChange={e => setForm(f => ({ ...f, addedBy: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={addPaper.isPending}
                style={{ background: "#3A97D3", color: "white" }}>
                {addPaper.isPending ? "Adding..." : "Add Paper"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── SECTION: Fellow Researchers ───────────────────────────────────────────────
function FellowsSection() {
  const { data: fellows = [], refetch } = trpc.academic.listFellows.useQuery();
  const addFellow = trpc.academic.addFellow.useMutation({
    onSuccess: () => { refetch(); toast.success("Fellow researcher added"); setShowAdd(false); resetForm(); }
  });
  const deleteFellow = trpc.academic.deleteFellow.useMutation({
    onSuccess: () => { refetch(); toast.success("Fellow removed"); }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", title: "", institution: "", department: "", specialisation: "",
    email: "", linkedIn: "", orcid: "", collaborationType: "Academic Advisor",
    status: "Active", ventureIds: "", bio: "", publications: "0",
  });

  const resetForm = () => setForm({
    name: "", title: "", institution: "", department: "", specialisation: "",
    email: "", linkedIn: "", orcid: "", collaborationType: "Academic Advisor",
    status: "Active", ventureIds: "", bio: "", publications: "0",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    addFellow.mutate({
      name: form.name, title: form.title || undefined, institution: form.institution || undefined,
      department: form.department || undefined, specialisation: form.specialisation || undefined,
      email: form.email || undefined, linkedIn: form.linkedIn || undefined, orcid: form.orcid || undefined,
      collaborationType: form.collaborationType as any, status: form.status as any,
      ventureIds: form.ventureIds || undefined, bio: form.bio || undefined,
      publications: parseInt(form.publications) || 0,
    });
  };

  const COLLAB_COLOURS: Record<string, string> = {
    "Academic Advisor": "#51AF37", "Co-Researcher": "#3A97D3",
    "Industry Fellow": "#F49C13", "Visiting Scholar": "#8b5cf6",
    "PhD Supervisor": "#1d4ed8", "Peer Reviewer": "#06b6d4", "Consultant": "#d97706",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F49C1315" }}>
            <Users size={16} style={{ color: "#F49C13" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Fellow Researchers</h2>
            <p className="text-xs text-gray-400">{fellows.length} academic collaborators · {fellows.filter(f => f.status === "Active").length} active</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowAdd(true)}
          style={{ background: "#F49C13", color: "white" }}>
          <Plus size={13} /> Add Fellow
        </Button>
      </div>

      {fellows.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          No fellow researchers yet. Add academic collaborators to strengthen credibility.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fellows.map(fellow => {
            const collabColor = COLLAB_COLOURS[fellow.collaborationType ?? "Academic Advisor"] ?? "#6b7280";
            return (
              <div key={fellow.id} className="vos-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                      style={{ background: collabColor }}>
                      {fellow.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>{fellow.name}</h3>
                      {fellow.title && <p className="text-xs text-gray-500">{fellow.title}</p>}
                      {fellow.institution && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <GraduationCap size={10} /> {fellow.institution}
                          {fellow.department && ` · ${fellow.department}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={fellow.status} />
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                      onClick={() => { if (confirm("Remove this fellow?")) deleteFellow.mutate({ id: fellow.id }); }}>
                      <Trash2 size={10} />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {fellow.collaborationType && (
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${collabColor}15`, color: collabColor }}>
                      {fellow.collaborationType}
                    </span>
                  )}
                  {fellow.specialisation && <p className="text-xs text-gray-500">{fellow.specialisation}</p>}
                  {fellow.bio && <p className="text-xs text-gray-400 leading-relaxed">{fellow.bio}</p>}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {fellow.publications != null && fellow.publications > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FileText size={10} /> {fellow.publications} publications
                      </span>
                    )}
                    {fellow.orcid && (
                      <a href={`https://orcid.org/${fellow.orcid}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center gap-1">
                        <Globe size={10} /> ORCID
                      </a>
                    )}
                    {fellow.email && (
                      <a href={`mailto:${fellow.email}`} className="text-xs text-blue-500 hover:underline">{fellow.email}</a>
                    )}
                    {fellow.linkedIn && (
                      <a href={fellow.linkedIn} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                        <Link2 size={10} /> LinkedIn
                      </a>
                    )}
                  </div>
                  {fellow.ventureIds && <div className="pt-1"><VentureTags ventureIds={fellow.ventureIds} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={16} style={{ color: "#F49C13" }} /> Add Fellow Researcher
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
              <Input className="text-sm" placeholder="Dr. Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Academic Title</label>
                <Input className="text-sm" placeholder="Professor / Dr." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Publications Count</label>
                <Input className="text-sm" type="number" min={0} value={form.publications} onChange={e => setForm(f => ({ ...f, publications: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Institution</label>
                <Input className="text-sm" placeholder="University name" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                <Input className="text-sm" placeholder="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Specialisation</label>
              <Input className="text-sm" placeholder="Research area / expertise" value={form.specialisation} onChange={e => setForm(f => ({ ...f, specialisation: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Collaboration Type</label>
                <Select value={form.collaborationType} onValueChange={v => setForm(f => ({ ...f, collaborationType: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{COLLAB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Active", "Prospective", "Past"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                <Input className="text-sm" type="email" placeholder="email@university.ac.uk" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">ORCID</label>
                <Input className="text-sm" placeholder="0000-0000-0000-0000" value={form.orcid} onChange={e => setForm(f => ({ ...f, orcid: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">LinkedIn URL</label>
              <Input className="text-sm" placeholder="https://linkedin.com/in/..." value={form.linkedIn} onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ventures Supported</label>
              <Input className="text-sm" placeholder="ecoblend,tone,real" value={form.ventureIds} onChange={e => setForm(f => ({ ...f, ventureIds: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio / Notes</label>
              <Textarea className="text-sm" rows={2} placeholder="Brief bio or collaboration context..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={addFellow.isPending}
                style={{ background: "#F49C13", color: "white" }}>
                {addFellow.isPending ? "Adding..." : "Add Fellow"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── SECTION: University Partnerships ─────────────────────────────────────────
function PartnershipsSection() {
  const { data: partnerships = [], refetch } = trpc.academic.listPartnerships.useQuery();
  const addPartnership = trpc.academic.addPartnership.useMutation({
    onSuccess: () => { refetch(); toast.success("Partnership added"); setShowAdd(false); resetForm(); }
  });
  const deletePartnership = trpc.academic.deletePartnership.useMutation({
    onSuccess: () => { refetch(); toast.success("Partnership removed"); }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    universityName: "", country: "", department: "", contactName: "", contactEmail: "",
    partnershipType: "Research Collaboration", status: "Prospective",
    startDate: "", endDate: "", description: "", ventureIds: "",
    fundingLinked: false, fundingAmount: "0",
  });

  const resetForm = () => setForm({
    universityName: "", country: "", department: "", contactName: "", contactEmail: "",
    partnershipType: "Research Collaboration", status: "Prospective",
    startDate: "", endDate: "", description: "", ventureIds: "",
    fundingLinked: false, fundingAmount: "0",
  });

  const handleSubmit = () => {
    if (!form.universityName.trim()) { toast.error("University name is required"); return; }
    addPartnership.mutate({
      universityName: form.universityName, country: form.country || undefined,
      department: form.department || undefined, contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined, partnershipType: form.partnershipType as any,
      status: form.status as any, startDate: form.startDate || undefined, endDate: form.endDate || undefined,
      description: form.description || undefined, ventureIds: form.ventureIds || undefined,
      fundingLinked: form.fundingLinked, fundingAmount: parseInt(form.fundingAmount) || 0,
    });
  };

  const statusColors: Record<string, string> = {
    Active: "#51AF37", Prospective: "#3A97D3", Completed: "#6b7280", Paused: "#F49C13",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#51AF3715" }}>
            <Building2 size={16} style={{ color: "#51AF37" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>University Partnerships</h2>
            <p className="text-xs text-gray-400">{partnerships.length} institutional collaborations · {partnerships.filter(p => p.status === "Active").length} active</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowAdd(true)}
          style={{ background: "#51AF37", color: "white" }}>
          <Plus size={13} /> Add Partnership
        </Button>
      </div>

      {partnerships.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          No university partnerships yet. Add institutional collaborations to demonstrate academic credibility.
        </div>
      ) : (
        <div className="space-y-3">
          {partnerships.map(p => {
            const statusColor = statusColors[p.status ?? "Prospective"] ?? "#3A97D3";
            return (
              <div key={p.id} className="vos-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${statusColor}15`, color: statusColor }}>
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>{p.universityName}</h3>
                      {p.department && <p className="text-xs text-gray-500">{p.department}</p>}
                      {p.country && <p className="text-xs text-gray-400 flex items-center gap-1"><Globe size={10} /> {p.country}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                      onClick={() => { if (confirm("Remove this partnership?")) deletePartnership.mutate({ id: p.id }); }}>
                      <Trash2 size={10} />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.partnershipType && (
                      <Badge variant="outline" className="text-xs" style={{ borderColor: "#51AF3740", color: "#51AF37" }}>
                        {p.partnershipType}
                      </Badge>
                    )}
                    {p.fundingLinked && p.fundingAmount && p.fundingAmount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#F49C1315", color: "#F49C13" }}>
                        £{p.fundingAmount.toLocaleString()} linked
                      </span>
                    )}
                    {p.startDate && (
                      <span className="text-xs text-gray-400">
                        {p.startDate}{p.endDate ? ` → ${p.endDate}` : " (ongoing)"}
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>}
                  {p.contactName && (
                    <p className="text-xs text-gray-400">
                      Contact: {p.contactName}
                      {p.contactEmail && <> · <a href={`mailto:${p.contactEmail}`} className="text-blue-500 hover:underline">{p.contactEmail}</a></>}
                    </p>
                  )}
                  {p.ventureIds && <div className="pt-1"><VentureTags ventureIds={p.ventureIds} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 size={16} style={{ color: "#51AF37" }} /> Add University Partnership
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">University Name *</label>
              <Input className="text-sm" placeholder="e.g. University of Manchester" value={form.universityName} onChange={e => setForm(f => ({ ...f, universityName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Country</label>
                <Input className="text-sm" placeholder="UK" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                <Input className="text-sm" placeholder="Business School" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Partnership Type</label>
                <Select value={form.partnershipType} onValueChange={v => setForm(f => ({ ...f, partnershipType: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{PARTNERSHIP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Active", "Prospective", "Completed", "Paused"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Name</label>
                <Input className="text-sm" placeholder="Prof. John Smith" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Email</label>
                <Input className="text-sm" type="email" placeholder="j.smith@uni.ac.uk" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Date</label>
                <Input className="text-sm" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">End Date</label>
                <Input className="text-sm" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <Textarea className="text-sm" rows={2} placeholder="Nature of the collaboration..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ventures</label>
                <Input className="text-sm" placeholder="ecoblend,tone" value={form.ventureIds} onChange={e => setForm(f => ({ ...f, ventureIds: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Funding Linked (£)</label>
                <Input className="text-sm" type="number" min={0} value={form.fundingAmount}
                  onChange={e => setForm(f => ({ ...f, fundingAmount: e.target.value, fundingLinked: parseInt(e.target.value) > 0 }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={addPartnership.isPending}
                style={{ background: "#51AF37", color: "white" }}>
                {addPartnership.isPending ? "Adding..." : "Add Partnership"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── SECTION: Evidence Claims ──────────────────────────────────────────────────
function EvidenceClaimsSection({ papers }: { papers: ResearchPaper[] }) {
  const { data: claims = [], refetch } = trpc.academic.listClaims.useQuery();
  const addClaim = trpc.academic.addClaim.useMutation({
    onSuccess: () => { refetch(); toast.success("Evidence claim added"); setShowAdd(false); resetForm(); }
  });
  const deleteClaim = trpc.academic.deleteClaim.useMutation({
    onSuccess: () => { refetch(); toast.success("Claim removed"); }
  });

  const [showAdd, setShowAdd] = useState(false);
  const [filterVenture, setFilterVenture] = useState("all");
  const [form, setForm] = useState({
    ventureId: "ecoblend", paperId: "", claimText: "",
    claimType: "Market Validation", trlLevel: "", vrlStage: "",
    strength: "Moderate", notes: "",
  });

  const resetForm = () => setForm({
    ventureId: "ecoblend", paperId: "", claimText: "",
    claimType: "Market Validation", trlLevel: "", vrlStage: "",
    strength: "Moderate", notes: "",
  });

  const filtered = filterVenture === "all" ? claims : claims.filter(c => c.ventureId === filterVenture);

  const paperMap = useMemo(() => {
    const m: Record<number, ResearchPaper> = {};
    papers.forEach(p => { m[p.id] = p; });
    return m;
  }, [papers]);

  const handleSubmit = () => {
    if (!form.claimText.trim()) { toast.error("Claim text is required"); return; }
    addClaim.mutate({
      ventureId: form.ventureId, paperId: form.paperId ? parseInt(form.paperId) : undefined,
      claimText: form.claimText, claimType: form.claimType as any,
      trlLevel: form.trlLevel ? parseInt(form.trlLevel) : undefined,
      vrlStage: form.vrlStage ? parseInt(form.vrlStage) : undefined,
      strength: form.strength as any, notes: form.notes || undefined,
    });
  };

  // Group claims by venture for the evidence map view
  const claimsByVenture = useMemo(() => {
    const groups: Record<string, EvidenceClaim[]> = {};
    claims.forEach(c => {
      if (!groups[c.ventureId]) groups[c.ventureId] = [];
      groups[c.ventureId].push(c);
    });
    return groups;
  }, [claims]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#8b5cf615" }}>
            <BarChart2 size={16} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Evidence Claims</h2>
            <p className="text-xs text-gray-400">Map research to specific VRL/TRL claims per venture</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterVenture} onValueChange={setFilterVenture}>
            <SelectTrigger className="text-xs h-8 w-36"><SelectValue placeholder="All ventures" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ventures</SelectItem>
              {Object.entries(VENTURE_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowAdd(true)}
            style={{ background: "#8b5cf6", color: "white" }}>
            <Plus size={13} /> Add Claim
          </Button>
        </div>
      </div>

      {/* Evidence map overview when showing all ventures */}
      {filterVenture === "all" && Object.keys(claimsByVenture).length > 0 && (
        <div className="mb-6 vos-panel">
          <h3 className="text-sm font-bold text-gray-700 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Evidence Map Overview</h3>
          <div className="space-y-3">
            {Object.entries(claimsByVenture).map(([ventureId, vClaims]) => {
              const strong = vClaims.filter(c => c.strength === "Strong").length;
              const moderate = vClaims.filter(c => c.strength === "Moderate").length;
              const color = VENTURE_COLORS[ventureId] ?? "#6b7280";
              return (
                <div key={ventureId} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-16 shrink-0" style={{ color }}>{VENTURE_LABELS[ventureId] ?? ventureId}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((vClaims.length / 10) * 100, 100)}%`, background: color }} />
                  </div>
                  <span className="text-xs text-gray-400 w-24 shrink-0">
                    {vClaims.length} claims · {strong} strong
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
          {claims.length === 0
            ? "No evidence claims yet. Link research papers to specific VRL/TRL claims to build your evidence map."
            : "No claims for the selected venture."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(claim => {
            const paper = claim.paperId ? paperMap[claim.paperId] : null;
            return (
              <div key={claim.id} className="vos-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ background: `${VENTURE_COLORS[claim.ventureId] ?? "#6b7280"}18`, color: VENTURE_COLORS[claim.ventureId] ?? "#6b7280" }}>
                        {VENTURE_LABELS[claim.ventureId] ?? claim.ventureId}
                      </span>
                      {claim.claimType && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5 text-gray-500">{claim.claimType}</Badge>
                      )}
                      <StrengthBadge strength={claim.strength} />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {claim.claimText}
                    </p>
                    {paper && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <BookOpen size={10} />
                        <span className="italic">{paper.title}</span>
                        {paper.year && <span>({paper.year})</span>}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {claim.trlLevel && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          style={{ background: "#1d4ed815", color: "#1d4ed8" }}>
                          <FlaskConical size={9} /> TRL {claim.trlLevel}
                        </span>
                      )}
                      {claim.vrlStage && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          style={{ background: "#51AF3715", color: "#51AF37" }}>
                          <TrendingUp size={9} /> VRL Stage {claim.vrlStage}
                        </span>
                      )}
                    </div>
                    {claim.notes && <p className="text-xs text-gray-400 mt-1.5">{claim.notes}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0"
                    onClick={() => { if (confirm("Remove this claim?")) deleteClaim.mutate({ id: claim.id }); }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 size={16} style={{ color: "#8b5cf6" }} /> Add Evidence Claim
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Venture *</label>
                <Select value={form.ventureId} onValueChange={v => setForm(f => ({ ...f, ventureId: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VENTURE_LABELS).map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Supporting Paper</label>
                <Select value={form.paperId} onValueChange={v => setForm(f => ({ ...f, paperId: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select paper..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {papers.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title.length > 40 ? p.title.slice(0, 40) + "…" : p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Claim Text *</label>
              <Textarea className="text-sm" rows={3} placeholder="Specific claim this evidence supports..." value={form.claimText} onChange={e => setForm(f => ({ ...f, claimText: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Claim Type</label>
                <Select value={form.claimType} onValueChange={v => setForm(f => ({ ...f, claimType: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Evidence Strength</label>
                <Select value={form.strength} onValueChange={v => setForm(f => ({ ...f, strength: v }))}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Strong", "Moderate", "Weak"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">TRL Level (1–9)</label>
                <Input className="text-sm" type="number" min={1} max={9} placeholder="e.g. 4" value={form.trlLevel} onChange={e => setForm(f => ({ ...f, trlLevel: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">VRL Stage (1–4)</label>
                <Input className="text-sm" type="number" min={1} max={4} placeholder="e.g. 2" value={form.vrlStage} onChange={e => setForm(f => ({ ...f, vrlStage: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
              <Textarea className="text-sm" rows={2} placeholder="Additional context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={addClaim.isPending}
                style={{ background: "#8b5cf6", color: "white" }}>
                {addClaim.isPending ? "Adding..." : "Add Claim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type Tab = "papers" | "fellows" | "partnerships" | "claims";

export default function AcademicResearch() {
  const [activeTab, setActiveTab] = useState<Tab>("papers");
  const { data: papers = [] } = trpc.academic.listPapers.useQuery();
  const { data: fellows = [] } = trpc.academic.listFellows.useQuery();
  const { data: partnerships = [] } = trpc.academic.listPartnerships.useQuery();
  const { data: claims = [] } = trpc.academic.listClaims.useQuery();

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number; accent: string }[] = [
    { id: "papers", label: "Research Papers", icon: <BookOpen size={14} />, count: papers.length, accent: "#3A97D3" },
    { id: "fellows", label: "Fellow Researchers", icon: <Users size={14} />, count: fellows.length, accent: "#F49C13" },
    { id: "partnerships", label: "University Partnerships", icon: <Building2 size={14} />, count: partnerships.length, accent: "#51AF37" },
    { id: "claims", label: "Evidence Claims", icon: <BarChart2 size={14} />, count: claims.length, accent: "#8b5cf6" },
  ];

  const strongClaims = claims.filter(c => c.strength === "Strong").length;
  const activeFellows = fellows.filter(f => f.status === "Active").length;
  const activePartnerships = partnerships.filter(p => p.status === "Active").length;
  const peerReviewed = papers.filter(p => p.evidenceType === "Peer Reviewed").length;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="vos-page-header">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem", letterSpacing: "0.07em" }}>
                ACADEMIC EVIDENCE
              </span>
              <span className="text-xs text-gray-400 font-mono">Research Library</span>
            </div>
            <h1 className="vos-page-title">Academic Research &amp; Evidence</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
              Curate peer-reviewed literature, fellow researcher profiles, university partnerships,
              and evidence claims that underpin VRL/TRL readiness scores across the EcoRace Studio portfolio.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#3A97D315" }}>
            <GraduationCap size={20} style={{ color: "#3A97D3" }} />
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="vos-metric">
            <span className="vos-metric-label">Research Papers</span>
            <span className="vos-metric-value" style={{ color: "#3A97D3" }}>{papers.length}</span>
            <span className="vos-metric-sub">{peerReviewed} peer reviewed</span>
          </div>
          <div className="vos-metric">
            <span className="vos-metric-label">Fellow Researchers</span>
            <span className="vos-metric-value" style={{ color: "#F49C13" }}>{fellows.length}</span>
            <span className="vos-metric-sub">{activeFellows} active</span>
          </div>
          <div className="vos-metric">
            <span className="vos-metric-label">University Partners</span>
            <span className="vos-metric-value" style={{ color: "#51AF37" }}>{partnerships.length}</span>
            <span className="vos-metric-sub">{activePartnerships} active</span>
          </div>
          <div className="vos-metric">
            <span className="vos-metric-label">Evidence Claims</span>
            <span className="vos-metric-value" style={{ color: "#8b5cf6" }}>{claims.length}</span>
            <span className="vos-metric-sub">{strongClaims} strong</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px"
              style={{
                borderBottomColor: activeTab === tab.id ? tab.accent : "transparent",
                color: activeTab === tab.id ? tab.accent : "#6b7280",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span style={{ color: activeTab === tab.id ? tab.accent : "#9ca3af" }}>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.id ? `${tab.accent}18` : "#f3f4f6",
                    color: activeTab === tab.id ? tab.accent : "#6b7280",
                  }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "papers" && <PapersSection />}
        {activeTab === "fellows" && <FellowsSection />}
        {activeTab === "partnerships" && <PartnershipsSection />}
        {activeTab === "claims" && <EvidenceClaimsSection papers={papers} />}
      </div>
    </div>
  );
}
