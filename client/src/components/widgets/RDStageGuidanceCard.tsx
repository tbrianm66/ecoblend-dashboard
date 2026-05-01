/**
 * RDStageGuidanceCard — W3
 * Shows R&D stage requirements and missing evidence.
 * Calls: trpc.contextual.getRDStageGuidance
 */
import React, { useState } from "react";
import { FlaskConical, CheckCircle2, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PlaybookDrawer from "@/components/PlaybookDrawer";
import {
  WidgetLoadingState,
  WidgetErrorState,
  WidgetEmptyState,
  WidgetNoVentureState,
  WidgetProgressBar,
  WidgetSectionHeader,
  RecommendedPlaybookLink,
} from "./WidgetPrimitives";

interface RDStageGuidanceCardProps {
  ventureId: string | null;
  rdProjectId?: string;
}

const STAGE_COLORS: Record<string, string> = {
  Concept: "#3A97D3",
  Simulation: "#F49C13",
  Prototyping: "#8b5cf6",
  "Track / Platform Integration": "#51AF37",
};

export default function RDStageGuidanceCard({ ventureId, rdProjectId }: RDStageGuidanceCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getRDStageGuidance.useQuery(
    { ventureId: ventureId!, rdProjectId },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Loading R&D stage guidance..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  const stageColor = STAGE_COLORS[data.currentStage] || "#3A97D3";
  const progressColor =
    data.completedCount === data.totalCount ? "#51AF37" : data.completedCount >= data.totalCount * 0.5 ? "#F49C13" : "#ef4444";

  return (
    <div className="flex flex-col gap-4">
      {/* Stage header */}
      <div>
        <WidgetSectionHeader
          title="R&D Stage Guidance"
          badge={data.currentStage}
          badgeColor={stageColor}
          icon={<FlaskConical size={14} />}
        />
        {data.projectTitle && (
          <p className="text-xs text-gray-400 mb-2 truncate">{data.projectTitle}</p>
        )}
        <WidgetProgressBar
          value={data.completedCount}
          max={data.totalCount || 1}
          color={progressColor}
          label={`${data.completedCount} of ${data.totalCount} requirements met`}
        />
      </div>

      {/* Requirements checklist */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Stage Requirements
        </p>
        {data.requiredEvidence.map((req: string, i: number) => {
          const isMissing = data.missingEvidence.includes(req);
          return (
            <div
              key={i}
              className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs ${
                isMissing
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-green-50 border-green-100 text-green-700"
              }`}
            >
              {isMissing ? (
                <Circle size={13} className="mt-0.5 shrink-0 text-amber-400" />
              ) : (
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" />
              )}
              <span>{req}</span>
            </div>
          );
        })}
      </div>

      {/* Empty state when all complete */}
      {data.missingEvidence.length === 0 && (
        <WidgetEmptyState
          title="Stage requirements met"
          description="All evidence for this R&D stage is complete. Ready to advance."
          icon={<CheckCircle2 size={18} className="text-green-500" />}
        />
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
          module="Research & Technical Validation"
          open={!!drawerPlaybookId}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}
    </div>
  );
}
