// ============================================================
// ECOBLEND — Financial Analytics Module
// Revenue forecast, burn rate tracker, ESOP dilution modelling,
// and portfolio-level financial health overview.
// ============================================================

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Percent } from "lucide-react";

interface VentureFinancials {
  id: string;
  name: string;
  color: string;
  model: "B2B" | "D2C";
  monthlyBurn: number;
  cashRunway: number; // months
  revenueActual: number;
  revenueTarget: number;
  totalEquity: number;
  esopPool: number; // %
  vestedEquity: number; // %
  licenseRevenue: number;
  investmentRaised: number;
  investmentTarget: number;
}

const VENTURES: VentureFinancials[] = [
  { id: "ecoblend", name: "EcoBlend R&D", color: "#22c55e", model: "B2B", monthlyBurn: 18000, cashRunway: 14, revenueActual: 73000, revenueTarget: 120000, totalEquity: 100, esopPool: 15, vestedEquity: 8, licenseRevenue: 73000, investmentRaised: 280000, investmentTarget: 500000 },
  { id: "bebus", name: "BEBUS", color: "#1d4ed8", model: "B2B", monthlyBurn: 12000, cashRunway: 8, revenueActual: 0, revenueTarget: 80000, totalEquity: 100, esopPool: 25, vestedEquity: 10, licenseRevenue: 0, investmentRaised: 120000, investmentTarget: 400000 },
  { id: "tone", name: "TONE", color: "#7c3aed", model: "D2C", monthlyBurn: 8000, cashRunway: 5, revenueActual: 2500, revenueTarget: 60000, totalEquity: 100, esopPool: 28, vestedEquity: 0, licenseRevenue: 0, investmentRaised: 50000, investmentTarget: 300000 },
  { id: "real", name: "REAL", color: "#f59e0b", model: "D2C", monthlyBurn: 9500, cashRunway: 10, revenueActual: 14200, revenueTarget: 75000, totalEquity: 100, esopPool: 30, vestedEquity: 18, licenseRevenue: 0, investmentRaised: 95000, investmentTarget: 350000 },
];

// 12-month revenue forecast data
const REVENUE_FORECAST = [
  { month: "Jan", EcoBlend: 6000, BEBUS: 0, TONE: 0, REAL: 800 },
  { month: "Feb", EcoBlend: 7200, BEBUS: 0, TONE: 800, REAL: 1400 },
  { month: "Mar", EcoBlend: 8500, BEBUS: 0, TONE: 1700, REAL: 2200 },
  { month: "Apr", EcoBlend: 9000, BEBUS: 2000, TONE: 3500, REAL: 3800 },
  { month: "May", EcoBlend: 10200, BEBUS: 5000, TONE: 5200, REAL: 5500 },
  { month: "Jun", EcoBlend: 11500, BEBUS: 9000, TONE: 7000, REAL: 7200 },
  { month: "Jul", EcoBlend: 13000, BEBUS: 12000, TONE: 9500, REAL: 9000 },
  { month: "Aug", EcoBlend: 14200, BEBUS: 15000, TONE: 11000, REAL: 11500 },
  { month: "Sep", EcoBlend: 15500, BEBUS: 18000, TONE: 13000, REAL: 13000 },
  { month: "Oct", EcoBlend: 17000, BEBUS: 22000, TONE: 15000, REAL: 15000 },
  { month: "Nov", EcoBlend: 18500, BEBUS: 26000, TONE: 17500, REAL: 17000 },
  { month: "Dec", EcoBlend: 20000, BEBUS: 30000, TONE: 20000, REAL: 19000 },
];

// Burn rate monthly data
const BURN_DATA = VENTURES.map(v => ({
  name: v.name,
  "Monthly Burn": v.monthlyBurn,
  "Cash Runway (months)": v.cashRunway,
  color: v.color,
}));

// ESOP dilution data
const ESOP_DATA = VENTURES.map(v => ({
  name: v.name,
  "Founder/Team": 100 - v.esopPool - 20, // rough: 20% investor
  "ESOP Pool": v.esopPool,
  "Investor": 20,
  color: v.color,
}));

