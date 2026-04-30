// ============================================================
// ADMIN PLACEHOLDER — Shared placeholder for coming-soon sections
// ============================================================

import { useLocation } from "wouter";
import {
  Users, ShieldCheck, LayoutTemplate, Database, Settings2,
  Plug, Code2, ClipboardList, SlidersHorizontal, ChevronLeft,
  Construction,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_META: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; description: string; color: string }> = {
  "/admin/users": {
    icon: Users,
    label: "Users & Roles",
    description: "Manage platform users, assign roles (Admin, Founder, Coach, Advisor, Investor), and control access permissions.",
    color: "#3A97D3",
  },
  "/admin/permissions": {
    icon: ShieldCheck,
    label: "Permissions",
    description: "Configure granular permissions per role and module. Set read, write, approve, and export rights.",
    color: "#F49C13",
  },
  "/admin/templates": {
    icon: LayoutTemplate,
    label: "Templates",
    description: "Manage reusable templates for BMC, hypotheses, interview scripts, pitch decks, and reports.",
    color: "#c084fc",
  },
  "/admin/data-fields": {
    icon: Database,
    label: "Data Fields",
    description: "Configure custom data fields, field types, validation rules, and default values per module.",
    color: "#22d3ee",
  },
  "/admin/modules": {
    icon: Settings2,
    label: "Module Settings",
    description: "Enable, disable, and configure individual OS modules. Set module-level defaults and display options.",
    color: "#fb923c",
  },
  "/admin/integrations": {
    icon: Plug,
    label: "Integrations",
    description: "Connect external services: Google Drive, Notion, Slack, Airtable, and third-party APIs.",
    color: "#4ade80",
  },
  "/admin/api": {
    icon: Code2,
    label: "API Settings",
    description: "Manage API keys, webhook endpoints, rate limits, and external data source configurations.",
    color: "#f472b6",
  },
  "/admin/audit": {
    icon: ClipboardList,
    label: "Audit Logs",
    description: "View a complete audit trail of all system actions: logins, data changes, exports, and approvals.",
    color: "#94a3b8",
  },
  "/admin/config": {
    icon: SlidersHorizontal,
    label: "System Configuration",
    description: "Configure global platform settings: scoring weights, stage-gate thresholds, notification rules.",
    color: "#fbbf24",
  },
};

export default function AdminPlaceholder() {
  const [location, navigate] = useLocation();
  const meta = PAGE_META[location] ?? {
    icon: SlidersHorizontal,
    label: "Admin",
    description: "This section is coming soon.",
    color: "#51AF37",
  };
  const Icon = meta.icon;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      <div className="px-8 py-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="mb-3 -ml-2"
          style={{ color: "#64748b" }}
        >
          <ChevronLeft size={14} className="mr-1" /> Admin
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${meta.color}15` }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
              {meta.label}
            </h1>
            <p className="text-sm" style={{ color: "#64748b" }}>{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "#0a1520", border: "1px solid #1e2d3d" }}>
          <Construction size={28} style={{ color: "#475569" }} />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold" style={{ color: "#94a3b8" }}>
            {meta.label} — Coming in v02
          </p>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>
            This section is on the EcoBlend OS roadmap. The Playbook Library is live now.
          </p>
        </div>
        <Button onClick={() => navigate("/admin/playbooks")}
          style={{ background: "#51AF37", color: "#fff" }}>
          Go to Playbook Library
        </Button>
      </div>
    </div>
  );
}
