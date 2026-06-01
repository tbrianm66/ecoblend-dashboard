import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Unlock, CircleDashed } from "lucide-react";
import { stageGates, ventures } from "../mock/data";
import { SurfaceHeader } from "../components/SurfaceHeader";
import type { GateDecision, GateName } from "../mock/types";

const pipeline: GateName[] = ["Concept", "Simulation", "Prototyping", "Track Integration"];

const decisionCls: Record<GateDecision, string> = {
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  conditional: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  "pending evidence": "bg-slate-100 text-slate-700 border-slate-200",
};

const fundingIcon = {
  unlocked: { Icon: Unlock, cls: "text-emerald-600" },
  conditional: { Icon: CircleDashed, cls: "text-amber-600" },
  locked: { Icon: Lock, cls: "text-red-600" },
} as const;

export default function StageGateBoard() {
  return (
    <div>
      <SurfaceHeader
        title="Stage-Gate Decision Board"
        description="Formula 1-style R&D pipeline — Concept → Simulation → Prototyping → Track Integration."
        showVenturePicker={false}
      />

      <div className="space-y-5">
        {ventures.map((v) => {
          const gate = stageGates.find((g) => g.ventureId === v.id);
          const currentIdx = pipeline.indexOf(v.stage);
          const funding = gate ? fundingIcon[gate.fundingStatus] : fundingIcon.locked;
          return (
            <Card key={v.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{v.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {v.domain} · {gate?.projectType} project
                    </p>
                  </div>
                  {gate && (
                    <Badge variant="outline" className={`capitalize ${decisionCls[gate.decision]}`}>
                      {gate.decision}
                    </Badge>
                  )}
                </div>

                {/* Pipeline */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {pipeline.map((stage, i) => {
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    return (
                      <div key={stage} className="flex items-center gap-2">
                        <div
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : done
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {stage}
                        </div>
                        {i < pipeline.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>

                {gate && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entry criteria</p>
                      <p className="text-sm">{gate.entryCriteria}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exit criteria</p>
                      <p className="text-sm">{gate.exitCriteria}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agent recommendation</p>
                      <p className="text-sm">{gate.agentRecommendation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Human approver</p>
                      <p className="text-sm">{gate.humanApprover}</p>
                    </div>
                  </div>
                )}

                {gate && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <funding.Icon className={`h-4 w-4 ${funding.cls}`} />
                        Funding <span className="font-medium capitalize">{gate.fundingStatus}</span>
                      </span>
                      <span className="text-muted-foreground">{gate.evidenceSubmitted} evidence items submitted</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Request changes</Button>
                      <Button size="sm" disabled={gate.fundingStatus === "locked"}>
                        Approve gate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
