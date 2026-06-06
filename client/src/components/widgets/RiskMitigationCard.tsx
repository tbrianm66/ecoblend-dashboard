/**
 * RiskMitigationCard — W5
 * Shows top high/critical risks needing mitigation.
 * Calls: trpc.contextual.getRiskMitigation
 */
import React, { useState } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import PlaybookDrawer from "@/components/PlaybookDrawer";
import {
  WidgetLoadingState,
  WidgetErrorState,
  WidgetEmptyState,
  WidgetNoVentureState,
  WidgetSectionHeader,
  RecommendedPlaybookLink,
} from "./WidgetPrimitives";

interface RiskMitigationCardProps {
  ventureId: string | null;
  module?: string;
}

const RISK_LEVEL_CONFIG: Record<string, { color: string; bg: string }> = {
  Critical: { color: "#ef4444", bg: "#fef2f2" },
  High: { color: "#F69111", bg: "#fffbeb" },
  Medium: { color: "#3B85BA", bg: "#eff6ff" },
  Low: { color: "#56A837", bg: "#f0fdf4" },
};

export default function RiskMitigationCard({ ventureId, module = "Risk Intelligence" }: RiskMitigationCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getRiskMitigation.useQuery(
    { ventureId: ventureId!, module },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Loading risk intelligence..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <WidgetSectionHeader
        title="Risk Mitigation"
        badge={data.totalHighRisks > 0 ? `${data.totalHighRisks} high/critical` : "No critical risks"}
        badgeColor={data.totalHighRisks > 0 ? "#ef4444" : "#56A837"}
        icon={<ShieldAlert size={14} />}
      />

      {/* Summary row */}
      {data.totalHighRisks > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-700">
            <strong>{data.missingMitigationCount}</strong> risk{data.missingMitigationCount !== 1 ? "s" : ""} without mitigation plan
            {data.topRiskCategory && ` · Top category: ${data.topRiskCategory}`}
          </span>
        </div>
      )}

      {/* Risk list */}
      {data.isEmpty ? (
        <WidgetEmptyState
          title="No critical risks"
          description="No high or critical open risks detected for this venture."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.risks.map((risk: any) => {
            const cfg = RISK_LEVEL_CONFIG[risk.risk_level] || RISK_LEVEL_CONFIG["High"];
            return (
              <div
                key={risk.id}
                className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg border"
                style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {risk.risk_title || "Unnamed risk"}
                  </p>
                  {risk.risk_category && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{risk.risk_category}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {risk.risk_score && (
                    <span className="text-[10px] font-mono text-gray-400">{risk.risk_score}</span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-0 font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {risk.risk_level}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommended playbooks */}
      {data.recommendedPlaybooks && data.recommendedPlaybooks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recommended Playbooks
          </p>
          <div className="flex flex-col gap-1.5">
            {data.recommendedPlaybooks.map((pb: any) => (
              <RecommendedPlaybookLink
                key={pb.id}
                playbook={pb}
                onOpen={(id) => setDrawerPlaybookId(id)}
              />
            ))}
          </div>
        </div>
      )}

      {drawerPlaybookId && (
        <PlaybookDrawer
          playbookId={drawerPlaybookId}
          ventureId={ventureId}
          module={module}
          open={!!drawerPlaybookId}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}
    </div>
  );
}
