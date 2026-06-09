// ============================================================
// ADMIN — SYSTEM CONFIGURATION
// Inline-editable global constants grouped by config domain
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SlidersHorizontal, Pencil, Check, X, Lock, RefreshCw } from "lucide-react";

// ── Config group colors ───────────────────────────────────────────────────────
const GROUP_CFG: Record<string, { color: string; bg: string }> = {
  "General":       { color: "#56A837", bg: "#071a03" },
  "Financial":     { color: "#22c55e", bg: "#052e16" },
  "Scoring":       { color: "#a78bfa", bg: "#16102a" },
  "Governance":    { color: "#ef4444", bg: "#1f0505" },
  "Security":      { color: "#f59e0b", bg: "#1c1200" },
  "Capacity":      { color: "#22d3ee", bg: "#051a1f" },
  "Technical":     { color: "#6366f1", bg: "#0d0f2a" },
  "Notifications": { color: "#fb923c", bg: "#1c0d00" },
  "Validation":    { color: "#3b82f6", bg: "#0f1f3a" },
};
function groupCfg(g: string | null) {
  return GROUP_CFG[g ?? ""] ?? { color: "#64748b", bg: "#0f1115" };
}

// ── Row component with inline edit ───────────────────────────────────────────
function ConfigRow({ row, onSave }: { row: any; onSave: (key: string, val: string) => Promise<void> }) {
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState(row.configValue);
  const [saving,   setSaving]   = useState(false);
  const gc = groupCfg(row.configGroup);

  async function handleSave() {
    if (draft === row.configValue) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(row.configKey, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(row.configValue);
    setEditing(false);
  }

  return (
    <div
      className="grid items-start gap-4 px-5 py-4"
      style={{ gridTemplateColumns: "14rem 16rem 1fr 2rem" }}
    >
      {/* Key */}
      <div>
        <code
          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
          style={{ color: gc.color, background: `${gc.color}15` }}
        >
          {row.configKey}
        </code>
      </div>

      {/* Value — editable or locked */}
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-2 w-full">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              className="flex-1 text-sm px-2 py-1 rounded-lg outline-none"
              style={{
                background: "#0f1923",
                border: "1px solid #3b82f6",
                color: "#e2e8f0",
                fontFamily: "monospace",
                minWidth: 0,
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "#071a03", border: "1px solid #56A83750" }}
            >
              {saving
                ? <RefreshCw size={11} style={{ color: "#56A837" }} className="animate-spin" />
                : <Check size={11} style={{ color: "#56A837" }} strokeWidth={3} />
              }
            </button>
            <button
              onClick={handleCancel}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "#110a0a", border: "1px solid #ef444430" }}
            >
              <X size={11} style={{ color: "#ef4444" }} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <span
            className="text-sm font-mono px-2 py-1 rounded"
            style={{ color: "#e2e8f0", background: "#0f1923", minWidth: "4rem", display: "inline-block" }}
          >
            {row.configValue}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
        {row.description ?? ""}
      </p>

      {/* Edit / lock icon */}
      <div className="flex items-center justify-end pt-0.5">
        {row.isEditable && !editing ? (
          <button
            onClick={() => { setDraft(row.configValue); setEditing(true); }}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#0f2a1a")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <Pencil size={13} style={{ color: "#3b82f6" }} />
          </button>
        ) : !row.isEditable ? (
          <Lock size={13} style={{ color: "#334155" }} />
        ) : null}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSystemConfig() {
  const { data: configs = [], isLoading, refetch } = trpc.admin.getSystemConfigVariables.useQuery();
  const updateMutation = trpc.admin.updateSystemConfig.useMutation();

  async function handleSave(configKey: string, configValue: string) {
    await updateMutation.mutateAsync({ configKey, configValue });
    toast.success(`"${configKey}" updated successfully.`);
    refetch();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (configs as any[]).forEach((c: any) => {
      const g = c.configGroup ?? "General";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [configs]);

  const editableCount = (configs as any[]).filter((c: any) => c.isEditable).length;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / System Configuration
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              System Configuration
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Platform-wide constants governing scoring thresholds, session behaviour, financial defaults, and notification settings.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{(configs as any[]).length}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Config Keys</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{editableCount}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Editable</p>
            </div>
          </div>
        </div>

        {/* Usage hint */}
        <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
          <Pencil size={11} style={{ color: "#3b82f6" }} />
          Click the edit icon on any row to modify its value. Press Enter to save or Escape to cancel.
          <Lock size={11} style={{ color: "#334155", marginLeft: "8px" }} />
          Greyed lock = read-only system constant.
        </div>
      </div>

      {/* Config groups */}
      <div className="px-8 py-6 space-y-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading configuration…</p>
        ) : (
          grouped.map(([group, rows]) => {
            const gc = groupCfg(group);
            return (
              <div key={group}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: gc.color }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: gc.color }}>
                    {group}
                  </h2>
                  <span className="text-xs" style={{ color: "#334155" }}>({rows.length})</span>
                  <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
                </div>

                {/* Rows */}
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
                  {/* Column labels */}
                  <div
                    className="grid px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      gridTemplateColumns: "14rem 16rem 1fr 2rem",
                      background: "#0a1520",
                      color: "#334155",
                      borderBottom: "1px solid #1e2d3d",
                    }}
                  >
                    <span>Config Key</span>
                    <span>Value</span>
                    <span>Description</span>
                    <span />
                  </div>

                  {rows.map((row: any, i: number) => (
                    <div
                      key={row.configKey}
                      style={{
                        background: i % 2 === 0 ? "#080f18" : "#070d15",
                        borderBottom: i < rows.length - 1 ? "1px solid #0d1825" : "none",
                      }}
                    >
                      <ConfigRow row={row} onSave={handleSave} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
