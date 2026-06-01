// ============================================================
// CONSTITUTIONAL GOVERNANCE FORM
// Phase 5B — Mission Protection Framework
// Multi-step questionnaire with governance templates + live tRPC
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Scale, Shield, Users, BookOpen, ChevronRight, Loader2 } from "lucide-react";

interface GovernanceFormData {
  founderVetoRights: boolean;
  founderVetoScope: string;
  boardSize: number;
  founderSeats: number;
  independentSeats: number;
  investorSeats: number;
  missionAlignedSeats: number;
  employeeRepresentation: boolean;
  communityRepresentation: boolean;
  customerAdvisoryBoard: boolean;
  missionClauseInBylaws: boolean;
  missionClauseText: string;
}

const DEFAULT_VENTURE_ID = "bebus"; // BEBUS as default venture

const STEPS = [
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "founder", label: "Founder Protection", icon: Shield },
  { id: "board", label: "Board Composition", icon: Users },
  { id: "stakeholders", label: "Stakeholder Rights", icon: Users },
  { id: "mission", label: "Mission Protection", icon: Scale },
];

export default function ConstitutionalGovernanceForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVenture, setSelectedVenture] = useState(DEFAULT_VENTURE_ID);
  const [formData, setFormData] = useState<GovernanceFormData>({
    founderVetoRights: false,
    founderVetoScope: "",
    boardSize: 5,
    founderSeats: 2,
    independentSeats: 1,
    investorSeats: 2,
    missionAlignedSeats: 0,
    employeeRepresentation: false,
    communityRepresentation: false,
    customerAdvisoryBoard: false,
    missionClauseInBylaws: false,
    missionClauseText: "",
  });

  // tRPC queries and mutations
  const { data: templates, isLoading: templatesLoading } = trpc.constitutionalGovernance.getTemplates.useQuery();
  const { data: existing, isLoading: existingLoading } = trpc.constitutionalGovernance.get.useQuery({ ventureId: selectedVenture });
  const upsertMutation = trpc.constitutionalGovernance.upsert.useMutation({
    onSuccess: (result) => {
      toast.success(`Governance structure saved (compliance score: ${result.complianceScore}/100)`);
    },
    onError: () => toast.error("Failed to save governance structure"),
  });

  const applyTemplate = (template: any) => {
    setFormData({
      founderVetoRights: template.structure.founderVetoRights,
      founderVetoScope: template.structure.founderVetoScope,
      boardSize: template.structure.boardSize,
      founderSeats: template.structure.founderSeats,
      independentSeats: template.structure.independentSeats,
      investorSeats: template.structure.investorSeats,
      missionAlignedSeats: template.structure.missionAlignedSeats,
      employeeRepresentation: template.structure.employeeRepresentation,
      communityRepresentation: template.structure.communityRepresentation,
      customerAdvisoryBoard: template.structure.customerAdvisoryBoard,
      missionClauseInBylaws: template.structure.missionClauseInBylaws,
      missionClauseText: template.structure.missionClauseText,
    });
    toast.success(`Template "${template.name}" applied`);
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    upsertMutation.mutate({ ventureId: selectedVenture, ...formData });
  };

  // Calculate live compliance score
  const liveScore = (() => {
    let s = 0;
    if (formData.founderVetoRights) s += 25;
    if (formData.missionAlignedSeats > 0) s += 20;
    if (formData.employeeRepresentation) s += 15;
    if (formData.communityRepresentation) s += 15;
    if (formData.missionClauseInBylaws) s += 25;
    return s;
  })();

  const scoreColor = liveScore >= 80 ? "#16a34a" : liveScore >= 50 ? "#d97706" : "#dc2626";
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
      {/* Header with venture selector */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale size={16} style={{ color: "#7c3aed" }} />
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
                Constitutional Governance Assessment
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-xl">
              Document governance structures that protect your mission from boardroom betrayal, succession failure, and stakeholder misalignment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Compliance Score</div>
              <div className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{liveScore}/100</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${scoreColor}15`, border: `2px solid ${scoreColor}` }}>
              <span className="text-xs font-bold" style={{ color: scoreColor }}>{liveScore >= 80 ? "✓" : liveScore >= 50 ? "~" : "!"}</span>
            </div>
          </div>
        </div>

        {/* Venture selector */}
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
          {existingLoading && <Loader2 size={12} className="animate-spin text-gray-400" />}
          {existing && (
            <Badge className="text-[10px]" style={{ background: "#dcfce7", color: "#16a34a", border: "none" }}>
              Saved — score {existing.complianceScore}/100
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
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "#7c3aed" }} />
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
                  background: idx === currentStep ? "#ede9fe" : idx < currentStep ? "#dcfce7" : "#f3f4f6",
                  color: idx === currentStep ? "#7c3aed" : idx < currentStep ? "#16a34a" : "#6b7280",
                  border: `1px solid ${idx === currentStep ? "#d8b4fe" : idx < currentStep ? "#86efac" : "#e5e7eb"}`,
                }}
              >
                {idx < currentStep ? <CheckCircle2 size={11} /> : <Icon size={11} />}
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 0: Templates */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#e5e7eb" }}>
            <h3 className="font-semibold text-gray-900 mb-1">Governance Templates</h3>
            <p className="text-xs text-gray-500 mb-4">
              Start with a pre-built governance template or configure from scratch. Templates can be customised in subsequent steps.
            </p>
            {templatesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading templates...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {templates?.map(template => (
                  <div key={template.id} className="border rounded-xl p-5 hover:border-purple-300 transition-all" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                          <Badge className="text-[10px]" style={{
                            background: template.complianceScore >= 80 ? "#dcfce7" : template.complianceScore >= 60 ? "#fef3c7" : "#fee2e2",
                            color: template.complianceScore >= 80 ? "#16a34a" : template.complianceScore >= 60 ? "#d97706" : "#dc2626",
                            border: "none",
                          }}>
                            {template.complianceScore}/100
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{template.description}</p>
                        <p className="text-[10px] text-purple-600 font-medium">Best for: {template.suitableFor}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">Board Size</div>
                        <div className="font-semibold text-gray-900">{template.structure.boardSize} seats</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">Founder Veto</div>
                        <div className="font-semibold" style={{ color: template.structure.founderVetoRights ? "#16a34a" : "#dc2626" }}>
                          {template.structure.founderVetoRights ? "Yes" : "No"}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-gray-400 mb-0.5">Mission Clause</div>
                        <div className="font-semibold" style={{ color: template.structure.missionClauseInBylaws ? "#16a34a" : "#dc2626" }}>
                          {template.structure.missionClauseInBylaws ? "In bylaws" : "None"}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2 text-xs"
                      style={{ background: "#7c3aed" }}
                      onClick={() => applyTemplate(template)}
                    >
                      Apply Template <ChevronRight size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setCurrentStep(1)}
          >
            Configure from scratch
          </Button>
        </div>
      )}

      {/* Step 1: Founder Protection */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Founder Protection Mechanisms</h3>
            <p className="text-xs text-gray-500">Protect against Boardroom Betrayal (#3) and Succession Failure (#4) failure patterns</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={formData.founderVetoRights}
              onChange={(e) => setFormData({ ...formData, founderVetoRights: e.target.checked })}
              className="mt-1 accent-purple-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Founder Veto Rights</p>
              <p className="text-xs text-gray-500">Founder can veto mission-critical decisions that could compromise the venture's social purpose</p>
            </div>
          </label>

          {formData.founderVetoRights && (
            <div className="ml-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Which decisions require founder veto?
              </label>
              <textarea
                value={formData.founderVetoScope}
                onChange={(e) => setFormData({ ...formData, founderVetoScope: e.target.value })}
                placeholder="e.g., M&A transactions, major strategic pivots, mission-related policy changes, investor exits, leadership appointments..."
                className="w-full text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                style={{ borderColor: "#e5e7eb" }}
                rows={4}
              />
            </div>
          )}

          <div className="bg-amber-50 p-4 rounded-xl border text-xs text-amber-800" style={{ borderColor: "#fed7aa" }}>
            <strong>Why this matters (Failure Pattern #3 — Boardroom Betrayal):</strong> Without founder veto rights, investors or board members can redirect the venture away from its mission once it becomes financially successful. Veto rights create a constitutional safeguard.
          </div>
        </div>
      )}

      {/* Step 2: Board Composition */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Board Composition</h3>
            <p className="text-xs text-gray-500">Design a board structure that balances mission protection with governance quality</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">
              Total Board Seats: <strong className="text-purple-700">{formData.boardSize}</strong>
            </label>
            <input
              type="range" min="3" max="9" value={formData.boardSize}
              onChange={(e) => setFormData({ ...formData, boardSize: parseInt(e.target.value) })}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>3 (minimum)</span><span>9 (maximum)</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "founderSeats", label: "Founder Seats", color: "#7c3aed", description: "Seats controlled by founding team" },
              { key: "independentSeats", label: "Independent Seats", color: "#3b82f6", description: "Independent directors with no conflicts" },
              { key: "investorSeats", label: "Investor Seats", color: "#f59e0b", description: "Investor-nominated directors" },
              { key: "missionAlignedSeats", label: "Mission-Aligned Seats", color: "#16a34a", description: "Directors selected for mission alignment" },
            ].map(({ key, label, color, description }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {label}: <strong style={{ color }}>{formData[key as keyof GovernanceFormData] as number}</strong>
                </label>
                <p className="text-[10px] text-gray-400 mb-2">{description}</p>
                <input
                  type="range" min="0" max={formData.boardSize - 1}
                  value={formData[key as keyof GovernanceFormData] as number}
                  onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
                  className="w-full"
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          {/* Board composition visualiser */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-600 mb-2">Board Composition Preview</div>
            <div className="flex gap-1 h-8">
              {formData.founderSeats > 0 && (
                <div className="flex items-center justify-center text-[10px] text-white font-bold rounded-lg" style={{ width: `${(formData.founderSeats / formData.boardSize) * 100}%`, background: "#7c3aed" }}>
                  {formData.founderSeats}F
                </div>
              )}
              {formData.independentSeats > 0 && (
                <div className="flex items-center justify-center text-[10px] text-white font-bold rounded-lg" style={{ width: `${(formData.independentSeats / formData.boardSize) * 100}%`, background: "#3b82f6" }}>
                  {formData.independentSeats}I
                </div>
              )}
              {formData.investorSeats > 0 && (
                <div className="flex items-center justify-center text-[10px] text-white font-bold rounded-lg" style={{ width: `${(formData.investorSeats / formData.boardSize) * 100}%`, background: "#f59e0b" }}>
                  {formData.investorSeats}V
                </div>
              )}
              {formData.missionAlignedSeats > 0 && (
                <div className="flex items-center justify-center text-[10px] text-white font-bold rounded-lg" style={{ width: `${(formData.missionAlignedSeats / formData.boardSize) * 100}%`, background: "#16a34a" }}>
                  {formData.missionAlignedSeats}M
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#7c3aed" }} />Founder</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#3b82f6" }} />Independent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#f59e0b" }} />Investor</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#16a34a" }} />Mission-Aligned</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Stakeholder Rights */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Stakeholder Representation</h3>
            <p className="text-xs text-gray-500">Ensure key stakeholders have voice in governance decisions</p>
          </div>

          {[
            { key: "employeeRepresentation", label: "Employee Representation", description: "Employee board seat or formal advisory role in governance decisions", pattern: "Failure Pattern #5 — Stakeholder Misalignment" },
            { key: "communityRepresentation", label: "Community Representation", description: "Community stakeholder representation in governance (advisory board or observer seat)", pattern: "Failure Pattern #5 — Stakeholder Misalignment" },
            { key: "customerAdvisoryBoard", label: "Customer Advisory Board", description: "Formal customer feedback mechanism with governance input", pattern: "Failure Pattern #2 — Incremental Compromise" },
          ].map(({ key, label, description, pattern }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all border" style={{ borderColor: "#f3f4f6" }}>
              <input
                type="checkbox"
                checked={formData[key as keyof GovernanceFormData] as boolean}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                className="mt-1 accent-purple-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mb-1">{description}</p>
                <p className="text-[10px] text-purple-600">Addresses: {pattern}</p>
              </div>
            </label>
          ))}

          <div className="bg-blue-50 p-4 rounded-xl border text-xs text-blue-800" style={{ borderColor: "#bfdbfe" }}>
            <strong>Stakeholder voice prevents mission drift:</strong> When key stakeholders have formal governance roles, they can raise concerns before mission compromises become irreversible. This is especially important during growth phases when financial pressures increase.
          </div>
        </div>
      )}

      {/* Step 4: Mission Protection */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Mission Protection Clauses</h3>
            <p className="text-xs text-gray-500">Legally embed mission protection in company constitution</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={formData.missionClauseInBylaws}
              onChange={(e) => setFormData({ ...formData, missionClauseInBylaws: e.target.checked })}
              className="mt-1 accent-purple-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Mission Protection Clause in Bylaws</p>
              <p className="text-xs text-gray-500">Explicit constitutional commitment to social mission — the strongest form of mission protection</p>
            </div>
          </label>

          {formData.missionClauseInBylaws && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Mission Protection Clause Text
              </label>
              <textarea
                value={formData.missionClauseText}
                onChange={(e) => setFormData({ ...formData, missionClauseText: e.target.value })}
                placeholder="e.g., The company shall not take any action that materially undermines its social mission without a supermajority (75%) board vote and founder consent. Financial returns shall not be prioritised over mission delivery..."
                className="w-full text-xs border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
                style={{ borderColor: "#e5e7eb" }}
                rows={5}
              />
              <p className="text-[10px] text-gray-400 mt-1">This text will be reviewed by legal counsel before inclusion in company bylaws.</p>
            </div>
          )}

          {/* Compliance summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-700 mb-3">Governance Compliance Summary</div>
            <div className="space-y-2">
              {[
                { label: "Founder Veto Rights", value: formData.founderVetoRights, points: 25 },
                { label: "Mission-Aligned Board Seats", value: formData.missionAlignedSeats > 0, points: 20 },
                { label: "Employee Representation", value: formData.employeeRepresentation, points: 15 },
                { label: "Community Representation", value: formData.communityRepresentation, points: 15 },
                { label: "Mission Clause in Bylaws", value: formData.missionClauseInBylaws, points: 25 },
              ].map(({ label, value, points }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    {value ? (
                      <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "#e5e7eb" }} />
                    )}
                    <span className={value ? "text-gray-700" : "text-gray-400"}>{label}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: value ? "#16a34a" : "#9ca3af" }}>
                    {value ? `+${points}` : `+0/${points}`}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs font-semibold text-gray-700">Total Score</span>
                <span className="text-sm font-bold font-mono" style={{ color: scoreColor }}>{liveScore}/100</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            style={{ background: "#7c3aed" }}
            onClick={handleSubmit}
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 size={14} /> Save Governance Structure</>
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button
            size="sm"
            style={{ background: "#7c3aed" }}
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
