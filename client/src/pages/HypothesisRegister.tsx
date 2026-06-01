// ============================================================
// HYPOTHESIS REGISTER — Module 2 (Venture Intake)
// Interactive Lean Startup hypothesis register: structured
// assumption capture + a live tracker board for validation.
// ============================================================
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ventures } from "@/lib/data";
import {
  useHypothesisStore,
  type Hypothesis,
  type CoreType,
  type Risk,
  type HypothesisStatus as Status,
} from "@/stores/hypothesisStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FlaskConical,
  ArrowLeft,
  Plus,
  TrendingUp,
  Heart,
  AlertCircle,
  ShieldAlert,
  Users,
  Activity,
  Beaker,
  Target,
  ClipboardList,
  Search,
} from "lucide-react";

const GREEN = "#56A837";
const BLUE = "#3B85BA";

// ── Config maps ──
const TYPE_META: Record<CoreType, { label: string; icon: typeof Heart; color: string }> = {
  value: { label: "Value", icon: Heart, color: GREEN },
  growth: { label: "Growth", icon: TrendingUp, color: BLUE },
};

const RISK_META: Record<Risk, { label: string; color: string }> = {
  low: { label: "Low", color: "#16a34a" },
  medium: { label: "Medium", color: "#d97706" },
  high: { label: "High", color: "#dc2626" },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  backlog: { label: "Backlog", color: "#475569", bg: "#f1f5f9" },
  testing: { label: "In Testing", color: BLUE, bg: "rgba(59, 133, 186,0.12)" },
  validated: { label: "Validated", color: "#15803d", bg: "rgba(86, 168, 55,0.14)" },
  invalidated: { label: "Invalidated / Pivot", color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
};

const STATUS_ORDER: Status[] = ["backlog", "testing", "validated", "invalidated"];

// ── Type toggle ──
function TypeToggle({ value, onChange }: { value: CoreType; onChange: (v: CoreType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Core hypothesis type">
      {(Object.keys(TYPE_META) as CoreType[]).map((t) => {
        const meta = TYPE_META[t];
        const Icon = meta.icon;
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t)}
            className="flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all"
            style={{
              borderColor: active ? meta.color : "#e5e7eb",
              background: active ? `${meta.color}0d` : "#fff",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: active ? meta.color : "#f3f4f6" }}
            >
              <Icon size={17} style={{ color: active ? "#fff" : "#9ca3af" }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900">{meta.label} Hypothesis</div>
              <div className="text-[11px] text-gray-500 leading-tight">
                {t === "value" ? "Does it deliver real value?" : "Will it scale & spread?"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Risk selector ──
function RiskSelector({ value, onChange }: { value: Risk; onChange: (v: Risk) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Risk level">
      {(Object.keys(RISK_META) as Risk[]).map((r) => {
        const meta = RISK_META[r];
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r)}
            className="rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all"
            style={{
              borderColor: active ? meta.color : "#e5e7eb",
              background: active ? `${meta.color}14` : "#fff",
              color: active ? meta.color : "#6b7280",
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Small badge ──
function Pill({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}

// ── Tracker row ──
function HypothesisCard({
  h,
  ventureName,
  ventureColor,
  onStatus,
  onNotes,
}: {
  h: Hypothesis;
  ventureName: string;
  ventureColor: string;
  onStatus: (id: string, s: Status) => void;
  onNotes: (id: string, n: string) => void;
}) {
  const typeMeta = TYPE_META[h.type];
  const TypeIcon = typeMeta.icon;
  const riskMeta = RISK_META[h.risk];
  const statusMeta = STATUS_META[h.status];

  return (
    <div
      className="rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm"
      style={{ borderColor: "#e5e7eb", borderLeft: `3px solid ${statusMeta.color}` }}
    >
      {/* Top row: venture + badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: ventureColor }} />
          <span className="text-sm font-bold text-gray-900 truncate">{ventureName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill color={typeMeta.color} bg={`${typeMeta.color}16`}>
            <TypeIcon size={11} />
            {typeMeta.label}
          </Pill>
          <Pill color={riskMeta.color} bg={`${riskMeta.color}16`}>
            <ShieldAlert size={11} />
            {riskMeta.label} Risk
          </Pill>
        </div>
      </div>

      {/* Assumption statement */}
      <p className="text-sm leading-relaxed text-gray-700 mb-3">
        We believe <Hl c={typeMeta.color}>{h.persona}</Hl> will <Hl c={typeMeta.color}>{h.behavior}</Hl>.
        We&apos;ll test this by <Hl c={BLUE}>{h.experiment}</Hl> and know we&apos;re right when we measure{" "}
        <Hl c={BLUE}>{h.metric}</Hl>.
      </p>

      {/* Controls + notes */}
      <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-start">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Status
          </label>
          <Select value={h.status} onValueChange={(v) => onStatus(h.id, v as Status)}>
            <SelectTrigger
              className="h-9"
              aria-label={`Status for ${ventureName} hypothesis`}
              style={{ background: statusMeta.bg, color: statusMeta.color, borderColor: "transparent", fontWeight: 600 }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} />
                    {STATUS_META[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Notes & Evidence
          </label>
          <Textarea
            value={h.notes}
            onChange={(e) => onNotes(h.id, e.target.value)}
            rows={2}
            placeholder="Record findings, data points, or links to evidence…"
            className="resize-none text-sm leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}

function Hl({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="font-semibold" style={{ color: c }}>
      {children}
    </span>
  );
}

// ── Initial form state ──
interface FormState {
  ventureId: string;
  type: CoreType;
  persona: string;
  behavior: string;
  experiment: string;
  metric: string;
  risk: Risk;
}

const INITIAL_FORM: FormState = {
  ventureId: "",
  type: "value",
  persona: "",
  behavior: "",
  experiment: "",
  metric: "",
  risk: "medium",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// ── Inline fill-in-the-blank input ──
function Blank({
  value,
  onChange,
  placeholder,
  invalid,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  invalid?: boolean;
  ariaLabel: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      className="my-1 inline-flex h-8 w-full max-w-md align-middle text-sm"
      style={{ borderColor: invalid ? "#fca5a5" : undefined }}
    />
  );
}

export default function HypothesisRegister() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const items = useHypothesisStore((s) => s.hypotheses);
  const addHypothesis = useHypothesisStore((s) => s.addHypothesis);
  const storeSetStatus = useHypothesisStore((s) => s.setStatus);
  const storeSetNotes = useHypothesisStore((s) => s.setNotes);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const portfolio = ventures.filter((v) => !v.isInternalLab && v.status !== "Paused");

  const ventureFor = (id: string) => ventures.find((v) => v.id === id);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.ventureId) next.ventureId = "Select a venture.";
    if (form.persona.trim().length < 3) next.persona = "Who is the persona/segment?";
    if (form.behavior.trim().length < 3) next.behavior = "Describe the expected behaviour.";
    if (form.experiment.trim().length < 3) next.experiment = "Describe how you'll test it.";
    if (form.metric.trim().length < 2) next.metric = "Define a success metric.";
    return next;
  };

  const handleAdd = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Complete the highlighted parts of the assumption.");
      return;
    }
    const created: Hypothesis = {
      id: `h-${Date.now()}`,
      ventureId: form.ventureId,
      type: form.type,
      persona: form.persona.trim(),
      behavior: form.behavior.trim(),
      experiment: form.experiment.trim(),
      metric: form.metric.trim(),
      risk: form.risk,
      status: "backlog",
      notes: "",
    };
    addHypothesis(created);
    setForm(INITIAL_FORM);
    setErrors({});
    const v = ventureFor(created.ventureId);
    toast.success(`Hypothesis added to the register${v ? ` for ${v.name}` : ""}.`);
  };

  const setStatus = (id: string, status: Status) => {
    storeSetStatus(id, status);
    toast.success(`Status updated to “${STATUS_META[status].label}”.`);
  };

  const setNotes = (id: string, notes: string) => {
    storeSetNotes(id, notes);
  };

  const filtered = useMemo(() => {
    return items.filter((h) => {
      if (filter !== "all" && h.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const v = ventureFor(h.ventureId);
        const hay = `${v?.name ?? ""} ${h.persona} ${h.behavior} ${h.experiment} ${h.metric} ${h.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { backlog: 0, testing: 0, validated: 0, invalidated: 0 };
    items.forEach((h) => (c[h.status] += 1));
    return c;
  }, [items]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 py-6 border-b"
        style={{
          borderColor: "#e5e7eb",
          background:
            "linear-gradient(135deg, rgba(86, 168, 55,0.04) 0%, rgba(59, 133, 186,0.04) 100%)",
        }}
      >
        <button
          onClick={() => navigate("/intake")}
          className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={13} />
          Back to Venture Intake
        </button>
        <div className="mb-1 flex items-center gap-2">
          <FlaskConical size={18} style={{ color: GREEN }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREEN }}>
            Module 2 · Hypothesis Register
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
          Lean Startup Hypothesis Register
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Capture your riskiest assumptions as testable hypotheses, then track each one from backlog
          to validated — or to a pivot.
        </p>
      </div>

      <div className="p-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(360px,420px)_1fr]">
          {/* ── Creation form ── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border bg-white p-6" style={{ borderColor: "#e5e7eb" }}>
              <div className="mb-5 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: "rgba(86, 168, 55,0.1)" }}
                >
                  <Plus size={18} style={{ color: GREEN }} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                    New Hypothesis
                  </h2>
                  <p className="text-xs text-gray-500">Frame one testable assumption.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Venture */}
                <div>
                  <Label icon={Target}>Venture</Label>
                  <Select value={form.ventureId} onValueChange={(v) => update("ventureId", v)}>
                    <SelectTrigger
                      className="h-10"
                      aria-label="Venture"
                      aria-invalid={!!errors.ventureId}
                      style={{ borderColor: errors.ventureId ? "#fca5a5" : undefined }}
                    >
                      <SelectValue placeholder="Tie to a venture…" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolio.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: v.color }} />
                            {v.name}
                            <span className="text-xs text-gray-400">· {v.sector}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ventureId && <ErrText>{errors.ventureId}</ErrText>}
                </div>

                {/* Core type */}
                <div>
                  <Label icon={Activity}>Core Type</Label>
                  <TypeToggle value={form.type} onChange={(v) => update("type", v)} />
                </div>

                {/* Assumption */}
                <div>
                  <Label icon={ClipboardList}>The Assumption</Label>
                  <div className="rounded-lg border bg-gray-50 p-4 text-sm leading-loose text-gray-700" style={{ borderColor: "#eee" }}>
                    We believe
                    <Blank
                      ariaLabel="Persona or segment"
                      value={form.persona}
                      onChange={(v) => update("persona", v)}
                      placeholder="persona / segment"
                      invalid={!!errors.persona}
                    />
                    will
                    <Blank
                      ariaLabel="Expected behaviour"
                      value={form.behavior}
                      onChange={(v) => update("behavior", v)}
                      placeholder="expected behaviour"
                      invalid={!!errors.behavior}
                    />
                    . We&apos;ll test this by
                    <Blank
                      ariaLabel="Experiment details"
                      value={form.experiment}
                      onChange={(v) => update("experiment", v)}
                      placeholder="experiment details"
                      invalid={!!errors.experiment}
                    />
                    and know we&apos;re right when we measure
                    <Blank
                      ariaLabel="Success metric"
                      value={form.metric}
                      onChange={(v) => update("metric", v)}
                      placeholder="success metric"
                      invalid={!!errors.metric}
                    />
                    .
                  </div>
                </div>

                {/* Risk */}
                <div>
                  <Label icon={ShieldAlert}>Risk Level — how critical is this assumption?</Label>
                  <RiskSelector value={form.risk} onChange={(v) => update("risk", v)} />
                </div>

                <Button className="w-full gap-2 text-white" style={{ background: GREEN }} onClick={handleAdd}>
                  <Plus size={16} />
                  Add to Register
                </Button>
              </div>
            </div>
          </div>

          {/* ── Tracker ── */}
          <div>
            {/* Stat chips */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const active = filter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(active ? "all" : s)}
                    className="rounded-xl border bg-white p-3 text-left transition-all"
                    style={{ borderColor: active ? meta.color : "#e5e7eb", boxShadow: active ? `0 0 0 1px ${meta.color}` : undefined }}
                  >
                    <div className="text-2xl font-bold" style={{ color: meta.color, fontFamily: "'Prompt', sans-serif" }}>
                      {counts[s]}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{meta.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                <Beaker size={18} style={{ color: GREEN }} />
                Hypothesis Tracker
                <span className="text-sm font-normal text-gray-400">· {filtered.length} of {items.length}</span>
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hypotheses…"
                  className="h-9 w-56 pl-8 text-sm"
                  aria-label="Search hypotheses"
                />
              </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white py-16 text-center" style={{ borderColor: "#d1d5db" }}>
                <FlaskConical size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No hypotheses match your view.</p>
                <p className="text-xs text-gray-400">
                  {filter !== "all" || search ? "Try clearing filters or search." : "Add your first hypothesis on the left."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((h) => {
                  const v = ventureFor(h.ventureId);
                  return (
                    <HypothesisCard
                      key={h.id}
                      h={h}
                      ventureName={v?.name ?? "Unlinked"}
                      ventureColor={v?.color ?? "#9ca3af"}
                      onStatus={setStatus}
                      onNotes={setNotes}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form label ──
function Label({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) {
  return (
    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      <Icon size={13} style={{ color: GREEN }} />
      {children}
    </label>
  );
}

function ErrText({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium" style={{ color: "#dc2626" }}>
      <AlertCircle size={12} />
      {children}
    </div>
  );
}
