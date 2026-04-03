/**
 * CostCurvePanel — COGS per Unit on log volume scale
 * Hover state is component-local (NOT in Zustand per spec §10 constraint 5).
 * Custom SVG, no external chart libraries.
 * Spec: BEBUS-MRL-DASH-001 §5
 */
import { useState } from "react";
import { HEX, MONO, SERIF, Label } from "../widgets";
import type { CostPoint } from "@/types/dashboard.types";

const CURRENT_VOLUME = 5000;

interface CostCurvePanelProps {
  costCurve: CostPoint[];
}

export function CostCurvePanel({ costCurve }: CostCurvePanelProps) {
  // Hover state is component-local per spec constraint 5
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 560, H = 200;
  const PAD = { l: 48, r: 30, t: 20, b: 36 };

  const minVol = costCurve[0]?.volume || 500;
  const maxVol = costCurve[costCurve.length - 1]?.volume || 100000;
  const minCogs = 40, maxCogs = 160;

  const xLog = (v: number) => PAD.l + (Math.log10(v) - Math.log10(minVol)) / (Math.log10(maxVol) - Math.log10(minVol)) * (W - PAD.l - PAD.r);
  const yScale = (c: number) => PAD.t + (maxCogs - c) / (maxCogs - minCogs) * (H - PAD.t - PAD.b);

  const cogsPath = costCurve.map((d, i) => `${i === 0 ? "M" : "L"}${xLog(d.volume)},${yScale(d.cogs)}`).join(" ");
  const targetY = yScale(95);
  const currentX = xLog(CURRENT_VOLUME);
  const currentPoint = costCurve.find(d => d.volume === CURRENT_VOLUME);
  const bev = costCurve.find(d => d.cogs <= 95);

  return (
    <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Label color={HEX.gold}>Cost Scaling Curve</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
            COGS per Unit · Log Volume Scale
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            ["Current",    `£${currentPoint?.cogs.toFixed(2) || "—"}`, HEX.amberL],
            ["Target",     "£95.00",                                    HEX.greenL],
            ["Break-even", bev ? `${(bev.volume / 1000).toFixed(0)}k units` : "N/A", HEX.blueL],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: MONO }}>{v}</div>
              <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id="cogsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={HEX.amberL} stopOpacity="0.2" />
            <stop offset="100%" stopColor={HEX.amberL} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[60, 80, 100, 120, 140].map(c => (
          <g key={c}>
            <line x1={PAD.l} y1={yScale(c)} x2={W - PAD.r} y2={yScale(c)} stroke={HEX.border} strokeWidth={0.5} />
            <text x={PAD.l - 6} y={yScale(c) + 4} textAnchor="end" fill={HEX.muted} fontSize={9} fontFamily={MONO}>£{c}</text>
          </g>
        ))}

        {/* Volume labels */}
        {costCurve.filter((_, i) => i % 2 === 0).map(d => (
          <text key={d.volume} x={xLog(d.volume)} y={H - 8} textAnchor="middle" fill={HEX.muted} fontSize={8} fontFamily={MONO}>
            {d.volume >= 1000 ? `${d.volume / 1000}k` : d.volume}
          </text>
        ))}

        {/* Target line */}
        <line x1={PAD.l} y1={targetY} x2={W - PAD.r} y2={targetY} stroke={HEX.greenL} strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
        <text x={W - PAD.r + 3} y={targetY + 4} fill={HEX.greenL} fontSize={8} fontFamily={MONO} opacity={0.7}>TARGET</text>

        {/* Fill under curve */}
        <path d={`${cogsPath} L${xLog(maxVol)},${H - PAD.b} L${PAD.l},${H - PAD.b} Z`} fill="url(#cogsGrad)" />

        {/* COGS curve */}
        <path d={cogsPath} fill="none" stroke={HEX.amberL} strokeWidth={2} strokeLinejoin="round" />

        {/* Current volume marker */}
        <line x1={currentX} y1={PAD.t} x2={currentX} y2={H - PAD.b} stroke={HEX.blueL} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
        <text x={currentX + 3} y={PAD.t + 10} fill={HEX.blueL} fontSize={8} fontFamily={MONO}>NOW</text>

        {/* Break-even marker */}
        {bev && (
          <line x1={xLog(bev.volume)} y1={PAD.t} x2={xLog(bev.volume)} y2={H - PAD.b}
            stroke={HEX.greenL} strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
        )}

        {/* Data points with hover */}
        {costCurve.map((d, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} style={{ cursor: "crosshair" }}>
            <circle
              cx={xLog(d.volume)} cy={yScale(d.cogs)}
              r={hoverIdx === i ? 6 : 3}
              fill={d.cogs <= 95 ? HEX.greenL : HEX.amberL}
              stroke={HEX.bg1} strokeWidth={1.5}
              style={{ transition: "r 0.1s" }}
            />
            {hoverIdx === i && (
              <g>
                <rect x={xLog(d.volume) - 36} y={yScale(d.cogs) - 30} width={72} height={22} rx={3}
                  fill={HEX.bg3} stroke={HEX.border} />
                <text x={xLog(d.volume)} y={yScale(d.cogs) - 15} textAnchor="middle" fill={HEX.amberL} fontSize={9} fontFamily={MONO}>
                  £{d.cogs} / {d.volume >= 1000 ? `${d.volume / 1000}k` : d.volume}u
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Cost breakdown bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginBottom: 6 }}>
          COGS BREAKDOWN @ {(CURRENT_VOLUME / 1000).toFixed(0)}k units
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 2, overflow: "hidden", gap: 1 }}>
          {[
            ["BOM",      "£42.20", 0.501, HEX.amberL],
            ["Labour",   "£18.60", 0.221, HEX.blueL],
            ["Overhead", "£14.80", 0.176, HEX.teal],
            ["Tooling",  "£8.50",  0.101, HEX.gold],
          ].map(([l, , pct, c]) => (
            <div key={l as string} title={`${l}`}
              style={{ width: `${(pct as number) * 100}%`, background: c as string, borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          {[
            ["BOM",      "£42.20", HEX.amberL],
            ["Labour",   "£18.60", HEX.blueL],
            ["Overhead", "£14.80", HEX.teal],
            ["Tooling",  "£8.50",  HEX.gold],
          ].map(([l, v, c]) => (
            <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, background: c as string, borderRadius: 1 }} />
              <span style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>{l} {v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
