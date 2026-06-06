// ============================================================
// SPIN-OUT PIPELINE WIDGET (Sprint 64)
// Command Centre dashboard card showing top offerings by
// readiness score, gate proximity, and launch status.
// ============================================================
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, ArrowRight, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Zap, ExternalLink, Package,
} from "lucide-react";

// ── Colour helpers ────────────────────────────────────────────────────────────
const GATE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  not_ready:      { bg: "#ef444415", text: "#ef4444", label: "Not Ready" },
  approaching:    { bg: "#F6911115", text: "#F69111", label: "Approaching" },
  ready_to_review:{ bg: "#3B85BA15", text: "#3B85BA", label: "Ready to Review" },
  approved:       { bg: "#56A83715", text: "#56A837", label: "Approved" },
  launched:       { bg: "#9B59B615", text: "#9B59B6", label: "Launched" },
};

const DOMAIN_LABELS: Record<string, string> = {
  talentScore:       "Talent",
  supplyChainScore:  "Supply",
  financeScore:      "Finance",
  marketScore:       "Market",
  technologyScore:   "Tech",
  governanceScore:   "Gov",
};

type BlueprintRow = {
  id: number;
  title: string;
  offeringName: string;
  offeringColor: string;
  offeringType: string | null;
  ventureName: string;
  ventureColor: string;
  overallScore: number;
  talentScore: number;
  supplyChainScore: number;
  financeScore: number;
  marketScore: number;
  technologyScore: number;
  governanceScore: number;
  gateStatus: string | null;
  confirmedLinks: number;
  totalLinks: number;
  gateProximity: number;
  hasBlueprint: boolean;
  isLaunched: boolean;
  spinoffConfigId: number | null;
};

// ── Mini domain bar row ───────────────────────────────────────────────────────
function DomainMiniBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

// ── Blueprint card ────────────────────────────────────────────────────────────
function BlueprintCard({
  blueprint,
  onNavigate,
}: {
  blueprint: BlueprintRow;
  onNavigate: (path: string) => void;
}) {
  const gate = GATE_COLORS[blueprint.gateStatus ?? "not_ready"] ?? GATE_COLORS.not_ready;
  const isAboveGate = blueprint.overallScore >= 40;

  const domainScores = [
    { key: "talentScore",      label: "Talent",  score: blueprint.talentScore,      color: "#56A837" },
    { key: "supplyChainScore", label: "Supply",  score: blueprint.supplyChainScore,  color: "#3B85BA" },
    { key: "financeScore",     label: "Finance", score: blueprint.financeScore,      color: "#F69111" },
    { key: "marketScore",      label: "Market",  score: blueprint.marketScore,       color: "#9B59B6" },
    { key: "technologyScore",  label: "Tech",    score: blueprint.technologyScore,   color: "#14b8a6" },
    { key: "governanceScore",  label: "Gov",     score: blueprint.governanceScore,   color: "#6b7280" },
  ];

  return (
    <div
      className="rounded-xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${blueprint.offeringColor}` }}
      onClick={() => onNavigate("/spinout-blueprint")}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-sm font-bold truncate"
              style={{ color: blueprint.offeringColor, fontFamily: "'Prompt', sans-serif" }}
            >
              {blueprint.offeringName}
            </span>
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 h-4 shrink-0"
              style={{ borderColor: blueprint.offeringColor, color: blueprint.offeringColor }}
            >
              {blueprint.offeringType}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 truncate">{blueprint.ventureName} · {blueprint.title}</p>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: gate.bg, color: gate.text }}
          >
            {gate.label}
          </span>
          <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>

      {/* Overall score + gate indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">Overall Readiness</span>
          <div className="flex items-center gap-2">
            {!isAboveGate && (
              <span className="text-xs text-gray-400">
                {blueprint.gateProximity}% to gate
              </span>
            )}
            <span
              className="text-sm font-bold"
              style={{ color: isAboveGate ? "#56A837" : "#F69111" }}
            >
              {blueprint.overallScore}%
            </span>
          </div>
        </div>
        <div className="relative h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${blueprint.overallScore}%`,
              background: isAboveGate
                ? "linear-gradient(90deg, #56A837, #3B85BA)"
                : "linear-gradient(90deg, #F69111, #ef4444)",
            }}
          />
          {/* 40% gate marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: "40%", opacity: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-gray-300">0%</span>
          <span className="text-xs text-gray-400" style={{ marginLeft: "calc(40% - 1rem)" }}>
            ↑ 40% gate
          </span>
          <span className="text-xs text-gray-300">100%</span>
        </div>
      </div>

      {/* Domain mini-bars */}
      <div className="space-y-1 mb-3">
        {domainScores.map(d => (
          <DomainMiniBar key={d.key} label={d.label} score={d.score} color={d.color} />
        ))}
      </div>

      {/* Footer: library links + status */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#f3f4f6" }}>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Package size={10} />
            {blueprint.confirmedLinks}/{blueprint.totalLinks} linked
          </span>
          {blueprint.hasBlueprint && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={10} />
              Blueprint ready
            </span>
          )}
          {blueprint.isLaunched && (
            <span className="flex items-center gap-1" style={{ color: "#9B59B6" }}>
              <Rocket size={10} />
              Launched
            </span>
          )}
        </div>
        {isAboveGate && !blueprint.isLaunched && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 gap-1"
            style={{ borderColor: "#56A837", color: "#56A837" }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("/spinoff");
            }}
          >
            <Rocket size={9} />
            Launch
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function SpinoutPipelineWidget() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.spinoutBlueprint.getPipelineSummary.useQuery({ limit: 5 });

  const blueprints = data?.blueprints ?? [];
  const summary = data?.summary ?? { total: 0, readyToReview: 0, approaching: 0, launched: 0, avgScore: 0 };

  return (
    <Card className="border shadow-sm" style={{ borderColor: "#e5e7eb" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #56A83720, #3B85BA20)" }}
            >
              <Rocket size={16} style={{ color: "#56A837" }} />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Spin-Out Pipeline
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Offerings approaching the 40% launch gate</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => navigate("/spinout-blueprint")}
          >
            <ExternalLink size={11} />
            View All
          </Button>
        </div>

        {/* Summary KPI row */}
        {!isLoading && summary.total > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-400">Blueprints</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#3B85BA" }}>{summary.readyToReview}</p>
              <p className="text-xs text-gray-400">Ready</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#F69111" }}>{summary.approaching}</p>
              <p className="text-xs text-gray-400">Approaching</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: "#9B59B6" }}>{summary.launched}</p>
              <p className="text-xs text-gray-400">Launched</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : blueprints.length === 0 ? (
          <div className="text-center py-10">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "#56A83710" }}
            >
              <Rocket size={22} style={{ color: "#56A837" }} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No Blueprints Yet</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
              Create a Spin-Out Blueprint for an offering to track its readiness toward the 40% launch gate.
            </p>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              style={{ background: "#1a2332", color: "white" }}
              onClick={() => navigate("/spinout-blueprint")}
            >
              <Rocket size={12} />
              Create Blueprint
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {blueprints.map(bp => (
              <BlueprintCard
                key={bp.id}
                blueprint={bp as BlueprintRow}
                onNavigate={navigate}
              />
            ))}
            {summary.total > 5 && (
              <button
                className="w-full text-xs text-center text-gray-400 hover:text-gray-600 py-2 transition-colors"
                onClick={() => navigate("/spinout-blueprint")}
              >
                +{summary.total - 5} more blueprints →
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
