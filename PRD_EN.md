# PRD: WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion Feature Definition

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date | 2026-06-30 |
| Version | v1.2 |
| Reference Documents | 00.통합자료실/고객자료/wooxprosub.docx (original brief, Korean only), 02.기획문서/마켓리서치.md (Korean only), 02.기획문서/서비스기획서.md (Korean only) |

---

## 1. Project Overview

| Item | Content |
|------|------|
| **Purpose** | For 30 days immediately following the new onboarding of the WOOX Pro exchange, leverage traffic and UI Nudges within the TetherMax platform to maximize the user conversion rate and sign-up rate to WOOX Pro |
| **Core Strategy** | Presenting comparative figures that stimulate the user's **'Loss Aversion'** bias, combined with well-timed UI Nudges (post-withdrawal Virtual Feedback + inline comparison card on the result page) |
| **Promotion Period** | **2026-07-07 C-level decision**: the **period is controlled by admin (backoffice)** (D+30 auto-termination abolished, per-area on/off). Updates the prior "launch + 30 days only, not made permanent" (OI-07) |

---

## 2. Detailed Functional Requirements

### Feature 1: WOOX Pro Promotion Branch Exposure After Withdrawal Completion

**Existing Logic**

When a user completes a withdrawal (including simultaneous withdrawals across multiple exchanges), one of the currently running exchange events is randomly selected and displayed in ad form, based on on-screen priority.
> Example: Insurance ad shown after a Toss money transfer

**Changed and New Logic (30-Day Limited)**

**Case A: Withdrawals that do NOT include WOOX Pro**

- Instead of the existing generic event ad, display in the ad area a calculated Virtual Feedback message stating **"how much more in fees you could have saved this time if you had used WOOX Pro"** (on a Total Saving basis, confirmed per OI-08)
- **UI/UX:** Apply copywriting that visually conveys to the user a sense of missed gains (opportunity cost)

**Case B: Withdrawals that DO include WOOX Pro**

| Priority | Condition | Content Displayed |
|------|------|-----------|
| 1 | WOOX Pro's own running event **exists** | Display the **WOOX Pro event** with top priority |
| 2 | No own event & the TetherMax WOOX Pro Onboarding Event is active | Display the **TetherMax WOOX Pro Onboarding Event** |
| 3 | Neither #1 nor #2 exists | Display a **general TetherMax House Ad** |

(See §2-A-3 for the detailed branching logic)

