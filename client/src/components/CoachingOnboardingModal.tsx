/**
 * CoachingOnboardingModal — Sprint 79
 * Shown to founders on first login to the Coaching module.
 * Lets them select their current VRL stage so the correct
 * commitment template set is automatically applied by their coach.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const VRL_STAGES = [
  {
    stage: 1,
    label: "Opportunity Identification",
    description: "Problem/opportunity confirmed, initial market signal gathered",
    color: "#6b7280",
    templates: ["Problem validation", "Market sizing", "Stakeholder mapping", "Hypothesis testing", "Lean canvas draft"],
  },
  {
    stage: 2,
    label: "Validation",
    description: "Customer discovery complete, MVP defined, early adopters identified",
    color: "#3A97D3",
    templates: ["Customer interviews", "MVP specification", "TRL assessment", "Competitive analysis", "Business model canvas"],
  },
  {
    stage: 3,
    label: "Build",
    description: "Product in development, pilot customers engaged, team assembled",
    color: "#F49C13",
    templates: ["Sprint planning", "Pilot customer onboarding", "MRL baseline", "Investment deck", "Team OKRs"],
  },
  {
    stage: 4,
    label: "Launch & Scale",
    description: "Product live, revenue generating, scaling operations",
    color: "#51AF37",
    templates: ["Revenue tracking", "CAC/LTV monitoring", "Scale readiness", "Series A prep", "Impact reporting"],
  },
];

interface Props {
  founderId: string;
  founderName: string;
  open: boolean;
  onClose: () => void;
}

export default function CoachingOnboardingModal({ founderId, founderName, open, onClose }: Props) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [step, setStep] = useState<"select" | "confirm" | "done">("select");

  const completeMutation = trpc.coaching.onboarding.complete.useMutation({
    onSuccess: (data) => {
      setStep("done");
      toast.success(`VRL Stage ${data.vrlStage} set — ${data.templatesApplied} commitment templates applied`);
    },
    onError: (err) => {
      toast.error(`Onboarding failed: ${err.message}`);
    },
  });

  const handleConfirm = () => {
    if (!selectedStage) return;
    completeMutation.mutate({
      founderId,
      vrlStage: selectedStage,
      autoApplyTemplates: true,
    });
  };

  const selectedInfo = VRL_STAGES.find((s) => s.stage === selectedStage);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && step === "done") onClose(); }}>
      <DialogContent className="max-w-2xl bg-[#0d1b2e] border-[#1e3a5f] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Welcome to Coaching, {founderName}
          </DialogTitle>
          <DialogDescription className="text-[#8ba3c0]">
            Select your current VRL stage so your coach can apply the right commitment template set for this week.
          </DialogDescription>
        </DialogHeader>

        {step === "done" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-[#51AF37]" />
            <p className="text-lg font-semibold text-white">Onboarding Complete</p>
            <p className="text-sm text-[#8ba3c0] text-center">
              Your VRL Stage {selectedStage} commitment templates have been applied.
              Your coach will review and activate them before your first session.
            </p>
            <Button onClick={onClose} className="bg-[#51AF37] hover:bg-[#3d8a29] text-white mt-2">
              Go to My Dashboard
            </Button>
          </div>
        ) : step === "confirm" ? (
          <div className="flex flex-col gap-6 py-4">
            <div className="rounded-xl border border-[#1e3a5f] bg-[#0a1628] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: selectedInfo?.color }}
                >
                  {selectedStage}
                </span>
                <div>
                  <p className="font-semibold text-white">{selectedInfo?.label}</p>
                  <p className="text-xs text-[#8ba3c0]">{selectedInfo?.description}</p>
                </div>
              </div>
              <p className="text-sm text-[#8ba3c0] mb-2">Templates that will be applied this week:</p>
              <div className="flex flex-wrap gap-2">
                {selectedInfo?.templates.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-[#1e3a5f] text-[#8ba3c0]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1 border-[#1e3a5f] text-[#8ba3c0] bg-transparent hover:bg-[#1e3a5f]"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={completeMutation.isPending}
                className="flex-1 bg-[#51AF37] hover:bg-[#3d8a29] text-white"
              >
                {completeMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying Templates...</>
                ) : (
                  "Confirm & Apply Templates"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-[#8ba3c0]">
              Your VRL stage determines which weekly commitment templates your coach will assign.
              Choose the stage that best describes where your venture is right now.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {VRL_STAGES.map((s) => (
                <button
                  key={s.stage}
                  onClick={() => setSelectedStage(s.stage)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                    selectedStage === s.stage
                      ? "border-[#51AF37] bg-[#51AF3710]"
                      : "border-[#1e3a5f] bg-[#0a1628] hover:border-[#3A97D3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: s.color }}
                    >
                      {s.stage}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{s.label}</p>
                      <p className="text-xs text-[#8ba3c0] mt-0.5">{s.description}</p>
                    </div>
                    {selectedStage === s.stage && (
                      <CheckCircle2 className="w-5 h-5 text-[#51AF37] shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setStep("confirm")}
              disabled={!selectedStage}
              className="mt-2 bg-[#3A97D3] hover:bg-[#2a7ab5] text-white w-full"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
