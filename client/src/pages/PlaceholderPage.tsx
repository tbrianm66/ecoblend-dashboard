// ============================================================
// ECOBLEND PLACEHOLDER PAGE
// Used for analytics modules not yet fully implemented
// ============================================================

import { useLocation } from "wouter";
import { Construction } from "lucide-react";

const PAGE_META: Record<string, { title: string; description: string; color: string }> = {
  "/risk": { title: "Risk Management", description: "Comprehensive risk tracking across Business, Technical, Financial, Marketing, Investment, and People domains.", color: "#dc2626" },
  "/brand": { title: "Brand Readiness", description: "Brand Readiness Level (BRL) tracking for BEBUS, TONE, and REAL — ingredient brand strategy and consistency metrics.", color: "#7c3aed" },
  "/ip": { title: "IP Management", description: "Centralised IP registry, field-of-use licence tracking, and global licensing pipeline for EcoRace assets.", color: "#0891b2" },
  "/people": { title: "People & ESOP", description: "ESOP allocation tracking, ZINC VC stipend management, and founder/team equity vesting schedules.", color: "#059669" },
  "/marketing": { title: "Marketing Strategy", description: "VBS-level ingredient brand strategy, B2B OEM outreach for BEBUS, and D2C consumer campaigns for TONE and REAL.", color: "#d97706" },
  "/financial": { title: "Financial Analytics", description: "Revenue projections, capex tracking, unit economics, and financial model validation across the portfolio.", color: "#1d4ed8" },
  "/bcorp": { title: "B Corp & ISO Standards", description: "B Impact Assessment scoring, ISO 14001 Environmental Management, and ISO 26000 Social Responsibility progress.", color: "#22c55e" },
  "/foundation": { title: "Foundation Impact", description: "EcoRace Foundation impact metrics — nominated charity progress, vulnerable children and adults supported, and social ROI.", color: "#ec4899" },
};

export default function PlaceholderPage() {
  const [location] = useLocation();
  const meta = PAGE_META[location] || { title: "Analytics Module", description: "This module is under development.", color: "#6b7280" };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="vos-page-header">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif", color: meta.color }}>
          {meta.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{meta.description}</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${meta.color}15` }}>
            <Construction size={28} style={{ color: meta.color }} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Module Under Development
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            The <strong>{meta.title}</strong> module is part of the EcoBlend MVP roadmap. Full implementation is scheduled for VRL Stage 3.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: `${meta.color}15`, color: meta.color }}>
            Coming in VRL Stage 3 · Tasks 44–75
          </div>
        </div>
      </div>
    </div>
  );
}
