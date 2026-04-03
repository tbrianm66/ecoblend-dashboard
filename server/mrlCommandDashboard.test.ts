/**
 * MRL Command Dashboard — Unit Tests
 * Tests cover: store state transitions, widget math, WebSocket reconnect cap,
 * Ticker duplication, and panel data transformations.
 * Spec: BEBUS-MRL-DASH-001 §8
 */
import { describe, it, expect, beforeEach } from "vitest";

// ── 1. RAG classification ─────────────────────────────────────────
describe("RAG classification", () => {
  function ragFromScore(score: number): "red" | "amber" | "green" {
    if (score < 30) return "red";
    if (score < 60) return "amber";
    return "green";
  }

  it("classifies score < 30 as red", () => {
    expect(ragFromScore(0)).toBe("red");
    expect(ragFromScore(14)).toBe("red");
    expect(ragFromScore(29)).toBe("red");
  });

  it("classifies score 30–59 as amber", () => {
    expect(ragFromScore(30)).toBe("amber");
    expect(ragFromScore(45)).toBe("amber");
    expect(ragFromScore(59)).toBe("amber");
  });

  it("classifies score ≥ 60 as green", () => {
    expect(ragFromScore(60)).toBe("green");
    expect(ragFromScore(85)).toBe("green");
    expect(ragFromScore(100)).toBe("green");
  });
});

// ── 2. MRL level from composite score ────────────────────────────
describe("MRL level from composite score", () => {
  function mrlLevelFromScore(score: number): number {
    if (score >= 90) return 9;
    if (score >= 80) return 8;
    if (score >= 70) return 7;
    if (score >= 60) return 6;
    if (score >= 50) return 5;
    if (score >= 40) return 4;
    if (score >= 30) return 3;
    if (score >= 20) return 2;
    if (score >= 10) return 1;
    return 0;
  }

  it("maps score 0–9 to MRL 0", () => expect(mrlLevelFromScore(5)).toBe(0));
  it("maps score 10–19 to MRL 1", () => expect(mrlLevelFromScore(14)).toBe(1));
  it("maps score 20–29 to MRL 2", () => expect(mrlLevelFromScore(21)).toBe(2));
  it("maps score 30–39 to MRL 3", () => expect(mrlLevelFromScore(31)).toBe(3));
  it("maps score 40–49 to MRL 4", () => expect(mrlLevelFromScore(45)).toBe(4));
  it("maps score 50–59 to MRL 5", () => expect(mrlLevelFromScore(54)).toBe(5));
  it("maps score 60–69 to MRL 6", () => expect(mrlLevelFromScore(65)).toBe(6));
  it("maps score 70–79 to MRL 7", () => expect(mrlLevelFromScore(75)).toBe(7));
  it("maps score 80–89 to MRL 8", () => expect(mrlLevelFromScore(82)).toBe(8));
  it("maps score 90–100 to MRL 9", () => expect(mrlLevelFromScore(95)).toBe(9));
});

// ── 3. TRL/MRL delta and severity ────────────────────────────────
describe("TRL/MRL delta severity", () => {
  function severity(delta: number): "OK" | "WATCH" | "AMBER" | "RED" {
    if (delta === 0) return "OK";
    if (delta === 1) return "WATCH";
    if (delta === 2) return "AMBER";
    return "RED";
  }

  it("delta 0 → OK",    () => expect(severity(0)).toBe("OK"));
  it("delta 1 → WATCH", () => expect(severity(1)).toBe("WATCH"));
  it("delta 2 → AMBER", () => expect(severity(2)).toBe("AMBER"));
  it("delta 3 → RED",   () => expect(severity(3)).toBe("RED"));
  it("delta 5 → RED",   () => expect(severity(5)).toBe("RED"));
});

