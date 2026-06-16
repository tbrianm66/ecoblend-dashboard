/**
 * FEDSILK governance sub-module — Confidential. © repository owner.
 * Mechanism implementation; check priority-filing status before any public disclosure.
 *
 * FedEngine: pure-TypeScript federated-learning simulation.
 * Five mechanisms:
 *   M1 — Clients with local-only data (data never leaves client object)
 *   M2 — Gradient-validation anti-gaming gate (norm-based rejection)
 *   M3 — Contribution scoring (leave-one-out Shapley approximation)
 *   M4 — Immutable hash-linked audit ledger (on-chain style)
 *   M5 — Verifiable unlearning exit with weight forfeit
 *
 * Swap seams:
 *   - Replace runRound() gradient-fetch section with Flower gRPC calls
 *   - Replace appendLedger() write path with Hyperledger Fabric submitTransaction()
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_DIMS = 4;
const LEARNING_RATE = 0.05;
const N_SAMPLES = 24;
const NORM_REJECTION_MULTIPLIER = 2.5;
const CREDIT_SCALE = 10;
const W_TRUE = [2.0, -1.5, 0.8, 1.2];
const B_TRUE = 0.5;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ModelWeights { w: number[]; b: number }

/** M1: Only the seed is stored in visible state — data is regenerated on-demand */
export interface FedClient {
  id: string;
  label: string;
  dataSeed: number;
  noiseFactor: number;        // proxy for local data quality
  creditBalance: number;
  contributionHistory: number[];
  accumulatedGradient: ModelWeights; // for M5 unlearning reversal
  roundsParticipated: number;
  active: boolean;
}

export interface ClientUpdate {
  clientId: string;
  gradient: ModelWeights;
  gradientNorm: number;
  accepted: boolean;
  rejectionReason?: string;
  isPoisoned: boolean;
}

export interface RoundResult {
  round: number;
  timestamp: number;
  updates: ClientUpdate[];
  acceptedCount: number;
  rejectedCount: number;
  globalAccuracy: number;
  globalLoss: number;
  contributions: Record<string, number>;
  creditDeltas: Record<string, number>;
}

export type LedgerEventType =
  | 'INIT'
  | 'ROUND_COMPLETE'
  | 'CLIENT_REJECTED'
  | 'CREDIT_CHANGE'
  | 'EXIT_UNLEARN';

export interface LedgerEntry {
  seq: number;
  timestamp: number;
  eventType: LedgerEventType;
  data: unknown;
  prevHash: string;
  hash: string;
}

export interface UnlearningResult {
  clientId: string;
  clientLabel: string;
  creditForfeited: number;
  modelBefore: ModelWeights;
  modelAfter: ModelWeights;
  accuracyBefore: number;
  accuracyAfter: number;
  timestamp: number;
}

export interface FedEngineState {
  clients: FedClient[];
  globalModel: ModelWeights;
  round: number;
  roundHistory: RoundResult[];
  ledger: LedgerEntry[];
  unlearningEvents: UnlearningResult[];
  testAccuracy: number;
  testLoss: number;
}

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Hash (djb2) ─────────────────────────────────────────────────────────────

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function chainHash(prevHash: string, payload: unknown): string {
  return djb2(prevHash + JSON.stringify(payload));
}

// ─── Gradient algebra ─────────────────────────────────────────────────────────

function zeroGrad(): ModelWeights { return { w: Array(MODEL_DIMS).fill(0), b: 0 } }

function addGrad(a: ModelWeights, b: ModelWeights): ModelWeights {
  return { w: a.w.map((v, i) => v + b.w[i]), b: a.b + b.b };
}

function scaleGrad(g: ModelWeights, s: number): ModelWeights {
  return { w: g.w.map(v => v * s), b: g.b * s };
}

function gradNorm(g: ModelWeights): number {
  return Math.sqrt(g.w.reduce((a, x) => a + x * x, 0) + g.b * g.b);
}

// ─── M1: Data generation (local-only) ────────────────────────────────────────

