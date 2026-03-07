// ============================================================
// ECOBLEND — VentureContext
// Global editable state for all venture data.
// Persists to localStorage so edits survive page refresh.
// Includes Playbook progress state with auto-VRL advancement.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Venture, Milestone, ventures as initialVentures, portfolioStats } from "@/lib/data";
import { toast } from "sonner";

// ── Playbook phase thresholds for auto-VRL advancement ──────────────────────
// Phase 1 (Fundamentals, tasks 1-17)  → 100% complete → advance to VRL 2
// Phase 2 (Kickoff, tasks 18-43)      → 100% complete → advance to VRL 3
// Phase 3 (Go-to-Market, tasks 44-75) → 100% complete → advance to VRL 4
// Phase 4 (Scaling, tasks 76-100)     → 100% complete → VRL 4 maintained

export type PlaybookProgress = Record<string, Record<string, boolean>>;

interface VentureContextType {
  ventures: Venture[];
  updateVentureReadiness: (id: string, vrl: number, vrlPercent: number, trl: number, trlPercent: number) => void;
  updateMilestone: (ventureId: string, milestoneIndex: number, completed: boolean) => void;
  updateAllMilestones: (ventureId: string, milestones: Milestone[]) => void;
  updateRiskLevel: (ventureId: string, domain: string, level: "Low" | "Medium" | "High") => void;
  addVenture: (venture: Venture) => void;
  stats: typeof portfolioStats;
  resetToDefaults: () => void;
  // Playbook
  playbookProgress: PlaybookProgress;
  togglePlaybookTask: (ventureId: string, taskId: string, phaseId: string, phaseTotalTasks: number, phaseNumber: number) => void;
  getVenturePlaybookPct: (ventureId: string) => number;
}

const VentureContext = createContext<VentureContextType | null>(null);

const STORAGE_KEY = "ecoblend-ventures-v1";
const PLAYBOOK_STORAGE_KEY = "ecoblend-playbook-v1";

// Phase task counts (must match PlaybookProgress.tsx)
const PHASE_TASK_COUNTS = [17, 26, 19, 15]; // phases 1-4

function computeStats(ventures: Venture[]) {
  // Exclude internal lab from portfolio stats
  ventures = ventures.filter(v => !v.isInternalLab);
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

// Derive VRL stage from playbook phase completion
function deriveVrlFromPlaybook(ventureId: string, progress: PlaybookProgress): number | null {
  const vp = progress[ventureId];
  if (!vp) return null;

  // Count completed tasks per phase using task ID prefixes
  const phaseTaskIds = [
    Array.from({ length: 17 }, (_, i) => `t${i + 1}`),
    Array.from({ length: 26 }, (_, i) => `t${i + 18}`),
    Array.from({ length: 19 }, (_, i) => `t${i + 44}`),
    Array.from({ length: 15 }, (_, i) => `t${i + 76}`),
  ];

  const phaseComplete = phaseTaskIds.map((ids, idx) => {
    const done = ids.filter(id => vp[id]).length;
    return done >= PHASE_TASK_COUNTS[idx];
  });

  if (phaseComplete[3]) return 4;
  if (phaseComplete[2]) return 4;
  if (phaseComplete[1]) return 3;
  if (phaseComplete[0]) return 2;
  return 1;
}

function buildDefaultPlaybookProgress(): PlaybookProgress {
  const VENTURE_IDS = ["ecoblend-rd", "ecoblend", "bebus", "tone", "real", "pipe"];
  const progress: PlaybookProgress = {};
  for (const id of VENTURE_IDS) {
    progress[id] = {};
    // Pre-populate demo data
    if (id === "ecoblend-rd") {
      for (let i = 1; i <= 10; i++) progress[id][`t${i}`] = true;
    } else if (id === "ecoblend") {
      for (let i = 1; i <= 8; i++) progress[id][`t${i}`] = true;
    } else if (id === "bebus") {
      for (let i = 1; i <= 6; i++) progress[id][`t${i}`] = true;
    } else if (id === "tone") {
      for (let i = 1; i <= 17; i++) progress[id][`t${i}`] = true;
      for (let i = 18; i <= 21; i++) progress[id][`t${i}`] = true;
    } else if (id === "real") {
      for (let i = 1; i <= 3; i++) progress[id][`t${i}`] = true;
    } else if (id === "pipe") {
      for (let i = 1; i <= 2; i++) progress[id][`t${i}`] = true;
    }
  }
  return progress;
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

  const [playbookProgress, setPlaybookProgress] = useState<PlaybookProgress>(() => {
    try {
      const stored = localStorage.getItem(PLAYBOOK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : buildDefaultPlaybookProgress();
    } catch {
      return buildDefaultPlaybookProgress();
    }
  });

  // Persist ventures to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ventures)); } catch {}
  }, [ventures]);

  // Persist playbook progress to localStorage
  useEffect(() => {
    try { localStorage.setItem(PLAYBOOK_STORAGE_KEY, JSON.stringify(playbookProgress)); } catch {}
  }, [playbookProgress]);

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
    setPlaybookProgress(buildDefaultPlaybookProgress());
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PLAYBOOK_STORAGE_KEY);
  }, []);

  // Toggle a playbook task and auto-advance VRL if a phase is completed
  const togglePlaybookTask = useCallback((
    ventureId: string,
    taskId: string,
    _phaseId: string,
    _phaseTotalTasks: number,
    phaseNumber: number,
  ) => {
    setPlaybookProgress(prev => {
      const updated: PlaybookProgress = {
        ...prev,
        [ventureId]: {
          ...prev[ventureId],
          [taskId]: !prev[ventureId]?.[taskId],
        },
      };

      // Check if this toggle completes a phase → auto-advance VRL
      const newVrl = deriveVrlFromPlaybook(ventureId, updated);
      if (newVrl !== null) {
        setVentures(vPrev => vPrev.map(v => {
          if (v.id !== ventureId) return v;
          const oldVrl = v.vrl;
          if (newVrl > oldVrl) {
            const vrlLabels = ["", "Fundamentals", "Kickoff", "Go-to-Market", "Scaling"];
            toast.success(
              `🎉 ${v.name} advanced to VRL ${newVrl} — ${vrlLabels[newVrl]}!`,
              { duration: 4000 }
            );
            return { ...v, vrl: newVrl, vrlPercent: Math.min(100, newVrl * 25), investmentReady: newVrl >= 3 && v.trl >= 6 };
          }
          // If unchecking drops a phase below 100%, reduce VRL
          if (newVrl < oldVrl) {
            return { ...v, vrl: newVrl, vrlPercent: Math.min(100, newVrl * 25), investmentReady: newVrl >= 3 && v.trl >= 6 };
          }
          return v;
        }));
      }

      return updated;
    });

    void phaseNumber; // suppress unused warning
  }, []);

  const getVenturePlaybookPct = useCallback((ventureId: string): number => {
    const vp = playbookProgress[ventureId];
    if (!vp) return 0;
    const totalTasks = PHASE_TASK_COUNTS.reduce((a, b) => a + b, 0); // 77
    const done = Object.values(vp).filter(Boolean).length;
    return Math.round((done / totalTasks) * 100);
  }, [playbookProgress]);

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
      playbookProgress,
      togglePlaybookTask,
      getVenturePlaybookPct,
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
