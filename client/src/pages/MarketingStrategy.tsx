// ============================================================
// ECOBLEND — Marketing Strategy Module
// Tracks brand consistency scores, campaign status, and the
// ingredient brand (B2B) vs D2C channel split across ventures.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie,
} from "recharts";
import { Megaphone, Target, TrendingUp, Globe, CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

type CampaignStatus = "Live" | "Planned" | "Completed" | "Paused";
type Channel = "OEM Direct" | "Trade Shows" | "Digital B2B" | "D2C E-Commerce" | "Social Media" | "PR & Press" | "Partnerships";

interface Campaign {
  id: string;
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  title: string;
  channel: Channel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  reach: number;
  startDate: string;
  endDate: string;
}

interface BrandConsistency {
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  model: "B2B" | "D2C";
  scores: { dimension: string; score: number }[];
}

const BRAND_CONSISTENCY: BrandConsistency[] = [
  {
    ventureId: "ecoblend",
    ventureName: "EcoBlend R&D",
    ventureColor: "#22c55e",
    model: "B2B",
    scores: [
      { dimension: "Visual Identity", score: 85 },
      { dimension: "Tone of Voice", score: 78 },
      { dimension: "Digital Presence", score: 60 },
      { dimension: "Partner Messaging", score: 90 },
      { dimension: "Sustainability Story", score: 95 },
      { dimension: "Brand Guidelines", score: 70 },
    ],
  },
  {
    ventureId: "bebus",
    ventureName: "BEBUS",
    ventureColor: "#1d4ed8",
    model: "B2B",
    scores: [
      { dimension: "Visual Identity", score: 72 },
      { dimension: "Tone of Voice", score: 65 },
      { dimension: "Digital Presence", score: 50 },
      { dimension: "Partner Messaging", score: 80 },
      { dimension: "Sustainability Story", score: 88 },
      { dimension: "Brand Guidelines", score: 55 },
    ],
  },
  {
    ventureId: "tone",
    ventureName: "TONE",
    ventureColor: "#7c3aed",
    model: "D2C",
    scores: [
      { dimension: "Visual Identity", score: 90 },
      { dimension: "Tone of Voice", score: 85 },
      { dimension: "Digital Presence", score: 75 },
      { dimension: "Consumer Messaging", score: 80 },
      { dimension: "Sustainability Story", score: 70 },
      { dimension: "Brand Guidelines", score: 88 },
    ],
  },
  {
    ventureId: "real",
    ventureName: "REAL",
    ventureColor: "#f59e0b",
    model: "D2C",
    scores: [
      { dimension: "Visual Identity", score: 80 },
      { dimension: "Tone of Voice", score: 75 },
      { dimension: "Digital Presence", score: 68 },
      { dimension: "Consumer Messaging", score: 72 },
      { dimension: "Sustainability Story", score: 82 },
      { dimension: "Brand Guidelines", score: 65 },
    ],
  },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: "cam1", ventureId: "bebus", ventureName: "BEBUS", ventureColor: "#1d4ed8", title: "EV OEM Partner Outreach Q1", channel: "OEM Direct", status: "Live", budget: 12000, spent: 7400, reach: 18, startDate: "2026-01", endDate: "2026-03" },
  { id: "cam2", ventureId: "bebus", ventureName: "BEBUS", ventureColor: "#1d4ed8", title: "Cenex EV Trade Show", channel: "Trade Shows", status: "Planned", budget: 8000, spent: 0, reach: 0, startDate: "2026-06", endDate: "2026-06" },
  { id: "cam3", ventureId: "tone", ventureName: "TONE", ventureColor: "#7c3aed", title: "Eco-Entertainment Launch Campaign", channel: "Social Media", status: "Live", budget: 5000, spent: 2800, reach: 42000, startDate: "2026-02", endDate: "2026-04" },
  { id: "cam4", ventureId: "tone", ventureName: "TONE", ventureColor: "#7c3aed", title: "D2C E-Commerce Store Launch", channel: "D2C E-Commerce", status: "Planned", budget: 6500, spent: 0, reach: 0, startDate: "2026-05", endDate: "2026-07" },
  { id: "cam5", ventureId: "real", ventureName: "REAL", ventureColor: "#f59e0b", title: "Sports Protection PR Push", channel: "PR & Press", status: "Live", budget: 4000, spent: 1200, reach: 85000, startDate: "2026-02", endDate: "2026-03" },
  { id: "cam6", ventureId: "real", ventureName: "REAL", ventureColor: "#f59e0b", title: "Athlete Partnership Programme", channel: "Partnerships", status: "Planned", budget: 9000, spent: 0, reach: 0, startDate: "2026-04", endDate: "2026-12" },
  { id: "cam7", ventureId: "ecoblend", ventureName: "EcoBlend R&D", ventureColor: "#22c55e", title: "Global IP Licensing Outreach", channel: "Digital B2B", status: "Live", budget: 3500, spent: 1800, reach: 24, startDate: "2026-01", endDate: "2026-06" },
];

const statusColors: Record<CampaignStatus, string> = {
  Live: "#22c55e",
  Planned: "#1d4ed8",
  Completed: "#9ca3af",
  Paused: "#ef4444",
};

function avg(scores: { score: number }[]) {
  return Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
}

