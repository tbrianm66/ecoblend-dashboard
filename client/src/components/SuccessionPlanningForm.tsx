// ============================================================
// SUCCESSION PLANNING QUESTIONNAIRE
// Phase 5C — Mission Protection Framework
// Multi-step form for leadership pipeline and mission continuity
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Users } from "lucide-react";

interface SuccessorCandidate {
  name: string;
  role: string;
  readinessScore: number; // 0-100
}

interface SuccessionFormData {
  currentCeo: string;
  ceoPlanningHorizon: number;
  potentialSuccessors: SuccessorCandidate[];
  founderIntentDocumented: boolean;
  founderIntentSummary: string;
  institutionalMemorySystem: boolean;
  missionCodexDocument: string;
  keyDecisionFrameworks: string;
  coreValuesDocumented: string;
}

interface SuccessionPlanningFormProps {
  onSubmit?: (data: SuccessionFormData) => void;
  initialData?: Partial<SuccessionFormData>;
}

const STEPS = [
  { id: "leadership", label: "Leadership Pipeline", icon: "👔" },
  { id: "founder", label: "Founder Intent", icon: "🎯" },
  { id: "memory", label: "Institutional Memory", icon: "📚" },
  { id: "values", label: "Core Values", icon: "💎" },
];

export default function SuccessionPlanningForm(props: SuccessionPlanningFormProps) {
  const { onSubmit, initialData } = props;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SuccessionFormData>({
    currentCeo: initialData?.currentCeo || "",
    ceoPlanningHorizon: initialData?.ceoPlanningHorizon || 5,
    potentialSuccessors: initialData?.potentialSuccessors || [
      { name: "", role: "", readinessScore: 0 },
      { name: "", role: "", readinessScore: 0 },
    ],
    founderIntentDocumented: initialData?.founderIntentDocumented || false,
    founderIntentSummary: initialData?.founderIntentSummary || "",
    institutionalMemorySystem: initialData?.institutionalMemorySystem || false,
    missionCodexDocument: initialData?.missionCodexDocument || "",
    keyDecisionFrameworks: initialData?.keyDecisionFrameworks || "",
    coreValuesDocumented: initialData?.coreValuesDocumented || "",
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const updateSuccessor = (index: number, field: string, value: any) => {
    const updated = [...formData.potentialSuccessors];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, potentialSuccessors: updated });
  };

  const addSuccessor = () => {
    setFormData({
      ...formData,
      potentialSuccessors: [...formData.potentialSuccessors, { name: "", role: "", readinessScore: 0 }],
    });
  };

  const removeSuccessor = (index: number) => {
    setFormData({
      ...formData,
      potentialSuccessors: formData.potentialSuccessors.filter((_, i) => i !== index),
    });
  };

  const currentStepData = STEPS[currentStep];
  const completedSteps = currentStep;
  const progress = ((completedSteps + 1) / STEPS.length) * 100;

  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} style={{ color: "#7c3aed" }} />
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Succession Planning Assessment
          </h2>
        </div>
        <p className="text-xs text-gray-500">
          Document leadership pipeline and mission continuity mechanisms to protect against "Succession Failure"
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#7c3aed" }}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: idx === currentStep ? "#ede9fe" : idx < currentStep ? "#dcfce7" : "#f3f4f6",
              color: idx === currentStep ? "#7c3aed" : idx < currentStep ? "#16a34a" : "#6b7280",
              border: `1px solid ${idx === currentStep ? "#d8b4fe" : idx < currentStep ? "#86efac" : "#e5e7eb"}`,
            }}
          >
            <span>{step.icon}</span>
            {idx < currentStep && <CheckCircle2 size={12} />}
            {step.label}
          </button>
        ))}
      </div>

      {/* Form content */}
      <div className="min-h-80 mb-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Leadership Pipeline</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Current CEO / Founder</label>
                <input
                  type="text"
                  value={formData.currentCeo}
                  onChange={(e) => setFormData({ ...formData, currentCeo: e.target.value })}
                  placeholder="Name"
                  className="w-full text-xs border rounded-lg p-2"
                  style={{ borderColor: "#e5e7eb" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  CEO Planning Horizon: <strong>{formData.ceoPlanningHorizon} years</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.ceoPlanningHorizon}
                  onChange={(e) => setFormData({ ...formData, ceoPlanningHorizon: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-[10px] text-gray-400 mt-1">Years until planned CEO transition</p>
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "#f3f4f6" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-900">Potential Successors</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addSuccessor}
                  className="text-xs"
                >
                  + Add Successor
                </Button>
              </div>

              <div className="space-y-3">
                {formData.potentialSuccessors.map((successor, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border" style={{ borderColor: "#f3f4f6" }}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={successor.name}
                        onChange={(e) => updateSuccessor(idx, "name", e.target.value)}
                        placeholder="Name"
                        className="text-xs border rounded p-1"
                        style={{ borderColor: "#e5e7eb" }}
                      />
                      <input
                        type="text"
                        value={successor.role}
                        onChange={(e) => updateSuccessor(idx, "role", e.target.value)}
                        placeholder="Current Role"
                        className="text-xs border rounded p-1"
                        style={{ borderColor: "#e5e7eb" }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={successor.readinessScore}
                        onChange={(e) => updateSuccessor(idx, "readinessScore", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs font-bold text-gray-600 w-8">{successor.readinessScore}%</span>
                      {formData.potentialSuccessors.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeSuccessor(idx)}
                          className="text-xs text-red-600"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> A documented leadership pipeline protects against "Succession Failure" (#4) by ensuring continuity planning is explicit and shared.
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Founder Intent Documentation</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.founderIntentDocumented}
                  onChange={(e) => setFormData({ ...formData, founderIntentDocumented: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Founder Intent Documented</p>
                  <p className="text-xs text-gray-500">Founder has formally documented mission intent and decision-making principles</p>
                </div>
              </label>

              {formData.founderIntentDocumented && (
                <div className="ml-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-xs font-medium text-gray-700 block mb-2">
                    Founder Intent Summary
                  </label>
                  <textarea
                    value={formData.founderIntentSummary}
                    onChange={(e) => setFormData({ ...formData, founderIntentSummary: e.target.value })}
                    placeholder="Document the founder's core mission, values, and non-negotiable principles..."
                    className="w-full text-xs border rounded-lg p-2"
                    style={{ borderColor: "#e5e7eb" }}
                    rows={5}
                  />
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Documented founder intent creates an "invisible leader" that guides decisions even after the founder steps down, protecting mission continuity.
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Institutional Memory System</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.institutionalMemorySystem}
                  onChange={(e) => setFormData({ ...formData, institutionalMemorySystem: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Institutional Memory System</p>
                  <p className="text-xs text-gray-500">Formal system to preserve mission, values, and decision-making principles</p>
                </div>
              </label>

              {formData.institutionalMemorySystem && (
                <div className="ml-6 space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Mission Codex Document
                    </label>
                    <textarea
                      value={formData.missionCodexDocument}
                      onChange={(e) => setFormData({ ...formData, missionCodexDocument: e.target.value })}
                      placeholder="Codified mission statement, core values, and decision-making principles..."
                      className="w-full text-xs border rounded-lg p-2"
                      style={{ borderColor: "#e5e7eb" }}
                      rows={4}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-xs font-medium text-gray-700 block mb-2">
                      Key Decision Frameworks
                    </label>
                    <textarea
                      value={formData.keyDecisionFrameworks}
                      onChange={(e) => setFormData({ ...formData, keyDecisionFrameworks: e.target.value })}
                      placeholder="Document key decision-making frameworks (e.g., how to evaluate mission trade-offs)..."
                      className="w-full text-xs border rounded-lg p-2"
                      style={{ borderColor: "#e5e7eb" }}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Institutional memory systems ensure mission knowledge is preserved and accessible to future leaders, preventing gradual mission drift.
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Core Values Documentation</h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-xs font-medium text-gray-700 block mb-2">
                  Core Values (Documented)
                </label>
                <textarea
                  value={formData.coreValuesDocumented}
                  onChange={(e) => setFormData({ ...formData, coreValuesDocumented: e.target.value })}
                  placeholder="List core values with definitions and concrete examples of how they guide decisions..."
                  className="w-full text-xs border rounded-lg p-2"
                  style={{ borderColor: "#e5e7eb" }}
                  rows={5}
                />
              </div>

              <div className="bg-green-50 p-3 rounded-lg border text-xs text-green-800" style={{ borderColor: "#bbf7d0" }}>
                <strong>Example:</strong>
                <div className="mt-2 font-mono text-[10px]">
                  • Sustainability First: All product decisions must have positive environmental impact<br/>
                  • Founder Mission: We will never sacrifice long-term impact for short-term profit<br/>
                  • Stakeholder Voice: Employees and community have veto rights on major decisions
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Documented core values create shared language and decision-making criteria that survive leadership transitions and protect mission integrity.
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#f3f4f6" }}>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="text-xs"
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs gap-1"
              style={{ background: "#7c3aed" }}
            >
              Next <ChevronRight size={12} />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              className="text-xs gap-1"
              style={{ background: "#16a34a" }}
            >
              <CheckCircle2 size={12} /> Save Succession Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
