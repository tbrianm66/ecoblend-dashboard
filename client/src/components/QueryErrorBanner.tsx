/**
 * QueryErrorBanner — shown when a tRPC query returns an error.
 *
 * Usage (one or more queries):
 *   <QueryErrorBanner errors={[query1.error, query2.error]} />
 *
 * Renders nothing when no errors are present.
 */
import { AlertTriangle } from "lucide-react";

interface Props {
  /** Pass the `.error` property from one or more useQuery results. */
  errors: (unknown | null | undefined)[];
  /** Optional override for the fallback message. */
  message?: string;
}

export default function QueryErrorBanner({
  errors,
  message = "Unable to load data. Please refresh the page.",
}: Props) {
  const hasError = errors.some(Boolean);
  if (!hasError) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4"
    >
      <AlertTriangle size={14} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
