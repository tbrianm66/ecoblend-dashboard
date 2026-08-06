# Financial Models & Studio Economics

**Institutional Author:** Future Humanity Ventures Ltd  
**Version:** 1.0 — Gate 0 Reconciliation (FHV-EB-AUD-001 §3)  
**Status:** Canonical — supersedes any prior internal draft assumptions  
**Purpose:** Establish a single source of truth for studio economics to eliminate order-of-magnitude discrepancies between studio assumptions and budget planning documents

---

> **Note on Prior Discrepancies**
> 
> Earlier internal working documents contained inconsistent yield projections, using both gross-multiple and IRR frames without distinguishing between them. Some drafts stated headline returns at the portfolio level that appeared as per-venture returns when quoted in isolation, creating an apparent order-of-magnitude error. This document standardises all figures to a consistent methodology: **per-venture net yield** (post-dilution, post-studio-fee) and **portfolio-level blended IRR**, clearly separated.

---

## §1 Studio Structure

### §1.1 Entity Model

| Entity | Role | Equity Position |
|---|---|---|
| **Future Humanity Ventures Ltd** (Holding Co) | Institutional parent; governs studio operations and mission lock | N/A — parent entity |
| **EcoRace Venture Studio** (Studio SPV) | Operational studio; provides capital, infrastructure, coaching, and incubation | Receives studio equity per venture |
| **Venture SPVs** | Individual ventures incorporated as separate legal entities | Founder + studio + ESOP + investor |
| **EcoRace Foundation** (Charity) | Mission beneficiary; receives donated equity (typically 5%) | Donated equity, no economic rights |

### §1.2 Studio Equity Allocation per Venture

Standard allocation at incorporation (pre-investment):

| Stakeholder | Equity | Notes |
|---|---|---|
| Founding Team | 60% | Split per ESOP schedule agreed at onboarding |
| EcoRace Studio | 25% | Studio equity — services, infrastructure, and capital in kind |
| ESOP Pool | 10% | Reserved for future hires and advisors |
| EcoRace Foundation | 5% | Donated equity; no economic rights; mission lock |

At Series A / first institutional round, studio equity dilutes pro-rata. The 5% charity donation is protected from dilution by a pre-emption right in the shareholder agreement (FEDSILK Step E — Equity & ESOP governance).

---

## §2 Per-Venture Economics

### §2.1 Capital Deployment

| Stage | Studio Contribution | Form | Condition |
|---|---|---|---|
| Pre-seed (VRL 1–2) | £15,000–£25,000 | Convertible note or equity in kind | Onboarding complete; VRL Stage 1 evidenced |
| Seed (VRL 2–3) | £50,000–£100,000 | Lead or co-lead equity round | VRL Stage 2 minimum; 20 validated interviews |
| Series A (VRL 3–4) | £250,000–£500,000 | Follow-on or syndicator | VRL Stage 3+; paid pilot evidence; investment-ready score |

### §2.2 Per-Venture Return Model

**Base assumptions (conservative cohort, 10-venture portfolio):**

| Parameter | Value | Basis |
|---|---|---|
| Failure rate (full loss) | 40% | 4 of 10 ventures — VRL never reaches Stage 3 |
| Acqui-hire / small exit | 30% | 3 of 10 — return of capital ± 20% |
| Successful exit | 30% | 3 of 10 — venture reaches scale or acquisition |
| Average successful exit valuation | £5M–£15M | Social enterprise / B-Corp aligned exit |
| Studio equity at exit (post-dilution) | 12–18% | Assumes 2–3 rounds of institutional dilution |
| Studio net proceeds per successful exit | £600K–£2.7M | Exit val × studio equity % |

**Per venture blended expected value (EV):**

```
EV = (0.40 × £0) + (0.30 × £75K) + (0.30 × £1.2M)
   = £0 + £22.5K + £360K
   = ~£382K per venture deployed
```

This is the **per-venture expected studio return**, not a headline portfolio return. Against a blended capital deployment of £150K–£175K per venture (across all stages weighted by survival rate), this represents approximately **2.2–2.5× gross multiple** per venture deployed on a 5–7 year hold.

### §2.3 ZINC VC Stipend

Founders who meet eligibility criteria (VRL Stage 1 complete, 20 interviews, registered legal entity) may apply for the ZINC VC stipend:

| Parameter | Value |
|---|---|
| Stipend amount | £24,000/year (£2,000/month) |
| Duration | 12 months maximum |
| Condition | Full-time commitment to venture + fortnightly coach check-in |
| Equity impact | None — stipend is a grant, not a loan; no equity conversion |

---

## §3 Portfolio-Level Economics

### §3.1 10-Venture Cohort Model

| Metric | Conservative | Base Case | Optimistic |
|---|---|---|---|
| Total capital deployed (studio) | £1.75M | £1.75M | £1.75M |
| Gross portfolio proceeds | £1.8M | £3.8M | £8.1M |
| Gross multiple (MOIC) | 1.0× | 2.2× | 4.6× |
| Portfolio IRR (5-year) | ~0% | ~16% | ~35% |
| Portfolio IRR (7-year) | ~0% | ~12% | ~25% |

