// ── Workflow Engine Dashboard ─────────────────────────────────────────────────
// Monitors and manages cross-module automated triggers for the Venture OS.
// Three triggers:
//   1. research_completed  → TRL evidence experiment in Experiment Log
//   2. audit_failed        → CAPA task in Venture Project Management
//   3. supplier_approved   → Approved Supplier List pre-fill

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Zap,
  CheckCircle2,
  XCircle,
  SkipForward,
  RefreshCw,
  Play,
  FlaskConical,
  ClipboardCheck,
  UserCheck,
  ChevronRight,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TriggerType = "research_completed" | "audit_failed" | "supplier_approved";

const TRIGGER_META: Record<
  TriggerType,
  { label: string; icon: React.ReactNode; source: string; target: string; color: string }
> = {
  research_completed: {
    label: "Research Completed",
    icon: <FlaskConical size={14} />,
    source: "University Playbook",
    target: "Experiment Log (TRL Evidence)",
    color: "#3A97D3",
  },
  audit_failed: {
    label: "Audit Failed",
    icon: <ClipboardCheck size={14} />,
    source: "China Mfg Playbook",
    target: "Venture Project Management (CAPA Task)",
    color: "#F49C13",
  },
  supplier_approved: {
    label: "Supplier Approved",
    icon: <UserCheck size={14} />,
    source: "China Mfg Playbook",
    target: "Approved Supplier List",
    color: "#51AF37",
  },
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode }> = {
  success: { label: "Success", variant: "default", icon: <CheckCircle2 size={12} /> },
  failed: { label: "Failed", variant: "destructive", icon: <XCircle size={12} /> },
  skipped: { label: "Skipped", variant: "secondary", icon: <SkipForward size={12} /> },
  pending: { label: "Pending", variant: "outline", icon: <RefreshCw size={12} /> },
};

// ── Manual Fire Dialog ────────────────────────────────────────────────────────

