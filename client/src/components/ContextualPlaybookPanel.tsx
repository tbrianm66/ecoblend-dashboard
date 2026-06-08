/**
 * ContextualPlaybookPanel — The main host widget that renders contextual
 * playbook recommendations inside every module page.
 *
 * Props:
 *   module     — The current module name (e.g. "Venture Intake")
 *   ventureId  — The active venture ID (null if portfolio-level)
 *   page       — Optional sub-page identifier
 *   workflowStage — Optional workflow stage filter
 *
 * Features:
 *   - Fetches recommendations from the Context Engine
 *   - Renders RecommendedPlaybookCards ranked by score
 *   - Opens PlaybookDrawer on card click
 *   - Opens PlaybookSearchModal via search button
 *   - Collapsible panel with badge count
 *   - Logs usage events for analytics
 */
import { useState, useMemo } from "react";
import { BookOpen, Search, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import PlaybookDrawer from "./PlaybookDrawer";
import PlaybookSearchModal from "./PlaybookSearchModal";

interface ContextualPlaybookPanelProps {
  module: string;
  ventureId: string | null;
  page?: string;
  workflowStage?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Getting Started": "🚀",
  "Venture Intake": "📋",
  "Discovery & Market": "🔍",
  "Value & Business Model": "💡",
  "R&D & Product": "🔬",
  "Risk & Compliance": "⚠️",
  "Scoring & Evidence": "📊",
  "Investment & Growth": "💰",
  "Execution & Governance": "🎯",
};

function RecommendedPlaybookCard({
  playbook,
  onOpen,
}: {
  playbook: any;
  onOpen: () => void;
}) {
  const score = playbook.recommendationScore || 0;
  const barColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#94a3b8";
  const icon = CATEGORY_ICONS[playbook.category] || "📖";

  return (
    <button
      className="w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all duration-200 group"
      style={{ borderColor: "#e5e7eb", background: "#fafbfc" }}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
              {playbook.title}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{playbook.purpose}</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" style={{ fontSize: "10px" }}>
              {playbook.category}
            </Badge>
            {/* Relevance bar */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-gray-400">Relevance</span>
              <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${score}%`, background: barColor }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: barColor, fontSize: "10px" }}>
                {score}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ContextualPlaybookPanel({
  module,
  ventureId,
  page = "ALL",
  workflowStage = "ALL",
}: ContextualPlaybookPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [drawerPlaybookId, setDrawerPlaybookId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { data: recommendations, isLoading } = trpc.contextual.getRecommendations.useQuery(
    { ventureId, module, page, workflowStage },
    { staleTime: 60_000 }
  );

  const logEvent = trpc.contextual.logUsageEvent.useMutation();

  const handleOpenPlaybook = (playbookId: string) => {
    setDrawerPlaybookId(playbookId);
    logEvent.mutate({
      playbookId,
      ventureId,
      module,
      page,
      widgetType: "ContextualPlaybookPanel",
      actionType: "Open",
    });
  };

  const handleSearchSelect = (playbookId: string) => {
    setShowSearch(false);
    handleOpenPlaybook(playbookId);
  };

  const playbooks = recommendations || [];
  const count = playbooks.length;

  return (
    <>
      <div className="rounded-xl border" style={{ borderColor: "#e5e7eb", background: "#ffffff" }}>
        {/* Header */}
        <div
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-xl cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#56A837" }} />
            <span className="text-sm font-semibold text-gray-700">Playbook Guidance</span>
            {count > 0 && (
              <Badge
                className="text-xs px-1.5 py-0"
                style={{ background: "#56A83720", color: "#56A837", border: "none", fontSize: "10px" }}
              >
                {count}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={e => {
                e.stopPropagation();
                setShowSearch(true);
              }}
            >
              <Search size={14} className="text-gray-400" />
            </Button>
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div className="px-4 pb-4">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-gray-400 animate-pulse">
                Loading recommendations...
              </div>
            ) : count === 0 ? (
              <div className="py-6 text-center">
                <BookOpen size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No playbooks matched for this context</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1.5 text-xs"
                  onClick={() => setShowSearch(true)}
                >
                  <Search size={12} /> Browse All Playbooks
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {playbooks.map((pb: any) => (
                  <RecommendedPlaybookCard
                    key={pb.id}
                    playbook={pb}
                    onOpen={() => handleOpenPlaybook(pb.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerPlaybookId && (
        <PlaybookDrawer
          playbookId={drawerPlaybookId}
          ventureId={ventureId}
          module={module}
          onClose={() => setDrawerPlaybookId(null)}
        />
      )}

      {/* Search Modal */}
      {showSearch && (
        <PlaybookSearchModal
          module={module}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </>
  );
}