> **Feature 3 is also displayed on the same screen**: Below the result card area of this Withdrawal Completion Screen (S1), outside and at the bottom, **Feature 3 (WOOX Pro x Bithumb Travel Rule Integration Banner, position #2)** is displayed independently of the Case A/B branching. Whether it is displayed follows the backoffice Travel Rule banner on/off (§3-3). See the Feature 3 section for details.

---

### Feature 2: Inline Exposure of the WOOX Pro Comparison Card on the Cashback Preview (Payback Preview) Result Page

> **Change History**: Switched from the previous "Dim overlay + forced popup modal" approach to a method that **inline-transforms the result page itself** (reflecting the OI-04 decision). Removing the popup/Dim overlay reduces forcefulness and drop-off rate, while naturally exposing the loss comparison within the result flow.

**Entry Context**

Triggered at the moment the user enters the **[Result Page]** after entering the following conditions in 'Cashback Preview':
- Exchange
- Asset size
- Leverage
- Trade type
- Trade frequency

**Operating Logic**

**Case A: The selected exchange is NOT WOOX Pro (e.g., Zoomex, BitMart, etc.)**

1. Without any popup or Dim overlay, the existing result card (the selected exchange's trading fee, payback rate, estimated payback) is kept as-is
2. **Insert the [WOOX Pro Comparison Card] inline directly below it**, displaying a "Current vs. WOOX Pro" comparison (highlighted with brand color)

**Content included in the WOOX Pro Comparison Card:**

| Element | Details |
|------|-----------|
| **Loss Amount Awareness** | Displays, side by side, the difference in actual savings (USDT) and the difference (%p) between WOOX Pro and the current exchange under identical conditions, on a **Total Saving basis**. Example (simplified; actual values are produced by the §2-A-1 "Monthly Estimated Cashback" engine): under Zoomex conditions, **saving approximately +567 USDT more per month** on a WOOX Pro basis versus the current exchange (use the engine-calculated value for the specific %p) |
| **Display Method** | **Confirmed as Total Saving basis** (OI-08, 2026-07-03). Uses the framing "You could have saved/can save OOO USDT more" |
| **CTA Button (Primary)** | "Start with WOOX Pro" button within the comparison card → navigates to the WOOX Pro exchange detail page (TetherMax brand color) |
| **Basis Disclosure** | "Standard user / base tier" basis noted in small text at the bottom of the card |
| **Collapse** | Card collapse **provided** (confirmed per OI-05). No forced close (X) button |

**Case B: The selected exchange IS WOOX Pro**

- The WOOX Pro Comparison Card is **not inserted**
- Only the existing normal payback result screen is displayed

> **Feature 3 is also displayed on the same screen**: Below the inline comparison card of this Cashback Preview Result Screen (S2), **Feature 3 (WOOX Pro x Bithumb Travel Rule Integration Banner, position #1)** is displayed independently of the Case A/B branching. Whether it is displayed follows the backoffice Travel Rule banner on/off (§3-3). See the Feature 3 section for details.

---

### Feature 3: WOOX Pro x Bithumb Travel Rule Integration Banner

**Purpose**

Display that WOOX Pro is **an exchange integrated with Bithumb via Travel Rule**, delivering a regulatory-compliance/trust signal to domestic users and lowering resistance to converting to WOOX Pro. (A trust-signal banner — **navigates to the WOOX Pro exchange detail on click**, Feature 3 revised 2026-07-07)

**Banner Specification**

| Item | Content |
|------|------|
| **Composition** | `[Bithumb logo]` ⇄ `[WOOX Pro logo]` + copy (two logos first, copy after). **A left-right arrow (⇄) between the logos.** Copy KO "트레블룰 연동" / EN "Travel Rule Integration" |
| **Asset Rule** | Both logos (Bithumb, WOOX Pro) are **hardcoded as images in the design** (not Admin-loaded/dynamically injected). The trailing copy ("Travel Rule Integration") is **multilingual text** (images prohibited) |
| **Order** | The order Logo (first) → Text (after) is **fixed and common across all languages** |
| **Style** | **Understated** — badge form without excessive emphasis |
| **Click Behavior** | **Navigates to the WOOX Pro exchange detail page on click** (CTA URL = admin onboarding-registered value, OI-06). Feature 3 revised (2026-07-07) — changed from the previous "static, no click." ⚠️ The OI-09 legal risk acceptance was premised on a static informational banner and must be re-confirmed |
| **Exposure Policy** | **Controlled by per-area backoffice on/off** (2026-07-07: D+30 · 2-WOOX-event gate abolished, §3-3). Travel Rule banner is on/off per position (#1·#2 individually, #3·#4·#5 collectively). **Pre-login screens (#3, #4) are displayed regardless of user session** |

**Exposure Positions (5)**

| # | Position | Details |
|------|------|------|
| 1 | Bottom of Cashback Preview result | Feature 2 result page, below the inline comparison card |
| 2 | Bottom of withdrawal result card (outside) | Feature 1 withdrawal completion screen, outside and at the bottom of the result card area |
| 3 | Mobile Web · Pre-login | Directly below the login/sign-up button |
| 4 | PC Web · Login page | Top area of the login page |
| 5 | PC/Mobile · Post-login | Below the member ID on My Page |

**Compliance (Risk-Accepted Decision)**

- **Management Decision**: Displayed first without prior legal approval, and **taken down immediately if an issue is raised** (risk-accepted). The means of "taking down" is the **backoffice Travel Rule banner on/off** (only that position can be turned OFF immediately, §3-3). ⚠️ However, the Feature 3 revision (navigates to WOOX Pro detail on click) changes the banner from a static informational banner to a CTA, so the OI-09 legal risk acceptance must be re-confirmed.
- Logo assets: **Hardcoded in the design** (both Bithumb and WOOX Pro). No Admin registration, dynamic loading, or separate delivery required.
- Remaining dependency: **Only the final translated copy for "Travel Rule Integration"** needs to be secured (OI-09).

---

## 2-A. Detailed Logic for Time-Limited Additions (a~d)

This is the implementation detail for branches (a)~(d) within §2's Features 1 and 2 that apply **only during the promotion period**.
(a) = Feature 1 WOOX Pro not included, (b) = Feature 1 WOOX Pro included, (c) = Feature 2 other exchange, (d) = Feature 2 WOOX Pro.

### 2-A-1. Savings Calculation Model (Common)

**Commission Rate is not used** in user-screen calculations. Since the value the user actually receives back is "the fee the user actually paid × Payback Rate," the comparison is established using **Payback Rate** alone (or, including the discount, the **Total Saving Rate**). Commission Rate (90%) and Margin Rate are for back-office internal settlement purposes and are unrelated to user-facing calculations.

> **Feature 1 and Feature 2 have completely independent data sources with no interrelation** (confirmed 2026-07-03). Feature 1 reverse-calculates from **actually occurred historical data** in the user UID Table. Feature 2 (Cashback Preview), independent of the UID Table, is a pure projection where — since the user's actual trading volume is unknown — **a predetermined formula computes a predicted value from inputs (assets, leverage, frequency, etc.) alone**. Below, the "Nominal basis" is exclusive to Feature 1, and the "Preview basis" is exclusive to Feature 2; they do not share data with each other.

**Core Metric Definition (Nominal basis — applied to Feature 1 · actual measured data)**

```
Total Saving Rate(E) = 1 − (1 − Discount Rate(E)) × (1 − Payback Rate(E))
                     = Discount Rate(E) + (1 − Discount Rate(E)) × Payback Rate(E)   ← identical formula
```

- WOOX Pro has a Discount Rate of 0% → **Nominal Total Saving Rate = Payback Rate = 80%**
- Identical formula to the back office's auto-calculated "Total Saving %" field (computed separately for maker/taker)
- This nominal value is **used for Feature 1 (reverse calculation of actually occurred historical payback data)**. Feature 2 (a preview that is a future prediction) uses the correction-factor-applied version of the "Feature 2-exclusive Preview formula" below (confirmed 2026-07-03, reflecting the engineering formula).

**Displayed %p Definition (common to Feature 1 and Feature 2, confirmed 2026-07-03)**

```
Displayed %p = Nominal Total Saving Rate(WOOX Pro) − Nominal Total Saving Rate(current exchange)
             (Correction Factor 0.7 is NOT applied — %p is always based on the Nominal Total Saving Rate)
```

- The USDT savings amount uses a different formula per feature (Feature 1 = actual-measurement reverse calculation, Feature 2 = correction-factor-applied projection), but **%p is unified across both features as the above Nominal Total Saving Rate difference**.
- This appears identical to the Payback Rate difference, but **because the value changes when the comparison target is an exchange that has a Discount Rate**, the precise definition is "Total Saving Rate difference."
- Because this uses the same metric as the adverse-case determination criterion (§3-1), the determination criterion and the displayed %p always match.

**Base Fee Reverse Calculation (Feature 1 · withdrawal screen)**

On the withdrawal screen, only the user's actual payback amount exists. The exchange's original fee rate (0.04%, etc.) is unnecessary and is instead reverse-calculated as below.

```
Base Fee = Actual Payback Amount ÷ ((1 − Discount Rate) × Payback Rate)
          (assuming Discount Rate 0: Actual Payback Amount ÷ Payback Rate)
```

**Savings Display Method — Confirmed as Total Saving Basis (OI-08, 2026-07-03)**

Following the C-level demo, this was finally confirmed as the **Total Saving basis**. The Payback Rate basis (an alternative that was under review) is discarded. Applied in common to Feature 1 and Feature 2.

```
Current Net Cost = Base Fee × (1 − Current Total Saving Rate)
WOOX Pro Net Cost = Base Fee × (1 − WOOX Pro Total Saving Rate)
Additional Savings = Current Net Cost − WOOX Pro Net Cost
```

Copy framing: "You could have saved/can save **OOO USDT** more in fees if you had used WOOX Pro"

**Validation Example** (Bitget Payback Rate 54%, actual payback 54 USDT, assuming Discount Rate 0%)

- Base Fee = 54 ÷ 54% = **100 USDT**
- Current Net Cost = 100 × 46% = 46, WOOX Pro Net Cost = 100 × 20% = 20
- **Additional Savings = 26 USDT** → "You could have saved 26 USDT more in fees if you had used WOOX Pro"
- Note: When exchanges with a Discount Rate are mixed in, the result differs from the Payback Rate basis, but since the Total Saving basis accurately reflects the actual savings, this method was confirmed.

**Feature 2 Exclusive — Cashback Preview Projection Formula (Monthly Estimated Cashback)**

> This is not a new formula but **the actual formula of the existing Cashback Preview engine** (confirmed by engineering, 2026-07-03). This project uses this value as-is, adding only the comparison with WOOX Pro, without creating a new formula.

```
Monthly Estimated Cashback(E)
= balance × leverage × TIME × 2 × 30
× actualFeePaid(E) × Payback Rate(E) × Correction Factor(E)

actualFeePaid(E) = (Maker fee rate × (1 − Maker Discount Rate(E)) × Maker ratio)
                  + (Taker fee rate × (1 − Taker Discount Rate(E)) × Taker ratio)
```

| Variable | Description |
|---|---|
| balance · leverage | User input (asset size · leverage) |
| Maker/Taker ratio | User input (slider, sums to 100% → normalized to 0~1) |
| Maker/Taker fee rate · Discount Rate | Admin values per exchange (Maker/Taker managed separately) |
| Payback Rate | **Single value** per exchange (no Maker/Taker distinction — the weighted sum occurs only at the fee-rate stage) |
| **Correction Factor** | **Fixed constant of 0.7** (identical across all exchanges/all products, treated as a permanent constant — if the value changes, it changes for all exchanges simultaneously. No need for per-exchange lookup; hardcoded as a single global setting) |
| TIME | Trade frequency mapping value. **A concept exclusive to Feature 2 (Cashback Preview)**, applied in common across all exchanges (no per-exchange difference) |

| Frequency | TIME |
|---|---|
| 0~1 times/day | 0.6 |
| 1~2 times/day | 1.5 |
| 2~5 times/day | 3.0 |
| 5~10 times/day | 7.5 |
| 10+ times/day | 20.0 |

**Comparison Method**: Substitute the same balance, leverage, TIME, and Maker/Taker ratio (user input) into both WOOX Pro and the current exchange, compute the **preview-specific Total Saving Rate** using each exchange's fee rate, Discount Rate, and Payback Rate (Correction Factor fixed common at 0.7), and derive the savings amount from the difference (confirmed as Total Saving basis, OI-08):

```
Total Saving Rate_Preview(E) = 1 − (1 − Discount Rate(E)) × (1 − Payback Rate(E) × 0.7)
```

- Because the Correction Factor is identical across all exchanges (fixed at 0.7), **it does not affect the comparison outcome (which side is more favorable).** However, the **absolute amount** displayed on screen must reflect the 0.7 for the numbers to match the actual Cashback Preview engine's results.
- **Prerequisite (separate engineering track, not in this project's scope)**: There is a bug where the Admin's "TetherMax Applied (%)" field currently stores the Discount Rate multiplied twice by the Payback Rate (cashbackRate). Because Feature 2 reads this field's Discount Rate value as-is for its calculation, **this bug must be fixed before the promotion launches** for the comparison numbers to be accurate (⚠️ OI-10).

| WOOX Pro Parameter | Value | Nature |
|------|------|------|
| Discount Rate | 0% | Internal/back office |
| Payback Rate (cashback) | 80% | Internal only (not exposed) |
| Nominal Total Saving Rate | 80% (identical to Payback Rate since Discount Rate is 0; for Feature 1) | Internal only (not exposed) |
| Correction Factor | **0.7** (fixed constant, common across all exchanges) | Internal only (not exposed) |

- **Data Source**: The actual payback amount (Feature 1) is the **user UID Table value** (batch-updated once daily, KST 20:00). Withdrawals are possible at any time regardless of the batch, and Feature 1 uses the **UID payback value at the time of withdrawal** as the reverse-calculation basis. **Feature 2 (Cashback Preview) is unrelated to this UID Table** — it is a pure projection computed from user input alone. Per-exchange Discount Rate/Payback Rate come from the existing cashback engine/back office. The Correction Factor (0.7) is a fixed constant. All are held internally with no external dependency.
- **Exposure Principle**: Internal figures (Discount Rate, Payback Rate, Correction Factor, Commission Rate, Margin Rate) are never displayed on the user screen; only the **result values (savings amount in USDT, %p)** are exposed. (See CLAUDE.md Core Business Rule 6)
- **Time Display Principle**: The batch time (KST 20:00) is a server-internal processing standard. When displaying the batch-timing-related notice text (NFR-005) on screen, **convert it to the user device's local time rather than a fixed KST notice** (see CLAUDE.md Core Business Rule 9).

### 2-A-2. (a) Withdrawal Not Including WOOX Pro → Virtual Feedback

| Priority | Content Displayed | Condition |
|------|------|------|
| 1 | Virtual Feedback ("If it had been WOOX Pro, +X USDT") | Not an adverse case (WOOX Pro Total Saving > other, §3-1) & Savings > 0 & Calculable (if positive but under 1 USDT, display as 1 USDT) |
| 2 | TetherMax WOOX Pro Onboarding Event | When #1 is not possible & event is active |
| 3 | Existing house/other exchange event (base fallback) | When both #1 and #2 are not possible |

**Simultaneous Withdrawal Across Multiple Exchanges (UIDs)**: Calculate the additional gain for each exchange individually → **sum only UIDs that are not adverse cases & are positive** → **display as a single total amount**. Adverse-case and negative UIDs are excluded from the sum. State "based on N exchanges · standard tier basis" at the bottom.

- **Even when there are many UIDs (e.g., 5+), the card/number stays as one** — individual UIDs are not listed; only the summed total amount is displayed (for readability / fatigue prevention). Only the N in the bottom caption increases.
- (Optional) Allowing users to expand and view per-UID savings via a "View Details" option is under review as a design option.

**Displayed Copy**: The calculated value is displayed on the **Total Saving basis** confirmed in §2-A-1 (confirmed per OI-08, 2026-07-03).

### 2-A-3. (b) Withdrawal Including WOOX Pro → Event Branching

| Priority | Content Displayed | Condition |
|------|------|------|
| 1 | WOOX Pro's own event | WOOX Pro event active |
| 2 | TetherMax WOOX Pro Onboarding Event (= "TetherMax-type event") | When #1 does not exist & is active |
| 3 | TetherMax general house ad | When neither #1 nor #2 exists |

- The WOOX Pro event has **absolute priority** (WOOX Pro takes priority even if another exchange's event exists in a simultaneous withdrawal).
- Event existence is determined **based on Admin registration**. Competing exchange events are not displayed (partnership protection).

### 2-A-4. (c) Other Exchange Selected → WOOX Pro Comparison Card Inserted Inline

**Exposure Conditions (AND)**: Other exchange selected · User not linked to WOOX Pro · Accurate comparison possible · **Not an adverse case (WOOX Pro Total Saving Rate > other exchange, §3-1)**

- Comparison formula: The 2-A-1 model above (comparing actual benefit after applying payback on both sides). Adverse-case determination is based on Total Saving Rate.
- Display form: **Inline comparison card directly below** the result card (no popup, no Dim overlay). See the Feature 2 definition.
- Users already linked to WOOX Pro: Not displayed.
- Conditions not supported by WOOX Pro (leverage/product): Not displayed (to prevent inaccurate comparison).
- Exposure frequency: Since inline is non-forcing, it is **displayed at all times** (when the above conditions are met). The popup-based "once per session / don't show today" is unnecessary.
- **Collapse provided**: Users can collapse the comparison card (confirmed per OI-05). No forced close.

### 2-A-5. (d) WOOX Pro Selected → Comparison Card Not Inserted

The WOOX Pro Comparison Card is not inserted, and only the normal payback result screen is displayed. This includes all cases that fail to meet the (c) exposure conditions.

### 2-A-6. Promotion Period Criteria

- The "onboarding point" is **the point at which the WOOX Pro exchange is onboarded to the platform (a globally fixed date)**, and D+30 applies identically to all users from that point. (Promotion start date = exchange onboarding date)
- Visibility is controlled independently via **5 per-area backoffice on/off** (partial control allowed). The prior "single gate turning all 3 features on/off together" is abolished (see §3-3, 2026-07-07).

---

## 3. Exception Handling and Data Policy

### 3-1. Ensuring Accuracy and Reliability of Fee Comparison Calculations (Adverse-Case Prevention)

- **Adverse-case determination criterion = Total Saving Rate.** Since the displayed figure is also confirmed to be on a Total Saving basis (OI-08), **the exposure-determination criterion and the displayed figure are unified under the same Total Saving Rate formula.**
- Determination rule: **If another exchange's Total Saving Rate is equal to or higher than WOOX Pro's** (other ≥ WOOX Pro) → **do not display the post-withdrawal ad or the preview comparison card.** That is, display **only when WOOX Pro's Total Saving Rate is strictly greater than the other exchange's (WOOX Pro > other)**.
  - Example: Cases where another exchange's Total Saving reaches or exceeds WOOX Pro's due to a top VIP tier, etc., are all not displayed.
- The comparison basis is disclosed as **'standard user / base tier'** or a clearly defined basis, in very small text at the bottom of the comparison card, to secure trust.

### 3-2. User Fatigue Prevention Logic (UX Defense Logic)

**Decision (reflecting OI-04):** The popup modal is discarded and switched to an **inline transformation of the result page (WOOX Pro comparison card below the result card)**. Since inline display is non-forcing and does not obscure the screen, the drop-off problem that previously occurred from the popup repeating whenever conditions were changed and recalculated is itself eliminated.

| Item | Content |
|------|------|
| **Exposure Frequency** | **Always displayed inline** on the result page when conditions are met (the popup-based "once per session / don't show today" is unnecessary) |
| **Collapse Option** | Comparison card collapse **provided** (confirmed per OI-05). No forced close (X) UI |
| **Adverse-Case/Unsupported Filter** | The comparison card is **not inserted** when the other exchange's Total Saving Rate ≥ WOOX Pro's, or when an accurate comparison is not possible (see 3-1) |

### 3-3. Visibility Control — Per-Area Backoffice On/Off (policy change 2026-07-07)

> ⚠️ **Policy change (2026-07-07)**: The previous "D+30 auto-termination + 2 WOOX Pro event termination buttons (OR) + collective rollback of all 3 features" gate is **fully abolished**, and visibility is controlled via **per-area on/off on a new backoffice page**. **The period is also controlled by admin (backoffice)** (2026-07-07 C-level decision, OI-07 updated — supersedes "launch + 30 days only, not made permanent"). The "30 days" in the project name is interpreted as an admin-controlled period, not a system-enforced termination.

**New control — 5 backoffice on/off (per-area, independent, partial control allowed):**

| # | Backoffice item | Target | When OFF |
|------|------|------|------|
| 1 | Withdrawal-complete WOOX Pro Virtual Feedback | Feature 1 (S1) | Virtual Feedback not shown → existing "1 random ongoing exchange event" logic |
| 2 | Withdrawal-complete Travel Rule banner | Feature 3 #2 (S1) | Banner not shown |
| 3 | Cashback Preview WOOX Pro comparison | Feature 2 (S2) | Comparison card not inserted (result screen only) |
| 4 | Cashback Preview Travel Rule banner | Feature 3 #1 (S2) | Banner not shown |
| 5 | Login 3-page Travel Rule banner | Feature 3 #3·#4·#5 | Three positions (PC login · MO pre-login · My Page) hidden collectively |

**Implementation Requirements:**

- Each item toggles **independently** (a single area can be turned off — the previous "all-3-together / no partial termination" is abolished).
- The previous D+30 auto-termination and 2 WOOX Pro event termination-button dependency are **not used.**
- On settings-query failure, safely treat as **hidden (OFF).**
- Admin authority scope, handling of screens mid-exposure, and (replacing D+30) termination scheduling are defined later (§5 follow-up).

---

## 4. Flow Summary

```
[After Withdrawal Completion]
│
├── Withdrawal Not Including WOOX Pro
│   └── Ad area: Display Virtual Feedback "You could have saved +OOO USDT more in fees by using WOOX Pro"
│       (if not possible: fall back to Onboarding Event → base event, in that order, §2-A-2)
│
└── Withdrawal Including WOOX Pro
    ├── WOOX Pro's own event exists → Display WOOX Pro event with top priority
    ├── No own event & Onboarding Event active → TetherMax WOOX Pro Onboarding Event
    └── Neither exists → General TetherMax House Ad

[After Entering the Payback Preview Result Page]
│
├── Selected exchange ≠ WOOX Pro (& savings > 0 & accurate comparison possible)
│   └── Insert WOOX Pro comparison card inline below the existing result card (no popup, no Dim overlay)
│       ├── Loss amount comparison (USDT / %p)
│       └── CTA: Button to navigate to WOOX Pro exchange detail
│
└── Selected exchange = WOOX Pro (or adverse case/unsupported)
    └── Display only the normal payback result screen without a comparison card

[Travel Rule Trust Banner — Feature 3 (5 positions)]
│
├── Promotion active → Display banner at 5 positions (navigates to WOOX Pro detail on click)
└── Promotion terminated → Remove banner from all 5 positions

[Promotion Active Determination — Common Precheck Before Entering Each Feature]
│
├── Visible per area = backoffice on/off (D+30 · WOOX-event gate abolished, 2026-07-07)
│
└── Any area OFF in backoffice → that area falls back to base (independent per area)
    ├── Feature 1 → Existing "1 random exchange event" logic
    ├── Feature 2 → Existing result screen without the WOOX Pro comparison card
    └── Feature 3 → Travel Rule banner removed from all 5 positions
    (※ Each area is controlled independently by backoffice on/off)
```

---

## 5. Open Items / Items Requiring Further Review

### Confirmed and Completed (reflected in §2-A)

- [x] Calculation logic → **based on reverse calculation from the actual payback amount**, Commission Rate not used (only Payback Rate/Total Saving Rate used)
- [x] Exposure gating is based on **savings > 0** (displayed if positive). **Display floor of 1 USDT** (if positive but under 1 USDT, display as 1 USDT; 0/negative uses base logic) — 1 USDT is a display floor, not an exposure threshold
- [x] Display currency/multilingual support → **USDT-only display + full multilingual support**, changes shown in **%p** units
- [x] Feature 1/2 CTA destination → **navigate to the WOOX Pro exchange detail page**
- [x] Feature 2 exposure method → **popup modal discarded, inline transformation of the result page (WOOX Pro comparison card below the result card)** (confirmed per OI-04)
- [x] Feature 2 exposure frequency → inline non-forcing **always displayed** (popup-based once-per-session/don't-show-today discarded)
- [x] Inline comparison card collapse → **provided** (no forced close) (confirmed per OI-05)
- [x] Adverse-case prevention determination criterion → **Total Saving Rate**. Not displayed if another exchange's Total Saving ≥ WOOX Pro's (displayed only when WOOX Pro is strictly greater) (§3-1)
- [x] Simultaneous withdrawal across multiple exchanges (UIDs) → sum only UIDs that are not adverse cases and are positive, **displayed as a single total amount** (multiple UIDs also not listed), "based on N exchanges" caption
- [x] Definition of "TetherMax-type event" → TetherMax WOOX Pro Onboarding Event
- [x] Visibility control → **5 per-area backoffice on/off** (partial control allowed). The prior "2 WOOX event OR + D+30 collective rollback" is abolished (§3-3, 2026-07-07). period is also admin-controlled (C-level decision, OI-07 updated, 2026-07-07)
- [x] Feature 3 Travel Rule banner → 5 positions, logo = hardcoded image (⇄ between logos) · copy = translated text, **navigates to WOOX Pro detail on click** (Feature 3 revised 2026-07-07, ⚠️ OI-09 legal re-confirmation), visibility via backoffice on/off
- [x] Banner copy → KO "트레블룰 연동" / EN "Travel Rule Integration" (standard localization for other languages)
- [x] Promotion start date → **the point of WOOX Pro exchange onboarding** (globally fixed date)
- [x] Comparison target exchanges → **all exchanges that have completed onboarding & have exposure = Y** (dynamic)
- [x] WOOX Pro sign-up/detail URL → use the **Admin onboarding registration value** (OI-06 resolved)
- [x] Platform scope → S1, S2 are PC · MO · App (webview); S3~S5 are app-native, so Web (PC/MO) only
- [x] Promotion duration → **lasts only 30 days from WOOX Pro launch (exchange onboarding)**, rolled back thereafter. Not made permanent (OI-07 closed)
- [x] Feature 2 calculation formula → confirmed reflection of the existing cashback engine's **Monthly Estimated Cashback** formula (balance, leverage, TIME, Maker/Taker weighted fee rate, Payback Rate, Correction Factor). Maker/Taker are weighted-summed only at the fee-rate stage; Payback Rate is a single value (§2-A-1)
- [x] Correction Factor → **fixed constant of 0.7** (identical across all exchanges/all products, can be hardcoded) → reflected in the preview-exclusive Total Saving Rate formula: `1−(1−Discount Rate)(1−Payback Rate×0.7)`. Since the value is identical across all exchanges, it does not affect the comparison outcome (but must be reflected in the absolute displayed amount). Feature 1 (actual-measurement reverse calculation) does not apply the Correction Factor
- [x] **Virtual Feedback/comparison card display method (confirmed per OI-08, 2026-07-03)**: finally confirmed as **Total Saving basis**. Framing: "You could have saved OOO USDT more in fees if you had used WOOX Pro." Payback Rate basis (alternative) discarded. Applied in common to Features 1 and 2 (§2-A-1)

### Open — PM Decision Required

- [ ] Scope of Admin termination authority · whether resumption is possible · handling of screens mid-exposure (§3-3 follow-up)

### Open — Dependent on External/Other Track

- [ ] **Fix the Admin "TetherMax Applied" field's cashbackRate double-multiplication bug** (OI-10) — in progress/planned on a separate engineering track, not within this project's development scope. **Completion of the fix before promotion launch is a prerequisite**
- [ ] Confirm deployment environment (OI-01)
- [ ] Travel Rule banner logo image assets (for design hardcoding, WOOX Pro · Bithumb)

---

## 6. Development Scope Breakdown (Feature · Page · FE/BE)

To allow developers to begin work without omission on a **page/feature basis**, the target screens, FE tasks, BE tasks, and independent deployment units are separated by feature. See `02.기획문서/화면변경목록_EN.md` (Screen Change List) for the screen matrix.

### 6-0. Common Foundation (Prerequisite for All Features)

| Category | Task |
|------|------|
| BE | ① **Visibility control** = query 5 per-area backoffice on/off flags (D+30 · 2-WOOX-event gate abolished, 2026-07-07) · ② Promotion period determination (WOOX Pro exchange onboarding = globally fixed date +30 days) · ③ Exchange master lookup (Discount Rate, Payback Rate, exposure Y, logo, sign-up/detail URL, Admin onboarding registration value) · ④ **Total Saving Rate calculation** — Nominal (Feature 1) `1−(1−Discount Rate)(1−Payback Rate)` / Preview (Feature 2, Correction Factor fixed at 0.7) `1−(1−Discount Rate)(1−Payback Rate×0.7)` · ⑤ **Adverse-case determination** (not displayed if other Total Saving ≥ WOOX Pro's, using the formula appropriate to each feature) |
| FE | ① Multilingual (i18n) resources · ② USDT amount/%p formatter · ③ Common brand-color Primary CTA component |

### 6-1. Feature 1 — Virtual Feedback After Withdrawal Completion (Screen S1)

| Category | Task |
|------|------|
| BE | Look up the **actual payback amount in the UID Table** (batched once daily, KST 20:00) → **reverse-calculate the Base Fee** → derive the WOOX Pro savings amount (**Total Saving basis, confirmed per OI-08**) · for multiple UIDs, **sum only positive, non-adverse-case values** · handle the minimum 1 USDT · priority branching (Virtual Feedback → Onboarding Event → base) · determine WOOX Pro inclusion and event existence (Admin) · return the existing ad logic upon promotion termination |
| FE | **Virtual Feedback card** in the ad area (rendered on Total Saving basis) · Case B event branch rendering · multiple UIDs shown as **a single total amount + "based on N exchanges" caption** (no listing) · CTA (WOOX Pro exchange detail) · **Travel Rule Banner #2** (outside, bottom of the result card) |
| Target | PC · MO · App (webview) |

### 6-2. Feature 2 — Cashback Preview Inline Comparison Card (Screen S2)

| Category | Task |
|------|------|
| BE | From input values (balance, leverage, TIME, Maker/Taker ratio, exchange), compute via the **Monthly Estimated Cashback formula** (§2-A-1, existing cashback engine formula — Correction Factor **fixed constant of 0.7**) → calculate for WOOX Pro and the current exchange separately → **savings amount (Total Saving basis, confirmed per OI-08)** · determine adverse case (preview-exclusive Total Saving) and unsupported (leverage/product) → return exposure status · not displayed upon promotion termination. **Prerequisite**: completion of the fix for the Admin "TetherMax Applied" field double-multiplication bug (separate track, OI-10) required |
| FE | **Inline comparison card below** the result card (rendered on Total Saving basis, no popup/Dim overlay) · **collapse/expand 2-state toggle** · CTA (exchange detail) · "standard tier basis" caption · **Travel Rule Banner #1** (bottom of result) · retain the existing screen when exposure conditions are not met |
| Target | PC · MO · App (webview) |

### 6-3. Feature 3 — Travel Rule Integration Banner (Screens S1~S5)

| Category | Task |
|------|------|
| BE | Banner exposure determination based on the common promotion-active gate (including pre-login screens, **global determination regardless of user session**) |
| FE | Banner component (**hardcoded logos** for Bithumb and WOOX Pro with a ⇄ arrow between them + KO "트레블룰 연동"/EN "Travel Rule Integration", logo first · text after fixed order, understated badge style, **navigates to WOOX Pro detail on click**, OI-06 URL) · insert at 5 positions: #1 bottom of preview (S2) · #2 outside bottom of withdrawal card (S1) · #3 below pre-login button on MO (S4) · #4 top of PC login page (S3) · #5 below member ID on My Page (S5) · remove from all 5 places when the common termination gate fires |
| Target | S1, S2 = PC · MO · App (webview) / S3~S5 = Web (PC/MO) only (app-native areas excluded) |

### 6-4. Parallel Development · Termination Unit

- The three features can be **developed and deployed individually in parallel**. **Runtime visibility is controlled independently via 5 per-area backoffice on/off** (partial control allowed; the prior single-gate collective model is abolished, 2026-07-07).
- Detailed API signatures, request/response schemas, and DB columns will be finalized in subsequent deliverables (Functional Specification FE/BE #6a/#6b, API Specification #7, DB Design Document #12).