function RunwayBadge({ months }: { months: number }) {
  const color = months >= 12 ? "#22c55e" : months >= 6 ? "#f59e0b" : "#ef4444";
  const label = months >= 12 ? "Healthy" : months >= 6 ? "Monitor" : "Critical";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}15`, color }}>
      {label} · {months}m
    </span>
  );
}

export default function FinancialAnalytics() {
  const [selectedVenture, setSelectedVenture] = useState<string>("all");

  const totalBurn = VENTURES.reduce((a, v) => a + v.monthlyBurn, 0);
  const totalRevenue = VENTURES.reduce((a, v) => a + v.revenueActual, 0);
  const totalInvestment = VENTURES.reduce((a, v) => a + v.investmentRaised, 0);
  const avgRunway = Math.round(VENTURES.reduce((a, v) => a + v.cashRunway, 0) / VENTURES.length);

  const forecastKeys = ["EcoBlend", "BEBUS", "TONE", "REAL"];
  const forecastColors = ["#22c55e", "#1d4ed8", "#7c3aed", "#f59e0b"];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-7 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#22c55e15", color: "#22c55e" }}>
            Finance
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400 font-mono">Revenue, Burn Rate & ESOP Dilution</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Financial Analytics
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          Portfolio-level financial health: 12-month revenue forecast, monthly burn rates, cash runway, and ESOP equity dilution modelling across all ventures.
        </p>
      </div>

      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Portfolio Monthly Burn", value: `£${(totalBurn / 1000).toFixed(0)}k`, sub: "combined across all ventures", color: "#ef4444", icon: TrendingDown },
            { label: "Total Revenue (YTD)", value: `£${(totalRevenue / 1000).toFixed(0)}k`, sub: "across all ventures", color: "#22c55e", icon: TrendingUp },
            { label: "Investment Raised", value: `£${(totalInvestment / 1000).toFixed(0)}k`, sub: "total to date", color: "#1d4ed8", icon: DollarSign },
            { label: "Avg Cash Runway", value: `${avgRunway}m`, sub: "across portfolio", color: "#f59e0b", icon: AlertTriangle },
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

        {/* 12-month Revenue Forecast */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>12-Month Revenue Forecast</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={REVENUE_FORECAST}>
              <defs>
                {forecastKeys.map((k, i) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={forecastColors[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={forecastColors[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v / 1000}k`} />
              <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
              <Legend />
              {forecastKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={forecastColors[i]} fill={`url(#grad-${k})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Burn Rate + Runway */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burn bar chart */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Monthly Burn Rate by Venture</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={BURN_DATA} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `£${v / 1000}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => `£${v.toLocaleString()}/month`} />
                <Bar dataKey="Monthly Burn" radius={[0, 4, 4, 0]}>
                  {BURN_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Runway cards */}
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Cash Runway & Investment Progress</h2>
            <div className="space-y-4">
              {VENTURES.map(v => (
                <div key={v.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: v.color }}>{v.name}</span>
                    <RunwayBadge months={v.cashRunway} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Investment: £{(v.investmentRaised / 1000).toFixed(0)}k / £{(v.investmentTarget / 1000).toFixed(0)}k</span>
                    <span>{Math.round((v.investmentRaised / v.investmentTarget) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(v.investmentRaised / v.investmentTarget) * 100}%`, background: v.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ESOP Dilution Modelling */}
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>ESOP Equity Dilution Model</h2>
          <p className="text-xs text-gray-400 mb-4">Indicative equity split per venture: Founder/Team equity, ESOP pool allocation, and investor equity.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ESOP_DATA} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="Founder/Team" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ESOP Pool" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Investor" stackId="a" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { label: "Founder / Team", color: "#22c55e", desc: "Core founding team equity, vesting over 4 years with 12-month cliff." },
              { label: "ESOP Pool", color: "#f59e0b", desc: "20–30% reserved for future employees, advisors, and VBS stipend recipients." },
              { label: "Investor", color: "#1d4ed8", desc: "Indicative 20% investor equity at seed round, subject to negotiation." },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.label}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue vs Target table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
            <h2 className="text-sm font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Revenue vs Target Summary</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Venture", "Model", "Revenue (YTD)", "Annual Target", "Progress", "Burn/Month", "Runway"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENTURES.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: i < VENTURES.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: v.color }}>{v.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{v.model}</span></td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-800">£{v.revenueActual.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">£{v.revenueTarget.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((v.revenueActual / v.revenueTarget) * 100, 100)}%`, background: v.color }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: v.color }}>{Math.round((v.revenueActual / v.revenueTarget) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">£{v.monthlyBurn.toLocaleString()}</td>
                  <td className="px-4 py-3"><RunwayBadge months={v.cashRunway} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
