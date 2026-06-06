// ============================================================================
// MODULE — Lean Canvas (append-only versioning)
// Each save creates a new version row; old versions are preserved and browsable.
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LayoutTemplate, Plus, Clock, ChevronRight, Eye, Save } from "lucide-react";
import {
  ModuleHeader, VentureSelector, EmptyState, NoVentureState,
} from "@/components/discovery/primitives";

// ── Canvas block configuration ───────────────────────────────────────────────
const BLOCKS: { key: string; label: string; hint: string; color: string }[] = [
  { key: "problem",          label: "Problem",              hint: "Top 1–3 problems your customer faces", color: "#ef4444" },
  { key: "solution",         label: "Solution",             hint: "Top 3 features that solve those problems", color: "#3b82f6" },
  { key: "uniqueValueProp",  label: "Unique Value Prop",    hint: "Single, clear message that states why you are different", color: "#8b5cf6" },
  { key: "unfairAdvantage",  label: "Unfair Advantage",     hint: "Cannot be easily bought or copied", color: "#f59e0b" },
  { key: "customerSegments", label: "Customer Segments",    hint: "Target customers & users", color: "#10b981" },
  { key: "keyMetrics",       label: "Key Metrics",          hint: "Key activities you measure", color: "#6366f1" },
  { key: "channels",         label: "Channels",             hint: "Path to customers", color: "#0ea5e9" },
  { key: "costStructure",    label: "Cost Structure",       hint: "Customer acquisition costs, distribution, hosting, people", color: "#f97316" },
  { key: "revenueStreams",   label: "Revenue Streams",      hint: "Revenue model, lifetime value, revenue, gross margin", color: "#22c55e" },
];

const EXTRA_BLOCKS: { key: string; label: string; hint: string }[] = [
  { key: "mvpFormat",        label: "MVP Format",           hint: "concierge | wizard-of-oz | smoke test | prototype" },
  { key: "hypothesisTested", label: "Hypothesis Tested",    hint: "What core assumption does this MVP test?" },
  { key: "successCriteria",  label: "Success Criteria",     hint: "How will you know if the hypothesis is proven?" },
  { key: "notes",            label: "Notes",                hint: "Any additional context or constraints" },
];

type FormState = Record<string, string>;

function emptyForm(): FormState {
  return Object.fromEntries(
    [...BLOCKS, ...EXTRA_BLOCKS].map((b) => [b.key, ""])
  );
}

function rowToForm(row: any): FormState {
  const f = emptyForm();
  for (const k of Object.keys(f)) {
    f[k] = row?.[k] ?? "";
  }
  return f;
}

// ── Block textarea ────────────────────────────────────────────────────────────
function CanvasBlock({
  label, hint, color, value, onChange, readOnly,
}: {
  label: string; hint: string; color: string;
  value: string; onChange: (v: string) => void; readOnly: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{label}</span>
      </div>
      <p className="text-xs text-gray-400 leading-snug">{hint}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        rows={3}
        className="text-sm resize-none"
        placeholder={readOnly ? "—" : hint}
      />
    </div>
  );
}

