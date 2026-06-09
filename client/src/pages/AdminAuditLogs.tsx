// ============================================================
// ADMIN — SYSTEM AUDIT LOGS
// Chronological activity feed with category + module filters
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  ClipboardList, Plus, Pencil, CheckCircle2, Archive,
  Upload, Server, Send, UserCheck, Download, Eye, X,
} from "lucide-react";

// ── Action category config ─────────────────────────────────────────────────────
const CAT_CFG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  label: string;
}> = {
  create:  { icon: Plus,         color: "#22c55e", bg: "#052e16",  label: "Created" },
  update:  { icon: Pencil,       color: "#3b82f6", bg: "#0f1f3a",  label: "Updated" },
  approve: { icon: CheckCircle2, color: "#a78bfa", bg: "#16102a",  label: "Approved" },
  archive: { icon: Archive,      color: "#94a3b8", bg: "#0f1115",  label: "Archived" },
  upload:  { icon: Upload,       color: "#e879f9", bg: "#1a0d1f",  label: "Uploaded" },
  system:  { icon: Server,       color: "#f59e0b", bg: "#1c1200",  label: "System" },
  submit:  { icon: Send,         color: "#22d3ee", bg: "#051a1f",  label: "Submitted" },
  assign:  { icon: UserCheck,    color: "#fb923c", bg: "#1c0d00",  label: "Assigned" },
  export:  { icon: Download,     color: "#14b8a6", bg: "#041e1c",  label: "Exported" },
  review:  { icon: Eye,          color: "#6366f1", bg: "#0d0f2a",  label: "Reviewed" },
};
function catCfg(cat: string | null) {
  return CAT_CFG[cat ?? ""] ?? { icon: Pencil, color: "#64748b", bg: "#0f1115", label: cat ?? "Action" };
}

// ── Role badge styling ────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  "Studio Director": "#a78bfa",
  "Platform Admin":  "#f59e0b",
  "Coach":           "#22d3ee",
  "Founder":         "#56A837",
};
function roleColor(r: string | null) {
  return ROLE_COLORS[r ?? ""] ?? "#64748b";
}

