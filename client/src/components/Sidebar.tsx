// ============================================================
// ECOBLEND SIDEBAR NAVIGATION
// Design: Precision Industrial — dark sidebar with green accents
// ============================================================

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart, ChevronRight, Activity
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart,
};

const navItems = [
  { id: "portfolio", label: "Portfolio Overview", icon: "LayoutDashboard", href: "/" },
  { id: "vrl", label: "VRL Analytics", icon: "TrendingUp", href: "/vrl" },
  { id: "trl", label: "TRL Analytics", icon: "FlaskConical", href: "/trl" },
  { id: "risk", label: "Risk Management", icon: "ShieldAlert", href: "/risk" },
  { id: "investment", label: "Investment Readiness", icon: "DollarSign", href: "/investment" },
  { id: "brand", label: "Brand Readiness", icon: "Layers", href: "/brand" },
  { id: "ip", label: "IP Management", icon: "Lock", href: "/ip" },
  { id: "people", label: "People & ESOP", icon: "Users", href: "/people" },
  { id: "marketing", label: "Marketing Strategy", icon: "Megaphone", href: "/marketing" },
  { id: "financial", label: "Financial Analytics", icon: "BarChart2", href: "/financial" },
  { id: "bcorp", label: "B Corp & ISO", icon: "Award", href: "/bcorp" },
  { id: "foundation", label: "Foundation Impact", icon: "Heart", href: "/foundation" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: "#1c1c1e" }}>
      {/* Logo area */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#22c55e" }}>
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Eco<span style={{ color: "#22c55e" }}>Blend</span>
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
              VBS Analytics
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
            Analytics Modules
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.id} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 group transition-all duration-150 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                style={{
                  background: isActive ? "rgba(34,197,94,0.12)" : "transparent",
                  borderLeft: isActive ? "2px solid #22c55e" : "2px solid transparent",
                }}
              >
                {Icon && (
                  <span style={{ color: isActive ? "#22c55e" : undefined, flexShrink: 0, display: "flex" }}>
                    <Icon
                      size={16}
                      className={isActive ? "" : "group-hover:text-gray-300"}
                    />
                  </span>
                )}
                <span className="text-sm font-medium flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {item.label}
                </span>
                {isActive && <ChevronRight size={14} style={{ color: "#22c55e" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
          EcoRace VBS Platform
        </div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
          MVP v1.0 · H4 Methodology
        </div>
      </div>
    </aside>
  );
}
