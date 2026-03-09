// ============================================================
// ECOBLEND — IP Management Module
// Tracks EcoBlend's patent portfolio, licensing agreements,
// TRL-to-commercialisation pipeline, and global partners.
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, FileText, Globe, Zap, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";

type IpStatus = "Filed" | "Pending" | "Granted" | "Licensed";
type LicenseType = "Exclusive" | "Non-Exclusive" | "Field-of-Use";
type LicenseStatus = "Active" | "Negotiating" | "Expired";

interface Patent {
  id: string;
  title: string;
  reference: string;
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  trl: number;
  status: IpStatus;
  filedDate: string;
  description: string;
  commercialPotential: "High" | "Medium" | "Low";
}

interface LicenseAgreement {
  id: string;
  patentId: string;
  patentTitle: string;
  licensee: string;
  country: string;
  region: string;
  type: LicenseType;
  status: LicenseStatus;
  annualValue: number;
  startDate: string;
  endDate: string;
  valuesAligned: boolean;
}

interface PipelineStage {
  stage: string;
  trlRange: string;
  items: { title: string; ventureColor: string; ventureName: string }[];
}

const PATENTS: Patent[] = [
  {
    id: "p1",
    title: "Eco-Composite Material Formulation for Transport Applications",
    reference: "EB-PAT-001",
    ventureId: "bebus",
    ventureName: "BEBUS",
    ventureColor: "#1d4ed8",
    trl: 4,
    status: "Pending",
    filedDate: "2025-06",
    description: "A novel bio-based composite material with 40% lower embodied carbon than conventional alternatives, suitable for structural transport components.",
    commercialPotential: "High",
  },
  {
    id: "p2",
    title: "Biodegradable Acoustic Dampening Structure for Entertainment Devices",
    reference: "EB-PAT-002",
    ventureId: "tone",
    ventureName: "TONE",
    ventureColor: "#7c3aed",
    trl: 3,
    status: "Filed",
    filedDate: "2025-09",
    description: "A plant-derived acoustic dampening layer that replaces petroleum-based foam in consumer entertainment products without compromising sound performance.",
    commercialPotential: "Medium",
  },
  {
    id: "p3",
    title: "Impact-Absorbing Bio-Polymer System for Sports Protection",
    reference: "EB-PAT-003",
    ventureId: "real",
    ventureName: "REAL",
    ventureColor: "#f59e0b",
    trl: 5,
    status: "Granted",
    filedDate: "2024-11",
    description: "A rate-dependent bio-polymer protection system that outperforms conventional EVA foam in impact absorption while being fully compostable at end of life.",
    commercialPotential: "High",
  },
  {
    id: "p4",
    title: "Circular Material Tracking and Provenance System",
    reference: "EB-PAT-004",
    ventureId: "ecoblend",
    ventureName: "EcoBlend R&D",
    ventureColor: "#22c55e",
    trl: 2,
    status: "Filed",
    filedDate: "2026-01",
    description: "A blockchain-anchored material provenance and circularity tracking system enabling OEM customers to verify the sustainability credentials of supplied materials.",
    commercialPotential: "High",
  },
];

const LICENSES: LicenseAgreement[] = [
  {
    id: "l1",
    patentId: "p3",
    patentTitle: "Impact-Absorbing Bio-Polymer System",
    licensee: "Nordic Sports GmbH",
    country: "Germany",
    region: "Europe",
    type: "Field-of-Use",
    status: "Active",
    annualValue: 45000,
    startDate: "2025-03",
    endDate: "2028-03",
    valuesAligned: true,
  },
  {
    id: "l2",
    patentId: "p1",
    patentTitle: "Eco-Composite Material Formulation",
    licensee: "GreenDrive Technologies",
    country: "Netherlands",
    region: "Europe",
    type: "Exclusive",
    status: "Negotiating",
    annualValue: 120000,
    startDate: "2026-06",
    endDate: "2031-06",
    valuesAligned: true,
  },
  {
    id: "l3",
    patentId: "p3",
    patentTitle: "Impact-Absorbing Bio-Polymer System",
    licensee: "Pacific Protect Co.",
    country: "Australia",
    region: "Asia-Pacific",
    type: "Non-Exclusive",
    status: "Active",
    annualValue: 28000,
    startDate: "2025-07",
    endDate: "2027-07",
    valuesAligned: true,
  },
];