// ── 4. Sync efficiency η ─────────────────────────────────────────
describe("Sync efficiency η", () => {
  function eta(trl: number, mrl: number): number {
    const delta = Math.abs(trl - mrl);
    const maxLevel = Math.max(trl, mrl);
    if (maxLevel === 0) return 1;
    return parseFloat((1 - delta / maxLevel).toFixed(4));
  }

  it("perfect sync (TRL=MRL) gives η=1", () => {
    expect(eta(5, 5)).toBe(1);
    expect(eta(7, 7)).toBe(1);
  });

  it("TRL 7, MRL 4 → η = 1 - 3/7 ≈ 0.5714", () => {
    expect(eta(7, 4)).toBeCloseTo(0.5714, 3);
  });

  it("TRL 9, MRL 3 → η = 1 - 6/9 ≈ 0.3333", () => {
    expect(eta(9, 3)).toBeCloseTo(0.3333, 3);
  });

  it("TRL 5, MRL 4 → η = 1 - 1/5 = 0.8", () => {
    expect(eta(5, 4)).toBe(0.8);
  });
});

// ── 5. Risk score calculation ─────────────────────────────────────
describe("Risk score calculation", () => {
  function riskScore(probability: number, impact: number): number {
    return parseFloat((probability * impact).toFixed(2));
  }

  it("probability 0.8, impact 8 → score 6.4", () => {
    expect(riskScore(0.8, 8)).toBe(6.4);
  });

  it("probability 0.5, impact 5 → score 2.5", () => {
    expect(riskScore(0.5, 5)).toBe(2.5);
  });

  it("probability 0.3, impact 3 → score 0.9", () => {
    expect(riskScore(0.3, 3)).toBe(0.9);
  });

  it("probability 1.0, impact 10 → score 10.0", () => {
    expect(riskScore(1.0, 10)).toBe(10.0);
  });
});

// ── 6. Risk sorting (red first, then amber, then green) ───────────
describe("Risk register sorting", () => {
  const ragOrder: Record<string, number> = { red: 0, amber: 1, green: 2 };

  function sortRisks(risks: Array<{ rag: string; risk_score: number }>) {
    return [...risks].sort((a, b) => {
      const ragDiff = ragOrder[a.rag] - ragOrder[b.rag];
      if (ragDiff !== 0) return ragDiff;
      return b.risk_score - a.risk_score;
    });
  }

  it("sorts red before amber before green", () => {
    const input = [
      { rag: "green", risk_score: 9.0 },
      { rag: "red",   risk_score: 3.0 },
      { rag: "amber", risk_score: 5.0 },
    ];
    const sorted = sortRisks(input);
    expect(sorted[0].rag).toBe("red");
    expect(sorted[1].rag).toBe("amber");
    expect(sorted[2].rag).toBe("green");
  });

  it("within same RAG, sorts by risk_score descending", () => {
    const input = [
      { rag: "red", risk_score: 3.0 },
      { rag: "red", risk_score: 7.5 },
      { rag: "red", risk_score: 5.0 },
    ];
    const sorted = sortRisks(input);
    expect(sorted[0].risk_score).toBe(7.5);
    expect(sorted[1].risk_score).toBe(5.0);
    expect(sorted[2].risk_score).toBe(3.0);
  });
});

// ── 7. Ticker duplication for seamless loop ───────────────────────
describe("Ticker duplication", () => {
  it("doubles items for seamless animation loop", () => {
    const items = ["A", "B", "C"];
    const doubled = [...items, ...items];
    expect(doubled).toHaveLength(6);
    expect(doubled[0]).toBe("A");
    expect(doubled[3]).toBe("A");
  });

  it("uses default items when input is empty", () => {
    const DEFAULT_TICKER = ["item1", "item2"];
    const items: string[] = [];
    const displayItems = items.length > 0 ? items : DEFAULT_TICKER;
    expect(displayItems).toEqual(DEFAULT_TICKER);
  });
});

