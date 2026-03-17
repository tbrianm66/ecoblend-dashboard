// ============================================================
// ECOBLEND — Founder Onboarding Wizard
// 4-step wizard aligned to EcoBlend VBS Playbook stages
// Auto-populates the venture portfolio on completion
// ============================================================

import { useState } from "react";
import { useLocation } from "wouter";
import { useVentures } from "@/contexts/VentureContext";
import { Venture, VRL_STAGES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Rocket, FlaskConical,
  TrendingUp, Users, Target, BookOpen, Lightbulb, Building2, Shuffle, GitBranch
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    title: "Venture Fundamentals",
    subtitle: "EcoBlend Playbook Tasks 1–17",
    icon: BookOpen,
    color: "#22c55e",
    description: "Define the core identity of your venture — its name, sector, channel, and the hypothesis you are testing.",
    tasks: [
      "Supply & Demand analysis complete",
      "Target market defined",
      "Business Model Canvas (BMC) drafted",
      "Mission Model Canvas (MMC) drafted",
      "Value proposition articulated",
      "Revenue streams identified",
      "Nominated charity selected",
    ],
  },
  {
    id: 2,
    title: "Kickoff — Problem & Solution",
    subtitle: "EcoBlend Playbook Tasks 18–43",
    icon: Lightbulb,
    color: "#f59e0b",
    description: "Validate the problem with real beneficiaries, define your solution, and align your mission with your business plan.",
    tasks: [
      "Problem statement defined",
      "Beneficiary discovery interviews (minimum 20)",
      "Solution hypothesis formulated",
      "Plan Mission documented",
      "Customer persona created",
      "Brand identity initiated",
      "Competitive landscape mapped",
    ],
  },
  {
    id: 3,
    title: "Go-to-Market",
    subtitle: "EcoBlend Playbook Tasks 44–75",
    icon: Target,
    color: "#1d4ed8",
    description: "Set up operations, build your team, and prepare to launch your MVP to your first customers.",
    tasks: [
      "Legal structure registered",
      "ESOP structure agreed",
      "ZINC VC stipend applied for",
      "Operations workflow designed",
      "Sales process defined",
      "Marketing strategy drafted",
      "MVP scope defined",
    ],
  },
  {
    id: 4,
    title: "Founder Profile",
    subtitle: "Your details & ESOP agreement",
    icon: Users,
    color: "#7c3aed",
    description: "Complete your founder profile so the VBS can assign your ZINC VC stipend, ESOP allocation, and mentor support.",
    tasks: [
      "Founder background confirmed",
      "ESOP equity allocation agreed",
      "VBS mentor assigned",
      "EcoBlend Playbook account created",
      "First 30-day sprint planned",
    ],
  },
];

const SECTOR_OPTIONS = [
  "Sustainable Transport",
  "Entertainment / Creative Tech",
  "Sports / Performance Tech",
  "Deep Tech / Materials Science",
  "Clean Energy",
  "AgriTech / FoodTech",
  "HealthTech",
  "EdTech",
  "Other",
];

const CHARITY_OPTIONS = [
  "EcoRace Foundation — Vulnerable children & adults through technology",
  "Clean Mobility Foundation — Sustainable transport access",
  "Arts Access Alliance — Arts and cultural inclusion for youth",
  "Sport for All Foundation — Sport participation and youth wellbeing",
  "Other — Specify in notes",
];

const BRAND_COLORS = ["#22c55e", "#0891b2", "#7c3aed", "#dc2626", "#f59e0b", "#059669", "#1d4ed8", "#ec4899"];

interface FormData {
  ventureName: string;
  tagline: string;
  sector: string;
  channel: "B2B" | "D2C" | "";
  founderName: string;
  founderEmail: string;
  nominatedCharity: string;
  brandColor: string;
  bmc: string;
  mmc: string;
  checkedTasks: Record<string, boolean>;
}

