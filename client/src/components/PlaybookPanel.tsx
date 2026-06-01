// ============================================================
// PLAYBOOK PANEL — Contextual playbook display inside modules
// Shows relevant Published playbooks for a given module name
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BookOpenCheck, ChevronDown, ChevronRight, X, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface PlaybookPanelProps {
  module: string;
  compact?: boolean;
}

export function PlaybookPanel({ module, compact = false }: PlaybookPanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const { data: playbooks = [], isLoading } = trpc.admin.playbooks.getByModule.useQuery({ module });

  if (isLoading || playbooks.length === 0) return null;

  const selected = playbooks.find(p => p.id === selectedId);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2d3d", background: "#0a1520" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: expanded ? "1px solid #1e2d3d" : "none" }}
      >
        <div className="flex items-center gap-2">
          <BookOpenCheck size={14} style={{ color: "#56A837" }} />
          <span className="text-xs font-semibold" style={{ color: "#56A837" }}>
            Playbooks for this module
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
            style={{ background: "#56A83715", color: "#56A837" }}>
            {playbooks.length}
          </span>
        </div>
        {expanded ? <ChevronDown size={14} style={{ color: "#475569" }} /> : <ChevronRight size={14} style={{ color: "#475569" }} />}
      </button>

      {expanded && (
        <div className="p-3">
          {/* Playbook list */}
          {!selected && (
            <div className="flex flex-col gap-1">
              {playbooks.map(pb => (
                <button
                  key={pb.id}
                  onClick={() => setSelectedId(pb.id)}
                  className="flex items-start gap-2 p-2 rounded-lg text-left hover:bg-white/5 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#56A837" }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#e2e8f0" }}>{pb.title}</div>
                    {pb.purpose && (
                      <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "#64748b" }}>{pb.purpose}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected playbook detail */}
          {selected && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "#64748b" }}
                >
                  <ChevronRight size={12} className="rotate-180" /> Back
                </button>
                <button
                  onClick={() => navigate("/admin/playbooks")}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "#3B85BA" }}
                >
                  View all <ExternalLink size={10} />
                </button>
              </div>

              <div className="text-xs font-bold mb-2" style={{ color: "#e2e8f0" }}>{selected.title}</div>

              {selected.purpose && (
                <div className="mb-2">
                  <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#475569" }}>Purpose</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{selected.purpose}</div>
                </div>
              )}

              {selected.whenToUse && (
                <div className="mb-2">
                  <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#475569" }}>When to Use</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{selected.whenToUse}</div>
                </div>
              )}

              {selected.stepByStepGuidance && (
                <div className="mb-2">
                  <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#475569" }}>Steps</div>
                  <div className="text-xs whitespace-pre-wrap" style={{ color: "#94a3b8" }}>
                    {selected.stepByStepGuidance.slice(0, 400)}{selected.stepByStepGuidance.length > 400 ? "…" : ""}
                  </div>
                </div>
              )}

              {selected.linkedScoringFrameworks && (
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {selected.linkedScoringFrameworks.split(",").map(f => (
                    <span key={f} className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "#0f1923", color: "#3B85BA", border: "1px solid #1e2d3d" }}>
                      {f.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
