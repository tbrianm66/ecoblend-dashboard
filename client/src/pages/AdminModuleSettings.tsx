// ============================================================
// ADMIN — MODULE SETTINGS
// Enable / disable platform modules via interactive toggles
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Settings2, ExternalLink, Shield } from "lucide-react";

// ── Module group colors ───────────────────────────────────────────────────────
const GROUP_CFG: Record<string, { color: string; bg: string }> = {
  "Core":       { color: "#56A837", bg: "#071a03" },
  "Validation": { color: "#22d3ee", bg: "#051a1f" },
  "Build":      { color: "#fb923c", bg: "#1c0d00" },
  "Scoring":    { color: "#a78bfa", bg: "#16102a" },
  "Investment": { color: "#f59e0b", bg: "#1c1200" },
  "Governance": { color: "#ef4444", bg: "#1f0505" },
  "Impact":     { color: "#34d399", bg: "#041e12" },
  "Network":    { color: "#6366f1", bg: "#0d0f2a" },
  "People":     { color: "#f472b6", bg: "#1a0914" },
  "AI":         { color: "#e879f9", bg: "#1a0d1f" },
};
function groupCfg(g: string | null) {
  return GROUP_CFG[g ?? ""] ?? { color: "#64748b", bg: "#0f1115" };
}

// ── Toggle switch component ───────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex items-center rounded-full transition-all shrink-0"
      style={{
        width: "44px",
        height: "24px",
        background: checked
          ? (disabled ? "#1a4a10" : "#56A837")
          : (disabled ? "#0f1115" : "#1e2d3d"),
        border: `1px solid ${checked ? (disabled ? "#2d6b1f" : "#4a9030") : "#2d3f52"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: "18px",
          height: "18px",
          background: checked ? "#fff" : "#475569",
          transform: checked ? "translateX(21px)" : "translateX(2px)",
          transition: "transform 0.2s, background 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

export default function AdminModuleSettings() {
  const { data: modules = [], isLoading } = trpc.admin.getModuleStatuses.useQuery();
  const utils = trpc.useUtils();

  // Local optimistic state: moduleNumber → isEnabled
  const [localState, setLocalState] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const toggleMutation = trpc.admin.toggleModuleStatus.useMutation({
    onSuccess: (data) => {
      utils.admin.getModuleStatuses.invalidate();
      setSaving(s => ({ ...s, [data.moduleNumber]: false }));
      toast.success(`Module ${data.isEnabled ? "enabled" : "disabled"} successfully.`);
    },
    onError: (err, vars) => {
      setSaving(s => ({ ...s, [vars.moduleNumber]: false }));
      setLocalState(s => { const n = { ...s }; delete n[vars.moduleNumber]; return n; });
      toast.error("Failed to update module status.");
    },
  });

  function handleToggle(moduleNumber: number, isCore: boolean, newVal: boolean) {
    if (isCore) return;
    setLocalState(s => ({ ...s, [moduleNumber]: newVal }));
    setSaving(s => ({ ...s, [moduleNumber]: true }));
    toggleMutation.mutate({ moduleNumber, isEnabled: newVal });
  }

  function isEnabled(mod: any): boolean {
    return localState[mod.moduleNumber] !== undefined
      ? localState[mod.moduleNumber]
      : mod.isEnabled;
  }

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (modules as any[]).forEach((m: any) => {
      const g = m.moduleGroup ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });
    return Array.from(map.entries());
  }, [modules]);

  const enabledCount  = (modules as any[]).filter((m: any) => isEnabled(m)).length;
  const disabledCount = (modules as any[]).length - enabledCount;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings2 size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Module Settings
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Module Settings
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Enable or disable platform modules. Core modules are always active and cannot be toggled.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#56A837" }}>{enabledCount}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Enabled</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#475569" }}>{disabledCount}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Disabled</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{(modules as any[]).length}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Total Modules</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-5 text-xs" style={{ color: "#475569" }}>
          <div className="flex items-center gap-1.5">
            <Shield size={12} style={{ color: "#56A837" }} />
            Core modules are always enabled and cannot be disabled.
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#1e2d3d" }} />
            Non-core modules can be toggled on/off.
          </div>
        </div>
      </div>

      {/* Module groups */}
      <div className="px-8 py-6 space-y-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading modules…</p>
        ) : (
          grouped.map(([group, mods]) => {
            const gc = groupCfg(group);
            return (
              <div key={group}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: gc.color }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: gc.color }}>
                    {group}
                  </h2>
                  <span className="text-xs" style={{ color: "#334155" }}>({mods.length})</span>
                  <div className="flex-1 h-px" style={{ background: "#1e2d3d" }} />
                </div>

                {/* Module rows */}
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
                  {mods.map((mod: any, i: number) => {
                    const enabled    = isEnabled(mod);
                    const isSaving   = !!saving[mod.moduleNumber];
                    const locked     = !!mod.isCore;

                    return (
                      <div
                        key={mod.moduleNumber}
                        className="flex items-center gap-4 px-5 py-3.5"
                        style={{
                          background: i % 2 === 0 ? "#080f18" : "#070d15",
                          borderBottom: i < mods.length - 1 ? "1px solid #0d1825" : "none",
                          opacity: isSaving ? 0.7 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {/* Number badge */}
                        <div
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                          style={{ background: gc.bg, color: gc.color, border: `1px solid ${gc.color}30` }}
                        >
                          {mod.moduleNumber}
                        </div>

                        {/* Name + route */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                              {mod.moduleName}
                            </span>
                            {locked && (
                              <span
                                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: "#56A837", background: "#071a0320", border: "1px solid #56A83730" }}
                              >
                                <Shield size={9} />
                                Core
                              </span>
                            )}
                          </div>
                          {mod.routePath && (
                            <span className="text-[11px] font-mono" style={{ color: "#334155" }}>
                              {mod.routePath}
                            </span>
                          )}
                        </div>

                        {/* Group chip */}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: gc.color, background: gc.bg, border: `1px solid ${gc.color}25` }}
                        >
                          {group}
                        </span>

                        {/* Status label */}
                        <span
                          className="text-xs font-medium w-16 text-right"
                          style={{ color: enabled ? "#56A837" : "#475569" }}
                        >
                          {isSaving ? "Saving…" : (enabled ? "Enabled" : "Disabled")}
                        </span>

                        {/* Toggle */}
                        <ToggleSwitch
                          checked={enabled}
                          disabled={locked || isSaving}
                          onChange={val => handleToggle(mod.moduleNumber, locked, val)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