export default function FounderOnboarding() {
  const [, navigate] = useLocation();
  const { addVenture } = useVentures();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    ventureName: "",
    tagline: "",
    sector: "",
    channel: "",
    founderName: "",
    founderEmail: "",
    nominatedCharity: "",
    brandColor: "#22c55e",
    bmc: "",
    mmc: "",
    checkedTasks: {},
  });
  const [completed, setCompleted] = useState(false);

  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;
  const totalTasks = STEPS.flatMap(s => s.tasks).length;
  const checkedCount = Object.values(form.checkedTasks).filter(Boolean).length;
  const progress = Math.round((step - 1) / STEPS.length * 100);

  const toggleTask = (taskKey: string) => {
    setForm(f => ({ ...f, checkedTasks: { ...f.checkedTasks, [taskKey]: !f.checkedTasks[taskKey] } }));
  };

  const canProceed = () => {
    if (step === 1) return form.ventureName.trim().length >= 2 && form.sector && form.channel;
    if (step === 4) return form.founderName.trim().length >= 2;
    return true;
  };

  const handleComplete = () => {
    const newVenture: Venture = {
      id: nanoid(8),
      name: form.ventureName,
      tagline: form.tagline || `${form.sector} venture`,
      sector: form.sector,
      channel: form.channel as "B2B" | "D2C",
      status: "Pre-Launch",
      vrl: 1,
      vrlPercent: Math.round((checkedCount / totalTasks) * 100),
      trl: 1,
      trlPercent: 0,
      nominatedCharity: form.nominatedCharity.split(" — ")[0] || "TBC",
      charityFocus: form.nominatedCharity.split(" — ")[1] || "Social impact",
      founder: form.founderName,
      color: form.brandColor,
      investmentReady: false,
      description: `${form.ventureName} is a ${form.channel} venture in the ${form.sector} sector, onboarded through the EcoBlend VBS Founder Playbook.`,
      bmc: form.bmc || "To be defined in VRL Stage 1",
      mmc: form.mmc || "To be defined in VRL Stage 1",
      risks: [
        { domain: "Business", level: "Medium", mitigation: "Beneficiary discovery interviews to validate problem-solution fit" },
        { domain: "Technical", level: "Medium", mitigation: "EcoRace support from TRL 1 baseline" },
        { domain: "People", level: "Low", mitigation: "ZINC VC stipend and ESOP structure in place" },
      ],
      milestones: [
        { label: "Onboarding Complete", completed: true, date: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }) },
        { label: "BMC / MMC Validated", completed: false },
        { label: "20 Beneficiary Interviews", completed: false },
        { label: "MVP Defined", completed: false },
      ],
    };
    addVenture(newVenture);
    setCompleted(true);
    toast.success(`${form.ventureName} added to the portfolio!`, {
      description: "Your venture card is now live on the dashboard.",
    });
  };

  if (completed) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#f9fafb" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#f0fdf4" }}>
            <CheckCircle2 size={40} style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Welcome to the VBS, {form.founderName.split(" ")[0]}!
          </h2>
          <p className="text-gray-500 mb-2">
            <strong style={{ color: form.brandColor }}>{form.ventureName}</strong> has been added to the EcoBlend portfolio at VRL 1 — Fundamentals.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Your next step is to complete Tasks 1–17 in the EcoBlend VBS Playbook and update your VRL progress on the dashboard.
          </p>
          <div className="space-y-3">
            <Button className="w-full gap-2" style={{ background: form.brandColor, color: "white" }} onClick={() => navigate("/matching")}>
              <Shuffle size={15} /> Find Founder Matches &amp; Opportunities
            </Button>
            <Button className="w-full gap-2" variant="outline" style={{ borderColor: "#3A97D3", color: "#3A97D3" }} onClick={() => navigate("/spinoff")}>
              <GitBranch size={15} /> Launch Spin-Off OS
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <Rocket size={15} /> View Portfolio Dashboard
            </Button>
            <Button variant="outline" className="w-full text-gray-400" onClick={() => { setCompleted(false); setStep(1); setForm({ ventureName: "", tagline: "", sector: "", channel: "", founderName: "", founderEmail: "", nominatedCharity: "", brandColor: "#22c55e", bmc: "", mmc: "", checkedTasks: {} }); }}>
              Onboard Another Founder
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="vos-page-header">
        <div className="flex items-center gap-3 mb-1">
          <Rocket size={16} style={{ color: "#22c55e" }} />
          <span className="vos-badge vos-badge-success" style={{ fontSize: "0.65rem" }}>Onboarding</span>
        </div>
        <h1 className="vos-page-title mb-1">Founder Onboarding Wizard</h1>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>EcoBlend VBS · EcoBlend VBS Playbook</p>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step > s.id ? "#22c55e" : step === s.id ? s.color : "#e5e7eb",
                    color: step >= s.id ? "white" : "#9ca3af",
                  }}
                >
                  {step > s.id ? <CheckCircle2 size={14} /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 w-16 md:w-24 lg:w-32" style={{ background: step > s.id ? "#22c55e" : "#e5e7eb" }} />
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 text-center">Step {step} of {STEPS.length} · {checkedCount}/{totalTasks} tasks checked</div>
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          {/* Step header */}
          <div className="px-6 py-5 border-b" style={{ borderColor: "#f3f4f6", background: `${currentStep.color}08` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${currentStep.color}20` }}>
                <StepIcon size={18} style={{ color: currentStep.color }} />
              </div>
              <div>
                <div className="font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{currentStep.title}</div>
                <div className="text-xs font-mono" style={{ color: currentStep.color }}>{currentStep.subtitle}</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">{currentStep.description}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1 — Venture Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Venture Name *</label>
                    <Input
                      placeholder="e.g. NOVA"
                      value={form.ventureName}
                      onChange={e => setForm(f => ({ ...f, ventureName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Tagline</label>
                    <Input
                      placeholder="e.g. Eco-packaging solutions"
                      value={form.tagline}
                      onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Sector *</label>
                    <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                      <SelectContent>
                        {SECTOR_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Channel *</label>
                    <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v as "B2B" | "D2C" }))}>
                      <SelectTrigger><SelectValue placeholder="B2B or D2C" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B">B2B — Supplying OEMs / businesses</SelectItem>
                        <SelectItem value="D2C">D2C — Direct to consumer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Nominated Charity</label>
                  <Select value={form.nominatedCharity} onValueChange={v => setForm(f => ({ ...f, nominatedCharity: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select nominated charity" /></SelectTrigger>
                    <SelectContent>
                      {CHARITY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 block">Brand Colour</label>
                  <div className="flex gap-2">
                    {BRAND_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, brandColor: c }))}
                        className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: c,
                          outline: form.brandColor === c ? `3px solid ${c}` : "none",
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Problem & Solution */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Business Model Canvas (BMC) — Value Proposition</label>
                  <textarea
                    className="w-full rounded-lg border text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-200"
                    style={{ borderColor: "#e5e7eb", minHeight: 80 }}
                    placeholder="What value does your venture create for customers? What problem does it solve?"
                    value={form.bmc}
                    onChange={e => setForm(f => ({ ...f, bmc: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Mission Model Canvas (MMC) — Social Mission</label>
                  <textarea
                    className="w-full rounded-lg border text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: "#e5e7eb", minHeight: 80 }}
                    placeholder="What is the social or environmental mission of your venture? Who are your beneficiaries?"
                    value={form.mmc}
                    onChange={e => setForm(f => ({ ...f, mmc: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Go-to-Market */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Check off the Go-to-Market tasks you have completed or are actively working on:</p>
                {currentStep.tasks.map(task => {
                  const key = `step3-${task}`;
                  return (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ border: "1px solid #f3f4f6" }}>
                      <input
                        type="checkbox"
                        checked={!!form.checkedTasks[key]}
                        onChange={() => toggleTask(key)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: currentStep.color }}
                      />
                      <span className="text-sm text-gray-700">{task}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Step 4 — Founder Profile */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Full Name *</label>
                    <Input
                      placeholder="Jane Smith"
                      value={form.founderName}
                      onChange={e => setForm(f => ({ ...f, founderName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      value={form.founderEmail}
                      onChange={e => setForm(f => ({ ...f, founderEmail: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Summary card */}
                <div className="rounded-xl p-4 space-y-2" style={{ background: `${form.brandColor}08`, border: `1px solid ${form.brandColor}30` }}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: form.brandColor }}>Venture Summary</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span className="text-gray-400">Name</span><span className="font-medium">{form.ventureName || "—"}</span>
                    <span className="text-gray-400">Sector</span><span className="font-medium">{form.sector || "—"}</span>
                    <span className="text-gray-400">Channel</span><span className="font-medium">{form.channel || "—"}</span>
                    <span className="text-gray-400">Charity</span><span className="font-medium">{form.nominatedCharity.split(" — ")[0] || "—"}</span>
                    <span className="text-gray-400">Starting VRL</span><span className="font-medium" style={{ color: "#22c55e" }}>VRL 1 — Fundamentals</span>
                    <span className="text-gray-400">Starting TRL</span><span className="font-medium" style={{ color: "#1d4ed8" }}>TRL 1 — Basic Principles</span>
                  </div>
                </div>

                <div className="rounded-lg p-3 text-xs text-gray-500" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <strong>Next steps after onboarding:</strong> You will receive access to the EcoBlend VBS Playbook, your ZINC VC stipend application link, and your assigned VBS mentor within 48 hours.
                </div>
              </div>
            )}

            {/* Checklist for steps 1, 2, 4 */}
            {step !== 3 && (
              <div className="border-t pt-4" style={{ borderColor: "#f3f4f6" }}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Playbook Checklist — {currentStep.subtitle}</div>
                <div className="space-y-2">
                  {currentStep.tasks.map(task => {
                    const key = `step${step}-${task}`;
                    return (
                      <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={!!form.checkedTasks[key]}
                          onChange={() => toggleTask(key)}
                          className="w-3.5 h-3.5 rounded"
                          style={{ accentColor: currentStep.color }}
                        />
                        <span className={`text-xs ${form.checkedTasks[key] ? "line-through text-gray-300" : "text-gray-500"}`}>{task}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
            <Button
              variant="outline" size="sm"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="gap-1.5"
            >
              <ChevronLeft size={14} /> Back
            </Button>
            <span className="text-xs text-gray-400 font-mono">{step} / {STEPS.length}</span>
            {step < STEPS.length ? (
              <Button
                size="sm"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="gap-1.5"
                style={{ background: currentStep.color, color: "white" }}
              >
                Continue <ChevronRight size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={!canProceed()}
                className="gap-1.5"
                style={{ background: "#22c55e", color: "white" }}
              >
                <Rocket size={14} /> Launch Venture
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
