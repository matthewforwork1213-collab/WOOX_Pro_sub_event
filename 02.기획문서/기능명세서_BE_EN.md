# Functional Specification (BE)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date Written | 2026-07-03 |
| Version | v1.0 |
| Reference Documents | 02.기획문서/요구사항정의서_EN.md, PRD_EN.md, 02.기획문서/기능명세서_FE_EN.md |

> This document is a functional specification from the backend (calculation/data) perspective. For screens and rendering, refer to `기능명세서_FE_EN.md`. Detailed API request/response schemas are finalized in the API Specification (#7), and table structures in the DB Design Document (#12).

---

## Feature List

| F-ID | Feature Name | Requirement ID | Priority | Status |
|---|---|---|---|---|
| F-001 | Virtual Feedback Calculation After Withdrawal Completion (WOOX Pro Not Included) | REQ-001~004, 006, 007 | P0 | Design |
| F-002 | WOOX Pro Event Branch Determination After Withdrawal Completion | REQ-005 | P0 | Design |
| F-003 | Cashback Preview WOOX Pro Comparison Calculation | REQ-008~011, 014, 015 | P0 | Design |
| F-004 | Travel Rule Banner Exposure Determination | REQ-016, 019 | P0 | Design |
| F-005 | Promotion Active/Termination Determination and Batch Rollback | REQ-020~023 | P0 | Design |

---

## Feature Details

### F-001. Virtual Feedback Calculation After Withdrawal Completion (WOOX Pro Not Included)

| Item | Content |
|---|---|
| Description | Takes a list of withdrawal UIDs as input, reverse-calculates the Actual Payback Amount, and derives the WOOX Pro virtual feedback savingAmount |
| Input | Withdrawal UID list (multiple allowed), user identifier |
| Processing | 1) First check promotion active status via F-005; if inactive, immediately return `visible=false` 2) For each UID, look up the Actual Payback Amount from the user UID Table (batch data updated once daily at KST 20:00) 3) Using the per-UID exchange's Discount Rate and Payback Rate (back office), reverse-calculate `Base Fee = Actual Payback ÷ ((1−Discount Rate)×Payback Rate)` 4) Calculate the per-UID net cost difference on a **Total Saving basis** (finalized per OI-08) — formula per PRD §2-A-1 5) For any UID where the other exchange's Total Saving Rate ≥ WOOX Pro's Nominal Total Saving Rate (80%), mark that UID as an Adverse Case and exclude it from the savingAmount sum 6) Among non-Adverse-Case UIDs, sum only those with a positive savingAmount 7) If the summed amount is less than 1 USDT, correct it to 1 USDT; if it is 0 or less, set `visible=false` |
| Output | `visible` (bool), `savingAmount` (USDT, Total Saving basis), `savingPercentPoint` (= Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange), Correction Factor not applied. PRD §2-A-1), `exchangeCount` (N, number of UIDs included in the sum) |
| Exception Handling | If a specific UID's payback data is missing (e.g., due to batch not yet reflected), that UID is excluded from the calculation (not treated as an error). If all UIDs are unable to be calculated, `visible=false`. If a batch time-lag notice message is to be shown on screen, the batch reference time (KST 20:00) is an internal server value, and **the API responds with a UTC timestamp**, which the FE converts to the user's device local time for rendering (NFR-007) |
| Related Screens | S1 (Withdrawal Completion Screen) |
| Related API | GET /api/promo/withdrawal-feedback (tentative) |

### F-002. WOOX Pro Event Branch Determination After Withdrawal Completion

| Item | Content |
|---|---|
| Description | For withdrawals that include WOOX Pro, determines which event type to display according to priority |
| Input | Withdrawal UID list (for determining WOOX Pro inclusion), list of events registered in the Admin |
| Processing | 1) Check promotion active status via F-005 2) If a WOOX Pro-specific event is actively registered in the Admin, `eventType=woox_event` 3) If not, check whether the TetherMax WOOX Pro Onboarding Event is active → if so, `eventType=onboarding_event` 4) If neither exists, `eventType=house_ad` (competing exchange events are excluded from candidates) |
| Output | `eventType` (`woox_event` / `onboarding_event` / `house_ad`), corresponding event metadata (banner images, copy, etc. reuse existing event Admin data) |
| Exception Handling | If the promotion is inactive, return the same as F-001's base logic (treated the same as `house_ad`) |
| Related Screens | S1 (Withdrawal Completion Screen) |
| Related API | GET /api/promo/withdrawal-feedback (same endpoint as F-001; response case branches based on whether WOOX Pro is included) |

