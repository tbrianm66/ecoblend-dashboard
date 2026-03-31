/**
 * Sprint 76 — Interview-to-Insight Automation & Stage Gate Review
 * V4 Architecture Brief — Section 3.5 & 3.6
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Brain, CheckCircle, XCircle, Clock, AlertTriangle, Plus, FileText, Sparkles, TrendingUp } from "lucide-react";

const RECOMMENDATION_COLORS: Record<string, string> = {
  advance:         "bg-green-100 text-green-800",
  pause:           "bg-amber-100 text-amber-800",
  requires_action: "bg-red-100 text-red-800",
};
const STAGE_COLORS: Record<string, string> = {
  discover: "#3A97D3", define: "#8B5CF6", build: "#F49C13", launch: "#51AF37", spinout: "#EC4899",
};

export default function InsightAutomation() {
  const [ventureId, setVentureId] = useState("ECB-001");
  const [activeTab, setActiveTab] = useState<"insights"|"board"|"stagegate">("insights");
  const [showTranscriptForm, setShowTranscriptForm] = useState(false);
  const [transcriptForm, setTranscriptForm] = useState({ fileName: "", fileType: "docx" as const, intervieweeType: "", transcriptText: "", currentStage: "build", existingHypotheses: "" });
  const [showGateForm, setShowGateForm] = useState(false);
  const [gateForm, setGateForm] = useState({ ventureName: "EcoBlend", targetStage: "build" as const, submittedBy: "", evidenceList: [] as Array<{ module: string; docName: string; docStatus: "present"|"missing"|"needs_approval" }> });
  const [selectedReview, setSelectedReview] = useState<number | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);

  const board    = trpc.insightAutomation.getInsightBoard.useQuery({ ventureId }, { enabled: !!ventureId });
  const reviews  = trpc.insightAutomation.listStageGateReviews.useQuery({ ventureId }, { enabled: !!ventureId });
  const review   = trpc.insightAutomation.getStageGateReview.useQuery({ id: selectedReview! }, { enabled: !!selectedReview });
  const insight  = trpc.insightAutomation.getInsightSummary.useQuery({ id: selectedInsight! }, { enabled: !!selectedInsight });
  const evidenceReqs = trpc.insightAutomation.getStageEvidenceRequirements.useQuery();

  const processTranscript = trpc.insightAutomation.processTranscript.useMutation({
    onSuccess: (data) => {
      toast.success(`Insight processed — Opportunity score: ${data.summary.opportunityScore}/10`);
      board.refetch();
      setShowTranscriptForm(false);
      setTranscriptForm({ fileName: "", fileType: "docx", intervieweeType: "", transcriptText: "", currentStage: "build", existingHypotheses: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const initiateReview = trpc.insightAutomation.initiateStageGateReview.useMutation({
    onSuccess: (data) => {
      toast.success(`Stage Gate Review submitted — Recommendation: ${data.recommendation.toUpperCase()}`);
      reviews.refetch();
      setShowGateForm(false);
      setSelectedReview(data.reviewId);
    },
    onError: (e) => toast.error(e.message),
  });

  const approveReview = trpc.insightAutomation.approveStageGateReview.useMutation({
    onSuccess: () => { toast.success("Review approved"); review.refetch(); reviews.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const b = board.data;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b px-8 py-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: "#3A97D315", color: "#3A97D3" }}>Sprint 76</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">V4 Architecture Brief — Section 3.5 & 3.6</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>Interview-to-Insight Automation</h1>
            <p className="text-sm text-gray-500 max-w-xl">AI-powered transcript processing → structured insight cards. Stage Gate Review pack generation with evidence audit and narrative memo.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input value={ventureId} onChange={e => setVentureId(e.target.value)} className="w-28 text-xs h-8" placeholder="Venture ID" />
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* KPI row */}
        {b && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Interviews Processed</div>
              <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{b.totalInterviews}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Avg Opportunity Score</div>
              <div className="text-3xl font-bold" style={{ color: "#51AF37", fontFamily: "'Prompt', sans-serif" }}>{b.avgOpportunityScore}/10</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Validated Hypotheses</div>
              <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{b.validatedHypotheses.length}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Gate Reviews</div>
              <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>{(reviews.data ?? []).length}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(["insights","board","stagegate"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50 border"}`}
              style={activeTab !== tab ? { borderColor: "#e5e7eb" } : {}}>
              {tab === "insights" ? "Process Transcript" : tab === "board" ? "Insight Board" : "Stage Gate Reviews"}
            </button>
          ))}
        </div>

        {/* Process Transcript */}
        {activeTab === "insights" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Interview Transcripts</h3>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowTranscriptForm(!showTranscriptForm)} style={{ borderColor: "#3A97D3", color: "#3A97D3" }}>
                <Plus size={13} /> Process Transcript
              </Button>
            </div>
            {showTranscriptForm && (
              <Card className="mb-6 border-2" style={{ borderColor: "#3A97D3" }}>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain size={16} /> AI Transcript Processor</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div><Label className="text-xs mb-1 block">File Name</Label><Input value={transcriptForm.fileName} onChange={e => setTranscriptForm(f => ({ ...f, fileName: e.target.value }))} className="h-8 text-xs" placeholder="interview_001.docx" /></div>
                    <div>
                      <Label className="text-xs mb-1 block">File Type</Label>
                      <Select value={transcriptForm.fileType} onValueChange={v => setTranscriptForm(f => ({ ...f, fileType: v as any }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{["docx","txt","pdf","mp4","mp3"].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs mb-1 block">Interviewee Type</Label><Input value={transcriptForm.intervieweeType} onChange={e => setTranscriptForm(f => ({ ...f, intervieweeType: e.target.value }))} className="h-8 text-xs" placeholder="e.g. Sustainability Manager" /></div>
                    <div>
                      <Label className="text-xs mb-1 block">Current Stage</Label>
                      <Select value={transcriptForm.currentStage} onValueChange={v => setTranscriptForm(f => ({ ...f, currentStage: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{["discover","define","build","launch","spinout"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-xs mb-1 block">Existing Hypotheses (semicolon-separated)</Label><Input value={transcriptForm.existingHypotheses} onChange={e => setTranscriptForm(f => ({ ...f, existingHypotheses: e.target.value }))} className="h-8 text-xs" placeholder="H1: Buyers prefer X; H2: Price is barrier" /></div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-xs mb-1 block">Transcript Text</Label>
                    <textarea value={transcriptForm.transcriptText} onChange={e => setTranscriptForm(f => ({ ...f, transcriptText: e.target.value }))} rows={8} className="w-full text-xs border rounded-lg p-2 resize-none" style={{ borderColor: "#e5e7eb" }} placeholder="Paste the full interview transcript here…" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => processTranscript.mutate({ ventureId, ...transcriptForm, existingHypotheses: transcriptForm.existingHypotheses ? transcriptForm.existingHypotheses.split(";").map(h => h.trim()) : undefined })} disabled={!transcriptForm.fileName || !transcriptForm.transcriptText || processTranscript.isPending}>
                      <Brain size={13} className="mr-1" /> {processTranscript.isPending ? "Processing with AI…" : "Process Transcript"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowTranscriptForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {(b?.boardCards ?? []).map(card => (
                <div key={card.id} className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: "#e5e7eb" }} onClick={() => setSelectedInsight(card.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{card.intervieweeType ?? "Interview"}</div>
                      <div className="text-xs text-gray-500 mt-1">Top pain: {card.topPain}</div>
                      {card.contradictions > 0 && <div className="text-xs text-amber-600 mt-0.5">⚠ {card.contradictions} contradiction flag(s)</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: parseFloat(card.opportunityScore as string || "0") >= 7 ? "#51AF37" : parseFloat(card.opportunityScore as string || "0") >= 5 ? "#F49C13" : "#EF4444" }}>
                        {parseFloat(card.opportunityScore as string || "0").toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">opp. score</div>
                      <div className="text-xs text-gray-300 mt-1">{new Date(card.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(b?.boardCards ?? []).length === 0 && (
                <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5e7eb" }}>
                  <Brain size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No transcripts processed yet. Click "Process Transcript" to begin.</p>
                </div>
              )}
            </div>
            {/* Selected insight detail */}
            {selectedInsight && insight.data && (
              <Card className="mt-4 border-2" style={{ borderColor: "#3A97D3" }}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Insight Detail</CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedInsight(null)}>Close</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-gray-700 mb-1">Pain Points</div>
                      {((insight.data.painPoints as Array<{ point: string; quote: string }>) ?? []).map((p, i) => (
                        <div key={i} className="mb-2 p-2 bg-red-50 rounded-lg"><div className="font-medium text-red-800">{p.point}</div><div className="text-red-600 italic mt-0.5">"{p.quote}"</div></div>
                      ))}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 mb-1">Hypotheses to Test</div>
                      {((insight.data.hypothesesToTest as Array<{ hypothesis: string; priority: number }>) ?? []).sort((a, b) => a.priority - b.priority).map((h, i) => (
                        <div key={i} className="mb-1 flex items-start gap-2"><span className="text-blue-600 font-bold">P{h.priority}</span><span className="text-gray-700">{h.hypothesis}</span></div>
                      ))}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 mb-1">Jobs to Be Done</div>
                      {((insight.data.jobsToBeDone as string[]) ?? []).map((j, i) => <div key={i} className="text-gray-600 mb-0.5">• {j}</div>)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 mb-1">Opportunity Rationale</div>
                      <div className="text-gray-600">{insight.data.opportunityRationale}</div>
                      {((insight.data.contradictionFlags as string[]) ?? []).length > 0 && (
                        <div className="mt-2"><div className="font-semibold text-amber-700 mb-1">Contradiction Flags</div>{(insight.data.contradictionFlags as string[]).map((c, i) => <div key={i} className="text-amber-600 mb-0.5">⚠ {c}</div>)}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Insight Board */}
        {activeTab === "board" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Top Pain Clusters</h3>
              {(b?.painClusters ?? []).map(([pain, count], i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="flex-1 text-xs text-gray-700 truncate">{pain}</div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min(count * 20, 80)}px` }} />
                    <span className="text-xs font-bold text-red-500">{count}x</span>
                  </div>
                </div>
              ))}
              {(b?.painClusters ?? []).length === 0 && <div className="text-xs text-gray-400">No pain clusters yet.</div>}
            </div>
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Validated Hypotheses (3+ signals)</h3>
              {(b?.validatedHypotheses ?? []).map((h, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-700">{h.hypothesis} <span className="text-green-600 font-bold">({h.count}x)</span></div>
                </div>
              ))}
              {(b?.validatedHypotheses ?? []).length === 0 && <div className="text-xs text-gray-400">No validated hypotheses yet (need 3+ signals).</div>}
            </div>
          </div>
        )}

        {/* Stage Gate Reviews */}
        {activeTab === "stagegate" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Stage Gate Reviews</h3>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowGateForm(!showGateForm)} style={{ borderColor: "#51AF37", color: "#51AF37" }}>
                <Plus size={13} /> New Gate Review
              </Button>
            </div>
            {showGateForm && (
              <Card className="mb-6 border-2" style={{ borderColor: "#51AF37" }}>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles size={16} /> AI Stage Gate Review</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div><Label className="text-xs mb-1 block">Venture Name</Label><Input value={gateForm.ventureName} onChange={e => setGateForm(f => ({ ...f, ventureName: e.target.value }))} className="h-8 text-xs" /></div>
                    <div>
                      <Label className="text-xs mb-1 block">Target Stage</Label>
                      <Select value={gateForm.targetStage} onValueChange={v => setGateForm(f => ({ ...f, targetStage: v as any }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{["discover","define","build","launch","spinout"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs mb-1 block">Submitted By</Label><Input value={gateForm.submittedBy} onChange={e => setGateForm(f => ({ ...f, submittedBy: e.target.value }))} className="h-8 text-xs" placeholder="Venture Lead" /></div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-xs mb-2 block">Evidence Status (per module)</Label>
                    <div className="space-y-2">
                      {(evidenceReqs.data?.[gateForm.targetStage] ?? []).map((req, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-6">{req.module}</span>
                          <span className="text-xs text-gray-700 flex-1">{req.docName}</span>
                          <Select defaultValue="missing" onValueChange={v => {
                            const updated = [...gateForm.evidenceList];
                            const idx = updated.findIndex(e => e.module === req.module && e.docName === req.docName);
                            if (idx >= 0) updated[idx] = { ...updated[idx], docStatus: v as any };
                            else updated.push({ module: req.module, docName: req.docName, docStatus: v as any });
                            setGateForm(f => ({ ...f, evidenceList: updated }));
                          }}>
                            <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["present","missing","needs_approval"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => initiateReview.mutate({ ventureId, ...gateForm })} disabled={!gateForm.submittedBy || initiateReview.isPending}>
                      <Sparkles size={13} className="mr-1" /> {initiateReview.isPending ? "Generating Review…" : "Generate Gate Review (AI)"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowGateForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="space-y-3">
              {(reviews.data ?? []).map(r => (
                <div key={r.id} className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: "#e5e7eb", borderLeft: `4px solid ${STAGE_COLORS[r.targetStage] ?? "#6B7280"}` }} onClick={() => setSelectedReview(r.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 capitalize">{r.targetStage} Gate</span>
                        <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge>
                        {r.recommendation && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECOMMENDATION_COLORS[r.recommendation] ?? ""}`}>{r.recommendation.replace(/_/g, " ").toUpperCase()}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Submitted by {r.submittedBy} · {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    {r.status === "submitted" && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={e => { e.stopPropagation(); approveReview.mutate({ reviewId: r.id, approvedBy: "Venture Lead" }); }}>
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(reviews.data ?? []).length === 0 && (
                <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5e7eb" }}>
                  <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No stage gate reviews yet. Click "New Gate Review" to generate one.</p>
                </div>
              )}
            </div>
            {/* Review detail */}
            {selectedReview && review.data && (
              <Card className="mt-4 border-2" style={{ borderColor: "#51AF37" }}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm capitalize">{review.data.review.targetStage} Gate Review — {review.data.review.recommendation?.replace(/_/g, " ").toUpperCase()}</CardTitle>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedReview(null)}>Close</Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="font-semibold text-xs text-gray-700 mb-2">Narrative Memo</div>
                    <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-sans border max-h-64 overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>{review.data.review.narrativeMemo}</pre>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-700 mb-2">Evidence Audit</div>
                    <div className="space-y-1">
                      {review.data.evidence.map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs">
                          {e.docStatus === "present" ? <CheckCircle size={12} className="text-green-500" /> : e.docStatus === "needs_approval" ? <Clock size={12} className="text-amber-500" /> : <XCircle size={12} className="text-red-400" />}
                          <span className="text-gray-500 w-6">{e.moduleNumber}</span>
                          <span className="text-gray-700">{e.docName}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium ${e.docStatus === "present" ? "bg-green-100 text-green-700" : e.docStatus === "needs_approval" ? "bg-amber-100 text-amber-700" : "bg-red-50 text-red-500"}`}>{e.docStatus.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
