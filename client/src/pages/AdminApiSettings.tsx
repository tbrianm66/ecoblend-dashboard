// ============================================================
// ADMIN — API SETTINGS
// Secure credential management: masked keys, copy, revoke, generate
// ============================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Key, Copy, ShieldOff, Plus, RefreshCw, X, Check } from "lucide-react";

function timeAgo(d: Date | string | null) {
  if (!d) return "Never";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SCOPE_COLORS: Record<string, string> = {
  "read:all":          "#22d3ee",
  "write:all":         "#56A837",
  "admin:all":         "#ef4444",
  "read:ventures":     "#3b82f6",
  "write:ventures":    "#56A837",
  "write:webhooks":    "#f59e0b",
  "write:ai_pipeline": "#e879f9",
  "read:financials":   "#34d399",
  "read:system":       "#94a3b8",
  "write:deployments": "#fb923c",
};
function scopeColor(s: string) { return SCOPE_COLORS[s] ?? "#475569"; }

export default function AdminApiSettings() {
  const [showGenForm, setShowGenForm] = useState(false);
  const [newKeyName,  setNewKeyName]  = useState("");
  const [newScopes,   setNewScopes]   = useState("read:ventures");
  const [generating,  setGenerating]  = useState(false);
  const [revoking,    setRevoking]    = useState<Record<number, boolean>>({});
  const [copied,      setCopied]      = useState<Record<number, boolean>>({});

  const { data: keys = [], refetch } = trpc.admin.getApiTokens.useQuery();
  const utils = trpc.useUtils();

  const revokeMutation = trpc.admin.revokeApiKey.useMutation({
    onSuccess: () => { utils.admin.getApiTokens.invalidate(); toast.success("API key revoked."); },
    onError:   () => toast.error("Failed to revoke key."),
    onSettled: (_, __, vars) => setRevoking(s => ({ ...s, [vars.id]: false })),
  });

  const generateMutation = trpc.admin.generateNewApiKey.useMutation({
    onSuccess: (row) => {
      utils.admin.getApiTokens.invalidate();
      toast.success(`Key "${row.keyName}" generated.`);
      setShowGenForm(false); setNewKeyName(""); setNewScopes("read:ventures");
    },
    onError:   () => toast.error("Failed to generate key."),
    onSettled: () => setGenerating(false),
  });

  function handleCopy(id: number, token: string) {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(s => ({ ...s, [id]: true }));
      toast.success("Token copied to clipboard.");
      setTimeout(() => setCopied(s => ({ ...s, [id]: false })), 2000);
    });
  }

  function handleRevoke(id: number) {
    setRevoking(s => ({ ...s, [id]: true }));
    revokeMutation.mutate({ id });
  }

  function handleGenerate() {
    if (!newKeyName.trim()) { toast.error("Key name is required."); return; }
    setGenerating(true);
    generateMutation.mutate({ keyName: newKeyName.trim(), scopes: newScopes, createdBy: "Admin" });
  }

  const activeKeys  = (keys as any[]).filter((k: any) => k.status === "Active").length;
  const revokedKeys = (keys as any[]).filter((k: any) => k.status === "Revoked").length;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Key size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>Admin / API Settings</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>API Settings</h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Manage developer access tokens — copy, revoke, or generate new credentials.</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Active Keys",  value: activeKeys,  color: "#56A837" },
              { label: "Revoked",      value: revokedKeys, color: "#475569" },
              { label: "Total",        value: (keys as any[]).length, color: "#e2e8f0" },
            ].map(s => (
              <div key={s.label} className="text-right">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate new key button */}
        <div className="mt-5">
          <button
            onClick={() => setShowGenForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: showGenForm ? "#1f0505" : "#071a03", color: showGenForm ? "#ef4444" : "#56A837", border: `1px solid ${showGenForm ? "#ef444440" : "#56A83750"}` }}
          >
            {showGenForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Generate New Token</>}
          </button>
        </div>
      </div>

      {/* Generate form */}
      {showGenForm && (
        <div className="mx-8 mt-6 rounded-xl border p-5" style={{ background: "#0a1520", borderColor: "#3b82f640" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#e2e8f0" }}>Generate New API Token</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#64748b" }}>Key Name *</label>
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. Reporting Integration"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#64748b" }}>Scopes</label>
              <input
                value={newScopes}
                onChange={e => setNewScopes(e.target.value)}
                placeholder="e.g. read:ventures write:webhooks"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: "#0f1923", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#56A837", color: "#fff" }}
          >
            {generating ? <><RefreshCw size={13} className="animate-spin" /> Generating…</> : <><Key size={13} /> Generate Token</>}
          </button>
        </div>
      )}

      {/* Keys table */}
      <div className="px-8 py-6">
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
          {/* Column header */}
          <div className="grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ gridTemplateColumns: "1.5fr 1.8fr 2fr 1fr 1fr 6rem", background: "#0a1520", color: "#334155", borderBottom: "1px solid #1e2d3d" }}>
            <span>Key Name</span>
            <span>Masked Token</span>
            <span>Scopes</span>
            <span>Last Used</span>
            <span>Status</span>
            <span className="text-center">Actions</span>
          </div>

          {(keys as any[]).length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3" style={{ background: "#080f18" }}>
              <Key size={24} style={{ color: "#1e2d3d" }} />
              <p className="text-sm" style={{ color: "#475569" }}>No API keys found.</p>
            </div>
          ) : (
            (keys as any[]).map((key: any, i: number) => {
              const isActive  = key.status === "Active";
              const isRevoking = !!revoking[key.id];
              const isCopied  = !!copied[key.id];
              const scopes    = (key.scopes ?? "").split(" ").filter(Boolean);

              return (
                <div key={key.id} className="grid items-center px-5 py-3.5"
                  style={{
                    gridTemplateColumns: "1.5fr 1.8fr 2fr 1fr 1fr 6rem",
                    background: i % 2 === 0 ? "#080f18" : "#070d15",
                    borderBottom: i < (keys as any[]).length - 1 ? "1px solid #0d1825" : "none",
                    opacity: isActive ? 1 : 0.5,
                  }}>
                  {/* Key name + created by */}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{key.keyName}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>by {key.createdBy ?? "System"}</p>
                  </div>

                  {/* Masked token */}
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono px-2 py-1 rounded" style={{ color: "#22d3ee", background: "#051a1f" }}>
                      {key.maskedToken}
                    </code>
                  </div>

                  {/* Scopes */}
                  <div className="flex flex-wrap gap-1">
                    {scopes.map((s: string) => (
                      <span key={s} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ color: scopeColor(s), background: `${scopeColor(s)}15` }}>
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Last used */}
                  <p className="text-xs" style={{ color: "#475569" }}>{timeAgo(key.lastUsed)}</p>

                  {/* Status badge */}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full w-fit"
                    style={{
                      color:  isActive ? "#56A837" : "#ef4444",
                      background: isActive ? "#071a03" : "#1f0505",
                      border: `1px solid ${isActive ? "#56A83730" : "#ef444430"}`,
                    }}>
                    {key.status}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Copy */}
                    <button onClick={() => handleCopy(key.id, key.maskedToken)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: isCopied ? "#071a03" : "#0f1923", border: `1px solid ${isCopied ? "#56A83740" : "#1e2d3d"}` }}
                      title="Copy token">
                      {isCopied ? <Check size={12} style={{ color: "#56A837" }} /> : <Copy size={12} style={{ color: "#475569" }} />}
                    </button>

                    {/* Revoke */}
                    {isActive && (
                      <button onClick={() => handleRevoke(key.id)} disabled={isRevoking}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: "#110a0a", border: "1px solid #ef444430" }}
                        title="Revoke key">
                        {isRevoking
                          ? <RefreshCw size={12} style={{ color: "#ef4444" }} className="animate-spin" />
                          : <ShieldOff size={12} style={{ color: "#ef4444" }} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-start gap-2 text-xs" style={{ color: "#334155" }}>
          <Key size={11} className="mt-0.5 shrink-0" style={{ color: "#475569" }} />
          Tokens are shown masked. Copy the token immediately after generation — it cannot be revealed again. Revoked tokens cannot be re-activated.
        </div>
      </div>
    </div>
  );
}
