// ============================================================
// ECOBLEND OS SIDEBAR — 16-Module Workflow Architecture
// Design: Apple-style clarity · Strict validation sequence
// Source: Platform Architecture v2.0
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Zap, LayoutDashboard, Layers, Lightbulb, Rocket,
  Search, MessageSquare, Users, TrendingUp, BarChart2,
  FlaskConical, TestTube2, Briefcase, BookOpen,
  Factory, Truck, Cog, Package,
  Megaphone, Newspaper, Globe, Sparkles,
  Leaf, Heart, Award,
  ShieldAlert, AlertTriangle,
  PieChart, BarChart3, ClipboardList,
  DollarSign, FolderLock, FileText,
  GraduationCap, UserCircle2,
  Lock, Database, Settings2,
  BookOpenCheck, LayoutTemplate, Plug, Code2, SlidersHorizontal,
  ChevronDown, ChevronRight, Bell, X,
  Target, Compass, Building2, Shield, Map, HandCoins,
  UserCheck, Brain, GitBranch, Sliders, CheckSquare,
  ShieldCheck, Archive,
} from "lucide-react";
import { useVentures } from "@/contexts/VentureContext";
import GlobalVentureSelector from "@/components/GlobalVentureSelector";

type IconName = string;
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Zap, LayoutDashboard, Layers, Lightbulb, Rocket,
  Search, MessageSquare, Users, TrendingUp, BarChart2,
  FlaskConical, TestTube2, Briefcase, BookOpen,
  Factory, Truck, Cog, Package,
  Megaphone, Newspaper, Globe, Sparkles,
  Leaf, Heart, Award,
  ShieldAlert, AlertTriangle,
  PieChart, BarChart3, ClipboardList,
  DollarSign, FolderLock, FileText,
  GraduationCap, UserCircle2,
  Lock, Database, Settings2,
  BookOpenCheck, LayoutTemplate, Plug, Code2, SlidersHorizontal,
  Target, Compass, Building2, Shield, Map, HandCoins,
  UserCheck, Brain, GitBranch, Sliders, CheckSquare,
  ShieldCheck, Archive,
};

interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

