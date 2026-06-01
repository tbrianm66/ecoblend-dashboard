// ============================================================
// CONSTITUTIONAL GOVERNANCE FORM
// Phase 5B — Mission Protection Framework
// Multi-step questionnaire for governance structure documentation
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Scale } from "lucide-react";

interface GovernanceFormData {
  // Founder Protection
  founderVetoRights: boolean;
  founderVetoScope: string;
  
  // Board Composition
  boardSize: number;
  founderSeats: number;
  independentSeats: number;
  investorSeats: number;
  missionAlignedSeats: number;
  
  // Stakeholder Rights
  employeeRepresentation: boolean;
  communityRepresentation: boolean;
  customerAdvisoryBoard: boolean;
  
  // Mission Protection
  missionClauseInBylaws: boolean;
  missionClauseText: string;
}

interface ConstitutionalGovernanceFormProps {
  onSubmit?: (data: GovernanceFormData) => void;
  initialData?: Partial<GovernanceFormData>;
}

const STEPS = [
  { id: "founder", label: "Founder Protection", icon: "🛡️" },
  { id: "board", label: "Board Composition", icon: "👥" },
  { id: "stakeholders", label: "Stakeholder Rights", icon: "🤝" },
  { id: "mission", label: "Mission Protection", icon: "🎯" },
];

export default function ConstitutionalGovernanceForm(props: ConstitutionalGovernanceFormProps) {
  const { onSubmit, initialData } = props;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<GovernanceFormData>({
    founderVetoRights: initialData?.founderVetoRights || false,
    founderVetoScope: initialData?.founderVetoScope || "",
    boardSize: initialData?.boardSize || 5,
    founderSeats: initialData?.founderSeats || 2,
    independentSeats: initialData?.independentSeats || 1,
    investorSeats: initialData?.investorSeats || 2,
    missionAlignedSeats: initialData?.missionAlignedSeats || 0,
    employeeRepresentation: initialData?.employeeRepresentation || false,
    communityRepresentation: initialData?.communityRepresentation || false,
    customerAdvisoryBoard: initialData?.customerAdvisoryBoard || false,
    missionClauseInBylaws: initialData?.missionClauseInBylaws || false,
    missionClauseText: initialData?.missionClauseText || "",
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

  const currentStepData = STEPS[currentStep];
  const completedSteps = currentStep;
  const progress = ((completedSteps + 1) / STEPS.length) * 100;

  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={16} style={{ color: "#7c3aed" }} />
          <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            Constitutional Governance Assessment
          </h2>
        </div>
        <p className="text-xs text-gray-500">
          Document governance structures that protect your mission from the six failure patterns in "Incorruptible"
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
      <div className="min-h-64 mb-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Founder Protection Mechanisms</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.founderVetoRights}
                  onChange={(e) => setFormData({ ...formData, founderVetoRights: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Founder Veto Rights</p>
                  <p className="text-xs text-gray-500">Founder can veto mission-critical decisions</p>
                </div>
              </label>

              {formData.founderVetoRights && (
                <div className="ml-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-xs font-medium text-gray-700 block mb-2">
                    Which decisions require founder veto?
                  </label>
                  <textarea
                    value={formData.founderVetoScope}
                    onChange={(e) => setFormData({ ...formData, founderVetoScope: e.target.value })}
                    placeholder="e.g., M&A, major pivots, mission-related policy changes..."
                    className="w-full text-xs border rounded-lg p-2"
                    style={{ borderColor: "#e5e7eb" }}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Founder veto rights protect against "Boardroom Betrayal" (#3) and "Succession Failure" (#4) by ensuring the founder can block decisions that compromise mission.
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Board Composition</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">
                  Total Board Seats: <strong>{formData.boardSize}</strong>
                </label>
                <input
                  type="range"
                  min="3"
                  max="9"
                  value={formData.boardSize}
                  onChange={(e) => setFormData({ ...formData, boardSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Founder Seats: <strong>{formData.founderSeats}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={formData.boardSize - 1}
                    value={formData.founderSeats}
                    onChange={(e) => setFormData({ ...formData, founderSeats: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Independent Seats: <strong>{formData.independentSeats}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={formData.boardSize - 1}
                    value={formData.independentSeats}
                    onChange={(e) => setFormData({ ...formData, independentSeats: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Investor Seats: <strong>{formData.investorSeats}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={formData.boardSize - 1}
                    value={formData.investorSeats}
                    onChange={(e) => setFormData({ ...formData, investorSeats: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Mission-Aligned Seats: <strong>{formData.missionAlignedSeats}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={formData.boardSize - 1}
                    value={formData.missionAlignedSeats}
                    onChange={(e) => setFormData({ ...formData, missionAlignedSeats: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                Total allocated: {formData.founderSeats + formData.independentSeats + formData.investorSeats + formData.missionAlignedSeats} / {formData.boardSize} seats
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Board composition protects against "Friendly Fire" (#1) and "Boardroom Betrayal" (#3) by ensuring mission-aligned voices have sufficient representation.
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Stakeholder Rights & Representation</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.employeeRepresentation}
                  onChange={(e) => setFormData({ ...formData, employeeRepresentation: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Employee Representation</p>
                  <p className="text-xs text-gray-500">Employee board seat or advisory role</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.communityRepresentation}
                  onChange={(e) => setFormData({ ...formData, communityRepresentation: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Community Representation</p>
                  <p className="text-xs text-gray-500">Community stakeholder on board or advisory</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerAdvisoryBoard}
                  onChange={(e) => setFormData({ ...formData, customerAdvisoryBoard: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Advisory Board</p>
                  <p className="text-xs text-gray-500">Regular customer feedback mechanism</p>
                </div>
              </label>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Stakeholder representation protects against "Mission Drift" (#6) by ensuring diverse perspectives on mission-critical decisions.
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Mission Protection in Bylaws</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.missionClauseInBylaws}
                  onChange={(e) => setFormData({ ...formData, missionClauseInBylaws: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Mission Clause in Bylaws</p>
                  <p className="text-xs text-gray-500">Explicit mission protection language in company bylaws</p>
                </div>
              </label>

              {formData.missionClauseInBylaws && (
                <div className="ml-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-xs font-medium text-gray-700 block mb-2">
                    Mission Protection Clause Text
                  </label>
                  <textarea
                    value={formData.missionClauseText}
                    onChange={(e) => setFormData({ ...formData, missionClauseText: e.target.value })}
                    placeholder="Document the specific mission protection language in your bylaws..."
                    className="w-full text-xs border rounded-lg p-2"
                    style={{ borderColor: "#e5e7eb" }}
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
              <strong>Why this matters:</strong> Formal mission protection clauses in bylaws provide legal protection against all six failure patterns by making mission preservation a fiduciary duty.
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
              <CheckCircle2 size={12} /> Save Governance Structure
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
