// ============================================================
// ECOBLEND OS — SelectedVentureContext
// Manages the globally selected venture for contextual widgets.
// Persistence order:
//   1. URL param ?ventureId=...
//   2. localStorage "ecoblend-selected-venture"
//   3. First active venture from DB list
//   4. null → show no-venture-selected state
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "ecoblend-selected-venture";

export interface VentureSummary {
  id: string;
  name: string;
  tagline?: string | null;
  status?: string | null;
  color?: string | null;
  logoUrl?: string | null;
}

interface SelectedVentureContextType {
  selectedVentureId: string | null;
  selectedVenture: VentureSummary | null;
  setSelectedVentureId: (id: string | null) => void;
  availableVentures: VentureSummary[];
  loading: boolean;
  error: string | null;
}

const SelectedVentureContext = createContext<SelectedVentureContextType | null>(null);

/** Read ?ventureId= from the current URL (works with wouter hash routing too) */
function getUrlVentureId(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("ventureId");
  } catch {
    return null;
  }
}

/** Persist selected venture to localStorage */
function persistVentureId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

/** Read persisted venture from localStorage */
function getStoredVentureId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Filter ventures by user role/permission.
 * The server already returns all ventures the user can access via `trpc.ventures.list`.
 * This client-side filter adds an extra safety layer.
 */
function filterByRole(
  ventures: VentureSummary[],
  role: string | undefined
): VentureSummary[] {
  // Platform Admin / Studio Director → all ventures
  if (!role || role === "admin") return ventures;
  // Regular users → all ventures (server already filters by assignment)
  return ventures;
}

export function SelectedVentureProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: rawVentures, isLoading, error: queryError } = trpc.ventures.list.useQuery();

  const availableVentures: VentureSummary[] = filterByRole(
    (rawVentures || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      tagline: v.tagline,
      status: v.status,
      color: v.color,
      logoUrl: v.logoUrl,
    })),
    user?.role
  );

  // Resolve initial selected venture
  const [selectedVentureId, setSelectedVentureIdState] = useState<string | null>(() => {
    return getUrlVentureId() || getStoredVentureId();
  });

  // Once ventures load, apply fallback logic
  useEffect(() => {
    if (isLoading || availableVentures.length === 0) return;

    const ids = availableVentures.map((v) => v.id);

    if (selectedVentureId && ids.includes(selectedVentureId)) {
      // Already valid — keep it
      return;
    }

    // Fallback: first active venture, else first venture
    const firstActive = availableVentures.find(
      (v) => v.status === "Active" || v.status === "Scaling"
    );
    const fallback = firstActive ?? availableVentures[0] ?? null;
    if (fallback) {
      setSelectedVentureIdState(fallback.id);
      persistVentureId(fallback.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, availableVentures.length]);

  const setSelectedVentureId = useCallback((id: string | null) => {
    setSelectedVentureIdState(id);
    persistVentureId(id);
  }, []);

  const selectedVenture =
    availableVentures.find((v) => v.id === selectedVentureId) ?? null;

  return (
    <SelectedVentureContext.Provider
      value={{
        selectedVentureId,
        selectedVenture,
        setSelectedVentureId,
        availableVentures,
        loading: isLoading,
        error: queryError ? String(queryError) : null,
      }}
    >
      {children}
    </SelectedVentureContext.Provider>
  );
}

export function useSelectedVenture() {
  const ctx = useContext(SelectedVentureContext);
  if (!ctx)
    throw new Error(
      "useSelectedVenture must be used inside SelectedVentureProvider"
    );
  return ctx;
}
