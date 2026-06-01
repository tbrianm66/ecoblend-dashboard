import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

export function confidenceTier(confidence: number) {
  if (confidence >= 70) return "strong" as const;
  if (confidence >= 50) return "moderate" as const;
  return "weak" as const;
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tier = confidenceTier(confidence);
  const map = {
    strong: { label: "Strong evidence", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", Icon: ShieldCheck },
    moderate: { label: "Moderate evidence", cls: "bg-amber-100 text-amber-800 border-amber-200", Icon: ShieldQuestion },
    weak: { label: "Weak evidence", cls: "bg-red-100 text-red-800 border-red-200", Icon: ShieldAlert },
  } as const;
  const { label, cls, Icon } = map[tier];
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {confidence}% · {label}
    </Badge>
  );
}

export function ProvisionalBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800 font-semibold">
      <ShieldAlert className="h-3 w-3" />
      Provisional
    </Badge>
  );
}

export function isProvisional(readiness: number, confidence: number) {
  return readiness >= 60 && confidence < 60;
}
