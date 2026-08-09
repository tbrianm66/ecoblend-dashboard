// ============================================================
// ECOBLEND OS SIDEBAR — v2.0 Navigation Architecture
// FHV-EB-AUD-001 §3 — Core Consolidation & Backlog Archiving
//
// Sections:
//   1. ★ CORE WORKFLOW     — 5 canonical modules, always visible
//   2. COMMAND CENTRE      — dashboard hub, always visible
//   3. LAUNCH PHASE        — advanced modules, require reactivationHypothesis
//   4. SCALE PHASE         — gate-4-gated speculative infrastructure
//   5. ADMINISTRATION      — always visible at bottom
// ============================================================

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
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
  ShieldCheck, Archive, Network, Star,
  Settings, Package2, RotateCcw, Crosshair, Eye, EyeOff,
  Landmark, FolderKanban, Tag,
} from "lucide-react";
import { useVentures } from "@/contexts/VentureContext";
import GlobalVentureSelector from "@/components/GlobalVentureSelector";
import {
  GATE4_CORE_MODULES,
  GATE4_DEFERRED_MODULES,
  GATE4_BACKLOG_GROUP_IDS,
  useGate4Reactivation,
  type BacklogGroupId,
} from "@/lib/gate4Config";

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
  ShieldCheck, Archive, Network, Star,
  Settings, Package2, RotateCcw, Crosshair,
  Landmark, FolderKanban, Tag,
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

// ── Navigation groups (unchanged content — Gate 4 changes presentation only) ──
// FEDSILK removed from governance items; it now appears in the DEFERRED section.
const PORTFOLIO_ARCHITECTURE_GROUP: NavGroup = {
  id: "portfolio-architecture",
  label: "Portfolio Architecture",
  defaultOpen: true,
  items: [
    { id: "pa-brands",       label: "Domain Brands",      icon: "Landmark",      href: "/portfolio/brands" },
    { id: "pa-pipeline",     label: "Venture Pipeline",   icon: "FolderKanban",  href: "/portfolio/pipeline" },
    { id: "pa-products",     label: "Product Portfolio",  icon: "Package2",      href: "/portfolio/products" },
    { id: "pa-part-numbers", label: "Part Number Register", icon: "Tag",         href: "/portfolio/part-numbers" },
  ],
};

const COMMAND_CENTRE_GROUP: NavGroup = {
  id: "command-centre",
  label: "Command Centre",
  defaultOpen: true,
  items: [
    { id: "cc-overview",  label: "Portfolio Overview",    icon: "LayoutDashboard", href: "/" },
    { id: "cc-command",   label: "Control Desk",         icon: "Zap",             href: "/command-centre/dashboard" },
    { id: "cc-pipeline",  label: "Opportunity Pipeline", icon: "Lightbulb",       href: "/pipeline" },
    { id: "cc-status",    label: "Venture Status",       icon: "Target",          href: "/venture-status" },
    { id: "cc-alerts",    label: "Alerts & Approvals",   icon: "AlertTriangle",   href: "/alerts" },
    { id: "cc-decision",  label: "Decision Gate",        icon: "ShieldCheck",     href: "/decision-gate" },
    { id: "cc-archive",   label: "Venture Archive",      icon: "Archive",         href: "/ventures/archive" },
  ],
};

