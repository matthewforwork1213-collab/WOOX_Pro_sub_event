# Functional Specification (BE)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Commemoration 30-Day Focused Promotion |
| Date Written | 2026-07-03 |
| Revision Date | 2026-07-06 |
| Version | v1.1 |
| Reference Documents | 02.기획문서/요구사항정의서_EN.md, PRD_EN.md, 02.기획문서/API스펙_EN.md, 02.기획문서/기능명세서_FE_EN.md |

> This document is a functional specification from the backend (calculation/data) perspective. For screens and rendering, refer to `기능명세서_FE_EN.md`.
> **This document internalizes all formulas, constants, decision rules, and exceptions so that a BE developer can implement it using only this document + the API Spec (#7).** So that no other document needs to be opened, the relevant policies from the PRD and Requirements Definition are reflected directly within this document (with REQ/PRD numbers annotated for source traceability). Only the physical table structure is finalized in the DB Design (#12).

---

## 0. Document Usage Guide (FE/BE Distinction Definition)

- **FE/BE is a "development area" distinction** (frontend code / backend code). It is not a distinction between the user frontend vs. the backoffice (Admin).
- The 5 features (F-001~F-005) of this project are **all user frontend features**, and the **same feature is specified separately by the screen owner (FE) and the calculation/data owner (BE)**. A single feature appears in both the FE and BE documents (e.g., F-003 Cashback Comparison = FE handles card insertion/collapse, BE handles amount calculation).
- **The backoffice (Admin) has no new development in this project.** It only **reads** existing Admin values (Discount Rate, Payback Rate, event registration/termination status). For a summary of Admin dependencies, refer to §1.6·§6.

---

## 1. Common Policies (Common to F-001~F-005, BE)

All features assume the common rules below. Each feature detail (§3) references this section rather than repeating it.

### 1.1 Visibility Control — Per-Area Backoffice On/Off (2026-07-07 policy)

> **Policy change (2026-07-07)**: The previous common gate "D+30 AND both WOOX Pro events not terminated" is **abolished**, and each display area is **controlled independently via backoffice on/off**. The promotion period is also admin-controlled — per C-level decision, OI-07 updated (supersedes the prior 30-day/no-permanent stance), confirmed 2026-07-07.

- Each area is shown **only when its corresponding backoffice flag is ON** (F-005 provides 5 flags). Partial control allowed (per-area independent).

| Area | Backoffice flag | When OFF |
|---|---|---|
| Withdrawal-complete WOOX Pro Virtual Feedback (F-001) | `s1Feedback` | Virtual Feedback not shown → original base event logic (1 random ongoing exchange event) |
| Withdrawal-complete Travel Rule banner #2 (F-004) | `s1Banner` | Banner not shown |
| Cashback Preview WOOX Pro comparison (F-003) | `s2Compare` | Comparison card not inserted |
| Cashback Preview Travel Rule banner #1 (F-004) | `s2Banner` | Banner not shown |
| Login 3-page Travel Rule #3·#4·#5 (F-004) | `loginBanners` | Three positions hidden collectively |

- Each flag is **independent** (a single area can be turned OFF). The previous "collective rollback of 3 features / no partial termination" is **abolished** (REQ-021 revised).
- Managed via the on/off of the **new backoffice visibility-control page**, with no new termination UI (the previous 2-WOOX-event termination-button dependency is abolished, REQ-022).
- Event branching for WOOX Pro-included withdrawals (F-002) operates regardless of `s1Feedback` (event branching is separate from the Virtual Feedback notice).

### 1.2 Time Handling (KST Internal / UTC Response)

- Batch processing (KST 20:00) is calculated **server-internally on a KST absolute-time** basis. (2026-07-07: D+30 auto-determination abolished — the period is controlled by the backoffice)
- **All timestamp fields in API responses are returned in UTC (ISO 8601).** Local time conversion for display is performed by the FE. The server does not embed fixed KST text in responses (NFR-007).

### 1.3 Non-Disclosure of Internal Figures (Response Payload Rule)

- **Internal raw data such as Discount Rate, Payback Rate, Correction Factor, Commission Rate, and Margin Rate are not included in any API response** (REQ-023, NFR-002).
- User-facing responses contain **only calculated result values** (savings amount USDT, %p, estimated cashback, etc.).

### 1.4 Adverse-Case Prevention Decision (Common to F-001·F-003)

- Comparison/feedback exposure occurs **only when WOOX Pro is strictly advantageous**.
- The decision metric is the **Total Saving Rate**, and if another exchange's Total Saving Rate is **equal to or higher than (≥)** WOOX Pro, it is not displayed (`visible=false`). It is displayed only when WOOX Pro **exceeds (>)**.
- Feature 1 decides based on the **nominal** Total Saving Rate, and Feature 2 based on the **preview-specific** Total Saving Rate (Correction Factor applied) (§2.2). However, the displayed %p uses the nominal basis for both features (§2.3).

### 1.5 Exposure Gating and Display Floor (Beware of Confusion)

- **The gating criterion is "savings amount > 0"** (a positive value makes it an exposure candidate). 1 USDT is **not** the gating threshold.
- **The display floor is 1 USDT**: if the savings amount is positive but less than 1 USDT, **the server corrects it to 1 USDT** and returns it. If 0 or less, `visible=false` (REQ-003).

### 1.6 Data Sources (Independent per Feature)

| Feature | Data Source | Refresh |
|---|---|---|
| F-001 | **Actual incurred payback amount** from the user UID table (historical actuals) | Batch once daily, **KST 20:00** |
| F-003 | **User input values only** (a pure projection unrelated to the UID table) | Real-time calculation on request |
| Common (exchange parameters) | Per-exchange Maker/Taker fee rates, Discount Rate, Payback Rate from the Admin/cashback engine | Admin-managed |

- **F-001 and F-003 have completely independent data sources.** F-003 cannot know the user's actual trading volume, so it only performs a prediction based on input values (no UID table lookup).
- Withdrawals are always possible regardless of the batch, and F-001 uses the **UID payback value at the time of withdrawal** as the reverse-calculation basis.

---

## 2. Calculation Model and Constants (BE Core)

### 2.1 Constants · WOOX Pro Parameters

| Item | Value | Nature |
|---|---|---|
| WOOX Pro Discount Rate | 0% | Internal/backoffice |
| WOOX Pro Payback Rate (Cashback) | 80% | Internal only (not disclosed) |
| WOOX Pro nominal Total Saving Rate | 80% (equal to Payback Rate since Discount Rate is 0) | Internal only (not disclosed) |
| **Correction Factor** | **0.7 fixed constant** | Internal only (not disclosed) |

- The Correction Factor is a **fixed constant common to all exchanges and all products** (treated as a permanent constant). Rather than being queried per exchange, **a single global setting value is hardcoded**. If the value changes, all exchanges change together simultaneously.
- The Correction Factor is multiplied **only in Feature 2 (preview prediction)**. **It is not applied to Feature 1 (actuals reverse-calculation).**

### 2.2 Total Saving Rate Definition

**Nominal (applied to Feature 1 · actual data)**
```
Total Saving Rate(E) = 1 − (1 − Discount Rate(E)) × (1 − Payback Rate(E))
```
- WOOX Pro: Discount Rate 0 → nominal Total Saving Rate = Payback Rate = 80%.

**Preview-specific (applied to Feature 2 · predicted values, Correction Factor applied)**
```
Total Saving Rate_preview(E) = 1 − (1 − Discount Rate(E)) × (1 − Payback Rate(E) × 0.7)
```
- Since the Correction Factor is identical (0.7) across all exchanges, **it has no effect on which side is advantageous (the comparison direction).** However, the **absolute amount** displayed on screen must reflect 0.7 so that the numbers match the actual cashback engine results.

### 2.3 Display %p Definition (Common to Features 1·2, Correction Factor Not Applied)

```
Display %p = nominal Total Saving Rate(WOOX Pro) − nominal Total Saving Rate(current exchange)
            (Correction Factor 0.7 is not applied — %p is always on the nominal basis)
```
- Although the USDT savings amount uses a different formula per feature (§2.4/§2.5), **%p is unified for both features using this nominal formula** (REQ-024).
- Since it is the same Total Saving Rate metric as the adverse-case decision (§1.4), the decision criterion and the displayed %p are always consistent.
- It may look identical to the Payback Rate difference, but **when the comparison target is an exchange that has a Discount Rate, the value differs**, so the precise definition is the "Total Saving Rate difference."

**Single %p when aggregating multiple UIDs (base-fee weighted average, confirmed 2026-07-06)**

When Feature 1 aggregates multiple exchange UIDs, the single %p is derived as the **base-fee weighted average** below (no simple sum, no arithmetic mean). The aggregation set is the same as `savingAmount` (adverse-case-free & positive-savings UIDs).
```
Current effective Total Saving Rate = Σ(base fee_i × current_i nominal Total Saving Rate) ÷ Σ(base fee_i)
Multi-UID %p = nominal Total Saving Rate(WOOX Pro, 80%) − Current effective Total Saving Rate

  ⇔ (equivalent identity)  Multi-UID %p = total additional savings ÷ Σ(base fee_i)
```
- Since WOOX Pro's net cost per UID is `base fee × 0.2`, WOOX Pro's effective Total Saving Rate is always 80%; thus the two formulas are identical.
- For a single UID (N=1), this reduces exactly to the §2.3 base definition.
- The %p calculation uses the actual aggregated values **before** the 1 USDT display-floor correction (total additional savings·Σ base fee).

### 2.4 Feature 1 — Base Fee Reverse-Calculation and Savings Amount

On the Withdrawal Completion Screen, only the user's **actual payback amount** exists. The exchange's original fee rate is unnecessary and is reverse-calculated as below.
```
base fee         = actual payback amount ÷ ((1 − Discount Rate) × Payback Rate)     (assuming Discount Rate 0: actual payback ÷ Payback Rate)
current net cost  = base fee × (1 − current Total Saving Rate)
WOOX Pro net cost = base fee × (1 − WOOX Pro Total Saving Rate)
additional savings = current net cost − WOOX Pro net cost
```
**Verification Example** (Bitget Payback Rate 54%, actual payback 54 USDT, assuming Discount Rate 0%)

| Step | Calculation | Value |
|---|---|---|
| base fee (reverse-calc) | 54 ÷ 0.54 | 100 USDT |
| current net cost | 100 × (1 − 0.54) | 46 USDT |
| WOOX Pro net cost | 100 × (1 − 0.80) | 20 USDT |
| additional savings (`savingAmount`) | 46 − 20 | **26 USDT** |
| `savingPercentPoint` | nominal TS diff = 80% − 54% (§2.3) | **26%p** |

→ "With WOOX Pro, you could have saved 26 USDT (26%p) more in fees"

⚠️ **`savingPercentPoint` is NOT proportional to `savingAmount`.** In this single-UID case both happen to be 26 by coincidence; %p is always the nominal Total Saving Rate difference (§2.3), independent of the amount.

**Multiple-UID example** (Bitget 54% + Zoomex 60%, actual payback 54·36 USDT respectively, Discount Rate 0)

| UID | actual payback | base fee | current net cost | WOOX net cost | additional savings |
|---|---|---|---|---|---|
| Bitget (54%) | 54 | 100 | 46 | 20 | 26 |
| Zoomex (60%) | 36 | 60 | 24 | 12 | 12 |
| **Sum** | | **160** | | | **38** |

- `savingAmount` = **38 USDT** (after <1 display-floor correction)
- `savingPercentPoint` = total additional savings ÷ Σ base fee = 38 ÷ 160 = **23.8%p** (§2.3 base-fee weighted average — neither the arithmetic mean 27%p nor the amount 38)

### 2.5 Feature 2 — Monthly Estimated Cashback (Preview Projection)

> This is not a new formula but **the actual formula of the existing cashback preview engine**. This project uses this value as-is and only adds the WOOX Pro comparison.

```
Monthly Estimated Cashback(E)
  = balance × leverage × TIME × 2 × 30
  × actualFeePaid(E) × Payback Rate(E) × Correction Factor(0.7)

actualFeePaid(E) = (Maker fee rate × (1 − Maker Discount Rate(E)) × Maker ratio)
                 + (Taker fee rate × (1 − Taker Discount Rate(E)) × Taker ratio)
```

| Variable | Description |
|---|---|
| balance · leverage | User input (asset size · leverage) |
| Maker/Taker ratio | User input (sum 100% → normalized to 0~1) |
| Maker/Taker fee rate · Discount Rate | Per-exchange Admin values (Maker/Taker managed separately) |
| Payback Rate | Per-exchange **single value** (no Maker/Taker distinction — weighting occurs only at the fee-rate stage) |
| Correction Factor | **0.7 fixed constant** (§2.1) |
| TIME | Trade-frequency mapping value (**Feature 2-specific**, common to all exchanges) |

**TIME Mapping Table** (request's `dailyTradeFrequency` enum ↔ TIME)

| Frequency | enum | TIME |
|---|---|---|
| 0~1 times/day | `0_1` | 0.6 |
| 1~2 times/day | `1_2` | 1.5 |
| 2~5 times/day | `2_5` | 3.0 |
| 5~10 times/day | `5_10` | 7.5 |
| 10+ times/day | `10_PLUS` | 20.0 |

**Comparison/Savings Amount Derivation**: The same input values (balance·leverage·TIME·Maker/Taker ratio) are substituted into both WOOX Pro and the current exchange to obtain the net cost using each one's preview-specific Total Saving Rate (§2.2), and the difference is derived as the savings amount (USDT, 0.7 applied). `savingPercentPoint` is separately calculated as the **nominal** Total Saving Rate difference (§2.3, 0.7 not applied), so it is not simply proportional to `savingAmount`.

- **The authoritative definition of `savingAmount` is the "net cost difference"** (formula above). When the compared exchange's **Discount Rate is 0 (the majority in this ecosystem)**, this value exactly equals `wooxProEstimate − currentExchangeEstimate` (the cashback estimate difference) — the API-003 example (Zoomex, Discount Rate 0) where `567 = 1512 − 945` is this case. When the compared exchange has a **Discount Rate > 0**, the net cost difference also includes the discount portion, so it diverges from the cashback difference. In that case the **net cost difference is authoritative**, and `wooxProEstimate − currentExchangeEstimate` is not used directly.

- **Precondition (separate engineering track, not within this project's scope)**: There is a bug where the Admin "TetherMax Applied (%)" field stores the Discount Rate double-multiplied by the Payback Rate (cashbackRate). Feature 2 reads this field's Discount Rate as-is for calculation, so **this bug must be fixed before launch** for the numbers to be accurate (⚠️ OI-10). If not fixed, this API is not deployed to production.

---

## 3. Feature Details

Each feature assumes the §1 common policies and §2 calculation model. Field names follow the JSON field names in the API Spec (#7).

### F-001. Virtual Feedback Calculation After Withdrawal Completion (WOOX Pro Not Included)

| Item | Content |
|---|---|
| Description | Receives a list of withdrawal (exchange, UID) pairs, reverse-calculates the actual payback amount (§2.4), and derives the WOOX Pro Virtual Feedback savings amount |
| Input | `withdrawals` (list of (exchange, UID) pairs, comma-separated `exchange:uid`, multiple possible). **The same UID can exist on different exchanges**, so a UID alone is not identifiable → it must be paired with the exchange, and the batch payback is looked up by the (exchange, uid) key. + user identifier (session) |
| Processing | 1) Check the backoffice `s1Feedback` flag — if OFF, immediately `visible=false` (§1.1) 2) For each UID, look up the actual payback amount from the user UID table (KST 20:00 batch data, §1.6) 3) For each UID, compute **base fee reverse-calculation → additional savings** using the exchange's Discount Rate·Payback Rate (§2.4) 4) Per-UID adverse-case decision: if another exchange's nominal Total Saving Rate ≥ WOOX Pro (80%), mark that UID as adverse-case and exclude it from the sum (§1.4) 5) Sum only the UIDs that are non-adverse & have a positive savings amount into a **single total** 6) If the sum is less than 1 USDT, correct to 1; if 0 or less, `visible=false` (§1.5) 7) For multiple UIDs, unify `savingPercentPoint` via the **base-fee weighted average** (§2.3; no simple sum, no arithmetic mean) |
| Output Fields | `case`="non_woox_pro", `visible` (bool), `savingAmount` (USDT, Total Saving basis, value after <1 correction), `savingPercentPoint` (nominal %p — for multiple UIDs, §2.3 base-fee weighted average), `exchangeCount` (**distinct number of exchanges** included in the sum, for the "based on N exchanges" caption — an exchange with 2+ UIDs still counts as 1, e.g., 3 exchanges·4 UIDs → 3) |
| Exception Handling | No batch payback data for a specific UID → exclude only that UID from calculation (not an error). Calculation impossible for all UIDs → `visible=false`. Calculation failure (500) → FE base fallback. The batch-lag notice time is returned in UTC, and the FE converts to local (§1.2) |
| Related Screen | S1 (Withdrawal Completion Screen) |
| Related API | GET /api/promo/withdrawal-feedback (API-002, Case A) |
| Requirements | REQ-001~004, 006, 007 / NFR-005 |

