// ============================================================
// ADMIN — TEMPLATES LIBRARY
// Downloadable resource grid: scorecards, canvases, models
// Design: Precision Industrial — dark theme, EcoBlend OS
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LayoutTemplate, Search, Download, FileSpreadsheet, FileText,
  Presentation, FileType2, Globe, Filter, X,
} from "lucide-react";

// ── File type config ──────────────────────────────────────────────────────────
const FILE_TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  label: string;
}> = {
  XLSX:         { icon: FileSpreadsheet, color: "#22c55e", bg: "#052e16",  label: "Excel" },
  DOCX:         { icon: FileText,        color: "#3b82f6", bg: "#0f1f3a",  label: "Word" },
  PPTX:         { icon: Presentation,    color: "#f59e0b", bg: "#1c1505",  label: "PowerPoint" },
  PDF:          { icon: FileType2,       color: "#ef4444", bg: "#1f0505",  label: "PDF" },
  FIGMA:        { icon: Globe,           color: "#a78bfa", bg: "#16102a",  label: "Figma" },
  NOTION:       { icon: Globe,           color: "#94a3b8", bg: "#0f1115",  label: "Notion" },
  GOOGLE_SHEET: { icon: FileSpreadsheet, color: "#4ade80", bg: "#052e16",  label: "Google Sheet" },
};

function fileTypeCfg(ft: string | null) {
  return FILE_TYPE_CONFIG[ft ?? ""] ?? { icon: FileText, color: "#64748b", bg: "#0f1115", label: ft ?? "File" };
}

// ── Category badge ────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Business Model":       "#f59e0b",
  "Validation":           "#3b82f6",
  "Customer Discovery":   "#22d3ee",
  "Scoring & Assessment": "#56A837",
  "Investment Readiness": "#a78bfa",
  "Governance & Risk":    "#ef4444",
  "Getting Started":      "#94a3b8",
  "Reporting":            "#fb923c",
};
function categoryColor(cat: string | null) {
  return CATEGORY_COLORS[cat ?? ""] ?? "#64748b";
}

// ── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ template }: { template: any }) {
  const cfg = fileTypeCfg(template.fileType);
  const Icon = cfg.icon;
  const catColor = categoryColor(template.category);

  const handleDownload = () => {
    if (template.downloadUrl) {
      window.open(template.downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className="group relative flex flex-col rounded-xl border transition-all hover:border-opacity-60 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: "#0a1520", borderColor: "#1e2d3d" }}
    >
      {/* File type accent stripe */}
      <div className="h-1 rounded-t-xl" style={{ background: cfg.color }} />

      <div className="flex-1 p-5">
        {/* Icon + file type */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ background: cfg.bg }}
          >
            <Icon size={20} style={{ color: cfg.color }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3
          className="text-sm font-semibold leading-snug mb-1.5"
          style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}
        >
          {template.name}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed line-clamp-3 mb-4"
          style={{ color: "#64748b" }}
        >
          {template.description ?? "No description available."}
        </p>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          {template.category && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}30` }}
            >
              {template.category}
            </span>
          )}
          {template.linkedModule && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ color: "#475569", background: "#0f1923", border: "1px solid #1e2d3d" }}
            >
              {template.linkedModule}
            </span>
          )}
          {template.version && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ color: "#475569", background: "#0f1923" }}
            >
              v{template.version}
            </span>
          )}
        </div>
      </div>

      {/* Download button */}
      <div className="px-5 pb-4">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.color}30`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = `${cfg.color}22`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = cfg.bg;
          }}
        >
          <Download size={13} />
          Download Template
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTemplates() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeFileType, setActiveFileType] = useState<string>("All");

  const { data: templates = [], isLoading } = trpc.admin.templates.list.useQuery();
  const { data: categories = [] } = trpc.admin.templates.categories.useQuery();

  const allFileTypes = useMemo(() => {
    const types = new Set<string>();
    (templates as any[]).forEach((t: any) => { if (t.fileType) types.add(t.fileType); });
    return Array.from(types).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates as any[];
    if (activeCategory !== "All") list = list.filter((t: any) => t.category === activeCategory);
    if (activeFileType !== "All") list = list.filter((t: any) => t.fileType === activeFileType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t: any) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, activeCategory, activeFileType, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (filtered as any[]).forEach((t: any) => {
      const cat = t.category ?? "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasFilters = activeCategory !== "All" || activeFileType !== "All" || search.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutTemplate size={16} style={{ color: "#56A837" }} />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#56A837" }}
              >
                Admin / Templates
              </span>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}
            >
              Template Library
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Downloadable working documents, scorecards, and frameworks for EcoBlend OS ventures.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {(templates as any[]).length}
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>Templates</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {categories.length}
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>Categories</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="pl-9 h-9 text-sm"
              style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={13} style={{ color: "#475569" }} />
              </button>
            )}
          </div>

          {/* File type pills */}
          <div className="flex items-center gap-1.5">
            {["All", ...allFileTypes].map(ft => {
              const isActive = activeFileType === ft;
              const cfg = ft === "All" ? null : fileTypeCfg(ft);
              return (
                <button
                  key={ft}
                  onClick={() => setActiveFileType(ft)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: isActive
                      ? (cfg ? cfg.bg : "#0f2a1a")
                      : "#0a1520",
                    color: isActive
                      ? (cfg ? cfg.color : "#56A837")
                      : "#475569",
                    border: `1px solid ${isActive ? (cfg ? cfg.color + "50" : "#56A83750") : "#1e2d3d"}`,
                  }}
                >
                  {ft !== "All" && cfg && <cfg.icon size={11} />}
                  {ft}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category sidebar + grid */}
      <div className="flex">

        {/* Category filter sidebar */}
        <div
          className="w-44 shrink-0 py-4 border-r"
          style={{ borderColor: "#1e2d3d" }}
        >
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
            <Filter size={10} className="inline mr-1" />
            Category
          </p>
          {["All", ...categories].map(cat => {
            const isActive = activeCategory === cat;
            const color = cat === "All" ? "#56A837" : categoryColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="w-full text-left px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  color: isActive ? color : "#475569",
                  background: isActive ? `${color}12` : "transparent",
                  borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                }}
              >
                {cat}
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={() => { setActiveCategory("All"); setActiveFileType("All"); setSearch(""); }}
              className="w-full text-left px-4 py-2 text-[10px] font-medium mt-2"
              style={{ color: "#ef4444" }}
            >
              <X size={10} className="inline mr-1" />
              Clear filters
            </button>
          )}
        </div>

        {/* Template grid */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: "#475569" }}>Loading templates…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <LayoutTemplate size={28} style={{ color: "#1e2d3d" }} />
              <p className="text-sm" style={{ color: "#475569" }}>No templates match your filters.</p>
              {hasFilters && (
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { setActiveCategory("All"); setActiveFileType("All"); setSearch(""); }}
                  style={{ color: "#56A837" }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : activeCategory !== "All" ? (
            /* Flat grid when a single category is selected */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((t: any) => <TemplateCard key={t.id} template={t} />)}
            </div>
          ) : (
            /* Grouped by category when "All" is selected */
            <div className="space-y-8">
              {grouped.map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: categoryColor(cat) }}
                    />
                    <h2
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: categoryColor(cat) }}
                    >
                      {cat}
                    </h2>
                    <span className="text-xs" style={{ color: "#334155" }}>
                      ({items.length})
                    </span>
                    <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((t: any) => <TemplateCard key={t.id} template={t} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
