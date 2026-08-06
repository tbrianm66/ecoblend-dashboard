// ============================================================
// ADMIN — USERS & ROLES DIRECTORY
// Search-filterable user table with role badges + venture assignments
// Admins can update any user's system role inline via a dropdown.
// ============================================================
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Users, Search, X, Circle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  "Studio Director":            { color: "#a78bfa", bg: "#1e1035" },
  "Platform Admin":             { color: "#f59e0b", bg: "#1c1200" },
  "Coach":                      { color: "#22d3ee", bg: "#051a1f" },
  "Founder":                    { color: "#56A837", bg: "#071a03" },
  "Advisor":                    { color: "#f472b6", bg: "#1a0614" },
  "Investor":                   { color: "#34d399", bg: "#021a0e" },
  "Scoring Integrity Reviewer": { color: "#fb923c", bg: "#1a0b00" },
};
function roleCfg(role: string) {
  return ROLE_CFG[role] ?? { color: "#64748b", bg: "#0f1115" };
}

// All assignable roles shown in the dropdown
const ASSIGNABLE_ROLES = [
  "Studio Director",
  "Platform Admin",
  "Coach",
  "Founder",
  "Advisor",
  "Investor",
  "Scoring Integrity Reviewer",
] as const;
type AssignableRole = typeof ASSIGNABLE_ROLES[number];

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#56A837", "#22d3ee", "#a78bfa", "#f59e0b", "#f472b6", "#34d399"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

const ROLE_FILTERS = ["All Roles", ...ASSIGNABLE_ROLES];