### F-002. WOOX Pro Event Branch Decision After Withdrawal Completion

| Item | Content |
|---|---|
| Description | Decides, by priority, the event type to display for withdrawal cases that include WOOX Pro |
| Input | `withdrawals` (to determine WOOX Pro inclusion — (exchange, UID) pairs), Admin-registered event list |
| Processing (3-step priority) | 1) (WOOX-included event branching runs regardless of any visibility flag) 2) A **TetherMax-type event** is registered active in the Admin → `eventType=tethermax_event` (random 1 if 2+ candidates) 3) If none, a **WOOX Pro `with`-type event** is active → `eventType=woox_with_event` (random 1 if 2+ candidates) 4) If neither, `eventType=base` (= **other-exchange with-type event**, excluding WOOX Pro = existing base logic, 1 random ongoing exchange event). Competitor exchange events are excluded from candidates (partnership protection). **There are only two event types: ① TetherMax-type ② with-type (per-exchange)**; "self event / house / onboarding" are instances and removed (correction 2026-07-07). Label mapping: House·Onboarding = TetherMax-type / self = WOOX Pro with-type / counter·base = other-exchange with-type |
| Output Fields | `case`="woox_pro_included", `eventType` (`tethermax_event`/`woox_with_event`/`base`). Event details such as banner image·copy reuse existing event Admin data (separate lookup). `base` signals the FE to run the existing base event logic |
| Exception Handling | On event-branch API failure, revert to the **existing base logic (show 1 randomly selected ongoing exchange event)**. `eventType=base` (tiers 1·2 unmet) is also rendered via the existing base logic — no separate promo card. (With the D+30 / event-dependent gate removed, F-002 has no separate visibility on/off) |
| Related Screen | S1 (Withdrawal Completion Screen) |
| Related API | GET /api/promo/withdrawal-feedback (API-002, Case B — same endpoint as F-001, branched by `case`) |
| Requirements | REQ-005 |

