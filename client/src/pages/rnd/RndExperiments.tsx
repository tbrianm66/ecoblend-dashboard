// ============================================================================
// R&D Hub — Prototype Testing Log  (/rnd/experiments)
// Phase 3: Section 5 — Test run records with pass/fail and evidence links
// ============================================================================
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FlaskConical, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, ExternalLink,
} from "lucide-react";
import { ModuleHeader, VentureSelector, EmptyState, NoVentureState } from "@/components/discovery/primitives";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEST_STATUSES = [
  { value: "pending", label: "Pending", color: "#6b7280", bg: "#f3f4f6", Icon: Clock },
  { value: "pass",    label: "Pass",    color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2 },
  { value: "fail",    label: "Fail",    color: "#dc2626", bg: "#fef2f2", Icon: XCircle },
];

function statusCfg(status: string) {
  return TEST_STATUSES.find(s => s.value === status) ?? TEST_STATUSES[0];
}

const EMPTY_FORM = {
  prototypeVersion: "",
  testName:         "",
  passFailStatus:   "pending" as const,
  testDate:         "",
  testResultsNotes: "",
  evidenceId:       "",
  evidenceUrl:      "",
  projectId:        undefined as number | undefined,
};
type FormState = typeof EMPTY_FORM;

// ── Test Modal ────────────────────────────────────────────────────────────────

function TestModal({
  open, onClose, ventureId, editId, initialForm, onSaved,
}: {
  open: boolean; onClose: () => void; ventureId: string;
  editId?: number; initialForm: FormState; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const { data: projects = [] } = trpc.rnd.projects.list.useQuery({ ventureId }, { enabled: !!ventureId });
  const upsert = trpc.rnd.tests.upsert.useMutation({
    onSuccess: () => { toast.success(editId ? "Test run updated." : "Test run recorded."); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: keyof FormState, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? "Edit Test Run" : "Record Test Run"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Prototype Version *</label>
              <Input value={form.prototypeVersion} onChange={e => set("prototypeVersion", e.target.value)} placeholder="e.g. v1.3, Rev-B" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Test Date</label>
              <Input type="date" value={form.testDate} onChange={e => set("testDate", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Test Name *</label>
            <Input value={form.testName} onChange={e => set("testName", e.target.value)} placeholder="e.g. OEM Crash Test – FMVSS 214" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Result *</label>
            <Select value={form.passFailStatus} onValueChange={v => set("passFailStatus", v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEST_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Link to R&D Project (optional)</label>
              <Select value={form.projectId?.toString() ?? "none"} onValueChange={v => set("projectId", v === "none" ? undefined : Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.projectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Test Results & Notes</label>
            <Textarea value={form.testResultsNotes} onChange={e => set("testResultsNotes", e.target.value)} placeholder="Observations, measurements, failure modes…" rows={4} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Evidence URL (test report / data file)</label>
            <Input value={form.evidenceUrl} onChange={e => set("evidenceUrl", e.target.value)} placeholder="https://…" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Evidence ID (Evidence Ledger reference)</label>
            <Input value={form.evidenceId} onChange={e => set("evidenceId", e.target.value)} placeholder="e.g. EV-0042" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.prototypeVersion.trim() || !form.testName.trim() || upsert.isPending}
            onClick={() => upsert.mutate({ id: editId, ventureId, ...form })}
            style={{ background: "#3B85BA" }}
          >
            {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Record Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RndExperiments() {
  const { selectedVentureId } = useSelectedVenture();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTest, setEditTest] = useState<{ id: number; form: FormState } | null>(null);

  const { data: tests = [], refetch } = trpc.rnd.tests.list.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );

  const deleteTest = trpc.rnd.tests.delete.useMutation({
    onSuccess: () => { toast.success("Test run deleted."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const passed   = tests.filter(t => t.passFailStatus === "pass").length;
  const failed   = tests.filter(t => t.passFailStatus === "fail").length;
  const passRate = tests.length > 0 ? Math.round((passed / tests.length) * 100) : 0;

  const openAdd = () => { setEditTest(null); setModalOpen(true); };
  const openEdit = (test: typeof tests[0]) => {
    setEditTest({
      id: test.id,
      form: {
        prototypeVersion: test.prototypeVersion,
        testName:         test.testName,
        passFailStatus:   test.passFailStatus as any,
        testDate:         test.testDate ? new Date(test.testDate).toISOString().split("T")[0] : "",
        testResultsNotes: test.testResultsNotes ?? "",
        evidenceId:       test.evidenceId ?? "",
        evidenceUrl:      test.evidenceUrl ?? "",
        projectId:        test.projectId ?? undefined,
      },
    });
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <ModuleHeader
        icon={<FlaskConical size={20} />}
        title="Prototype Testing Log"
        purpose="Record test runs, pass/fail results, and attach technical evidence to the ledger."
        action={<Button size="sm" className="gap-2" style={{ background: "#3B85BA" }} onClick={openAdd}><Plus size={14} /> Record Test</Button>}
      />

      <div className="space-y-6">
        <VentureSelector />

        {!selectedVentureId ? (
          <NoVentureState />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Tests Run", value: tests.length, color: "#3B85BA", Icon: FlaskConical },
                { label: "Passed",    value: passed,       color: "#16a34a", Icon: CheckCircle2 },
                { label: "Failed",    value: failed,       color: "#dc2626", Icon: XCircle },
                {
                  label: "Pass Rate", value: `${passRate}%`,
                  color: passRate >= 70 ? "#16a34a" : passRate >= 40 ? "#F69111" : "#dc2626",
                  Icon: Clock,
                },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <card.Icon size={14} style={{ color: card.color }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Test log */}
            {tests.length === 0 ? (
              <EmptyState
                icon={<FlaskConical size={32} />}
                title="No test runs recorded yet"
                description="Record prototype test runs to track engineering validation progress. Pass/fail data feeds into your technical evidence ledger."
                action={<Button size="sm" onClick={openAdd} style={{ background: "#3B85BA" }}><Plus size={14} className="mr-1" /> Record Test</Button>}
              />
            ) : (
              <div className="space-y-3">
                {tests.map(test => {
                  const sc = statusCfg(test.passFailStatus);
                  return (
                    <div key={test.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${sc.color}` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="text-[10px] font-mono" style={{ borderColor: "#6b7280", color: "#6b7280" }}>
                              {test.prototypeVersion}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: sc.color, color: sc.color, background: sc.bg }}>
                              <sc.Icon size={9} /> {sc.label}
                            </Badge>
                            {test.testDate && (
                              <span className="text-[10px] text-gray-400">
                                {new Date(test.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1">{test.testName}</h3>
                          {test.testResultsNotes && (
                            <p className="text-xs text-gray-500 leading-relaxed">{test.testResultsNotes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {test.evidenceId && (
                              <span className="text-[10px] font-mono text-gray-400">Evidence: {test.evidenceId}</span>
                            )}
                            {test.evidenceUrl && (
                              <a href={test.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                                <ExternalLink size={10} /> View Evidence
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(test)}>
                            <Pencil size={12} />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => { if (confirm("Delete this test run?")) deleteTest.mutate({ id: test.id }); }}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <TestModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTest(null); }}
        ventureId={selectedVentureId ?? ""}
        editId={editTest?.id}
        initialForm={editTest?.form ?? EMPTY_FORM}
        onSaved={refetch}
      />
    </div>
  );
}