// ── 16-Module Architecture (Strict Validation Sequence) ──
// Modules 1-15 follow the venture validation workflow.
// Module 16 (Admin) is always last.
const NAV_GROUPS: NavGroup[] = [
  {
    id: "command-centre",
    label: "1. Command Centre",
    defaultOpen: true,
    items: [
      { id: "cc-overview",  label: "Portfolio Overview",    icon: "LayoutDashboard", href: "/" },
      { id: "cc-command",   label: "Command Centre",       icon: "Zap",             href: "/command-centre" },
      { id: "cc-pipeline",  label: "Opportunity Pipeline", icon: "Lightbulb",       href: "/pipeline" },
      { id: "cc-status",    label: "Venture Status",       icon: "Target",          href: "/venture-status" },
      { id: "cc-alerts",    label: "Alerts & Approvals",   icon: "AlertTriangle",   href: "/alerts" },
      { id: "cc-decision",  label: "Decision Gate",        icon: "ShieldCheck",     href: "/decision-gate" },
      { id: "cc-archive",   label: "Venture Archive",      icon: "Archive",         href: "/ventures/archive" },
    ],
  },
  {
    id: "venture-intake",
    label: "2. Venture Intake",
    defaultOpen: false,
    items: [
      { id: "intake-form",       label: "New Venture Intake",   icon: "Rocket",          href: "/intake" },
      { id: "intake-founder",    label: "Founder Profile",      icon: "UserCircle2",     href: "/intake/founder" },
      { id: "intake-strategic",  label: "Strategic Fit",        icon: "Compass",         href: "/intake/strategic-fit" },
      { id: "intake-problem",    label: "Problem Statement",    icon: "Target",          href: "/intake/problem" },
      { id: "intake-hypotheses", label: "Hypothesis Register",  icon: "FlaskConical",    href: "/intake/hypotheses" },
    ],
  },
  {
    id: "discovery",
    label: "3. Discovery & Market",
    defaultOpen: false,
    items: [
      { id: "disc-interviews",  label: "Customer Discovery",   icon: "MessageSquare",   href: "/discovery" },
      { id: "disc-competitors", label: "Competitor Mapping",    icon: "Search",          href: "/discovery/competitors" },
      { id: "disc-demand",      label: "Demand Signals",       icon: "TrendingUp",      href: "/discovery/demand" },
      { id: "disc-wtp",         label: "WTP Assessment",       icon: "DollarSign",      href: "/discovery/wtp" },
      { id: "disc-market-risk", label: "Market Risk Log",      icon: "ShieldAlert",     href: "/discovery/market-risk" },
      { id: "disc-experiments", label: "Experiment Log",       icon: "FlaskConical",    href: "/discovery/experiments" },
    ],
  },
  {
    id: "proposition",
    label: "4. Proposition & Model",
    defaultOpen: false,
    items: [
      { id: "prop-value",    label: "Value Proposition",    icon: "Sparkles",        href: "/proposition" },
      { id: "prop-bmc",      label: "Business Model Canvas",icon: "Layers",          href: "/proposition/bmc" },
      { id: "prop-revenue",  label: "Revenue Modelling",    icon: "BarChart2",       href: "/proposition/revenue" },
      { id: "prop-economics",label: "Unit Economics",       icon: "PieChart",        href: "/proposition/economics" },
      { id: "prop-channels", label: "Channel Strategy",     icon: "Globe",           href: "/proposition/channels" },
    ],
  },
  {
    id: "lean",
    label: "4b. Lean Canvas",
    defaultOpen: false,
    items: [
      { id: "lean-canvas", label: "Lean Canvas", icon: "LayoutTemplate", href: "/lean/canvas" },
    ],
  },
  {
    id: "rnd",
    label: "5. R&D Hub",
    defaultOpen: false,
    items: [
      { id: "rnd-hub",         label: "R&D Hub",             icon: "FlaskConical",    href: "/rnd" },
      { id: "rnd-experiments", label: "Validation Experiments",icon: "TestTube2",      href: "/rnd/experiments" },
      { id: "rnd-kpis",        label: "Technical KPIs",      icon: "BarChart3",       href: "/rnd/kpis" },
      { id: "rnd-prototypes",  label: "Prototype Testing",   icon: "Cog",             href: "/rnd/prototypes" },
      { id: "rnd-ip",          label: "IP Tracker",          icon: "Lock",            href: "/rnd/ip" },
    ],
  },
  {
    id: "operations",
    label: "6. Operations & Mfg",
    defaultOpen: false,
    items: [
      { id: "ops-model",     label: "Operating Model",       icon: "Building2",       href: "/operations" },
      { id: "ops-suppliers", label: "Supplier Assessment",   icon: "Truck",           href: "/operations/suppliers" },
      { id: "ops-mfg",      label: "Manufacturing Plan",    icon: "Factory",         href: "/operations/manufacturing" },
      { id: "ops-compliance",label: "Quality & Compliance",  icon: "ClipboardList",   href: "/operations/compliance" },
      { id: "ops-mrl",      label: "MRL Evidence",          icon: "BarChart3",       href: "/operations/mrl" },
    ],
  },
  {
    id: "gtm",
    label: "7. Brand & GTM",
    defaultOpen: false,
    items: [
      { id: "gtm-brand",     label: "Brand Readiness",      icon: "Sparkles",        href: "/gtm" },
      { id: "gtm-messaging", label: "Messaging Tests",      icon: "MessageSquare",   href: "/gtm/messaging" },
      { id: "gtm-marketing", label: "Marketing Strategy",   icon: "Megaphone",       href: "/gtm/strategy" },
      { id: "gtm-campaigns", label: "Campaign Experiments", icon: "Newspaper",       href: "/gtm/campaigns" },
      { id: "gtm-sales",     label: "Sales Pipeline",       icon: "HandCoins",       href: "/gtm/sales" },
    ],
  },
  {
    id: "sustainability",
    label: "8. Sustainability & Impact",
    defaultOpen: false,
    items: [
      { id: "sus-hub",        label: "Sustainability Hub",   icon: "Leaf",            href: "/sustainability" },
      { id: "sus-impact",     label: "Impact Metrics (IRL)", icon: "Heart",           href: "/sustainability/impact" },
      { id: "sus-lca",        label: "LCA / Carbon",         icon: "Globe",           href: "/sustainability/lca" },
      { id: "sus-circularity",label: "Circularity",          icon: "GitBranch",       href: "/sustainability/circularity" },
      { id: "sus-bcorp",      label: "B Corp & ESG",         icon: "Award",           href: "/sustainability/bcorp" },
    ],
  },
  {
    id: "risk",
    label: "9. Risk Intelligence",
    defaultOpen: false,
    items: [
      { id: "risk-register", label: "Central Risk Register", icon: "ShieldAlert",     href: "/risk" },
      { id: "risk-heatmap",  label: "Risk Heatmap",          icon: "Map",             href: "/risk/heatmap" },
      { id: "risk-mitigation",label: "Mitigation Plans",     icon: "Shield",          href: "/risk/mitigation" },
    ],
  },
  {
    id: "scoring",
    label: "10. Readiness Scoring",
    defaultOpen: false,
    items: [
      { id: "score-composite",label: "Composite Score",      icon: "PieChart",        href: "/scoring" },
      { id: "score-vrl",     label: "VRL Analytics",         icon: "TrendingUp",      href: "/scoring/vrl" },
      { id: "score-trl",     label: "TRL Analytics",         icon: "FlaskConical",    href: "/scoring/trl" },
      { id: "score-brl",     label: "BRL Analytics",         icon: "Briefcase",       href: "/scoring/brl" },
      { id: "score-mrl",     label: "MRL Analytics",         icon: "Factory",         href: "/scoring/mrl" },
      { id: "score-srl",     label: "SRL Analytics",         icon: "Leaf",            href: "/scoring/srl" },
      { id: "score-irl",     label: "IRL Analytics",         icon: "Heart",           href: "/scoring/irl" },
      { id: "score-prl",     label: "PRL Analytics",         icon: "Users",           href: "/scoring/prl" },
    ],
  },
  {
    id: "investment",
    label: "11. Investment Readiness",
    defaultOpen: false,
    items: [
      { id: "inv-hub",       label: "Investment Hub",        icon: "DollarSign",      href: "/investment" },
      { id: "inv-thesis",    label: "Investment Thesis",     icon: "BookOpen",        href: "/investment/thesis" },
      { id: "inv-financial", label: "Financial Model",       icon: "BarChart2",       href: "/investment/financial" },
      { id: "inv-dataroom",  label: "Investor Data Room",    icon: "FolderLock",      href: "/investment/dataroom" },
      { id: "inv-pack",      label: "Investor Pack Export",  icon: "FileText",        href: "/investment/pack" },
    ],
  },
  {
    id: "execution",
    label: "12. Execution Planning",
    defaultOpen: false,
    items: [
      { id: "exec-roadmap",    label: "Execution Roadmap",   icon: "Map",             href: "/execution" },
      { id: "exec-milestones", label: "Milestone Tracker",   icon: "Target",          href: "/execution/milestones" },
      { id: "exec-budget",     label: "Budget Plan",         icon: "DollarSign",      href: "/execution/budget" },
      { id: "exec-hiring",     label: "Hiring Plan",         icon: "Users",           href: "/execution/hiring" },
    ],
  },
  {
    id: "coaching",
    label: "13. Coaching",
    defaultOpen: false,
    items: [
      { id: "coach-founder", label: "Founder Dashboard",    icon: "UserCircle2",     href: "/coaching/founder" },
      { id: "coach-studio",  label: "Studio Dashboard",     icon: "LayoutDashboard", href: "/coaching/studio" },
      { id: "coach-manage",  label: "Coach Management",     icon: "UserCheck",       href: "/coaching/coach" },
    ],
  },
  {
    id: "collaboration",
    label: "14. Collaboration",
    defaultOpen: false,
    items: [
      { id: "collab-team",      label: "Team Workspace",      icon: "Users",           href: "/collaboration" },
      { id: "collab-advisors",  label: "Advisor Directory",   icon: "GraduationCap",   href: "/collaboration/advisors" },
      { id: "collab-academics", label: "Academic Partners",   icon: "BookOpen",        href: "/collaboration/academics" },
      { id: "collab-specialists",label: "Specialist Services",icon: "Briefcase",       href: "/collaboration/specialists" },
    ],
  },
  {
    id: "governance",
    label: "15. Governance",
    defaultOpen: false,
    items: [
      { id: "gov-dashboard",  label: "Governance Dashboard", icon: "Building2",       href: "/governance" },
      { id: "gov-gates",      label: "Stage-Gate Approvals", icon: "Shield",          href: "/governance/gates" },
      { id: "gov-board",      label: "Board Reporting",      icon: "FileText",        href: "/governance/board" },
      { id: "gov-audit",      label: "Audit Trail",          icon: "ClipboardList",   href: "/governance/audit" },
      { id: "gov-ip",         label: "IP Register",          icon: "Lock",            href: "/governance/ip" },
      { id: "gov-legal",      label: "Legal Repository",     icon: "FileText",        href: "/governance/legal" },
    ],
  },
  {
    id: "admin",
    label: "16. Admin",
    defaultOpen: false,
    items: [
      { id: "admin-playbooks",    label: "Playbook Library",     icon: "BookOpenCheck",    href: "/admin/playbooks" },
      { id: "admin-context-rules",   label: "Context Rules",       icon: "GitBranch",        href: "/admin/context-rules" },
      { id: "admin-widget-analytics",label: "Widget Analytics",     icon: "BarChart3",        href: "/admin/widget-analytics" },
      { id: "admin-widget-settings", label: "Widget Settings",      icon: "Sliders",          href: "/admin/widget-settings" },
      { id: "admin-prod-readiness",  label: "Production Readiness", icon: "CheckSquare",      href: "/admin/production-readiness" },
      { id: "admin-users",           label: "Users & Roles",        icon: "Users",            href: "/admin/users" },
      { id: "admin-permissions",  label: "Permissions",          icon: "Shield",           href: "/admin/permissions" },
      { id: "admin-templates",    label: "Templates",            icon: "LayoutTemplate",   href: "/admin/templates" },
      { id: "admin-data-fields",  label: "Data Fields",          icon: "Database",         href: "/admin/data-fields" },
      { id: "admin-modules",      label: "Module Settings",      icon: "Settings2",        href: "/admin/modules" },
      { id: "admin-integrations", label: "Integrations",         icon: "Plug",             href: "/admin/integrations" },
      { id: "admin-api",          label: "API Settings",         icon: "Code2",            href: "/admin/api" },
      { id: "admin-audit",        label: "Audit Logs",           icon: "ClipboardList",    href: "/admin/audit" },
      { id: "admin-config",       label: "System Configuration", icon: "SlidersHorizontal",href: "/admin/config" },
    ],
  },
];

