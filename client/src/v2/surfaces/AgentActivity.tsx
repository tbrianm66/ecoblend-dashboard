import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, FileSearch } from "lucide-react";
import { agents, assessments, ventureName } from "../mock/data";
import { useRole } from "../context/RoleContext";
import { SurfaceHeader } from "../components/SurfaceHeader";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

const statusCls: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  idle: "bg-slate-100 text-slate-600 border-slate-200",
  queued: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function AgentActivity() {
  const { ventureId } = useRole();
  const rows = assessments.filter((a) => a.ventureId === ventureId);
  const mvpAgents = agents.filter((a) => a.tier === "mvp");
  const futureAgents = agents.filter((a) => a.tier === "future");

  return (
    <div>
      <SurfaceHeader
        title="Agent Activity Log"
        description="Auditable ledger of every agent action — output, score impact, confidence and approval state."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent assessments — {ventureName(ventureId)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((a) => (
              <div key={a.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="font-medium">{a.agentName}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {a.agentVersion}
                    </Badge>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {a.timestamp}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{a.task}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.outputSummary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <FileSearch className="h-3 w-3" />
                    {a.evidenceReviewed} evidence
                  </Badge>
                  <ConfidenceBadge confidence={a.confidence} />
                  <Badge variant="outline">
                    score {a.scoreImpact >= 0 ? "+" : ""}
                    {a.scoreImpact}
                  </Badge>
                  <Badge variant="outline">{a.risksIdentified} risks</Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {a.runtimeCost}
                  </Badge>
                  {a.approval === "required" && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                      Needs human approval
                    </Badge>
                  )}
                  {a.approval === "approved" && (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      Approved
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm">→ {a.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent workforce</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">MVP agents</p>
            <div className="space-y-2">
              {mvpAgents.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.kind} · {a.version}
                    </p>
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusCls[a.status]}`}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Planned (architecture-ready)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {futureAgents.map((a) => (
                <Badge key={a.id} variant="secondary" className="font-normal text-muted-foreground">
                  {a.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