// ── Inline role dropdown ──────────────────────────────────────────────────────
function RoleDropdown({ userId, currentRole, onSuccess }: {
  userId: number;
  currentRole: string;
  onSuccess: (newRole: string) => void;
}) {
  const utils = trpc.useUtils();
  const mutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: (_data, vars) => {
      utils.admin.getUsersAndRoles.invalidate();
      onSuccess(vars.systemRole);
      toast.success(`Role changed to ${vars.systemRole}.`);
    },
    onError: (err) => {
      toast.error(`Failed to update role: ${err.message}`);
    },
  });

  const cfg = roleCfg(currentRole);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as AssignableRole;
    if (newRole === currentRole) return;
    mutation.mutate({ id: userId, systemRole: newRole });
  }

  return (
    <div className="relative inline-flex items-center">
      <span
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
        {currentRole}
      </span>
      <div className="relative ml-1">
        <select
          value={currentRole}
          onChange={handleChange}
          disabled={mutation.isPending}
          title="Change role"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ minWidth: 0 }}
        >
          {ASSIGNABLE_ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <ChevronDown
          size={12}
          style={{ color: mutation.isPending ? "#334155" : "#64748b" }}
          className="pointer-events-none"
        />
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("All Roles");

  const { data: users = [], isLoading } = trpc.admin.getUsersAndRoles.useQuery();

  const ventures = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [{ id: "all", name: "All Ventures" }];
    (users as any[]).forEach((u: any) => {
      if (u.assignedVentureId && !seen.has(u.assignedVentureId)) {
        seen.add(u.assignedVentureId);
        list.push({ id: u.assignedVentureId, name: u.ventureName ?? u.assignedVentureId });
      }
    });
    return list;
  }, [users]);

  const [ventureFilter, setVenture] = useState("all");

  const filtered = useMemo(() => {
    let list = users as any[];
    if (roleFilter !== "All Roles")   list = list.filter((u: any) => u.systemRole === roleFilter);
    if (ventureFilter !== "all")      list = list.filter((u: any) => u.assignedVentureId === ventureFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        u.userName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.ventureName ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, ventureFilter, search]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (users as any[]).forEach((u: any) => { m[u.systemRole] = (m[u.systemRole] ?? 0) + 1; });
    return m;
  }, [users]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={15} style={{ color: "#56A837" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
                Admin / Users & Roles
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              Users & Roles
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              All platform members, their assigned roles, and venture affiliations. Click the chevron beside a role to change it.
            </p>
          </div>

          {/* Role counts */}
          <div className="flex items-center gap-5 flex-wrap justify-end">
            {Object.entries(ROLE_CFG).map(([role, cfg]) => (
              <div key={role} className="text-right">
                <p className="text-xl font-bold" style={{ color: cfg.color }}>{counts[role] ?? 0}</p>
                <p className="text-[11px]" style={{ color: "#475569" }}>{role.split(" ")[0]}s</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-9 h-9 w-64 text-sm"
              style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#e2e8f0" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={12} style={{ color: "#475569" }} />
              </button>
            )}
          </div>

          {ROLE_FILTERS.map(r => {
            const isActive = roleFilter === r;
            const cfg = r === "All Roles" ? null : roleCfg(r);
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? (cfg ? cfg.bg : "#0f2a1a") : "#0a1520",
                  color: isActive ? (cfg ? cfg.color : "#56A837") : "#475569",
                  border: `1px solid ${isActive ? (cfg ? cfg.color + "50" : "#56A83750") : "#1e2d3d"}`,
                }}
              >
                {r}
              </button>
            );
          })}

          <div className="h-5 w-px" style={{ background: "#1e2d3d" }} />

          <select
            value={ventureFilter}
            onChange={e => setVenture(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs font-medium"
            style={{ background: "#0a1520", border: "1px solid #1e2d3d", color: "#94a3b8" }}
          >
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        {isLoading ? (
          <p className="text-sm py-12 text-center" style={{ color: "#475569" }}>Loading users…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={28} style={{ color: "#1e2d3d" }} />
            <p className="text-sm" style={{ color: "#475569" }}>No users match your filters.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e2d3d" }}>
            {/* Table header */}
            <div
              className="grid text-[11px] font-bold uppercase tracking-widest px-5 py-3"
              style={{
                gridTemplateColumns: "2.5rem 1fr 1fr 14rem 10rem 5rem",
                background: "#0a1520",
                color: "#334155",
                borderBottom: "1px solid #1e2d3d",
              }}
            >
              <span />
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Venture</span>
              <span>Status</span>
            </div>

            {/* Table rows */}
            {(filtered as any[]).map((u: any, i: number) => {
              const ac  = avatarColor(u.userName);
              return (
                <div
                  key={u.id}
                  className="grid items-center px-5 py-3 transition-colors"
                  style={{
                    gridTemplateColumns: "2.5rem 1fr 1fr 14rem 10rem 5rem",
                    background: i % 2 === 0 ? "#080f18" : "#070d15",
                    borderBottom: i < filtered.length - 1 ? "1px solid #111e2d" : "none",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#0d1a27")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#080f18" : "#070d15")}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${ac}22`, color: ac, border: `1px solid ${ac}40` }}
                  >
                    {initials(u.userName)}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{u.userName}</span>

                  {/* Email */}
                  <span className="text-xs font-mono" style={{ color: "#64748b" }}>{u.email}</span>

                  {/* Role — inline editable dropdown */}
                  <RoleDropdown
                    userId={u.id}
                    currentRole={u.systemRole}
                    onSuccess={() => {}}
                  />

                  {/* Venture */}
                  {u.ventureName ? (
                    <span
                      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                      style={{ color: "#56A837", background: "#071a0320", border: "1px solid #56A83730" }}
                    >
                      {u.ventureName}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "#334155" }}>—</span>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <Circle
                      size={7}
                      fill={u.isActive ? "#22c55e" : "#475569"}
                      style={{ color: u.isActive ? "#22c55e" : "#475569" }}
                    />
                    <span className="text-xs" style={{ color: u.isActive ? "#22c55e" : "#475569" }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs" style={{ color: "#334155" }}>
          Showing {filtered.length} of {(users as any[]).length} users
        </p>
      </div>
    </div>
  );
}
