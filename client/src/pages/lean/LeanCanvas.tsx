// ============================================================================
// 4B. Lean Canvas — v2
// Live, versioned, evidence-linked business model validation tool.
// 11 blocks · per-block status + evidence status · scoring panel · export
// ============================================================================
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LayoutTemplate, Save, Plus, Copy, Eye, AlertTriangle,
  CheckCircle2, XCircle, Clock, ChevronDown, FileText, Zap,
  ChevronRight, Info, AlertCircle,
} from "lucide-react";
import {
  ModuleHeader, VentureSelector, NoVentureState,
} from "@/components/discovery/primitives";
import {
  BLOCK_TYPES, BLOCK_CONFIG, BLOCK_CONTENT_KEY,
  BLOCK_STATUS_OPTIONS, EVIDENCE_STATUS_OPTIONS,
  REASON_FOR_CHANGE_OPTIONS, OVERALL_STATUS_OPTIONS,
  calcCompletenessScore, calcBlockConfidence,
  calcEvidenceConfidenceScore, calcModelReadinessScore,
  completenessLabel, readinessLabel, getBlockWarnings,
  checkStageGateReadiness, generateCanvasSummaryMarkdown,
  type BlockType,
} from "@/lib/lean-canvas-scoring";

// ── Types ─────────────────────────────────────────────────────────────────────
type BlockMeta = {
  blockType: string;
  blockStatus?: string;
  evidenceStatus?: string;
  confidenceScore?: number;
  linkedHypothesisId?: string | null;
  contradictionSummary?: string | null;
  blockNotes?: string | null;
};

