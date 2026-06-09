// ============================================================
// ADMIN — WIDGET ANALYTICS + SETTINGS (Combined)
// Usage telemetry for every dashboard widget + layout controls
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { BarChart3, Eye, Users, Clock, TrendingUp } from "lucide-react";

const GRP: Record<string, string> = {
  "Dashboard":   "#56A837",
  "Lean Canvas": "#f59e0b",
  "Validation":  "#22d3ee",
  "R&D":         "#fb923c",
  "Risk":        "#ef4444",
  "Discovery":   "#34d399",
  "Admin":       "#a78bfa",
};
function gc(g: string | null) { return GRP[g ?? ""] ?? "#64748b"; }

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: "#0f1923" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

const ALL_GROUPS = ["All", "Dashboard", "Lean Canvas", "Validation", "R&D", "Risk", "Discovery", "Admin"];

const DEFAULT_ORDER = [
  { id: "portfolio-overview-card",   label: "Portfolio Overview Card",       visible: true  },
  { id: "vrl-score-card",            label: "Avg VRL Score Card",            visible: true  },
  { id: "trl-score-card",            label: "Avg TRL Score Card",            visible: true  },
  { id: "brl-score-card",            label: "Avg BRL Score Card",            visible: true  },
  { id: "portfolio-analytics-hub",   label: "Portfolio Analytics Hub Graph", visible: true  },
  { id: "portfolio-brands-panel",    label: "Portfolio Brands Panel",        visible: true  },
  { id: "lean-canvas-block-grid",    label: "Lean Canvas Block Grid",        visible: true  },
  { id: "hypothesis-register-table", label: "Hypothesis Register Table",     visible: true  },
  { id: "prototype-milestones-grid", label: "Prototype Milestones Grid",     visible: true  },
  { id: "audit-log-timeline",        label: "Audit Log Timeline",            visible: false },
];