export default function MarketingStrategy() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedBrand, setSelectedBrand] = useState<string>("ecoblend");
  const [filterStatus, setFilterStatus] = useState<"All" | CampaignStatus>("All");

  const selectedConsistency = BRAND_CONSISTENCY.find(b => b.ventureId === selectedBrand)!;
  const radarData = selectedConsistency.scores.map(s => ({ subject: s.dimension, score: s.score, fullMark: 100 }));

  const filteredCampaigns = filterStatus === "All" ? campaigns : campaigns.filter(c => c.status === filterStatus);

  const totalBudget = campaigns.reduce((a, c) => a + c.budget, 0);
  const totalSpent = campaigns.reduce((a, c) => a + c.spent, 0);
  const liveCampaigns = campaigns.filter(c => c.status === "Live").length;
  const totalReach = campaigns.reduce((a, c) => a + c.reach, 0);

  // Channel split pie
  const channelData = [
    { name: "B2B (BEBUS + EcoBlend)", value: campaigns.filter(c => c.ventureId === "bebus" || c.ventureId === "ecoblend").length, color: "#1d4ed8" },
    { name: "D2C (TONE + REAL)", value: campaigns.filter(c => c.ventureId === "tone" || c.ventureId === "real").length, color: "#7c3aed" },
  ];

  // Budget by venture bar
  const budgetData = BRAND_CONSISTENCY.map(b => ({
    name: b.ventureName,
    Budget: campaigns.filter(c => c.ventureId === b.ventureId).reduce((a, c) => a + c.budget, 0),
    Spent: campaigns.filter(c => c.ventureId === b.ventureId).reduce((a, c) => a + c.spent, 0),
    color: b.ventureColor,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-7 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#f59e0b15", color: "#f59e0b" }}>
            Marketing
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Brand Consistency & Campaign Tracker</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Marketing Strategy
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          The VBS manages brand consistency centrally across all ventures. BEBUS operates as a B2B ingredient brand targeting OEMs; TONE and REAL are D2C consumer brands. Track campaign performance and brand health across the portfolio.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Budget", value: `£${(totalBudget / 1000).toFixed(0)}k`, sub: `£${(totalSpent / 1000).toFixed(0)}k spent`, color: "#f59e0b", icon: Target },
            { label: "Live Campaigns", value: liveCampaigns.toString(), sub: `${campaigns.length} total`, color: "#22c55e", icon: Megaphone },
            { label: "Total Reach", value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(0)}k` : totalReach.toString(), sub: "impressions + OEM contacts", color: "#7c3aed", icon: Globe },
            { label: "Avg Brand Score", value: `${Math.round(BRAND_CONSISTENCY.reduce((a, b) => a + avg(b.scores), 0) / BRAND_CONSISTENCY.length)}%`, sub: "consistency across portfolio", color: "#1d4ed8", icon: TrendingUp },
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

        {/* Channel split + Budget bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie: B2B vs D2C */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Channel Model Split</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} campaigns`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 mt-2">
              {channelData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Bar: Budget by venture */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Marketing Budget by Venture</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={budgetData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v / 1000}k`} />
                <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Budget" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {budgetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Consistency Radar */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Brand Consistency Radar</h2>
            <div className="flex gap-2">
              {BRAND_CONSISTENCY.map(b => (
                <button
                  key={b.ventureId}
                  onClick={() => setSelectedBrand(b.ventureId)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: selectedBrand === b.ventureId ? b.ventureColor : "#f3f4f6",
                    color: selectedBrand === b.ventureId ? "white" : "#6b7280",
                  }}
                >
                  {b.ventureName}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Radar name={selectedConsistency.ventureName} dataKey="score" stroke={selectedConsistency.ventureColor} fill={selectedConsistency.ventureColor} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Dimension Scores</div>
              {selectedConsistency.scores.map(s => (
                <div key={s.dimension}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{s.dimension}</span>
                    <span className="font-mono font-bold" style={{ color: selectedConsistency.ventureColor }}>{s.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: selectedConsistency.ventureColor }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: "#f3f4f6" }}>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-bold">Overall Score</span>
                  <span className="font-mono font-bold" style={{ color: selectedConsistency.ventureColor }}>{avg(selectedConsistency.scores)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Tracker */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Campaign Tracker</h2>
            <div className="flex gap-2">
              {(["All", "Live", "Planned", "Completed", "Paused"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: filterStatus === f ? "#f59e0b" : "#f3f4f6",
                    color: filterStatus === f ? "white" : "#6b7280",
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
                  {["Campaign", "Venture", "Channel", "Budget", "Spent", "Reach", "Timeline", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filteredCampaigns.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 max-w-[180px]">{c.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{ color: c.ventureColor }}>{c.ventureName}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.channel}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">£{c.budget.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono font-semibold" style={{ color: c.ventureColor }}>
                        £{c.spent.toLocaleString()}
                      </div>
                      <div className="w-16 h-1 rounded-full bg-gray-100 mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0}%`, background: c.ventureColor }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{c.reach >= 1000 ? `${(c.reach / 1000).toFixed(0)}k` : c.reach || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.startDate} → {c.endDate}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${statusColors[c.status]}15`, color: statusColors[c.status] }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VBS Brand Model */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>VBS Centralised Brand Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Ingredient Brand (B2B)", desc: "BEBUS operates as a Tier 1 ingredient brand. The VBS manages a consistent technical brand narrative that positions BEBUS as a trusted sustainability partner to OEM customers globally.", color: "#1d4ed8" },
              { title: "D2C Consumer Brands", desc: "TONE and REAL are direct-to-consumer brands. The VBS provides centralised brand guidelines, tone of voice, and sustainability storytelling frameworks to ensure consistency across all consumer touchpoints.", color: "#7c3aed" },
              { title: "EcoBlend Parent Brand", desc: "EcoBlend R&D acts as the parent brand and R&D engine. Its brand identity signals scientific credibility and environmental leadership, providing a halo effect for all spin-off ventures.", color: "#22c55e" },
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
