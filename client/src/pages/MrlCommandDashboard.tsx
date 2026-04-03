/**
 * ECOBLEND OS — MRL COMMAND DASHBOARD
 * Main page component: Header + Ticker + Nav + 5 View layouts
 * Spec: BEBUS-MRL-DASH-001
 *
 * CONSTRAINTS (from spec §10):
 * - All charts are custom SVG. No external chart libraries.
 * - Fonts: Georgia (serif) and Courier New (mono). No Google Fonts.
 * - All colours via CSS custom properties on .mrl-dashboard-root
 * - Count-up animation uses requestAnimationFrame only.
 * - Hover state on CostCurvePanel is component-local (not Zustand).
 * - WebSocket reconnect capped at 5 attempts.
 * - Ticker animation pauses on hover via CSS animation-play-state.
 * - All SVG charts width="100%".
 * - Zero TypeScript errors.
 */
import { useEffect, useRef, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiCard, SyncRing, CategoryScoreList, LivePulse, HEX, MONO, SERIF, Label, useAnimatedValue } from "@/components/dashboard/widgets";
import { AlignmentChart }    from "@/components/dashboard/panels/AlignmentChart";
import { RiskPanel }         from "@/components/dashboard/panels/RiskPanel";
import { SupplyChainMap }    from "@/components/dashboard/panels/SupplyChainMap";
import { CostCurvePanel }    from "@/components/dashboard/panels/CostCurvePanel";
import { SustainabilityPanel } from "@/components/dashboard/panels/SustainabilityPanel";
import "@/components/dashboard/mrl-dashboard.css";
import type { ViewName } from "@/types/dashboard.types";

// ── Ticker items ──────────────────────────────────────────────────
const DEFAULT_TICKER = [
  "◆ NovaBattery · MRL 4 · AMBER · TRL/MRL Δ=+2",
  "◆ GreenFibre · MRL 3 · GREEN · On track",
  "◆ AquaCell · MRL 5 · GREEN · Gate G3 passed",
  "◆ SolarStack · MRL 2 · RED · Supply chain risk elevated",
  "◆ BioForm · MRL 4 · AMBER · Cost 18% over target",
  "◆ NovaBattery · Yield 84.2% · Target 87% · Process sprint active",
  "◆ UKCA Certification · NovaBattery · 9-month timeline · Pre-submission booked",
  "◆ Honsun Electronics · Single-source risk · Dual-source qualification in progress",
  "◆ MRL Scoring · NovaBattery · Session #14 · Score 54.2 · Confidence ±8.5",
  "◆ TRL/MRL Sync · NovaBattery · η=0.58 · ρ=7.4 · Δ=+2 · AMBER",
];

// ── Nav views ─────────────────────────────────────────────────────
const VIEWS: { id: ViewName; label: string }[] = [
  { id: "overview",       label: "Overview" },
  { id: "risk",           label: "Risk Register" },
  { id: "supply",         label: "Supply Chain" },
  { id: "cost",           label: "Cost Curve" },
  { id: "sustainability", label: "Sustainability" },
];

