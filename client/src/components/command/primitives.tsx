// ============================================================================
// COMMAND CENTRE — Reusable Lean OS UI building blocks
// Builds on the Discovery & Market primitives; adds decision / stage-gate /
// experiment / alert components specific to the Command Centre.
// ============================================================================
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { humanise, STAGE_LABELS, type Tone, type Band } from "@shared/commandCentre";

export {
  ModuleHeader, VentureSelector, ScoreCard, EmptyState, NoVentureState,
  FormModal, ScoreSelect, Section, ToneBadge, DecisionWarning, HypothesisSelector,
} from "@/components/discovery/primitives";

const FONT_HEAD = "'Prompt', sans-serif";

export const TONE: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: "#15803d", bg: "rgba(86,168,55,0.10)", border: "rgba(86,168,55,0.35)" },
  amber: { fg: "#b45309", bg: "rgba(246,145,17,0.10)", border: "rgba(246,145,17,0.35)" },
  red: { fg: "#b91c1c", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)" },
  blue: { fg: "#1d4ed8", bg: "rgba(59,133,186,0.10)", border: "rgba(59,133,186,0.35)" },
  grey: { fg: "#4b5563", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.30)" },
};

// ─── Generic pill ─────────────────────────────────────────────────────────────
export function Pill({ label, tone }: { label: string; tone: Tone }) {
  const t = TONE[tone];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap capitalize"
      style={{ color: t.fg, background: t.bg, border: `1px solid ${t.border}` }}>
      {label}
    </span>
  );
}

// ─── Domain badges ────────────────────────────────────────────────────────────
export function StageBadge({ stage }: { stage?: string | null }) {
  if (!stage) return <Pill label="No stage" tone="grey" />;
  return <Pill label={STAGE_LABELS[stage] ?? humanise(stage)} tone="blue" />;
}

const VENTURE_STATUS_TONE: Record<string, Tone> = {
  idea: "grey", validating: "blue", building: "blue", piloting: "amber",
  scaling: "green", paused: "amber", pivoting: "red", killed: "red", archived: "grey",
};
export function VentureStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Pill label="—" tone="grey" />;
  return <Pill label={humanise(status)} tone={VENTURE_STATUS_TONE[status] ?? "grey"} />;
}

const HYPOTHESIS_TONE: Record<string, Tone> = {
  untested: "grey", testing: "blue", validated: "green",
  invalidated: "red", pivot_required: "red", paused: "amber",
};
export function HypothesisStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Pill label="—" tone="grey" />;
  return <Pill label={humanise(status)} tone={HYPOTHESIS_TONE[status] ?? "grey"} />;
}

const EXPERIMENT_TONE: Record<string, Tone> = {
  proposed: "grey", approved: "blue", running: "blue", completed: "green",
  blocked: "amber", overdue: "red", cancelled: "grey",
};
export function ExperimentStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Pill label="—" tone="grey" />;
  return <Pill label={humanise(status)} tone={EXPERIMENT_TONE[status] ?? "grey"} />;
}

const DECISION_TONE: Record<string, Tone> = {
  advance_stage: "green", persevere: "blue", run_more_experiments: "amber",
  request_more_evidence: "amber", pivot: "red", pause: "amber", kill: "red",
};
export function DecisionBadge({ decision, label }: { decision?: string | null; label?: string }) {
  if (!decision) return <Pill label="—" tone="grey" />;
  return <Pill label={label ?? humanise(decision)} tone={DECISION_TONE[decision] ?? "grey"} />;
}

export function RiskBadge({ score }: { score: number }) {
  const tone: Tone = score >= 75 ? "red" : score >= 50 ? "amber" : score >= 25 ? "blue" : "green";
  const label = score >= 75 ? "Critical" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
  return <Pill label={`${label} (${score})`} tone={tone} />;
}

const SEVERITY_TONE: Record<string, Tone> = { critical: "red", high: "amber", medium: "blue", low: "grey" };
export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return <Pill label="—" tone="grey" />;
  return <Pill label={humanise(severity)} tone={SEVERITY_TONE[severity] ?? "grey"} />;
}

