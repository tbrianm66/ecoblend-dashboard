// ============================================================
// ECOBLEND HUB-AND-SPOKE RADIAL DIAGRAM
// Design: Precision Industrial — animated SVG with dual VRL/TRL rings
// ============================================================

import { useState, useEffect } from "react";
import { ANALYTICS_DOMAINS, ventures as defaultVentures, Venture } from "@/lib/data";

interface HubSpokeDiagramProps {
  onDomainClick: (domainId: string) => void;
  onVentureClick: (ventureId: string) => void;
  activeDomain: string;
  ventures?: Venture[];
}

const CENTRE = { x: 400, y: 400 };
const INNER_RADIUS = 90;
const SPOKE_RADIUS = 280;
const NODE_RADIUS = 52;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function DualRingGauge({ cx, cy, vrl, trl, color }: { cx: number; cy: number; vrl: number; trl: number; color: string }) {
  const outerR = 28;
  const innerR = 18;
  const circumOuter = 2 * Math.PI * outerR;
  const circumInner = 2 * Math.PI * innerR;
  const vrlPct = (vrl / 4);
  const trlPct = (trl / 9);

  return (
    <g>
      {/* Outer ring track (VRL) */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      {/* Outer ring fill (VRL) */}
      <circle
        cx={cx} cy={cy} r={outerR}
        fill="none"
        stroke="#22c55e"
        strokeWidth="5"
        strokeDasharray={`${circumOuter * vrlPct} ${circumOuter}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease-out" }}
      />
      {/* Inner ring track (TRL) */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      {/* Inner ring fill (TRL) */}
      <circle
        cx={cx} cy={cy} r={innerR}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="4"
        strokeDasharray={`${circumInner * trlPct} ${circumInner}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease-out" }}
      />
    </g>
  );
}

export default function HubSpokeDiagram({ onDomainClick, onVentureClick, activeDomain, ventures: venturesProp }: HubSpokeDiagramProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const ventures = venturesProp ?? defaultVentures;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const totalNodes = ANALYTICS_DOMAINS.length;
  const angleStep = 360 / totalNodes;

  // Venture nodes placed in an outer ring
  const ventureRadius = 170;
  const ventureAngleStep = 360 / Math.max(ventures.length, 1);

  return (
    <div className="relative w-full" style={{ paddingBottom: "100%", maxWidth: 800, margin: "0 auto" }}>
      <svg
        viewBox="0 0 800 800"
        className="absolute inset-0 w-full h-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <defs>
          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.03" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background subtle grid */}
        <circle cx={CENTRE.x} cy={CENTRE.y} r={360} fill="none" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx={CENTRE.x} cy={CENTRE.y} r={260} fill="none" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx={CENTRE.x} cy={CENTRE.y} r={160} fill="none" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 8" />

        {/* Spoke lines to domain nodes */}
        {ANALYTICS_DOMAINS.map((domain, i) => {
          const angle = i * angleStep;
          const nodePos = polarToCartesian(CENTRE.x, CENTRE.y, SPOKE_RADIUS, angle);
          const isActive = activeDomain === domain.id;
          return (
            <line
              key={`spoke-${domain.id}`}
              x1={CENTRE.x} y1={CENTRE.y}
              x2={nodePos.x} y2={nodePos.y}
              stroke={isActive ? "#22c55e" : "#e5e7eb"}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={animated ? "none" : "300"}
              className={animated ? "" : "spoke-line"}
              style={{ animationDelay: `${i * 0.06}s`, transition: "stroke 0.3s, stroke-width 0.3s" }}
            />
          );
        })}

        {/* Venture connector lines */}
        {ventures.map((venture, i) => {
          const angle = i * ventureAngleStep + 45;
          const vPos = polarToCartesian(CENTRE.x, CENTRE.y, ventureRadius, angle);
          return (
            <line
              key={`vline-${venture.id}`}
              x1={CENTRE.x} y1={CENTRE.y}
              x2={vPos.x} y2={vPos.y}
              stroke={venture.color}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="6 4"
            />
          );
        })}

        {/* Domain nodes */}
        {ANALYTICS_DOMAINS.map((domain, i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTRE.x, CENTRE.y, SPOKE_RADIUS, angle);
          const isActive = activeDomain === domain.id;
          const isHovered = hoveredNode === domain.id;
          const scale = isHovered ? 1.1 : 1;

          return (
            <g
              key={domain.id}
              transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px`, transition: "transform 0.2s", cursor: "pointer", opacity: animated ? 1 : 0 }}
              className={animated ? "node-appear" : ""}
              onClick={() => onDomainClick(domain.id)}
              onMouseEnter={() => setHoveredNode(domain.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <circle
                cx={0} cy={0} r={NODE_RADIUS}
                fill={isActive ? "#1c1c1e" : "white"}
                stroke={isActive ? "#22c55e" : "#e5e7eb"}
                strokeWidth={isActive ? 2.5 : 1.5}
                filter={isActive ? "url(#glow)" : undefined}
              />
              {/* Domain label — split into two lines if needed */}
              {domain.label.split(" ").length > 1 ? (
                <>
                  <text x={0} y={-8} textAnchor="middle" fontSize="9" fontWeight="600"
                    fill={isActive ? "#22c55e" : "#374151"} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {domain.label.split(" ").slice(0, Math.ceil(domain.label.split(" ").length / 2)).join(" ")}
                  </text>
                  <text x={0} y={5} textAnchor="middle" fontSize="9" fontWeight="600"
                    fill={isActive ? "#22c55e" : "#374151"} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {domain.label.split(" ").slice(Math.ceil(domain.label.split(" ").length / 2)).join(" ")}
                  </text>
                </>
              ) : (
                <text x={0} y={3} textAnchor="middle" fontSize="9" fontWeight="600"
                  fill={isActive ? "#22c55e" : "#374151"} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {domain.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Venture nodes (inner ring) */}
        {ventures.map((venture, i) => {
          const angle = i * ventureAngleStep + 45;
          const pos = polarToCartesian(CENTRE.x, CENTRE.y, ventureRadius, angle);
          const isHovered = hoveredNode === `v-${venture.id}`;

          return (
            <g
              key={`v-${venture.id}`}
              style={{ cursor: "pointer", opacity: animated ? 1 : 0, transition: "opacity 0.5s" }}
              onClick={() => onVentureClick(venture.id)}
              onMouseEnter={() => setHoveredNode(`v-${venture.id}`)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer circle */}
              <circle
                cx={pos.x} cy={pos.y} r={38}
                fill="white"
                stroke={venture.color}
                strokeWidth={isHovered ? 3 : 2}
                filter={isHovered ? "url(#glow)" : undefined}
              />
              {/* Dual ring gauges */}
              <DualRingGauge cx={pos.x} cy={pos.y} vrl={venture.vrl} trl={venture.trl} color={venture.color} />
              {/* Venture name */}
              <text x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize="10" fontWeight="700"
                fill={venture.color} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {venture.name}
              </text>
              {/* Channel badge */}
              <text x={pos.x} y={pos.y + 52} textAnchor="middle" fontSize="7.5" fontWeight="500"
                fill="#6b7280" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {venture.channel}
              </text>
            </g>
          );
        })}

        {/* Centre hub */}
        <g className="hub-pulse">
          <circle cx={CENTRE.x} cy={CENTRE.y} r={INNER_RADIUS + 10} fill="url(#hubGrad)" />
          <circle cx={CENTRE.x} cy={CENTRE.y} r={INNER_RADIUS} fill="white" stroke="#22c55e" strokeWidth="3" />
          <text x={CENTRE.x} y={CENTRE.y - 18} textAnchor="middle" fontSize="14" fontWeight="700"
            fill="#1c1c1e" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Eco
          </text>
          <text x={CENTRE.x} y={CENTRE.y - 2} textAnchor="middle" fontSize="14" fontWeight="700"
            fill="#22c55e" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Blend
          </text>
          <text x={CENTRE.x} y={CENTRE.y + 16} textAnchor="middle" fontSize="7.5" fontWeight="500"
            fill="#6b7280" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            DISCOVER · ANALYSE · DECIDE
          </text>
        </g>

        {/* Legend */}
        <g transform="translate(20, 760)">
          <circle cx={8} cy={0} r={5} fill="none" stroke="#22c55e" strokeWidth="2.5" />
          <text x={18} y={4} fontSize="9" fill="#6b7280" style={{ fontFamily: "'DM Sans', sans-serif" }}>VRL (Commercial)</text>
          <circle cx={110} cy={0} r={5} fill="none" stroke="#1d4ed8" strokeWidth="2" />
          <text x={120} y={4} fontSize="9" fill="#6b7280" style={{ fontFamily: "'DM Sans', sans-serif" }}>TRL (Technical)</text>
          <rect x={210} y={-6} width={12} height={12} rx={2} fill="none" stroke="#e5e7eb" strokeWidth="1.5" />
          <text x={226} y={4} fontSize="9" fill="#6b7280" style={{ fontFamily: "'DM Sans', sans-serif" }}>Analytics Domain</text>
        </g>
      </svg>
    </div>
  );
}
