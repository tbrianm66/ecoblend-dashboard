// ============================================================
// ECOBLEND — Foundation Impact Module
// Tracks nominated charities per spin-off venture, donation
// commitments, beneficiary numbers, and social impact KPIs.
// ============================================================

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, TrendingUp, Globe, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface CharityPartner {
  id: string;
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  ventureChannel: string;
  charityName: string;
  charityFocus: string;
  region: string;
  donationModel: string;
  donationTarget: number;
  donationActual: number;
  beneficiariesTarget: number;
  beneficiariesActual: number;
  sdgs: string[];
  impactKpis: { label: string; value: string; unit: string }[];
  milestones: { label: string; completed: boolean }[];
}

const INITIAL_CHARITIES: CharityPartner[] = [
  {
    id: "c1",
    ventureId: "ecoblend",
    ventureName: "EcoRace",
    ventureColor: "#22c55e",
    ventureChannel: "B2B",
    charityName: "EcoRace Foundation",
    charityFocus: "Technology access for vulnerable children and adults",
    region: "United Kingdom",
    donationModel: "1% of annual revenue + in-kind technology support",
    donationTarget: 50000,
    donationActual: 8000,
    beneficiariesTarget: 500,
    beneficiariesActual: 72,
    sdgs: ["SDG 4 — Quality Education", "SDG 10 — Reduced Inequalities", "SDG 17 — Partnerships"],
    impactKpis: [
      { label: "Children reached", value: "72", unit: "beneficiaries" },
      { label: "Tech devices donated", value: "24", unit: "devices" },
      { label: "Digital literacy sessions", value: "8", unit: "workshops" },
    ],
    milestones: [
      { label: "Foundation legally constituted", completed: true },
      { label: "First charity partner MOU signed", completed: true },
      { label: "Technology donation programme launched", completed: false },
      { label: "Annual impact report published", completed: false },
    ],
  },
  {
    id: "c2",
    ventureId: "bebus",
    ventureName: "BEBUS",
    ventureColor: "#1d4ed8",
    ventureChannel: "B2B",
    charityName: "Clean Mobility for All",
    charityFocus: "Sustainable transport access in underserved communities",
    region: "United Kingdom / West Africa",
    donationModel: "1% equity pledge + free OEM technical consultancy",
    donationTarget: 30000,
    donationActual: 0,
    beneficiariesTarget: 1000,
    beneficiariesActual: 0,
    sdgs: ["SDG 11 — Sustainable Cities", "SDG 13 — Climate Action", "SDG 3 — Good Health"],
    impactKpis: [
      { label: "CO₂ offset (projected)", value: "12.4", unit: "tonnes/yr" },
      { label: "Communities targeted", value: "3", unit: "communities" },
      { label: "Partnerships in progress", value: "2", unit: "NGOs" },
    ],
    milestones: [
      { label: "Charity partner identified", completed: true },
      { label: "Impact measurement framework defined", completed: false },
      { label: "Pilot community transport project scoped", completed: false },
      { label: "First donation disbursed", completed: false },
    ],
  },
  {
    id: "c3",
    ventureId: "tone",
    ventureName: "TONE",
    ventureColor: "#7c3aed",
    ventureChannel: "D2C",
    charityName: "Arts Access Foundation",
    charityFocus: "Creative arts and entertainment access for disadvantaged youth",
    region: "United Kingdom",
    donationModel: "1% of product revenue + free creative workshops",
    donationTarget: 20000,
    donationActual: 2500,
    beneficiariesTarget: 300,
    beneficiariesActual: 45,
    sdgs: ["SDG 4 — Quality Education", "SDG 10 — Reduced Inequalities", "SDG 11 — Sustainable Cities"],
    impactKpis: [
      { label: "Young people engaged", value: "45", unit: "beneficiaries" },
      { label: "Creative workshops delivered", value: "6", unit: "sessions" },
      { label: "Schools partnered", value: "3", unit: "schools" },
    ],
    milestones: [
      { label: "Charity partner MOU signed", completed: true },
      { label: "Workshop programme designed", completed: true },
      { label: "First cohort of workshops delivered", completed: false },
      { label: "Impact measurement report published", completed: false },
    ],
  },
  {
    id: "c4",
    ventureId: "real",
    ventureName: "REAL",
    ventureColor: "#f59e0b",
    ventureChannel: "D2C",
    charityName: "Sport for Life Foundation",
    charityFocus: "Sport participation and physical wellbeing for vulnerable youth",
    region: "United Kingdom",
    donationModel: "1% of product revenue + equipment donations",
    donationTarget: 25000,
    donationActual: 1200,
    beneficiariesTarget: 400,
    beneficiariesActual: 30,
    sdgs: ["SDG 3 — Good Health", "SDG 10 — Reduced Inequalities", "SDG 4 — Quality Education"],
    impactKpis: [
      { label: "Young athletes supported", value: "30", unit: "beneficiaries" },
      { label: "Equipment kits donated", value: "15", unit: "kits" },
      { label: "Clubs partnered", value: "4", unit: "clubs" },
    ],
    milestones: [
      { label: "Charity partner identified", completed: true },
      { label: "Equipment donation programme launched", completed: false },
      { label: "First cohort of athletes supported", completed: false },
      { label: "Annual impact report published", completed: false },
    ],
  },
];

