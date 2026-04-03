/**
 * SupplyChainMap — Supplier network with country nodes
 * Custom SVG layout, no external chart libraries.
 * Spec: BEBUS-MRL-DASH-001 §5
 */
import { useState } from "react";
import { HEX, MONO, SERIF, Label, RAGDot, ragHex } from "../widgets";
import type { SupplierSummary } from "@/types/dashboard.types";

// Country positions on a simplified world map SVG (viewBox 0 0 800 400)
const COUNTRY_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  CN: { x: 620, y: 175, label: "China" },
  GB: { x: 370, y: 120, label: "UK" },
  KR: { x: 660, y: 165, label: "Korea" },
  DE: { x: 400, y: 115, label: "Germany" },
  US: { x: 160, y: 165, label: "USA" },
  JP: { x: 680, y: 170, label: "Japan" },
};

function fmtGBP(n: number): string {
  if (n >= 1e6) return `£${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `£${(n / 1e3).toFixed(0)}k`;
  return `£${n}`;
}

interface SupplyChainMapProps {
  suppliers:        SupplierSummary[];
  hoveredSupplier:  string | null;
  onHover:          (id: string | null) => void;
}

export function SupplyChainMap({ suppliers, hoveredSupplier, onHover }: SupplyChainMapProps) {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // Group suppliers by country
  const byCountry = suppliers.reduce<Record<string, SupplierSummary[]>>((acc, s) => {
    if (!acc[s.country]) acc[s.country] = [];
    acc[s.country].push(s);
    return acc;
  }, {});

  // Determine country RAG (worst of its suppliers)
  const countryRag = (country: string): "red" | "amber" | "green" => {
    const sups = byCountry[country] || [];
    if (sups.some(s => s.risk === "red"))   return "red";
    if (sups.some(s => s.risk === "amber")) return "amber";
    return "green";
  };

  const totalSpend = suppliers.reduce((s, sup) => s + sup.spend, 0);
  const countries = Object.keys(byCountry);

  return (
    <div style={{ background: HEX.bg1, border: `1px solid ${HEX.border}`, borderRadius: 6, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Label color={HEX.blueL}>Supply Chain Map</Label>
          <div style={{ fontSize: 13, color: HEX.hi, fontFamily: SERIF, marginTop: 4 }}>
            Tier 1–3 Supplier Network · {suppliers.length} Suppliers
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: HEX.amberL, fontFamily: MONO }}>{fmtGBP(totalSpend)}</div>
          <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>TOTAL SPEND</div>
        </div>
      </div>

      {/* Simplified world map with country nodes */}
      <svg width="100%" viewBox="0 0 800 260" style={{ display: "block", background: HEX.bg0, borderRadius: 4, marginBottom: 16 }}>
        {/* Ocean background */}
        <rect width={800} height={260} fill={HEX.bg0} />

        {/* Simplified continent outlines (decorative) */}
        <path d="M 340 80 Q 380 70 420 80 Q 440 100 430 130 Q 410 150 380 145 Q 350 140 340 120 Z"
          fill={HEX.dim} opacity={0.3} />
        <path d="M 580 120 Q 680 110 720 130 Q 740 160 720 190 Q 680 210 640 200 Q 590 185 575 160 Z"
          fill={HEX.dim} opacity={0.3} />
        <path d="M 100 120 Q 200 100 240 130 Q 260 160 240 200 Q 200 220 150 210 Q 100 195 90 165 Z"
          fill={HEX.dim} opacity={0.3} />
        <path d="M 340 170 Q 380 165 400 185 Q 405 210 385 230 Q 360 240 340 225 Q 325 205 330 185 Z"
          fill={HEX.dim} opacity={0.25} />

        {/* Connection lines from GB (hub) to each country */}
        {countries.filter(c => c !== "GB" && COUNTRY_POSITIONS[c]).map(country => {
          const from = COUNTRY_POSITIONS["GB"];
          const to   = COUNTRY_POSITIONS[country];
          if (!from || !to) return null;
          const rag = countryRag(country);
          return (
            <line key={country}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={ragHex(rag)} strokeWidth={1} strokeDasharray="4,4" opacity={0.4}
            />
          );
        })}

        {/* Country nodes */}
        {countries.filter(c => COUNTRY_POSITIONS[c]).map(country => {
          const pos = COUNTRY_POSITIONS[country];
          const rag = countryRag(country);
          const col = ragHex(rag);
          const sups = byCountry[country];
          const isActive = activeCountry === country;
          const r = 14 + sups.length * 2;

          return (
            <g key={country}
              onMouseEnter={() => setActiveCountry(country)}
              onMouseLeave={() => setActiveCountry(null)}
              style={{ cursor: "pointer" }}>
              {/* Glow ring */}
              <circle cx={pos.x} cy={pos.y} r={r + 4} fill="none" stroke={col} strokeWidth={1} opacity={isActive ? 0.5 : 0.15} />
              {/* Node */}
              <circle cx={pos.x} cy={pos.y} r={r} fill={HEX.bg2} stroke={col} strokeWidth={isActive ? 2 : 1} />
              {/* Country code */}
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={col} fontSize={10} fontFamily={MONO} fontWeight={700}>{country}</text>
              {/* Supplier count badge */}
              <circle cx={pos.x + r - 2} cy={pos.y - r + 2} r={7} fill={col} />
              <text x={pos.x + r - 2} y={pos.y - r + 6} textAnchor="middle" fill={HEX.bg0} fontSize={8} fontFamily={MONO} fontWeight={700}>{sups.length}</text>

              {/* Tooltip on hover */}
              {isActive && (
                <g>
                  <rect x={pos.x - 60} y={pos.y - r - 50} width={120} height={44} rx={4} fill={HEX.bg3} stroke={HEX.border} />
                  <text x={pos.x} y={pos.y - r - 34} textAnchor="middle" fill={HEX.hi} fontSize={10} fontFamily={MONO} fontWeight={700}>
                    {COUNTRY_POSITIONS[country]?.label || country}
                  </text>
                  <text x={pos.x} y={pos.y - r - 20} textAnchor="middle" fill={HEX.muted} fontSize={8} fontFamily={MONO}>
                    {sups.length} supplier{sups.length > 1 ? "s" : ""} · {fmtGBP(sups.reduce((s, sup) => s + sup.spend, 0))}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Supplier table */}
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "24px 1fr 60px 80px 60px 70px 60px",
          gap: 8,
          padding: "4px 0",
          borderBottom: `1px solid ${HEX.border}`,
          marginBottom: 4,
        }}>
          {["", "SUPPLIER", "TIER", "COMPONENT", "AUDIT", "SPEND", "LEAD"].map(h => (
            <div key={h} style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>{h}</div>
          ))}
        </div>
        {suppliers.map(sup => (
          <div key={sup.id}
            onMouseEnter={() => onHover(sup.id)}
            onMouseLeave={() => onHover(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr 60px 80px 60px 70px 60px",
              gap: 8,
              padding: "8px 0",
              borderBottom: `1px solid ${HEX.border}22`,
              alignItems: "center",
              background: hoveredSupplier === sup.id ? HEX.bg2 : "transparent",
              cursor: "default",
              transition: "background 0.15s",
            }}>
            <RAGDot rag={sup.risk} size={7} />
            <div>
              <div style={{ fontSize: 10, color: HEX.hi, fontFamily: MONO }}>{sup.name}</div>
              <div style={{ fontSize: 8, color: HEX.muted, fontFamily: MONO }}>{sup.city}, {sup.country}</div>
            </div>
            <div style={{ fontSize: 9, color: HEX.text, fontFamily: MONO }}>T{sup.tier}</div>
            <div style={{ fontSize: 9, color: HEX.text, fontFamily: MONO }}>{sup.component}</div>
            <div style={{
              fontSize: 9, fontFamily: MONO,
              color: sup.audit === "passed" ? HEX.greenL : sup.audit === "pending" ? HEX.amberL : HEX.redL,
            }}>
              {sup.audit}
            </div>
            <div style={{ fontSize: 9, color: HEX.amberL, fontFamily: MONO }}>{fmtGBP(sup.spend)}</div>
            <div style={{ fontSize: 9, color: HEX.blueL, fontFamily: MONO }}>{sup.lead}w</div>
          </div>
        ))}
      </div>
    </div>
  );
}