// ── Version badge ─────────────────────────────────────────────────────────────
function VersionBadge({ v, active }: { v: number; active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={active
        ? { background: "rgba(86,168,55,0.15)", color: "#15803d" }
        : { background: "#f3f4f6", color: "#6b7280" }}
    >
      v{v}{active && " · active"}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeanCanvas() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const enabled = !!ventureId;
  const v = ventureId ?? "";

  const history = trpc.leanCanvas.list.useQuery({ ventureId: v }, { enabled });
  const active  = trpc.leanCanvas.getActive.useQuery({ ventureId: v }, { enabled });

  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [dirty, setDirty] = useState(false);

  // When active canvas loads, populate the form (once)
  const [seeded, setSeeded] = useState(false);
  if (active.data && !seeded && !dirty) {
    setForm(rowToForm(active.data));
    setSeeded(true);
  }

  const saveMutation = trpc.leanCanvas.save.useMutation({
    onSuccess: (row) => {
      utils.leanCanvas.list.invalidate();
      utils.leanCanvas.getActive.invalidate();
      setDirty(false);
      setViewingVersion(null);
      toast.success(`Canvas saved — version ${row.version}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const setField = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
    if (viewingVersion !== null) setViewingVersion(null);
  };

  const handleViewVersion = (row: any) => {
    setForm(rowToForm(row));
    setViewingVersion(row.version);
    setDirty(false);
  };

  const handleRestoreActive = () => {
    if (active.data) {
      setForm(rowToForm(active.data));
      setViewingVersion(null);
      setDirty(false);
    }
  };

  const handleSave = () => {
    if (!ventureId) return;
    saveMutation.mutate({ ventureId: v, ...form });
  };

  const versions = history.data ?? [];
  const currentVersion = active.data?.version ?? 0;
  const isViewing = viewingVersion !== null && viewingVersion !== currentVersion;
  const readOnly = isViewing;

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader
          title="Lean Canvas"
          purpose="Capture your business model on a single page. Each save creates a new version — no history is ever lost."
          icon={<LayoutTemplate size={22} />}
          action={<VentureSelector />}
        />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <ModuleHeader
          title="Lean Canvas"
          purpose="Capture your business model on a single page. Each save creates a new version — no history is ever lost."
          icon={<LayoutTemplate size={22} />}
          action={<VentureSelector />}
        />
      </div>

      <div className="flex flex-1 overflow-hidden gap-4 p-6 pt-4">
        {/* ── Canvas form ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto space-y-4">

          {/* Version + save bar */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              {isViewing ? (
                <>
                  <VersionBadge v={viewingVersion!} active={false} />
                  <span className="text-xs text-amber-600 font-medium">Read-only — viewing past version</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleRestoreActive}>
                    <ChevronRight size={13} className="mr-1" /> Back to active
                  </Button>
                </>
              ) : (
                <>
                  {currentVersion > 0
                    ? <VersionBadge v={currentVersion} active />
                    : <span className="text-xs text-gray-400">No canvas saved yet</span>}
                  {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
                </>
              )}
            </div>
            {!readOnly && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending || !dirty}
                className="gap-1.5"
                style={{ background: "#56A837", color: "#fff" }}
              >
                <Save size={14} />
                {saveMutation.isPending
                  ? "Saving…"
                  : currentVersion > 0
                    ? `Save as v${currentVersion + 1}`
                    : "Save v1"}
              </Button>
            )}
          </div>

          {/* 9 canvas blocks */}
          <Card>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {BLOCKS.map((b) => (
                <CanvasBlock
                  key={b.key}
                  label={b.label}
                  hint={b.hint}
                  color={b.color}
                  value={form[b.key]}
                  onChange={(val) => setField(b.key, val)}
                  readOnly={readOnly}
                />
              ))}
            </CardContent>
          </Card>

          {/* R&D linkage blocks */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">MVP & R&D Linkage</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {EXTRA_BLOCKS.map((b) => (
                  <div key={b.key} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{b.label}</span>
                    <p className="text-xs text-gray-400">{b.hint}</p>
                    <Textarea
                      value={form[b.key]}
                      onChange={(e) => setField(b.key, e.target.value)}
                      disabled={readOnly}
                      rows={2}
                      className="text-sm resize-none"
                      placeholder={readOnly ? "—" : b.hint}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {versions.length === 0 && !active.isLoading && (
            <EmptyState
              icon={<LayoutTemplate size={32} />}
              title="No canvas saved yet"
              description="Fill in the blocks above and click Save v1 to create your first Lean Canvas."
            />
          )}
        </div>

        {/* ── Version history sidebar ─────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Version History</span>
            </div>

            {versions.length === 0 ? (
              <p className="text-xs text-gray-400">No versions yet.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((row) => {
                  const isActive  = row.version === currentVersion;
                  const isSelected = row.version === viewingVersion;
                  return (
                    <button
                      key={row.id}
                      onClick={() => handleViewVersion(row)}
                      className={`
                        w-full text-left rounded-lg px-3 py-2.5 border transition-colors
                        ${isSelected
                          ? "border-amber-300 bg-amber-50"
                          : isActive
                            ? "border-green-200 bg-green-50"
                            : "border-gray-100 bg-gray-50 hover:bg-gray-100"}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800">v{row.version}</span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Active</span>
                        )}
                        {isSelected && !isActive && (
                          <Eye size={11} className="text-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {new Date(row.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                      {row.problem && (
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{row.problem}</p>
                      )}
                    </button>
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
