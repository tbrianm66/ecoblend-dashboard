// ============================================================
// ADMIN — INTEGRATIONS DIRECTORY
// App-store grid: connect / disconnect external services
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Puzzle, RefreshCw, CheckCircle2, Clock } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
  "Messaging":    "#22d3ee",
  "Productivity": "#56A837",
  "CRM":          "#f59e0b",
  "Knowledge":    "#94a3b8",
  "Development":  "#6366f1",
  "Automation":   "#f59e0b",
  "Payments":     "#a78bfa",
  "AI":           "#e879f9",
  "Data":         "#34d399",
  "Email":        "#fb923c",
  "Scheduling":   "#3b82f6",
};
function catColor(c: string | null) { return CAT_COLORS[c ?? ""] ?? "#64748b"; }

const ALL_CATS = ["All", ...Object.keys(CAT_COLORS)];

function timeAgo(d: Date | string | null) {
  if (!d) return null;
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminIntegrations() {
  const [activeCategory, setCategory] = useState("All");
  const [toggling, setToggling]        = useState<Record<string, boolean>>({});
  const [localState, setLocal]         = useState<Record<string, boolean>>({});

  const { data: integs = [], refetch } = trpc.admin.getIntegrationDirectory.useQuery();
  const utils = trpc.useUtils();

  const toggleMutation = trpc.admin.toggleIntegrationStatus.useMutation({
    onSuccess: (data) => {
      utils.admin.getIntegrationDirectory.invalidate();
      setToggling(s => ({ ...s, [data.serviceSlug]: false }));
      toast.success(data.isConnected ? "Integration connected successfully." : "Integration disconnected.");
    },
    onError: (_, vars) => {
      setToggling(s => ({ ...s, [vars.serviceSlug]: false }));
      setLocal(s => { const n = { ...s }; delete n[vars.serviceSlug]; return n; });
      toast.error("Failed to update integration status.");
    },
  });

  function handleToggle(slug: string, current: boolean) {
    const next = !current;
    setLocal(s => ({ ...s, [slug]: next }));
    setToggling(s => ({ ...s, [slug]: true }));
    toggleMutation.mutate({ serviceSlug: slug, isConnected: next });
  }

  function isConnected(intg: any) {
    return localState[intg.serviceSlug] !== undefined ? localState[intg.serviceSlug] : !!intg.isConnected;
  }

  const filtered = useMemo(() => {
    const list = integs as any[];
    return activeCategory === "All" ? list : list.filter((i: any) => i.category === activeCategory);
  }, [integs, activeCategory]);

  const connectedCount = (integs as any[]).filter((i: any) => isConnected(i)).length;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Puzzle size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>Admin / Integrations</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>Integration Directory</h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Connect external platforms to EcoBlend OS for automated data sync, notifications, and AI enrichment.</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Connected",    value: connectedCount,                              color: "#56A837" },
              { label: "Available",    value: (integs as any[]).length - connectedCount,   color: "#475569" },
              { label: "Total",        value: (integs as any[]).length,                    color: "#e2e8f0" },
            ].map(s => (
              <div key={s.label} className="text-right">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="mt-5 flex flex-wrap gap-2">
          {ALL_CATS.filter(c => c === "All" || (integs as any[]).some((i: any) => i.category === c)).map(cat => {
            const active = activeCategory === cat;
            const color  = cat === "All" ? "#56A837" : catColor(cat);
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: active ? `${color}18` : "#0a1520", color: active ? color : "#475569", border: `1px solid ${active ? color + "50" : "#1e2d3d"}` }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card grid */}
      <div className="px-8 py-6">
        {(filtered as any[]).length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Puzzle size={28} style={{ color: "#1e2d3d" }} />
            <p className="text-sm" style={{ color: "#475569" }}>No integrations in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(filtered as any[]).map((intg: any) => {
              const connected  = isConnected(intg);
              const isSaving   = !!toggling[intg.serviceSlug];
              const cc         = catColor(intg.category);
              const ago        = timeAgo(intg.lastSyncTime);

              return (
                <div key={intg.serviceSlug}
                  className="rounded-xl border p-5 flex flex-col gap-3"
                  style={{ background: "#0a1520", borderColor: connected ? "#56A83740" : "#1e2d3d" }}>

                  {/* Top: logo + name + category */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: "#080f18", border: "1px solid #1e2d3d" }}>
                        {intg.logoEmoji ?? "🔌"}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{intg.serviceName}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: cc, background: `${cc}15` }}>
                          {intg.category}
                        </span>
                      </div>
                    </div>
                    {/* Status dot */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#56A837" : "#334155" }} />
                      <span className="text-xs font-semibold" style={{ color: connected ? "#56A837" : "#475569" }}>
                        {connected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs leading-relaxed flex-1" style={{ color: "#64748b" }}>
                    {intg.description ?? "No description available."}
                  </p>

                  {/* Last sync */}
                  {connected && ago && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#334155" }}>
                      <Clock size={10} />
                      Last synced {ago}
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => handleToggle(intg.serviceSlug, connected)}
                    disabled={isSaving}
                    className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    style={connected ? {
                      background: "#1f0505",
                      color: "#ef4444",
                      border: "1px solid #ef444440",
                    } : {
                      background: "#071a03",
                      color: "#56A837",
                      border: "1px solid #56A83750",
                    }}
                  >
                    {isSaving ? (
                      <><RefreshCw size={13} className="animate-spin" /> Updating…</>
                    ) : connected ? (
                      "Disconnect"
                    ) : (
                      <><CheckCircle2 size={13} /> Connect</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