type CanvasRow = Record<string, any>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function blockStatusBadge(status: string) {
  const cfg = BLOCK_STATUS_OPTIONS.find((s) => s.value === status) ?? BLOCK_STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function evidenceStatusBadge(status: string) {
  const cfg = EVIDENCE_STATUS_OPTIONS.find((s) => s.value === status) ?? EVIDENCE_STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#dc2626";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

// ── Block Card ────────────────────────────────────────────────────────────────
function BlockCard({
  blockType, canvas, blockMeta, onEdit, readOnly,
}: {
  blockType: BlockType;
  canvas: CanvasRow;
  blockMeta: BlockMeta | undefined;
  onEdit: () => void;
  readOnly: boolean;
}) {
  const cfg = BLOCK_CONFIG[blockType];
  const contentKey = BLOCK_CONTENT_KEY[blockType];
  const content = canvas[contentKey] ?? "";
  const status = blockMeta?.blockStatus ?? "assumption";
  const evidStatus = blockMeta?.evidenceStatus ?? "no_evidence";
  const confidence = blockMeta?.confidenceScore ?? calcBlockConfidence(blockMeta ?? {});
  const hasContent = content.trim().length > 0;
  const warnings = getBlockWarnings(blockType, content, blockMeta, canvas);
  const isContradicted = evidStatus === "contradicted";

  return (
    <div
      className={`
        group relative bg-white rounded-xl border transition-all cursor-pointer
        ${isContradicted ? "border-red-300 shadow-sm shadow-red-100" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
      `}
      style={{ borderLeftWidth: 4, borderLeftColor: cfg.color }}
      onClick={!readOnly ? onEdit : undefined}
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{cfg.label}</span>
          </div>
          {warnings.length > 0 && (
            <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Content */}
        {hasContent ? (
          <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 mb-3">{content}</p>
        ) : (
          <p className="text-xs text-gray-300 italic mb-3">{cfg.hint}</p>
        )}

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {blockStatusBadge(status)}
          {evidenceStatusBadge(evidStatus)}
        </div>

        {/* Confidence bar */}
        <ConfidenceBar score={confidence} />

        {/* Warning chips */}
        {warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {warnings.slice(0, 2).map((w, i) => (
              <p key={i} className="text-[10px] text-amber-600 leading-snug">{w}</p>
            ))}
          </div>
        )}

        {/* Edit hint */}
        {!readOnly && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-600 shadow-sm border border-gray-200">
              Click to edit
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Block Edit Modal ──────────────────────────────────────────────────────────
function BlockEditModal({
  open, onClose, blockType, canvas, blockMeta, canvasId, ventureId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  blockType: BlockType;
  canvas: CanvasRow;
  blockMeta: BlockMeta | undefined;
  canvasId: number;
  ventureId: string;
  onSaved: (newCanvas: CanvasRow, newMeta: BlockMeta) => void;
}) {
  const cfg = BLOCK_CONFIG[blockType];
  const contentKey = BLOCK_CONTENT_KEY[blockType];

  const [content, setContent] = useState(canvas[contentKey] ?? "");
  const [blockStatus, setBlockStatus] = useState(blockMeta?.blockStatus ?? "assumption");
  const [evidenceStatus, setEvidenceStatus] = useState(blockMeta?.evidenceStatus ?? "no_evidence");
  const [confidenceScore, setConfidenceScore] = useState(blockMeta?.confidenceScore ?? 0);
  const [linkedHypothesisId, setLinkedHypothesisId] = useState(blockMeta?.linkedHypothesisId ?? "");
  const [contradictionSummary, setContradictionSummary] = useState(blockMeta?.contradictionSummary ?? "");
  const [blockNotes, setBlockNotes] = useState(blockMeta?.blockNotes ?? "");
  const [versionLabel, setVersionLabel] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [reasonForChange, setReasonForChange] = useState("discovery_learning");
  const [showVersionFields, setShowVersionFields] = useState(false);

  const utils = trpc.useUtils();

  const saveMutation = trpc.leanCanvas.save.useMutation({
    onSuccess: (newCanvas) => {
      utils.leanCanvas.getActive.invalidate({ ventureId });
      utils.leanCanvas.list.invalidate({ ventureId });
      const newMeta: BlockMeta = {
        blockType, blockStatus, evidenceStatus,
        confidenceScore, linkedHypothesisId: linkedHypothesisId || null,
        contradictionSummary: contradictionSummary || null,
        blockNotes: blockNotes || null,
      };
      onSaved(newCanvas, newMeta);
      toast.success(`${cfg.label} saved — v${newCanvas.version}`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (blockStatus === "validated" && evidenceStatus === "no_evidence") {
      toast.error("Block cannot be marked validated without linked evidence.");
      return;
    }
    const updated = { ...canvas, [contentKey]: content };
    saveMutation.mutate({
      ventureId,
      customerSegments:     updated.customerSegments,
      problem:              updated.problem,
      existingAlternatives: updated.existingAlternatives,
      uniqueValueProp:      updated.uniqueValueProp,
      solution:             updated.solution,
      channels:             updated.channels,
      revenueStreams:       updated.revenueStreams,
      costStructure:        updated.costStructure,
      keyMetrics:           updated.keyMetrics,
      unfairAdvantage:      updated.unfairAdvantage,
      highLevelConcept:     updated.highLevelConcept,
      mvpFormat:            updated.mvpFormat,
      hypothesisTested:     updated.hypothesisTested,
      successCriteria:      updated.successCriteria,
      notes:                updated.notes,
      canvasTitle:          updated.canvasTitle,
      overallStatus:        updated.overallStatus,
      versionLabel:         versionLabel || undefined,
      changeSummary:        changeSummary || undefined,
      reasonForChange:      reasonForChange || undefined,
      blocksMeta:           [{
        blockType, blockStatus, evidenceStatus,
        confidenceScore,
        linkedHypothesisId: linkedHypothesisId || null,
        contradictionSummary: contradictionSummary || null,
        blockNotes: blockNotes || null,
      }],
    });
  };

  const warnings = getBlockWarnings(blockType, content, { blockStatus, evidenceStatus, linkedHypothesisId }, canvas);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
            {cfg.label}
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">{cfg.prompt}</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Block Content */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="text-sm resize-none"
              placeholder={cfg.hint}
            />
            <p className="text-[10px] text-gray-400 mt-1">{cfg.hint}</p>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Block Status</label>
              <Select value={blockStatus} onValueChange={setBlockStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Evidence Status</label>
              <Select value={evidenceStatus} onValueChange={setEvidenceStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confidence + Hypothesis */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Confidence Score (0–100)</label>
              <Input
                type="number" min={0} max={100}
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Linked Hypothesis / ID</label>
              <Input
                value={linkedHypothesisId}
                onChange={(e) => setLinkedHypothesisId(e.target.value)}
                placeholder="e.g. H-003 or hypothesis text"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Contradiction summary */}
          {(evidenceStatus === "contradicted" || contradictionSummary) && (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Contradiction Summary</label>
              <Textarea
                value={contradictionSummary}
                onChange={(e) => setContradictionSummary(e.target.value)}
                rows={2}
                className="text-sm resize-none border-red-200"
                placeholder="Describe the contradicting evidence…"
              />
            </div>
          )}

          {/* Block notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Notes</label>
            <Textarea
              value={blockNotes}
              onChange={(e) => setBlockNotes(e.target.value)}
              rows={2}
              className="text-sm resize-none"
              placeholder="Internal notes, context, or next steps…"
            />
          </div>

          {/* Version metadata accordion */}
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setShowVersionFields(!showVersionFields)}
            >
              <span>Version metadata (optional)</span>
              <ChevronDown size={13} className={`transition-transform ${showVersionFields ? "rotate-180" : ""}`} />
            </button>
            {showVersionFields && (
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Version Label</label>
                  <Input
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder="e.g. Post-pilot learning"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason for Change</label>
                  <Select value={reasonForChange} onValueChange={setReasonForChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REASON_FOR_CHANGE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Change Summary</label>
                  <Textarea
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                    placeholder="What changed and why?"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{ background: "#56A837", color: "#fff" }}
          >
            <Save size={14} className="mr-1.5" />
            {saveMutation.isPending ? "Saving…" : "Save Block"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Canvas Settings Modal (title, overall status, version metadata) ───────────
function CanvasSaveModal({
  open, onClose, canvas, ventureId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  canvas: CanvasRow;
  ventureId: string;
  onSaved: (newCanvas: CanvasRow) => void;
}) {
  const [canvasTitle, setCanvasTitle] = useState(canvas.canvasTitle ?? "");
  const [overallStatus, setOverallStatus] = useState(canvas.overallStatus ?? "draft");
  const [versionLabel, setVersionLabel] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [reasonForChange, setReasonForChange] = useState("new_canvas");
  const utils = trpc.useUtils();

  const saveMutation = trpc.leanCanvas.save.useMutation({
    onSuccess: (newCanvas) => {
      utils.leanCanvas.getActive.invalidate({ ventureId });
      utils.leanCanvas.list.invalidate({ ventureId });
      onSaved(newCanvas);
      toast.success(`Canvas saved — v${newCanvas.version}`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    saveMutation.mutate({
      ventureId,
      ...canvas,
      canvasTitle,
      overallStatus,
      versionLabel: versionLabel || undefined,
      changeSummary: changeSummary || undefined,
      reasonForChange: reasonForChange || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Canvas Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Canvas Title</label>
            <Input value={canvasTitle} onChange={(e) => setCanvasTitle(e.target.value)} placeholder="e.g. BEBUS Canvas — Post-Pilot" className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Overall Status</label>
            <Select value={overallStatus} onValueChange={setOverallStatus}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OVERALL_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Version Label</label>
            <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="e.g. Initial assumption canvas" className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Reason for Change</label>
            <Select value={reasonForChange} onValueChange={setReasonForChange}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASON_FOR_CHANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Change Summary</label>
            <Textarea
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={2} className="text-sm resize-none"
              placeholder="What changed and why?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} style={{ background: "#56A837", color: "#fff" }}>
            {saveMutation.isPending ? "Saving…" : "Save Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Scores Panel ──────────────────────────────────────────────────────────────
function ScoresPanel({
  canvas, blocks, completeness, evidenceConf, modelReadiness, caps,
}: {
  canvas: CanvasRow;
  blocks: BlockMeta[];
  completeness: number;
  evidenceConf: number;
  modelReadiness: number;
  caps: string[];
}) {
  const { label: compLabel, color: compColor } = completenessLabel(completeness);
  const { label: readLabel, color: readColor } = readinessLabel(modelReadiness);

  const missingBlocks = BLOCK_TYPES.filter((bt) => {
    const val = canvas[BLOCK_CONTENT_KEY[bt]];
    return !val || (val as string).trim().length === 0;
  });

  const contradictedBlocks = blocks.filter((b) => b.evidenceStatus === "contradicted");
  const noEvidenceBlocks = blocks.filter(
    (b) => !b.evidenceStatus || b.evidenceStatus === "no_evidence"
  );

  const { ready, blockers } = checkStageGateReadiness(completeness, modelReadiness, blocks, canvas);

  return (
    <div className="space-y-4">
      {/* Score cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Canvas Scores</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Completeness</span>
              <span className="text-xs font-bold" style={{ color: compColor }}>{completeness}%</span>
            </div>
            <ScoreBar score={completeness} color={compColor} />
            <p className="text-[10px] text-gray-400 mt-0.5">{compLabel}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Evidence Confidence</span>
              <span className="text-xs font-bold text-blue-600">{evidenceConf}%</span>
            </div>
            <ScoreBar score={evidenceConf} color="#3b82f6" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Model Readiness</span>
              <span className="text-xs font-bold" style={{ color: readColor }}>{modelReadiness}</span>
            </div>
            <ScoreBar score={modelReadiness} color={readColor} />
            <p className="text-[10px] text-gray-400 mt-0.5">{readLabel}</p>
          </div>
        </div>
      </div>

      {/* Score caps */}
      {caps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">Score Caps</p>
          <div className="space-y-1">
            {caps.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700">{c}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage gate */}
      <div className={`border rounded-xl p-3 ${ready ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center gap-2 mb-2">
          {ready
            ? <CheckCircle2 size={13} className="text-green-600" />
            : <XCircle size={13} className="text-red-500" />}
          <p className="text-xs font-semibold" style={{ color: ready ? "#16a34a" : "#dc2626" }}>
            {ready ? "Ready for R&D Hub" : "Not ready for R&D Hub"}
          </p>
        </div>
        {!ready && blockers.length > 0 && (
          <div className="space-y-1">
            {blockers.slice(0, 4).map((b, i) => (
              <p key={i} className="text-[10px] text-red-700 leading-snug">{b}</p>
            ))}
            {blockers.length > 4 && (
              <p className="text-[10px] text-red-500">+{blockers.length - 4} more</p>
            )}
          </div>
        )}
      </div>

      {/* Missing blocks */}
      {missingBlocks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Missing Blocks</p>
          <div className="space-y-1">
            {missingBlocks.map((bt) => (
              <div key={bt} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: BLOCK_CONFIG[bt].color }} />
                <p className="text-[10px] text-gray-600">{BLOCK_CONFIG[bt].label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contradictions */}
      {contradictedBlocks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={12} className="text-red-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Contradicted</p>
          </div>
          {contradictedBlocks.map((b) => (
            <p key={b.blockType} className="text-[10px] text-red-600">
              {BLOCK_CONFIG[b.blockType as BlockType]?.label ?? b.blockType}
            </p>
          ))}
        </div>
      )}

      {/* No evidence blocks */}
      {noEvidenceBlocks.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            No Evidence ({noEvidenceBlocks.length})
          </p>
          <div className="space-y-0.5">
            {noEvidenceBlocks.slice(0, 5).map((b) => (
              <p key={b.blockType} className="text-[10px] text-gray-500">
                {BLOCK_CONFIG[b.blockType as BlockType]?.label ?? b.blockType}
              </p>
            ))}
            {noEvidenceBlocks.length > 5 && (
              <p className="text-[10px] text-gray-400">+{noEvidenceBlocks.length - 5} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LeanCanvas() {
  const { selectedVentureId: ventureId } = useSelectedVenture();
  const utils = trpc.useUtils();
  const v = ventureId ?? "";
  const enabled = !!ventureId;

  const history = trpc.leanCanvas.list.useQuery({ ventureId: v }, { enabled });
  const activeQ = trpc.leanCanvas.getActive.useQuery({ ventureId: v }, { enabled });

  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // The displayed canvas: either the active one or a viewed version
  const displayCanvas: CanvasRow | null = activeQ.data ?? null;
  const versions = history.data ?? [];
  const currentVersion = activeQ.data?.version ?? 0;
  const isViewing = viewingVersion !== null && viewingVersion !== currentVersion;

  // Canvas we're looking at (could be history or active)
  const [viewedCanvas, setViewedCanvas] = useState<CanvasRow | null>(null);
  const canvas = isViewing ? (viewedCanvas ?? displayCanvas) : displayCanvas;

  // Block metadata for the active canvas
  const blocksQ = trpc.leanCanvas.blocks.list.useQuery(
    { canvasId: canvas?.id ?? 0 },
    { enabled: enabled && !!canvas?.id }
  );

  // Local block meta state (optimistic updates)
  const [localBlocks, setLocalBlocks] = useState<BlockMeta[]>([]);
  const allBlocks: BlockMeta[] = blocksQ.data?.length
    ? blocksQ.data.map((b) => ({
        blockType: b.blockType,
        blockStatus: b.blockStatus ?? "assumption",
        evidenceStatus: b.evidenceStatus ?? "no_evidence",
        confidenceScore: b.confidenceScore ?? 0,
        linkedHypothesisId: b.linkedHypothesisId,
        contradictionSummary: b.contradictionSummary,
        blockNotes: b.blockNotes,
      }))
    : localBlocks;

  const getBlockMeta = (bt: BlockType) =>
    allBlocks.find((b) => b.blockType === bt);

  // Scores
  const completeness = canvas ? calcCompletenessScore(canvas) : 0;
  const evidenceConf = calcEvidenceConfidenceScore(allBlocks);
  const { score: modelReadiness, caps } = calcModelReadinessScore({
    completenessScore: completeness,
    evidenceConfidenceScore: evidenceConf,
    blocks: allBlocks,
    canvas: canvas ?? {},
  });

  const handleViewVersion = async (row: CanvasRow) => {
    setViewedCanvas(row);
    setViewingVersion(row.version);
  };

  const handleBackToActive = () => {
    setViewedCanvas(null);
    setViewingVersion(null);
  };

  const handleBlockSaved = (newCanvas: CanvasRow, newMeta: BlockMeta) => {
    setLocalBlocks((prev) => {
      const without = prev.filter((b) => b.blockType !== newMeta.blockType);
      return [...without, newMeta];
    });
  };

  const handleExport = useCallback(() => {
    if (!canvas || !ventureId) return;
    const md = generateCanvasSummaryMarkdown({
      venture: { id: ventureId, name: ventureId.toUpperCase() },
      canvas,
      blocks: allBlocks,
      completenessScore: completeness,
      evidenceConfidenceScore: evidenceConf,
      modelReadinessScore: modelReadiness,
      caps,
    });
    navigator.clipboard.writeText(md).then(() => {
      toast.success("Canvas summary copied to clipboard.");
    }).catch(() => {
      toast.error("Could not copy to clipboard.");
    });
  }, [canvas, allBlocks, completeness, evidenceConf, modelReadiness, caps, ventureId]);

  const handleDuplicate = () => {
    if (!canvas) return;
    setShowSaveModal(true);
  };

  if (!ventureId) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ModuleHeader
          title="Venture Model Canvas"
          purpose="A live, versioned business model canvas linked to hypotheses, experiments, evidence, and pivot decisions."
          icon={<LayoutTemplate size={22} />}
          action={<VentureSelector />}
        />
        <NoVentureState />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <ModuleHeader
            title="Venture Model Canvas"
            purpose="A live, versioned business model canvas linked to hypotheses, experiments, evidence, and pivot decisions."
            icon={<LayoutTemplate size={22} />}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <VentureSelector />
          </div>
        </div>

        {/* Version bar */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {/* Version selector */}
          {versions.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-gray-400" />
              <select
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
                value={viewingVersion ?? currentVersion}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v === currentVersion) {
                    handleBackToActive();
                  } else {
                    const row = versions.find((r) => r.version === v);
                    if (row) handleViewVersion(row);
                  }
                }}
              >
                {versions.map((r) => (
                  <option key={r.version} value={r.version}>
                    v{r.version}{r.versionLabel ? ` · ${r.versionLabel}` : ""}
                    {r.version === currentVersion ? " (active)" : ""}
                  </option>
                ))}
              </select>
              {isViewing && (
                <button
                  onClick={handleBackToActive}
                  className="text-xs text-amber-600 font-medium flex items-center gap-1 hover:text-amber-700"
                >
                  <ChevronRight size={12} /> Back to active
                </button>
              )}
            </div>
          )}

          {isViewing && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px]">
              <Eye size={10} className="mr-1" /> Read-only — viewing v{viewingVersion}
            </Badge>
          )}

          {!isViewing && currentVersion === 0 && (
            <span className="text-xs text-gray-400">No canvas saved yet — click any block to begin.</span>
          )}

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-2">
            {!isViewing && canvas && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleDuplicate}>
                <Plus size={13} /> New Version
              </Button>
            )}
            {canvas && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleExport}>
                <Copy size={13} /> Export Summary
              </Button>
            )}
          </div>
        </div>

        {/* Canvas title + overall status */}
        {canvas?.canvasTitle && (
          <div className="mt-3 flex items-center gap-2">
            <FileText size={13} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{canvas.canvasTitle}</span>
            {canvas.overallStatus && (
              <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                {OVERALL_STATUS_OPTIONS.find((o) => o.value === canvas.overallStatus)?.label ?? canvas.overallStatus}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Main: Grid + Scores Panel ────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex gap-4 px-6 pb-6">

        {/* Block grid */}
        <div className="flex-1 overflow-y-auto">
          {!canvas && !activeQ.isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <LayoutTemplate size={36} className="text-gray-200 mb-4" />
              <p className="text-sm font-semibold text-gray-500 mb-1">No canvas yet</p>
              <p className="text-xs text-gray-400 mb-4">Click any block below to start filling in your Venture Model Canvas.</p>
            </div>
          ) : null}

          {/* Evidence flow breadcrumb */}
          {canvas && (
            <div className="mb-4 bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-gray-500">
              <Zap size={11} className="text-green-500" />
              <span>Discovery Evidence</span>
              <ChevronRight size={10} />
              <span className="text-gray-700">Venture Model Canvas</span>
              <ChevronRight size={10} />
              <span>Proposition & Model</span>
              <ChevronRight size={10} />
              <span>Command Centre</span>
              <ChevronRight size={10} />
              <span>R&D Hub</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {BLOCK_TYPES.map((bt) => (
              <BlockCard
                key={bt}
                blockType={bt}
                canvas={canvas ?? {}}
                blockMeta={getBlockMeta(bt)}
                onEdit={() => setEditingBlock(bt)}
                readOnly={isViewing}
              />
            ))}
          </div>

          {/* Version history (collapsed) */}
          {versions.length > 1 && (
            <div className="mt-6 bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">Version History</span>
                <span className="text-xs text-gray-400">({versions.length} versions)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {versions.map((row) => {
                  const isActive = row.version === currentVersion;
                  const isSelected = row.version === viewingVersion;
                  return (
                    <button
                      key={row.version}
                      onClick={() => isActive ? handleBackToActive() : handleViewVersion(row)}
                      className={`
                        text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                        ${isSelected ? "border-amber-300 bg-amber-50 text-amber-700"
                          : isActive ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"}
                      `}
                    >
                      v{row.version}
                      {row.versionLabel ? ` · ${row.versionLabel}` : ""}
                      {isActive ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scores panel */}
        {canvas && (
          <div className="w-72 flex-shrink-0 overflow-y-auto">
            <ScoresPanel
              canvas={canvas}
              blocks={allBlocks}
              completeness={completeness}
              evidenceConf={evidenceConf}
              modelReadiness={modelReadiness}
              caps={caps}
            />
          </div>
        )}
      </div>

      {/* Block edit modal */}
      {editingBlock && canvas && (
        <BlockEditModal
          open={!!editingBlock}
          onClose={() => setEditingBlock(null)}
          blockType={editingBlock}
          canvas={canvas}
          blockMeta={getBlockMeta(editingBlock)}
          canvasId={canvas.id}
          ventureId={v}
          onSaved={(newCanvas, newMeta) => {
            handleBlockSaved(newCanvas, newMeta);
            activeQ.refetch();
            blocksQ.refetch();
          }}
        />
      )}

      {/* Canvas save modal */}
      {canvas && showSaveModal && (
        <CanvasSaveModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          canvas={canvas}
          ventureId={v}
          onSaved={(newCanvas) => {
            activeQ.refetch();
            history.refetch();
          }}
        />
      )}
    </div>
  );
}
