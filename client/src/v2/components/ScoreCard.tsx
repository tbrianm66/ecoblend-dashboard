import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ModuleScore } from "../mock/types";
import { isProvisional, ProvisionalBadge } from "./ConfidenceBadge";

function readinessColor(v: number) {
  if (v >= 67) return "text-emerald-600";
  if (v >= 45) return "text-amber-600";
  return "text-red-600";
}

export function ScoreCard({ module }: { module: ModuleScore }) {
  const provisional = isProvisional(module.readiness, module.confidence);
  const Delta = module.delta > 0 ? ArrowUp : module.delta < 0 ? ArrowDown : Minus;
  const deltaColor = module.delta > 0 ? "text-emerald-600" : module.delta < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <Card className={provisional ? "border-amber-300" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{module.kind}</p>
            <p className="text-sm font-medium leading-tight">{module.label}</p>
          </div>
          <div className={`flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
            <Delta className="h-3 w-3" />
            {module.delta !== 0 ? Math.abs(module.delta) : ""}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className={`text-3xl font-semibold tabular-nums ${readinessColor(module.readiness)}`}>
            {module.readiness}
          </span>
          <span className="text-sm text-muted-foreground">/ 100 readiness</span>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Evidence confidence</span>
            <span className="tabular-nums">{module.confidence}%</span>
          </div>
          <Progress value={module.confidence} className="h-1.5" />
        </div>

        {provisional && (
          <div className="mt-3">
            <ProvisionalBadge />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