### F-003. Cashback Preview WOOX Pro Comparison Calculation

| Item | Content |
|---|---|
| Description | Calculates the Monthly Estimated Cashback (§2.5) of the current exchange and WOOX Pro respectively using the user's input conditions, and returns the comparison result on a Total Saving basis |
| Input | `exchange` (current exchange), `balance`, `leverage`, `makerRatio`, `takerRatio` (sum=100), `dailyTradeFrequency` (TIME mapping, §2.5) |
| Processing | 1) Check the backoffice `s2Compare` flag (if OFF, not shown, §1.1) 2) Calculate `actualFeePaid`·`Monthly Estimated Cashback` (0.7 applied) with the current exchange parameters 3) Substitute WOOX Pro parameters (Discount Rate 0·Payback Rate 80%·0.7) into the same input to calculate the WOOX Pro value 4) Adverse-case decision using the **preview-specific** Total Saving Rate (§2.2): other exchange ≥ WOOX Pro → `visible=false` (§1.4) 5) If the leverage·product is unsupported by WOOX Pro, `visible=false` (**unsupported determination**: query the WOOX Pro supported leverage/product range registered in the exchange master/admin; out-of-range input = unsupported. See §5 data source) 6) If neither adverse nor unsupported, derive the net cost difference on a Total Saving basis as `savingAmount` (0.7 applied) 7) `savingPercentPoint` is separately calculated as the **nominal** Total Saving Rate difference (§2.3, 0.7 not applied) |
| Output Fields | `visible` (bool), `currentExchangeEstimate`, `wooxProEstimate` (each Monthly Estimated Cashback, 0.7-applied value·raw data not included), `savingAmount` (USDT, 0.7 applied), `savingPercentPoint` (nominal %p) |
| Exception Handling | `exchange`=WOOX Pro not being called by FE is the default contract (REQ-010), but the server also defensively returns `visible=false`. `makerRatio+takerRatio≠100` or required field missing → 400. Nonexistent `exchange` → 404. Calculation failure → 500 (however, deployment prohibited if the OI-10 bug is not fixed) |
| Related Screen | S2 (Cashback Preview Result Page) |
| Related API | POST /api/promo/cashback-preview/compare (API-003) |
| Requirements | REQ-008~011, 014 (REQ-015 "multi-UID detail view" is an optional display feature of Feature 1 (multi-UID) and is out of scope for this comparison calculation, Could) |