export default function AdminWidgetAnalytics() {
  const [activeGroup, setGroup] = useState("All");
  const [tab, setTab]           = useState<"analytics" | "settings">("analytics");
  const [order, setOrder]       = useState(DEFAULT_ORDER);

  const { data: widgets = [], isLoading } = trpc.admin.getWidgetTelemetry.useQuery();

  const filtered = useMemo(() => {
    let list = widgets as any[];
    if (activeGroup !== "All") list = list.filter((w: any) => w.widgetGroup === activeGroup);
    return list;
  }, [widgets, activeGroup]);

  const maxViews  = useMemo(() => Math.max(...(widgets as any[]).map((w: any) => Number(w.pageViews) || 0), 1), [widgets]);
  const totalViews = useMemo(() => (widgets as any[]).reduce((s: number, w: any) => s + (Number(w.pageViews) || 0), 0), [widgets]);
  const avgRate   = useMemo(() => {
    const list = widgets as any[];
    if (!list.length) return "0.0";
    return (list.reduce((s: number, w: any) => s + Number(w.interactionRate ?? 0), 0) / list.length).toFixed(1);
  }, [widgets]);

  function moveUp(i: number) {
    if (i === 0) return;
    const n = [...order]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setOrder(n);
  }
  function moveDown(i: number) {
    if (i === order.length - 1) return;
    const n = [...order]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setOrder(n);
  }
  function toggleVisible(i: number) {
    const n = [...order]; n[i] = { ...n[i], visible: !n[i].visible }; setOrder(n);
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>Admin / Widgets</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>Widget Analytics & Settings</h1>
          </div>
          <div className="flex items-center gap-6 mt-1">
            {[
              { label: "Total Views",   value: totalViews.toLocaleString(), color: "#e2e8f0" },
              { label: "Widgets",       value: String((widgets as any[]).length),             color: "#56A837"  },
              { label: "Avg Interact.", value: `${avgRate}%`,               color: "#22d3ee" },
            ].map(s => (
              <div key={s.label} className="text-right">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-1">
          {(["analytics", "settings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: tab === t ? "#56A83720" : "transparent", color: tab === t ? "#56A837" : "#475569", border: `1px solid ${tab === t ? "#56A83750" : "transparent"}` }}>
              {t === "analytics" ? "📊 Usage Analytics" : "⚙️ Layout Settings"}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics tab */}
      {tab === "analytics" && (
        <div className="px-8 py-6">
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {ALL_GROUPS.map(g => {
              const active = activeGroup === g;
              const color = g === "All" ? "#56A837" : gc(g);
              return (
                <button key={g} onClick={() => setGroup(g)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: active ? `${color}18` : "#0a1520", color: active ? color : "#475569", border: `1px solid ${active ? color + "50" : "#1e2d3d"}` }}>
                  {g}
                </button>
              );
            })}
          </div>
          {isLoading ? (
            <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading telemetry…</p>
          ) : (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
              <div className="grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr", background: "#0a1520", color: "#334155", borderBottom: "1px solid #1e2d3d" }}>
                <span>Widget</span>
                <span className="text-right flex items-center justify-end gap-1"><Eye size={9} /> Views</span>
                <span className="text-right flex items-center justify-end gap-1"><Users size={9} /> Users</span>
                <span className="text-right flex items-center justify-end gap-1"><TrendingUp size={9} /> Interact.</span>
                <span className="text-right flex items-center justify-end gap-1"><Clock size={9} /> Dwell</span>
                <span className="text-right">Bar</span>
              </div>
              {filtered.map((w: any, i: number) => {
                const color = gc(w.widgetGroup);
                const pct   = Math.round((Number(w.pageViews) / maxViews) * 100);
                const rate  = Number(w.interactionRate);
                return (
                  <div key={w.widgetId} className="grid items-center px-5 py-3.5"
                    style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr", background: i % 2 === 0 ? "#080f18" : "#070d15", borderBottom: i < filtered.length - 1 ? "1px solid #0d1825" : "none" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{w.widgetLabel}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color, background: `${color}15` }}>{w.widgetGroup ?? "—"}</span>
                        <span className="text-[10px] font-mono" style={{ color: "#334155" }}>{w.widgetPage}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-right" style={{ color: "#e2e8f0" }}>{Number(w.pageViews).toLocaleString()}</p>
                    <p className="text-sm text-right" style={{ color: "#64748b" }}>{Number(w.uniqueUsers).toLocaleString()}</p>
                    <p className="text-sm text-right font-semibold" style={{ color: rate >= 70 ? "#56A837" : rate >= 50 ? "#f59e0b" : "#ef4444" }}>{rate.toFixed(1)}%</p>
                    <p className="text-sm text-right" style={{ color: "#64748b" }}>{w.avgDwellSecs}s</p>
                    <div className="pl-4"><Bar pct={pct} color={color} /><p className="text-[10px] text-right mt-0.5" style={{ color: "#334155" }}>{pct}%</p></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="px-8 py-6">
          <p className="text-xs mb-5" style={{ color: "#475569" }}>Re-order widgets and toggle their visibility on the dashboard.</p>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
            <div className="grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ gridTemplateColumns: "2rem 1fr 6rem 5rem", background: "#0a1520", color: "#334155", borderBottom: "1px solid #1e2d3d" }}>
              <span>#</span><span>Widget</span><span className="text-center">Visible</span><span className="text-center">Order</span>
            </div>
            {order.map((w, i) => (
              <div key={w.id} className="grid items-center px-5 py-3"
                style={{ gridTemplateColumns: "2rem 1fr 6rem 5rem", background: i % 2 === 0 ? "#080f18" : "#070d15", borderBottom: i < order.length - 1 ? "1px solid #0d1825" : "none", opacity: w.visible ? 1 : 0.45 }}>
                <span className="text-xs font-mono" style={{ color: "#334155" }}>{i + 1}</span>
                <span className="text-sm font-medium" style={{ color: w.visible ? "#e2e8f0" : "#475569" }}>{w.label}</span>
                <div className="flex justify-center">
                  <button onClick={() => toggleVisible(i)}
                    className="w-10 h-5 rounded-full relative transition-all"
                    style={{ background: w.visible ? "#56A837" : "#1e2d3d", border: `1px solid ${w.visible ? "#4a9030" : "#2d3f52"}` }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: w.visible ? "calc(100% - 18px)" : "2px" }} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => moveUp(i)} disabled={i === 0}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "#0a1520", color: i === 0 ? "#1e2d3d" : "#475569", border: "1px solid #1e2d3d" }}>↑</button>
                  <button onClick={() => moveDown(i)} disabled={i === order.length - 1}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "#0a1520", color: i === order.length - 1 ? "#1e2d3d" : "#475569", border: "1px solid #1e2d3d" }}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
