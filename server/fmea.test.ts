import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getEngineeringRisksByVenture: vi.fn(),
  getEngineeringRiskById: vi.fn(),
  insertEngineeringRisk: vi.fn(),
  updateEngineeringRisk: vi.fn(),
  deleteEngineeringRisk: vi.fn(),
  getVentureTrlBlockers: vi.fn(),
  getMitigationsByRisk: vi.fn(),
  insertMitigationAction: vi.fn(),
  updateMitigationAction: vi.fn(),
  deleteMitigationAction: vi.fn(),
}));

import {
  getEngineeringRisksByVenture,
  insertEngineeringRisk,
  updateEngineeringRisk,
  deleteEngineeringRisk,
  getVentureTrlBlockers,
  getMitigationsByRisk,
  insertMitigationAction,
  updateMitigationAction,
  deleteMitigationAction,
} from "./db";

// ── RPN Calculation Logic (mirrors server logic) ──────────────────────────────
function calcRpn(s: number, o: number, d: number) {
  return s * o * d;
}

function getRpnLevel(rpn: number, severity?: number): "critical" | "warning" | "safe" {
  if (rpn > 100 || (severity !== undefined && severity >= 9)) return "critical";
  if (rpn >= 50) return "warning";
  return "safe";
}

// ── RPN Calculation Tests ─────────────────────────────────────────────────────
describe("FMEA RPN Calculation", () => {
  it("calculates RPN as S × O × D", () => {
    expect(calcRpn(5, 5, 5)).toBe(125);
    expect(calcRpn(3, 4, 2)).toBe(24);
    expect(calcRpn(10, 10, 10)).toBe(1000);
    expect(calcRpn(1, 1, 1)).toBe(1);
  });

  it("classifies RPN > 100 as critical", () => {
    expect(getRpnLevel(101)).toBe("critical");
    expect(getRpnLevel(500)).toBe("critical");
    expect(getRpnLevel(1000)).toBe("critical");
  });

  it("classifies severity >= 9 as critical regardless of RPN", () => {
    expect(getRpnLevel(50, 9)).toBe("critical");
    expect(getRpnLevel(20, 10)).toBe("critical");
  });

  it("classifies RPN 50–100 as warning", () => {
    expect(getRpnLevel(50)).toBe("warning");
    expect(getRpnLevel(100)).toBe("warning");
    expect(getRpnLevel(75)).toBe("warning");
  });

  it("classifies RPN < 50 as safe", () => {
    expect(getRpnLevel(49)).toBe("safe");
    expect(getRpnLevel(1)).toBe("safe");
    expect(getRpnLevel(24)).toBe("safe");
  });
});

// ── DB Helper Tests ───────────────────────────────────────────────────────────
describe("Engineering Risk DB helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getEngineeringRisksByVenture returns risks for a venture", async () => {
    const mockRisks = [
      { id: 1, ventureId: "ecoblend", componentName: "Battery Pack", failureMode: "Thermal runaway",
        failureEffect: "Fire", severity: 9, occurrence: 3, detection: 4, initialRpn: 108, relatedTrlStage: 4, notes: null },
    ];
    vi.mocked(getEngineeringRisksByVenture).mockResolvedValue(mockRisks);
    const result = await getEngineeringRisksByVenture("ecoblend");
    expect(result).toHaveLength(1);
    expect(result[0].componentName).toBe("Battery Pack");
    expect(result[0].initialRpn).toBe(108);
  });

  it("insertEngineeringRisk is called with correct data", async () => {
    vi.mocked(insertEngineeringRisk).mockResolvedValue(undefined as any);
    const data = {
      ventureId: "bebus", componentName: "Motor Controller", failureMode: "Overcurrent",
      failureEffect: "PCB damage", severity: 7, occurrence: 4, detection: 3, initialRpn: 84,
    };
    await insertEngineeringRisk(data as any);
    expect(insertEngineeringRisk).toHaveBeenCalledWith(expect.objectContaining({
      componentName: "Motor Controller",
      severity: 7,
    }));
  });

  it("updateEngineeringRisk is called with correct id and data", async () => {
    vi.mocked(updateEngineeringRisk).mockResolvedValue(undefined as any);
    await updateEngineeringRisk(1, { severity: 5, occurrence: 3, detection: 2 });
    expect(updateEngineeringRisk).toHaveBeenCalledWith(1, expect.objectContaining({ severity: 5 }));
  });

  it("deleteEngineeringRisk cascades to mitigations", async () => {
    vi.mocked(deleteEngineeringRisk).mockResolvedValue(undefined as any);
    await deleteEngineeringRisk(1);
    expect(deleteEngineeringRisk).toHaveBeenCalledWith(1);
  });
});

// ── TRL Blocker Tests ─────────────────────────────────────────────────────────
describe("TRL Blocker Logic", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns hasBlocker: false when no risks exist", async () => {
    vi.mocked(getVentureTrlBlockers).mockResolvedValue({ hasBlocker: false, blockerCount: 0, risks: [] });
    const result = await getVentureTrlBlockers("ecoblend");
    expect(result.hasBlocker).toBe(false);
    expect(result.blockerCount).toBe(0);
  });

  it("returns hasBlocker: true when unmitigated critical risks exist", async () => {
    vi.mocked(getVentureTrlBlockers).mockResolvedValue({
      hasBlocker: true,
      blockerCount: 2,
      risks: [
        { id: 1, componentName: "Battery Pack", initialRpn: 108 } as any,
        { id: 2, componentName: "Cooling System", initialRpn: 150 } as any,
      ],
    });
    const result = await getVentureTrlBlockers("ecoblend");
    expect(result.hasBlocker).toBe(true);
    expect(result.blockerCount).toBe(2);
    expect(result.risks).toHaveLength(2);
  });
});

// ── Mitigation Action Tests ───────────────────────────────────────────────────
describe("Mitigation Action DB helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMitigationsByRisk returns mitigations for a risk", async () => {
    const mockMitigations = [
      { id: 1, riskId: 1, actionDescription: "Add thermal fuse", owner: "Lead Engineer",
        status: "Implemented", revisedSeverity: 5, revisedOccurrence: 2, revisedDetection: 2, revisedRpn: 20 },
    ];
    vi.mocked(getMitigationsByRisk).mockResolvedValue(mockMitigations as any);
    const result = await getMitigationsByRisk(1);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("Implemented");
    expect(result[0].revisedRpn).toBe(20);
  });

  it("insertMitigationAction calculates revisedRpn", async () => {
    vi.mocked(insertMitigationAction).mockResolvedValue(undefined as any);
    const data = { riskId: 1, actionDescription: "Add fuse", status: "Identified",
      revisedSeverity: 4, revisedOccurrence: 3, revisedDetection: 2, revisedRpn: 24 };
    await insertMitigationAction(data as any);
    expect(insertMitigationAction).toHaveBeenCalledWith(expect.objectContaining({ revisedRpn: 24 }));
  });

  it("updateMitigationAction updates status to Verified", async () => {
    vi.mocked(updateMitigationAction).mockResolvedValue(undefined as any);
    await updateMitigationAction(1, { status: "Verified" });
    expect(updateMitigationAction).toHaveBeenCalledWith(1, expect.objectContaining({ status: "Verified" }));
  });

  it("deleteMitigationAction removes a mitigation", async () => {
    vi.mocked(deleteMitigationAction).mockResolvedValue(undefined as any);
    await deleteMitigationAction(5);
    expect(deleteMitigationAction).toHaveBeenCalledWith(5);
  });
});
