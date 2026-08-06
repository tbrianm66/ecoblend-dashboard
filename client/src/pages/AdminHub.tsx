// ============================================================
// ADMIN HUB — Landing page for all Admin sections
// ============================================================

import { useLocation } from "wouter";
import {
  BookOpenCheck, Users, ShieldCheck, LayoutTemplate,
  Database, Settings2, Plug, Code2, ClipboardList,
  SlidersHorizontal, ChevronRight, BarChart3, Sliders, CheckSquare,
  GitBranch, ShieldAlert,
} from "lucide-react";

const ADMIN_SECTIONS = [
  {
    id: "playbooks",
    href: "/admin/playbooks",
    icon: BookOpenCheck,
    label: "Playbook Library",
    description: "Create, manage, version, and publish operational playbooks. Assign to modules, workflow stages, and user roles.",
    color: "#56A837",
    count: "20 playbooks",
  },
  {
    id: "users",
    href: "/admin/users",
    icon: Users,
    label: "Users & Roles",
    description: "Manage platform users, assign roles (Admin, Founder, Coach, Advisor, Investor), and control access.",
    color: "#3B85BA",
    count: "Coming soon",
  },
  {
    id: "permissions",
    href: "/admin/permissions",
    icon: ShieldCheck,
    label: "Permissions",
    description: "Configure granular permissions per role and module. Set read, write, approve, and export rights.",
    color: "#F69111",
    count: "Coming soon",
  },
  {
    id: "templates",
    href: "/admin/templates",
    icon: LayoutTemplate,
    label: "Templates",
    description: "Manage reusable templates for BMC, hypotheses, interview scripts, pitch decks, and reports.",
    color: "#c084fc",
    count: "Coming soon",
  },
  {
    id: "data-fields",
    href: "/admin/data-fields",
    icon: Database,
    label: "Data Fields",
    description: "Configure custom data fields, field types, validation rules, and default values per module.",
    color: "#22d3ee",
    count: "Coming soon",
  },
  {
    id: "modules",
    href: "/admin/modules",
    icon: Settings2,
    label: "Module Settings",
    description: "Enable, disable, and configure individual OS modules. Set module-level defaults and display options.",
    color: "#fb923c",
    count: "Coming soon",
  },
  {
    id: "integrations",
    href: "/admin/integrations",
    icon: Plug,
    label: "Integrations",
    description: "Connect external services: Google Drive, Notion, Slack, Airtable, and third-party APIs.",
    color: "#4ade80",
    count: "Coming soon",
  },
  {
    id: "api",
    href: "/admin/api",
    icon: Code2,
    label: "API Settings",
    description: "Manage API keys, webhook endpoints, rate limits, and external data source configurations.",
    color: "#f472b6",
    count: "Coming soon",
  },
  {
    id: "audit",
    href: "/admin/audit",
    icon: ClipboardList,
    label: "Audit Logs",
    description: "View a complete audit trail of all system actions: logins, data changes, exports, and approvals.",
    color: "#94a3b8",
    count: "Coming soon",
  },
  {
    id: "config",
    href: "/admin/config",
    icon: SlidersHorizontal,
    label: "System Configuration",
    description: "Configure global platform settings: scoring weights, stage-gate thresholds, notification rules.",
    color: "#fbbf24",
    count: "Coming soon",
  },
  {
    id: "context-rules",
    href: "/admin/context-rules",
    icon: GitBranch,
    label: "Context Rules",
    description: "Manage context-matching rules that determine which playbooks appear automatically based on module, VRL/TRL stage, and venture state.",
    color: "#56A837",
    count: "Live",
  },
  {
    id: "widget-analytics",
    href: "/admin/widget-analytics",
    icon: BarChart3,
    label: "Widget Analytics",
    description: "View usage metrics, engagement rates, completion rates, and top recommendations for all contextual widget cards.",
    color: "#3B85BA",
    count: "Live",
  },
  {
    id: "widget-settings",
    href: "/admin/widget-settings",
    icon: Sliders,
    label: "Widget Settings",
    description: "Configure global widget behaviour, thresholds, module-level controls, and role visibility for the contextual widget system.",
    color: "#8b5cf6",
    count: "Live",
  },
  {
    id: "production-readiness",
    href: "/admin/production-readiness",
    icon: CheckSquare,
    label: "Production Readiness",
    description: "Pre-launch verification checklist covering all Phase 3C hardening areas: DB schema, permissions, thresholds, QA tests, and more.",
    color: "#F69111",
    count: "Live",
  },
  {
    id: "scorecard-telemetry",
    href: "/admin/scorecard-telemetry",
    icon: ShieldAlert,
    label: "System Integrity & Scorecard",
    description: "Real-time kill-criteria monitor for audit hypotheses H1–H8 (FHV-EB-AUD-001 §4). Tracks reproducibility, evidence-bound scores, parity, commercial viability, predictive signal, coaching integrity, module usability, and environmental integrity.",
    color: "#ef4444",
    count: "Live",
  },
];

export default function AdminHub() {
  const [, navigate] = useLocation();

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#080f18" }}>
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#1e2d3d" }}>
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={16} style={{ color: "#56A837" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#56A837" }}>
            Admin
          </span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
          Admin Control Centre
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
          Manage users, permissions, playbooks, templates, integrations, and system configuration.
        </p>
      </div>

      {/* Grid */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ADMIN_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => navigate(section.href)}
              className="text-left rounded-xl p-5 transition-all hover:scale-[1.01]"
              style={{ background: "#0a1520", border: "1px solid #1e2d3d" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${section.color}15` }}>
                  <Icon size={16} style={{ color: section.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "#475569" }}>
                  {section.count}
                  <ChevronRight size={12} />
                </div>
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: "#e2e8f0", fontFamily: "'Prompt', sans-serif" }}>
                {section.label}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {section.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
