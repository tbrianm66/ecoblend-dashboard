/**
 * StageGateApprovalCard — W6
 * Shows stage-gate blockers and approval readiness.
 * Calls: trpc.contextual.getStageGate
 */
import React, { useState } from "react";
import { GitMerge, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import PlaybookDrawer from "@/components/PlaybookDrawer";
import {
  WidgetLoadingState,
  WidgetErrorState,
  WidgetEmptyState,
  WidgetNoVentureState,
  WidgetSectionHeader,
  WidgetBlockerItem,
  RecommendedPlaybookLink,
} from "./WidgetPrimitives";

interface StageGateApprovalCardProps {
  ventureId: string | null;
  currentStage?: string;
}

export default function StageGateApprovalCard({ ventureId, currentStage }: StageGateApprovalCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getStageGate.useQuery(
    { ventureId: ventureId!, currentStage },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Checking stage-gate status..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  const isBlocked = data.blockers.length > 0;
  const hasPending = data.pendingApprovals.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with stage transition */}
      <div>
        <WidgetSectionHeader
          title="Stage-Gate Approval"
          badge={isBlocked ? "Blocked" : hasPending ? "Pending" : "On Track"}
          badgeColor={isBlocked ? "#ef4444" : hasPending ? "#F69111" : "#56A837"}
          icon={<GitMerge size={14} />}
        />
        {/* Stage transition indicator */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#3B85BA15", color: "#3B85BA" }}
          >
            {data.currentStage}
          </span>
          <span className="text-gray-300 text-xs">→</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#56A83715", color: "#56A837" }}
          >
            {data.targetStage}
          </span>
        </div>
      </div>

      {/* Required conditions checklist */}
      {data.requiredConditions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Gate Conditions
          </p>
          {data.requiredConditions.map((cond: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-600"
            >
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-gray-300" />
              <span>{cond}</span>
            </div>
          ))}
        </div>
      )}

      {/* Blockers */}
      {data.blockers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blockers</p>
          {data.blockers.map((b: string, i: number) => (
            <WidgetBlockerItem key={i} text={b} severity="error" />
          ))}
        </div>
      )}

      {/* Pending approvals */}
      {data.pendingApprovals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Pending Approvals
          </p>
          {data.pendingApprovals.map((ap: any) => (
            <div
              key={ap.id}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-amber-100 bg-amber-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Clock size={13} className="text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 truncate">
                  {ap.gate_name || "Approval pending"}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-600 shrink-0"
              >
                {ap.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* All clear */}
      {data.isEmpty && (
        <WidgetEmptyState
          title="Gate clear"
          description="No pending approvals or blockers. Stage-gate is on track."
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
          module="Governance"
          open={!!drawerPlaybookId}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}
    </div>
  );
}
