/**
 * ECOBLEND OS — MRL COMMAND DASHBOARD
 * Widget Components: KpiCard, SyncRing, LivePulse, RAGDot, CategoryScoreList
 * Spec: BEBUS-MRL-DASH-001 §4 — Atom Components
 *
 * CONSTRAINTS:
 * - All colours via CSS custom properties on .mrl-dashboard-root
 * - Count-up animation uses requestAnimationFrame only
 * - Fonts: Georgia (serif) + Courier New (mono)
 * - No external chart libraries
 */
import { useState, useEffect, useRef } from "react";
import type { CategorySummary } from "@/types/dashboard.types";

// ── Colour helpers (read from CSS vars at runtime) ────────────────
export const C = {
  bg0:    "var(--bg0)",
  bg1:    "var(--bg1)",
  bg2:    "var(--bg2)",
  bg3:    "var(--bg3)",
  border: "var(--border)",
  dim:    "var(--dim)",
  muted:  "var(--muted)",
  mid:    "var(--mid)",
  text:   "var(--text)",
  hi:     "var(--hi)",
  white:  "var(--white)",
  amber:  "var(--amber)",
  amberL: "var(--amberL)",
  amberD: "var(--amberD)",
  teal:   "var(--teal)",
  tealD:  "var(--tealD)",
  red:    "var(--red)",
  redL:   "var(--redL)",
  green:  "var(--green)",
  greenL: "var(--greenL)",
  blue:   "var(--blue)",
  blueL:  "var(--blueL)",
  gold:   "var(--gold)",
  goldL:  "var(--goldL)",
};

// Resolved hex values for SVG (CSS vars don't work in SVG attributes)
export const HEX = {
  bg0:    "#06080A",
  bg1:    "#0B0E12",
  bg2:    "#101419",
  bg3:    "#161B22",
  border: "#1C2330",
  dim:    "#253040",
  muted:  "#3D5060",
  mid:    "#5A7080",
  text:   "#8BA0B0",
  hi:     "#C8DDE8",
  white:  "#EEF4F8",
  amber:  "#D4880A",
  amberL: "#F0A020",
  amberD: "#8A5500",
  teal:   "#00C4A8",
  tealD:  "#006A5C",
  red:    "#CC3340",
  redL:   "#E84455",
  green:  "#28A070",
  greenL: "#3DC48A",
  blue:   "#2878C8",
  blueL:  "#4AA0E8",
  gold:   "#C8A840",
  goldL:  "#E8C860",
};

export const MONO  = "'Courier New', 'Lucida Console', monospace";
export const SERIF = "'Georgia', 'Times New Roman', serif";

export function ragHex(rag: "red" | "amber" | "green"): string {
  return rag === "red" ? HEX.redL : rag === "amber" ? HEX.amberL : HEX.greenL;
}

// ── Count-up animation (requestAnimationFrame only) ───────────────
export function useAnimatedValue(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;
    const from = 0;

    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * ease);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return val;
}

// ── Label atom ────────────────────────────────────────────────────
export const Label = ({ children, color = HEX.muted }: { children: React.ReactNode; color?: string }) => (
  <div style={{ fontSize: 9, letterSpacing: "0.18em", color, fontFamily: MONO, textTransform: "uppercase" }}>
    {children}
  </div>
);

// ── Divider ───────────────────────────────────────────────────────
export const Divider = () => (
  <div style={{ height: 1, background: HEX.border, margin: "16px 0" }} />
);

// ── RAGDot ────────────────────────────────────────────────────────
export const RAGDot = ({ rag, size = 7 }: { rag: "red" | "amber" | "green"; size?: number }) => {
  const col = ragHex(rag);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: col,
      boxShadow: `0 0 ${size * 1.4}px ${col}88`,
      flexShrink: 0,
    }} />
  );
};

// ── LivePulse ─────────────────────────────────────────────────────
export const LivePulse = ({ isLive }: { isLive: boolean }) => {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setOn(v => !v), 1400);
    return () => clearInterval(id);
  }, [isLive]);

  if (!isLive) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: HEX.muted }} />
        <span style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, letterSpacing: "0.15em" }}>OFFLINE</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: on ? HEX.greenL : HEX.tealD,
        transition: "background 0.3s",
        boxShadow: on ? `0 0 8px ${HEX.greenL}` : "none",
      }} />
      <span style={{ fontSize: 9, color: HEX.greenL, fontFamily: MONO, letterSpacing: "0.15em" }}>LIVE</span>
    </div>
  );
};

// ── KpiCard ───────────────────────────────────────────────────────
interface KpiCardProps {
  label:   string;
  value:   number | string;
  unit?:   string;
  sub?:    string;
  color?:  string;
  size?:   "lg" | "sm";
  accent?: string;
  animate?: boolean;
}

