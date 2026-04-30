// ============================================================
// INVESTMENT PACK MODULE — Investment Thesis + Gating Logic + Data Room
// Architecture Module 11 — Phase 5 MVP
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Banknote, CheckCircle2, XCircle, Clock, Lock,
  FileText, Download, ExternalLink, AlertTriangle,
} from "lucide-react";

// ── Gating Criteria ──
interface GateCriterion {
  id: string;
  label: string;
  description: string;
  dimension: string;
  threshold: string;
  currentValue: string;
  met: boolean;
}

const GATE_CRITERIA: GateCriterion[] = [
  { id: "g1", label: "VRL ≥ Stage 3", description: "Venture must be at Scaling stage or above", dimension: "VRL", threshold: "≥ 3", currentValue: "3", met: true },
  { id: "g2", label: "TRL ≥ Level 6", description: "Technology validated in relevant environment", dimension: "TRL", threshold: "≥ 6", currentValue: "7", met: true },
  { id: "g3", label: "BRL ≥ 6.0", description: "Business model validated with unit economics", dimension: "BRL", threshold: "≥ 6.0", currentValue: "6.2", met: true },
  { id: "g4", label: "No Critical Risks", description: "Zero unmitigated critical risks (RPN ≥ 200)", dimension: "Risk", threshold: "0 critical", currentValue: "1 critical", met: false },
  { id: "g5", label: "Evidence Confidence ≥ 3.5", description: "Average evidence confidence across all dimensions", dimension: "Confidence", threshold: "≥ 3.5", currentValue: "3.8", met: true },
  { id: "g6", label: "Financial Model Complete", description: "5-year P&L, cash flow, and unit economics validated", dimension: "Financial", threshold: "Complete", currentValue: "Complete", met: true },
  { id: "g7", label: "IP Position Secured", description: "At least one patent filed or defensive publication", dimension: "IP", threshold: "Filed", currentValue: "Patent Pending", met: true },
  { id: "g8", label: "Team Completeness ≥ 80%", description: "Key roles filled or committed", dimension: "People", threshold: "≥ 80%", currentValue: "75%", met: false },
];

// ── Data Room Sections ──
interface DataRoomSection {
  title: string;
  documents: { name: string; status: "ready" | "draft" | "missing"; type: string }[];
}

const DATA_ROOM: DataRoomSection[] = [
  {
    title: "Executive Summary",
    documents: [
      { name: "Investment Thesis (1-pager)", status: "ready", type: "PDF" },
      { name: "Pitch Deck", status: "ready", type: "PPTX" },
      { name: "Executive Summary Memo", status: "draft", type: "DOCX" },
    ],
  },
  {
    title: "Financial",
    documents: [
      { name: "5-Year Financial Model", status: "ready", type: "XLSX" },
      { name: "Unit Economics Analysis", status: "ready", type: "PDF" },
      { name: "Use of Funds Breakdown", status: "ready", type: "PDF" },
      { name: "Cap Table", status: "draft", type: "XLSX" },
    ],
  },
  {
    title: "Market & Validation",
    documents: [
      { name: "Market Size Analysis (TAM/SAM/SOM)", status: "ready", type: "PDF" },
      { name: "Customer Discovery Evidence Pack", status: "ready", type: "PDF" },
      { name: "Competitor Landscape Map", status: "ready", type: "PDF" },
      { name: "Letters of Intent", status: "missing", type: "PDF" },
    ],
  },
  {
    title: "Technology & IP",
    documents: [
      { name: "Technical Architecture Overview", status: "ready", type: "PDF" },
      { name: "Patent Application (GB2024/001234)", status: "ready", type: "PDF" },
      { name: "IP Landscape Analysis", status: "draft", type: "PDF" },
      { name: "R&D Roadmap", status: "ready", type: "PDF" },
    ],
  },
  {
    title: "Legal & Governance",
    documents: [
      { name: "Articles of Association", status: "ready", type: "PDF" },
      { name: "Shareholders Agreement", status: "missing", type: "PDF" },
      { name: "SEIS/EIS Advance Assurance", status: "draft", type: "PDF" },
      { name: "Board Minutes (last 12 months)", status: "ready", type: "PDF" },
    ],
  },
];

const statusIcons = {
  ready: { icon: CheckCircle2, color: "#16a34a", label: "Ready" },
  draft: { icon: Clock, color: "#d97706", label: "Draft" },
  missing: { icon: XCircle, color: "#dc2626", label: "Missing" },
};

