// ============================================================
// ECOBLEND SIDEBAR NAVIGATION
// Brand: EcoBlend — Dark Navy #1a2332, Green #51AF37, Blue #3A97D3
// Typography: Prompt (headings) + Nunito (body)
// ============================================================

import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart, ChevronRight, Rocket, MessageSquare, BookOpen
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, TrendingUp, FlaskConical, ShieldAlert,
  DollarSign, Layers, Lock, Users, Megaphone, BarChart2,
  Award, Heart, Rocket, MessageSquare, BookOpen,
};

const navItems = [
  { id: "portfolio",   label: "Portfolio Overview",    icon: "LayoutDashboard", href: "/" },
  { id: "playbook",    label: "EcoBlend Playbook",     icon: "BookOpen",        href: "/playbook" },
  { id: "interviews",  label: "Interview Tracker",     icon: "MessageSquare",   href: "/interviews" },
  { id: "vrl",         label: "VRL Analytics",         icon: "TrendingUp",      href: "/vrl" },
  { id: "trl",         label: "TRL Analytics",         icon: "FlaskConical",    href: "/trl" },
  { id: "risk",        label: "Risk Management",       icon: "ShieldAlert",     href: "/risk" },
  { id: "investment",  label: "Investment Readiness",  icon: "DollarSign",      href: "/investment" },
  { id: "brand",       label: "Brand Readiness",       icon: "Layers",          href: "/brand" },
  { id: "ip",          label: "IP Management",         icon: "Lock",            href: "/ip" },
  { id: "people",      label: "People & ESOP",         icon: "Users",           href: "/people" },
  { id: "marketing",   label: "Marketing Strategy",    icon: "Megaphone",       href: "/marketing" },
  { id: "financial",   label: "Financial Analytics",   icon: "BarChart2",       href: "/financial" },
  { id: "bcorp",       label: "B Corp & ISO",          icon: "Award",           href: "/bcorp" },
  { id: "foundation",  label: "Foundation Impact",     icon: "Heart",           href: "/foundation" },
];

// EcoBlend wavy logo mark as SVG
const ECOBLEND_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031397390/ggmroLG8ezURUZiLzGveTG/ecoblend-logo_64dbd5ba.png";

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: "#1a2332", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo area */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex flex-col items-center gap-1">
          <img
            src={ECOBLEND_LOGO_URL}
            alt="EcoBlend"
            className="w-28 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Nunito', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            VBS Analytics
          </div>
        </div>
      </div>

      {/* Onboard Founder CTA */}
      <div className="px-4 pt-4 pb-2">
        <Link href="/onboarding">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150"
            style={{
              background: location === "/onboarding" ? "rgba(81,175,55,0.22)" : "rgba(81,175,55,0.10)",
              border: "1px solid rgba(81,175,55,0.25)",
              color: "#51AF37",
            }}
          >
            <Rocket size={15} />
            <span
              className="text-sm font-bold"
              style={{ fontFamily: "'Prompt', sans-serif", letterSpacing: "0.01em" }}
            >
              Onboard Founder
            </span>
          </div>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-3 pb-1">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Nunito', sans-serif" }}
        >
          Analytics Modules
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.id} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 group transition-all duration-150`}
                style={{
                  background: isActive ? "rgba(81,175,55,0.12)" : "transparent",
                  borderLeft: isActive ? "2px solid #51AF37" : "2px solid transparent",
                  color: isActive ? "white" : "rgba(255,255,255,0.5)",
                }}
              >
                {Icon && (
                  <span style={{ color: isActive ? "#51AF37" : undefined, flexShrink: 0, display: "flex" }}>
                    <Icon size={15} />
                  </span>
                )}
                <span
                  className="text-sm font-medium flex-1"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  {item.label}
                </span>
                {isActive && <ChevronRight size={13} style={{ color: "#51AF37" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div
          className="text-xs font-semibold"
          style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Nunito', sans-serif" }}
        >
          EcoRace VBS Platform
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'Nunito', sans-serif" }}
        >
          MVP v1.0 · H4 Methodology
        </div>
      </div>
    </aside>
  );
}
