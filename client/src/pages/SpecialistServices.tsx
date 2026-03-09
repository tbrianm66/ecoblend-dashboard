// ============================================================
// ECORACE STUDIO — Specialist Services Marketplace
// Connects Playbook tasks to vetted specialists.
// Revenue model: platform referral fee per commissioned engagement.
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVentures } from "@/contexts/VentureContext";
import {
  Briefcase, Star, Clock, CheckCircle2, ChevronRight,
  Plus, X, Check, Send, Users, Layers, Lock, Scale,
  FlaskConical, Megaphone, BarChart2, Palette, Code,
  DollarSign, Filter, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceCategory =
  | "Legal & IP"
  | "Branding & Design"
  | "Engineering & R&D"
  | "Finance & Investment"
  | "Marketing & PR"
  | "Strategy & Research"
  | "Technology & Dev"
  | "People & HR"
  | "Sustainability & B Corp";

type CommissionStatus = "Open" | "Commissioned" | "In Review" | "Complete" | "Cancelled";

interface Specialist {
  id: string;
  name: string;
  role: string;
  category: ServiceCategory;
  rate: string;          // e.g. "£150/hr" or "£2,500 fixed"
  availability: "Available" | "Limited" | "Busy";
  rating: number;        // 1–5
  completedJobs: number;
  bio: string;
  tags: string[];
  platformFee: number;   // % EcoRace Studio takes
}

interface ServiceTask {
  id: string;
  playbookRef: string;   // e.g. "VRL 1 · Task 4"
  title: string;
  description: string;
  category: ServiceCategory;
  brandId: string;
  priority: "High" | "Medium" | "Low";
  estimatedCost: string;
}

interface Commission {
  id: string;
  taskId: string;
  specialistId: string;
  brandId: string;
  status: CommissionStatus;
  brief: string;
  createdAt: string;
  updatedAt: string;
  agreedRate: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const SPECIALISTS: Specialist[] = [
  {
    id: "sp1", name: "Sarah Mitchell", role: "IP & Patent Attorney",
    category: "Legal & IP", rate: "£200/hr", availability: "Available",
    rating: 5, completedJobs: 34, platformFee: 15,
    bio: "Specialist in green technology patents and international IP strategy. Former in-house counsel at a FTSE 250 materials company.",
    tags: ["Patents", "Trade Marks", "Licensing", "Materials IP"],
  },
  {
    id: "sp2", name: "James Okafor", role: "Brand Strategist & Designer",
    category: "Branding & Design", rate: "£3,500 fixed", availability: "Available",
    rating: 4, completedJobs: 21, platformFee: 15,
    bio: "Brand identity specialist for sustainable consumer and B2B brands. Worked with Patagonia, Finisterre, and multiple start-ups.",
    tags: ["Brand Identity", "Visual Systems", "Packaging", "D2C"],
  },
  {
    id: "sp3", name: "Dr. Priya Nair", role: "Composite Materials Engineer",
    category: "Engineering & R&D", rate: "£180/hr", availability: "Limited",
    rating: 5, completedJobs: 18, platformFee: 12,
    bio: "PhD in bio-composite materials from Imperial College. Specialises in sustainable fibre-reinforced polymers for sport and transport applications.",
    tags: ["Bio-Composites", "TRL Validation", "Lab Testing", "F1 Materials"],
  },
  {
    id: "sp4", name: "Tom Hargreaves", role: "Startup CFO / Finance Advisor",
    category: "Finance & Investment", rate: "£1,800/day", availability: "Available",
    rating: 4, completedJobs: 29, platformFee: 15,
    bio: "Fractional CFO with 15 years supporting early-stage ventures through seed to Series A. Expertise in SEIS/EIS structuring.",
    tags: ["SEIS/EIS", "Financial Modelling", "Investor Decks", "Burn Rate"],
  },
  {
    id: "sp5", name: "Amara Diallo", role: "PR & Communications Specialist",
    category: "Marketing & PR", rate: "£2,200/mo retainer", availability: "Available",
    rating: 5, completedJobs: 41, platformFee: 15,
    bio: "PR specialist for sustainable brands and social enterprises. Strong relationships with GreenBiz, Dezeen, and sports media.",
    tags: ["Press Releases", "Media Relations", "Sustainability PR", "Launch Campaigns"],
  },
  {
    id: "sp6", name: "Lena Bergström", role: "Market Research Analyst",
    category: "Strategy & Research", rate: "£1,200 fixed", availability: "Available",
    rating: 4, completedJobs: 16, platformFee: 12,
    bio: "Specialist in TAM/SAM/SOM analysis, customer discovery frameworks, and competitive landscape mapping for deep-tech ventures.",
    tags: ["Market Sizing", "Customer Discovery", "Competitive Analysis", "BMC Validation"],
  },
  {
    id: "sp7", name: "Raj Patel", role: "Full-Stack Developer",
    category: "Technology & Dev", rate: "£95/hr", availability: "Limited",
    rating: 4, completedJobs: 52, platformFee: 10,
    bio: "React, Node.js, and mobile specialist. Experienced in building MVPs for hardware-enabled products and IoT platforms.",
    tags: ["React", "Node.js", "MVP Build", "IoT", "Mobile"],
  },
  {
    id: "sp8", name: "Claire Fontaine", role: "B Corp & Sustainability Consultant",
    category: "Sustainability & B Corp", rate: "£1,500 fixed", availability: "Available",
    rating: 5, completedJobs: 23, platformFee: 12,
    bio: "Certified B Corp advisor with experience guiding 30+ companies through the B Impact Assessment. Specialist in SDG alignment.",
    tags: ["B Corp", "BIA", "SDG Mapping", "ISO 14001", "Impact Reporting"],
  },
  {
    id: "sp9", name: "Marcus Webb", role: "ESOP & People Advisor",
    category: "People & HR", rate: "£1,000 fixed", availability: "Available",
    rating: 4, completedJobs: 11, platformFee: 12,
    bio: "Employment law and equity specialist. Helps early-stage teams structure ESOP schemes, founder agreements, and advisory equity.",
    tags: ["ESOP", "Founder Agreements", "Equity Structuring", "Employment Law"],
  },
];

const SERVICE_TASKS: ServiceTask[] = [
  { id: "st1", playbookRef: "VRL 1 · Task 4", title: "File Provisional Patent for Core Material Formulation", description: "Protect the primary bio-composite formulation IP before any public disclosure or investor meetings.", category: "Legal & IP", brandId: "ecoblend", priority: "High", estimatedCost: "£1,500–£3,000" },
  { id: "st2", playbookRef: "VRL 1 · Task 7", title: "Develop Brand Identity System for TONE", description: "Create full visual identity: logo, colour palette, typography, and brand guidelines for the eco-creative brand.", category: "Branding & Design", brandId: "tone", priority: "High", estimatedCost: "£3,000–£5,000" },
  { id: "st3", playbookRef: "VRL 2 · Task 18", title: "Validate Bio-Composite at TRL 5 (Relevant Environment)", description: "Commission independent lab testing to validate material performance in a relevant industrial environment.", category: "Engineering & R&D", brandId: "ecoblend-rd", priority: "High", estimatedCost: "£4,000–£8,000" },
  { id: "st4", playbookRef: "VRL 2 · Task 22", title: "Prepare SEIS/EIS Investment Documentation for REAL", description: "Structure the investment round with SEIS/EIS compliance, investor deck, and financial model.", category: "Finance & Investment", brandId: "real", priority: "High", estimatedCost: "£2,500–£4,000" },
  { id: "st5", playbookRef: "VRL 1 · Task 12", title: "TAM/SAM/SOM Market Sizing for PIPE", description: "Conduct market research to validate the eco-water sport market size and competitive landscape.", category: "Strategy & Research", brandId: "pipe", priority: "Medium", estimatedCost: "£1,200–£2,000" },
  { id: "st6", playbookRef: "VRL 2 · Task 31", title: "B Corp Impact Assessment for EcoBlend Portfolio", description: "Initiate the B Impact Assessment across the portfolio to achieve B Corp accreditation.", category: "Sustainability & B Corp", brandId: "ecoblend", priority: "Medium", estimatedCost: "£1,500–£2,500" },
  { id: "st7", playbookRef: "VRL 1 · Task 9", title: "ESOP Scheme Design for BEBUS Founding Team", description: "Structure the equity allocation and ESOP pool for the BEBUS founding team and early advisors.", category: "People & HR", brandId: "bebus", priority: "Medium", estimatedCost: "£800–£1,200" },
  { id: "st8", playbookRef: "VRL 3 · Task 44", title: "Launch PR Campaign for TONE Brand Launch", description: "Develop and execute a press and media campaign for the TONE brand launch targeting creative industry publications.", category: "Marketing & PR", brandId: "tone", priority: "Medium", estimatedCost: "£2,000–£3,500" },
  { id: "st9", playbookRef: "VRL 2 · Task 25", title: "Build PIPE MVP — Performance Tracking App", description: "Develop a minimum viable product for PIPE's digital performance tracking companion app.", category: "Technology & Dev", brandId: "pipe", priority: "Low", estimatedCost: "£5,000–£9,000" },
  { id: "st10", playbookRef: "VRL 1 · Task 6", title: "Register Trade Mark for REAL Brand Name", description: "File UK and EU trade mark applications for the REAL brand name and logo.", category: "Legal & IP", brandId: "real", priority: "Medium", estimatedCost: "£800–£1,500" },
];

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  "Legal & IP":             Scale,
  "Branding & Design":      Palette,
  "Engineering & R&D":      FlaskConical,
  "Finance & Investment":   DollarSign,
  "Marketing & PR":         Megaphone,
  "Strategy & Research":    BarChart2,
  "Technology & Dev":       Code,
  "People & HR":            Users,
  "Sustainability & B Corp": Layers,
};

const CATEGORY_COLOURS: Record<ServiceCategory, string> = {
  "Legal & IP":             "#8b5cf6",
  "Branding & Design":      "#ec4899",
  "Engineering & R&D":      "#3A97D3",
  "Finance & Investment":   "#f59e0b",
  "Marketing & PR":         "#51AF37",
  "Strategy & Research":    "#06b6d4",
  "Technology & Dev":       "#6366f1",
  "People & HR":            "#f97316",
  "Sustainability & B Corp": "#10b981",
};

const PRIORITY_COLOURS = { High: "#ef4444", Medium: "#f59e0b", Low: "#9ca3af" };
const STATUS_COLOURS: Record<CommissionStatus, { bg: string; text: string }> = {
  Open:         { bg: "#f3f4f6", text: "#6b7280" },
  Commissioned: { bg: "#eff6ff", text: "#3A97D3" },
  "In Review":  { bg: "#fffbeb", text: "#d97706" },
  Complete:     { bg: "#f0fdf4", text: "#51AF37" },
  Cancelled:    { bg: "#fef2f2", text: "#ef4444" },
};

const STORAGE_KEY = "ecoblend-commissions-v1";

function loadCommissions(): Commission[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveCommissions(c: Commission[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch {}
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} fill={i <= rating ? "#f59e0b" : "none"} style={{ color: i <= rating ? "#f59e0b" : "#d1d5db" }} />
      ))}
    </div>
  );
}