// ── Header ────────────────────────────────────────────────────────
function DashboardHeader() {
  const { mrlScore, trl, mrl, vrl, delta, eta, isLive, lastUpdated, ventureData } = useDashboardStore();
  const animMrl = useAnimatedValue(mrlScore);

  return (
    <div style={{
      background: HEX.bg1,
      borderBottom: `1px solid ${HEX.border}`,
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap",
    }}>
      {/* Brand + venture */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: HEX.amber, fontFamily: MONO, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            EcoBlend OS · MRL Command
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: HEX.white, fontFamily: SERIF, lineHeight: 1.2 }}>
            {ventureData?.name || "NovaBattery"}
          </div>
          <div style={{ fontSize: 10, color: HEX.muted, fontFamily: MONO, marginTop: 1 }}>
            {ventureData?.sector || "CleanTech · Energy Storage"}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* MRL Score */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: HEX.amberL, fontFamily: MONO, lineHeight: 1 }}>
            {animMrl.toFixed(1)}
          </div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>MRL SCORE</div>
        </div>

        <div style={{ width: 1, height: 36, background: HEX.border }} />

        {/* TRL */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.blueL, fontFamily: MONO, lineHeight: 1 }}>{trl}</div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>TRL</div>
        </div>

        {/* MRL */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.amberL, fontFamily: MONO, lineHeight: 1 }}>{mrl}</div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>MRL</div>
        </div>

        {/* VRL */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.greenL, fontFamily: MONO, lineHeight: 1 }}>{vrl}</div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>VRL</div>
        </div>

        {/* Delta */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: MONO, lineHeight: 1,
            color: delta === 0 ? HEX.greenL : delta <= 2 ? HEX.amberL : HEX.redL,
          }}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>Δ TRL-MRL</div>
        </div>

        {/* Eta */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.teal, fontFamily: MONO, lineHeight: 1 }}>
            {(eta * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>η SYNC</div>
        </div>

        <div style={{ width: 1, height: 36, background: HEX.border }} />

        {/* Live status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <LivePulse isLive={isLive} />
          {lastUpdated && (
            <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────
function Ticker({ items }: { items: string[] }) {
  const displayItems = items.length > 0 ? items : DEFAULT_TICKER;
  // Double the items for seamless loop
  const doubled = [...displayItems, ...displayItems];

  return (
    <div style={{
      background: HEX.bg0,
      borderBottom: `1px solid ${HEX.border}`,
      height: 28,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        fontSize: 9, color: HEX.amber, fontFamily: MONO,
        letterSpacing: "0.15em", padding: "0 12px",
        borderRight: `1px solid ${HEX.border}`,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}>
        LIVE FEED
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div className="mrl-ticker-inner">
          {doubled.map((item, i) => (
            <span key={i} style={{
              fontSize: 9, color: HEX.text, fontFamily: MONO,
              padding: "0 24px",
              borderRight: `1px solid ${HEX.border}22`,
              whiteSpace: "nowrap",
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────
function DashboardNav({ active, onSelect }: { active: ViewName; onSelect: (v: ViewName) => void }) {
  return (
    <div style={{
      background: HEX.bg1,
      borderBottom: `1px solid ${HEX.border}`,
      display: "flex",
      gap: 0,
      padding: "0 24px",
    }}>
      {VIEWS.map(v => {
        const isActive = v.id === active;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive ? `2px solid ${HEX.amberL}` : "2px solid transparent",
              color: isActive ? HEX.amberL : HEX.muted,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "12px 16px",
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

// ── View: Overview ────────────────────────────────────────────────
function OverviewView() {
  const { mrlStatus, riskItems, mrlScore, trl, mrl, vrl, delta, eta } = useDashboardStore();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <KpiCard label="MRL Score"   value={mrlScore}    unit="/100" color={HEX.amberL} accent={HEX.amberL} />
          <KpiCard label="TRL Level"   value={trl}         unit="/9"   color={HEX.blueL}  accent={HEX.blueL}  size="sm" />
          <KpiCard label="VRL Score"   value={vrl}         unit="%"    color={HEX.greenL} accent={HEX.greenL} size="sm" />
          <SyncRing eta={eta} delta={delta} />
        </div>

        {/* Alignment chart */}
        {mrlStatus && <AlignmentChart history={mrlStatus.history} delta={delta} />}
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Category scores */}
        {mrlStatus && <CategoryScoreList categories={mrlStatus.categories} />}

        {/* Top risks preview */}
        <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
          <Label color={HEX.redL}>Top Risks</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4, marginBottom: 12 }}>
            Critical & High Priority
          </div>
          {riskItems.slice(0, 3).map(risk => (
            <div key={risk.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "8px 0", borderBottom: `1px solid ${HEX.border}22`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 3,
                background: risk.rag === "red" ? HEX.redL : risk.rag === "amber" ? HEX.amberL : HEX.greenL,
                boxShadow: `0 0 8px ${risk.rag === "red" ? HEX.redL : HEX.amberL}88`,
              }} />
              <div>
                <div style={{ fontSize: 10, color: HEX.hi, fontFamily: MONO }}>{risk.title}</div>
                <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO, marginTop: 2 }}>
                  {risk.category} · Score {risk.risk_score.toFixed(2)} · {risk.mitigation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── View: Risk ────────────────────────────────────────────────────
function RiskView() {
  const { riskItems } = useDashboardStore();
  return <RiskPanel risks={riskItems} />;
}

// ── View: Supply ──────────────────────────────────────────────────
function SupplyView() {
  const { suppliers, hoveredSupplier, setHoveredSupplier } = useDashboardStore();
  return (
    <SupplyChainMap
      suppliers={suppliers}
      hoveredSupplier={hoveredSupplier}
      onHover={setHoveredSupplier}
    />
  );
}

// ── View: Cost ────────────────────────────────────────────────────
function CostView() {
  const { costCurve } = useDashboardStore();
  return <CostCurvePanel costCurve={costCurve} />;
}

// ── View: Sustainability ──────────────────────────────────────────
function SustainabilityView() {
  const { sustainability } = useDashboardStore();
  if (!sustainability) return null;
  return <SustainabilityPanel data={sustainability} />;
}

// ── Main page ─────────────────────────────────────────────────────
export default function MrlCommandDashboard() {
  const { activeView, setView, tickerItems } = useDashboardStore();

  // Hydrate store with data
  useDashboardData(null);

  const viewMap: Record<ViewName, React.ReactNode> = {
    overview:       <OverviewView />,
    risk:           <RiskView />,
    supply:         <SupplyView />,
    cost:           <CostView />,
    sustainability: <SustainabilityView />,
  };

  return (
    <div className="mrl-dashboard-root" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <DashboardHeader />
      <Ticker items={tickerItems} />
      <DashboardNav active={activeView} onSelect={setView} />

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, background: HEX.bg0, overflowY: "auto" }}>
        {viewMap[activeView]}
      </div>
    </div>
  );
}
