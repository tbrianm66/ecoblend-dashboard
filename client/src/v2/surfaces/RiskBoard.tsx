import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ShieldAlert } from "lucide-react";
import { risks } from "../mock/data";
import { useRole } from "../context/RoleContext";
import { SurfaceHeader } from "../components/SurfaceHeader";
import type { RiskSeverity } from "../mock/types";

const severityOrder: RiskSeverity[] = ["blocking", "material", "monitor", "advisory"];

const severityCls: Record<RiskSeverity, string> = {
  blocking: "border-red-300 bg-red-50",
  material: "border-amber-300 bg-amber-50",
  monitor: "border-blue-200 bg-blue-50",
  advisory: "border-slate-200 bg-slate-50",
};

const severityBadge: Record<RiskSeverity, string> = {
  blocking: "bg-red-100 text-red-800 border-red-200",
  material: "bg-amber-100 text-amber-800 border-amber-200",
  monitor: "bg-blue-100 text-blue-800 border-blue-200",
  advisory: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function RiskBoard() {
  const { ventureId } = useRole();
  const vRisks = risks.filter((r) => r.ventureId === ventureId);

  return (
    <div>
      <SurfaceHeader
        title="Risk & Blockers Board"
        description="Severity-tiered risks linked to the evidence gap and agent assessment behind each one."
      />

      <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {severityOrder.map((sev) => {
          const items = vRisks.filter((r) => r.severity === sev);
          return (
            <div key={sev}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize">{sev}</h3>
                <Badge variant="outline" className={severityBadge[sev]}>
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {items.map((r) => (
                  <Card key={r.id} className={severityCls[sev]}>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium leading-tight">{r.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.category} · affects {r.affectedModule}
                      </p>
                      <div className="mt-2 rounded border bg-background/60 p-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Evidence gap
                        </p>
                        <p className="text-xs">{r.evidenceGap}</p>
                      </div>
                      <p className="mt-2 text-xs">→ {r.recommendedAction}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[11px]">
                          {r.owner}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {r.status}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          due {r.deadline}
                        </Badge>
                        {r.approval === "required" && (
                          <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-[11px] text-amber-800">
                            <ShieldAlert className="h-3 w-3" />
                            approval
                          </Badge>
                        )}
                      </div>
                      {(r.linkedEvidenceId || r.linkedAssessmentId) && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          {r.linkedEvidenceId && <span>evidence {r.linkedEvidenceId}</span>}
                          {r.linkedEvidenceId && r.linkedAssessmentId && <span>·</span>}
                          {r.linkedAssessmentId && <span>assessment {r.linkedAssessmentId}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <p className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">None</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
