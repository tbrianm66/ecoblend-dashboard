// ============================================================
// ADMIN — DATA FIELDS ARCHITECTURE DICTIONARY
// Core metric definitions: VRL, TRL, BRL, canvas fields, etc.
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Database, Search, X, Lock, Pencil } from "lucide-react";

// ── Data type badge config ────────────────────────────────────────────────────
const TYPE_CFG: Record<string, { color: string; bg: string }> = {
  integer:    { color: "#3b82f6", bg: "#0f1f3a" },
  percentage: { color: "#22d3ee", bg: "#051a1f" },
  currency:   { color: "#22c55e", bg: "#052e16" },
  enum:       { color: "#a78bfa", bg: "#16102a" },
  string:     { color: "#94a3b8", bg: "#0f1115" },
  boolean:    { color: "#f59e0b", bg: "#1c1200" },
};
function typeCfg(t: string) {
  return TYPE_CFG[t] ?? { color: "#64748b", bg: "#0f1115" };
}

// ── Field group colors ────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, string> = {
  "Readiness Scores": "#56A837",
  "Canvas":           "#f59e0b",
  "Validation":       "#22d3ee",
  "Discovery":        "#34d399",
  "R&D":              "#fb923c",
  "Risk":             "#ef4444",
  "Financial":        "#22c55e",
  "Governance":       "#a78bfa",
};
function groupColor(g: string | null) {
  return GROUP_COLORS[g ?? ""] ?? "#64748b";
}

const ALL_GROUPS = ["All Groups", ...Object.keys(GROUP_COLORS)];

export default function AdminDataFields() {
  const [search, setSearch]     = useState("");
  const [activeGroup, setGroup] = useState("All Groups");

  const { data: fields = [], isLoading } = trpc.admin.getDataFieldsDefinitions.useQuery();

  const filtered = useMemo(() => {
    let list = fields as any[];
    if (activeGroup !== "All Groups") list = list.filter((f: any) => f.fieldGroup === activeGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f: any) =>
        f.fieldKey.toLowerCase().includes(q) ||
        f.fieldLabel.toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [fields, activeGroup, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (filtered as any[]).forEach((f: any) => {
      const g = f.fieldGroup ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(f);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Data Fields
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Data Field Architecture
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Canonical definitions for every metric stored in the EcoBlend OS engine — types, ranges, and validation rules.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{(fields as any[]).length}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Field Definitions</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#56A837" }}>
                {(fields as any[]).filter((f: any) => f.isCore).length}
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>Core Fields</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields…"
              className="pl-9 h-9 w-56 text-sm"
              style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={12} style={{ color: "#475569" }} />
              </button>
            )}
          </div>
          {ALL_GROUPS.map(g => {
            const isActive = activeGroup === g;
            const color = g === "All Groups" ? "#56A837" : groupColor(g);
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? `${color}18` : "#0a1520",
                  color: isActive ? color : "#475569",
                  border: `1px solid ${isActive ? color + "50" : "#1e2d3d"}`,
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 py-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading field definitions…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Database size={28} style={{ color: "#1e2d3d" }} />
            <p className="text-sm" style={{ color: "#475569" }}>No fields match your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([group, items]) => {
              const gc = groupColor(group);
              return (
                <div key={group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ background: gc }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: gc }}>
                      {group}
                    </h2>
                    <span className="text-xs" style={{ color: "#334155" }}>({items.length})</span>
                    <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map((field: any) => {
                      const tc = typeCfg(field.dataType);
                      return (
                        <div
                          key={field.fieldKey}
                          className="rounded-xl p-4 border"
                          style={{ background: "#0a1520", borderColor: "#1e2d3d" }}
                        >
                          {/* Top row: key + type badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <code
                              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                              style={{ color: gc, background: `${gc}15` }}
                            >
                              {field.fieldKey}
                            </code>
                            <span
                              className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ color: tc.color, background: tc.bg, border: `1px solid ${tc.color}30` }}
                            >
                              {field.dataType}
                            </span>
                          </div>

                          {/* Label */}
                          <p className="text-sm font-semibold mb-1.5" style={{ color: "#e2e8f0" }}>
                            {field.fieldLabel}
                          </p>

                          {/* Description */}
                          <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#64748b" }}>
                            {field.description ?? "No description."}
                          </p>

                          {/* Footer: range + flags */}
                          <div className="flex items-center justify-between">
                            {field.validationRange ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ color: "#475569", background: "#0f1923" }}>
                                Range: {field.validationRange}
                              </span>
                            ) : <span />}

                            <div className="flex items-center gap-2">
                              {field.isCore && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#56A837" }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#56A837" }} />
                                  Core
                                </span>
                              )}
                              {field.isEditable ? (
                                <Pencil size={11} style={{ color: "#3b82f6" }} />
                              ) : (
                                <Lock size={11} style={{ color: "#334155" }} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
