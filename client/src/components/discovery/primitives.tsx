// ============================================================================
// DISCOVERY & MARKET — Reusable UI building blocks
// ============================================================================
import { ReactNode } from "react";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightbulb, FlaskConical, Inbox, AlertTriangle } from "lucide-react";
import type { Band } from "@shared/discoveryMarket";

const FONT_HEAD = "'Prompt', sans-serif";

// ─── Tone → colour map ───────────────────────────────────────────────────────
export const TONE: Record<Band["tone"], { fg: string; bg: string; border: string }> = {
  green: { fg: "#15803d", bg: "rgba(86,168,55,0.10)", border: "rgba(86,168,55,0.35)" },
  amber: { fg: "#b45309", bg: "rgba(246,145,17,0.10)", border: "rgba(246,145,17,0.35)" },
  red: { fg: "#b91c1c", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)" },
  grey: { fg: "#4b5563", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.30)" },
};

// ─── Page header ─────────────────────────────────────────────────────────────
export function ModuleHeader({ title, purpose, icon, action }: { title: string; purpose: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(86,168,55,0.10)", color: "#56A837" }}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_HEAD }}>{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{purpose}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Venture Selector (drives the global selected venture) ───────────────────
export function VentureSelector() {
  const { selectedVentureId, setSelectedVentureId, availableVentures } = useSelectedVenture();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Venture</span>
      <Select value={selectedVentureId ?? "__none__"} onValueChange={(val) => setSelectedVentureId(val === "__none__" ? null : val)}>
        <SelectTrigger className="w-52 h-9 text-sm" data-testid="select-venture">
          <SelectValue placeholder="Select venture…" />
        </SelectTrigger>
        <SelectContent>
          {selectedVentureId === null && <SelectItem value="__none__" disabled>Select venture…</SelectItem>}
          {availableVentures.map((v) => (
            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Hypothesis Selector ─────────────────────────────────────────────────────
export function HypothesisSelector({
  hypotheses,
  value,
  onChange,
  allowAll = true,
}: {
  hypotheses: { id: number; hypothesisStatement: string }[];
  value: number | null;
  onChange: (id: number | null) => void;
  allowAll?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hypothesis</span>
      <Select
        value={value === null ? "__all__" : String(value)}
        onValueChange={(v) => onChange(v === "__all__" ? null : Number(v))}
      >
        <SelectTrigger className="w-64 h-9 text-sm" data-testid="select-hypothesis">
          <SelectValue placeholder="All hypotheses" />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value="__all__">All hypotheses</SelectItem>}
          {hypotheses.map((h) => (
            <SelectItem key={h.id} value={String(h.id)}>
              {h.hypothesisStatement.length > 60 ? h.hypothesisStatement.slice(0, 60) + "…" : h.hypothesisStatement}
            </SelectItem>
          ))}
          {hypotheses.length === 0 && <div className="px-2 py-1.5 text-xs text-gray-400">No hypotheses yet</div>}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Score Card ──────────────────────────────────────────────────────────────
export function ScoreCard({
  label,
  score,
  max = 100,
  band,
  interpretation,
  hint,
}: {
  label: string;
  score: number;
  max?: number;
  band: Band;
  interpretation?: string;
  hint?: string;
}) {
  const tone = TONE[band.tone];
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: tone.fg, background: tone.bg, border: `1px solid ${tone.border}` }}>
            {band.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: tone.fg }}>{score}</span>
          <span className="text-sm text-gray-400">/ {max}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone.fg }} />
        </div>
        {interpretation && <p className="text-xs text-gray-500 mt-2">{interpretation}</p>}
        {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────
export function ToneBadge({ band }: { band: Band }) {
  const tone = TONE[band.tone];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: tone.fg, background: tone.bg, border: `1px solid ${tone.border}` }}>
      {band.label}
    </span>
  );
}

const STATUS_TONE: Record<string, Band["tone"]> = {
  validated: "green",
  testing: "amber",
  untested: "grey",
  invalidated: "red",
  pivot_required: "red",
  paused: "grey",
  open: "red",
  monitoring: "amber",
  mitigated: "green",
  escalated: "red",
  closed: "grey",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "grey";
  return <ToneBadge band={{ label: status.replace(/_/g, " "), tone }} />;
}

// ─── Lean Decision Panel ─────────────────────────────────────────────────────
export function LeanDecisionPanel({ title = "Lean Startup Decision", decisions }: { title?: string; decisions: string[] }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={15} style={{ color: "#56A837" }} />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <ul className="space-y-2">
          {decisions.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#56A837" }} />
              {d}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Next Experiment Panel ───────────────────────────────────────────────────
export function NextExperimentPanel({ recommendation }: { recommendation: string }) {
  return (
    <Card className="border shadow-sm" style={{ background: "rgba(59,133,186,0.04)", borderColor: "rgba(59,133,186,0.25)" }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={15} style={{ color: "#3B85BA" }} />
          <span className="text-sm font-semibold text-gray-700">Next Experiment</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{recommendation}</p>
      </CardContent>
    </Card>
  );
}

// ─── Decision Warning ────────────────────────────────────────────────────────
export function DecisionWarning({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="space-y-2">
      {messages.map((m, i) => (
        <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)", color: "#b91c1c" }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{m}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-xl border border-dashed bg-white" style={{ borderColor: "#d1d5db" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(107,114,128,0.08)", color: "#9ca3af" }}>
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── No-venture state ────────────────────────────────────────────────────────
export function NoVentureState() {
  return (
    <EmptyState
      title="Select a venture to begin"
      description="Choose a venture from the selector above to view and capture market discovery evidence."
      icon={<Inbox size={22} />}
    />
  );
}

// ─── Form Modal ──────────────────────────────────────────────────────────────
export function FormModal({
  open,
  onOpenChange,
  title,
  children,
  onSubmit,
  submitLabel = "Save",
  submitting,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={wide ? "max-w-3xl max-h-[90vh] overflow-y-auto" : "max-w-xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: FONT_HEAD }}>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting} style={{ background: "#56A837" }} data-testid="button-save-form">
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 1–5 score selector ──────────────────────────────────────────────────────
export function ScoreSelect({ label, value, onChange, max = 5 }: { label: string; value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: max + 1 }, (_, i) => i).map((n) => (
            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