const ADMIN_GROUP: NavGroup = {
  id: "admin",
  label: "Administration",
  defaultOpen: false,
  items: [
    { id: "admin-playbooks",       label: "Playbook Library",     icon: "BookOpenCheck",    href: "/admin/playbooks" },
    { id: "admin-context-rules",   label: "Context Rules",        icon: "GitBranch",        href: "/admin/context-rules" },
    { id: "admin-widget-analytics",label: "Widget Analytics",     icon: "BarChart3",        href: "/admin/widget-analytics" },
    { id: "admin-widget-settings", label: "Widget Settings",      icon: "Sliders",          href: "/admin/widget-settings" },
    { id: "admin-prod-readiness",  label: "Production Readiness", icon: "CheckSquare",      href: "/admin/production-readiness" },
    { id: "admin-users",           label: "Users & Roles",        icon: "Users",            href: "/admin/users" },
    { id: "admin-permissions",     label: "Permissions",          icon: "Shield",           href: "/admin/permissions" },
    { id: "admin-templates",       label: "Templates",            icon: "LayoutTemplate",   href: "/admin/templates" },
    { id: "admin-data-fields",     label: "Data Fields",          icon: "Database",         href: "/admin/data-fields" },
    { id: "admin-modules",         label: "Module Settings",      icon: "Settings2",        href: "/admin/modules" },
    { id: "admin-integrations",    label: "Integrations",         icon: "Plug",             href: "/admin/integrations" },
    { id: "admin-api",             label: "API Settings",         icon: "Code2",            href: "/admin/api" },
    { id: "admin-audit",           label: "Audit Logs",           icon: "ClipboardList",    href: "/admin/audit" },
    { id: "admin-config",          label: "System Configuration", icon: "SlidersHorizontal",href: "/admin/config" },
  ],
};

