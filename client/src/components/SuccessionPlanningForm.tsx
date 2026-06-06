// ============================================================
// SUCCESSION PLANNING FORM
// Phase 5C — Mission Protection Framework
// Multi-step questionnaire with playbook + live tRPC
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2, ChevronRight, Users, BookOpen, Loader2,
  Target, Shield, FileText, ArrowRight, Clock
} from "lucide-react";

const DEFAULT_VENTURE_ID = "bebus"; // BEBUS as default venture

const STEPS = [
  { id: "playbook", label: "Playbook", icon: BookOpen },
  { id: "pipeline", label: "Leadership Pipeline", icon: Users },
  { id: "founder", label: "Founder Intent", icon: Target },
  { id: "memory", label: "Institutional Memory", icon: FileText },
];

const READINESS_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Not Ready", color: "#dc2626" },
  2: { label: "Early Stage", color: "#f59e0b" },
  3: { label: "Developing", color: "#d97706" },
  4: { label: "Nearly Ready", color: "#16a34a" },
  5: { label: "Ready Now", color: "#059669" },
};

interface Successor {
  name: string;
  role: string;
  readinessScore: number;
  developmentAreas: string;
  timeline: string;
}

interface SuccessionFormData {
  successors: Successor[];
  founderMissionStatement: string;
  founderNonNegotiables: string;
  founderTransitionTimeline: string;
  missionCodified: boolean;
  missionCodexText: string;
  decisionFrameworkDocumented: boolean;
  coreValuesDocumented: boolean;
  stakeholderRelationshipsDocumented: boolean;
}

