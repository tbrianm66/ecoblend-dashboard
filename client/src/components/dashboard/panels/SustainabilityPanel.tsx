/**
 * SustainabilityPanel — LCSA · Carbon · Social · Circularity
 * Custom layout, no external chart libraries.
 * Spec: BEBUS-MRL-DASH-001 §5
 */
import { HEX, MONO, SERIF, Label } from "../widgets";
import type { SustainabilityData } from "@/types/dashboard.types";

interface SustainabilityPanelProps {
  data: SustainabilityData;
}

export function SustainabilityPanel({ data: S }: SustainabilityPanelProps) {
  const carbonOverTarget = S.carbonIntensity > S.carbonTarget;
  const scope3pct = S.scope3 / S.carbonIntensity;

  const lcaLabels: Record<string, string> = {
    cradle_to_gate:  "Cradle-to-Gate",
    cradle_to_grave: "Cradle-to-Grave",
    gate_to_gate:    "Gate-to-Gate",
  };

  return (
    <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Label color={HEX.greenL}>Sustainability Impact Panel</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
            LCSA · Carbon · Social · Circularity
          </div>
        </div>
        <div style={{
          background: HEX.bg3,
          border: `1px solid ${HEX.gold}33`,
          borderRadius: 4, padding: "4px 12px", textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: HEX.goldL, fontFamily: MONO }}>ESG {S.esgGrade}</div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>GRADE</div>
        </div>
      </div>

      {/* Three metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>

        {/* Carbon intensity */}
        <div style={{
          background: HEX.bg2,
          border: `1px solid ${carbonOverTarget ? HEX.redL + "33" : HEX.greenL + "33"}`,
          borderRadius: 5, padding: 14,
        }}>
          <Label color={carbonOverTarget ? HEX.redL : HEX.greenL}>Carbon Intensity</Label>
          <div style={{ fontSize: 22, fontWeight: 700, color: carbonOverTarget ? HEX.redL : HEX.greenL, fontFamily: MONO, marginTop: 6, lineHeight: 1 }}>
            {S.carbonIntensity}
            <span style={{ fontSize: 10, color: (carbonOverTarget ? HEX.redL : HEX.greenL) + "88" }}> kgCO₂e</span>
          </div>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 2 }}>
            Target: {S.carbonTarget} kgCO₂e/unit
          </div>
          <div style={{ marginTop: 8, height: 4, background: HEX.bg0, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min((S.carbonTarget / S.carbonIntensity) * 100, 100)}%`,
              height: "100%", background: HEX.greenL, borderRadius: 2,
            }} />
          </div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO, marginTop: 4 }}>
            {((S.carbonIntensity - S.carbonTarget) / S.carbonTarget * 100).toFixed(0)}% above target
          </div>
        </div>

        {/* Social risk */}
        <div style={{ background: HEX.bg2, border: `1px solid ${HEX.blueL}33`, borderRadius: 5, padding: 14 }}>
          <Label color={HEX.blueL}>Social Risk Index</Label>
          <div style={{
            fontSize: 22, fontWeight: 700, fontFamily: MONO, marginTop: 6, lineHeight: 1,
            color: S.socialRisk > 60 ? HEX.redL : S.socialRisk > 40 ? HEX.amberL : HEX.greenL,
          }}>
            {S.socialRisk}<span style={{ fontSize: 10, color: HEX.muted }}> /100</span>
          </div>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 2 }}>SA8000 aligned · Lower = better</div>
          <div style={{ marginTop: 8 }}>
            {[["Labour rights", "Low", HEX.greenL], ["Supply chain", "Med", HEX.amberL], ["Community", "Low", HEX.greenL]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 8, padding: "2px 0", borderBottom: `1px solid ${HEX.border}` }}>
                <span style={{ color: HEX.muted, fontFamily: MONO }}>{l}</span>
                <span style={{ color: c, fontFamily: MONO }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Circularity */}
        <div style={{ background: HEX.bg2, border: `1px solid ${HEX.teal}33`, borderRadius: 5, padding: 14 }}>
          <Label color={HEX.teal}>Circularity Score</Label>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.teal, fontFamily: MONO, marginTop: 6, lineHeight: 1 }}>
            {S.circularity}<span style={{ fontSize: 10, color: HEX.teal + "88" }}>/100</span>
          </div>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 2 }}>Design for disassembly: partial</div>
          <div style={{ marginTop: 8, height: 6, background: HEX.bg0, borderRadius: 3, overflow: "hidden" }}>
            <div className="mrl-circularity-bar" style={{
              width: `${S.circularity}%`, height: "100%",
              background: `linear-gradient(90deg,${HEX.tealD},${HEX.teal})`, borderRadius: 3,
            }} />
          </div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO, marginTop: 4 }}>Target: 75/100 by MRL 7</div>
        </div>
      </div>

      {/* Carbon scope breakdown bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginBottom: 8 }}>
          CARBON SCOPE BREAKDOWN (kgCO₂e/unit)
        </div>
        <div style={{ display: "flex", gap: 3, height: 24, borderRadius: 3, overflow: "hidden" }}>
          {[
            [S.scope1, "Scope 1", HEX.redL],
            [S.scope2, "Scope 2", HEX.amberL],
            [S.scope3, "Scope 3", HEX.muted],
          ].map(([v, l, c]) => (
            <div key={l as string} style={{
              width: `${((v as number) / S.carbonIntensity) * 100}%`,
              background: c as string,
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 28,
            }}>
              <span style={{ fontSize: 8, color: HEX.bg0, fontFamily: MONO, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
          {[
            [S.scope1, "Scope 1", HEX.redL],
            [S.scope2, "Scope 2", HEX.amberL],
            [S.scope3, "Scope 3", HEX.muted],
          ].map(([v, l, c]) => (
            <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />
              <span style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>{l}: {v} kgCO₂e</span>
            </div>
          ))}
        </div>
      </div>

      {/* LCA status + water */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: HEX.bg2, border: `1px solid ${HEX.border}`, borderRadius: 4, padding: 12 }}>
          <Label>LCA Scope</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: MONO, marginTop: 6 }}>
            {lcaLabels[S.lcaStatus] || S.lcaStatus}
          </div>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 4 }}>
            Full cradle-to-grave pending MRL 6
          </div>
        </div>
        <div style={{ background: HEX.bg2, border: `1px solid ${HEX.border}`, borderRadius: 4, padding: 12 }}>
          <Label>Water Intensity</Label>
          <div style={{ fontSize: 22, fontWeight: 700, color: HEX.blueL, fontFamily: MONO, marginTop: 6, lineHeight: 1 }}>
            {S.waterIntensity}
            <span style={{ fontSize: 10, color: HEX.blueL + "88" }}> L/unit</span>
          </div>
          <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 4 }}>
            Target: &lt;2.0 L/unit by MRL 7
          </div>
        </div>
      </div>
    </div>
  );
}
