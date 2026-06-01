// ============================================================
// PROBLEM STATEMENT INTAKE — Module 2 (Venture Intake)
// Interactive form for capturing & validating a core problem
// ============================================================
import { useState } from "react";
import { useLocation } from "wouter";
import { ventures } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Target,
  Users,
  Repeat,
  Gauge,
  Activity,
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

const GREEN = "#51AF37";

interface FormState {
  ventureId: string;
  coreProblem: string;
  targetAudience: string;
  currentAlternatives: string;
  severity: number;
  frequency: number;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_STATE: FormState = {
  ventureId: "",
  coreProblem: "",
  targetAudience: "",
  currentAlternatives: "",
  severity: 5,
  frequency: 5,
};

// ── Reusable section shell ──
function FormSection({
  icon: Icon,
  step,
  title,
  subtitle,
  children,
  error,
  errorId,
  titleId,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  error?: string;
  errorId?: string;
  titleId?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border p-6 transition-shadow hover:shadow-sm"
      style={{ borderColor: error ? "#fca5a5" : "#e5e7eb" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(81,175,55,0.1)" }}
        >
          <Icon size={18} style={{ color: GREEN }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Step {step}
            </span>
          </div>
          <h2
            id={titleId}
            className="text-base font-bold text-gray-900"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 mt-2 text-xs font-medium"
          style={{ color: "#dc2626" }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Pain scale (slider with descriptive labels) ──
function PainScale({
  icon: Icon,
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  const tone = value >= 8 ? "#dc2626" : value >= 5 ? "#d97706" : "#16a34a";
  return (
    <div className="bg-gray-50 rounded-lg p-4 border" style={{ borderColor: "#f0f0f0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color: GREEN }} />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <span
          className="text-sm font-bold font-mono w-12 text-center rounded-md py-0.5"
          style={{ background: `${tone}15`, color: tone }}
        >
          {value}/10
        </span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        aria-label={label}
      />
      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default function ProblemStatement() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.ventureId) next.ventureId = "Select a venture to link this problem statement.";
    if (form.coreProblem.trim().length < 20)
      next.coreProblem = "Describe the problem in at least 20 characters.";
    if (form.targetAudience.trim().length < 3)
      next.targetAudience = "Identify who suffers from this problem.";
    if (form.currentAlternatives.trim().length < 10)
      next.currentAlternatives = "Describe how the audience solves this today.";
    return next;
  };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    const errorKeys = Object.keys(next) as (keyof FormState)[];
    if (errorKeys.length > 0) {
      toast.error("Please complete the highlighted fields before submitting.");
      // scroll to the first error section after the next paint so the node exists
      const firstKey = errorKeys[0];
      requestAnimationFrame(() => {
        document
          .getElementById(`section-${firstKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setSubmitting(true);
    const venture = ventures.find((v) => v.id === form.ventureId);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Problem statement submitted to Venture OS${venture ? ` for ${venture.name}` : ""}.`);
    }, 700);
  };

  const handleSaveDraft = () => {
    const venture = ventures.find((v) => v.id === form.ventureId);
    toast.success(`Draft saved${venture ? ` for ${venture.name}` : ""}.`);
  };

  const portfolio = ventures.filter((v) => !v.isInternalLab && v.status !== "Paused");

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="px-8 py-6 border-b"
        style={{
          borderColor: "#e5e7eb",
          background:
            "linear-gradient(135deg, rgba(81,175,55,0.04) 0%, rgba(58,151,211,0.04) 100%)",
        }}
      >
        <button
          onClick={() => navigate("/intake")}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Back to Venture Intake
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Target size={18} style={{ color: GREEN }} />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: GREEN }}
          >
            Module 2 · Problem Statement
          </span>
        </div>
        <h1
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "'Prompt', sans-serif" }}
        >
          Define the Core Problem
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          A sharp problem statement is the foundation of a validated venture. Be specific,
          evidence-led, and customer-centric.
        </p>
      </div>

      {/* Form body */}
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Venture context */}
          <div id="section-ventureId" data-error={!!errors.ventureId}>
            <FormSection
              icon={Lightbulb}
              step={1}
              title="Venture Context"
              subtitle="Link this problem statement to an active venture."
              error={errors.ventureId}
              errorId="ventureId-error"
              titleId="ventureId-label"
            >
              <Select value={form.ventureId} onValueChange={(v) => update("ventureId", v)}>
                <SelectTrigger
                  className="h-11"
                  aria-labelledby="ventureId-label"
                  aria-invalid={!!errors.ventureId}
                  aria-describedby={errors.ventureId ? "ventureId-error" : undefined}
                  style={{ borderColor: errors.ventureId ? "#fca5a5" : undefined }}
                >
                  <SelectValue placeholder="Select an active venture…" />
                </SelectTrigger>
                <SelectContent>
                  {portfolio.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: v.color }}
                        />
                        {v.name}
                        <span className="text-xs text-gray-400">· {v.sector}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormSection>
          </div>

          {/* Core problem */}
          <div id="section-coreProblem" data-error={!!errors.coreProblem}>
            <FormSection
              icon={Target}
              step={2}
              title="The Core Problem"
              subtitle="What is the specific, unaddressed problem?"
              error={errors.coreProblem}
              errorId="coreProblem-error"
              titleId="coreProblem-label"
            >
              <Textarea
                value={form.coreProblem}
                onChange={(e) => update("coreProblem", e.target.value)}
                rows={4}
                aria-labelledby="coreProblem-label"
                aria-invalid={!!errors.coreProblem}
                aria-describedby={errors.coreProblem ? "coreProblem-error" : undefined}
                className="resize-none text-sm leading-relaxed"
                style={{ borderColor: errors.coreProblem ? "#fca5a5" : undefined }}
                placeholder="e.g. Automotive OEMs experience excessive weight in structural components when using traditional materials, leading to higher fuel consumption and emissions — yet no bio-based alternative matches the required structural integrity."
              />
              <div className="text-[11px] text-gray-400 mt-1.5 text-right">
                {form.coreProblem.trim().length} characters
              </div>
            </FormSection>
          </div>

          {/* Target audience */}
          <div id="section-targetAudience" data-error={!!errors.targetAudience}>
            <FormSection
              icon={Users}
              step={3}
              title="The Target Audience"
              subtitle="Who suffers from this problem most acutely?"
              error={errors.targetAudience}
              errorId="targetAudience-error"
              titleId="targetAudience-label"
            >
              <Textarea
                value={form.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
                rows={3}
                aria-labelledby="targetAudience-label"
                aria-invalid={!!errors.targetAudience}
                aria-describedby={errors.targetAudience ? "targetAudience-error" : undefined}
                className="resize-none text-sm leading-relaxed"
                style={{ borderColor: errors.targetAudience ? "#fca5a5" : undefined }}
                placeholder="e.g. Tier 1 automotive suppliers running lightweighting programmes for EV platforms, where every kilogram saved directly impacts range and emissions targets."
              />
            </FormSection>
          </div>

          {/* Current alternatives */}
          <div id="section-currentAlternatives" data-error={!!errors.currentAlternatives}>
            <FormSection
              icon={Repeat}
              step={4}
              title="Current Alternatives"
              subtitle="How are they solving this today and why is that solution failing?"
              error={errors.currentAlternatives}
              errorId="currentAlternatives-error"
              titleId="currentAlternatives-label"
            >
              <Textarea
                value={form.currentAlternatives}
                onChange={(e) => update("currentAlternatives", e.target.value)}
                rows={3}
                aria-labelledby="currentAlternatives-label"
                aria-invalid={!!errors.currentAlternatives}
                aria-describedby={errors.currentAlternatives ? "currentAlternatives-error" : undefined}
                className="resize-none text-sm leading-relaxed"
                style={{ borderColor: errors.currentAlternatives ? "#fca5a5" : undefined }}
                placeholder="e.g. They currently use aluminium and carbon fibre. Aluminium adds weight; carbon fibre is costly, hard to recycle, and carries a high carbon footprint — failing both cost and sustainability targets."
              />
            </FormSection>
          </div>

          {/* Impact & validation */}
          <FormSection
            icon={Activity}
            step={5}
            title="Impact & Validation"
            subtitle="Grade the intensity of this problem from initial signals."
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <PainScale
                icon={Gauge}
                label="Severity of Pain"
                value={form.severity}
                onChange={(v) => update("severity", v)}
                lowLabel="Minor annoyance"
                highLabel="Critical blocker"
              />
              <PainScale
                icon={Repeat}
                label="Frequency of Occurrence"
                value={form.frequency}
                onChange={(v) => update("frequency", v)}
                lowLabel="Rarely"
                highLabel="Constantly"
              />
            </div>
            <div
              className="flex items-center justify-between mt-4 px-4 py-3 rounded-lg"
              style={{ background: "rgba(81,175,55,0.06)" }}
            >
              <span className="text-sm font-medium text-gray-600">Composite pain index</span>
              <span className="text-sm font-bold font-mono" style={{ color: GREEN }}>
                {form.severity * form.frequency} / 100
              </span>
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft}>
              <Save size={15} />
              Save Draft
            </Button>
            <Button
              className="gap-2 text-white"
              style={{ background: GREEN }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Send size={15} />
              {submitting ? "Submitting…" : "Submit to Venture OS"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