// Backlog groups — require reactivationHypothesis to appear in active workflow
const BACKLOG_GROUPS: NavGroup[] = [
  {
    id: "venture-intake",
    label: "Venture Intake",
    items: [
      { id: "intake-hub",         label: "Intake Overview",        icon: "Rocket",       href: "/intake" },
      { id: "intake-idea",        label: "Idea Capture",           icon: "Lightbulb",    href: "/intake/idea-capture" },
      { id: "intake-assumptions", label: "Assumptions",            icon: "ShieldAlert",  href: "/intake/assumptions" },
      { id: "intake-hypotheses",  label: "Hypotheses",             icon: "FlaskConical", href: "/intake/hypotheses" },
      { id: "intake-riskiest",    label: "Riskiest Assumption",    icon: "AlertTriangle",href: "/intake/riskiest" },
      { id: "intake-canvas",      label: "Initial Venture Canvas", icon: "LayoutTemplate",href: "/lean/canvas" },
      { id: "intake-decision",    label: "Intake Decision",        icon: "CheckSquare",  href: "/intake/decision" },
    ],
  },
  {
    id: "discovery",
    label: "Discovery & Market",
    items: [
      { id: "disc-interviews",  label: "Customer Discovery",  icon: "MessageSquare", href: "/discovery" },
      { id: "disc-competitors", label: "Competitor Mapping",  icon: "Search",        href: "/discovery/competitors" },
      { id: "disc-demand",      label: "Demand Signals",      icon: "TrendingUp",    href: "/discovery/demand" },
      { id: "disc-wtp",         label: "WTP Assessment",      icon: "DollarSign",    href: "/discovery/wtp" },
      { id: "disc-market-risk", label: "Market Risk Log",     icon: "ShieldAlert",   href: "/discovery/market-risk" },
    ],
  },
  {
    id: "proposition",
    label: "Proposition & Model",
    items: [
      { id: "prop-overview",  label: "Overview",            icon: "Sparkles",     href: "/proposition" },
      { id: "prop-vp",        label: "Value Proposition",   icon: "Target",       href: "/proposition/value-proposition" },
      { id: "prop-jtbd",      label: "Jobs-to-be-Done",     icon: "Crosshair",    href: "/proposition/jtbd" },
      { id: "prop-bm",        label: "Business Model",      icon: "Layers",       href: "/proposition/business-model" },
      { id: "prop-revenue",   label: "Revenue Model Test",  icon: "BarChart2",    href: "/proposition/revenue-model" },
      { id: "prop-economics", label: "Unit Economics",      icon: "PieChart",     href: "/proposition/unit-economics" },
      { id: "prop-risks",     label: "Risk Log",            icon: "ShieldAlert",  href: "/proposition/risks" },
      { id: "prop-pivots",    label: "Pivot History",       icon: "RotateCcw",    href: "/proposition/pivot-history" },
      { id: "prop-decision",  label: "Model Decision",      icon: "CheckSquare",  href: "/proposition/decision" },
    ],
  },
  {
    id: "rnd",
    label: "R&D Hub",
    items: [
      { id: "rnd-hub",         label: "R&D Hub",              icon: "FlaskConical", href: "/rnd" },
      { id: "rnd-experiments", label: "Validation Experiments",icon: "TestTube2",    href: "/rnd/experiments" },
      { id: "rnd-kpis",        label: "Technical KPIs",       icon: "BarChart3",    href: "/rnd/kpis" },
      { id: "rnd-prototypes",  label: "Prototype Testing",    icon: "Cog",          href: "/rnd/prototypes" },
      { id: "rnd-ip",          label: "IP Tracker",           icon: "Lock",         href: "/rnd/ip" },
    ],
  },
  {
    id: "operations",
    label: "Operations & Mfg",
    items: [
      { id: "ops-model",      label: "Operating Model",      icon: "Building2",    href: "/operations" },
      { id: "ops-suppliers",  label: "Supplier Assessment",  icon: "Truck",        href: "/operations/suppliers" },
      { id: "ops-mfg",        label: "Manufacturing Plan",   icon: "Factory",      href: "/operations/manufacturing" },
      { id: "ops-compliance", label: "Quality & Compliance", icon: "ClipboardList",href: "/operations/compliance" },
      { id: "ops-mrl",        label: "MRL Evidence",         icon: "BarChart3",    href: "/operations/mrl" },
    ],
  },
  {
    id: "gtm",
    label: "Brand & GTM",
    items: [
      { id: "gtm-brand",     label: "Brand Readiness",      icon: "Sparkles",     href: "/gtm" },
      { id: "gtm-messaging", label: "Messaging Tests",      icon: "MessageSquare",href: "/gtm/messaging" },
      { id: "gtm-marketing", label: "Marketing Strategy",   icon: "Megaphone",    href: "/gtm/strategy" },
      { id: "gtm-campaigns", label: "Campaign Experiments", icon: "Newspaper",    href: "/gtm/campaigns" },
      { id: "gtm-sales",     label: "Sales Pipeline",       icon: "HandCoins",    href: "/gtm/sales" },
    ],
  },
  {
    id: "sustainability",
    label: "Sustainability & Impact",
    items: [
      { id: "sus-hub",         label: "Sustainability Hub",  icon: "Leaf",        href: "/sustainability" },
      { id: "sus-impact",      label: "Impact Metrics (IRL)",icon: "Heart",       href: "/sustainability/impact" },
      { id: "sus-lca",         label: "LCA / Carbon",        icon: "Globe",       href: "/sustainability/lca" },
      { id: "sus-circularity", label: "Circularity",         icon: "GitBranch",   href: "/sustainability/circularity" },
      { id: "sus-bcorp",       label: "B Corp & ESG",        icon: "Award",       href: "/sustainability/bcorp" },
    ],
  },
  {
    id: "risk",
    label: "Risk Intelligence",
    items: [
      { id: "risk-register",   label: "Central Risk Register",icon: "ShieldAlert", href: "/risk" },
      { id: "risk-heatmap",    label: "Risk Heatmap",         icon: "Map",         href: "/risk/heatmap" },
      { id: "risk-mitigation", label: "Mitigation Plans",     icon: "Shield",      href: "/risk/mitigation" },
    ],
  },
  {
    id: "scoring",
    label: "Readiness Scoring",
    items: [
      { id: "score-composite", label: "Composite Score",  icon: "PieChart",    href: "/scoring" },
      { id: "score-vrl",       label: "VRL Analytics",    icon: "TrendingUp",  href: "/scoring/vrl" },
      { id: "score-trl",       label: "TRL Analytics",    icon: "FlaskConical",href: "/scoring/trl" },
      { id: "score-brl",       label: "BRL Analytics",    icon: "Briefcase",   href: "/scoring/brl" },
      { id: "score-mrl",       label: "MRL Analytics",    icon: "Factory",     href: "/scoring/mrl" },
      { id: "score-srl",       label: "SRL Analytics",    icon: "Leaf",        href: "/scoring/srl" },
      { id: "score-irl",       label: "IRL Analytics",    icon: "Heart",       href: "/scoring/irl" },
      { id: "score-prl",       label: "PRL Analytics",    icon: "Users",       href: "/scoring/prl" },
    ],
  },
  {
    id: "investment",
    label: "Investment Readiness",
    items: [
      { id: "inv-hub",       label: "Investment Hub",     icon: "DollarSign",  href: "/investment" },
      { id: "inv-thesis",    label: "Investment Thesis",  icon: "BookOpen",    href: "/investment/thesis" },
      { id: "inv-financial", label: "Financial Model",    icon: "BarChart2",   href: "/investment/financial" },
      { id: "inv-dataroom",  label: "Investor Data Room", icon: "FolderLock",  href: "/investment/dataroom" },
      { id: "inv-pack",      label: "Investor Pack Export",icon: "FileText",   href: "/investment/pack" },
    ],
  },
  {
    id: "execution",
    label: "Execution Planning",
    items: [
      { id: "exec-roadmap",    label: "Execution Roadmap", icon: "Map",      href: "/execution" },
      { id: "exec-milestones", label: "Milestone Tracker", icon: "Target",   href: "/execution/milestones" },
      { id: "exec-budget",     label: "Budget Plan",       icon: "DollarSign",href: "/execution/budget" },
      { id: "exec-hiring",     label: "Hiring Plan",       icon: "Users",    href: "/execution/hiring" },
    ],
  },
  {
    id: "coaching",
    label: "Coaching",
    items: [
      { id: "coach-founder", label: "Founder Dashboard",  icon: "UserCircle2",   href: "/coaching/founder" },
      { id: "coach-studio",  label: "Studio Dashboard",   icon: "LayoutDashboard",href: "/coaching/studio" },
      { id: "coach-manage",  label: "Coach Management",   icon: "UserCheck",     href: "/coaching/coach" },
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    items: [
      { id: "collab-team",       label: "Team Workspace",    icon: "Users",       href: "/collaboration" },
      { id: "collab-advisors",   label: "Advisor Directory", icon: "GraduationCap",href: "/collaboration/advisors" },
      { id: "collab-academics",  label: "Academic Partners", icon: "BookOpen",    href: "/collaboration/academics" },
      { id: "collab-specialists",label: "Specialist Services",icon: "Briefcase",  href: "/collaboration/specialists" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { id: "gov-dashboard", label: "Governance Dashboard", icon: "Building2",  href: "/governance" },
      { id: "gov-gates",     label: "Stage-Gate Approvals", icon: "Shield",     href: "/governance/gates" },
      { id: "gov-board",     label: "Board Reporting",      icon: "FileText",   href: "/governance/board" },
      { id: "gov-audit",     label: "Audit Trail",          icon: "ClipboardList",href: "/governance/audit" },
      { id: "gov-ip",        label: "IP Register",          icon: "Lock",       href: "/governance/ip" },
      { id: "gov-legal",     label: "Legal Repository",     icon: "FileText",   href: "/governance/legal" },
      // FEDSILK removed from active governance — now in DEFERRED (Gate 4) section
    ],
  },
  {
    id: "people",
    label: "People Intelligence",
    items: [
      { id: "people-intelligence", label: "People Intelligence", icon: "Users",   href: "/people-intelligence" },
      { id: "people-esop",         label: "ESOP & Equity",       icon: "PieChart",href: "/people" },
    ],
  },
];

// ── Sync alerts hook ──────────────────────────────────────────────────────────
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

// ── NavGroupSection (existing, unchanged) ─────────────────────────────────────
function NavGroupSection({ group, location }: { group: NavGroup; location: string }) {
  const isGroupActive = group.items.some(
    item => location === item.href || (item.href !== "/" && location.startsWith(item.href))
  );
  const [open, setOpen] = useState(group.defaultOpen || isGroupActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-100"
        style={{ color: isGroupActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "'Prompt', sans-serif", letterSpacing: "0.07em", fontSize: "0.6rem" }}
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
                    style={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.8125rem" }}
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

// ── Core Workflow Section ─────────────────────────────────────────────────────
function CoreWorkflowSection({ location }: { location: string }) {
  return (
    <div className="mb-3">
      {/* Section header */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1">
        <Star size={10} style={{ color: "#56A837" }} />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#56A837", fontFamily: "'Prompt', sans-serif", letterSpacing: "0.07em", fontSize: "0.6rem" }}
        >
          Core Workflow
        </span>
      </div>

      {GATE4_CORE_MODULES.map((module) => {
        const Icon = iconMap[module.icon];
        const isActive =
          location === module.href ||
          (module.href !== "/" && location.startsWith(module.href)) ||
          ("secondaryHref" in module && module.secondaryHref && location.startsWith(module.secondaryHref));

        return (
          <Link key={module.id} href={module.href}>
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all duration-100"
              style={{
                background: isActive ? "rgba(86, 168, 55,0.15)" : "rgba(86, 168, 55,0.03)",
                borderLeft: isActive ? "2px solid #56A837" : "2px solid rgba(86, 168, 55,0.2)",
                color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)",
                paddingLeft: isActive ? "calc(0.75rem - 2px)" : "0.75rem",
              }}
            >
              {Icon && (
                <span style={{ color: isActive ? "#56A837" : "rgba(86,168,55,0.6)", flexShrink: 0, display: "flex" }}>
                  <Icon size={14} />
                </span>
              )}
              <span
                className="text-sm font-medium flex-1 truncate"
                style={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.8125rem" }}
              >
                {module.label}
              </span>
              {isActive && <ChevronRight size={11} style={{ color: "#56A837", flexShrink: 0 }} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Deferred Infrastructure Section ───────────────────────────────────────────
function DeferredSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-100"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        <div className="flex items-center gap-1.5">
          <Lock size={9} style={{ color: "#ef4444", opacity: 0.7 }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Prompt', sans-serif", letterSpacing: "0.07em", fontSize: "0.6rem" }}
          >
            Scale Phase
          </span>
        </div>
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s ease",
            color: "rgba(255,255,255,0.15)",
          }}
        />
      </button>

      {open && (
        <div className="mt-1 mb-1 mx-2 rounded-lg overflow-hidden"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(239,68,68,0.1)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Prompt', sans-serif", fontSize: "0.65rem" }}>
              These modules are in <strong style={{ color: "rgba(239,68,68,0.7)" }}>Deferred (Gate 4 Pending Validation)</strong> status and are excluded from the active workflow until independently validated.
            </p>
          </div>
          {GATE4_DEFERRED_MODULES.map((mod) => {
            const Icon = iconMap[mod.icon];
            return (
              <div
                key={mod.id}
                className="flex items-center gap-2.5 px-3 py-2 mb-0 opacity-50"
                style={{ cursor: "not-allowed" }}
                title={mod.deferralReason}
              >
                <Lock size={10} style={{ color: "rgba(239,68,68,0.6)", flexShrink: 0 }} />
                {Icon && (
                  <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, display: "flex" }}>
                    <Icon size={13} />
                  </span>
                )}
                <span
                  className="text-sm flex-1 truncate line-through"
                  style={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}
                >
                  {mod.label}
                </span>
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.7)", fontSize: "0.55rem" }}
                >
                  DEFERRED
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Reactivation Panel (admin-only) ───────────────────────────────────────────
interface ReactivationPanelProps {
  onClose: () => void;
  ventureId: string | null;
  ventureName?: string;
  ventureColor?: string;
}

function formatToggleAudit(toggledBy: string | null | undefined, toggledAt: Date | string | null | undefined): string | null {
  if (!toggledBy && !toggledAt) return null;
  const who = toggledBy ?? "Unknown";
  if (!toggledAt) return `by ${who}`;
  const d = new Date(toggledAt);
  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${who} · ${dateStr} ${timeStr}`;
}
function ReactivationPanel({ onClose, ventureId, ventureName, ventureColor }: ReactivationPanelProps) {
  const { isActivated, reactivate, deactivate, reactivateAll, deactivateAll, rows, isLoading } = useGate4Reactivation(ventureId);

  const activeCount = GATE4_BACKLOG_GROUP_IDS.filter(id => isActivated(id)).length;

  // Build a lookup from groupId → most-specific row for the current scope.
  // Prefer the venture-specific row when one exists; fall back to the global row
  // so the audit trail still shows who last touched a global toggle.
  const rowByGroup = new Map<string, typeof rows[number]>();
  rows
    .filter(r => r.ventureId === "__global__")
    .forEach(r => rowByGroup.set(r.groupId, r));
  if (ventureId) {
    rows
      .filter(r => r.ventureId === ventureId)
      .forEach(r => rowByGroup.set(r.groupId, r)); // venture row overwrites global
  }

  // Scope badge: amber pill for GLOBAL, venture-colour dot + name for a specific venture.
  const scopeBadge = ventureId && ventureName ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        background: `${ventureColor ?? "#56A837"}22`,
        border: `1px solid ${ventureColor ?? "#56A837"}55`,
        color: ventureColor ?? "#56A837",
        fontSize: "0.65rem",
        fontFamily: "'Prompt', sans-serif",
        maxWidth: "130px",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: ventureColor ?? "#56A837" }}
      />
      <span className="truncate">{ventureName}</span>
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.4)",
        color: "#F59E0B",
        fontSize: "0.65rem",
        fontFamily: "'Prompt', sans-serif",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: "#F59E0B" }}
      />
      GLOBAL
    </span>
  );

  return (
    <div
      className="absolute bottom-14 left-2 right-2 rounded-xl overflow-hidden z-50"
      style={{ background: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Module Reactivation
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", fontFamily: "'Prompt', sans-serif" }}>Syncing…</span>
            ) : (
              <>
                {scopeBadge}
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", fontFamily: "'Prompt', sans-serif" }}>
                  {activeCount}/{GATE4_BACKLOG_GROUP_IDS.length} active
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="ml-2 shrink-0">
          <X size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
        </button>
      </div>

      <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {ventureId && ventureName ? (
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Prompt', sans-serif", fontSize: "0.65rem" }}>
            Editing module settings for{" "}
            <strong style={{ color: ventureColor ?? "#56A837" }}>{ventureName}</strong> only.{" "}
            <span style={{ color: "rgba(245,158,11,0.7)" }}>Global defaults are not inherited</span>{" "}
            — venture-specific toggles override them. Admin-only action.
          </p>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Prompt', sans-serif", fontSize: "0.65rem" }}>
            Backlogged modules are hidden by default (Gate 4). Toggles apply to{" "}
            <strong style={{ color: "rgba(255,255,255,0.5)" }}>all ventures (global defaults)</strong>.{" "}
            Venture-specific overrides take precedence. Admin-only action.
          </p>
        )}
      </div>

      {/* Scroll area */}
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        {BACKLOG_GROUPS.map(group => {
          const active = isActivated(group.id);
          const row = rowByGroup.get(group.id);
          const audit = row ? formatToggleAudit(row.toggledBy, row.toggledAt) : null;
          return (
            <div
              key={group.id}
              className="flex items-start justify-between px-3 py-2 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex-1 min-w-0 mr-2">
                <span
                  className="text-xs block truncate"
                  style={{ fontFamily: "'Prompt', sans-serif", color: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}
                >
                  {group.label}
                </span>
                {audit && (
                  <span
                    className="text-xs block truncate mt-0.5"
                    style={{ fontFamily: "'Prompt', sans-serif", color: "rgba(255,255,255,0.22)", fontSize: "0.6rem" }}
                    title={audit}
                  >
                    {audit}
                  </span>
                )}
              </div>
              <button
                onClick={() => active ? deactivate(group.id) : reactivate(group.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition-all shrink-0"
                style={{
                  background: active ? "rgba(86,168,55,0.15)" : "rgba(255,255,255,0.06)",
                  color: active ? "#56A837" : "rgba(255,255,255,0.3)",
                  border: active ? "1px solid rgba(86,168,55,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.65rem",
                }}
              >
                {active ? <Eye size={9} /> : <EyeOff size={9} />}
                {active ? "On" : "Off"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 px-3 py-2">
        <button
          onClick={reactivateAll}
          className="flex-1 py-1.5 rounded text-xs font-semibold"
          style={{ background: "rgba(86,168,55,0.12)", color: "#56A837", border: "1px solid rgba(86,168,55,0.2)", fontSize: "0.7rem" }}
        >
          Enable All
        </button>
        <button
          onClick={deactivateAll}
          className="flex-1 py-1.5 rounded text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.7rem" }}
        >
          Disable All
        </button>
      </div>
    </div>
  );
}

// ── Extended Backlog Section ───────────────────────────────────────────────────
function ExtendedBacklogSection({
  location,
  isActivated,
}: {
  location: string;
  isActivated: (id: string) => boolean;
}) {
  const activeCount  = BACKLOG_GROUPS.filter(g => isActivated(g.id)).length;
  const totalCount   = BACKLOG_GROUPS.length;

  // Auto-open if any item in an activated group is currently active
  const hasActiveItem = BACKLOG_GROUPS.some(g =>
    isActivated(g.id) &&
    g.items.some(item => location === item.href || (item.href !== "/" && location.startsWith(item.href)))
  );
  const [open, setOpen] = useState(hasActiveItem);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-100"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        <div className="flex items-center gap-1.5">
          <Package2 size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Prompt', sans-serif", letterSpacing: "0.07em", fontSize: "0.6rem" }}
          >
            Launch Phase
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: activeCount > 0 ? "rgba(86,168,55,0.15)" : "rgba(255,255,255,0.06)",
              color: activeCount > 0 ? "#56A837" : "rgba(255,255,255,0.25)",
              fontSize: "0.55rem",
            }}
          >
            {activeCount}/{totalCount}
          </span>
        </div>
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.15s ease",
            color: "rgba(255,255,255,0.2)",
          }}
        />
      </button>

      {open && (
        <div className="mt-1">
          {BACKLOG_GROUPS.map(group => {
            const activated = isActivated(group.id);

            if (!activated) {
              // Show locked/greyed entry for non-reactivated groups
              return (
                <div
                  key={group.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-0.5 opacity-35"
                  style={{ cursor: "default" }}
                >
                  <Lock size={9} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
                  >
                    {group.label}
                  </span>
                  <span
                    className="text-xs px-1 py-0.5 rounded font-semibold shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", fontSize: "0.55rem" }}
                  >
                    OFF
                  </span>
                </div>
              );
            }

            return (
              <NavGroupSection key={group.id} group={group} location={location} />
            );
          })}

          {activeCount === 0 && (
            <div className="px-3 py-3 text-center">
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Prompt', sans-serif", fontSize: "0.7rem" }}>
                No backlog modules are active.
                <br />
                Use the <strong style={{ color: "rgba(255,255,255,0.35)" }}>⚙ Module Reactivation</strong> panel to enable modules for this venture.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sync alert banner ─────────────────────────────────────────────────────────
function SyncAlertBanner() {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alerts = useVrlTrlAlerts();

  return (
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
        <span className="text-xs font-medium flex-1 text-left" style={{ fontFamily: "'Prompt', sans-serif" }}>
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
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Prompt', sans-serif", fontSize: "0.6rem" }}>
              VRL / TRL Sync Alerts
            </span>
            <button onClick={() => setAlertsOpen(false)}>
              <X size={11} style={{ color: "rgba(255,255,255,0.28)" }} />
            </button>
          </div>
          {alerts.length === 0 ? (
            <div className="px-3 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Prompt', sans-serif" }}>
              All ventures are in sync.
            </div>
          ) : (
            <div>
              {alerts.map((a: SyncAlert, i: number) => (
                <div key={i} className="px-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={10} style={{ color: a.severity === "high" ? "#ef4444" : "#F69111", flexShrink: 0 }} />
                    <span className="text-xs font-semibold" style={{ color: a.ventureColor, fontFamily: "'Prompt', sans-serif" }}>
                      {a.ventureName}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Prompt', sans-serif", fontSize: "0.7rem" }}>
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
const ECOBLEND_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-logo_64dbd5ba.png";

export default function Sidebar() {
  const [location] = useLocation();
  const [reactivationOpen, setReactivationOpen] = useState(false);
  const { selectedVenture } = useSelectedVenture();
  const selectedVentureId = selectedVenture?.id ?? null;
  const { isActivated } = useGate4Reactivation(selectedVentureId);

  return (
    <aside
      className="w-60 h-screen flex flex-col shrink-0 relative"
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
            style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Prompt', sans-serif", fontSize: "0.6rem" }}
          >
            Venture Validation OS
          </div>
        </div>
      </div>

      {/* Sync alert */}
      <SyncAlertBanner />

      {/* Global Venture Selector */}
      <GlobalVentureSelector />

      {/* Scrollable navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {/* ★ Section 1: Core Workflow (always visible) */}
        <CoreWorkflowSection location={location} />

        {/* Section 2: Portfolio Architecture (Phase 3 — always visible) */}
        <NavGroupSection group={PORTFOLIO_ARCHITECTURE_GROUP} location={location} />

        {/* Section 3: Command Centre (always visible) */}
        <NavGroupSection group={COMMAND_CENTRE_GROUP} location={location} />

        {/* Divider */}
        <div className="my-2 mx-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Section 3: Extended Backlog */}
        <ExtendedBacklogSection location={location} isActivated={isActivated} />

        {/* Section 4: Deferred Speculative Infrastructure */}
        <DeferredSection />

        {/* Divider */}
        <div className="my-2 mx-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Section 5: Admin (always visible) */}
        <NavGroupSection group={ADMIN_GROUP} location={location} />
      </nav>

      {/* Reactivation panel (absolute overlay) */}
      {reactivationOpen && (
        <ReactivationPanel
          onClose={() => setReactivationOpen(false)}
          ventureId={selectedVentureId}
          ventureName={selectedVenture?.name}
          ventureColor={selectedVenture?.color}
        />
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "rgba(86, 168, 55,0.15)", color: "#56A837" }}
          >
            E
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Prompt', sans-serif", fontSize: "0.7rem" }}>
              EcoBlend OS
            </div>
            <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.22)", fontFamily: "'Prompt', sans-serif", fontSize: "0.65rem" }}>
              Platform v2.0
            </div>
          </div>
          {/* Admin reactivation toggle */}
          <button
            onClick={() => setReactivationOpen(o => !o)}
            className="p-1.5 rounded-md transition-all"
            title="Module Reactivation (reactivationHypothesis)"
            style={{
              background: reactivationOpen ? "rgba(86,168,55,0.15)" : "rgba(255,255,255,0.05)",
              color: reactivationOpen ? "#56A837" : "rgba(255,255,255,0.3)",
              border: reactivationOpen ? "1px solid rgba(86,168,55,0.25)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <Settings size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
