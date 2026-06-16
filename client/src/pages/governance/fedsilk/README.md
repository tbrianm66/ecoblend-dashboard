# FEDSILK — Federated Contribution Attribution Engine

**FEDSILK governance sub-module — Confidential. © repository owner.
Mechanism implementation; check priority-filing status before any public disclosure.**

---

## What is simulated vs what would be real

### Simulated (in-process, browser-only)

| Component | Simulated as | Notes |
|---|---|---|
| Federated clients | JavaScript objects in `FedEngine.ts` | Each holds a seeded synthetic dataset; only gradients exposed |
| Local training | Closed-form MSE gradient on synthetic data | `computeGradient()` in `FedEngine.ts` |
| Network transport | Direct in-memory function call | No sockets, no serialisation |
| Global model aggregation | `FedAvg` (averaged accepted gradients) | Single-machine; no distributed co-ordination |
| Contribution scoring | Leave-one-out R² delta (Shapley approx) | Exact Shapley would be exponential; LOO is standard approximation |
| Audit ledger | In-memory array with djb2 hash chain | Collision-resistant for demo; not cryptographically strong |
| Unlearning | Gradient reversal (subtract accumulated update) | Approximate; exact unlearning requires retraining from scratch |

### What the mechanism models faithfully

- **Data locality (M1):** Private data is never returned from client objects; only gradients leave.
- **Gradient validation gate (M2):** Norm-based anomaly detection correctly models the Byzantine-resilience gate that a production aggregator would run.
- **Contribution scoring (M3):** LOO delta is the standard federated Shapley approximation; the credit accumulation model is production-ready.
- **Audit chain (M4):** Hash-linked append-only log with tamper detection is structurally identical to a Hyperledger Fabric key-value ledger.
- **Unlearning with forfeit (M5):** Gradient reversal + credit forfeit is the standard approximate-unlearning protocol; the ledger record is GDPR-Article-17 compliant in structure.

---

## How to swap to a real Flower + Hyperledger Fabric backend

### Swap 1 — Replace `FedEngine.ts` gradient fetch with Flower gRPC

In `runRound()`, replace the in-process section labelled **M1** with calls to the Flower `NumPyClient` gRPC service:

```typescript
// BEFORE (simulation):
const gradient = computeGradient(state.globalModel, generateData(client.dataSeed, client.noiseFactor));

// AFTER (real Flower):
import { FlowerClient } from "@flower/grpc-client"; // your Flower SDK
const gradient = await FlowerClient.getUpdate(client.id, state.globalModel);
```

The rest of `runRound()` (validation gate, FedAvg, contribution scoring) does not change.

### Swap 2 — Replace `appendLedger()` with Hyperledger Fabric `submitTransaction()`

Replace the `appendLedger()` function body with a call to your Fabric chaincode:

```typescript
// BEFORE (simulation):
return [...ledger, { seq, timestamp, eventType, data, prevHash, hash }];

// AFTER (real Hyperledger):
await fabricGateway.getContract("fedsilk-audit").submitTransaction(
  "AppendEntry", JSON.stringify({ seq, timestamp, eventType, data, prevHash, hash })
);
return await fabricGateway.getContract("fedsilk-audit").evaluateTransaction("GetAllEntries");
```

`verifyLedgerIntegrity()` can remain as a client-side check over the entries returned by Fabric; the canonical truth lives on-chain.

### Swap 3 — Replace in-memory client state with server-side persistence

Add a `server/fedsilk.router.ts` tRPC router that stores `FedEngineState` in PostgreSQL (using the existing Drizzle setup). The `FedsilkPanel` component swaps its local `useState` for a `trpc.fedsilk.getState.useQuery()` call.

---

## File map

```
client/src/pages/governance/fedsilk/
├── FedEngine.ts      ← All simulation logic. No React imports. Replace this for real FL.
├── FedsilkPanel.tsx  ← Governance UI. Consumes FedEngine API only. Do not entangle.
└── README.md         ← This file.
```

---

## Dependencies added

None. `recharts` (MIT) and `lucide-react` (ISC) were already present in the project.
