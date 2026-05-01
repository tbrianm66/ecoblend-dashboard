/**
 * InvestmentPackReadinessCard — W4
 * Shows investor pack readiness status (Ready / Ready with Warnings / Not Ready).
 * Calls: trpc.contextual.getInvestmentPackReadiness
 */
import React, { useState } from "react";
import { Briefcase, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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

interface InvestmentPackReadinessCardProps {
  ventureId: string | null;
}

type ReadinessStatus = "Ready" | "Ready with Warnings" | "Not Ready";

const STATUS_CONFIG: Record<ReadinessStatus, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  "Ready": {
    color: "#51AF37",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 size={16} className="text-green-500" />,
    label: "Investment Pack Ready",
  },
  "Ready with Warnings": {
    color: "#F49C13",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <AlertTriangle size={16} className="text-amber-500" />,
    label: "Ready with Warnings",
  },
  "Not Ready": {
    color: "#ef4444",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle size={16} className="text-red-500" />,
    label: "Not Ready",
  },
};

export default function InvestmentPackReadinessCard({ ventureId }: InvestmentPackReadinessCardProps) {
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.contextual.getInvestmentPackReadiness.useQuery(
    { ventureId: ventureId! },
    { enabled: !!ventureId }
  );

  if (!ventureId) return <WidgetNoVentureState />;
  if (isLoading) return <WidgetLoadingState label="Checking investment readiness..." />;
  if (error) return <WidgetErrorState message={error.message} />;
  if (!data) return null;

  const statusCfg = STATUS_CONFIG[data.status as ReadinessStatus] || STATUS_CONFIG["Not Ready"];

  return (
    <div className="flex flex-col gap-4">
      {/* Status banner */}
      <div>
        <WidgetSectionHeader
          title="Investment Pack Readiness"
          icon={<Briefcase size={14} />}
        />
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${statusCfg.bg} ${statusCfg.border}`}>
          {statusCfg.icon}
          <span className="text-sm font-semibold" style={{ color: statusCfg.color, fontFamily: "'Prompt', sans-serif" }}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Score metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">BRL Score</p>
          <p
            className="text-lg font-bold"
            style={{
              color: data.brlScore >= 60 ? "#51AF37" : data.brlScore >= 40 ? "#F49C13" : "#ef4444",
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            {data.brlScore}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Composite</p>
          <p
            className="text-lg font-bold"
            style={{
              color: data.compositeScore >= 60 ? "#51AF37" : data.compositeScore >= 40 ? "#F49C13" : "#ef4444",
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            {data.compositeScore}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Evidence</p>
          <p
            className="text-lg font-bold"
            style={{
              color: data.evidenceConfidence >= 70 ? "#51AF37" : data.evidenceConfidence >= 50 ? "#F49C13" : "#ef4444",
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            {data.evidenceConfidence}%
          </p>
        </div>
      </div>

      {/* Blockers */}
      {data.blockers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Blockers</p>
          {data.blockers.map((b: string, i: number) => (
            <WidgetBlockerItem key={i} text={b} severity="error" />
          ))}
        </div>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Warnings</p>
          {data.warnings.map((w: string, i: number) => (
            <WidgetBlockerItem key={i} text={w} severity="warning" />
          ))}
        </div>
      )}

      {/* All clear */}
      {data.isEmpty && (
        <WidgetEmptyState
          title="Investment pack ready"
          description="All readiness criteria are met. The investment pack can be generated."
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
          module="Investment Readiness"
          open={!!drawerPlaybookId}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}
    </div>
  );
}
