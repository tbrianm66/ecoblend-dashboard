// ============================================================
// VENTURE OS SIDEBAR — Grouped Navigation
// Design: Apple-style clarity · Grouped sections per blueprint
// Groups: Dashboard · Ventures · Research · Analytics ·
//         Collaboration · Governance
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart, ChevronRight, Rocket, MessageSquare, BookOpen,
  Bell, X, AlertTriangle, FileText, Newspaper, Briefcase,
  Lightbulb, TestTube2, UserCircle2, FolderOpen, Globe,
  Building2, ChevronDown, GraduationCap, Search, PieChart, Leaf, Database, UserCheck, Package, ClipboardList, Zap, Shuffle, GitBranch, Users2, Truck, Factory, BookMarked
} from "lucide-react";
import { useVentures } from "@/contexts/VentureContext";

type IconName = string;
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart, Rocket, MessageSquare, BookOpen, FileText,
  Newspaper, Briefcase, Lightbulb, TestTube2, UserCircle2,
  FolderOpen, Globe, Building2, GraduationCap, Search, PieChart, Leaf, Database, UserCheck, Package, ClipboardList, Zap, Shuffle, GitBranch, Users2, Truck, Factory, BookMarked,
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

const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    defaultOpen: true,
    items: [
      { id: "command-centre", label: "Command Centre",      icon: "Zap",             href: "/command-centre" },
      { id: "portfolio",   label: "Portfolio Overview",   icon: "LayoutDashboard", href: "/" },
      { id: "pipeline",    label: "Opportunity Pipeline", icon: "Lightbulb",       href: "/pipeline" },
      { id: "onboarding",  label: "Onboard Founder",      icon: "Rocket",          href: "/onboarding" },
    ],
  },
  {
    id: "ventures",
    label: "Ventures",
    defaultOpen: true,
    items: [
      { id: "vrl",         label: "VRL Analytics",        icon: "TrendingUp",      href: "/vrl" },
      { id: "trl",         label: "TRL Analytics",        icon: "FlaskConical",    href: "/trl" },
      { id: "brl",         label: "BRL Analytics",        icon: "Briefcase",       href: "/brl" },
      { id: "experiments", label: "Experiment Log",        icon: "TestTube2",       href: "/experiments" },
      { id: "playbook",    label: "EcoBlend Playbook",    icon: "BookOpen",        href: "/playbook" },
      { id: "founders",    label: "Founder Profiles",     icon: "UserCircle2",     href: "/founders" },
    ],
  },
  {
    id: "research",
    label: "Research",
    defaultOpen: false,
    items: [
      { id: "academic",    label: "Academic Research",    icon: "GraduationCap",   href: "/academic" },
      { id: "university-playbook", label: "University Playbook", icon: "BookMarked",  href: "/university-playbook" },
      { id: "interviews",  label: "Interview Tracker",    icon: "MessageSquare",   href: "/interviews" },
      { id: "brand",       label: "Brand Readiness",      icon: "Layers",          href: "/brand" },
      { id: "marketing",   label: "Marketing Strategy",   icon: "Megaphone",       href: "/marketing" },
      { id: "pr",          label: "Brand PR & Newsletter",icon: "Newspaper",       href: "/pr" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    defaultOpen: false,
    items: [
      { id: "investment",  label: "Investment Readiness", icon: "DollarSign",      href: "/investment" },
      { id: "financial",   label: "Financial Analytics",  icon: "BarChart2",       href: "/financial" },
      { id: "market",      label: "Market Intelligence",  icon: "PieChart",        href: "/market-intelligence" },
      { id: "risk",        label: "Risk Management",      icon: "ShieldAlert",     href: "/risk" },
      { id: "dual-risk",   label: "Dual Risk Engine",     icon: "Zap",             href: "/dual-risk" },
      { id: "supply-chain", label: "Supply Chain",          icon: "Truck",           href: "/supply-chain" },
      { id: "china-manufacturing", label: "China Mfg Playbook", icon: "Factory",       href: "/china-manufacturing" },
      { id: "workflow-engine",      label: "Workflow Engine",    icon: "Zap",             href: "/workflow-engine" },
      { id: "data-management",      label: "Data Management",   icon: "Database",          href: "/data-management" },
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    defaultOpen: false,
    items: [
      { id: "specialists", label: "Specialist Services",  icon: "Briefcase",       href: "/specialists" },
      { id: "people",      label: "People & ESOP",        icon: "Users",           href: "/people" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    defaultOpen: false,
    items: [
      { id: "legal",       label: "Legal Contracts",      icon: "FileText",        href: "/legal" },
      { id: "ip",          label: "IP Management",        icon: "Lock",            href: "/ip" },
      { id: "bcorp",       label: "B Corp & ISO",         icon: "Award",           href: "/bcorp" },
      { id: "foundation",  label: "Foundation Impact",    icon: "Heart",           href: "/foundation" },
      { id: "impact",      label: "Impact Governance",    icon: "Leaf",            href: "/impact" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    defaultOpen: false,
    items: [
      { id: "knowledge",   label: "Knowledge Base",       icon: "Database",        href: "/knowledge" },
      { id: "people-intel", label: "People Intelligence",  icon: "UserCheck",       href: "/people-intelligence" },
      { id: "poi",         label: "Product Opportunity",  icon: "Package",         href: "/poi" },
      { id: "pm",          label: "Project Management",   icon: "ClipboardList",   href: "/project-management" },
      { id: "matching",    label: "Matching Engine",       icon: "Shuffle",         href: "/matching" },
      { id: "spinoff",     label: "Spin-Off OS",           icon: "GitBranch",       href: "/spinoff" },
      { id: "co-founder",  label: "Co-Founder Matrix",    icon: "Users2",          href: "/co-founder-matrix" },
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
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.09em" }}
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
                    background: isActive ? "rgba(81,175,55,0.13)" : "transparent",
                    borderLeft: isActive ? "2px solid #51AF37" : "2px solid transparent",
                    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.48)",
                    paddingLeft: isActive ? "calc(0.75rem - 2px)" : "0.75rem",
                  }}
                >
                  {Icon && (
                    <span style={{ color: isActive ? "#51AF37" : "rgba(255,255,255,0.35)", flexShrink: 0, display: "flex" }}>
                      <Icon size={14} />
                    </span>
                  )}
                  <span
                    className="text-sm font-medium flex-1 truncate"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}
                  >
                    {item.label}
                  </span>
                  {isActive && <ChevronRight size={11} style={{ color: "#51AF37", flexShrink: 0 }} />}
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
      className="w-60 min-h-screen flex flex-col shrink-0"
      style={{ background: "#1a2332", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* ── Logo ── */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col items-center gap-1.5">
          <img
            src={ECOBLEND_LOGO_URL}
            alt="EcoComp"
            className="w-24 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Inter', sans-serif", fontSize: "0.6rem" }}
          >
            Venture Intelligence Platform
          </div>
        </div>
      </div>

      {/* ── Sync alert banner ── */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setAlertsOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150"
          style={{
            background: alertsOpen ? "rgba(244,156,19,0.10)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${alerts.length > 0 ? "rgba(244,156,19,0.28)" : "rgba(255,255,255,0.07)"}`,
            color: alerts.length > 0 ? "#F49C13" : "rgba(255,255,255,0.35)",
          }}
        >
          <Bell size={13} />
          <span className="text-xs font-medium flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
            {alerts.length === 0 ? "All systems in sync" : `${alerts.length} sync alert${alerts.length > 1 ? "s" : ""}`}
          </span>
          {alerts.length > 0 && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "#F49C13", color: "white", fontSize: "9px" }}
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
                      <AlertTriangle size={10} style={{ color: a.severity === "high" ? "#ef4444" : "#F49C13", flexShrink: 0 }} />
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

      {/* ── Grouped navigation ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <NavGroupSection key={group.id} group={group} location={location} />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(81,175,55,0.15)", color: "#51AF37" }}
          >
            E
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}>
              EcoRace Studio
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.22)", fontFamily: "'Inter', sans-serif", fontSize: "0.65rem" }}>
              VIP v1.0 · © 2026 EcoRace Studio
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