const PIPELINE: PipelineStage[] = [
  {
    stage: "Basic Research",
    trlRange: "TRL 1–2",
    items: [
      { title: "Circular Material Tracking System", ventureColor: "#22c55e", ventureName: "EcoBlend R&D" },
      { title: "Acoustic Dampening Structure", ventureColor: "#7c3aed", ventureName: "TONE" },
    ],
  },
  {
    stage: "Proof of Concept",
    trlRange: "TRL 3–4",
    items: [
      { title: "Eco-Composite Transport Material", ventureColor: "#1d4ed8", ventureName: "BEBUS" },
    ],
  },
  {
    stage: "Validation",
    trlRange: "TRL 5–6",
    items: [
      { title: "Bio-Polymer Protection System", ventureColor: "#f59e0b", ventureName: "REAL" },
    ],
  },
  {
    stage: "Demonstration",
    trlRange: "TRL 7–8",
    items: [],
  },
  {
    stage: "Commercial Deployment",
    trlRange: "TRL 9",
    items: [],
  },
];

const statusColors: Record<IpStatus, string> = {
  Filed: "#f59e0b",
  Pending: "#1d4ed8",
  Granted: "#22c55e",
  Licensed: "#7c3aed",
};

const licenseStatusColors: Record<LicenseStatus, string> = {
  Active: "#22c55e",
  Negotiating: "#f59e0b",
  Expired: "#ef4444",
};

const potentialColors: Record<string, string> = {
  High: "#22c55e",
  Medium: "#f59e0b",
  Low: "#9ca3af",
};