**Note on the base-case 2.2× MOIC:** This is a gross multiple across the full portfolio. It is **not** a per-venture return, and **not** an IRR. Earlier drafts that quoted "2–3×" without specifying gross/net or portfolio/per-venture were the source of the order-of-magnitude discrepancy. This document uses all three frames explicitly.

### §3.2 Yield Metric Standardisation

To eliminate confusion between documentation sources, the following labelling convention applies across all platform documents, pitch materials, and reporting:

| Metric Name | Definition | Frame | Example |
|---|---|---|---|
| `gross_moic_portfolio` | Total proceeds ÷ total capital deployed | Portfolio | 2.2× |
| `net_moic_portfolio` | After management fees and studio operating costs | Portfolio | 1.8× |
| `irr_portfolio_5yr` | Annualised return assuming 5-year realisation | Portfolio | ~16% |
| `irr_portfolio_7yr` | Annualised return assuming 7-year realisation | Portfolio | ~12% |
| `ev_per_venture` | Expected studio proceeds per venture deployed | Per-venture | £382K |
| `gross_moic_per_venture` | Per-venture: expected proceeds ÷ deployed capital | Per-venture | 2.2–2.5× |

All financial projections in investor materials, data rooms, and reporting must reference one or more of these labelled metrics. Unlabelled yield figures are not permitted.

---

## §4 Exit Valuation Framework

### §4.1 Valuation Methodology for Social Enterprise Exits

B-Corp aligned and social enterprise exits differ from pure-commercial exits. The studio uses a blended valuation methodology:

| Component | Weight | Basis |
|---|---|---|
| Revenue multiple (ARR or MRR × 3–5×) | 50% | Commercial traction |
| Mission Impact Multiplier (MIM) | 25% | Verified social/environmental outcomes + charity link |
| Strategic acquirer premium | 25% | ESG mandate alignment for acquirers |

The Mission Impact Multiplier (MIM) adjusts the base revenue multiple upward by 0.5–1.5× when the venture has:
- A confirmed nominated charity with verified donation equity in place
- An independently assessed Environmental Score (EcoScore) ≥ 6 on the VRL
- At least one verified carbon or social outcome metric in the Evidence Ledger

### §4.2 Exit Scenario Benchmarks

| Exit Type | Typical Range | Studio Net (12–18% post-dilution) |
|---|---|---|
| Strategic acquisition (ESG acquirer) | £8M–£20M | £960K–£3.6M |
| MBO / founder buyout | £3M–£8M | £360K–£1.44M |
| Impact investor secondary | £4M–£12M | £480K–£2.16M |
| Acqui-hire | £500K–£2M | £60K–£360K |
| Wind-down (return of assets) | £0–£200K | £0–£36K |

---

## §5 Studio Fee Structure

| Service | Basis | Rate |
|---|---|---|
| Platform access (VOS) | Per venture per year | Included in studio equity — no cash fee |
| Coaching (execution coach) | Per session | £150/session (charged to venture P&L post-seed) |
| Legal & governance (FEDSILK) | Per step completed | £500–£1,500/step (external legal, not studio margin) |
| Advisory introductions | Success fee | 1.5% of round raised (paid by venture, capped at £15K) |
| Data room access | Per investor group | No charge — included in VOS infrastructure |

---

## §6 Reconciliation Notes

### §6.1 Discrepancy Identified and Resolved

The Gate 0 audit (FHV-EB-AUD-001 §3) identified the following discrepancy between prior working documents:

> **Prior Studio Brief (2025):** "Target yield of 20–30× per successful portfolio company"  
> **Prior Budget Planning Note (2025):** "Studio target return 2–3× on capital deployed"

These are not contradictory — the 20–30× refers to a **gross revenue multiple on invested capital for the successful third of the portfolio** (the top-decile ventures), while the 2–3× refers to the **blended portfolio MOIC** across all ventures including failures and acqui-hires.

Both figures are directionally correct. The error was presenting them without their respective frames, making them appear as competing estimates of the same metric.

**Resolution:** All future financial communications use the labelled metric system defined in §3.2. Both figures may be quoted together provided their frames are explicitly stated:
- *"The portfolio targets a blended 2.2× MOIC with top-quartile successful ventures projected at 15–25× on invested capital."*

### §6.2 Zero Studio Equity Relationship Test (H4 — Commercial Viability)

The Scorecard Telemetry Engine (H4) tracks "paid pilot conversions with zero studio equity relationship." This specifically means ventures that have:
1. Secured a paying customer (pilot, subscription, or contract)
2. **Not** given equity to that customer (i.e., revenue is arm's-length commercial)

This is distinct from studio equity in the venture itself. A venture can have EcoRace Studio as a 25% shareholder and still meet the H4 criterion if its paying customers have no equity position.

---

*Maintained by Future Humanity Ventures Ltd. Reviewed at each audit gate.*