const ECOBLEND_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-logo_64dbd5ba.png";

interface SyncAlert {
  ventureName: string;
  ventureColor: string;
  vrl: number;
  trl: number;
  gap: number;
  message: string;
  severity: "high" | "medium";
}

function useVrlTrlAlerts(): SyncAlert[] {
  const { ventures } = useVentures();
  return ventures
    .map((v): SyncAlert | null => {
      const gap = Math.abs(v.vrl - Math.round(v.trl / 2.25));
      const trlEquiv = Math.round(v.trl / 2.25);
      const vrlAhead = v.vrl > trlEquiv + 1;
      const trlAhead = trlEquiv > v.vrl + 1;
      if (!vrlAhead && !trlAhead) return null;
      return {
        ventureName: v.name,
        ventureColor: v.color,
        vrl: v.vrl,
        trl: v.trl,
        gap,
        message: vrlAhead
          ? `Commercial readiness (VRL ${v.vrl}) is ahead of technology (TRL ${v.trl}). Accelerate R&D.`
          : `Technology (TRL ${v.trl}) is ahead of commercial validation (VRL ${v.vrl}). Accelerate customer discovery.`,
        severity: gap >= 2 ? "high" : "medium",
      };
    })
    .filter((a): a is SyncAlert => a !== null);
}

