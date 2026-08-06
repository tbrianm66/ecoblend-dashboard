/**
 * VrlEvidencePanel — D7 Evidence Enforcement
 *
 * Two-party human-in-the-loop confirmation UI:
 *   • Submitters see their submitted URLs marked as "Pending Review" — they
 *     cannot confirm their own assessment.
 *   • Admins who did NOT submit the assessment can confirm each dimension by
 *     providing (or approving) the evidence URL and clicking "Confirm Evidence".
 *   • Confirmation state is derived from vrl_evidence_confirmations rows, NOT
 *     from the URLs supplied at submission time.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, AlertTriangle, Link,
  ShieldCheck, ShieldAlert, ShieldX, Clock,
} from "lucide-react";

// ── Dimension metadata ─────────────────────────────────────────────────────────
const DIM_META: Record<string, { code: string; label: string; color: string }> = {
  trlScore: { code: "TRL", label: "Technology Readiness",     color: "#3b82f6" },
  mrlScore: { code: "MRL", label: "Manufacturing Readiness",  color: "#6366f1" },
  brlScore: { code: "BRL", label: "Business Readiness",       color: "#22c55e" },
  ecoScore: { code: "ECO", label: "Environmental Impact",     color: "#10b981" },
  prlScore: { code: "PRL", label: "People & Org Readiness",   color: "#f59e0b" },
  ipScore:  { code: "IP",  label: "Intellectual Property",    color: "#f97316" },
  frlScore: { code: "FRL", label: "Financial Readiness",      color: "#8b5cf6" },
  regScore: { code: "REG", label: "Regulatory Readiness",     color: "#ec4899" },
  srlScore: { code: "SRL", label: "Sustainability Readiness", color: "#14b8a6" },
  // Gate 2: MVL — Market Validation Level (customer demand / discovery)
  mvlScore: { code: "MVL", label: "Market Validation",        color: "#a78bfa" },
};

const ALL_DIM_KEYS = Object.keys(DIM_META);

// ── Badge helper ───────────────────────────────────────────────────────────────
function EvidenceStatusBadge({ status }: { status: string }) {
  if (status === "fully_verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-950 border border-green-700 text-green-400">
        <ShieldCheck size={11} /> Verified
      </span>
    );
  }
  if (status === "partially_verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 border border-amber-700 text-amber-400">
        <ShieldAlert size={11} /> Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950 border border-red-800 text-red-400">
      <ShieldX size={11} /> Unverified
    </span>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface VrlEvidencePanelProps {
  assessmentId: string;
  /** Dimension keys still lacking a confirmed evidence record. */
  selfAssessedDimensions: string[];
  evidenceStatus: string;
  updatedAt?: string | Date | null;
  confirmedBy?: string | null;
  confirmedAt?: string | Date | null;
  /** URLs provided by the submitter — shown to reviewers as candidates to confirm. */
  submittedEvidenceLinks?: Partial<Record<string, string>> | null;
  onConfirmed?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function VrlEvidencePanel({
  assessmentId,
  selfAssessedDimensions,
  evidenceStatus,
  updatedAt,
  confirmedBy,
  confirmedAt,
  submittedEvidenceLinks,
  onConfirmed,
}: VrlEvidencePanelProps) {
  // Pre-fill from submitted URLs so admin can confirm in one click when URLs look good.
  // Filter ensures the Record<string,string> contract holds (no undefined values).
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>(
    () => {
      if (!submittedEvidenceLinks) return {};
      const entries = Object.entries(submittedEvidenceLinks)
        .filter((pair): pair is [string, string] => typeof pair[1] === "string" && pair[1].trim() !== "");
      return Object.fromEntries(entries);
    }
  );

  const unverifiedSet = new Set(selfAssessedDimensions);

  // Load existing confirmation records to show confirmed-by and timestamps
  const confirmations = trpc.vrl.getEvidenceConfirmations.useQuery(
    { assessmentId },
    { enabled: !!assessmentId },
  );
  const confirmedDimKeys = new Set(
    (confirmations.data ?? []).map(c => c.dimensionKey)
  );

  const confirmMutation = trpc.vrl.confirmEvidence.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.evidenceStatus === "fully_verified"
          ? "All dimensions confirmed — assessment is fully verified."
          : `${data.confirmedDims.length} dimension(s) confirmed. ${data.remainingUnverified.length} still pending.`
      );
      setUrlInputs({});
      confirmations.refetch();
      onConfirmed?.();
    },
    onError: (err) => {
      if (err.message.includes("Self-confirmation")) {
        toast.error("You cannot confirm your own assessment. Another admin must review it.");
      } else if (err.message.includes("FORBIDDEN") || err.data?.code === "FORBIDDEN") {
        toast.error("Admin access required to confirm evidence.");
      } else {
        toast.error(`Confirmation failed: ${err.message}`);
      }
    },
  });

  const handleConfirm = () => {
    const entries = Object.entries(urlInputs)
      .filter(([key, url]) => url.trim() !== "" && unverifiedSet.has(key));
    if (entries.length === 0) {
      toast.warning("Enter at least one evidence URL for an unconfirmed dimension.");
      return;
    }
    confirmMutation.mutate({
      assessmentId,
      knownUpdatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined,
      dimensionConfirmations: entries.map(([dimensionKey, evidenceUrl]) => ({
        dimensionKey: dimensionKey as any,
        evidenceUrl,
      })),
    });
  };

  const unconfirmedWithInput = Object.entries(urlInputs)
    .filter(([key, url]) => url.trim() !== "" && unverifiedSet.has(key));
  const hasInputs = unconfirmedWithInput.length > 0;

  return (
    <div className="bg-[#161b22] rounded-xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-white">Evidence Verification</span>
          <span className="text-xs text-gray-500 font-mono">D7</span>
        </div>
        <EvidenceStatusBadge status={evidenceStatus} />
      </div>

      {/* Admin notice — two-party model */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300">
        <strong>Two-party rule:</strong> Only admins may confirm evidence, and you cannot confirm your own assessment.
        Submitted URLs are shown below as candidates — verify each before confirming.
      </div>

      {/* Fully verified state */}
      {evidenceStatus === "fully_verified" && (
        <div className="flex items-center gap-2 py-3 text-sm text-green-400">
          <CheckCircle2 size={16} />
          <span>
            All 9 dimensions verified
            {confirmedBy && ` by ${confirmedBy}`}
            {confirmedAt && ` on ${new Date(confirmedAt).toLocaleDateString()}`}.
          </span>
        </div>
      )}

      {/* Dimension rows */}
      {evidenceStatus !== "fully_verified" && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {unverifiedSet.size} of 9 dimension{unverifiedSet.size !== 1 ? "s" : ""} lack confirmed evidence.
            {Object.keys(submittedEvidenceLinks ?? {}).length > 0 && (
              <span className="text-blue-400"> Submitted URLs are pre-filled — review and confirm.</span>
            )}
          </p>

          <div className="space-y-2">
            {ALL_DIM_KEYS.map(key => {
              const meta = DIM_META[key];
              const isUnverified = unverifiedSet.has(key);
              const isConfirmed  = confirmedDimKeys.has(key);
              const conf = (confirmations.data ?? []).find(c => c.dimensionKey === key);
              const submittedUrl = submittedEvidenceLinks?.[key];

              return (
                <div
                  key={key}
                  className="rounded-lg border p-3 transition-colors"
                  style={{
                    borderColor: isConfirmed ? "#22c55e30" : isUnverified ? "#374151" : "#374151",
                    background:  isConfirmed ? "#0d2010" : "transparent",
                  }}
                >
                  {/* Row header */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {isConfirmed
                      ? <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                      : <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                    }
                    <span className="text-xs font-mono font-bold" style={{ color: meta.color }}>{meta.code}</span>
                    <span className="text-xs text-gray-300">{meta.label}</span>
                    {isConfirmed && conf && (
                      <Badge variant="outline" className="ml-auto text-xs border-green-800 text-green-500">
                        Confirmed by {conf.confirmedBy ?? "admin"} · {new Date(conf.confirmedAt).toLocaleDateString()}
                      </Badge>
                    )}
                    {!isConfirmed && submittedUrl && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-blue-400">
                        <Clock size={10} /> URL submitted — pending review
                      </span>
                    )}
                  </div>

                  {/* URL input for unverified dimensions */}
                  {isUnverified && (
                    <input
                      type="url"
                      placeholder="https://evidence-url.example/doc"
                      value={urlInputs[key] ?? ""}
                      onChange={e => setUrlInputs(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full bg-[#0D1117] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
                    />
                  )}

                  {/* Confirmed URL (read-only) */}
                  {isConfirmed && conf?.evidenceUrl && (
                    <a
                      href={conf.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline break-all"
                    >
                      {conf.evidenceUrl}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm button — admin only, enforced server-side */}
          <Button
            onClick={handleConfirm}
            disabled={!hasInputs || confirmMutation.isPending}
            className="mt-4 w-full h-9 text-sm font-semibold"
            style={{ background: hasInputs ? "#56A837" : undefined }}
          >
            {confirmMutation.isPending
              ? "Confirming…"
              : `Confirm Evidence (${unconfirmedWithInput.length} ready)`
            }
          </Button>
          <p className="mt-2 text-xs text-center text-gray-600">
            Admin-only · Self-confirmation blocked · Identity from session
          </p>
        </>
      )}
    </div>
  );
}

// Re-export badge for use in portfolio cards and dashboard
export { EvidenceStatusBadge };
