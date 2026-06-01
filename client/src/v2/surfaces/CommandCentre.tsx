import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash,
  GitPullRequestArrow,
  Sparkles,
} from "lucide-react";
import { useRole } from "../context/RoleContext";
import { assessments, risks, stageGates, ventures } from "../mock/data";
import { ScoreCard } from "../components/ScoreCard";
import { ConfidenceBadge, isProvisional, ProvisionalBadge } from "../components/ConfidenceBadge";
import { SurfaceHeader } from "../components/SurfaceHeader";

const recoMap = {
  proceed: { label: "Proceed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  pause: { label: "Pause", cls: "bg-amber-100 text-amber-800 border-amber-200", Icon: AlertTriangle },
  pivot: { label: "Pivot", cls: "bg-blue-100 text-blue-800 border-blue-200", Icon: GitPullRequestArrow },
  kill: { label: "Kill", cls: "bg-red-100 text-red-800 border-red-200", Icon: CircleSlash },
} as const;

export default function CommandCentre() {
  const { ventureId, role } = useRole();
  const venture = ventures.find((v) => v.id === ventureId) ?? ventures[0];
  const provisional = isProvisional(venture.overallReadiness, venture.overallConfidence);
  const reco = recoMap[venture.recommendation];

  const vRisks = risks.filter((r) => r.ventureId === ventureId);
  const blockers = vRisks.filter((r) => r.severity === "blocking" || r.severity === "material");
  const approvals = [...vRisks, ...assessments.filter((a) => a.ventureId === ventureId)].filter(
    (x) => "approval" in x && x.approval === "required",
  );
  const gate = stageGates.find((g) => g.ventureId === ventureId);
  const vAssessments = assessments.filter((a) => a.ventureId === ventureId).slice(0, 4);

  const emphasised = [...venture.modules].sort((a, b) => {
    const aE = role.emphasis.includes(a.kind) ? 1 : 0;
    const bE = role.emphasis.includes(b.kind) ? 1 : 0;
    return bE - aE;
  });

  return (
    <div>
      <SurfaceHeader
        title="Readiness Command Centre"
        description={`Stakeholder view: ${role.label} — ${role.focus}`}
      />

      {/* Top summary row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {venture.domain} · {venture.stage} stage
                </p>
                <h2 className="text-xl font-semibold">{venture.name}</h2>
                <p className="text-sm text-muted-foreground">{venture.tagline}</p>
              </div>
              <Badge variant="outline" className={`gap-1 px-3 py-1 text-sm font-semibold ${reco.cls}`}>
                <reco.Icon className="h-4 w-4" />
                {reco.label}
              </Badge>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Overall validation readiness</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tabular-nums">{venture.overallReadiness}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                  {provisional && <ProvisionalBadge />}
                </div>
                <Progress value={venture.overallReadiness} className="mt-2 h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Evidence confidence</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tabular-nums">{venture.overallConfidence}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="mt-2">
                  <ConfidenceBadge confidence={venture.overallConfidence} />
                </div>
              </div>
            </div>

            {provisional && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This readiness score is <strong>provisional</strong> — apparent maturity outpaces the evidence
                supporting it. Treat with caution until evidence confidence reaches 60%.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stage-gate status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{gate?.gate ?? "—"}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {gate?.decision} · funding {gate?.fundingStatus}
              </p>
            </CardContent>
          </Card>
          <Card className={approvals.length ? "border-amber-300" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Human approvals required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{approvals.length}</p>
              <p className="text-xs text-muted-foreground">awaiting sign-off</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Module score cards */}
      <h3 className="mb-3 mt-8 text-sm font-semibold text-muted-foreground">Module readiness</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {emphasised.map((m) => (
          <ScoreCard key={m.kind} module={m} />
        ))}
      </div>

      {/* Blockers + agent recs */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Top unresolved blockers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blockers.length === 0 && <p className="text-sm text-muted-foreground">No blocking risks.</p>}
            {blockers.map((r) => (
              <div key={r.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{r.title}</p>
                  <Badge variant="outline" className="capitalize">
                    {r.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.category} · affects {r.affectedModule} · owner {r.owner}
                </p>
                <p className="mt-1 text-xs">{r.recommendedAction}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Latest agent recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vAssessments.map((a) => (
              <div key={a.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.agentName}</p>
                  <span className="text-xs text-muted-foreground">{a.timestamp.split(" ")[0]}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.outputSummary}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium">→ {a.recommendedAction}</span>
                  {a.approval === "required" && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                      Needs approval
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Next sprint actions */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Next validation sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {blockers.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  {r.recommendedAction}
                </span>
                <span className="text-xs text-muted-foreground">due {r.deadline}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-4">
            Open full action plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
