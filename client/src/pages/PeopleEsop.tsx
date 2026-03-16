// ============================================================
// ECOBLEND — People & ESOP Module
// Tracks founder equity vesting schedules, stipend status,
// and team headcount across all ventures.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import { Users, DollarSign, Award, TrendingUp, CheckCircle2, Circle } from "lucide-react";

type StipendStatus = "Active" | "Completed" | "Pending" | "Paused";
type VestingStatus = "Vesting" | "Cliff" | "Fully Vested" | "Not Started";
type Role = "Founder" | "Co-Founder" | "Lead Engineer" | "VBS Mentor" | "Advisor";

interface TeamMember {
  id: string;
  name: string;
  role: Role;
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  equityPct: number;
  vestedPct: number;
  vestingStatus: VestingStatus;
  cliffMonths: number;
  vestingMonths: number;
  monthsIn: number;
  stipendStatus: StipendStatus;
  stipendMonthly: number;
  stipendMonthsRemaining: number;
  stipendTotalMonths: number;
  skills: string[];
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "tm1",
    name: "Alex Morgan",
    role: "Founder",
    ventureId: "bebus",
    ventureName: "BEBUS",
    ventureColor: "#1d4ed8",
    equityPct: 25,
    vestedPct: 12,
    vestingStatus: "Vesting",
    cliffMonths: 12,
    vestingMonths: 48,
    monthsIn: 7,
    stipendStatus: "Active",
    stipendMonthly: 2200,
    stipendMonthsRemaining: 5,
    stipendTotalMonths: 6,
    skills: ["Automotive Engineering", "Material Science", "B2B Sales"],
  },
  {
    id: "tm2",
    name: "Priya Sharma",
    role: "Co-Founder",
    ventureId: "bebus",
    ventureName: "BEBUS",
    ventureColor: "#1d4ed8",
    equityPct: 15,
    vestedPct: 8,
    vestingStatus: "Cliff",
    cliffMonths: 12,
    vestingMonths: 48,
    monthsIn: 7,
    stipendStatus: "Active",
    stipendMonthly: 1800,
    stipendMonthsRemaining: 5,
    stipendTotalMonths: 6,
    skills: ["Supply Chain", "Sustainability", "OEM Partnerships"],
  },
  {
    id: "tm3",
    name: "Jamie Lee",
    role: "Founder",
    ventureId: "tone",
    ventureName: "TONE",
    ventureColor: "#7c3aed",
    equityPct: 28,
    vestedPct: 0,
    vestingStatus: "Not Started",
    cliffMonths: 12,
    vestingMonths: 48,
    monthsIn: 1,
    stipendStatus: "Pending",
    stipendMonthly: 2200,
    stipendMonthsRemaining: 6,
    stipendTotalMonths: 6,
    skills: ["Product Design", "Consumer Electronics", "D2C Marketing"],
  },
  {
    id: "tm4",
    name: "Sam Okafor",
    role: "Founder",
    ventureId: "real",
    ventureName: "REAL",
    ventureColor: "#f59e0b",
    equityPct: 30,
    vestedPct: 18,
    vestingStatus: "Vesting",
    cliffMonths: 12,
    vestingMonths: 48,
    monthsIn: 10,
    stipendStatus: "Active",
    stipendMonthly: 2200,
    stipendMonthsRemaining: 2,
    stipendTotalMonths: 6,
    skills: ["Sports Science", "Bio-Materials", "Brand Development"],
  },
  {
    id: "tm5",
    name: "Dr. Rachel Chen",
    role: "Lead Engineer",
    ventureId: "ecoblend",
    ventureName: "EcoRace",
    ventureColor: "#22c55e",
    equityPct: 8,
    vestedPct: 25,
    vestingStatus: "Vesting",
    cliffMonths: 6,
    vestingMonths: 36,
    monthsIn: 14,
    stipendStatus: "Completed",
    stipendMonthly: 2200,
    stipendMonthsRemaining: 0,
    stipendTotalMonths: 6,
    skills: ["Polymer Chemistry", "TRL Development", "IP Filing"],
  },
  {
    id: "tm6",
    name: "Marcus Webb",
    role: "VBS Mentor",
    ventureId: "ecoblend",
    ventureName: "EcoRace",
    ventureColor: "#22c55e",
    equityPct: 3,
    vestedPct: 50,
    vestingStatus: "Fully Vested",
    cliffMonths: 0,
    vestingMonths: 24,
    monthsIn: 18,
    stipendStatus: "Completed",
    stipendMonthly: 0,
    stipendMonthsRemaining: 0,
    stipendTotalMonths: 0,
    skills: ["Venture Building", "Investment", "Governance"],
  },
];

const vestingColors: Record<VestingStatus, string> = {
  "Vesting": "#22c55e",
  "Cliff": "#f59e0b",
  "Fully Vested": "#1d4ed8",
  "Not Started": "#9ca3af",
};

const stipendColors: Record<StipendStatus, string> = {
  "Active": "#22c55e",
  "Completed": "#1d4ed8",
  "Pending": "#f59e0b",
  "Paused": "#ef4444",
};

