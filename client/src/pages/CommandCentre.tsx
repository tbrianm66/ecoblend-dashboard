/**
 * Command Centre Dashboard
 * Real-time portfolio intelligence overview for founders, operators and investors.
 * Aggregates data from: Ventures, POI, Project Management, Financial, ESG modules.
 */
import { useMemo, useState, useEffect } from "react";
import LiveEventFeed from "@/components/LiveEventFeed";
import SpinoutPipelineWidget from "@/components/SpinoutPipelineWidget";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, Package, ClipboardList,
  Leaf, DollarSign, AlertTriangle, CheckCircle2, Clock,
  Target, Zap, Globe, RefreshCw, ArrowRight, BarChart2,
  Users, Beaker, Award,
} from "lucide-react";

// ── Colour palette ────────────────────────────────────────────────────────────
const ECOBLEND_GREEN = "#51AF37";
const ECOBLEND_BLUE  = "#3A97D3";
const ECOBLEND_AMBER = "#F49C13";
const ECOBLEND_RED   = "#E05252";
const ECOBLEND_PURPLE = "#9B59B6";
const STATUS_COLORS: Record<string, string> = {
  Active: ECOBLEND_GREEN, Scaling: ECOBLEND_BLUE,
  "Pre-Launch": ECOBLEND_AMBER, Paused: "#6b7280",
};
const PIE_COLORS = [ECOBLEND_GREEN, ECOBLEND_BLUE, ECOBLEND_AMBER, ECOBLEND_RED, ECOBLEND_PURPLE, "#14b8a6"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, prefix = "") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Inline SVG sparkline — no external dependency */
function Sparkline({
  points, color, width = 80, height = 28,
}: {
  points: number[]; color: string; width?: number; height?: number;
}) {
  if (!points.length) return <div style={{ width, height }} className="bg-muted/30 rounded" />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((v, i) => [
    i * step,
    height - ((v - min) / range) * (height - 4) - 2,
  ] as [number, number]);

  const pathD = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  // Filled area under the line
  const areaD = `${pathD} L${coords[coords.length - 1][0].toFixed(1)},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle
        cx={coords[coords.length - 1][0]}
        cy={coords[coords.length - 1][1]}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

/** Per-venture sparkline card for the financial section */
function VentureSparklineCard({
  name, color, latestRevenue, latestBurn, points, trend, onClick,
}: {
  name: string; color: string; latestRevenue: number; latestBurn: number;
  points: number[]; trend: "up" | "down" | "flat"; onClick?: () => void;
}) {
  const trendIcon = trend === "up"
    ? <TrendingUp size={12} className="text-green-500" />
    : trend === "down"
    ? <TrendingDown size={12} className="text-red-500" />
    : <span className="text-xs text-muted-foreground">—</span>;

  return (
    <Card
      className="relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <span className="text-xs font-semibold text-foreground truncate max-w-[90px]">{name}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>
                {fmt(latestRevenue, "£")}
              </span>
              {trendIcon}
            </div>
            <p className="text-xs text-muted-foreground">Burn: {fmt(latestBurn, "£")}/mo</p>
          </div>
          <Sparkline points={points} color={color} width={72} height={32} />
        </div>
      </CardContent>
    </Card>
  );
}

function KpiTile({
  label, value, sub, icon: Icon, color, trend, onClick,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>{value}</span>
          {trend && (
            <span className="mb-1">
              {trend === "up" ? <TrendingUp size={14} className="text-green-500" /> :
               trend === "down" ? <TrendingDown size={14} className="text-red-500" /> : null}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, color, action, onAction }: {
  title: string; icon: React.ElementType; color: string;
  action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Prompt', sans-serif" }}>{title}</h2>
      </div>
      {action && (
        <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground h-7" onClick={onAction}>
          {action} <ArrowRight size={11} />
        </Button>
      )}
    </div>
  );
}

// ── Ecosystem Map (SVG-based bubble map) ──────────────────────────────────────
function EcosystemMap({ nodes }: { nodes: Array<{
  ventureId: string; name: string; color: string; vrl: number | null;
  trl: number | null; status: string | null; posX: number; posY: number;
  nodeSize: number; linkedVentureIds: string | null;
}> }) {
  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No ventures to display
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: 260 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Draw link lines */}
        {nodes.map(node => {
          if (!node.linkedVentureIds) return null;
          return node.linkedVentureIds.split(",").map(linkedId => {
            const target = nodes.find(n => n.ventureId === linkedId.trim());
            if (!target) return null;
            return (
              <line
                key={`${node.ventureId}-${linkedId}`}
                x1={node.posX} y1={node.posY}
                x2={target.posX} y2={target.posY}
                stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2"
              />
            );
          });
        })}
        {/* Draw nodes */}
        {nodes.map(node => {
          const r = Math.max(3, Math.min(8, (node.nodeSize ?? 40) / 8));
          return (
            <g key={node.ventureId}>
              <circle
                cx={node.posX} cy={node.posY} r={r + 1}
                fill={`${node.color}20`}
              />
              <circle
                cx={node.posX} cy={node.posY} r={r}
                fill={node.color} opacity={0.9}
              />
              <text
                x={node.posX} y={node.posY + r + 3.5}
                textAnchor="middle" fontSize="2.8"
                fill="currentColor" className="text-foreground"
              >
                {node.name.length > 10 ? node.name.slice(0, 9) + "…" : node.name}
              </text>
              {/* VRL badge */}
              <text
                x={node.posX} y={node.posY + 0.8}
                textAnchor="middle" fontSize="2.5"
                fill="white" fontWeight="bold"
              >
                V{node.vrl ?? 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-0 right-0 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: ECOBLEND_GREEN }} /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: ECOBLEND_BLUE }} /> Scaling
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: ECOBLEND_AMBER }} /> Pre-Launch
        </span>
      </div>
    </div>
  );
}

// ── Funnel Bar ────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommandCentre() {
  const [, navigate] = useLocation();
  const REFRESH_INTERVAL = 60_000;
  const { data, isLoading, refetch, dataUpdatedAt } = trpc.commandCentre.getLiveMetrics.useQuery(undefined, {
    refetchInterval: REFRESH_INTERVAL,
  });
  const { data: ecosystemNodes } = trpc.commandCentre.getEcosystemNodes.useQuery(undefined, {
    refetchInterval: REFRESH_INTERVAL,
  });
  const { data: sparklines } = trpc.commandCentre.getRevenueSparklines.useQuery(undefined, {
    refetchInterval: REFRESH_INTERVAL,
  });

  // Countdown timer — counts down from 60 to 0, resets on each refetch
  const [countdown, setCountdown] = useState(60);
  useEffect(() => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1_000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const portfolio = data?.portfolio;
  const vrlDist   = data?.vrlDist;
  const funnel    = data?.funnel;
  const pmHealth  = data?.pmHealth;
  const financial = data?.financial;
  const esg       = data?.esg;
  const learning  = data?.learning;

  // VRL distribution chart data — only stages with ventures
  const vrlChartData = useMemo(() => {
    if (!vrlDist?.distribution) return [];
    return vrlDist.distribution.filter(d => d.count > 0).map(d => ({
      name: `V${d.stage}`,
      label: d.label,
      count: d.count,
    }));
  }, [vrlDist]);

  // Status pie data
  const statusPieData = useMemo(() => {
    if (!portfolio) return [];
    return [
      { name: "Active", value: portfolio.active, color: ECOBLEND_GREEN },
      { name: "Scaling", value: portfolio.scaling, color: ECOBLEND_BLUE },
      { name: "Pre-Launch", value: portfolio.prelaunch, color: ECOBLEND_AMBER },
      { name: "Paused", value: portfolio.paused, color: "#6b7280" },
    ].filter(d => d.value > 0);
  }, [portfolio]);

  // Financial trend chart
  const financialTrend = useMemo(() => {
    if (!financial?.trendMonths) return [];
    return financial.trendMonths.map(m => ({
      month: m.month.slice(2), // "26-01"
      Revenue: m.revenue,
      Burn: m.burn,
    }));
  }, [financial]);

  // ESG radar data
  const esgRadar = useMemo(() => {
    if (!esg?.esgBreakdown?.length) return [];
    const avg = (key: keyof typeof esg.esgBreakdown[0]) =>
      esg.esgBreakdown.reduce((s, e) => s + ((e[key] as number) ?? 0), 0) / esg.esgBreakdown.length;
    return [
      { subject: "Environment", value: avg("environmentScore") },
      { subject: "Social", value: avg("socialScore") },
      { subject: "Governance", value: avg("governanceScore") },
      { subject: "IRL Score", value: esg.avgIrl },
    ];
  }, [esg]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-10 h-10 animate-pulse mx-auto mb-3" style={{ color: ECOBLEND_GREEN }} />
          <p className="text-sm text-muted-foreground">Loading Command Centre…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {/* Animated pulse dot */}
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: ECOBLEND_GREEN }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: ECOBLEND_GREEN }}
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: `${ECOBLEND_GREEN}15`, color: ECOBLEND_GREEN }}>
              Live
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {lastUpdated ? `Updated ${lastUpdated}` : "Auto-refresh every 60s"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Command Centre
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown ring */}
          <div className="flex items-center gap-1.5">
            <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
              <circle cx="14" cy="14" r="11" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                stroke={ECOBLEND_GREEN} strokeWidth="2.5"
                strokeDasharray={`${2 * Math.PI * 11}`}
                strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / 60)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="text-xs font-mono text-muted-foreground w-5 text-right">{countdown}s</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { refetch(); setCountdown(60); }}>
            <RefreshCw size={12} /> Refresh
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-8">

        {/* ── Row 1: Top KPI tiles ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="col-span-2">
            <KpiTile
              label="Total Ventures" value={portfolio?.total ?? 0}
              sub={`${portfolio?.active ?? 0} active · ${portfolio?.investmentReady ?? 0} investment ready`}
              icon={Globe} color={ECOBLEND_GREEN}
              onClick={() => navigate("/")}
            />
          </div>
          <div className="col-span-2">
            <KpiTile
              label="Avg VRL Score" value={portfolio?.avgVrl ?? 0}
              sub={`Avg TRL: ${portfolio?.avgTrl ?? 0}`}
              icon={BarChart2} color={ECOBLEND_BLUE}
              onClick={() => navigate("/vrl")}
            />
          </div>
          <div className="col-span-2">
            <KpiTile
              label="POI Pipeline" value={funnel?.identified ?? 0}
              sub={`${funnel?.approved ?? 0} approved · ${funnel?.conversionRate ?? 0}% conv.`}
              icon={Package} color={ECOBLEND_AMBER}
              onClick={() => navigate("/poi")}
            />
          </div>
          <div className="col-span-2">
            <KpiTile
              label="Active Programs" value={pmHealth?.activePrograms ?? 0}
              sub={`${pmHealth?.overdueTasks ?? 0} overdue tasks · ${pmHealth?.criticalRisks ?? 0} critical risks`}
              icon={ClipboardList} color={ECOBLEND_PURPLE}
              onClick={() => navigate("/project-management")}
            />
          </div>
        </div>

        {/* ── Row 2: Financial — per-venture sparkline cards + ESG KPIs ── */}
        <div className="space-y-3">
          {/* Section label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: ECOBLEND_GREEN }} />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Revenue Sparklines — 6-Month Trend</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/financial")}>
              Financial Analytics →
            </Button>
          </div>
          {/* Per-venture sparkline cards */}
          {sparklines && sparklines.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {sparklines.map(s => (
                <VentureSparklineCard
                  key={s.ventureId}
                  name={s.ventureName}
                  color={s.color}
                  latestRevenue={s.latestRevenue}
                  latestBurn={s.latestBurn}
                  points={s.points.map(p => p.revenue)}
                  trend={s.trend}
                  onClick={() => navigate(`/venture/${s.ventureId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiTile
                label="Portfolio Revenue" value={fmt(financial?.totalRevenue ?? 0, '£')}
                sub={`${financial?.revenueAchievement ?? 0}% of target`}
                icon={DollarSign} color={ECOBLEND_GREEN}
                trend={financial?.revenueAchievement && financial.revenueAchievement >= 80 ? "up" : "down"}
              />
              <KpiTile
                label="Investment Raised" value={fmt(financial?.totalInvestment ?? 0, '£')}
                sub={`Avg runway: ${financial?.avgRunway ?? 0} months`}
                icon={TrendingUp} color={ECOBLEND_BLUE}
              />
              <KpiTile
                label="Avg ESG Score" value={`${esg?.avgEsg ?? 0}/10`}
                sub={`${esg?.activeCerts ?? 0} certifications active`}
                icon={Leaf} color={ECOBLEND_GREEN}
                trend="neutral"
              />
              <KpiTile
                label="Avg IRL Score" value={`${esg?.avgIrl ?? 0}/10`}
                sub={`${esg?.bCorpCerts ?? 0} B Corp · ${esg?.isoCerts ?? 0} ISO`}
                icon={Award} color={ECOBLEND_AMBER}
              />
            </div>
          )}
          {/* Portfolio aggregate row below sparklines */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
              label="Portfolio Revenue" value={fmt(financial?.totalRevenue ?? 0, '£')}
              sub={`${financial?.revenueAchievement ?? 0}% of target`}
              icon={DollarSign} color={ECOBLEND_GREEN}
              trend={financial?.revenueAchievement && financial.revenueAchievement >= 80 ? "up" : "down"}
              onClick={() => navigate("/financial")}
            />
            <KpiTile
              label="Investment Raised" value={fmt(financial?.totalInvestment ?? 0, '£')}
              sub={`Avg runway: ${financial?.avgRunway ?? 0} months`}
              icon={TrendingUp} color={ECOBLEND_BLUE}
              onClick={() => navigate("/financial")}
            />
            <KpiTile
              label="Avg ESG Score" value={`${esg?.avgEsg ?? 0}/10`}
              sub={`${esg?.activeCerts ?? 0} certifications active`}
              icon={Leaf} color={ECOBLEND_GREEN}
              trend="neutral"
            />
            <KpiTile
              label="Avg IRL Score" value={`${esg?.avgIrl ?? 0}/10`}
              sub={`${esg?.bCorpCerts ?? 0} B Corp · ${esg?.isoCerts ?? 0} ISO`}
              icon={Award} color={ECOBLEND_AMBER}
            />
          </div>
        </div>

        {/* ── Row 3: Ecosystem Map + VRL Distribution ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Ecosystem Map */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Venture Ecosystem Map" icon={Globe} color={ECOBLEND_GREEN}
                action="Manage Ventures" onAction={() => navigate("/")}
              />
            </CardHeader>
            <CardContent>
              <EcosystemMap nodes={ecosystemNodes ?? []} />
              {/* Venture status chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {portfolio?.ventures.map(v => (
                  <div
                    key={v.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: `${v.color ?? ECOBLEND_GREEN}15`, color: v.color ?? ECOBLEND_GREEN, border: `1px solid ${v.color ?? ECOBLEND_GREEN}30` }}
                    onClick={() => navigate(`/venture/${v.id}`)}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[v.status ?? "Pre-Launch"] ?? "#6b7280" }} />
                    {v.name}
                    <span className="opacity-60">V{v.vrl}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* VRL Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="VRL Stage Distribution" icon={BarChart2} color={ECOBLEND_BLUE}
                action="VRL Analytics" onAction={() => navigate("/vrl")}
              />
            </CardHeader>
            <CardContent>
              {vrlChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={vrlChartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v, _n, props) => [v, props.payload?.label ?? ""]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {vrlChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
                  No VRL data yet
                </div>
              )}

              {/* Status pie */}
              <div className="mt-4 grid grid-cols-2 gap-4 items-center">
                <div>
                  {statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={100}>
                      <PieChart>
                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={28} outerRadius={44}
                          dataKey="value" paddingAngle={3}>
                          {statusPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">No data</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {statusPieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </span>
                      <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Opportunity Funnel + PM Health ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Opportunity Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Opportunity Pipeline Funnel" icon={Package} color={ECOBLEND_AMBER}
                action="Open POI Module" onAction={() => navigate("/poi")}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <FunnelBar label="Identified" value={funnel?.identified ?? 0} max={funnel?.identified ?? 1} color={ECOBLEND_AMBER} />
              <FunnelBar label="Scored" value={funnel?.scored ?? 0} max={funnel?.identified ?? 1} color={ECOBLEND_BLUE} />
              <FunnelBar label="Approved" value={funnel?.approved ?? 0} max={funnel?.identified ?? 1} color={ECOBLEND_GREEN} />
              <FunnelBar label="Rejected" value={funnel?.rejected ?? 0} max={funnel?.identified ?? 1} color={ECOBLEND_RED} />
              <FunnelBar label="Deferred" value={funnel?.deferred ?? 0} max={funnel?.identified ?? 1} color="#6b7280" />

              <div className="pt-3 border-t grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Avg POS</p>
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_AMBER }}>{funnel?.avgPos ?? 0}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Conversion</p>
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_GREEN }}>{funnel?.conversionRate ?? 0}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Exceptional</p>
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_PURPLE }}>{funnel?.classificationBreakdown?.exceptional ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PM Health */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Project Management Health" icon={ClipboardList} color={ECOBLEND_PURPLE}
                action="Open PM Module" onAction={() => navigate("/project-management")}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Programs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: ECOBLEND_PURPLE }}>{pmHealth?.totalPrograms ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Programs</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: ECOBLEND_GREEN }}>{pmHealth?.activePrograms ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: ECOBLEND_BLUE }}>{pmHealth?.completedPrograms ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Task completion */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Task Completion Rate</span>
                  <span className="font-bold" style={{ color: ECOBLEND_GREEN }}>{pmHealth?.taskCompletionRate ?? 0}%</span>
                </div>
                <Progress value={pmHealth?.taskCompletionRate ?? 0} className="h-2" />
                <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                  <span>{pmHealth?.doneTasks ?? 0} done</span>
                  <span>{pmHealth?.overdueTasks ?? 0} overdue</span>
                  <span>{pmHealth?.totalTasks ?? 0} total</span>
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Budget Utilisation</span>
                  <span className="font-bold" style={{ color: pmHealth?.budgetUtilisation && pmHealth.budgetUtilisation > 90 ? ECOBLEND_RED : ECOBLEND_BLUE }}>
                    {pmHealth?.budgetUtilisation ?? 0}%
                  </span>
                </div>
                <Progress value={pmHealth?.budgetUtilisation ?? 0} className="h-2" />
                <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                  <span>{fmt(pmHealth?.totalSpent ?? 0, "£")} spent</span>
                  <span>{fmt(pmHealth?.totalBudget ?? 0, "£")} budget</span>
                </div>
              </div>

              {/* Risk alerts */}
              <div className="flex gap-3">
                {(pmHealth?.criticalRisks ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: `${ECOBLEND_RED}15`, color: ECOBLEND_RED }}>
                    <AlertTriangle size={12} />
                    {pmHealth?.criticalRisks} Critical Risk{pmHealth?.criticalRisks !== 1 ? "s" : ""}
                  </div>
                )}
                {(pmHealth?.highRisks ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: `${ECOBLEND_AMBER}15`, color: ECOBLEND_AMBER }}>
                    <AlertTriangle size={12} />
                    {pmHealth?.highRisks} High Risk{pmHealth?.highRisks !== 1 ? "s" : ""}
                  </div>
                )}
                {(pmHealth?.criticalRisks ?? 0) === 0 && (pmHealth?.highRisks ?? 0) === 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: `${ECOBLEND_GREEN}15`, color: ECOBLEND_GREEN }}>
                    <CheckCircle2 size={12} />
                    No critical or high risks
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Financial Trend + ESG Radar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Financial Trend */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Financial Performance Trend" icon={DollarSign} color={ECOBLEND_GREEN}
                action="Financial Analytics" onAction={() => navigate("/financial")}
              />
            </CardHeader>
            <CardContent>
              {financialTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={financialTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v, "£")} />
                    <Tooltip
                      formatter={(v: number) => [fmt(v, "£")]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Revenue" stroke={ECOBLEND_GREEN} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Burn" stroke={ECOBLEND_RED} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <DollarSign size={24} className="opacity-30" />
                  <span>No financial snapshots yet</span>
                  <Button variant="outline" size="sm" className="text-xs mt-1" onClick={() => navigate("/financial")}>
                    Add Financial Data
                  </Button>
                </div>
              )}

              {/* Revenue achievement bar */}
              {financial && financial.totalTarget > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Portfolio Revenue vs Target</span>
                    <span className="font-bold" style={{ color: financial.revenueAchievement >= 80 ? ECOBLEND_GREEN : ECOBLEND_AMBER }}>
                      {financial.revenueAchievement}%
                    </span>
                  </div>
                  <Progress value={financial.revenueAchievement} className="h-2" />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>{fmt(financial.totalRevenue, "£")} actual</span>
                    <span>{fmt(financial.totalTarget, "£")} target</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ESG / Impact Panel */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Impact & ESG Overview" icon={Leaf} color={ECOBLEND_GREEN}
                action="Impact Governance" onAction={() => navigate("/impact")}
              />
            </CardHeader>
            <CardContent>
              {esgRadar.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={esgRadar}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Radar name="Portfolio Avg" dataKey="value" stroke={ECOBLEND_GREEN} fill={ECOBLEND_GREEN} fillOpacity={0.25} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <Leaf size={24} className="opacity-30" />
                  <span>No ESG data yet</span>
                  <Button variant="outline" size="sm" className="text-xs mt-1" onClick={() => navigate("/impact")}>
                    Add ESG Data
                  </Button>
                </div>
              )}

              {/* Certification summary */}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_GREEN }}>{esg?.activeCerts ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Active Certs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_BLUE }}>{esg?.bCorpCerts ?? 0}</p>
                  <p className="text-xs text-muted-foreground">B Corp</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: ECOBLEND_AMBER }}>{esg?.isoCerts ?? 0}</p>
                  <p className="text-xs text-muted-foreground">ISO</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 6: Learning Velocity + Venture Readiness Table ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Learning Velocity */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Innovation Learning Velocity" icon={Beaker} color={ECOBLEND_BLUE}
                action="Experiment Log" onAction={() => navigate("/experiments")}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: ECOBLEND_BLUE }}>{learning?.totalExperiments ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Experiments</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: ECOBLEND_GREEN }}>{learning?.portfolioPassRate ?? 0}%</p>
                  <p className="text-xs text-muted-foreground">Portfolio Pass Rate</p>
                </div>
              </div>
              {learning?.byVenture && learning.byVenture.length > 0 ? (
                <div className="space-y-2">
                  {learning.byVenture.map(v => {
                    const venture = portfolio?.ventures.find(pv => pv.id === v.ventureId);
                    return (
                      <div key={v.ventureId} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 truncate">{venture?.name ?? v.ventureId}</span>
                        <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${v.passRate}%`, background: venture?.color ?? ECOBLEND_GREEN }}
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: venture?.color ?? ECOBLEND_GREEN }}>
                          {v.passRate}%
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">{v.total} exp</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-6">
                  No experiments logged yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venture Readiness Table */}
          <Card>
            <CardHeader className="pb-2">
              <SectionHeader
                title="Venture Readiness Snapshot" icon={Target} color={ECOBLEND_AMBER}
                action="Portfolio Overview" onAction={() => navigate("/")}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio?.ventures.length ? portfolio.ventures.map(v => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/venture/${v.id}`)}
                  >
                    <div className="w-2 h-8 rounded-full shrink-0" style={{ background: v.color ?? ECOBLEND_GREEN }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold truncate">{v.name}</span>
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-4 shrink-0"
                          style={{ borderColor: STATUS_COLORS[v.status ?? "Pre-Launch"], color: STATUS_COLORS[v.status ?? "Pre-Launch"] }}
                        >
                          {v.status}
                        </Badge>
                        {v.investmentReady && (
                          <Badge className="text-xs px-1.5 py-0 h-4 shrink-0" style={{ background: `${ECOBLEND_GREEN}20`, color: ECOBLEND_GREEN, border: "none" }}>
                            IR
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-muted-foreground w-8">VRL</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${((v.vrl ?? 1) / 9) * 100}%`, background: ECOBLEND_GREEN }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color: ECOBLEND_GREEN }}>{v.vrl}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-muted-foreground w-8">TRL</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${((v.trl ?? 1) / 9) * 100}%`, background: ECOBLEND_BLUE }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color: ECOBLEND_BLUE }}>{v.trl}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground text-sm py-6">
                    No ventures yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 7: Spin-Out Pipeline ── */}
        <div className="mt-6">
          <SpinoutPipelineWidget />
        </div>
        {/* ── Row 8: Live Event Stream ── */}
        <div className="mt-2">
          <LiveEventFeed
            title="Live Operational Event Stream"
            height="320px"
            maxEvents={40}
          />
        </div>

      </div>
    </div>
  );
}