export default function InvestmentPack() {
  const [activeTab, setActiveTab] = useState<"gate" | "dataroom" | "thesis">("gate");

  const gatesMet = GATE_CRITERIA.filter(g => g.met).length;
  const gatesPassed = gatesMet === GATE_CRITERIA.length;
  const totalDocs = DATA_ROOM.reduce((s, sec) => s + sec.documents.length, 0);
  const readyDocs = DATA_ROOM.reduce((s, sec) => s + sec.documents.filter(d => d.status === "ready").length, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={18} style={{ color: "#F49C13" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#F49C13" }}>Module 11</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Investment Readiness Pack
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Stage-gate validation, data room assembly, and investor pack export.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className="text-xs px-3 py-1"
              style={{
                background: gatesPassed ? "#dcfce7" : "#fef3c7",
                color: gatesPassed ? "#16a34a" : "#d97706",
                border: "none",
              }}
            >
              {gatesPassed ? "Gate Passed — Ready to Raise" : `${gatesMet}/${GATE_CRITERIA.length} Gates Met`}
            </Badge>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: gatesPassed ? "#16a34a" : "#6b7280" }}
              disabled={!gatesPassed}
              onClick={() => toast.success("Investment pack exported")}
            >
              <Download size={14} /> Export Pack
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {[
            { key: "gate", label: "Stage Gate" },
            { key: "dataroom", label: `Data Room (${readyDocs}/${totalDocs})` },
            { key: "thesis", label: "Investment Thesis" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? "#1a2332" : "#6b7280",
                boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Stage Gate Tab */}
        {activeTab === "gate" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Investment Readiness Gate Criteria
              </h2>
              <span className="text-xs text-gray-400">
                All criteria must be met before the investment pack can be exported and shared.
              </span>
            </div>
            {GATE_CRITERIA.map(gate => {
              const Icon = gate.met ? CheckCircle2 : XCircle;
              return (
                <div
                  key={gate.id}
                  className="bg-white rounded-xl border p-4 flex items-center gap-4"
                  style={{ borderColor: gate.met ? "#dcfce7" : "#fee2e2", borderLeft: `4px solid ${gate.met ? "#16a34a" : "#dc2626"}` }}
                >
                  <Icon size={20} style={{ color: gate.met ? "#16a34a" : "#dc2626" }} />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-900">{gate.label}</span>
                    <p className="text-xs text-gray-500">{gate.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-gray-400">Current: </span>
                    <span className="text-xs font-mono font-bold" style={{ color: gate.met ? "#16a34a" : "#dc2626" }}>
                      {gate.currentValue}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: "#e5e7eb" }}>
                    {gate.dimension}
                  </Badge>
                </div>
              );
            })}

            {!gatesPassed && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg" style={{ background: "#fef3c7" }}>
                <AlertTriangle size={14} style={{ color: "#d97706" }} />
                <span className="text-xs text-amber-800">
                  {GATE_CRITERIA.length - gatesMet} criteria not yet met. Resolve these before exporting the investment pack.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Data Room Tab */}
        {activeTab === "dataroom" && (
          <div className="space-y-6">
            {DATA_ROOM.map(section => (
              <div key={section.title}>
                <h3 className="text-sm font-bold text-gray-900 mb-2" style={{ fontFamily: "'Prompt', sans-serif" }}>
                  {section.title}
                </h3>
                <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  {section.documents.map((doc, i) => {
                    const sCfg = statusIcons[doc.status];
                    const DocIcon = sCfg.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                        style={{ borderColor: "#f3f4f6" }}
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700 flex-1">{doc.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{doc.type}</span>
                        <Badge className="text-[10px]" style={{ background: `${sCfg.color}15`, color: sCfg.color, border: "none" }}>
                          <DocIcon size={8} className="mr-0.5" />
                          {sCfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Investment Thesis Tab */}
        {activeTab === "thesis" && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Investment Thesis
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="text-sm leading-relaxed mb-4">
                <strong>Problem:</strong> The automotive and construction industries require lightweight, high-performance structural materials but face increasing regulatory pressure to reduce carbon footprint. Existing bio-based alternatives fail to match the mechanical properties of incumbent materials at competitive cost.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Solution:</strong> EcoBlend Materials has developed a proprietary natural fibre composite technology that achieves 30%+ weight reduction versus aluminium while maintaining equivalent structural integrity, using 85%+ bio-based content.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Market:</strong> The global natural fibre composites market is projected to reach £8.2B by 2028 (CAGR 11.2%). Our initial beachhead — automotive interior structural panels — represents a £1.4B addressable market.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Traction:</strong> TRL 7 achieved. 2 OEM pilot programmes active. 1 patent pending. Letter of Intent from Tier 1 supplier for £250k initial order.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Ask:</strong> £500,000 SEIS/EIS-eligible seed round to fund production pilot, OEM qualification, and first commercial orders.
              </p>
              <p className="text-sm leading-relaxed">
                <strong>Use of Funds:</strong> 40% Production Pilot · 25% OEM Qualification · 20% Team · 15% Working Capital
              </p>
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
              <span className="text-[10px] text-gray-400 italic">
                This thesis is auto-populated from validated evidence across VRL, TRL, BRL, and Financial modules. Edit to customise.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