export default function IpManagement() {
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);
  const [licenseFilter, setLicenseFilter] = useState<"All" | LicenseStatus>("All");

  const totalLicenseValue = LICENSES.filter(l => l.status === "Active").reduce((a, l) => a + l.annualValue, 0);
  const activePatents = PATENTS.filter(p => p.status === "Granted" || p.status === "Licensed").length;
  const filteredLicenses = licenseFilter === "All" ? LICENSES : LICENSES.filter(l => l.status === licenseFilter);

  const regions = Array.from(new Set(LICENSES.map(l => l.region)));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#22c55e15", color: "#22c55e" }}>
            Intellectual Property
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">EcoBlend R&D Lab</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          IP Management
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          EcoBlend retains ownership of all core IP and grants field-of-use licences to spin-offs and values-aligned global partners. Track patents, licensing agreements, and the TRL-to-commercialisation pipeline.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patents", value: PATENTS.length.toString(), sub: `${activePatents} granted`, color: "#22c55e", icon: Shield },
            { label: "License Agreements", value: LICENSES.length.toString(), sub: `${LICENSES.filter(l => l.status === "Active").length} active`, color: "#1d4ed8", icon: FileText },
            { label: "Annual License Revenue", value: `£${(totalLicenseValue / 1000).toFixed(0)}k`, sub: "from active licences", color: "#7c3aed", icon: Zap },
            { label: "Global Regions", value: regions.length.toString(), sub: "values-aligned partners", color: "#f59e0b", icon: Globe },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{kpi.label}</span>
              </div>
              <div className="text-3xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* TRL-to-Commercialisation Pipeline */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            TRL-to-Commercialisation Pipeline
          </h2>
          <div className="grid grid-cols-5 gap-3">
            {PIPELINE.map((stage, i) => (
              <div key={stage.stage} className="relative">
                {/* Connector line */}
                {i < PIPELINE.length - 1 && (
                  <div className="absolute top-5 left-full w-3 h-0.5 bg-gray-200 z-10" />
                )}
                <div
                  className="rounded-lg p-3 min-h-[120px]"
                  style={{
                    background: stage.items.length > 0 ? "#f0fdf4" : "#f9fafb",
                    border: `1px solid ${stage.items.length > 0 ? "#bbf7d0" : "#e5e7eb"}`,
                  }}
                >
                  <div className="text-xs font-bold text-gray-700 mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{stage.stage}</div>
                  <div className="text-xs font-mono text-gray-400 mb-2">{stage.trlRange}</div>
                  <div className="space-y-1.5">
                    {stage.items.map(item => (
                      <div
                        key={item.title}
                        className="text-xs px-2 py-1.5 rounded-md font-medium leading-tight"
                        style={{ background: `${item.ventureColor}15`, color: item.ventureColor, border: `1px solid ${item.ventureColor}30` }}
                      >
                        {item.title}
                      </div>
                    ))}
                    {stage.items.length === 0 && (
                      <div className="text-xs text-gray-300 italic">No IP at this stage</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patent Portfolio */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Patent Portfolio</h2>
          <div className="space-y-3">
            {PATENTS.map(patent => (
              <div
                key={patent.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden"
                style={{ borderLeft: `4px solid ${patent.ventureColor}`, borderColor: "#e5e7eb", borderLeftColor: patent.ventureColor }}
              >
                <div
                  className="flex items-start justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedPatent(expandedPatent === patent.id ? null : patent.id)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{patent.reference}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${statusColors[patent.status]}15`, color: statusColors[patent.status] }}>
                        {patent.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${potentialColors[patent.commercialPotential]}15`, color: potentialColors[patent.commercialPotential] }}>
                        {patent.commercialPotential} Potential
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">{patent.title}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span style={{ color: patent.ventureColor }}>{patent.ventureName}</span>
                      <span>·</span>
                      <span>TRL {patent.trl}</span>
                      <span>·</span>
                      <span>Filed {patent.filedDate}</span>
                    </div>
                  </div>
                  {expandedPatent === patent.id ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
                </div>
                {expandedPatent === patent.id && (
                  <div className="px-6 pb-4 border-t pt-3" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{patent.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Licensing status:</span>
                      {LICENSES.filter(l => l.patentId === patent.id).length > 0 ? (
                        LICENSES.filter(l => l.patentId === patent.id).map(l => (
                          <span key={l.id} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${licenseStatusColors[l.status]}15`, color: licenseStatusColors[l.status] }}>
                            {l.licensee} ({l.country}) — {l.status}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-300">No active licences</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Licensing Agreements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Global Licensing Agreements</h2>
            <div className="flex gap-2">
              {(["All", "Active", "Negotiating", "Expired"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setLicenseFilter(f)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: licenseFilter === f ? "#22c55e" : "#f3f4f6",
                    color: licenseFilter === f ? "white" : "#6b7280",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Licensee", "Country / Region", "Patent", "Type", "Annual Value", "Term", "Values-Aligned", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < filteredLicenses.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{l.licensee}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.country} <span className="text-gray-300">·</span> {l.region}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{l.patentTitle}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{l.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold font-mono text-gray-800">£{(l.annualValue / 1000).toFixed(0)}k</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{l.startDate} → {l.endDate}</td>
                    <td className="px-4 py-3 text-center">
                      {l.valuesAligned
                        ? <CheckCircle2 size={15} style={{ color: "#22c55e" }} className="mx-auto" />
                        : <Circle size={15} style={{ color: "#d1d5db" }} className="mx-auto" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${licenseStatusColors[l.status]}15`, color: licenseStatusColors[l.status] }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* IP Governance */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>IP Governance Principles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Centralised Ownership", desc: "All core IP is owned by EcoBlend R&D. Spin-offs receive exclusive, field-of-use licences, protecting the portfolio from single-venture failure.", color: "#22c55e" },
              { title: "Values-Aligned Licensing", desc: "External licences are only granted to partners who demonstrate alignment with EcoRace VBS values — sustainability, social impact, and ethical governance.", color: "#1d4ed8" },
              { title: "Global Expansion", desc: "IP licensing to international partners creates a revenue stream that funds further R&D and extends the VBS's social and environmental impact globally.", color: "#7c3aed" },
            ].map(item => (
              <div key={item.title} className="rounded-lg p-4" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: item.color }}>{item.title}</div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
