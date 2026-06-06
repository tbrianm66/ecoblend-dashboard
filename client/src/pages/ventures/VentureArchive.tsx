// ============================================================
// VENTURE ARCHIVE
// Route: /ventures/archive           → global killed-ventures list
//        /ventures/:id/archive       → per-venture archive card
// ============================================================
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSelectedVenture } from "@/contexts/SelectedVentureContext";
import { STAGE_LABELS, type LeanStage } from "@shared/workflowStages";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Archive, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { ModuleHeader, VentureSelector, NoVentureState } from "@/components/discovery/primitives";

// ── helpers ───────────────────────────────────────────────────────────────────
function stageBadge(stage: string | null | undefined) {
  if (!stage) return "—";
  return STAGE_LABELS[stage as LeanStage] ?? stage;
}

function formatDate(val: string | Date | null | undefined) {
  if (!val) return "—";
  const d = typeof val === "string" ? new Date(val) : val;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── Per-venture archive card ──────────────────────────────────────────────────
function VentureArchiveCard({ ventureId }: { ventureId: string }) {
  const [restoredBy, setRestoredBy] = useState("");
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const archQ  = trpc.decisionGate.getArchive.useQuery({ ventureId });
  const histQ  = trpc.decisionGate.listDecisions.useQuery({ ventureId });
  const gateQ  = trpc.decisionGate.checkGate.useQuery({ ventureId });

  const restore = trpc.decisionGate.restore.useMutation({
    onSuccess: () => {
      toast.success("Venture restored to Command Centre Review");
      utils.decisionGate.getArchive.invalidate({ ventureId });
      utils.decisionGate.checkGate.invalidate({ ventureId });
    },
    onError: (e) => toast.error(e.message),
  });

  const archive = archQ.data;
  const isKilled = gateQ.data?.validationStatus === "killed";

  return (
    <div className="space-y-6">
      {/* Archive record */}
      {archQ.isLoading ? (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-400">Loading archive record…</div>
      ) : !archive ? (
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
          No archive record found for this venture.{" "}
          {isKilled && "(Venture is killed but may have been archived before this feature was added.)"}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Archive size={15} />
            Archive Record
            <Badge
              className={archive.status === "archived"
                ? "ml-auto bg-rose-100 text-rose-700 border-rose-300"
                : "ml-auto bg-emerald-100 text-emerald-700 border-emerald-300"}
            >
              {archive.status === "archived" ? "Archived" : "Restored"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y">
            {[
              { label: "Final Stage",    value: stageBadge(archive.finalStage) },
              { label: "Archived At",    value: formatDate(archive.createdAt) },
              { label: "Archived By",    value: archive.archivedBy ?? "—" },
              { label: "Status",         value: archive.status === "restored" ? `Restored by ${archive.restoredBy}` : "Archived" },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
          {archive.archiveReason && (
            <div className="px-5 py-4 border-t bg-gray-50">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Archive Reason</p>
              <p className="text-sm text-gray-700">{archive.archiveReason}</p>
            </div>
          )}

          {/* Restore section */}
          {archive.status === "archived" && (
            <div className="px-5 py-4 border-t flex flex-wrap items-center gap-3">
              <Input
                placeholder="Your name (required to restore)"
                value={restoredBy}
                onChange={(e) => setRestoredBy(e.target.value)}
                className="text-sm max-w-xs"
              />
              <Button
                variant="outline"
                onClick={() => restore.mutate({ ventureId, restoredBy: restoredBy.trim() })}
                disabled={!restoredBy.trim() || restore.isPending}
              >
                {restore.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
                Restore Venture
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Decision timeline */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 text-sm font-semibold text-gray-700">Decision Timeline</div>
        {histQ.isLoading ? (
          <div className="p-5 text-sm text-gray-400">Loading…</div>
        ) : (histQ.data?.length ?? 0) === 0 ? (
          <div className="p-5 text-sm text-gray-400">No decisions recorded.</div>
        ) : (
          <ul className="divide-y">
            {histQ.data!.map((row) => (
              <li key={row.id} className="px-5 py-3 flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0
                  ${row.recommendedAction === "advance" ? "bg-emerald-500"
                    : row.recommendedAction === "kill" ? "bg-rose-500"
                    : "bg-amber-500"}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{row.decisionTitle}</p>
                  {row.decisionSummary && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{row.decisionSummary}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {row.approvedBy ?? "—"} · {row.decisionDate ?? formatDate(row.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Global archive listing ────────────────────────────────────────────────────
function GlobalArchive() {
  const [, navigate] = useLocation();
  const allQ = trpc.decisionGate.listAllArchived.useQuery();

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Archive size={15} />
        Killed / Archived Ventures
        <Badge variant="outline" className="ml-auto">{allQ.data?.length ?? 0}</Badge>
      </div>
      {allQ.isLoading ? (
        <div className="p-6 text-sm text-gray-400">Loading…</div>
      ) : (allQ.data?.length ?? 0) === 0 ? (
        <div className="p-6 text-sm text-gray-500">No ventures have been archived yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-2.5 text-left">Venture</th>
              <th className="px-5 py-2.5 text-left">Final Stage</th>
              <th className="px-5 py-2.5 text-left">Archived At</th>
              <th className="px-5 py-2.5 text-left">Archived By</th>
              <th className="px-5 py-2.5 text-left">Status</th>
              <th className="px-5 py-2.5 text-left" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {allQ.data!.map(({ archive, ventureName }) => (
              <tr key={archive.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">
                  {ventureName ?? archive.ventureId}
                </td>
                <td className="px-5 py-3 text-gray-600">{stageBadge(archive.finalStage)}</td>
                <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(archive.createdAt)}</td>
                <td className="px-5 py-3 text-gray-600">{archive.archivedBy ?? "—"}</td>
                <td className="px-5 py-3">
                  <Badge
                    className={archive.status === "archived"
                      ? "bg-rose-100 text-rose-700 border-rose-300"
                      : "bg-emerald-100 text-emerald-700 border-emerald-300"}
                  >
                    {archive.status === "archived" ? "Archived" : "Restored"}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => navigate(`/ventures/${archive.ventureId}/archive`)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function VentureArchive() {
  const { id: paramId } = useParams<{ id?: string }>();
  const { selectedVentureId } = useSelectedVenture();

  // If route has an explicit id param, show per-venture view
  const perVenture = !!paramId;
  const ventureId  = paramId ?? selectedVentureId ?? "";

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <ModuleHeader
        title={perVenture ? "Venture Archive" : "All Archived Ventures"}
        purpose={perVenture
          ? "Archive record, decision timeline, and restore controls for this venture."
          : "All ventures that have reached a kill decision or been manually archived."}
        icon={<Archive size={22} />}
        action={<VentureSelector />}
      />

      {perVenture ? (
        <VentureArchiveCard ventureId={ventureId} />
      ) : (
        <>
          <GlobalArchive />
          {selectedVentureId && (
            <div className="text-sm text-gray-500">
              Viewing global archive. To see the archive record for a specific venture, navigate to
              <span className="font-mono ml-1 text-xs bg-gray-100 px-1 py-0.5 rounded">
                /ventures/&lt;id&gt;/archive
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