const ALERT_STATUS_TONE: Record<string, Tone> = {
  open: "red", acknowledged: "amber", in_progress: "blue", resolved: "green", dismissed: "grey",
};
export function AlertStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Pill label="—" tone="grey" />;
  return <Pill label={humanise(status)} tone={ALERT_STATUS_TONE[status] ?? "grey"} />;
}

// ─── Stat tile (compact metric) ───────────────────────────────────────────────
export function StatTile({ label, value, tone = "grey", icon, hint }: { label: string; value: ReactNode; tone?: Tone; icon?: ReactNode; hint?: string }) {
  const t = TONE[tone];
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
          {icon && <span style={{ color: t.fg }}>{icon}</span>}
        </div>
        <div className="text-3xl font-bold" style={{ color: t.fg }}>{value}</div>
        {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Score bar (inline, labelled) ─────────────────────────────────────────────
export function ScoreBar({ label, score, tone = "blue" }: { label: string; score: number; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-gray-700">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: t.fg }} />
      </div>
    </div>
  );
}

export function toneForHealth(score: number): Tone {
  return score >= 80 ? "green" : score >= 60 ? "blue" : score >= 40 ? "amber" : "red";
}
export function toneForRisk(score: number): Tone {
  return score >= 75 ? "red" : score >= 50 ? "amber" : score >= 25 ? "blue" : "green";
}

// ─── Next Best Action panel ───────────────────────────────────────────────────
export function NextBestActionPanel({ action, title = "Next Best Action" }: { action: string; title?: string }) {
  return (
    <Card className="border shadow-sm" style={{ background: "rgba(59,133,186,0.04)", borderColor: "rgba(59,133,186,0.25)" }}>
      <CardContent className="p-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#1d4ed8" }}>{title}</div>
        <p className="text-sm text-gray-700 leading-relaxed">{action}</p>
      </CardContent>
    </Card>
  );
}

// ─── Lean Decision card ───────────────────────────────────────────────────────
export function LeanDecisionCard({ label, tone, rationale, action }: { label: string; tone: Tone; rationale: string; action?: string }) {
  const t = TONE[tone];
  return (
    <Card className="border shadow-sm" style={{ borderColor: t.border }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.fg }} />
          <span className="text-sm font-bold" style={{ color: t.fg }}>{label}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{rationale}</p>
        {action && <p className="text-xs text-gray-500 mt-2"><span className="font-semibold">Next:</span> {action}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Stage-Gate checklist ─────────────────────────────────────────────────────
export interface ChecklistItem { label: string; complete: boolean; requiredAction: string; }
export function StageGateChecklist({ items }: { items: ChecklistItem[] }) {
  if (!items.length) return <p className="text-sm text-gray-400">No further gates — final stage.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: it.complete ? "rgba(86,168,55,0.15)" : "rgba(239,68,68,0.12)", color: it.complete ? "#15803d" : "#b91c1c" }}>
            {it.complete ? "✓" : "!"}
          </span>
          <div>
            <span className={it.complete ? "text-gray-700" : "text-gray-700 font-medium"}>{it.label}</span>
            {!it.complete && <div className="text-xs text-gray-400 mt-0.5">{it.requiredAction}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Section heading with description ──────────────────────────────────────────
export function SectionHead({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        <h2 className="text-sm font-bold text-gray-800" style={{ fontFamily: FONT_HEAD }}>{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Tab bar wrapper ──────────────────────────────────────────────────────────
export function TabBar({ tabs, value, onValueChange, children }: {
  tabs: { value: string; label: string }[];
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="mb-5 flex flex-wrap h-auto">
        {tabs.map((t) => <TabsTrigger key={t.value} value={t.value} data-testid={`tab-${t.value}`}>{t.label}</TabsTrigger>)}
      </TabsList>
      {children}
    </Tabs>
  );
}
export { TabsContent };

export type { Band, Tone };
