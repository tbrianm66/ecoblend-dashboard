// ============================================================
// CO-FOUNDER COMPATIBILITY MATRIX
// Design: Precision Industrial — VOS design system
// Select two founder profiles → radar comparison + verdict
// ============================================================

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import {
  Users, Shuffle, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, Zap, Globe, Clock, Award, Target, ArrowRight,
  Loader2, Download,
} from "lucide-react";
import { toast } from "sonner";

// ── Radar Chart (pure SVG, no external library) ──────────────────────────────
const DIMS = [
  { key: "sector",       label: "Sector Fit",    icon: Target },
  { key: "capability",   label: "Capability",    icon: Zap },
  { key: "availability", label: "Availability",  icon: Clock },
  { key: "experience",   label: "Experience",    icon: Award },
  { key: "network",      label: "Network",       icon: Globe },
  { key: "pvf",          label: "PVF Alignment", icon: TrendingUp },
];

type DimKey = "sector" | "capability" | "availability" | "experience" | "network" | "pvf";
type ScoreMap = Record<DimKey, number>;

function RadarChart({
  scoresA,
  scoresB,
  colorA,
  colorB,
}: {
  scoresA: ScoreMap;
  scoresB: ScoreMap;
  colorA: string;
  colorB: string;
}) {
  const cx = 160;
  const cy = 160;
  const r = 120;
  const n = DIMS.length;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, val: number) => {
    const a = angle(i);
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) };
  };

  const gridLevels = [20, 40, 60, 80, 100];
  const axes = DIMS.map((_, i) => {
    const a = angle(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const polyPoints = (scores: ScoreMap) =>
    DIMS.map((d, i) => pt(i, scores[d.key as DimKey])).map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {gridLevels.map(lvl => (
        <polygon
          key={lvl}
          points={DIMS.map((_, i) => {
            const a = angle(i);
            const d = (lvl / 100) * r;
            return `${cx + d * Math.cos(a)},${cy + d * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {axes.map((ax, i) => (
        <line key={i} x1={cx} y1={cy} x2={ax.x} y2={ax.y} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* Profile B polygon */}
      <polygon
        points={polyPoints(scoresB)}
        fill={`${colorB}25`}
        stroke={colorB}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Profile A polygon */}
      <polygon
        points={polyPoints(scoresA)}
        fill={`${colorA}25`}
        stroke={colorA}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data points A */}
      {DIMS.map((d, i) => {
        const p = pt(i, scoresA[d.key as DimKey]);
        return <circle key={`a-${i}`} cx={p.x} cy={p.y} r="4" fill={colorA} />;
      })}
      {/* Data points B */}
      {DIMS.map((d, i) => {
        const p = pt(i, scoresB[d.key as DimKey]);
        return <circle key={`b-${i}`} cx={p.x} cy={p.y} r="4" fill={colorB} />;
      })}
      {/* Labels */}
      {DIMS.map((d, i) => {
        const a = angle(i);
        const lx = cx + (r + 22) * Math.cos(a);
        const ly = cy + (r + 22) * Math.sin(a);
        return (
          <text
            key={`lbl-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#6b7280"
            fontFamily="'DM Sans', sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Score bar row ─────────────────────────────────────────────────────────────
function ScoreRow({
  label,
  scoreA,
  scoreB,
  colorA,
  colorB,
}: {
  label: string;
  scoreA: number;
  scoreB: number;
  colorA: string;
  colorB: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center">
      {/* Bar A (right-aligned) */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs font-mono text-gray-500">{scoreA}</span>
        <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden flex justify-end">
          <div className="h-full rounded-full" style={{ width: `${scoreA}%`, background: colorA }} />
        </div>
      </div>
      {/* Label */}
      <p className="text-xs text-center text-gray-500 font-medium">{label}</p>
      {/* Bar B (left-aligned) */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${scoreB}%`, background: colorB }} />
        </div>
        <span className="text-xs font-mono text-gray-500">{scoreB}</span>
      </div>
    </div>
  );
}

// ── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ verdict, score }: { verdict: string; score: number }) {
  const cfg = {
    Strong:   { color: "#51AF37", bg: "#f0fdf4", icon: CheckCircle2 },
    Moderate: { color: "#F49C13", bg: "#fffbeb", icon: AlertTriangle },
    Weak:     { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
  }[verdict] ?? { color: "#9ca3af", bg: "#f9fafb", icon: AlertTriangle };
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}30` }}
    >
      <Icon size={22} style={{ color: cfg.color }} />
      <div>
        <p className="text-sm font-bold" style={{ color: cfg.color }}>{verdict} Pairing</p>
        <p className="text-xs text-gray-400">Compatibility score: {score}/100</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CoFounderMatrix() {
  const [, navigate] = useLocation();
  const [profileIdA, setProfileIdA] = useState<number | null>(null);
  const [profileIdB, setProfileIdB] = useState<number | null>(null);

  const profilesQuery = trpc.matching.getAllTalentProfiles.useQuery();
  const profiles = profilesQuery.data ?? [];

  const matrixQuery = trpc.matching.getCoFounderMatrix.useQuery(
    { profileIdA: profileIdA!, profileIdB: profileIdB! },
    { enabled: !!profileIdA && !!profileIdB && profileIdA !== profileIdB }
  );

  const matrix = matrixQuery.data;

  const downloadPdf = trpc.matching.getCoFounderMatrixPdf.useMutation({
    onSuccess: (result) => {
      // Open the HTML report in a new tab (user can print to PDF from there)
      window.open(result.url, "_blank");
      toast.success(`Report ready — ${result.nameA} & ${result.nameB} (${result.verdict} pairing, ${result.pairingScore}/100)`);
    },
    onError: () => toast.error("Failed to generate report"),
  });

  const COLOR_A = "#51AF37";
  const COLOR_B = "#3A97D3";

  const profileAName = useMemo(() => profiles.find((p: { id: number }) => p.id === profileIdA)?.name ?? "", [profiles, profileIdA]);
  const profileBName = useMemo(() => profiles.find((p: { id: number }) => p.id === profileIdB)?.name ?? "", [profiles, profileIdB]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#51AF3715", color: "#51AF37" }}>
                Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Co-Founder Compatibility Matrix
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Select two founder profiles to compare their compatibility across six dimensions and receive a recommended team structure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {profileIdA && profileIdB && profileIdA !== profileIdB && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                style={{ borderColor: "#F49C13", color: "#F49C13" }}
                onClick={() => downloadPdf.mutate({ profileIdA: profileIdA!, profileIdB: profileIdB! })}
                disabled={downloadPdf.isPending}
              >
                {downloadPdf.isPending ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {downloadPdf.isPending ? "Generating…" : "Download Report"}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/matching")}>
              <Shuffle size={13} /> Matching Engine
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/spinoff")}>
              <ArrowRight size={13} /> Spin-Off OS
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* Profile selectors */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-5" style={{ borderLeft: `4px solid ${COLOR_A}`, borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: COLOR_A }}>Founder A</p>
            <Select
              value={profileIdA?.toString() ?? ""}
              onValueChange={v => setProfileIdA(Number(v))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a founder profile…" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p: { id: number; name: string; currentRole?: string | null }) => (
                  <SelectItem key={p.id} value={p.id.toString()} disabled={p.id === profileIdB}>
                    {p.name} {p.currentRole ? `— ${p.currentRole}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderLeft: `4px solid ${COLOR_B}`, borderColor: "#e5e7eb" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: COLOR_B }}>Founder B</p>
            <Select
              value={profileIdB?.toString() ?? ""}
              onValueChange={v => setProfileIdB(Number(v))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a founder profile…" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p: { id: number; name: string; currentRole?: string | null }) => (
                  <SelectItem key={p.id} value={p.id.toString()} disabled={p.id === profileIdA}>
                    {p.name} {p.currentRole ? `— ${p.currentRole}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {matrixQuery.isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            Computing compatibility…
          </div>
        )}

        {/* Empty state */}
        {!matrix && !matrixQuery.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-400">Select two different founder profiles above to generate the compatibility matrix.</p>
          </div>
        )}

        {/* Results */}
        {matrix && (
          <div className="space-y-6">
            {/* Verdict + pairing score */}
            <div className="flex items-center gap-4 flex-wrap">
              <VerdictBadge verdict={matrix.verdict} score={matrix.pairingScore} />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 rounded-full" style={{ background: "#51AF3715", color: "#51AF37" }}>
                  Complementarity: {matrix.complementarity}/100
                </span>
              </div>
            </div>

            {/* Recommended roles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${COLOR_A}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR_A }}>
                  {matrix.profileA.name}
                </p>
                <p className="text-sm font-bold text-gray-900">{matrix.recommendedRoles.a}</p>
                <p className="text-xs text-gray-400 mt-0.5">{matrix.profileA.role}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-mono font-bold" style={{ color: COLOR_A }}>{matrix.profileA.overall}</span>
                  <span className="text-xs text-gray-400">/ 100 overall score</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${COLOR_B}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: COLOR_B }}>
                  {matrix.profileB.name}
                </p>
                <p className="text-sm font-bold text-gray-900">{matrix.recommendedRoles.b}</p>
                <p className="text-xs text-gray-400 mt-0.5">{matrix.profileB.role}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-mono font-bold" style={{ color: COLOR_B }}>{matrix.profileB.overall}</span>
                  <span className="text-xs text-gray-400">/ 100 overall score</span>
                </div>
              </div>
            </div>

            {/* Radar + dimension bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Radar */}
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded inline-block" style={{ background: COLOR_A }} />
                    {matrix.profileA.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded inline-block" style={{ background: COLOR_B }} />
                    {matrix.profileB.name}
                  </span>
                </div>
                <RadarChart
                  scoresA={matrix.profileA.scores as ScoreMap}
                  scoresB={matrix.profileB.scores as ScoreMap}
                  colorA={COLOR_A}
                  colorB={COLOR_B}
                />
              </div>

              {/* Dimension bars */}
              <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
                <div className="grid grid-cols-[1fr_80px_1fr] gap-2 mb-2">
                  <p className="text-xs font-semibold text-right" style={{ color: COLOR_A }}>{matrix.profileA.name}</p>
                  <div />
                  <p className="text-xs font-semibold" style={{ color: COLOR_B }}>{matrix.profileB.name}</p>
                </div>
                {DIMS.map(d => (
                  <ScoreRow
                    key={d.key}
                    label={d.label}
                    scoreA={(matrix.profileA.scores as ScoreMap)[d.key as DimKey]}
                    scoreB={(matrix.profileB.scores as ScoreMap)[d.key as DimKey]}
                    colorA={COLOR_A}
                    colorB={COLOR_B}
                  />
                ))}
              </div>
            </div>

            {/* CTA: launch spin-off with these two founders */}
            {matrix.verdict !== "Weak" && (
              <div className="bg-white rounded-xl border p-5 flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
                <div>
                  <p className="text-sm font-bold text-gray-900">Ready to launch a spin-off with this team?</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {matrix.profileA.name} ({matrix.recommendedRoles.a}) + {matrix.profileB.name} ({matrix.recommendedRoles.b})
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  style={{ background: "#51AF37", color: "white" }}
                  onClick={() => navigate(`/spinoff?founderIds=${matrix.profileA.id},${matrix.profileB.id}`)}
                >
                  <ArrowRight size={13} /> Open Spin-Off OS
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