function pct(actual: number, target: number) {
  return target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
}

function fmt(n: number) {
  return n >= 1000 ? `£${(n / 1000).toFixed(1)}k` : `£${n}`;
}

function CharityCard({ charity, onToggleMilestone }: {
  charity: CharityPartner;
  onToggleMilestone: (charityId: string, index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const donationPct = pct(charity.donationActual, charity.donationTarget);
  const benPct = pct(charity.beneficiariesActual, charity.beneficiariesTarget);

  return (
    <div
      className="bg-white rounded-xl border shadow-sm overflow-hidden"
      style={{ borderLeft: `4px solid ${charity.ventureColor}`, borderColor: "#e5e7eb", borderLeftColor: charity.ventureColor }}
    >
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold" style={{ color: charity.ventureColor, fontFamily: "'DM Sans', sans-serif" }}>
              {charity.ventureName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border font-semibold" style={{ borderColor: charity.ventureColor, color: charity.ventureColor }}>
              {charity.ventureChannel}
            </span>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        <div className="text-sm font-semibold text-gray-800 mb-0.5">{charity.charityName}</div>
        <div className="text-xs text-gray-500 mb-3">{charity.charityFocus} · {charity.region}</div>

        {/* Donation & Beneficiary bars */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Donations</span>
              <span className="font-mono font-semibold" style={{ color: charity.ventureColor }}>{fmt(charity.donationActual)} / {fmt(charity.donationTarget)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${donationPct}%`, background: charity.ventureColor }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Beneficiaries</span>
              <span className="font-mono font-semibold" style={{ color: charity.ventureColor }}>{charity.beneficiariesActual} / {charity.beneficiariesTarget}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${benPct}%`, background: charity.ventureColor }} />
            </div>
          </div>
        </div>

        {/* SDGs */}
        <div className="flex flex-wrap gap-1.5">
          {charity.sdgs.map(sdg => (
            <span key={sdg} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{sdg}</span>
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-6 py-4 space-y-4" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
          {/* Donation model */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Donation Model</div>
            <p className="text-sm text-gray-600">{charity.donationModel}</p>
          </div>

          {/* Impact KPIs */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Impact KPIs</div>
            <div className="grid grid-cols-3 gap-3">
              {charity.impactKpis.map(kpi => (
                <div key={kpi.label} className="bg-white rounded-lg border p-3 text-center" style={{ borderColor: `${charity.ventureColor}30` }}>
                  <div className="text-xl font-bold font-mono" style={{ color: charity.ventureColor }}>{kpi.value}</div>
                  <div className="text-xs text-gray-400">{kpi.unit}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Impact Milestones</div>
            <div className="space-y-1.5">
              {charity.milestones.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => onToggleMilestone(charity.id, i)}
                >
                  <span style={{ color: m.completed ? charity.ventureColor : "#d1d5db" }} className="flex-shrink-0">
                    {m.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  </span>
                  <span className="text-sm" style={{ color: m.completed ? "#9ca3af" : "#374151", textDecoration: m.completed ? "line-through" : "none" }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FoundationImpact() {
  const [charities, setCharities] = useState<CharityPartner[]>(INITIAL_CHARITIES);

  const totalDonations = charities.reduce((a, c) => a + c.donationActual, 0);
  const totalDonationTarget = charities.reduce((a, c) => a + c.donationTarget, 0);
  const totalBeneficiaries = charities.reduce((a, c) => a + c.beneficiariesActual, 0);
  const totalBenTarget = charities.reduce((a, c) => a + c.beneficiariesTarget, 0);
  const totalMilestones = charities.reduce((a, c) => a + c.milestones.length, 0);
  const completedMilestones = charities.reduce((a, c) => a + c.milestones.filter(m => m.completed).length, 0);

  const handleToggleMilestone = (charityId: string, index: number) => {
    setCharities(prev => prev.map(c => {
      if (c.id !== charityId) return c;
      const milestones = c.milestones.map((m, i) => i === index ? { ...m, completed: !m.completed } : m);
      return { ...c, milestones };
    }));
    toast.success("Impact milestone updated");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#ec489915", color: "#ec4899" }}>
            Social Impact
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Foundation & Charity Partners</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Foundation Impact
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          Each EcoBlend VBS spin-off nominates a charity aligned to its core activity. This module tracks donation commitments, beneficiary reach, and social impact KPIs across the portfolio.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* Portfolio KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Donations", value: fmt(totalDonations), sub: `of ${fmt(totalDonationTarget)} target`, color: "#ec4899", icon: Heart },
            { label: "Beneficiaries Reached", value: totalBeneficiaries.toString(), sub: `of ${totalBenTarget} target`, color: "#22c55e", icon: Users },
            { label: "Impact Milestones", value: `${completedMilestones}/${totalMilestones}`, sub: "completed", color: "#f59e0b", icon: TrendingUp },
            { label: "Charity Partners", value: charities.length.toString(), sub: "active nominations", color: "#1d4ed8", icon: Globe },
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

        {/* Overall donation progress */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Portfolio Donation Progress</h2>
            <span className="text-sm font-bold font-mono" style={{ color: "#ec4899" }}>{pct(totalDonations, totalDonationTarget)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct(totalDonations, totalDonationTarget)}%`, background: "linear-gradient(90deg, #ec4899, #f59e0b)" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{fmt(totalDonations)} raised</span>
            <span>{fmt(totalDonationTarget)} annual target</span>
          </div>
        </div>

        {/* Charity partner cards */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Nominated Charity Partners
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {charities.map(c => (
              <CharityCard key={c.id} charity={c} onToggleMilestone={handleToggleMilestone} />
            ))}
          </div>
        </div>

        {/* Model explanation */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>The EcoRace Foundation Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "1% Pledge", desc: "Each spin-off commits 1% of annual revenue and 1% of equity to its nominated charity, inspired by the Salesforce Pledge 1% model.", color: "#ec4899" },
              { title: "Mission Model Canvas", desc: "Every spin-off operates a dual BMC (commercial) and MMC (mission) canvas, ensuring social purpose is embedded in the business model from day one.", color: "#22c55e" },
              { title: "Technology Contribution", desc: "In addition to financial donations, each venture contributes in-kind technology support — devices, digital literacy training, or product donations — to its nominated charity.", color: "#1d4ed8" },
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
