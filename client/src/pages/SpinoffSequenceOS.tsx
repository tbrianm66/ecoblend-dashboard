/**
 * Sprint 74 — Spin-Off Sequence Automation
 * V4 Architecture Brief — Section 2 & 3.3
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Rocket, CheckCircle, Clock, AlertTriangle, FolderOpen, FileText, Users, Database, ArrowRight } from "lucide-react";

const STEP_LABELS = ["Trigger Spin-Off", "Create Drive", "Migrate Assets", "Generate Handover Pack", "Setup Data Room", "Complete"];
const STEP_ICONS = [Rocket, FolderOpen, FileText, FileText, Database, CheckCircle];

const STATUS_COLORS: Record<string, string> = {
  pending:             "bg-gray-100 text-gray-600",
  drive_created:       "bg-blue-100 text-blue-800",
  assets_migrated:     "bg-amber-100 text-amber-800",
  handover_generated:  "bg-purple-100 text-purple-800",
  data_room_ready:     "bg-teal-100 text-teal-800",
  completed:           "bg-green-100 text-green-800",
  failed:              "bg-red-100 text-red-800",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  business_plan: "Business Plan", financial_model: "Financial Model", pitch_deck: "Pitch Deck",
  cap_table: "Cap Table", entity_structure: "Entity Structure", ip_map: "IP Map",
  operator_playbook: "Operator Playbook", handover_pack: "Handover Pack",
};

export default function SpinoffSequenceOS() {
  const [activeSequenceId, setActiveSequenceId] = useState<number | null>(null);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [triggerForm, setTriggerForm] = useState({ ventureId: "", ventureCode: "", ventureName: "", triggerVrlScore: 85, approvedDate: new Date().toISOString().split("T")[0], founderName: "", founderEmail: "", leadInvestorName: "" });
  const [handoverContext, setHandoverContext] = useState("");
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"sequences"|"assets"|"handover">("sequences");

  const sequences = trpc.spinoffSequence.listSequences.useQuery();
  const sequence  = trpc.spinoffSequence.getSequence.useQuery({ id: activeSequenceId! }, { enabled: !!activeSequenceId });
  const assetPlan = trpc.spinoffSequence.getAssetMigrationPlan.useQuery();

  const triggerMutation = trpc.spinoffSequence.triggerSpinoff.useMutation({
    onSuccess: (data) => { toast.success(data.message); sequences.refetch(); setShowTriggerForm(false); setActiveSequenceId(data.sequenceId); },
    onError: (e) => toast.error(e.message),
  });
  const createDriveMutation = trpc.spinoffSequence.createSpinoffDrive.useMutation({
    onSuccess: (data) => { toast.success(`Drive created: ${data.driveName}`); sequence.refetch(); sequences.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const migrateAssetsMutation = trpc.spinoffSequence.migrateAssets.useMutation({
    onSuccess: (data) => { toast.success(`${data.migratedCount} assets migrated`); sequence.refetch(); sequences.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const generateHandoverMutation = trpc.spinoffSequence.generateHandoverPack.useMutation({
    onSuccess: () => { toast.success("Handover pack generated"); sequence.refetch(); sequences.refetch(); setShowHandoverForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const setupDataRoomMutation = trpc.spinoffSequence.setupDataRoom.useMutation({
    onSuccess: (data) => { toast.success(`Data room ready: ${data.dataRoomUrl}`); sequence.refetch(); sequences.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const completeMutation = trpc.spinoffSequence.completeSequence.useMutation({
    onSuccess: (data) => { toast.success(data.message); sequence.refetch(); sequences.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const seq = sequence.data?.sequence;
  const assets = sequence.data?.assets ?? [];
  const handoverPack = sequence.data?.handoverPack;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#EC489915", color: "#EC4899" }}>Sprint 74</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">V4 Architecture Brief — Section 2 & 3.3</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Spin-Off Sequence Automation</h1>
            <p className="text-sm text-gray-500 max-w-xl">5-step automated spin-off workflow: Drive provisioning → Asset migration → Handover pack generation → Investor data room setup.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowTriggerForm(!showTriggerForm)} style={{ borderColor: "#EC4899", color: "#EC4899" }}>
            <Rocket size={13} /> Trigger Spin-Off
          </Button>
        </div>
      </div>

      <div className="p-8">
        {/* Trigger Form */}
        {showTriggerForm && (
          <Card className="mb-6 border-2" style={{ borderColor: "#EC4899" }}>
            <CardHeader><CardTitle className="text-base">Trigger Spin-Off Sequence</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label className="text-xs mb-1 block">Venture ID</Label><Input value={triggerForm.ventureId} onChange={e => setTriggerForm(f => ({ ...f, ventureId: e.target.value }))} className="h-8 text-xs" placeholder="ECB-001" /></div>
                <div><Label className="text-xs mb-1 block">Venture Code</Label><Input value={triggerForm.ventureCode} onChange={e => setTriggerForm(f => ({ ...f, ventureCode: e.target.value }))} className="h-8 text-xs" placeholder="AQUA" /></div>
                <div><Label className="text-xs mb-1 block">Venture Name</Label><Input value={triggerForm.ventureName} onChange={e => setTriggerForm(f => ({ ...f, ventureName: e.target.value }))} className="h-8 text-xs" placeholder="AquaBlend Solutions" /></div>
                <div><Label className="text-xs mb-1 block">VRL Score (min 80)</Label><Input type="number" min={80} max={100} value={triggerForm.triggerVrlScore} onChange={e => setTriggerForm(f => ({ ...f, triggerVrlScore: Number(e.target.value) }))} className="h-8 text-xs" /></div>
                <div><Label className="text-xs mb-1 block">Approved Date</Label><Input type="date" value={triggerForm.approvedDate} onChange={e => setTriggerForm(f => ({ ...f, approvedDate: e.target.value }))} className="h-8 text-xs" /></div>
                <div><Label className="text-xs mb-1 block">Founder Name</Label><Input value={triggerForm.founderName} onChange={e => setTriggerForm(f => ({ ...f, founderName: e.target.value }))} className="h-8 text-xs" placeholder="Jane Smith" /></div>
                <div><Label className="text-xs mb-1 block">Founder Email</Label><Input type="email" value={triggerForm.founderEmail} onChange={e => setTriggerForm(f => ({ ...f, founderEmail: e.target.value }))} className="h-8 text-xs" placeholder="jane@aquablend.com" /></div>
                <div><Label className="text-xs mb-1 block">Lead Investor (optional)</Label><Input value={triggerForm.leadInvestorName} onChange={e => setTriggerForm(f => ({ ...f, leadInvestorName: e.target.value }))} className="h-8 text-xs" placeholder="EcoRace Capital" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => triggerMutation.mutate(triggerForm)} disabled={!triggerForm.ventureId || !triggerForm.founderEmail || triggerMutation.isPending}>
                  {triggerMutation.isPending ? "Triggering…" : "Trigger Spin-Off"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowTriggerForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Sequences</h3>
              {(sequences.data ?? []).length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">No spin-off sequences yet.</div>
              ) : (
                <div className="space-y-2">
                  {(sequences.data ?? []).map(s => (
                    <button key={s.id} onClick={() => { setActiveSequenceId(s.id); setActiveTab("sequences"); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSequenceId === s.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-700"}`}>
                      <div className="font-medium">{s.ventureCode}</div>
                      <div className="text-xs opacity-70 truncate">{s.ventureName}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[s.status]}`}>{s.status.replace(/_/g, " ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <div className="xl:col-span-3">
            {seq ? (
              <div>
                {/* Progress stepper */}
                <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{seq.ventureCode} — {seq.ventureName}</h3>
                      <p className="text-xs text-gray-400">Founder: {seq.founderName} · VRL: {seq.triggerVrlScore}%</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[seq.status]}`}>{seq.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {STEP_LABELS.map((label, i) => {
                      const StepIcon = STEP_ICONS[i];
                      const done = seq.currentStep > i + 1;
                      const active = seq.currentStep === i + 1;
                      return (
                        <div key={i} className="flex items-center gap-1 flex-1">
                          <div className={`flex flex-col items-center flex-1 ${i > 0 ? "ml-1" : ""}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${done ? "bg-green-500" : active ? "bg-gray-900" : "bg-gray-200"}`}>
                              {done ? <CheckCircle size={14} /> : <StepIcon size={14} />}
                            </div>
                            <div className={`text-[9px] text-center mt-1 leading-tight ${active ? "text-gray-900 font-semibold" : "text-gray-400"}`}>{label}</div>
                          </div>
                          {i < STEP_LABELS.length - 1 && <div className={`h-0.5 flex-1 rounded ${done ? "bg-green-400" : "bg-gray-200"}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: "#e5e7eb" }}>
                  <h3 className="font-semibold text-sm text-gray-900 mb-3">Sequence Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {seq.currentStep === 1 && seq.status === "pending" && (
                      <Button size="sm" className="gap-1.5 text-xs" onClick={() => createDriveMutation.mutate({ sequenceId: seq.id })} disabled={createDriveMutation.isPending}>
                        <FolderOpen size={13} /> {createDriveMutation.isPending ? "Creating…" : "Step 1: Create Drive"}
                      </Button>
                    )}
                    {seq.currentStep === 2 && seq.status === "drive_created" && (
                      <Button size="sm" className="gap-1.5 text-xs" onClick={() => migrateAssetsMutation.mutate({ sequenceId: seq.id })} disabled={migrateAssetsMutation.isPending}>
                        <FileText size={13} /> {migrateAssetsMutation.isPending ? "Migrating…" : "Step 2: Migrate Assets"}
                      </Button>
                    )}
                    {seq.currentStep === 3 && seq.status === "assets_migrated" && (
                      <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowHandoverForm(true)}>
                        <FileText size={13} /> Step 3: Generate Handover Pack
                      </Button>
                    )}
                    {seq.currentStep === 4 && seq.status === "handover_generated" && (
                      <Button size="sm" className="gap-1.5 text-xs" onClick={() => setupDataRoomMutation.mutate({ sequenceId: seq.id })} disabled={setupDataRoomMutation.isPending}>
                        <Database size={13} /> {setupDataRoomMutation.isPending ? "Setting up…" : "Step 4: Setup Data Room"}
                      </Button>
                    )}
                    {seq.currentStep === 5 && seq.status === "data_room_ready" && (
                      <Button size="sm" className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => completeMutation.mutate({ sequenceId: seq.id })} disabled={completeMutation.isPending}>
                        <CheckCircle size={13} /> {completeMutation.isPending ? "Completing…" : "Step 5: Complete Spin-Off"}
                      </Button>
                    )}
                    {seq.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><CheckCircle size={16} /> Spin-Off Complete</div>
                    )}
                  </div>
                  {showHandoverForm && (
                    <div className="mt-4 p-4 rounded-lg bg-gray-50 border" style={{ borderColor: "#e5e7eb" }}>
                      <Label className="text-xs mb-1 block">Venture Context for AI Handover Pack</Label>
                      <textarea value={handoverContext} onChange={e => setHandoverContext(e.target.value)} rows={4} className="w-full text-xs border rounded-lg p-2 resize-none" style={{ borderColor: "#e5e7eb" }} placeholder="Describe the venture: key milestones achieved, current customers, tech stack, open risks, team composition…" />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => generateHandoverMutation.mutate({ sequenceId: seq.id, ventureContext: handoverContext, founderName: seq.founderName ?? "" })} disabled={!handoverContext || generateHandoverMutation.isPending}>
                          {generateHandoverMutation.isPending ? "Generating…" : "Generate Pack (AI)"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowHandoverForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4">
                  {(["sequences","assets","handover"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50 border"}`}
                      style={activeTab !== tab ? { borderColor: "#e5e7eb" } : {}}>
                      {tab === "sequences" ? "Overview" : tab === "assets" ? "Asset Migration" : "Handover Pack"}
                    </button>
                  ))}
                </div>

                {activeTab === "assets" && (
                  <div className="space-y-2">
                    {assets.map(asset => (
                      <div key={asset.id} className="bg-white rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">{ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}</div>
                          <div className="text-xs text-gray-400">From: {asset.sourceModule}</div>
                          <div className="text-xs text-gray-400">To: {asset.destPath}</div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">{asset.status}</Badge>
                      </div>
                    ))}
                    {assets.length === 0 && <div className="text-center py-8 text-sm text-gray-400">Assets will appear after triggering the sequence.</div>}
                  </div>
                )}

                {activeTab === "handover" && (
                  <div>
                    {handoverPack ? (
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">Executive Summary</h4>
                          <p className="text-sm text-gray-700">{handoverPack.executiveSummary}</p>
                        </div>
                        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">Operator Playbook</h4>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{handoverPack.operatorPlaybook}</pre>
                        </div>
                        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
                          <h4 className="font-semibold text-sm text-gray-900 mb-2">90-Day Plan</h4>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{handoverPack.ninetyDayPlan}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5e7eb" }}>
                        <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Handover pack not yet generated. Complete Step 3 to generate.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5e7eb" }}>
                <Rocket size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Select a sequence or trigger a new spin-off.</p>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Asset Migration Plan</h4>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    {(assetPlan.data ?? []).map(a => (
                      <div key={a.assetType} className="p-3 rounded-lg bg-gray-50 text-xs">
                        <div className="font-semibold text-gray-800">{ASSET_TYPE_LABELS[a.assetType]}</div>
                        <div className="text-gray-400 mt-0.5">From: {a.sourceModule}</div>
                        <div className="text-gray-400">To: {a.destPath}</div>
                        <div className="text-gray-500 mt-0.5 font-medium">{a.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
