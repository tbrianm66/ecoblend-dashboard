/**
 * MissingEvidenceCard — W1
 * Shows evidence gaps with progress bar and recommended playbooks.
 * Calls: trpc.contextual.getMissingEvidence
 */
import React, { useState } from "react";
import { FileSearch, CheckCircle2, XCircle } from "lucide-react";
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

interface MissingEvidenceCardProps {
  ventureId: string | null;
  module: string;
}

export default function MissingEvidenceCard({ ventureId, module }: MissingEvidenceCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getMissingEvidence.useQuery(
    { ventureId: ventureId!, module },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Checking evidence gaps..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  const progressColor =
    data.confidenceScore >= 80 ? "#51AF37" : data.confidenceScore >= 50 ? "#F49C13" : "#ef4444";

  return (
    <div className="flex flex-col gap-4">
      {/* Header + progress */}
      <div>
        <WidgetSectionHeader
          title="Evidence Gaps"
          badge={data.missing.length > 0 ? `${data.missing.length} missing` : "Complete"}
          badgeColor={data.missing.length > 0 ? "#F49C13" : "#51AF37"}
          icon={<FileSearch size={14} />}
        />
        <WidgetProgressBar
          value={data.completed}
          max={data.total || 1}
          color={progressColor}
          label={`${data.completed} of ${data.total} evidence items`}
        />
      </div>

      {/* Missing items */}
      {data.missing.length === 0 ? (
        <WidgetEmptyState
          title="All evidence present"
          description="All required evidence items for this module are complete."
          icon={<CheckCircle2 size={18} className="text-green-500" />}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.missing.map((item, i) => (
            <WidgetBlockerItem key={i} text={item} severity="warning" />
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

      {/* Playbook drawer */}
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
