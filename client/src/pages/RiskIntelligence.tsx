// ============================================================
// RISK INTELLIGENCE MODULE — FMEA-based Risk Register + Heatmap
// Architecture Module 9 — Phase 4 MVP
// ============================================================
import ContextualPlaybookPanel from "@/components/ContextualPlaybookPanel";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, Plus, AlertTriangle, TrendingDown, CheckCircle2,
  Eye, Filter,
} from "lucide-react";

// ── Types ──
interface Risk {
  id: string;
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  riskType: string;
  title: string;
  description: string;
  severity: number;
  probability: number;
  detectability: number;
  rpn: number;
  riskBand: "low" | "medium" | "high" | "critical";
  status: "open" | "mitigating" | "mitigated" | "accepted" | "closed";
  owner: string;
  sourceModule: string;
}

// ── Config ──
const RISK_TYPES = ["market", "technical", "business_model", "financial", "operational", "people", "ip_legal", "supply_chain", "sustainability", "reputational"];

const bandConfig = {
  low: { color: "#16a34a", bg: "#dcfce7", label: "Low" },
  medium: { color: "#d97706", bg: "#fef3c7", label: "Medium" },
  high: { color: "#ea580c", bg: "#ffedd5", label: "High" },
  critical: { color: "#dc2626", bg: "#fee2e2", label: "Critical" },
};

const statusConfig = {
  open: { color: "#dc2626", label: "Open" },
  mitigating: { color: "#d97706", label: "Mitigating" },
  mitigated: { color: "#16a34a", label: "Mitigated" },
  accepted: { color: "#6b7280", label: "Accepted" },
  closed: { color: "#374151", label: "Closed" },
};

// ── Sample Data ──
const SAMPLE_RISKS: Risk[] = [
  { id: "r-1", ventureId: "v1", ventureName: "EcoBlend Materials", ventureColor: "#51AF37", riskType: "technical", title: "Fibre consistency variability in hemp supply", description: "Natural fibre batches show 15-20% variation in tensile properties, impacting product consistency.", severity: 7, probability: 6, detectability: 4, rpn: 168, riskBand: "high", status: "mitigating", owner: "Dr. Sarah Chen", sourceModule: "R&D Hub" },
  { id: "r-2", ventureId: "v1", ventureName: "EcoBlend Materials", ventureColor: "#51AF37", riskType: "market", title: "OEM adoption timeline longer than projected", description: "Automotive qualification cycles typically 18-36 months; current model assumes 12 months.", severity: 6, probability: 7, detectability: 5, rpn: 210, riskBand: "critical", status: "open", owner: "Brian", sourceModule: "Discovery" },
  { id: "r-3", ventureId: "v2", ventureName: "BioStruct", ventureColor: "#8b5cf6", riskType: "ip_legal", title: "Freedom-to-operate risk on mycelium binding process", description: "Competitor patent US2024/0123456 may cover aspects of our binding methodology.", severity: 8, probability: 4, detectability: 3, rpn: 96, riskBand: "medium", status: "mitigating", owner: "IP Counsel", sourceModule: "Governance" },
  { id: "r-4", ventureId: "v2", ventureName: "BioStruct", ventureColor: "#8b5cf6", riskType: "supply_chain", title: "Single-source dependency for mycelium culture", description: "Only one qualified supplier for the specific mycelium strain required.", severity: 7, probability: 5, detectability: 6, rpn: 210, riskBand: "critical", status: "open", owner: "Operations Lead", sourceModule: "Operations" },
  { id: "r-5", ventureId: "v3", ventureName: "CircularTech", ventureColor: "#059669", riskType: "financial", title: "Unit economics below break-even at current scale", description: "Recycled carbon fibre cost per kg exceeds virgin at volumes below 500 tonnes/year.", severity: 5, probability: 6, detectability: 7, rpn: 210, riskBand: "critical", status: "open", owner: "CFO", sourceModule: "Proposition" },
  { id: "r-6", ventureId: "v1", ventureName: "EcoBlend Materials", ventureColor: "#51AF37", riskType: "sustainability", title: "LCA data gaps for hemp cultivation phase", description: "Insufficient primary data on water usage and pesticide inputs for UK-grown hemp.", severity: 4, probability: 5, detectability: 4, rpn: 80, riskBand: "medium", status: "accepted", owner: "Sustainability Lead", sourceModule: "Sustainability" },
  { id: "r-7", ventureId: "v3", ventureName: "CircularTech", ventureColor: "#059669", riskType: "operational", title: "Pyrolysis furnace capacity constraint", description: "Current lab furnace limits batch size to 5kg; pilot requires 50kg minimum.", severity: 5, probability: 3, detectability: 8, rpn: 120, riskBand: "high", status: "mitigated", owner: "Dr. Amara Patel", sourceModule: "R&D Hub" },
];

