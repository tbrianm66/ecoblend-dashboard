// ============================================================
// CULTURAL READINESS LEVEL (CRL) MODULE
// Based on Wasserman (2012) — 65% of high-potential startups
// fail due to co-founder conflict.
// 4 Tabs: Assessment | Results Review | Conflict Mediation | Monitoring
// ============================================================

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import QueryErrorBanner from "@/components/QueryErrorBanner";
import {
  Users,
  Brain,
  ShieldAlert,
  Activity,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  BarChart3,
  Zap,
  RefreshCw,
  Send,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function crlLevelLabel(level: number) {
  if (level >= 8) return "Exceptional";
  if (level >= 6) return "High";
  if (level >= 4) return "Moderate";
  if (level >= 2) return "Developing";
  return "Critical";
}

function crlColor(score: number) {
  if (score >= 0.7) return "#22c55e";
  if (score >= 0.4) return "#f59e0b";
  return "#ef4444";
}

function ReadinessBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-mono text-gray-500">
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Tab 1: Assessment ─────────────────────────────────────────────────────────
function AssessmentTab({ ventureId }: { ventureId: string }) {
  const [step, setStep] = useState<"setup" | "questions" | "complete">("setup");
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [h4Stage, setH4Stage] = useState<
    "H4.1_ideation" | "H4.2_build_launch" | "H4.3_validation" | "H4.4_grow_scale"
  >("H4.1_ideation");
  const [founderName, setFounderName] = useState("");
  const [founderId, setFounderId] = useState(1);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [responses, setResponses] = useState<
    Record<
      string,
      {
        questionId: string;
        questionPhase: "vision" | "operational" | "conflict";
        responseText: string;
        responseOption: string;
        confidenceLevel: number;
      }
    >
  >({});
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [aiReply, setAiReply] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const questionsData = trpc.crl.getQuestions.useQuery();
  const founders = trpc.crl.getVentureFounders.useQuery({ ventureId });
  if (questionsData.isError || founders.isError) return <QueryErrorBanner errors={[questionsData.error, founders.error]} message="Unable to load CRL assessment data. Please refresh." />;
  const createAssessment = trpc.crl.createAssessment.useMutation();
  const submitResponses = trpc.crl.submitFounderResponses.useMutation();
  const computeScore = trpc.crl.computeScore.useMutation();
  const aiChat = trpc.crl.aiAssessmentChat.useMutation();

  const phases = ["vision", "operational", "conflict"] as const;
  const allQuestions = questionsData.data
    ? [
        ...questionsData.data.vision,
        ...questionsData.data.operational,
        ...questionsData.data.conflict,
      ]
    : [];
  const phaseQuestions = questionsData.data
    ? questionsData.data[phases[currentPhaseIdx]]
    : [];
  const currentQ = phaseQuestions[currentQIdx];
  const totalAnswered = Object.keys(responses).length;
  const totalQuestions = allQuestions.length;

  const handleStartAssessment = async () => {
    if (!founderName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const result = await createAssessment.mutateAsync({
      ventureId,
      h4Stage,
      assessmentType: "initial",
    });
    setAssessmentId(result.assessmentId);
    setStep("questions");
    setChatHistory([]);
    setAiReply(
      `Welcome, ${founderName}! I'll guide you through the Cultural Readiness Level assessment. Let's start with your venture vision. ${allQuestions[0]?.text}`
    );
  };

  const handleSelectOption = async (option: string) => {
    if (!currentQ) return;
    const responseText = currentQ.options.find((o) => o.key === option)?.label ?? option;

    setResponses((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        questionPhase: currentQ.phase,
        responseText,
        responseOption: option,
        confidenceLevel: 3,
      },
    }));

    // AI follow-up
    setIsAiLoading(true);
    try {
      const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        ...chatHistory,
        { role: "user", content: responseText },
      ];
      const result = await aiChat.mutateAsync({
        assessmentId: assessmentId ?? 0,
        ventureId,
        founderName,
        currentQuestion: currentQ.text,
        founderResponse: responseText,
        conversationHistory: chatHistory,
      });
      const replyText = typeof result.reply === "string" ? result.reply : JSON.stringify(result.reply ?? "");
      newHistory.push({ role: "assistant", content: replyText });
      setChatHistory(newHistory);
      setAiReply(typeof result.reply === "string" ? result.reply : JSON.stringify(result.reply ?? ""));
    } catch {
      // continue without AI
    }
    setIsAiLoading(false);

    // Advance to next question
    if (currentQIdx < phaseQuestions.length - 1) {
      setCurrentQIdx((i) => i + 1);
    } else if (currentPhaseIdx < phases.length - 1) {
      setCurrentPhaseIdx((i) => i + 1);
      setCurrentQIdx(0);
    } else {
      // All questions answered — submit
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!assessmentId) return;
    const responseList = Object.values(responses);
    await submitResponses.mutateAsync({
      assessmentId,
      founderId,
      founderName,
      responses: responseList,
    });
    await computeScore.mutateAsync({ assessmentId });
    setStep("complete");
    toast.success("CRL Assessment completed!");
  };

  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto pt-6">
        <div
          className="rounded-2xl border p-8"
          style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#7c3aed15" }}
            >
              <Users size={20} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Prompt', sans-serif" }}
              >
                CRL Assessment Setup
              </h2>
              <p className="text-xs text-gray-500">
                10 questions across Vision, Operational, and Conflict dimensions
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="Enter your name as it appears in the venture"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                style={{ borderColor: "#e5e7eb" }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                H4 Stage
              </label>
              <Select value={h4Stage} onValueChange={(v) => setH4Stage(v as typeof h4Stage)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H4.1_ideation">H4.1 — Ideation</SelectItem>
                  <SelectItem value="H4.2_build_launch">H4.2 — Build & Launch</SelectItem>
                  <SelectItem value="H4.3_validation">H4.3 — Validation</SelectItem>
                  <SelectItem value="H4.4_grow_scale">H4.4 — Grow & Scale</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                CRL weighting in the VRL formula changes by stage. At H4.1, CRL carries 45% weight.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Vision", count: 3, color: "#7c3aed", icon: Brain },
              { label: "Operational", count: 3, color: "#0ea5e9", icon: BarChart3 },
              { label: "Conflict", count: 4, color: "#f59e0b", icon: ShieldAlert },
            ].map(({ label, count, color, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: `${color}30`, background: `${color}08` }}
              >
                <Icon size={16} style={{ color, margin: "0 auto 4px" }} />
                <div className="text-xs font-semibold" style={{ color }}>
                  {label}
                </div>
                <div className="text-xs text-gray-400">{count} questions</div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            style={{ background: "#7c3aed" }}
            onClick={handleStartAssessment}
            disabled={createAssessment.isPending}
          >
            {createAssessment.isPending ? "Starting..." : "Begin CRL Assessment"}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    const score = computeScore.data;
    return (
      <div className="max-w-2xl mx-auto pt-6">
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "#22c55e40", background: "#f0fdf4" }}
        >
          <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h2
            className="text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            Assessment Complete
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {founderName}'s CRL responses have been recorded and scored.
          </p>
          {score && (
            <div className="grid grid-cols-2 gap-4 text-left mb-6">
              <div
                className="rounded-xl p-4"
                style={{ background: "#fff", border: "1px solid #e5e7eb" }}
              >
                <div className="text-xs text-gray-400 mb-1">CRL Level</div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: crlColor(score.crlScore), fontFamily: "'Prompt', sans-serif" }}
                >
                  {score.crlLevel}/9
                </div>
                <div className="text-xs font-semibold" style={{ color: crlColor(score.crlScore) }}>
                  {crlLevelLabel(score.crlLevel)}
                </div>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: "#fff", border: "1px solid #e5e7eb" }}
              >
                <div className="text-xs text-gray-400 mb-1">Overall Alignment</div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: crlColor(score.overallAlignmentScore), fontFamily: "'Prompt', sans-serif" }}
                >
                  {(score.overallAlignmentScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">
                  {score.readinessLevel} readiness
                </div>
              </div>
            </div>
          )}
          {score && (
            <div className="text-left mb-6">
              <ReadinessBar
                label="Vision Alignment"
                score={score.visionScore}
                color="#7c3aed"
              />
              <ReadinessBar
                label="Operational Alignment"
                score={score.operationalScore}
                color="#0ea5e9"
              />
              <ReadinessBar
                label="Conflict Resolution"
                score={score.conflictScore}
                color="#f59e0b"
              />
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("setup");
              setResponses({});
              setChatHistory([]);
              setCurrentPhaseIdx(0);
              setCurrentQIdx(0);
              setFounderName("");
            }}
          >
            Start New Assessment
          </Button>
        </div>
      </div>
    );
  }

  // Questions step
  const phaseColors = { vision: "#7c3aed", operational: "#0ea5e9", conflict: "#f59e0b" };
  const currentPhase = phases[currentPhaseIdx];
  const phaseColor = phaseColors[currentPhase];
  const progress = (totalAnswered / totalQuestions) * 100;

  return (
    <div className="max-w-2xl mx-auto pt-4">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500">
            Question {totalAnswered + 1} of {totalQuestions}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${phaseColor}15`, color: phaseColor }}
          >
            {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: phaseColor }}
          />
        </div>
      </div>

      {/* AI facilitator message */}
      {aiReply && (
        <div
          className="rounded-xl p-4 mb-4 text-sm text-gray-700"
          style={{ background: `${phaseColor}08`, border: `1px solid ${phaseColor}20` }}
        >
          <div className="flex items-start gap-2">
            <Brain size={14} style={{ color: phaseColor, marginTop: 2, flexShrink: 0 }} />
            <span>{isAiLoading ? "Thinking..." : aiReply}</span>
          </div>
        </div>
      )}

      {/* Current question */}
      {currentQ && (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "#e5e7eb", background: "#fff" }}
        >
          <h3
            className="text-base font-bold text-gray-900 mb-1"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            {currentQ.text}
          </h3>
          <p className="text-xs text-gray-400 mb-5">{currentQ.subtext}</p>

          <div className="space-y-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                disabled={isAiLoading}
                className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50"
                style={{ borderColor: "#e5e7eb" }}
              >
                <span
                  className="inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3"
                  style={{ background: `${phaseColor}15`, color: phaseColor }}
                >
                  {opt.key}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Results Review ─────────────────────────────────────────────────────
function ResultsTab({ ventureId }: { ventureId: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<Record<string, unknown> | null>(null);

  const assessments = trpc.crl.listAssessments.useQuery({ ventureId });
  if (assessments.isError) return <QueryErrorBanner errors={[assessments.error]} message="Unable to load assessments. Please refresh." />;
  const getAssessment = trpc.crl.getAssessment.useQuery(
    { assessmentId: selectedId! },
    { enabled: !!selectedId }
  );
  const generateReview = trpc.crl.generateResultsReview.useMutation();

  const handleGenerateReview = async () => {
    if (!selectedId) return;
    const result = await generateReview.mutateAsync({
      assessmentId: selectedId,
      ventureId,
    });
    setReviewResult(result as Record<string, unknown>);
    toast.success("AI Results Review generated");
  };

  const list = assessments.data ?? [];

  return (
    <div className="flex gap-6 pt-4">
      {/* Left: Assessment list */}
      <div className="w-72 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Assessments</h3>
        {list.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-8">
            No assessments yet. Complete an assessment in the Assessment tab.
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedId(a.id);
                  setReviewResult(null);
                }}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  selectedId === a.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">
                    {a.assessmentType} assessment
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: a.status === "completed" ? "#22c55e" : "#f59e0b",
                      color: a.status === "completed" ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {a.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">{a.h4Stage}</div>
                {a.crlLevel && (
                  <div
                    className="text-sm font-bold mt-1"
                    style={{ color: crlColor(a.crlScore ?? 0) }}
                  >
                    CRL {a.crlLevel}/9 — {crlLevelLabel(a.crlLevel)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Review panel */}
      <div className="flex-1 min-w-0">
        {!selectedId ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Select an assessment to review
          </div>
        ) : (
          <div>
            {getAssessment.data && (
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    {
                      label: "CRL Level",
                      value: `${getAssessment.data.assessment.crlLevel ?? "—"}/9`,
                      color: crlColor(getAssessment.data.assessment.crlScore ?? 0),
                    },
                    {
                      label: "Vision",
                      value: `${((getAssessment.data.assessment.visionScore ?? 0) * 100).toFixed(0)}%`,
                      color: "#7c3aed",
                    },
                    {
                      label: "Operational",
                      value: `${((getAssessment.data.assessment.operationalScore ?? 0) * 100).toFixed(0)}%`,
                      color: "#0ea5e9",
                    },
                    {
                      label: "Conflict",
                      value: `${((getAssessment.data.assessment.conflictScore ?? 0) * 100).toFixed(0)}%`,
                      color: "#f59e0b",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-xl border p-3 text-center"
                      style={{ borderColor: `${color}30`, background: `${color}08` }}
                    >
                      <div className="text-xs text-gray-400 mb-1">{label}</div>
                      <div className="text-xl font-bold" style={{ color, fontFamily: "'Prompt', sans-serif" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="mb-4"
                  style={{ background: "#7c3aed" }}
                  onClick={handleGenerateReview}
                  disabled={generateReview.isPending}
                >
                  <Brain size={14} className="mr-1.5" />
                  {generateReview.isPending ? "Generating..." : "Generate AI Results Review"}
                </Button>
              </div>
            )}

            {reviewResult && (
              <div className="space-y-4">
                {Boolean(reviewResult.executiveSummary) && (
                  <div
                    className="rounded-xl p-4 text-sm text-gray-700"
                    style={{ background: "#f8f9fa", border: "1px solid #e5e7eb" }}
                  >
                    <div className="font-semibold text-gray-800 mb-1 text-xs uppercase tracking-widest">
                      Executive Summary
                    </div>
                    {String(reviewResult.executiveSummary ?? "")}
                  </div>
                )}

                {Boolean(reviewResult.criticalMisalignments) &&
                  (reviewResult.criticalMisalignments as string[]).length > 0 && (
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                    >
                      <div className="font-semibold text-red-700 mb-2 text-xs uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Critical Misalignments
                      </div>
                      <ul className="space-y-1">
                        {(reviewResult.criticalMisalignments as string[]).map((m, i) => (
                          <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                            <XCircle size={12} className="mt-0.5 flex-shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Boolean(reviewResult.actionPlan) &&
                  (reviewResult.actionPlan as Array<Record<string, string>>).length > 0 && (
                    <div>
                      <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-widest">
                        Action Plan
                      </div>
                      <div className="space-y-2">
                        {(reviewResult.actionPlan as Array<Record<string, string>>).map((a, i) => (
                          <div
                            key={i}
                            className="rounded-xl border p-3 flex items-start gap-3"
                            style={{ borderColor: "#e5e7eb" }}
                          >
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background:
                                  a.priority === "immediate"
                                    ? "#fef2f2"
                                    : a.priority === "short_term"
                                    ? "#fffbeb"
                                    : "#f0fdf4",
                                color:
                                  a.priority === "immediate"
                                    ? "#ef4444"
                                    : a.priority === "short_term"
                                    ? "#f59e0b"
                                    : "#22c55e",
                              }}
                            >
                              {a.priority}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800">{a.action}</div>
                              <div className="text-xs text-gray-400">
                                Owner: {a.owner} · {a.timeline}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Conflict Mediation ─────────────────────────────────────────────────
function MediationTab({ ventureId }: { ventureId: string }) {
  const [interventionId, setInterventionId] = useState<number | null>(null);
  const [interventionType, setInterventionType] = useState<
    "mediation" | "founders_agreement" | "coaching" | "conflict_resolution" | "check_in"
  >("check_in");
  const [triggeredBy, setTriggeredBy] = useState<
    "low_crl" | "misalignment_detected" | "founder_request" | "scheduled_review" | "drift_detected"
  >("founder_request");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [conflictContext, setConflictContext] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const interventions = trpc.crl.listInterventions.useQuery({ ventureId });
  const createIntervention = trpc.crl.createIntervention.useMutation();
  const mediationChat = trpc.crl.aiMediationChat.useMutation();
  const resolveIntervention = trpc.crl.resolveIntervention.useMutation();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleStartSession = async () => {
    const result = await createIntervention.mutateAsync({
      ventureId,
      triggeredBy,
      interventionType,
    });
    setInterventionId(result.interventionId);
    setChatHistory([
      {
        role: "assistant",
        content: `Session started. I'm here to facilitate a ${interventionType.replace("_", " ")} session. How can I help you today?`,
      },
    ]);
    toast.success("Mediation session started");
  };

  const handleSend = async () => {
    if (!message.trim() || !interventionId) return;
    const userMsg = message;
    setMessage("");
    const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [
      ...chatHistory,
      { role: "user", content: userMsg },
    ];
    setChatHistory(newHistory);

    const result = await mediationChat.mutateAsync({
      interventionId,
      ventureId,
      interventionType,
      userMessage: userMsg,
      conversationHistory: chatHistory,
      conflictContext,
    });
    setChatHistory([...newHistory, { role: "assistant", content: result.reply }]);
  };

  const typeColors: Record<string, string> = {
    mediation: "#7c3aed",
    founders_agreement: "#0ea5e9",
    coaching: "#22c55e",
    conflict_resolution: "#ef4444",
    check_in: "#f59e0b",
  };

  return (
    <div className="flex gap-6 pt-4">
      {/* Left: Session setup + history */}
      <div className="w-72 flex-shrink-0">
        {!interventionId ? (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-4">Start a Session</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Session Type
                </label>
                <Select
                  value={interventionType}
                  onValueChange={(v) => setInterventionType(v as typeof interventionType)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check_in">Routine Check-In</SelectItem>
                    <SelectItem value="mediation">Conflict Mediation</SelectItem>
                    <SelectItem value="founders_agreement">Founders' Agreement</SelectItem>
                    <SelectItem value="coaching">Executive Coaching</SelectItem>
                    <SelectItem value="conflict_resolution">Conflict Resolution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Triggered By
                </label>
                <Select
                  value={triggeredBy}
                  onValueChange={(v) => setTriggeredBy(v as typeof triggeredBy)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder_request">Founder Request</SelectItem>
                    <SelectItem value="low_crl">Low CRL Score</SelectItem>
                    <SelectItem value="misalignment_detected">Misalignment Detected</SelectItem>
                    <SelectItem value="scheduled_review">Scheduled Review</SelectItem>
                    <SelectItem value="drift_detected">Drift Detected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Context (optional)
                </label>
                <Textarea
                  value={conflictContext}
                  onChange={(e) => setConflictContext(e.target.value)}
                  placeholder="Brief description of the situation..."
                  className="text-xs resize-none"
                  rows={3}
                />
              </div>
            </div>

            <Button
              className="w-full text-sm"
              style={{ background: typeColors[interventionType] }}
              onClick={handleStartSession}
              disabled={createIntervention.isPending}
            >
              <MessageSquare size={14} className="mr-1.5" />
              Start Session
            </Button>
          </div>
        ) : (
          <div>
            <div
              className="rounded-xl border p-3 mb-3"
              style={{
                borderColor: `${typeColors[interventionType]}30`,
                background: `${typeColors[interventionType]}08`,
              }}
            >
              <div className="text-xs font-semibold" style={{ color: typeColors[interventionType] }}>
                Active: {interventionType.replace("_", " ")}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs mb-3"
              onClick={async () => {
                await resolveIntervention.mutateAsync({
                  interventionId,
                  resolutionAchieved: true,
                });
                setInterventionId(null);
                setChatHistory([]);
                interventions.refetch();
                toast.success("Session resolved");
              }}
            >
              <CheckCircle2 size={12} className="mr-1" />
              Mark Resolved
            </Button>
          </div>
        )}

        {/* Past interventions */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Past Sessions
          </h4>
          {(interventions.data ?? []).slice(0, 5).map((inv) => (
            <div
              key={inv.id}
              className="rounded-lg border p-2 mb-1.5 text-xs"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">
                  {inv.interventionType.replace("_", " ")}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: inv.status === "completed" ? "#22c55e" : "#f59e0b",
                    color: inv.status === "completed" ? "#22c55e" : "#f59e0b",
                  }}
                >
                  {inv.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {!interventionId ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Start a session to begin the AI-facilitated conversation
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto rounded-xl border p-4 mb-3 space-y-3"
              style={{ borderColor: "#e5e7eb", minHeight: 320, maxHeight: 400 }}
            >
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-xs rounded-xl px-4 py-2 text-sm"
                    style={{
                      background:
                        msg.role === "user"
                          ? typeColors[interventionType]
                          : "#f3f4f6",
                      color: msg.role === "user" ? "#fff" : "#374151",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {mediationChat.isPending && (
                <div className="flex justify-start">
                  <div
                    className="rounded-xl px-4 py-2 text-sm text-gray-500"
                    style={{ background: "#f3f4f6" }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="text-sm resize-none flex-1"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={mediationChat.isPending || !message.trim()}
                style={{ background: typeColors[interventionType] }}
                className="self-end"
              >
                <Send size={16} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Monitoring Dashboard ───────────────────────────────────────────────
function MonitoringTab({ ventureId }: { ventureId: string }) {
  const [crlCurrent, setCrlCurrent] = useState(0.65);
  const [frequency, setFrequency] = useState<"biweekly" | "monthly" | "quarterly">("monthly");
  const [healthReport, setHealthReport] = useState<Record<string, unknown> | null>(null);

  const records = trpc.crl.listMonitoringRecords.useQuery({ ventureId });
  if (records.isError) return <QueryErrorBanner errors={[records.error]} message="Unable to load monitoring records. Please refresh." />;
  const createRecord = trpc.crl.createMonitoringRecord.useMutation();
  const generateReport = trpc.crl.generateCulturalHealthReport.useMutation();
  const vrlWeights = trpc.crl.getVrlDynamicWeights.useQuery({ ventureId });

  const handleCreateRecord = async () => {
    const lastRecord = (records.data ?? [])[0];
    const result = await createRecord.mutateAsync({
      ventureId,
      frequency,
      crlScoreCurrent: crlCurrent,
      crlScorePrevious: lastRecord?.crlScoreCurrent ?? undefined,
    });
    records.refetch();

    if (result.escalationTriggered) {
      toast.error(`Escalation triggered! Drift level: ${result.driftLevel}`);
    } else if (result.driftDetected) {
      toast.warning(`Cultural drift detected. Level: ${result.driftLevel}`);
    } else {
      toast.success("Monitoring record created");
    }

    // Auto-generate report
    const report = await generateReport.mutateAsync({
      ventureId,
      monitoringId: result.monitoringId,
    });
    setHealthReport(report as Record<string, unknown>);
  };

  const driftColors = {
    none: "#22c55e",
    minor: "#f59e0b",
    moderate: "#f97316",
    critical: "#ef4444",
  };

  const healthColors = {
    healthy: "#22c55e",
    watch: "#f59e0b",
    critical: "#ef4444",
  };

  return (
    <div className="pt-4">
      {/* VRL Dynamic Weights Panel */}
      {vrlWeights.data && (
        <div
          className="rounded-2xl border p-5 mb-5"
          style={{ borderColor: "#7c3aed30", background: "#7c3aed08" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: "#7c3aed" }} />
            <h3 className="text-sm font-bold text-gray-800">
              VRL Dynamic Formula — CRL Integration
            </h3>
            <Badge
              variant="outline"
              className="text-xs ml-auto"
              style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
            >
              {vrlWeights.data.h4Stage}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              {
                label: "TRL (α)",
                weight: vrlWeights.data.alphaWeight,
                contrib: vrlWeights.data.trlContribution,
                color: "#1d4ed8",
              },
              {
                label: "BRL (β)",
                weight: vrlWeights.data.betaWeight,
                contrib: vrlWeights.data.brlContribution,
                color: "#0ea5e9",
              },
              {
                label: "CRL (γ)",
                weight: vrlWeights.data.gammaWeight,
                contrib: vrlWeights.data.crlContribution,
                color: "#7c3aed",
              },
            ].map(({ label, weight, contrib, color }) => (
              <div
                key={label}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: `${color}30`, background: `${color}08` }}
              >
                <div className="text-xs text-gray-400 mb-1">{label} Weight</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color, fontFamily: "'Prompt', sans-serif" }}
                >
                  {((weight ?? 0) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">
                  Contrib: {((contrib ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Computed VRL:</span>
            <span
              className="text-lg font-bold"
              style={{
                color: crlColor(vrlWeights.data.computedVrl ?? 0),
                fontFamily: "'Prompt', sans-serif",
              }}
            >
              {((vrlWeights.data.computedVrl ?? 0) * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">
              (Risk Index: {((vrlWeights.data.riskIndex ?? 0) * 100).toFixed(0)}% · Confidence:{" "}
              {((vrlWeights.data.confidenceScore ?? 0) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {/* New monitoring record */}
      <div
        className="rounded-2xl border p-5 mb-5"
        style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
      >
        <h3 className="text-sm font-bold text-gray-700 mb-4">Record Cultural Health Check-In</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Current CRL Score (0–1)
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={crlCurrent}
              onChange={(e) => setCrlCurrent(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              style={{ borderColor: "#e5e7eb" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Check-In Frequency
            </label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              style={{ background: "#7c3aed" }}
              onClick={handleCreateRecord}
              disabled={createRecord.isPending || generateReport.isPending}
            >
              <Activity size={14} className="mr-1.5" />
              {createRecord.isPending || generateReport.isPending ? "Processing..." : "Record & Analyse"}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Health Report */}
      {healthReport && (
        <div
          className="rounded-2xl border p-5 mb-5"
          style={{
            borderColor: `${healthColors[(healthReport.overallHealth as keyof typeof healthColors) ?? "healthy"]}30`,
            background: `${healthColors[(healthReport.overallHealth as keyof typeof healthColors) ?? "healthy"]}08`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} style={{ color: healthColors[(healthReport.overallHealth as keyof typeof healthColors) ?? "healthy"] }} />
            <h3 className="text-sm font-bold text-gray-800">AI Cultural Health Report</h3>
            <Badge
              variant="outline"
              className="text-xs ml-auto"
              style={{
                borderColor: healthColors[(healthReport.overallHealth as keyof typeof healthColors) ?? "healthy"],
                color: healthColors[(healthReport.overallHealth as keyof typeof healthColors) ?? "healthy"],
              }}
            >
              {String(healthReport.overallHealth ?? "").toUpperCase()}
            </Badge>
          </div>
          {Boolean(healthReport.headline) && (
            <p className="text-sm font-semibold text-gray-800 mb-2">
              {String(healthReport.headline ?? "")}
            </p>
          )}
          {Boolean(healthReport.driftAnalysis) && (
            <p className="text-sm text-gray-600 mb-3">{String(healthReport.driftAnalysis ?? "")}</p>
          )}
          {Boolean(healthReport.recommendations) && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Recommendations
              </div>
              <ul className="space-y-1">
                {(healthReport.recommendations as string[]).map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-green-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Monitoring history */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Monitoring History</h3>
        {(records.data ?? []).length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-8">
            No monitoring records yet. Record a check-in above.
          </div>
        ) : (
          <div className="space-y-2">
            {(records.data ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: driftColors[(r.driftLevel as keyof typeof driftColors) ?? "none"],
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                      CRL: {((r.crlScoreCurrent ?? 0) * 100).toFixed(0)}%
                    </span>
                    {r.crlScorePrevious !== null && r.crlScorePrevious !== undefined && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {(r.crlScoreCurrent ?? 0) >= r.crlScorePrevious ? (
                          <TrendingUp size={12} className="text-green-500" />
                        ) : (
                          <TrendingDown size={12} className="text-red-500" />
                        )}
                        from {(r.crlScorePrevious * 100).toFixed(0)}%
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: driftColors[(r.driftLevel as keyof typeof driftColors) ?? "none"],
                        color: driftColors[(r.driftLevel as keyof typeof driftColors) ?? "none"],
                      }}
                    >
                      {r.driftLevel} drift
                    </Badge>
                    {r.escalationTriggered && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: "#ef4444", color: "#ef4444" }}
                      >
                        ESCALATED
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Drift: {((r.driftScore ?? 0) * 100).toFixed(1)}% · {r.frequency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CulturalReadiness() {
  const { user } = useAuth();
  const ventures = trpc.ventures?.list?.useQuery?.() ?? { data: [] };
  const [ventureId, setVentureId] = useState<string>("");

  // Use a simple hardcoded venture list from the known data
  const venturesQuery = {
    data: [
      { id: "ecorace", name: "EcoRace" },
      { id: "ecocomp", name: "EcoComp" },
      { id: "ecopack", name: "EcoPack" },
      { id: "ecohealth", name: "EcoHealth" },
      { id: "ecosport", name: "EcoSport" },
      { id: "ecobuild", name: "EcoBuild" },
    ],
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#7c3aed15", color: "#7c3aed" }}
              >
                Cultural Intelligence
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-mono">Wasserman (2012)</span>
            </div>
            <h1
              className="text-2xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              Cultural Readiness Level (CRL)
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Systematic co-founder alignment assessment integrated into the VRL formula. 65% of
              high-potential startups fail due to co-founder conflict — CRL makes cultural risk
              measurable and manageable.
            </p>
          </div>

          {/* Venture selector */}
          <div className="flex items-center gap-3">
            <Select value={ventureId} onValueChange={setVentureId}>
              <SelectTrigger className="w-44 text-sm">
                <SelectValue placeholder="Select venture" />
              </SelectTrigger>
              <SelectContent>
                {(venturesQuery.data ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CRL dimension summary */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            {
              icon: Brain,
              label: "Vision Alignment",
              desc: "Shared mission, success definition, personal motivation",
              color: "#7c3aed",
              weight: "30%",
            },
            {
              icon: BarChart3,
              label: "Operational Alignment",
              desc: "Decision-making, equity, time commitment",
              color: "#0ea5e9",
              weight: "30%",
            },
            {
              icon: ShieldAlert,
              label: "Conflict Resolution",
              desc: "Disagreement handling, exit triggers, underperformance",
              color: "#f59e0b",
              weight: "40%",
            },
            {
              icon: Activity,
              label: "Continuous Monitoring",
              desc: "Drift detection, health reports, escalation triggers",
              color: "#22c55e",
              weight: "Ongoing",
            },
          ].map(({ icon: Icon, label, desc, color, weight }) => (
            <div
              key={label}
              className="rounded-xl border p-4"
              style={{ borderColor: `${color}30`, background: `${color}08` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-bold text-gray-700">{label}</span>
                <span
                  className="text-xs font-mono ml-auto px-1.5 py-0.5 rounded"
                  style={{ background: `${color}15`, color }}
                >
                  {weight}
                </span>
              </div>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 py-4">
        {!ventureId ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
          >
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Select a venture to begin</p>
            <p className="text-xs text-gray-400 mt-1">
              Choose a venture from the dropdown above to access CRL assessments
            </p>
          </div>
        ) : (
          <Tabs defaultValue="assessment">
            <TabsList className="mb-6">
              <TabsTrigger value="assessment" className="gap-1.5">
                <Brain size={14} />
                Assessment
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-1.5">
                <BarChart3 size={14} />
                Results Review
              </TabsTrigger>
              <TabsTrigger value="mediation" className="gap-1.5">
                <MessageSquare size={14} />
                Conflict Mediation
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="gap-1.5">
                <Activity size={14} />
                Monitoring Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assessment">
              <AssessmentTab ventureId={ventureId} />
            </TabsContent>
            <TabsContent value="results">
              <ResultsTab ventureId={ventureId} />
            </TabsContent>
            <TabsContent value="mediation">
              <MediationTab ventureId={ventureId} />
            </TabsContent>
            <TabsContent value="monitoring">
              <MonitoringTab ventureId={ventureId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