function AvailabilityBadge({ status }: { status: Specialist["availability"] }) {
  const c = status === "Available" ? "#51AF37" : status === "Limited" ? "#f59e0b" : "#ef4444";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c}15`, color: c }}>
      {status}
    </span>
  );
}

// ── Commission Modal ──────────────────────────────────────────────────────────

function CommissionModal({
  task, specialist, brandName, onClose, onSubmit,
}: {
  task: ServiceTask;
  specialist: Specialist;
  brandName: string;
  onClose: () => void;
  onSubmit: (brief: string) => void;
}) {
  const [brief, setBrief] = useState("");
  const catColor = CATEGORY_COLOURS[task.category];
  const platformFee = specialist.platformFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>Commission Specialist</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={16} style={{ color: "#6b7280" }} />
          </button>
        </div>

        {/* Task summary */}
        <div className="rounded-xl p-4 mb-4" style={{ background: `${catColor}08`, border: `1px solid ${catColor}20` }}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: catColor }}>{task.playbookRef} · {brandName}</div>
          <div className="text-sm font-bold text-gray-900">{task.title}</div>
          <div className="text-xs text-gray-500 mt-1">{task.description}</div>
        </div>

        {/* Specialist summary */}
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: catColor }}>
            {specialist.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900">{specialist.name}</div>
            <div className="text-xs text-gray-500">{specialist.role}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{specialist.rate}</div>
            <div className="text-xs text-gray-400">+{platformFee}% platform fee</div>
          </div>
        </div>

        {/* Brief */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Your Brief *</label>
          <textarea
            className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none"
            style={{ borderColor: "#e5e7eb" }}
            rows={4}
            placeholder="Describe what you need, timeline, any specific requirements or context..."
            value={brief}
            onChange={e => setBrief(e.target.value)}
          />
        </div>

        {/* Revenue note */}
        <div className="rounded-lg p-3 mb-4 text-xs" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <span className="font-semibold" style={{ color: "#51AF37" }}>EcoRace Studio earns {platformFee}% referral fee</span>
          <span className="text-gray-500"> on this engagement. Revenue is recognised on commission confirmation.</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => { if (!brief.trim()) { toast.error("Please add a brief"); return; } onSubmit(brief); }}
            style={{ background: catColor, color: "white" }}>
            <Send size={14} /> Send Commission Request
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SpecialistServices() {
  const { ventures: allVentures } = useVentures();
  const ventures = allVentures.filter(v => !v.isInternalLab);

  const [commissions, setCommissions] = useState<Commission[]>(loadCommissions);
  const [activeTab, setActiveTab] = useState<"tasks" | "directory" | "commissions">("tasks");
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | "all">("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [commissioning, setCommissioning] = useState<{ task: ServiceTask; specialist: Specialist } | null>(null);

  const categories = Array.from(new Set(SPECIALISTS.map(s => s.category))) as ServiceCategory[];

  const filteredTasks = SERVICE_TASKS.filter(t =>
    (filterCategory === "all" || t.category === filterCategory) &&
    (filterBrand === "all" || t.brandId === filterBrand)
  );

  const filteredSpecialists = SPECIALISTS.filter(s =>
    filterCategory === "all" || s.category === filterCategory
  );

  function submitCommission(brief: string) {
    if (!commissioning) return;
    const { task, specialist } = commissioning;
    const c: Commission = {
      id: `c${Date.now()}`,
      taskId: task.id,
      specialistId: specialist.id,
      brandId: task.brandId,
      status: "Commissioned",
      brief,
      agreedRate: specialist.rate,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...commissions, c];
    setCommissions(updated);
    saveCommissions(updated);
    setCommissioning(null);
    toast.success(`Commission sent to ${specialist.name}!`);
    setActiveTab("commissions");
  }

  function advanceStatus(id: string, current: CommissionStatus) {
    const cycle: CommissionStatus[] = ["Commissioned", "In Review", "Complete"];
    const idx = cycle.indexOf(current);
    if (idx === -1 || idx === cycle.length - 1) return;
    const next = cycle[idx + 1];
    const updated = commissions.map(c => c.id === id ? { ...c, status: next, updatedAt: new Date().toISOString().split("T")[0] } : c);
    setCommissions(updated);
    saveCommissions(updated);
    toast.success(`Status → ${next}`);
  }

  function cancelCommission(id: string) {
    const updated = commissions.map(c => c.id === id ? { ...c, status: "Cancelled" as CommissionStatus } : c);
    setCommissions(updated);
    saveCommissions(updated);
    toast.success("Commission cancelled");
  }

  const totalCommissioned = commissions.filter(c => c.status !== "Cancelled").length;
  const totalComplete = commissions.filter(c => c.status === "Complete").length;
  const openTasks = SERVICE_TASKS.filter(t => !commissions.find(c => c.taskId === t.id && c.status !== "Cancelled")).length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={16} style={{ color: "#8b5cf6" }} />
          <span className="vos-badge" style={{ background: "#8b5cf615", color: "#8b5cf6", fontSize: "0.65rem" }}>Revenue Platform</span>
        </div>
        <h1 className="vos-page-title mb-1">Specialist Services</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          Connect Playbook tasks to vetted specialists. EcoRace Studio earns a platform referral fee on every commissioned engagement.
        </p>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Open Tasks", value: openTasks, sub: "awaiting specialist", color: "#8b5cf6" },
            { label: "Specialists", value: SPECIALISTS.length, sub: "vetted & available", color: "#3A97D3" },
            { label: "Commissioned", value: totalCommissioned, sub: "engagements active", color: "#f59e0b" },
            { label: "Completed", value: totalComplete, sub: "jobs delivered", color: "#51AF37" },
          ].map(k => (
            <div key={k.label} className="vos-metric">
              <span className="vos-metric-label">{k.label}</span>
              <span className="vos-metric-value" style={{ color: k.color }}>{k.value}</span>
              <span className="vos-metric-sub">{k.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          {(["tasks", "directory", "commissions"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-semibold capitalize transition-all relative"
              style={{
                color: activeTab === tab ? "#8b5cf6" : "#9ca3af",
                borderBottom: activeTab === tab ? "2px solid #8b5cf6" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab === "tasks" ? "Service Tasks" : tab === "directory" ? "Specialist Directory" : `My Commissions${commissions.length > 0 ? ` (${commissions.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab !== "commissions" && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Category:</span>
              <button onClick={() => setFilterCategory("all")}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                style={{ background: filterCategory === "all" ? "#8b5cf6" : "#f3f4f6", color: filterCategory === "all" ? "white" : "#6b7280" }}>
                All
              </button>
              {categories.map(cat => {
                const CatIcon = CATEGORY_ICONS[cat];
                const color = CATEGORY_COLOURS[cat];
                return (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: filterCategory === cat ? color : `${color}12`,
                      color: filterCategory === cat ? "white" : color,
                      border: `1px solid ${color}25`,
                    }}>
                    <CatIcon size={11} />
                    {cat}
                  </button>
                );
              })}
            </div>
            {activeTab === "tasks" && (
              <div className="flex items-center gap-2 flex-wrap mt-2 w-full">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Brand:</span>
                <button onClick={() => setFilterBrand("all")}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                  style={{ background: filterBrand === "all" ? "#1a2332" : "#f3f4f6", color: filterBrand === "all" ? "white" : "#6b7280" }}>
                  All Brands
                </button>
                {[...ventures, allVentures.find(v => v.isInternalLab)!].filter(Boolean).map(v => (
                  <button key={v.id} onClick={() => setFilterBrand(v.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: filterBrand === v.id ? v.color : `${v.color}15`,
                      color: filterBrand === v.id ? "white" : v.color,
                      border: `1px solid ${v.color}30`,
                    }}>
                    {v.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Service Tasks ── */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map(task => {
              const catColor = CATEGORY_COLOURS[task.category];
              const CatIcon = CATEGORY_ICONS[task.category];
              const brand = [...ventures, allVentures.find(v => v.isInternalLab)!].find(v => v.id === task.brandId);
              const existingCommission = commissions.find(c => c.taskId === task.id && c.status !== "Cancelled");
              const matchingSpecialists = SPECIALISTS.filter(s => s.category === task.category && s.availability !== "Busy");

              return (
                <div key={task.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${catColor}12`, color: catColor, border: `1px solid ${catColor}25` }}>
                        <CatIcon size={11} />
                        {task.category}
                      </span>
                      {brand && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${brand.color}15`, color: brand.color, border: `1px solid ${brand.color}30` }}>
                          {brand.name}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${PRIORITY_COLOURS[task.priority]}12`, color: PRIORITY_COLOURS[task.priority] }}>
                        {task.priority}
                      </span>
                    </div>
                    {existingCommission && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: STATUS_COLOURS[existingCommission.status].bg, color: STATUS_COLOURS[existingCommission.status].text }}>
                        {existingCommission.status}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-gray-400 mb-1">{task.playbookRef}</div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug" style={{ fontFamily: "'Prompt', sans-serif" }}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{task.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Est. cost: <span className="font-semibold text-gray-600">{task.estimatedCost}</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{matchingSpecialists.length} specialist{matchingSpecialists.length !== 1 ? "s" : ""} available</span>
                      {!existingCommission && matchingSpecialists.length > 0 && (
                        <Button size="sm" className="gap-1.5 text-xs h-7"
                          style={{ background: catColor, color: "white" }}
                          onClick={() => setCommissioning({ task, specialist: matchingSpecialists[0] })}>
                          <Briefcase size={12} /> Hire
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab: Specialist Directory ── */}
        {activeTab === "directory" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSpecialists.map(s => {
              const catColor = CATEGORY_COLOURS[s.category];
              const CatIcon = CATEGORY_ICONS[s.category];
              const tasksForSpecialist = SERVICE_TASKS.filter(t => t.category === s.category);

              return (
                <div key={s.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: catColor }}>
                      {s.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.role}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={s.rating} />
                        <span className="text-xs text-gray-400">{s.completedJobs} jobs</span>
                      </div>
                    </div>
                    <AvailabilityBadge status={s.availability} />
                  </div>

                  <div className="flex items-center gap-1.5 mb-3" style={{ color: catColor }}>
                    <CatIcon size={12} />
                    <span className="text-xs font-semibold">{s.category}</span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.bio}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{s.rate}</div>
                      <div className="text-xs text-gray-400">+{s.platformFee}% platform fee</div>
                    </div>
                    {tasksForSpecialist.length > 0 && s.availability !== "Busy" && (
                      <Button size="sm" className="gap-1.5 text-xs h-7"
                        style={{ background: catColor, color: "white" }}
                        onClick={() => setCommissioning({ task: tasksForSpecialist[0], specialist: s })}>
                        <Briefcase size={12} /> Commission
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab: My Commissions ── */}
        {activeTab === "commissions" && (
          <div>
            {commissions.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm font-semibold">No commissions yet</div>
                <div className="text-xs mt-1">Go to Service Tasks and click Hire to commission a specialist.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {commissions.map(c => {
                  const task = SERVICE_TASKS.find(t => t.id === c.taskId);
                  const specialist = SPECIALISTS.find(s => s.id === c.specialistId);
                  const brand = [...ventures, allVentures.find(v => v.isInternalLab)!].find(v => v.id === c.brandId);
                  if (!task || !specialist) return null;
                  const catColor = CATEGORY_COLOURS[task.category];
                  const sc = STATUS_COLOURS[c.status];
                  const canAdvance = c.status === "Commissioned" || c.status === "In Review";

                  return (
                    <div key={c.id} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {brand && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${brand.color}15`, color: brand.color }}>
                              {brand.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${catColor}12`, color: catColor }}>
                            {task.category}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}>
                          {c.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>{task.title}</h3>
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="font-semibold text-gray-700">{specialist.name}</span> · {specialist.role} · {c.agreedRate}
                      </div>

                      <div className="rounded-lg p-3 mb-3 text-xs text-gray-600 italic" style={{ background: "#f9fafb" }}>
                        "{c.brief}"
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Created {c.createdAt} · Updated {c.updatedAt}
                        </div>
                        <div className="flex items-center gap-2">
                          {canAdvance && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"
                              style={{ borderColor: catColor, color: catColor }}
                              onClick={() => advanceStatus(c.id, c.status)}>
                              <ChevronRight size={12} />
                              {c.status === "Commissioned" ? "Mark In Review" : "Mark Complete"}
                            </Button>
                          )}
                          {c.status !== "Complete" && c.status !== "Cancelled" && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-red-400 border-red-200"
                              onClick={() => cancelCommission(c.id)}>
                              <X size={12} /> Cancel
                            </Button>
                          )}
                          {c.status === "Complete" && (
                            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#51AF37" }}>
                              <CheckCircle2 size={14} /> Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Commission Modal */}
      {commissioning && (
        <CommissionModal
          task={commissioning.task}
          specialist={commissioning.specialist}
          brandName={[...ventures, allVentures.find(v => v.isInternalLab)!].find(v => v.id === commissioning.task.brandId)?.name ?? commissioning.task.brandId}
          onClose={() => setCommissioning(null)}
          onSubmit={submitCommission}
        />
      )}
    </div>
  );
}
