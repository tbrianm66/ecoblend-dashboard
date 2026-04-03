/**
 * AlignmentChart — TRL vs MRL Alignment Track
 * Custom SVG, no external chart libraries.
 * Spec: BEBUS-MRL-DASH-001 §5 — Panel Components
 */
import { HEX, MONO, SERIF, Label } from "../widgets";
import type { HistoryPoint } from "@/types/dashboard.types";

interface AlignmentChartProps {
  history: HistoryPoint[];
  delta:   number;
}

export function AlignmentChart({ history, delta }: AlignmentChartProps) {
  const W = 560, H = 220;
  const PAD = { l: 56, r: 20, t: 24, b: 40 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const n = history.length;

  const xScale = (i: number) => PAD.l + (i / (n - 1)) * cw;
  const yScale = (v: number) => PAD.t + ch - ((v - 1) / 8) * ch;

  const trlPath = history.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.trl)}`).join(" ");
  const mrlPath = history.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.mrl)}`).join(" ");

  // Gap fill between TRL and MRL
  const topPath = history.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.trl)}`).join(" ");
  const botPath = [...history].reverse().map((d, i) => `${i === 0 ? "M" : "L"}${xScale(n - 1 - i)},${yScale(d.mrl)}`).join(" ");

  const last = history[n - 1];

  return (
    <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Label color={HEX.amber}>TRL / MRL Alignment Track</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
            Technology vs Manufacturing Readiness
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {([["TRL", HEX.blueL], ["MRL", HEX.amberL], ["Gap", HEX.redL + "66"]] as [string, string][]).map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 20, height: 2, background: c, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO }}>{l}</span>
            </div>
          ))}
          <div style={{
            background: HEX.bg3,
            border: `1px solid ${HEX.redL}44`,
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 11,
            color: HEX.redL,
            fontFamily: MONO,
          }}>
            Δ = {delta > 0 ? `+${delta}` : delta}
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={HEX.redL} stopOpacity="0.18" />
            <stop offset="100%" stopColor={HEX.redL} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[1,2,3,4,5,6,7,8,9].map(v => (
          <g key={v}>
            <line x1={PAD.l} y1={yScale(v)} x2={W - PAD.r} y2={yScale(v)} stroke={HEX.border} strokeWidth={0.5} />
            <text x={PAD.l - 8} y={yScale(v) + 4} textAnchor="end" fill={HEX.muted} fontSize={9} fontFamily={MONO}>{v}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {history.map((d, i) => (
          <text key={i} x={xScale(i)} y={H - 8} textAnchor="middle" fill={HEX.muted} fontSize={9} fontFamily={MONO}>
            {d.period}
          </text>
        ))}

        {/* Gap fill */}
        <path d={`${topPath} ${botPath} Z`} fill="url(#gapFill)" />

        {/* TRL line (dashed) */}
        <path d={trlPath} fill="none" stroke={HEX.blueL} strokeWidth={2} strokeDasharray="6,3" strokeLinejoin="round" />

        {/* MRL line (solid) */}
        <path d={mrlPath} fill="none" stroke={HEX.amberL} strokeWidth={2.5} strokeLinejoin="round" />

        {/* TRL dots */}
        {history.map((d, i) => (
          <circle key={`trl-${i}`} cx={xScale(i)} cy={yScale(d.trl)} r={3} fill={HEX.blueL} stroke={HEX.bg1} strokeWidth={1.5} />
        ))}

        {/* MRL dots */}
        {history.map((d, i) => (
          <circle key={`mrl-${i}`} cx={xScale(i)} cy={yScale(d.mrl)} r={3} fill={HEX.amberL} stroke={HEX.bg1} strokeWidth={1.5} />
        ))}

        {/* Current values callout */}
        {last && (
          <g>
            <text x={xScale(n - 1) + 6} y={yScale(last.trl) - 4} fill={HEX.blueL} fontSize={10} fontFamily={MONO} fontWeight={700}>
              TRL {last.trl}
            </text>
            <text x={xScale(n - 1) + 6} y={yScale(last.mrl) + 14} fill={HEX.amberL} fontSize={10} fontFamily={MONO} fontWeight={700}>
              MRL {last.mrl}
            </text>
          </g>
        )}

        {/* Y axis label */}
        <text x={12} y={H / 2} textAnchor="middle" fill={HEX.muted} fontSize={8} fontFamily={MONO}
          transform={`rotate(-90, 12, ${H / 2})`}>LEVEL</text>
      </svg>
    </div>
  );
}
