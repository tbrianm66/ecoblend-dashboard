/**
 * PlaybookDrawer — Slide-in detail panel for viewing a playbook's full content.
 * Shows purpose, when-to-use, step-by-step guidance, inputs/outputs,
 * evidence requirements, linked templates, scoring frameworks, risk categories,
 * and a completion checklist with progress tracking.
 */
import { useState } from "react";
import { X, BookOpen, CheckCircle2, Circle, ChevronDown, ChevronUp, FileText, Target, AlertTriangle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface PlaybookDrawerProps {
  playbookId: string;
  ventureId: string | null;
  module: string;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Published: "#22c55e",
  Approved: "#3b82f6",
  Draft: "#94a3b8",
  "Under Review": "#f59e0b",
  Archived: "#6b7280",
  Superseded: "#a855f7",
};

const ACCESS_COLORS: Record<string, string> = {
  "Admin Only": "#ef4444",
  "Internal Team": "#3b82f6",
  "Venture Team": "#22c55e",
  "Advisor Access": "#8b5cf6",
  "Academic Partner Access": "#06b6d4",
  "Investor View": "#f59e0b",
  "Public / Exportable": "#10b981",
};

function safeParseList(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return val.split("\n").map(s => s.trim()).filter(Boolean);
  }
}

export default function PlaybookDrawer({ playbookId, ventureId, module, onClose }: PlaybookDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["purpose", "steps", "checklist"])
  );

  const { data: playbook, isLoading } = trpc.contextual.getPlaybookDetail.useQuery({ playbookId });
  const { data: completion } = trpc.contextual.getCompletionStatus.useQuery(
    { playbookId, ventureId: ventureId || "" },
    { enabled: !!ventureId }
  );

  const startMutation = trpc.contextual.startCompletion.useMutation();
  const updateMutation = trpc.contextual.updateCompletion.useMutation();
  const logEvent = trpc.contextual.logUsageEvent.useMutation();

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleStartPlaybook = async () => {
    if (!ventureId) return;
    await startMutation.mutateAsync({ playbookId, ventureId, module });
    logEvent.mutate({
      playbookId, ventureId, module,
      widgetType: "PlaybookDrawer",
      actionType: "Start",
    });
  };

  const handleToggleStep = async (step: string) => {
    if (!completion) return;
    const completedSteps = safeParseList(completion.completed_steps);
    const updated = completedSteps.includes(step)
      ? completedSteps.filter(s => s !== step)
      : [...completedSteps, step];
    await updateMutation.mutateAsync({
      completionId: completion.id,
      completedSteps: updated,
      completionStatus: updated.length === checklist.length ? "Completed" : "In_Progress",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 flex items-center justify-center border-l" style={{ borderColor: "#e5e7eb" }}>
        <div className="animate-pulse text-gray-400">Loading playbook...</div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 flex items-center justify-center border-l" style={{ borderColor: "#e5e7eb" }}>
        <div className="text-gray-400">Playbook not found</div>
      </div>
    );
  }

  const steps = safeParseList(playbook.step_by_step_guidance);
  const inputs = safeParseList(playbook.required_inputs);
  const outputs = safeParseList(playbook.required_outputs);
  const evidence = safeParseList(playbook.evidence_required);
  const templates = safeParseList(playbook.linked_templates);
  const frameworks = safeParseList(playbook.linked_scoring_frameworks);
  const risks = safeParseList(playbook.linked_risk_categories);
  const checklist = safeParseList(playbook.completion_checklist);
  const completedSteps = completion ? safeParseList(completion.completed_steps) : [];
  const completionPct = checklist.length > 0 ? Math.round((completedSteps.length / checklist.length) * 100) : 0;

  const Section = ({ id, title, icon, children, count }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }) => (
    <div className="border-b" style={{ borderColor: "#f1f5f9" }}>
      <button
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => toggleSection(id)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {title}
          {count !== undefined && <span className="text-xs text-gray-400 font-normal">({count})</span>}
        </div>
        {expandedSections.has(id) ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {expandedSections.has(id) && <div className="px-6 pb-4">{children}</div>}
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l" style={{ borderColor: "#e5e7eb" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" style={{ borderColor: STATUS_COLORS[playbook.status] || "#94a3b8", color: STATUS_COLORS[playbook.status] || "#94a3b8" }}>
              {playbook.status}
            </Badge>
            <Badge variant="outline" style={{ borderColor: ACCESS_COLORS[playbook.access_level] || "#94a3b8", color: ACCESS_COLORS[playbook.access_level] || "#94a3b8" }}>
              {playbook.access_level}
            </Badge>
            <span className="text-xs text-gray-400">v{playbook.version}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Prompt', sans-serif" }}>
            {playbook.title}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{playbook.category} &middot; {playbook.related_module}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Completion Progress Bar */}
      {ventureId && (
        <div className="px-6 py-3 border-b" style={{ borderColor: "#f1f5f9" }}>
          {completion ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-500">Completion Progress</span>
                <span className="text-xs font-mono" style={{ color: completionPct === 100 ? "#22c55e" : "#3b82f6" }}>
                  {completionPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%`, background: completionPct === 100 ? "#22c55e" : "#3b82f6" }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {completedSteps.length} of {checklist.length} steps completed
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full gap-2"
              style={{ background: "#51AF37" }}
              onClick={handleStartPlaybook}
              disabled={startMutation.isPending}
            >
              <BookOpen size={14} />
              {startMutation.isPending ? "Starting..." : "Start This Playbook"}
            </Button>
          )}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Purpose */}
        <Section id="purpose" title="Purpose" icon={<Target size={14} />}>
          <div className="text-sm text-gray-600 leading-relaxed">
            <Streamdown>{playbook.purpose || "No purpose defined."}</Streamdown>
          </div>
        </Section>

        {/* When to Use */}
        {playbook.when_to_use && (
          <Section id="when" title="When to Use" icon={<BookOpen size={14} />}>
            <div className="text-sm text-gray-600 leading-relaxed">
              <Streamdown>{playbook.when_to_use}</Streamdown>
            </div>
          </Section>
        )}

        {/* Step-by-Step Process */}
        {steps.length > 0 && (
          <Section id="steps" title="Step-by-Step Process" icon={<ClipboardList size={14} />} count={steps.length}>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#3b82f6" }}>
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Required Inputs */}
        {inputs.length > 0 && (
          <Section id="inputs" title="Required Inputs" icon={<FileText size={14} />} count={inputs.length}>
            <ul className="space-y-1">
              {inputs.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#3b82f6" }} />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Required Outputs */}
        {outputs.length > 0 && (
          <Section id="outputs" title="Required Outputs" icon={<FileText size={14} />} count={outputs.length}>
            <ul className="space-y-1">
              {outputs.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#22c55e" }} />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Evidence Required */}
        {evidence.length > 0 && (
          <Section id="evidence" title="Evidence Required" icon={<AlertTriangle size={14} />} count={evidence.length}>
            <ul className="space-y-1">
              {evidence.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#f59e0b" }} />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Linked Templates */}
        {templates.length > 0 && (
          <Section id="templates" title="Related Templates" icon={<FileText size={14} />} count={templates.length}>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Linked Scoring Frameworks */}
        {frameworks.length > 0 && (
          <Section id="frameworks" title="Related Scoring Frameworks" icon={<Target size={14} />} count={frameworks.length}>
            <div className="flex flex-wrap gap-1.5">
              {frameworks.map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: "#3b82f6", color: "#3b82f6" }}>{f}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Linked Risk Categories */}
        {risks.length > 0 && (
          <Section id="risks" title="Related Risk Categories" icon={<AlertTriangle size={14} />} count={risks.length}>
            <div className="flex flex-wrap gap-1.5">
              {risks.map((r, i) => (
                <Badge key={i} variant="outline" className="text-xs" style={{ borderColor: "#ef4444", color: "#ef4444" }}>{r}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Completion Checklist */}
        {checklist.length > 0 && (
          <Section id="checklist" title="Completion Checklist" icon={<CheckCircle2 size={14} />} count={checklist.length}>
            <ul className="space-y-2">
              {checklist.map((item, i) => {
                const done = completedSteps.includes(item);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                    onClick={() => completion && handleToggleStep(item)}
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                    ) : (
                      <Circle size={16} className="flex-shrink-0 mt-0.5 text-gray-300" />
                    )}
                    <span className={done ? "text-gray-400 line-through" : "text-gray-600"}>{item}</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
        <span className="text-xs text-gray-400">
          Last updated: {playbook.updated_at ? new Date(Number(playbook.updated_at)).toLocaleDateString() : "N/A"}
        </span>
        <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