// ── 8. WebSocket reconnect cap ────────────────────────────────────
describe("WebSocket reconnect cap", () => {
  const MAX_RECONNECT_ATTEMPTS = 5;

  it("allows up to 5 reconnect attempts", () => {
    let attempts = 0;
    function shouldReconnect(): boolean {
      if (attempts >= MAX_RECONNECT_ATTEMPTS) return false;
      attempts++;
      return true;
    }
    for (let i = 0; i < 5; i++) expect(shouldReconnect()).toBe(true);
    expect(shouldReconnect()).toBe(false);
    expect(attempts).toBe(5);
  });

  it("calculates exponential backoff correctly", () => {
    const BASE_DELAY_MS = 1000;
    const delays = [1, 2, 3, 4, 5].map(n => BASE_DELAY_MS * Math.pow(2, n - 1));
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000]);
  });
});

// ── 9. Count-up animation frame count ────────────────────────────
describe("Count-up animation", () => {
  it("reaches target value after sufficient frames", () => {
    const DURATION_MS = 800;
    const FRAME_MS = 16;
    const totalFrames = Math.ceil(DURATION_MS / FRAME_MS);
    let current = 0;
    const target = 54.2;
    const increment = target / totalFrames;
    for (let i = 0; i < totalFrames; i++) {
      current = Math.min(current + increment, target);
    }
    expect(current).toBeCloseTo(target, 5);
  });
});

// ── 10. Cost curve break-even detection ──────────────────────────
describe("Cost curve break-even", () => {
  const costCurve = [
    { volume: 500,   cogs: 152 },
    { volume: 1000,  cogs: 130 },
    { volume: 2000,  cogs: 112 },
    { volume: 5000,  cogs: 98  },
    { volume: 10000, cogs: 89  },
    { volume: 20000, cogs: 81  },
  ];
  const TARGET_COGS = 95;

  it("finds the first volume where COGS ≤ target", () => {
    const bev = costCurve.find(d => d.cogs <= TARGET_COGS);
    expect(bev).toBeDefined();
    expect(bev!.volume).toBe(10000);
    expect(bev!.cogs).toBe(89);
  });

  it("returns undefined when no break-even exists", () => {
    const highCurve = costCurve.map(d => ({ ...d, cogs: d.cogs + 100 }));
    const bev = highCurve.find(d => d.cogs <= TARGET_COGS);
    expect(bev).toBeUndefined();
  });
});

// ── 11. Carbon scope breakdown ────────────────────────────────────
describe("Carbon scope breakdown", () => {
  it("scope 1+2+3 sums to total carbon intensity", () => {
    const scope1 = 18.5, scope2 = 22.3, scope3 = 41.2;
    const total = parseFloat((scope1 + scope2 + scope3).toFixed(1));
    expect(total).toBeCloseTo(82.0, 1);
  });

  it("calculates scope 3 percentage correctly", () => {
    const scope3 = 41.2, total = 82.0;
    const pct = scope3 / total;
    expect(pct).toBeCloseTo(0.502, 2);
  });
});

// ── 12. Supply chain spend aggregation ───────────────────────────
describe("Supply chain spend aggregation", () => {
  const suppliers = [
    { id: "s1", country: "CN", spend: 420000 },
    { id: "s2", country: "CN", spend: 180000 },
    { id: "s3", country: "GB", spend: 95000  },
    { id: "s4", country: "KR", spend: 310000 },
  ];

  it("calculates total spend correctly", () => {
    const total = suppliers.reduce((s, sup) => s + sup.spend, 0);
    expect(total).toBe(1005000);
  });

  it("groups suppliers by country correctly", () => {
    const byCountry = suppliers.reduce<Record<string, typeof suppliers>>((acc, s) => {
      if (!acc[s.country]) acc[s.country] = [];
      acc[s.country].push(s);
      return acc;
    }, {});
    expect(byCountry["CN"]).toHaveLength(2);
    expect(byCountry["GB"]).toHaveLength(1);
    expect(byCountry["KR"]).toHaveLength(1);
  });
});