### F-004. Travel Rule Banner Exposure Decision

| Item | Content |
|---|---|
| Description | Determines the exposure status and copy i18n key of the Travel Rule Integration Banner at 5 positions |
| Input | Screen-entry request (position-agnostic, common decision), user locale (copy rendered by FE) |
| Processing | 1) Check the per-position backoffice flag (#2=`s1Banner`, #1=`s2Banner`, #3·#4·#5=`loginBanners`) 2) If ON, return `visible=true` + i18n key (e.g., `promo.travelrule.badge`). **Navigates to WOOX Pro detail on click** (OI-06 URL) 3) Pre-login requests (S3·S4) also use the same decision without a user identifier (session-agnostic, REQ-019) |
| Output Fields | Per-position banner flags (#2=`s1Banner`, #1=`s2Banner`, #3·#4·#5=`loginBanners`) + `travelRuleBanner.i18nKey` + `wooxProDetailUrl` (banner click destination, OI-06). (API-001 response; logo images are not returned via API — design hardcoded, REQ-017) |
| Exception Handling | When `active=false`, returns the not-displayed value. On status-query failure, safely treated as `active=false` per the F-005 rule |
| Related Screen | S1~S5 (for App, only S1·S2 apply, see §FE Platform Matrix) |
| Related API | GET /api/promo/status (API-001, shared with F-005) |
| Requirements | REQ-016, 019 |

### F-005. Visibility Control State (Backoffice On/Off)

| Item | Content |
|---|---|
| Description | Provides the 5 per-area backoffice on/off flags. F-001·F-003·F-004 consume their own area's flag. **(2026-07-07 policy: D+30 · 2-WOOX-event gate abolished, §1.1)** |
| Input | None (server internal state) — WOOX Pro onboarding reference date, Admin termination status of the two WOOX Pro events |
| Processing | Returns the 5 flags stored in the backoffice (`s1Feedback`·`s1Banner`·`s2Compare`·`s2Banner`·`loginBanners`). No D+30 · event-dependency determination |
| Output Fields | `s1Feedback`·`s1Banner`·`s2Compare`·`s2Banner`·`loginBanners` (each bool) — per-area independent. Also returns `travelRuleBanner.i18nKey` and `wooxProDetailUrl` (CTA/banner click destination, OI-06) (API-001) |
| Exception Handling | On settings-query failure, safely treat **all flags as OFF** (fallback toward not showing the nudge) |
| Related Screen | All of S1~S5 (common gate) |
| Related API | GET /api/promo/status (API-001) |
| Requirements | REQ-020~023 |

---

## 4. Exception·Fallback Matrix (BE)

| Situation | Decision/Response | Result |
|---|---|---|
| Backoffice flag OFF (per area) | Only that area hidden: `s1Feedback`OFF->feedback base, `s2Compare`OFF->comparison not inserted, `s1Banner`/`s2Banner`/`loginBanners`OFF->that banner hidden | per-area independent (partial control) |
| Adverse case (other Total Saving Rate ≥ WOOX Pro) | 200 OK + `visible=false` | Not displayed (not an error) |
| WOOX Pro unsupported (leverage/product, F-003) | 200 OK + `visible=false` | Comparison Card not inserted |
| `exchange`=WOOX Pro (F-003) | 200 OK + `visible=false` (defensive) | FE does not call in the first place |
| Savings amount positive & <1 USDT | Corrected to `savingAmount=1` | Displayed (display floor) |
| Savings amount 0 or less | `visible=false` | Not displayed |
| Some UID payback data missing (F-001) | Exclude only that UID | Sum with the rest |
| Calculation impossible for all UIDs (F-001) | `visible=false` | base fallback |
| `makerRatio+takerRatio≠100`/required missing (F-003) | 400 BAD_REQUEST | FE input validation |
| Nonexistent `exchange` (F-003) | 404 NOT_FOUND | — |
| Calculation failure | 500 INTERNAL_ERROR | FE base fallback |
| Backoffice settings-query failure (F-005) | Safe response with **all 5 flags false** (avoid 500) | Nudges/banners not displayed |
| OI-10 double-multiplication bug not fixed (F-003) | API-003 production deployment prohibited | Precondition before launch |

---

## 5. Admin (Backoffice) Dependency Summary (Read-Only)

| Item | Purpose | New Development |
|---|---|---|
| Per-exchange Maker/Taker fee rate·Discount Rate·Payback Rate | F-001 reverse-calculation, F-003 calculation | None (read existing values) |
| WOOX Pro event / Onboarding Event registration·active status | F-002 branch decision | None |
| The 5 visibility flags (stored in the backoffice) | F-005 query (user front reads) | None (the backoffice page writes, API-B01/B02) |
| WOOX Pro supported leverage/product range | F-003 unsupported determination | None (read the exchange master) |
| WOOX Pro exchange detail URL (onboarding registration value, OI-06) | CTA destination (FE consumed) | None |
| "TetherMax Applied (%)" field double-multiplication bug (OI-10) | F-003 accuracy precondition | Separate engineering track |

---

## 6. Requirements Traceability (BE Scope)

| REQ/NFR | Reflected Location |
|---|---|
| REQ-001~004, 006, 007 | F-001, §2.4, §1.4·1.5 |
| REQ-005 | F-002 |
| REQ-008~011, 014 | F-003, §2.5, §1.4 |
| REQ-015 (multi-UID detail view, Could) | Feature 1 optional display (FE), out of this calculation scope |
| REQ-016, 019 | F-004 |
| REQ-020~023 | F-005, §1.1 |
| REQ-024 (%p definition) | §2.3 |
| REQ-025 (Total Saving display finalization) | §2.2·2.4·2.5 |
| NFR-001 (response within 500ms) | F-001·F-003 calculation API performance target |
| NFR-002 (internal figure non-disclosure) | §1.3 |
| NFR-004 (near-real-time termination) | F-005, §1.1 (base reflected immediately for new requests — the gate query result is not cached long-term) |
| NFR-005 (batch consistency) | F-001, §1.6 |
| NFR-007 (time display) | §1.2 |