### F-003. Cashback Preview WOOX Pro Comparison Calculation

| Item | Content |
|---|---|
| Description | Using the preview conditions entered by the user, calculates the Monthly Estimated Cashback for both the current exchange and WOOX Pro, and returns the comparison result |
| Input | Exchange (currently selected), balance (asset size), leverage, Maker/Taker ratio, trading frequency (for TIME mapping) |
| Processing | 1) First check promotion active status via F-005 2) Using the input values and the current exchange's Maker/Taker fee rates, Discount Rate, and Payback Rate, calculate `actualFeePaid` and `Monthly Estimated Cashback` (Correction Factor fixed at 0.7) — reusing the existing Cashback Preview engine formula 3) Substitute the same input values with WOOX Pro parameters (Discount Rate 0%, Payback Rate 80%, Correction Factor 0.7) to calculate the WOOX Pro value 4) Determine Adverse Case status based on the Preview-specific Total Saving Rate `1−(1−Discount Rate)×(1−Payback Rate×0.7)` (Adverse Case if the other exchange ≥ WOOX Pro) 5) If the leverage/product is a condition unsupported by WOOX Pro, handle separately as not visible 6) If not an Adverse Case and not unsupported, calculate the net cost difference on a **Total Saving basis** (finalized per OI-08) as the savingAmount (USDT) 7) `savingPercentPoint` is calculated separately as the difference in **Nominal Total Saving Rate** (Correction Factor not applied, `1−(1−Discount Rate)×(1−Payback Rate)`) — using a different formula from the USDT amount calculation |
| Output | `visible` (bool), `currentExchangeEstimate`, `wooxProEstimate`, `savingAmount` (USDT, Total Saving basis, Correction Factor applied), `savingPercentPoint` (= Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange), Correction Factor not applied. Same definition as Feature 1, PRD §2-A-1) |
| Exception Handling | It is an FE contract that this API is never called for requests where Exchange=WOOX Pro is already selected, but the server also defensively returns `visible=false`. If the Cashback engine's "TetherMax applied" field double-multiplication bug (OI-10) remains unfixed, calculation result accuracy is not guaranteed, so this must not be deployed until the bug fix is complete (pre-launch prerequisite) |
| Related Screens | S2 (Cashback Preview Result Page) |
| Related API | POST /api/promo/cashback-preview/compare (tentative) |

### F-004. Travel Rule Banner Exposure Determination

| Item | Content |
|---|---|
| Description | Determines the exposure status and display copy (i18n key) of the Travel Rule banner across 5 locations |
| Input | Screen entry request (location-independent, common determination), user locale |
| Processing | 1) Query promotion active status via F-005 2) If active, return `visible=true` along with an i18n key (e.g., `promo.travelrule.badge`) 3) Pre-login requests (S3·S4) also apply the same determination logic without a user identifier (session-independent) |
| Output | `visible` (bool), i18n key |
| Exception Handling | If the promotion is inactive, `visible=false`. The logo image itself is not delivered via API (hardcoded in design, REQ-017) |
| Related Screens | S1~S5 (App applies to S1·S2 only) |
| Related API | GET /api/promo/status (same endpoint as F-005) |

### F-005. Promotion Active/Termination Determination and Batch Rollback

| Item | Content |
|---|---|
| Description | Determines the active/inactive status of the entire promotion using a single standard, and provides the gate commonly referenced by F-001~F-004 |
| Input | None (internal server state lookup) — WOOX Pro onboarding reference date, Admin termination status of the 2 WOOX Pro events |
| Processing | `Active = (current time ≤ WOOX Pro onboarding reference date + 30 days) AND (neither of the 2 WOOX Pro events has been terminated)`. If either of the 2 events is terminated in the Admin, immediately switch to `active=false` (OR logic; queries the existing event termination status as-is, with no new termination UI development required) |
| Output | `active` (bool) — a single value commonly consumed by F-001~F-004 |
| Exception Handling | In situations where determination is not possible, such as failure to query event termination status, safely treat as `active=false` (fallback in the direction of not exposing the promotion nudge in the event of a failure) |
| Related Screens | S1~S5 entire (common gate) |
| Related API | GET /api/promo/status (tentative) |