// ── Time formatting ───────────────────────────────────────────────────────────
function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fullDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditLogs() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeModule,   setActiveModule]   = useState("all");
  const [activeVenture,  setActiveVenture]  = useState("all");

  const { data: logs = [], isLoading } = trpc.admin.getSystemAuditLogs.useQuery({ limit: 100 });

  const modules = useMemo(() => {
    const seen = new Set<string>();
    (logs as any[]).forEach((l: any) => seen.add(l.targetModule));
    return ["all", ...Array.from(seen).sort()];
  }, [logs]);

  const ventures = useMemo(() => {
    const seen = new Map<string, string>();
    (logs as any[]).forEach((l: any) => {
      if (l.targetVentureId) seen.set(l.targetVentureId, l.ventureName ?? l.targetVentureId);
    });
    return [{ id: "all", name: "All Ventures" }, ...Array.from(seen.entries()).map(([id, name]) => ({ id, name }))];
  }, [logs]);

  const filtered = useMemo(() => {
    let list = logs as any[];
    if (activeCategory !== "all") list = list.filter((l: any) => l.actionCategory === activeCategory);
    if (activeModule !== "all")   list = list.filter((l: any) => l.targetModule === activeModule);
    if (activeVenture !== "all")  list = list.filter((l: any) => l.targetVentureId === activeVenture);
    return list;
  }, [logs, activeCategory, activeModule, activeVenture]);

  const hasFilters = activeCategory !== "all" || activeModule !== "all" || activeVenture !== "all";

  const totalByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    (logs as any[]).forEach((l: any) => { m[l.actionCategory ?? ""] = (m[l.actionCategory ?? ""] ?? 0) + 1; });
    return m;
  }, [logs]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Audit Logs
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              System Audit Logs
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Complete chronological record of all platform activity across every venture and module.
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{(logs as any[]).length}</p>
            <p className="text-xs" style={{ color: "#475569" }}>Total Events</p>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === "all" ? "#0f2a1a" : "#0a1520",
              color: activeCategory === "all" ? "#56A837" : "#475569",
              border: `1px solid ${activeCategory === "all" ? "#56A83750" : "#1e2d3d"}`,
            }}
          >
            All ({(logs as any[]).length})
          </button>
          {Object.entries(CAT_CFG).map(([cat, cfg]) => {
            const count = totalByCategory[cat] ?? 0;
            if (count === 0) return null;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: isActive ? cfg.bg : "#0a1520",
                  color: isActive ? cfg.color : "#475569",
                  border: `1px solid ${isActive ? cfg.color + "50" : "#1e2d3d"}`,
                }}
              >
                <cfg.icon size={11} />
                {cfg.label} ({count})
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={() => { setActiveCategory("all"); setActiveModule("all"); setActiveVenture("all"); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ color: "#ef4444", background: "transparent", border: "1px solid #ef444430" }}
            >
              <X size={10} />
              Clear
            </button>
          )}
        </div>

        {/* Module + venture filters */}
        <div className="mt-3 flex items-center gap-3">
          <select
            value={activeModule}
            onChange={e => setActiveModule(e.target.value)}
            className="h-8 px-3 rounded-lg text-xs"
            style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}
          >
            {modules.map(m => (
              <option key={m} value={m}>{m === "all" ? "All Modules" : m}</option>
            ))}
          </select>

          <select
            value={activeVenture}
            onChange={e => setActiveVenture(e.target.value)}
            className="h-8 px-3 rounded-lg text-xs"
            style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}
          >
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          <span className="text-xs ml-auto" style={{ color: "#334155" }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""} shown
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="px-8 py-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading audit log…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ClipboardList size={28} style={{ color: "#1e2d3d" }} />
            <p className="text-sm" style={{ color: "#475569" }}>No log entries match your filters.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div
              className="absolute left-[1.375rem] top-2 bottom-2 w-px"
              style={{ background: "linear-gradient(to bottom, #1e2d3d, #0d1825)" }}
            />

            <div className="space-y-1">
              {(filtered as any[]).map((log: any, i: number) => {
                const cfg = catCfg(log.actionCategory);
                const Icon = cfg.icon;
                const rc   = roleColor(log.actorRole);
                const isLast = i === filtered.length - 1;

                return (
                  <div key={log.id} className="relative flex items-start gap-4 pl-0">
                    {/* Timeline dot */}
                    <div
                      className="relative z-10 shrink-0 w-11 flex justify-center pt-3"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.color}50` }}
                      >
                        <Icon size={11} style={{ color: cfg.color }} />
                      </div>
                    </div>

                    {/* Entry card */}
                    <div
                      className="flex-1 mb-1 px-4 py-3 rounded-xl"
                      style={{
                        background: i % 2 === 0 ? "#090e16" : "#070c14",
                        border: "1px solid #111e2d",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Actor + action */}
                          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                            <span
                              className="font-semibold"
                              style={{ color: "#e2e8f0" }}
                            >
                              {log.actorName}
                            </span>
                            {log.actorRole && (
                              <span
                                className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ color: rc, background: `${rc}18` }}
                              >
                                {log.actorRole}
                              </span>
                            )}
                            <span className="mx-1.5">·</span>
                            {log.actionPerformed}
                          </p>

                          {/* Meta chips */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                            >
                              {cfg.label}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ color: "#475569", background: "#0f1923", border: "1px solid #1e2d3d" }}
                            >
                              {log.targetModule}
                            </span>
                            {log.ventureName && (
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{ color: "#56A837", background: "#071a0320", border: "1px solid #56A83730" }}
                              >
                                {log.ventureName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium" style={{ color: "#475569" }}>
                            {timeAgo(log.createdAt)}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#2d3f52" }}>
                            {fullDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