export default function SuccessionPlanningForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVenture, setSelectedVenture] = useState(DEFAULT_VENTURE_ID);
  const [formData, setFormData] = useState<SuccessionFormData>({
    successors: [
      { name: "", role: "CEO", readinessScore: 1, developmentAreas: "", timeline: "12-18 months" },
    ],
    founderMissionStatement: "",
    founderNonNegotiables: "",
    founderTransitionTimeline: "3-5 years",
    missionCodified: false,
    missionCodexText: "",
    decisionFrameworkDocumented: false,
    coreValuesDocumented: false,
    stakeholderRelationshipsDocumented: false,
  });

  const { data: playbook, isLoading: playbookLoading } = trpc.successionPlanning.getPlaybook.useQuery();
  const { data: existing } = trpc.successionPlanning.get.useQuery({ ventureId: selectedVenture });
  const upsertMutation = trpc.successionPlanning.upsert.useMutation({
    onSuccess: () => toast.success("Succession plan saved successfully"),
    onError: () => toast.error("Failed to save succession plan"),
  });

  const handleSubmit = () => {
    upsertMutation.mutate({ ventureId: selectedVenture, ...formData });
  };

  const addSuccessor = () => {
    setFormData({
      ...formData,
      successors: [...formData.successors, { name: "", role: "CTO", readinessScore: 1, developmentAreas: "", timeline: "12-18 months" }],
    });
  };

  const updateSuccessor = (idx: number, field: keyof Successor, value: string | number) => {
    const updated = [...formData.successors];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, successors: updated });
  };

  const removeSuccessor = (idx: number) => {
    setFormData({ ...formData, successors: formData.successors.filter((_, i) => i !== idx) });
  };

  const memoryScore = [
    formData.missionCodified,
    formData.decisionFrameworkDocumented,
    formData.coreValuesDocumented,
    formData.stakeholderRelationshipsDocumented,
  ].filter(Boolean).length * 25;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Load live ventures from database
  const { data: ventureList } = trpc.ventures.list.useQuery();
  const VENTURES = (ventureList || []).filter((v: any) => !v.isInternalLab).map((v: any) => ({
    id: v.id,
    name: v.name,
    color: v.color || "#51AF37",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} style={{ color: "#0891b2" }} />
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Succession Planning
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-xl">
              Ensure mission continuity through leadership transitions. Document founder intent, build leadership pipeline, and codify institutional memory.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Memory Score</div>
            <div className="text-2xl font-bold font-mono" style={{ color: memoryScore >= 75 ? "#16a34a" : memoryScore >= 50 ? "#d97706" : "#dc2626" }}>
              {memoryScore}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Venture:</span>
          <div className="flex gap-1">
            {VENTURES.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVenture(v.id)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: selectedVenture === v.id ? `${v.color}15` : "transparent",
                  color: selectedVenture === v.id ? v.color : "#6b7280",
                  border: `1px solid ${selectedVenture === v.id ? v.color : "#e5e7eb"}`,
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
          {existing && (
            <Badge className="text-[10px]" style={{ background: "#dcfce7", color: "#16a34a", border: "none" }}>
              Plan saved
            </Badge>
          )}
        </div>
      </div>

      {/* Progress + Step nav */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-600">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="text-xs text-gray-500">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100 mb-3">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "#0891b2" }} />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: idx === currentStep ? "#e0f2fe" : idx < currentStep ? "#dcfce7" : "#f3f4f6",
                  color: idx === currentStep ? "#0891b2" : idx < currentStep ? "#16a34a" : "#6b7280",
                  border: `1px solid ${idx === currentStep ? "#bae6fd" : idx < currentStep ? "#86efac" : "#e5e7eb"}`,
                }}
              >
                {idx < currentStep ? <CheckCircle2 size={11} /> : <Icon size={11} />}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 0: Playbook */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {playbookLoading ? (
            <div className="bg-white rounded-xl border p-6 flex items-center gap-2 text-sm text-gray-400" style={{ borderColor: "#e5e7eb" }}>
              <Loader2 size={14} className="animate-spin" /> Loading playbook...
            </div>
          ) : playbook ? (
            <>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} style={{ color: "#0891b2" }} />
                  <h3 className="font-semibold text-gray-900">{playbook.title}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{playbook.subtitle}</p>
                <div className="grid grid-cols-1 gap-4">
                  {playbook.phases.map((phase: any, idx: number) => (
                    <div key={idx} className="border rounded-xl p-4" style={{ borderColor: "#e5e7eb" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0891b2" }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{phase.title}</div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={9} />
                            {phase.timeline}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 ml-8">
                        {phase.actions.map((action: string, aIdx: number) => (
                          <div key={aIdx} className="flex items-start gap-2 text-xs text-gray-600">
                            <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: "#0891b2" }} />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="font-semibold text-gray-900 mb-3">Key Succession Principles</h3>
                <div className="grid grid-cols-2 gap-3">
                  {playbook.keyPrinciples.map((principle: any, idx: number) => (
                    <div key={idx} className="bg-cyan-50 rounded-xl p-3 border border-cyan-100">
                      <div className="text-sm font-semibold text-cyan-800 mb-1">{principle.title}</div>
                      <div className="text-xs text-cyan-700">{principle.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
                <h3 className="font-semibold text-gray-900 mb-3">Warning Signs to Watch</h3>
                <div className="space-y-2">
                  {playbook.warningSigns.map((sign: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                      <Shield size={11} className="mt-0.5 text-amber-600 flex-shrink-0" />
                      {sign}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          <Button size="sm" className="w-full gap-2" style={{ background: "#0891b2" }} onClick={() => setCurrentStep(1)}>
            Start Planning <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Step 1: Leadership Pipeline */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Leadership Pipeline</h3>
            <p className="text-xs text-gray-500">Identify and assess potential successors for key leadership roles</p>
          </div>
          {formData.successors.map((successor, idx) => {
            const readiness = READINESS_LABELS[successor.readinessScore] || READINESS_LABELS[1];
            return (
              <div key={idx} className="border rounded-xl p-4 space-y-3" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Successor #{idx + 1}</span>
                  {formData.successors.length > 1 && (
                    <button onClick={() => removeSuccessor(idx)} className="text-[10px] text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
                    <input
                      type="text" value={successor.name}
                      onChange={(e) => updateSuccessor(idx, "name", e.target.value)}
                      placeholder="Full name"
                      className="w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      style={{ borderColor: "#e5e7eb" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Role</label>
                    <select
                      value={successor.role}
                      onChange={(e) => updateSuccessor(idx, "role", e.target.value)}
                      className="w-full text-xs border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      {["CEO", "CTO", "COO", "CFO", "CPO", "Managing Director", "Executive Director"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Readiness: <strong style={{ color: readiness.color }}>{readiness.label}</strong>
                  </label>
                  <input
                    type="range" min="1" max="5" value={successor.readinessScore}
                    onChange={(e) => updateSuccessor(idx, "readinessScore", parseInt(e.target.value))}
                    className="w-full" style={{ accentColor: readiness.color }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Not Ready</span><span>Ready Now</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Development Areas</label>
                  <textarea
                    value={successor.developmentAreas}
                    onChange={(e) => updateSuccessor(idx, "developmentAreas", e.target.value)}
                    placeholder="e.g., stakeholder management, financial literacy, mission alignment..."
                    className="w-full text-xs border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    style={{ borderColor: "#e5e7eb" }}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Readiness Timeline</label>
                  <select
                    value={successor.timeline}
                    onChange={(e) => updateSuccessor(idx, "timeline", e.target.value)}
                    className="w-full text-xs border rounded-lg p-2"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    {["6 months", "12-18 months", "2-3 years", "3-5 years", "5+ years"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={addSuccessor}>
            <Users size={12} /> Add Successor
          </Button>
        </div>
      )}

      {/* Step 2: Founder Intent */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Founder Intent Documentation</h3>
            <p className="text-xs text-gray-500">Codify your vision and non-negotiables to guide future leadership</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Founder Mission Statement</label>
            <p className="text-[10px] text-gray-400 mb-2">In your own words, what is the core purpose of this venture that must never be compromised?</p>
            <textarea
              value={formData.founderMissionStatement}
              onChange={(e) => setFormData({ ...formData, founderMissionStatement: e.target.value })}
              placeholder="e.g., We exist to demonstrate that sustainable materials can be commercially viable at scale..."
              className="w-full text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
              style={{ borderColor: "#e5e7eb" }}
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Non-Negotiables</label>
            <p className="text-[10px] text-gray-400 mb-2">What are the absolute boundaries that future leaders must respect, regardless of financial pressure?</p>
            <textarea
              value={formData.founderNonNegotiables}
              onChange={(e) => setFormData({ ...formData, founderNonNegotiables: e.target.value })}
              placeholder="e.g., We will never use virgin plastics. We will never compromise on living wage standards..."
              className="w-full text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
              style={{ borderColor: "#e5e7eb" }}
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">Founder Transition Timeline</label>
            <select
              value={formData.founderTransitionTimeline}
              onChange={(e) => setFormData({ ...formData, founderTransitionTimeline: e.target.value })}
              className="w-full text-xs border rounded-lg p-2"
              style={{ borderColor: "#e5e7eb" }}
            >
              {["1-2 years", "3-5 years", "5-10 years", "10+ years", "No planned transition"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border text-xs text-blue-800" style={{ borderColor: "#bfdbfe" }}>
            <strong>Failure Pattern #4 — Succession Failure:</strong> The most common cause of mission drift is a founder transition without documented intent. Future leaders make decisions based on what they think the founder wanted, not what was actually intended.
          </div>
        </div>
      )}

      {/* Step 3: Institutional Memory */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Institutional Memory System</h3>
            <p className="text-xs text-gray-500">Codify the knowledge and culture that makes this venture unique</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all border" style={{ borderColor: "#f3f4f6" }}>
            <input
              type="checkbox" checked={formData.missionCodified}
              onChange={(e) => setFormData({ ...formData, missionCodified: e.target.checked })}
              className="mt-1 accent-cyan-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Mission Codex</p>
              <p className="text-xs text-gray-500">Formal written document defining the mission, values, and purpose</p>
            </div>
          </label>
          {formData.missionCodified && (
            <div className="ml-6">
              <textarea
                value={formData.missionCodexText}
                onChange={(e) => setFormData({ ...formData, missionCodexText: e.target.value })}
                placeholder="Write your mission codex — the definitive statement of why this venture exists, what it stands for, and how it will be measured..."
                className="w-full text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400"
                style={{ borderColor: "#e5e7eb" }}
                rows={4}
              />
            </div>
          )}

          {[
            { key: "decisionFrameworkDocumented", label: "Decision Framework", description: "How decisions are made — criteria, process, and who has final say on mission-critical choices" },
            { key: "coreValuesDocumented", label: "Core Values Documentation", description: "Behavioural values with specific examples of what they look like in practice" },
            { key: "stakeholderRelationshipsDocumented", label: "Stakeholder Relationship Map", description: "Key relationships, their history, and how they should be maintained through transitions" },
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all border" style={{ borderColor: "#f3f4f6" }}>
              <input
                type="checkbox"
                checked={formData[key as keyof SuccessionFormData] as boolean}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                className="mt-1 accent-cyan-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </label>
          ))}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">Institutional Memory Score</div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${memoryScore}%`, background: memoryScore >= 75 ? "#16a34a" : memoryScore >= 50 ? "#d97706" : "#dc2626" }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{memoryScore}% documented</span>
              <span style={{ color: memoryScore >= 75 ? "#16a34a" : memoryScore >= 50 ? "#d97706" : "#dc2626" }}>
                {memoryScore >= 75 ? "Strong" : memoryScore >= 50 ? "Moderate" : "At Risk"}
              </span>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            style={{ background: "#0891b2" }}
            onClick={handleSubmit}
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 size={14} /> Save Succession Plan</>
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline" size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button size="sm" style={{ background: "#0891b2" }} onClick={() => setCurrentStep(currentStep + 1)}>
            Next <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