function ManualFireDialog({ onClose }: { onClose: () => void }) {
  const [triggerType, setTriggerType] = useState<TriggerType>("research_completed");
  const [recordId, setRecordId] = useState("");
  const utils = trpc.useUtils();

  const fireMutation = trpc.workflowEngine.fireTrigger.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      utils.workflowEngine.listTriggerLog.invalidate();
      utils.workflowEngine.getTriggerStats.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFire = () => {
    const id = parseInt(recordId, 10);
    if (!recordId || isNaN(id)) {
      toast.error("Please enter a valid record ID");
      return;
    }
    fireMutation.mutate({ triggerType, sourceRecordId: id });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play size={16} style={{ color: "#51AF37" }} />
            Fire Trigger Manually
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Trigger Type
            </label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TRIGGER_META) as TriggerType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      {TRIGGER_META[t].icon}
                      {TRIGGER_META[t].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Source Record ID
            </label>
            <Input
              type="number"
              placeholder="e.g. 42"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {triggerType === "research_completed" && "ID of the university research project"}
              {triggerType === "audit_failed" && "ID of the factory audit record"}
              {triggerType === "supplier_approved" && "ID of the supplier onboarding record"}
            </p>
          </div>
          <div className="rounded-lg p-3 text-xs" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <p className="font-semibold text-blue-700 mb-1 flex items-center gap-1">
              <Info size={12} /> Trigger flow
            </p>
            <p className="text-blue-600">
              <strong>{TRIGGER_META[triggerType].source}</strong>
              <ChevronRight size={10} className="inline mx-1" />
              <strong>{TRIGGER_META[triggerType].target}</strong>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleFire}
            disabled={fireMutation.isPending}
            style={{ background: "#51AF37", color: "white" }}
          >
            {fireMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Play size={14} className="mr-2" />}
            Fire Trigger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Detail Dialog ─────────────────────────────────────────────────────────

function LogDetailDialog({ logId, onClose }: { logId: number; onClose: () => void }) {
  const { data: log } = trpc.workflowEngine.getTriggerLog.useQuery({ id: logId });
  const utils = trpc.useUtils();

  const rerunMutation = trpc.workflowEngine.rerunTrigger.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      utils.workflowEngine.listTriggerLog.invalidate();
      utils.workflowEngine.getTriggerStats.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!log) return null;

  const meta = TRIGGER_META[log.triggerType as TriggerType];
  const statusInfo = STATUS_BADGE[log.status] ?? STATUS_BADGE.pending;

  const handleRerun = () => {
    rerunMutation.mutate({
      triggerType: log.triggerType as TriggerType,
      sourceRecordId: log.sourceRecordId,
      originalLogId: log.id,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={16} style={{ color: meta?.color }} />
            Trigger Log #{log.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Type</p>
              <p className="font-medium">{meta?.label ?? log.triggerType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Status</p>
              <Badge variant={statusInfo.variant} className="gap-1">
                {statusInfo.icon}{statusInfo.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Source Module</p>
              <p className="font-medium">{log.sourceModule}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Source Record ID</p>
              <p className="font-mono">{log.sourceRecordId}</p>
            </div>
            {log.targetModule && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Target Module</p>
                <p className="font-medium">{log.targetModule}</p>
              </div>
            )}
            {log.targetRecordId && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Target Record ID</p>
                <p className="font-mono">{log.targetRecordId}</p>
              </div>
            )}
            {log.ventureId && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Venture</p>
                <p className="font-mono">{log.ventureId}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Fired At</p>
              <p>{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {log.result && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Result</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24">{JSON.stringify(JSON.parse(log.result), null, 2)}</pre>
            </div>
          )}
          {log.error && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Error</p>
              <pre className="text-xs bg-red-50 text-red-700 rounded p-2 overflow-auto max-h-24">{log.error}</pre>
            </div>
          )}
          {log.payload && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payload</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24">{JSON.stringify(JSON.parse(log.payload), null, 2)}</pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {log.status === "failed" && (
            <Button
              onClick={handleRerun}
              disabled={rerunMutation.isPending}
              style={{ background: "#F49C13", color: "white" }}
            >
              {rerunMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
              Re-run Trigger
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkflowEngine() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFireDialog, setShowFireDialog] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: stats, isLoading: statsLoading } = trpc.workflowEngine.getTriggerStats.useQuery();
  const { data: logData, isLoading: logLoading } = trpc.workflowEngine.listTriggerLog.useQuery({
    triggerType: filterType === "all" ? undefined : filterType,
    status: filterStatus === "all" ? undefined : filterStatus,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = logData ? Math.ceil(logData.total / PAGE_SIZE) : 0;

  // ── Stats cards ──────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total Triggers Fired",
      value: statsLoading ? "—" : stats?.totalFired ?? 0,
      icon: <Zap size={18} />,
      color: "#3A97D3",
    },
    {
      label: "Successful",
      value: statsLoading ? "—" : stats?.totalSuccess ?? 0,
      icon: <CheckCircle2 size={18} />,
      color: "#51AF37",
    },
    {
      label: "Failed",
      value: statsLoading ? "—" : stats?.totalFailed ?? 0,
      icon: <XCircle size={18} />,
      color: "#ef4444",
    },
    {
      label: "Success Rate",
      value: statsLoading
        ? "—"
        : stats?.totalFired
        ? `${Math.round((stats.totalSuccess / stats.totalFired) * 100)}%`
        : "N/A",
      icon: <Activity size={18} />,
      color: "#F49C13",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "#51AF3715", color: "#51AF37" }}
              >
                Venture OS
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-mono">Cross-Module Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Prompt', sans-serif" }}>
              Workflow Engine
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Automated cross-module triggers that connect the University, Manufacturing, and Project Management modules into a unified Venture OS.
            </p>
          </div>
          <Button
            onClick={() => setShowFireDialog(true)}
            style={{ background: "#51AF37", color: "white" }}
            className="gap-2"
          >
            <Play size={14} />
            Fire Trigger
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </span>
                  <span style={{ color: card.color }}>{card.icon}</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: card.color, fontFamily: "'Prompt', sans-serif" }}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trigger Type Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(TRIGGER_META) as TriggerType[]).map((t) => {
            const meta = TRIGGER_META[t];
            const s = stats?.summary?.[t];
            return (
              <Card key={t} className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    {meta.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{meta.source}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium text-right max-w-[180px]">{meta.target}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle2 size={10} /> {s?.success ?? 0} success
                    </Badge>
                    {(s?.failed ?? 0) > 0 && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <XCircle size={10} /> {s?.failed} failed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trigger Log Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity size={16} style={{ color: "#3A97D3" }} />
                Trigger Log
                {logData && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({logData.total} total)
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(0); }}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {(Object.keys(TRIGGER_META) as TriggerType[]).map((t) => (
                      <SelectItem key={t} value={t}>{TRIGGER_META[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading trigger log…</div>
            ) : !logData?.rows.length ? (
              <div className="p-12 text-center">
                <Zap size={32} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground font-medium">No triggers fired yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Triggers fire automatically when research is completed, audits fail, or suppliers are approved.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => setShowFireDialog(true)}
                >
                  <Play size={12} /> Fire a test trigger
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Venture</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fired At</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logData.rows.map((row) => {
                      const meta = TRIGGER_META[row.triggerType as TriggerType];
                      const statusInfo = STATUS_BADGE[row.status] ?? STATUS_BADGE.pending;
                      return (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedLogId(row.id)}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: meta?.color }}>
                              {meta?.icon}
                              {meta?.label ?? row.triggerType}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.sourceModule} #{row.sourceRecordId}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.targetModule ? `${row.targetModule} #${row.targetRecordId ?? "—"}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{row.ventureId ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="gap-1 text-xs">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(row.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {row.status === "failed" && (
                              <AlertTriangle size={14} className="text-destructive" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {showFireDialog && <ManualFireDialog onClose={() => setShowFireDialog(false)} />}
      {selectedLogId !== null && (
        <LogDetailDialog logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
      )}
    </div>
  );
}