function generateData(seed: number, noiseFactor: number): { X: number[][]; y: number[] } {
  const rng = mulberry32(seed);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const x = Array.from({ length: MODEL_DIMS }, () => rng() * 4 - 2);
    const noise = (rng() - 0.5) * 2 * noiseFactor;
    y.push(x.reduce((acc, xi, j) => acc + xi * W_TRUE[j], B_TRUE) + noise);
    X.push(x);
  }
  return { X, y };
}

// Held-out noiseless test set for evaluation
const TEST_DATA = generateData(0xdeadbeef, 0.0);

// ─── Model evaluation ────────────────────────────────────────────────────────

function predict(model: ModelWeights, X: number[][]): number[] {
  return X.map(x => x.reduce((acc, xi, j) => acc + xi * model.w[j], model.b));
}

function mseLoss(preds: number[], y: number[]): number {
  return preds.reduce((acc, p, i) => acc + (p - y[i]) ** 2, 0) / preds.length;
}

function rSquared(preds: number[], y: number[]): number {
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((a, t) => a + (t - mean) ** 2, 0);
  const ssRes = preds.reduce((a, p, i) => a + (p - y[i]) ** 2, 0);
  return ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
}

function evalModel(model: ModelWeights) {
  const preds = predict(model, TEST_DATA.X);
  return { accuracy: rSquared(preds, TEST_DATA.y), loss: mseLoss(preds, TEST_DATA.y) };
}

// ─── Gradient computation ─────────────────────────────────────────────────────

function computeGradient(model: ModelWeights, data: { X: number[][]; y: number[] }): ModelWeights {
  const { X, y } = data;
  const n = X.length;
  const errors = predict(model, X).map((p, i) => p - y[i]);
  const gradW = Array(MODEL_DIMS).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < MODEL_DIMS; j++)
      gradW[j] += (2 / n) * errors[i] * X[i][j];
  return { w: gradW, b: (2 / n) * errors.reduce((a, e) => a + e, 0) };
}

function applyGrad(model: ModelWeights, grad: ModelWeights, lr: number): ModelWeights {
  return { w: model.w.map((v, j) => v - lr * grad.w[j]), b: model.b - lr * grad.b };
}

// ─── M2: Gradient validation gate ────────────────────────────────────────────

function validateUpdates(
  raw: Array<{ clientId: string; gradient: ModelWeights; isPoisoned: boolean }>
): ClientUpdate[] {
  const norms = raw.map(u => gradNorm(u.gradient));
  const sorted = [...norms].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const threshold = median * NORM_REJECTION_MULTIPLIER;

  return raw.map((u, i) => {
    const norm = norms[i];
    const accepted = norm <= threshold;
    return {
      clientId: u.clientId,
      gradient: u.gradient,
      gradientNorm: Math.round(norm * 10000) / 10000,
      accepted,
      rejectionReason: accepted
        ? undefined
        : `Norm ${norm.toFixed(3)} > threshold ${threshold.toFixed(3)} (${NORM_REJECTION_MULTIPLIER}× median ${median.toFixed(3)})`,
      isPoisoned: u.isPoisoned,
    };
  });
}

// ─── M3: Contribution scoring (leave-one-out Shapley approx) ─────────────────

function computeContributions(
  accepted: ClientUpdate[],
  modelBefore: ModelWeights,
): Record<string, number> {
  if (accepted.length === 0) return {};
  const avgAll = scaleGrad(accepted.reduce((a, u) => addGrad(a, u.gradient), zeroGrad()), 1 / accepted.length);
  const modelFull = applyGrad(modelBefore, avgAll, LEARNING_RATE);
  const r2Full = rSquared(predict(modelFull, TEST_DATA.X), TEST_DATA.y);

  const result: Record<string, number> = {};
  for (const u of accepted) {
    if (accepted.length === 1) { result[u.clientId] = r2Full; continue; }
    const without = accepted.filter(x => x.clientId !== u.clientId);
    const avgWithout = scaleGrad(without.reduce((a, x) => addGrad(a, x.gradient), zeroGrad()), 1 / without.length);
    const modelWithout = applyGrad(modelBefore, avgWithout, LEARNING_RATE);
    const r2Without = rSquared(predict(modelWithout, TEST_DATA.X), TEST_DATA.y);
    result[u.clientId] = r2Full - r2Without;
  }
  return result;
}

// ─── M4: Audit ledger ────────────────────────────────────────────────────────