function getRpnBand(rpn: number): "low" | "medium" | "high" | "critical" {
  if (rpn >= 200) return "critical";
  if (rpn >= 120) return "high";
  if (rpn >= 60) return "medium";
  return "low";
}

export default function RiskIntelligence() {
  const [filterBand, setFilterBand] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = SAMPLE_RISKS.filter(r => {
    if (filterBand !== "all" && r.riskBand !== filterBand) return false;
    if (filterType !== "all" && r.riskType !== filterType) return false;
    return true;
  }).sort((a, b) => b.rpn - a.rpn);

  const criticalCount = SAMPLE_RISKS.filter(r => r.riskBand === "critical").length;
  const highCount = SAMPLE_RISKS.filter(r => r.riskBand === "high").length;
  const openCount = SAMPLE_RISKS.filter(r => r.status === "open").length;
  const avgRpn = Math.round(SAMPLE_RISKS.reduce((s, r) => s + r.rpn, 0) / SAMPLE_RISKS.length);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} style={{ color: "#dc2626" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#dc2626" }}>Module 9</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Risk Intelligence
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              FMEA-based risk register with RPN scoring (Severity × Probability × Detectability)
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            style={{ background: "#dc2626" }}
            onClick={() => toast.info("New risk form — coming in next build")}
          >
            <Plus size={14} /> Log Risk
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold text-gray-400 uppercase">Critical Risks</span>
            <p className="text-2xl font-bold" style={{ color: "#dc2626", fontFamily: "'Prompt', sans-serif" }}>{criticalCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold text-gray-400 uppercase">High Risks</span>
            <p className="text-2xl font-bold" style={{ color: "#ea580c", fontFamily: "'Prompt', sans-serif" }}>{highCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold text-gray-400 uppercase">Open / Unmitigated</span>
            <p className="text-2xl font-bold" style={{ color: "#d97706", fontFamily: "'Prompt', sans-serif" }}>{openCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
            <span className="text-xs font-semibold text-gray-400 uppercase">Avg RPN</span>
            <p className="text-2xl font-bold" style={{ color: avgRpn >= 150 ? "#dc2626" : "#6b7280", fontFamily: "'Prompt', sans-serif" }}>{avgRpn}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Filter size={14} className="text-gray-400" />
          <div className="flex gap-1">
            {["all", "critical", "high", "medium", "low"].map(band => (
              <button
                key={band}
                onClick={() => setFilterBand(band)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: filterBand === band ? (band === "all" ? "#f3f4f6" : bandConfig[band as keyof typeof bandConfig]?.bg || "#f3f4f6") : "transparent",
                  color: filterBand === band ? (band === "all" ? "#1a2332" : bandConfig[band as keyof typeof bandConfig]?.color || "#6b7280") : "#6b7280",
                  border: `1px solid ${filterBand === band ? (band === "all" ? "#e5e7eb" : bandConfig[band as keyof typeof bandConfig]?.color || "#e5e7eb") : "transparent"}`,
                }}
              >
                {band === "all" ? "All" : bandConfig[band as keyof typeof bandConfig]?.label}
              </button>
            ))}
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs border rounded-md px-2 py-1 text-gray-600"
            style={{ borderColor: "#e5e7eb" }}
          >
            <option value="all">All Types</option>
            {RISK_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Risk Register Table */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Venture</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">S</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">P</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">D</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">RPN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Band</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(risk => {
                const bCfg = bandConfig[risk.riskBand];
                const sCfg = statusConfig[risk.status];
                return (
                  <tr key={risk.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 text-xs">{risk.title}</span>
                      <br />
                      <span className="text-[10px] text-gray-400 capitalize">{risk.riskType.replace(/_/g, " ")} · {risk.sourceModule}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: risk.ventureColor }}>{risk.ventureName}</span>
                    </td>
                    <td className="text-center px-3 py-3 text-xs font-mono">{risk.severity}</td>
                    <td className="text-center px-3 py-3 text-xs font-mono">{risk.probability}</td>
                    <td className="text-center px-3 py-3 text-xs font-mono">{risk.detectability}</td>
                    <td className="text-center px-3 py-3">
                      <span className="text-xs font-bold font-mono" style={{ color: bCfg.color }}>{risk.rpn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="text-[10px]" style={{ background: bCfg.bg, color: bCfg.color, border: "none" }}>
                        {bCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: sCfg.color }}>{sCfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{risk.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RPN Formula note */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <AlertTriangle size={10} />
          RPN = Severity (1-10) × Probability (1-10) × Detectability (1-10). Critical ≥ 200, High ≥ 120, Medium ≥ 60, Low &lt; 60.
        </div>
      </div>

        {/* Contextual Playbook Guidance */}
        <div className="p-8 pt-0">
          <ContextualPlaybookPanel module="Risk Intelligence" ventureId={null} page="risk" workflowStage="ALL" />
        </div>
    </div>
  );
}