function NavGroupSection({ group, location }: { group: NavGroup; location: string }) {
  const isGroupActive = group.items.some(
    item => location === item.href || (item.href !== "/" && location.startsWith(item.href))
  );
  const [open, setOpen] = useState(group.defaultOpen || isGroupActive);

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-100"
        style={{ color: isGroupActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.07em", fontSize: "0.6rem" }}
        >
          {group.label}
        </span>
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s ease",
            color: "rgba(255,255,255,0.25)",
          }}
        />
      </button>

      {/* Group items */}
      {open && (
        <div className="mt-0.5">
          {group.items.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));

            return (
              <Link key={item.id} href={item.href}>
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all duration-100"
                  style={{
                    background: isActive ? "rgba(86, 168, 55,0.13)" : "transparent",
                    borderLeft: isActive ? "2px solid #56A837" : "2px solid transparent",
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.48)",
                    paddingLeft: isActive ? "calc(0.75rem - 2px)" : "0.75rem",
                  }}
                >
                  {Icon && (
                    <span style={{ color: isActive ? "#56A837" : "rgba(255,255,255,0.35)", flexShrink: 0, display: "flex" }}>
                      <Icon size={14} />
                    </span>
                  )}
                  <span
                    className="text-sm font-medium flex-1 truncate"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}
                  >
                    {item.label}
                  </span>
                  {isActive && <ChevronRight size={11} style={{ color: "#56A837", flexShrink: 0 }} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alerts = useVrlTrlAlerts();

  return (
    <aside
      className="w-60 h-screen flex flex-col shrink-0"
      style={{ background: "#1a2332", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col items-center gap-1.5">
          <img
            src={ECOBLEND_LOGO_URL}
            alt="EcoBlend OS"
            className="w-24 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Inter', sans-serif", fontSize: "0.6rem" }}
          >
            Venture Validation OS
          </div>
        </div>
      </div>

      {/* Sync alert banner */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setAlertsOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150"
          style={{
            background: alertsOpen ? "rgba(246, 145, 17,0.10)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${alerts.length > 0 ? "rgba(246, 145, 17,0.28)" : "rgba(255,255,255,0.07)"}`,
            color: alerts.length > 0 ? "#F69111" : "rgba(255,255,255,0.35)",
          }}
        >
          <Bell size={13} />
          <span className="text-xs font-medium flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
            {alerts.length === 0 ? "All systems in sync" : `${alerts.length} sync alert${alerts.length > 1 ? "s" : ""}`}
          </span>
          {alerts.length > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "#F69111", color: "white", fontSize: "9px" }}
            >
              {alerts.length}
            </span>
          )}
        </button>

        {alertsOpen && (
          <div
            className="mt-2 rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif", fontSize: "0.6rem" }}>
                VRL / TRL Sync Alerts
              </span>
              <button onClick={() => setAlertsOpen(false)}>
                <X size={11} style={{ color: "rgba(255,255,255,0.28)" }} />
              </button>
            </div>
            {alerts.length === 0 ? (
              <div className="px-3 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}>
                All ventures are in sync.
              </div>
            ) : (
              <div>
                {alerts.map((a: SyncAlert, i: number) => (
                  <div key={i} className="px-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={10} style={{ color: a.severity === "high" ? "#ef4444" : "#F69111", flexShrink: 0 }} />
                      <span className="text-xs font-semibold" style={{ color: a.ventureColor, fontFamily: "'Inter', sans-serif" }}>
                        {a.ventureName}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}>
                      {a.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Venture Selector */}
      <GlobalVentureSelector />
      {/* Grouped navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <NavGroupSection key={group.id} group={group} location={location} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(86, 168, 55,0.15)", color: "#56A837" }}
          >
            E
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}>
              EcoBlend OS
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.22)", fontFamily: "'Inter', sans-serif", fontSize: "0.65rem" }}>
              Platform v2.0 | EcoRace Studio
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
