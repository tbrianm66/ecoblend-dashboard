// ============================================================
// ECOBLEND — VentureContext
// Global editable state for all venture data.
// Persists to localStorage so edits survive page refresh.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Venture, Milestone, ventures as initialVentures, portfolioStats } from "@/lib/data";

interface VentureContextType {
  ventures: Venture[];
  updateVentureReadiness: (id: string, vrl: number, vrlPercent: number, trl: number, trlPercent: number) => void;
  updateMilestone: (ventureId: string, milestoneIndex: number, completed: boolean) => void;
  updateAllMilestones: (ventureId: string, milestones: Milestone[]) => void;
  updateRiskLevel: (ventureId: string, domain: string, level: "Low" | "Medium" | "High") => void;
  addVenture: (venture: Venture) => void;
  stats: typeof portfolioStats;
  resetToDefaults: () => void;
}

const VentureContext = createContext<VentureContextType | null>(null);

const STORAGE_KEY = "ecoblend-ventures-v1";

function computeStats(ventures: Venture[]) {
  const active = ventures.filter(v => v.status === "Active" || v.status === "Scaling");
  return {
    totalVentures: ventures.length,
    activeVentures: active.length,
    avgVrl: ventures.length ? parseFloat((ventures.reduce((a, v) => a + v.vrl, 0) / ventures.length).toFixed(1)) : 0,
    avgTrl: ventures.length ? parseFloat((ventures.reduce((a, v) => a + v.trl, 0) / ventures.length).toFixed(1)) : 0,
    investmentReadyCount: ventures.filter(v => v.investmentReady).length,
    totalMilestonesCompleted: ventures.reduce((acc, v) => acc + v.milestones.filter(m => m.completed).length, 0),
    totalMilestones: ventures.reduce((acc, v) => acc + v.milestones.length, 0),
  };
}

export function VentureProvider({ children }: { children: ReactNode }) {
  const [ventures, setVentures] = useState<Venture[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialVentures;
    } catch {
      return initialVentures;
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ventures));
    } catch {}
  }, [ventures]);

  const updateVentureReadiness = useCallback((id: string, vrl: number, vrlPercent: number, trl: number, trlPercent: number) => {
    setVentures(prev => prev.map(v => {
      if (v.id !== id) return v;
      const investmentReady = vrl >= 3 && trl >= 6;
      return { ...v, vrl, vrlPercent, trl, trlPercent, investmentReady };
    }));
  }, []);

  const updateMilestone = useCallback((ventureId: string, milestoneIndex: number, completed: boolean) => {
    setVentures(prev => prev.map(v => {
      if (v.id !== ventureId) return v;
      const milestones = v.milestones.map((m, i) => i === milestoneIndex ? { ...m, completed } : m);
      return { ...v, milestones };
    }));
  }, []);

  const updateAllMilestones = useCallback((ventureId: string, milestones: Milestone[]) => {
    setVentures(prev => prev.map(v => {
      if (v.id !== ventureId) return v;
      return { ...v, milestones };
    }));
  }, []);

  const updateRiskLevel = useCallback((ventureId: string, domain: string, level: "Low" | "Medium" | "High") => {
    setVentures(prev => prev.map(v => {
      if (v.id !== ventureId) return v;
      const risks = v.risks.map(r => r.domain === domain ? { ...r, level } : r);
      return { ...v, risks };
    }));
  }, []);

  const addVenture = useCallback((venture: Venture) => {
    setVentures(prev => [...prev, venture]);
  }, []);

  const resetToDefaults = useCallback(() => {
    setVentures(initialVentures);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const stats = computeStats(ventures);

  return (
    <VentureContext.Provider value={{
      ventures,
      updateVentureReadiness,
      updateMilestone,
      updateAllMilestones,
      updateRiskLevel,
      addVenture,
      stats,
      resetToDefaults,
    }}>
      {children}
    </VentureContext.Provider>
  );
}

export function useVentures() {
  const ctx = useContext(VentureContext);
  if (!ctx) throw new Error("useVentures must be used inside VentureProvider");
  return ctx;
}