export const KpiCard = ({ label, value, unit, sub, color = HEX.amberL, size = "lg", accent, animate = true }: KpiCardProps) => {
  const numericTarget = typeof value === "number" ? value : parseFloat(String(value));
  const animated = useAnimatedValue(isNaN(numericTarget) ? 0 : numericTarget);
  const displayVal = animate && typeof value === "number"
    ? (Number.isInteger(value) ? Math.round(animated).toString() : animated.toFixed(1))
    : String(value);

  return (
    <div style={{
      background: HEX.bg2,
      border: `1px solid ${accent || HEX.border}`,
      borderTop: accent ? `2px solid ${accent}` : `1px solid ${HEX.border}`,
      borderRadius: 6,
      padding: size === "lg" ? "18px 20px" : "12px 16px",
    }}>
      <Label>{label}</Label>
      <div style={{
        fontSize: size === "lg" ? 36 : 26,
        fontWeight: 700,
        color,
        fontFamily: MONO,
        lineHeight: 1.1,
        marginTop: 8,
        letterSpacing: "-0.02em",
      }}>
        {displayVal}
        {unit && <span style={{ fontSize: size === "lg" ? 14 : 11, color: color + "88", marginLeft: 2 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: HEX.muted, fontFamily: MONO, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

// ── SyncRing ──────────────────────────────────────────────────────
interface SyncRingProps {
  eta:   number; // 0–1
  delta: number;
}

export const SyncRing = ({ eta, delta }: SyncRingProps) => {
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(1, eta));
  const offset = CIRC * (1 - pct);
  const ringColor = delta === 0 ? HEX.greenL : delta <= 2 ? HEX.amberL : HEX.redL;
  const animated = useAnimatedValue(pct * 100, 1400);

  return (
    <div style={{
      background: HEX.bg2,
      border: `1px solid ${HEX.border}`,
      borderRadius: 6,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 20,
    }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {/* Track */}
        <circle cx={50} cy={50} r={R} fill="none" stroke={HEX.dim} strokeWidth={8} />
        {/* Progress */}
        <circle
          cx={50} cy={50} r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="mrl-sync-ring"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease" }}
        />
        {/* Centre text */}
        <text x={50} y={46} textAnchor="middle" fill={ringColor} fontSize={18} fontWeight={700} fontFamily={MONO}>
          {Math.round(animated)}%
        </text>
        <text x={50} y={60} textAnchor="middle" fill={HEX.muted} fontSize={8} fontFamily={MONO}>
          SYNC η
        </text>
      </svg>
      <div>
        <Label>Sync Efficiency</Label>
        <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
          TRL/MRL Alignment
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO }}>DELTA Δ</div>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: MONO,
            color: delta === 0 ? HEX.greenL : delta <= 2 ? HEX.amberL : HEX.redL,
            lineHeight: 1.1,
          }}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CategoryScoreList ─────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  process:        HEX.teal,
  supply_chain:   HEX.redL,
  cost:           HEX.amberL,
  quality:        HEX.blueL,
  sustainability: HEX.greenL,
};

const CAT_LABELS: Record<string, string> = {
  process:        "Process Dev & Engineering",
  supply_chain:   "Supply Chain & Integration",
  cost:           "Cost Modelling",
  quality:        "Quality & Compliance",
  sustainability: "Sustainability & LCSA",
};

interface CategoryScoreListProps {
  categories: CategorySummary[];
}

export const CategoryScoreList = ({ categories }: CategoryScoreListProps) => (
  <div style={{
    background: HEX.bg1,
    border: `1px solid ${HEX.border}`,
    borderRadius: 6,
    padding: 20,
  }}>
    <Label color={HEX.amberL}>Category Scores</Label>
    <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4, marginBottom: 16 }}>
      Weighted Contribution Breakdown
    </div>
    {categories.map(cat => {
      const col = CAT_COLORS[cat.key] || HEX.amberL;
      const label = CAT_LABELS[cat.key] || cat.key;
      const barPct = (cat.score_S / 10) * 100;
      return (
        <div key={cat.key} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: HEX.hi, fontFamily: MONO }}>{label}</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO }}>{cat.maturity_label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: MONO }}>{cat.score_S.toFixed(1)}</span>
            </div>
          </div>
          {/* Bar */}
          <div style={{ height: 4, background: HEX.bg0, borderRadius: 2, overflow: "hidden" }}>
            <div
              className="mrl-cat-bar"
              style={{ width: `${barPct}%`, height: "100%", background: col, borderRadius: 2 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>wt {(cat.weight * 100).toFixed(0)}%</span>
            <span style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>contrib {cat.contribution.toFixed(3)}</span>
          </div>
        </div>
      );
    })}
  </div>
);