function VestingBar({ member }: { member: TeamMember }) {
  const cliffPct = (member.cliffMonths / member.vestingMonths) * 100;
  const progressPct = Math.min((member.monthsIn / member.vestingMonths) * 100, 100);

  return (
    <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-visible">
      {/* Vested fill */}
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${progressPct}%`, background: vestingColors[member.vestingStatus] }}
      />
      {/* Cliff marker */}
      {member.cliffMonths > 0 && (
        <div
          className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-gray-400 z-10"
          style={{ left: `${cliffPct}%` }}
          title={`Cliff: ${member.cliffMonths} months`}
        />
      )}
    </div>
  );
}

export default function PeopleEsop() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [filterVenture, setFilterVenture] = useState<string>("All");

  const ventures = Array.from(new Set(team.map(m => m.ventureName)));
  const filtered = filterVenture === "All" ? team : team.filter(m => m.ventureName === filterVenture);

  const totalEquityAllocated = team.reduce((a, m) => a + m.equityPct, 0);
  const activeStipends = team.filter(m => m.stipendStatus === "Active").length;
  const totalStipendMonthly = team.filter(m => m.stipendStatus === "Active").reduce((a, m) => a + m.stipendMonthly, 0);
  const fullyVested = team.filter(m => m.vestingStatus === "Fully Vested").length;

  // Group by venture for headcount
  const headcountByVenture = ventures.map(v => ({
    name: v,
    count: team.filter(m => m.ventureName === v).length,
    color: team.find(m => m.ventureName === v)?.ventureColor ?? "#22c55e",
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#1d4ed815", color: "#1d4ed8" }}>
            People
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">ESOP, Stipend & Team</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          People & ESOP
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          Track founder equity vesting schedules, stipend support status, and team headcount across all ventures in the EcoBlend VBS portfolio.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Team Members", value: team.length.toString(), sub: `across ${ventures.length} ventures`, color: "#1d4ed8", icon: Users },
            { label: "Equity Allocated", value: `${totalEquityAllocated}%`, sub: "of ESOP pool", color: "#22c55e", icon: Award },
            { label: "Active Stipends", value: activeStipends.toString(), sub: `£${(totalStipendMonthly / 1000).toFixed(1)}k / month`, color: "#f59e0b", icon: DollarSign },
            { label: "Fully Vested", value: fullyVested.toString(), sub: "team members", color: "#7c3aed", icon: TrendingUp },
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

        {/* Headcount by venture */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Headcount by Venture</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {headcountByVenture.map(v => (
              <div key={v.name} className="rounded-lg p-4 text-center" style={{ background: `${v.color}08`, border: `1px solid ${v.color}25` }}>
                <div className="text-3xl font-bold font-mono mb-1" style={{ color: v.color }}>{v.count}</div>
                <div className="text-xs font-semibold text-gray-600">{v.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Team & Equity Register</h2>
            <div className="flex gap-2 flex-wrap">
              {(["All", ...ventures] as string[]).map(v => (
                <button
                  key={v}
                  onClick={() => setFilterVenture(v)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: filterVenture === v ? "#1d4ed8" : "#f3f4f6",
                    color: filterVenture === v ? "white" : "#6b7280",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map(member => (
              <div
                key={member.id}
                className="bg-white rounded-xl border shadow-sm p-5"
                style={{ borderLeft: `4px solid ${member.ventureColor}`, borderColor: "#e5e7eb", borderLeftColor: member.ventureColor }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Identity */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{member.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">{member.role}</span>
                    </div>
                    <div className="text-xs font-semibold mb-2" style={{ color: member.ventureColor }}>{member.ventureName}</div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Equity & Vesting */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Equity & Vesting</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${vestingColors[member.vestingStatus]}15`, color: vestingColors[member.vestingStatus] }}>
                        {member.vestingStatus}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-2xl font-bold font-mono" style={{ color: member.ventureColor }}>{member.equityPct}%</span>
                      <span className="text-xs text-gray-400 mb-1">equity · {member.vestedPct}% vested</span>
                    </div>
                    <VestingBar member={member} />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Month {member.monthsIn}</span>
                      <span>Cliff: {member.cliffMonths}m</span>
                      <span>Full vest: {member.vestingMonths}m</span>
                    </div>
                  </div>

                  {/* Stipend */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Stipend Support</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stipendColors[member.stipendStatus]}15`, color: stipendColors[member.stipendStatus] }}>
                        {member.stipendStatus}
                      </span>
                    </div>
                    {member.stipendMonthly > 0 ? (
                      <>
                        <div className="flex items-end gap-1 mb-2">
                          <span className="text-2xl font-bold font-mono" style={{ color: "#f59e0b" }}>£{member.stipendMonthly.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 mb-1">/ month</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${((member.stipendTotalMonths - member.stipendMonthsRemaining) / member.stipendTotalMonths) * 100}%`,
                              background: stipendColors[member.stipendStatus],
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400">
                          {member.stipendTotalMonths - member.stipendMonthsRemaining}/{member.stipendTotalMonths} months disbursed
                          {member.stipendMonthsRemaining > 0 && ` · ${member.stipendMonthsRemaining} remaining`}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 mt-2">No stipend — advisory / equity only</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ESOP Model explanation */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>EcoBlend VBS ESOP & Stipend Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "ESOP Structure",
                desc: "Each spin-off allocates 20–30% of equity to an ESOP pool. Founders and key team members earn vested equity over a 4-year schedule with a 12-month cliff, aligning long-term incentives with venture success.",
                color: "#22c55e",
              },
              {
                title: "Stipend Support",
                desc: "Founders receive a monthly stipend of £2,200 for up to 6 months, providing financial stability during the critical early validation phase. The stipend is funded by the VBS and does not dilute equity.",
                color: "#f59e0b",
              },
              {
                title: "VBS Guidance",
                desc: "In addition to financial support, each founder receives dedicated mentorship from the VBS team, access to the EcoRace lab, the EcoBlend VBS Playbook, and introductions to the VBS investor network.",
                color: "#1d4ed8",
              },
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
