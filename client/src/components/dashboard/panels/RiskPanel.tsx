/**
 * RiskPanel — Risk Register sorted red-first
 * Custom layout, no external chart libraries.
 * Spec: BEBUS-MRL-DASH-001 §5
 */
import { HEX, MONO, SERIF, Label, RAGDot, ragHex } from "../widgets";
import type { RiskItem } from "@/types/dashboard.types";

interface RiskPanelProps {
  risks: RiskItem[];
}

export function RiskPanel({ risks }: RiskPanelProps) {
  // Sort: red first, then amber, then green; within each group by risk_score desc
  const ragOrder = { red: 0, amber: 1, green: 2 };
  const sorted = [...risks].sort((a, b) => {
    const ragDiff = ragOrder[a.rag] - ragOrder[b.rag];
    if (ragDiff !== 0) return ragDiff;
    return b.risk_score - a.risk_score;
  });

  const redCount   = sorted.filter(r => r.rag === "red").length;
  const amberCount = sorted.filter(r => r.rag === "amber").length;

  return (
    <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Label color={HEX.redL}>Risk Register</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
            Manufacturing Risk — Sorted by Severity
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {redCount > 0 && (
            <div style={{
              background: HEX.redL + "18", border: `1px solid ${HEX.redL}44`,
              borderRadius: 4, padding: "3px 10px",
              fontSize: 11, color: HEX.redL, fontFamily: MONO,
            }}>
              {redCount} RED
            </div>
          )}
          {amberCount > 0 && (
            <div style={{
              background: HEX.amberL + "18", border: `1px solid ${HEX.amberL}44`,
              borderRadius: 4, padding: "3px 10px",
              fontSize: 11, color: HEX.amberL, fontFamily: MONO,
            }}>
              {amberCount} AMBER
            </div>
          )}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr 80px 60px 60px 80px",
        gap: 8,
        padding: "6px 0",
        borderBottom: `1px solid ${HEX.border}`,
        marginBottom: 4,
      }}>
        {["", "RISK", "CATEGORY", "PROB", "IMPACT", "SCORE"].map(h => (
          <div key={h} style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO, letterSpacing: "0.12em" }}>{h}</div>
        ))}
      </div>

      {sorted.map(risk => (
        <div key={risk.id} style={{
          display: "grid",
          gridTemplateColumns: "28px 1fr 80px 60px 60px 80px",
          gap: 8,
          padding: "10px 0",
          borderBottom: `1px solid ${HEX.border}22`,
          alignItems: "start",
        }}>
          {/* RAG dot */}
          <div style={{ paddingTop: 3 }}>
            <RAGDot rag={risk.rag} size={8} />
          </div>

          {/* Title + mitigation */}
          <div>
            <div style={{ fontSize: 11, color: HEX.hi, fontFamily: MONO, lineHeight: 1.3 }}>{risk.title}</div>
            <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginTop: 3 }}>
              ↳ {risk.mitigation}
            </div>
          </div>

          {/* Category */}
          <div style={{ fontSize: 9, color: HEX.text, fontFamily: MONO, paddingTop: 2 }}>{risk.category}</div>

          {/* Probability */}
          <div style={{ fontSize: 11, color: HEX.amberL, fontFamily: MONO, paddingTop: 2 }}>
            {(risk.probability * 100).toFixed(0)}%
          </div>

          {/* Impact */}
          <div style={{ fontSize: 11, color: HEX.blueL, fontFamily: MONO, paddingTop: 2 }}>
            {risk.impact}/10
          </div>

          {/* Risk score */}
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: ragHex(risk.rag),
            fontFamily: MONO,
            paddingTop: 2,
          }}>
            {risk.risk_score.toFixed(2)}
          </div>
        </div>
      ))}

      {/* Risk matrix summary */}
      <div style={{ marginTop: 16, padding: "12px 0", borderTop: `1px solid ${HEX.border}` }}>
        <div style={{ fontSize: 9, color: HEX.muted, fontFamily: MONO, marginBottom: 8 }}>RISK MATRIX SUMMARY</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Critical (≥6.0)", count: sorted.filter(r => r.risk_score >= 6).length, color: HEX.redL },
            { label: "High (3–5.9)",    count: sorted.filter(r => r.risk_score >= 3 && r.risk_score < 6).length, color: HEX.amberL },
            { label: "Low (<3.0)",      count: sorted.filter(r => r.risk_score < 3).length, color: HEX.greenL },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              flex: 1, background: HEX.bg2,
              border: `1px solid ${color}33`,
              borderRadius: 4, padding: "8px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: MONO }}>{count}</div>
              <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
