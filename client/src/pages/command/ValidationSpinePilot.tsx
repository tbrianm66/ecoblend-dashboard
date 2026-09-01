import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Scale, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const NEXT_STATES: Record<string, string[]> = {
  DISCOVERY: ["VALIDATION", "HOLD", "TERMINATED"],
  VALIDATION: ["ITERATION", "REVIEW", "HOLD", "TERMINATED"],
  ITERATION: ["VALIDATION", "REVIEW", "HOLD", "TERMINATED"],
  REVIEW: ["VALIDATION", "ITERATION", "HOLD", "TERMINATED"],
  HOLD: ["DISCOVERY", "VALIDATION", "ITERATION", "TERMINATED"],
  TERMINATED: [],
};

export default function ValidationSpinePilot() {
  const { selectedVentureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const [decision, setDecision] = useState("PROCEED");
  const [systemRecommendation, setSystemRecommendation] = useState("PROCEED");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [newState, setNewState] = useState("");
  const [transitionRationale, setTransitionRationale] = useState("");

  const lifecycles = trpc.validationSpine.listLifecycles.useQuery(
    { ventureId: selectedVentureId! },
    { enabled: !!selectedVentureId },
  );
  const lifecycle = lifecycles.data?.[0];
  const detail = trpc.validationSpine.getLifecycle.useQuery(
    { ventureId: selectedVentureId!, lifecycleId: lifecycle?.id ?? 0 },
    { enabled: !!selectedVentureId && !!lifecycle },
  );
  const primaryHypothesis = detail.data?.hypotheses[0];
  const evidenceIds = useMemo(
    () => detail.data?.evidence.filter((item) => item.hypothesisId === primaryHypothesis?.id).map((item) => item.id) ?? [],
    [detail.data?.evidence, primaryHypothesis?.id],
  );

  const createLifecycle = trpc.validationSpine.createLifecycle.useMutation({
    onSuccess: async () => {
      await utils.validationSpine.listLifecycles.invalidate();
      toast.success("Validation lifecycle created");
    },
  });
  const recordDecision = trpc.validationSpine.recordHumanDecision.useMutation({
    onSuccess: async () => {
      setDecisionRationale("");
      await utils.validationSpine.getLifecycle.invalidate();
      toast.success("Human decision recorded");
    },
    onError: (error) => toast.error(error.message),
  });
  const transition = trpc.validationSpine.transitionLifecycle.useMutation({
    onSuccess: async () => {
      setNewState("");
      setTransitionRationale("");
      await Promise.all([
        utils.validationSpine.listLifecycles.invalidate(),
        utils.validationSpine.getLifecycle.invalidate(),
      ]);
      toast.success("Lifecycle transitioned");
    },
    onError: (error) => toast.error(error.message),
  });

  if (!selectedVentureId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Select a venture to inspect its canonical validation lifecycle.
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-testid="validation-spine-pilot">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={15} className="text-blue-700" />
        <h2 className="text-sm font-bold">Canonical Validation Spine</h2>
        <span className="text-xs text-muted-foreground">Stage 1.5 operator pilot</span>
      </div>
      {!lifecycle ? (
        <Card>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">No lifecycle exists for this venture.</p>
            <Button
              size="sm"
              disabled={createLifecycle.isPending}
              onClick={() => createLifecycle.mutate({ ventureId: selectedVentureId, initialState: "DISCOVERY" })}
            >
              Create lifecycle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Lifecycle v{lifecycle.version}</div>
                  <div className="font-semibold">{lifecycle.lifecycleState}</div>
                </div>
                <Badge variant="outline">Human controlled</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {detail.data?.hypotheses.length ?? 0} hypotheses · {detail.data?.evidence.length ?? 0} evidence · {detail.data?.experiments.length ?? 0} experiments
              </div>
              <Select value={newState} onValueChange={setNewState}>
                <SelectTrigger data-testid="select-lifecycle-state"><SelectValue placeholder="Choose next state" /></SelectTrigger>
                <SelectContent>
                  {(NEXT_STATES[lifecycle.lifecycleState] ?? []).map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea
                value={transitionRationale}
                onChange={(event) => setTransitionRationale(event.target.value)}
                placeholder="Rationale for this explicit human transition"
                data-testid="input-transition-rationale"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!newState || transitionRationale.trim().length < 10 || transition.isPending}
                onClick={() => transition.mutate({
                  ventureId: selectedVentureId,
                  lifecycleId: lifecycle.id,
                  priorState: lifecycle.lifecycleState,
                  newState: newState as any,
                  rationale: transitionRationale,
                })}
              >
                <GitBranch size={13} className="mr-1" />Apply human transition
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="font-semibold text-sm">Evidence inspection</div>
              {primaryHypothesis ? (
                <>
                  <p className="text-sm">{primaryHypothesis.hypothesisStatement}</p>
                  <div className="text-xs text-green-700">
                    Supporting: {detail.data?.evidence.filter((item) => item.evidenceRelationship === "supports").length ?? 0}
                  </div>
                  <div className="text-xs text-red-700">
                    Contradicting: {detail.data?.evidence.filter((item) => item.evidenceRelationship === "contradicts").length ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Results captured: {detail.data?.experiments.filter((item) => item.result).length ?? 0}
                  </div>
                  <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                    System recommendations remain advisory and separate from the decision below.
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground">No linked hypotheses yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="font-semibold text-sm">Explicit human decision</div>
              <Select value={systemRecommendation} onValueChange={setSystemRecommendation}>
                <SelectTrigger data-testid="select-system-recommendation"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PROCEED", "ITERATE", "HOLD", "STOP", "ESCALATE"].map((item) => <SelectItem key={item} value={item}>Recommendation: {item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger data-testid="select-human-decision"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PROCEED", "ITERATE", "HOLD", "STOP", "ESCALATE"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea
                value={decisionRationale}
                onChange={(event) => setDecisionRationale(event.target.value)}
                placeholder="Decision rationale"
                data-testid="input-human-decision-rationale"
              />
              <Button
                size="sm"
                disabled={!primaryHypothesis || evidenceIds.length === 0 || decisionRationale.trim().length < 1 || recordDecision.isPending}
                onClick={() => primaryHypothesis && recordDecision.mutate({
                  ventureId: selectedVentureId,
                  lifecycleId: lifecycle.id,
                  hypothesisId: primaryHypothesis.id,
                  decisionTitle: `${decision} validation decision`,
                  systemRecommendation: systemRecommendation as any,
                  humanDecision: decision as any,
                  rationale: decisionRationale,
                  evidenceIds,
                  overrideReason: systemRecommendation === decision ? undefined : decisionRationale,
                })}
              >
                <Scale size={13} className="mr-1" />Record decision
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}