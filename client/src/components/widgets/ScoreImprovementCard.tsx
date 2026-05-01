/**
 * ScoreImprovementCard — W2
 * Shows score blockers and improvement guidance.
 * Calls: trpc.contextual.getScoreImprovement
 */
import React, { useState } from "react";
import { TrendingUp, ShieldAlert, FileCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import PlaybookDrawer from "@/components/PlaybookDrawer";
import {
  WidgetLoadingState,
  WidgetErrorState,
  WidgetEmptyState,
  WidgetNoVentureState,
  WidgetProgressBar,
  WidgetSectionHeader,
  WidgetBlockerItem,
  RecommendedPlaybookLink,
} from "./WidgetPrimitives";

interface ScoreImprovementCardProps {
  ventureId: string | null;
  scoreType?: string;
  threshold?: number;
}

export default function ScoreImprovementCard({
  ventureId,
  scoreType = "VRL",
  threshold = 60,
}: ScoreImprovementCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getScoreImprovement.useQuery(
    { ventureId: ventureId!, scoreType, threshold },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Analysing score blockers..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  const scoreColor =
    data.currentScore >= threshold ? "#51AF37" : data.currentScore >= threshold * 0.7 ? "#F49C13" : "#ef4444";

  return (
    <div className="flex flex-col gap-4">
      {/* Score overview */}
      <div>
        <WidgetSectionHeader
          title="Score Improvement"
          badge={`${data.currentScore} / 100`}
          badgeColor={scoreColor}
          icon={<TrendingUp size={14} />}
        />
        <WidgetProgressBar
          value={data.currentScore}
          max={100}
          color={scoreColor}
          label={`${data.scoreType} score vs target (${threshold})`}
        />
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert size={12} className="text-amber-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">High Risks</span>
          </div>
          <span
            className="text-xl font-bold"
            style={{ color: data.highRisks > 0 ? "#ef4444" : "#51AF37", fontFamily: "'Prompt', sans-serif" }}
          >
            {data.highRisks}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <FileCheck size={12} className="text-blue-500" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Evidence</span>
          </div>
          <span
            className="text-xl font-bold"
            style={{
              color: data.evidenceConfidence >= 70 ? "#51AF37" : data.evidenceConfidence >= 50 ? "#F49C13" : "#ef4444",
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            {data.evidenceConfidence}%
          </span>
        </div>
      </div>

      {/* Blockers */}
      {data.blockers.length === 0 ? (
        <WidgetEmptyState
          title="Score on track"
          description="No blockers detected. Keep maintaining evidence and managing risks."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blockers</p>
          {data.blockers.map((b: string, i: number) => (
            <WidgetBlockerItem key={i} text={b} severity="warning" />
          ))}
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
          module="Readiness Scoring"
          open={!!drawerPlaybookId}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}
    </div>
  );
}
