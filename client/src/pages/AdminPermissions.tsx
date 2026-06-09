// ============================================================
// ADMIN — PERMISSIONS MATRIX
// Roles × Features access control grid (read/write/delete)
// ============================================================
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Check, X } from "lucide-react";

// ── Role column styling ───────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { header: string; bg: string; dim: string }> = {
  "Studio Director": { header: "#a78bfa", bg: "#1e103520", dim: "#a78bfa30" },
  "Platform Admin":  { header: "#f59e0b", bg: "#1c120020", dim: "#f59e0b30" },
  "Coach":           { header: "#22d3ee", bg: "#051a1f20", dim: "#22d3ee30" },
  "Founder":         { header: "#56A837", bg: "#071a0320", dim: "#56A83730" },
};

// ── Group styling ─────────────────────────────────────────────────────────────
const GROUP_COLORS: Record<string, string> = {
  "Core Operations":      "#56A837",
  "Validation":           "#22d3ee",
  "Scoring & Assessment": "#a78bfa",
  "Governance":           "#f59e0b",
  "Investment":           "#34d399",
  "Build":                "#fb923c",
  "Admin":                "#ef4444",
};

function PermCell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#071a03", border: "1px solid #56A83740" }}>
      <Check size={11} style={{ color: "#56A837" }} strokeWidth={3} />
    </div>
  ) : (
    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#110a0a", border: "1px solid #ef444430" }}>
      <X size={11} style={{ color: "#ef4444" }} strokeWidth={2.5} />
    </div>
  );
}

function ActionGroup({ label, read, write, del }: { label: string; read: boolean; write: boolean; del: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <PermCell allowed={read} />
      <PermCell allowed={write} />
      <PermCell allowed={del} />
    </div>
  );
}

const ACTION_LABELS = ["Read", "Write", "Delete"];

export default function AdminPermissions() {
  const { data, isLoading } = trpc.admin.getPermissionsLayout.useQuery();
  const [activeGroup, setActiveGroup] = useState<string>("All");

  const groups = useMemo(() => {
    if (!data) return [];
    return ["All", ...Array.from(new Set(data.matrix.map((r: any) => r.group)))];
  }, [data]);

  const visibleMatrix = useMemo(() => {
    if (!data) return [];
    return activeGroup === "All"
      ? data.matrix
      : data.matrix.filter((r: any) => r.group === activeGroup);
  }, [data, activeGroup]);

  const roles = data?.roles ?? [];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Permissions
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Permissions Matrix
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Role-based access control across all EcoBlend OS modules. Read / Write / Delete per feature.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs" style={{ color: "#475569" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "#071a03", border: "1px solid #56A83740" }}>
                <Check size={10} style={{ color: "#56A837" }} strokeWidth={3} />
              </div>
              Permitted
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "#110a0a", border: "1px solid #ef444430" }}>
                <X size={10} style={{ color: "#ef4444" }} strokeWidth={2.5} />
              </div>
              Restricted
            </div>
          </div>
        </div>

        {/* Group filter */}
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {groups.map(g => {
            const isActive = activeGroup === g;
            const color = g === "All" ? "#56A837" : (GROUP_COLORS[g] ?? "#64748b");
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
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

      {/* Matrix */}
      <div className="px-8 py-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading permissions…</p>
        ) : (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>

            {/* Column headers */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `1fr repeat(${roles.length}, 1fr)`,
                background: "#0a1520",
                borderBottom: "1px solid #1e2d3d",
              }}
            >
              <div className="px-5 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#334155" }}>
                Module / Feature
              </div>
              {roles.map((role: string) => {
                const rc = ROLE_COLORS[role] ?? { header: "#64748b", bg: "transparent", dim: "#64748b30" };
                return (
                  <div key={role} className="px-3 py-4 text-center">
                    <p className="text-xs font-bold" style={{ color: rc.header }}>{role}</p>
                    <div className="flex justify-center gap-3 mt-2">
                      {ACTION_LABELS.map(a => (
                        <span key={a} className="text-[10px]" style={{ color: "#334155" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rows grouped */}
            {(() => {
              const groupedRows: JSX.Element[] = [];
              let lastGroup = "";
              (visibleMatrix as any[]).forEach((row: any, i: number) => {
                const groupColor = GROUP_COLORS[row.group] ?? "#64748b";
                if (row.group !== lastGroup) {
                  lastGroup = row.group;
                  groupedRows.push(
                    <div
                      key={`grp-${row.group}`}
                      className="px-5 py-2 flex items-center gap-2"
                      style={{ background: `${groupColor}0a`, borderBottom: "1px solid #1e2d3d" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: groupColor }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: groupColor }}>
                        {row.group}
                      </span>
                    </div>
                  );
                }

                groupedRows.push(
                  <div
                    key={row.module}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: `1fr repeat(${roles.length}, 1fr)`,
                      background: i % 2 === 0 ? "#080f18" : "#070d15",
                      borderBottom: "1px solid #0d1825",
                    }}
                  >
                    {/* Module name */}
                    <div className="px-5 py-3">
                      <span className="text-sm" style={{ color: "#94a3b8" }}>{row.module}</span>
                    </div>

                    {/* Permission cells per role */}
                    {roles.map((role: string) => {
                      const perms = row.permissions[role];
                      const rc = ROLE_COLORS[role] ?? { header: "#64748b", bg: "transparent", dim: "#64748b30" };
                      return (
                        <div key={role} className="px-3 py-3 flex justify-center">
                          <div className="flex gap-3">
                            {[
                              { key: "read",   val: perms?.read   },
                              { key: "write",  val: perms?.write  },
                              { key: "delete", val: perms?.delete },
                            ].map(({ key, val }) => (
                              <div key={key} title={`${key}: ${val ? "allowed" : "denied"}`}>
                                {val ? (
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center"
                                    style={{ background: `${rc.header}15`, border: `1px solid ${rc.header}40` }}
                                  >
                                    <Check size={11} style={{ color: rc.header }} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center"
                                    style={{ background: "#110a0a", border: "1px solid #1e2d3d" }}
                                  >
                                    <X size={11} style={{ color: "#334155" }} strokeWidth={2} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
              return groupedRows;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