function appendLedger(ledger: LedgerEntry[], eventType: LedgerEventType, data: unknown): LedgerEntry[] {
  const seq = ledger.length;
  const prevHash = ledger.length > 0 ? ledger[ledger.length - 1].hash : '00000000';
  const timestamp = Date.now();
  const hash = chainHash(prevHash, { seq, timestamp, eventType, data });
  return [...ledger, { seq, timestamp, eventType, data, prevHash, hash }];
}

/** Verify the full hash chain — O(n) tamper detection */
export function verifyLedgerIntegrity(ledger: LedgerEntry[]): { valid: boolean; firstTamperedSeq?: number } {
  for (let i = 0; i < ledger.length; i++) {
    const e = ledger[i];
    const expectedPrev = i === 0 ? '00000000' : ledger[i - 1].hash;
    if (e.prevHash !== expectedPrev) return { valid: false, firstTamperedSeq: e.seq };
    const expectedHash = chainHash(e.prevHash, { seq: e.seq, timestamp: e.timestamp, eventType: e.eventType, data: e.data });
    if (expectedHash !== e.hash) return { valid: false, firstTamperedSeq: e.seq };
  }
  return { valid: true };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createFedEngine(clientCount = 5): FedEngineState {
  const clients: FedClient[] = Array.from({ length: clientCount }, (_, i) => ({
    id: `client-${i + 1}`,
    label: `Participant ${i + 1}`,
    dataSeed: (i + 1) * 1000 + 42,
    noiseFactor: 0.2 + i * 0.18,
    creditBalance: 0,
    contributionHistory: [],
    accumulatedGradient: zeroGrad(),
    roundsParticipated: 0,
    active: true,
  }));

  const globalModel: ModelWeights = { w: Array(MODEL_DIMS).fill(0), b: 0 };
  let ledger = appendLedger([], 'INIT', { clientCount, modelDims: MODEL_DIMS, learningRate: LEARNING_RATE });
  const { accuracy, loss } = evalModel(globalModel);

  return { clients, globalModel, round: 0, roundHistory: [], ledger, unlearningEvents: [], testAccuracy: accuracy, testLoss: loss };
}

export function runRound(state: FedEngineState, poisonClientId?: string): FedEngineState {
  const activeClients = state.clients.filter(c => c.active);
  if (activeClients.length === 0) return state;

  const nextRound = state.round + 1;
  const rng = mulberry32(nextRound * 0x6d2b79f5);

  // M1: Each client computes gradient on private local data — only gradient shared
  const rawUpdates = activeClients.map(client => {
    const isPoisoned = client.id === poisonClientId;
    const gradient = isPoisoned
      ? { w: Array.from({ length: MODEL_DIMS }, () => (rng() * 2 - 1) * 15), b: (rng() * 2 - 1) * 15 }
      : computeGradient(state.globalModel, generateData(client.dataSeed, client.noiseFactor));
    return { clientId: client.id, gradient, isPoisoned };
  });

  // M2: Gate validation
  const validated = validateUpdates(rawUpdates);
  const accepted = validated.filter(u => u.accepted);

  // FedAvg aggregation
  let newModel = state.globalModel;
  if (accepted.length > 0) {
    const avgGrad = scaleGrad(accepted.reduce((a, u) => addGrad(a, u.gradient), zeroGrad()), 1 / accepted.length);
    newModel = applyGrad(state.globalModel, avgGrad, LEARNING_RATE);
  }

  // M3: Contribution scoring
  const contributions = computeContributions(accepted, state.globalModel);
  const creditDeltas: Record<string, number> = {};
  for (const [cid, delta] of Object.entries(contributions))
    creditDeltas[cid] = Math.max(0, delta) * CREDIT_SCALE;

  const { accuracy, loss } = evalModel(newModel);

  const roundResult: RoundResult = {
    round: nextRound,
    timestamp: Date.now(),
    updates: validated,
    acceptedCount: accepted.length,
    rejectedCount: validated.length - accepted.length,
    globalAccuracy: accuracy,
    globalLoss: loss,
    contributions,
    creditDeltas,
  };

  // Update clients
  const updatedClients = state.clients.map(client => {
    const upd = accepted.find(u => u.clientId === client.id);
    if (!upd) return client;
    return {
      ...client,
      creditBalance: client.creditBalance + (creditDeltas[client.id] ?? 0),
      contributionHistory: [...client.contributionHistory, contributions[client.id] ?? 0],
      accumulatedGradient: addGrad(client.accumulatedGradient, upd.gradient),
      roundsParticipated: client.roundsParticipated + 1,
    };
  });

  // M4: Ledger
  let ledger = state.ledger;
  ledger = appendLedger(ledger, 'ROUND_COMPLETE', {
    round: nextRound,
    accepted: accepted.map(u => u.clientId),
    rejected: validated.filter(u => !u.accepted).map(u => u.clientId),
    accuracy: accuracy.toFixed(4), loss: loss.toFixed(4),
  });
  for (const u of validated.filter(u => !u.accepted))
    ledger = appendLedger(ledger, 'CLIENT_REJECTED', { clientId: u.clientId, round: nextRound, reason: u.rejectionReason, poisoned: u.isPoisoned });
  for (const [cid, delta] of Object.entries(creditDeltas))
    if (delta > 0)
      ledger = appendLedger(ledger, 'CREDIT_CHANGE', { clientId: cid, round: nextRound, delta: +delta.toFixed(4), newBalance: +(updatedClients.find(c => c.id === cid)?.creditBalance ?? 0).toFixed(4) });

  return { ...state, clients: updatedClients, globalModel: newModel, round: nextRound, roundHistory: [...state.roundHistory, roundResult], ledger, testAccuracy: accuracy, testLoss: loss };
}

export function exitAndUnlearn(state: FedEngineState, clientId: string): FedEngineState {
  const client = state.clients.find(c => c.id === clientId && c.active);
  if (!client) return state;

  const { accuracy: accuracyBefore } = evalModel(state.globalModel);
  const modelBefore = state.globalModel;

  // M5: Approximate unlearning — reverse accumulated gradient contributions
  const scale = client.roundsParticipated > 0 ? 1 / client.roundsParticipated : 1;
  const removalGrad = scaleGrad(client.accumulatedGradient, scale);
  const modelAfter: ModelWeights = {
    w: modelBefore.w.map((v, j) => v + LEARNING_RATE * removalGrad.w[j]),
    b: modelBefore.b + LEARNING_RATE * removalGrad.b,
  };

  const { accuracy: accuracyAfter, loss } = evalModel(modelAfter);
  const creditForfeited = client.creditBalance;

  const unlearningResult: UnlearningResult = {
    clientId,
    clientLabel: client.label,
    creditForfeited,
    modelBefore,
    modelAfter,
    accuracyBefore,
    accuracyAfter,
    timestamp: Date.now(),
  };

  const updatedClients = state.clients.map(c =>
    c.id === clientId ? { ...c, active: false, creditBalance: 0 } : c
  );

  // M4: Ledger exit record
  let ledger = state.ledger;
  ledger = appendLedger(ledger, 'EXIT_UNLEARN', {
    clientId,
    creditForfeited: creditForfeited.toFixed(4),
    accuracyBefore: accuracyBefore.toFixed(4),
    accuracyAfter: accuracyAfter.toFixed(4),
    modelDelta: modelAfter.w.map((v, j) => +(v - modelBefore.w[j]).toFixed(6)),
    biasDelta: +(modelAfter.b - modelBefore.b).toFixed(6),
  });

  return { ...state, clients: updatedClients, globalModel: modelAfter, ledger, testAccuracy: accuracyAfter, testLoss: loss, unlearningEvents: [...state.unlearningEvents, unlearningResult] };
}

export function addClient(state: FedEngineState): FedEngineState {
  const n = state.clients.length;
  const newClient: FedClient = {
    id: `client-${n + 1}`,
    label: `Participant ${n + 1}`,
    dataSeed: (n + 1) * 1000 + 42,
    noiseFactor: 0.2 + (n % 5) * 0.18,
    creditBalance: 0,
    contributionHistory: [],
    accumulatedGradient: zeroGrad(),
    roundsParticipated: 0,
    active: true,
  };
  return { ...state, clients: [...state.clients, newClient] };
}

export function resetEngine(clientCount = 5): FedEngineState {
  return createFedEngine(clientCount);
}
