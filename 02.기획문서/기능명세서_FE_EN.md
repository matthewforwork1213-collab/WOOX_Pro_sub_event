# Functional Specification (FE)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date | 2026-07-03 |
| Version | v1.0 |
| Reference Documents | 02.기획문서/요구사항정의서_EN.md, PRD_EN.md, 02.기획문서/화면변경목록_EN.md |

> This document is a functional specification from the frontend (screen/UI) perspective. For calculation logic and data processing, refer to `기능명세서_BE_EN.md` (Functional Specification (BE)). Related APIs are provisional names and will be finalized in the API Specification (#7).

---

## Feature List

| F-ID | Feature Name | Requirement ID | Priority | Status |
|---|---|---|---|---|
| F-001 | Virtual Feedback Card After Withdrawal Completion (WOOX Pro Not Included) | REQ-001~004, 006, 007 | P0 | Design |
| F-002 | WOOX Pro Event Branching After Withdrawal Completion (WOOX Pro Included) | REQ-005 | P0 | Design |
| F-003 | Cashback Preview WOOX Pro Comparison Card (Inline) | REQ-008~015 | P0 | Design |
| F-004 | WOOX Pro × Bithumb Travel Rule Integration Banner (5 Locations) | REQ-016~019 | P0 | Design |
| F-005 | Promotion Active Status Reflection (Screen Branching) | REQ-020~022 | P0 | Design |

---

## Feature Details

### F-001. Virtual Feedback Card After Withdrawal Completion (WOOX Pro Not Included)

| Item | Content |
|---|---|
| Description | On the Withdrawal Completion Screen (S1), for withdrawals that do not include WOOX Pro, the existing ad area is replaced with a Virtual Feedback card. |
| Input | Screen entry event (withdrawal completion), withdrawal UID list (multiple possible) — no separate user input |
| Processing | 1) On screen entry, request Virtual Feedback data from the BE using the withdrawal UID list 2) If the response's `visible` is true, render the Virtual Feedback card; if false, fall back to the base event logic (display the TetherMax Onboarding Event first if active, otherwise the general house ad — see Screen Change List A-2 · A-3, PRD §2-A-3) 3) Render using the **Total Saving-basis copy template** ("You could have saved OOO more USDT") (OI-08 confirmed) 4) If there are 2 or more UIDs, render the combined total amount + "based on N exchanges" caption (no individual UID listing) |
| Output | Virtual Feedback card (headline, savings amount in USDT, %p, subcopy, CTA button) |
| Exception Handling | If response `visible` = false (adverse case, calculation not possible, or savings amount < 1 USDT after processing resulting in ≤ 0), the card is not displayed and falls back to the base event logic (Onboarding Event first → general house ad). On API failure/timeout, fall back to the base event logic (Virtual Feedback not shown). When displaying time-related information such as a batch time-lag notice, **convert the UTC timestamp returned by the API to the browser/device's local timezone** for rendering (NFR-007) — hardcoding KST is prohibited |
| Related Screens | S1 (Withdrawal Completion Screen) — Web PC · Web MO · App (webview) |
| Related API | GET /api/promo/withdrawal-feedback (provisional, queried by UID list) |

### F-002. WOOX Pro Event Branching After Withdrawal Completion (WOOX Pro Included)

| Item | Content |
|---|---|
| Description | For withdrawals that include WOOX Pro, branch and display in the order of (1) WOOX Pro's own event (2) TetherMax WOOX Pro Onboarding Event (3) general House Ad |
| Input | Screen entry event (withdrawal completion), withdrawal UID list |
| Processing | Render the corresponding ad component according to the BE response's `eventType` field (`woox_event` / `onboarding_event` / `house_ad`) |
| Output | Ad card by event type (WOOX Pro own event banner / Onboarding Event banner / general House Ad) |
| Exception Handling | On API failure, fall back to the existing base logic of "display 1 randomly selected ongoing exchange event" |
| Related Screens | S1 (Withdrawal Completion Screen) — Web PC · Web MO · App (webview) |
| Related API | GET /api/promo/withdrawal-feedback (same endpoint as F-001, branching by response field) |

### F-003. Cashback Preview WOOX Pro Comparison Card (Inline)

| Item | Content |
|---|---|
| Description | On the Cashback Preview Result Page (S2), when another exchange is selected, insert the WOOX Pro Comparison Card inline directly below the existing result card, without a popup or Dim overlay |
| Input | Conditions entered by the user in the preview (exchange, asset size, leverage, Maker/Taker ratio, trading frequency), comparison card collapse toggle click |
| Processing | 1) Pass the preview input values as-is to the BE to request comparison results 2) If response `visible` = true, render the Comparison Card below the result card (expanded by default) 3) When the collapse button is clicked, toggle expand/collapse via local state only (no re-request) 4) Render using the **Total Saving-basis copy template** (OI-08 confirmed) |
| Output | Comparison Card (headline, savings amount in USDT, %p, "Standard user / base tier" basis caption, CTA button, collapse toggle) |
| Exception Handling | If response `visible` = false (adverse case or WOOX Pro-unsupported condition), the Comparison Card is not rendered and only the existing result screen is shown. If exchange = WOOX Pro is selected, the API is not called at all (the concept of a Comparison Card is unnecessary in the first place) |
| Related Screens | S2 (Cashback Preview Result Page) — Web PC · Web MO · App (webview) |
| Related API | POST /api/promo/cashback-preview/compare (provisional, comparison based on preview input conditions) |

### F-004. WOOX Pro × Bithumb Travel Rule Integration Banner (5 Locations)

| Item | Content |
|---|---|
| Description | During the promotion active period, display a static Travel Rule Integration Banner at 5 locations |
| Input | Screen entry event (each of the 5 screens) — no separate user input, and no separate handling on click either (static) |
| Processing | 1) On screen entry, query promotion active status (F-005) 2) If active, render the banner component — logos (`[Bithumb logo]``[WOOX Pro logo]`, hardcoded design images) + copy (i18n text, matching the current locale, e.g., KO "트레블룰 연동" / EN "Travel Rule Integration") 3) For pre-login screens (#3·#4), apply the same logic regardless of user session |
| Output | Static banner in an understated/minimal badge style (2 logos + copy, click disabled) |
| Exception Handling | When the promotion is inactive (F-005), banner rendering is omitted at all 5 locations. In the App environment, render only on S1·S2 (outside the bottom of the withdrawal card, bottom of Cashback Preview) and exclude S3~S5 (login page, pre-login menu, My Page) from rendering targets since they are native areas |
| Related Screens | S1 (outside bottom of withdrawal result card), S2 (bottom of Cashback Preview result) — Web PC · Web MO · App (webview) / S3 (top of PC login page), S4 (MO pre-login menu), S5 (bottom of My Page member ID) — Web (PC/MO) only |
| Related API | GET /api/promo/status (same endpoint as F-005, uses active status only) |

### F-005. Promotion Active Status Reflection (Screen Branching)

| Item | Content |
|---|---|
| Description | Query the promotion active/ended status commonly referenced by F-001~F-004, and if inactive, render all screens with base logic |
| Input | Screen entry event — no separate user input |
| Processing | 1) On each screen entry (or once at the common layout level), query the promotion active status API 2) If `active` = false, immediately branch as follows: F-001·F-002 use base event logic, F-003 does not display the Comparison Card, F-004 does not display the banner |
| Output | None (no directly rendered elements; this is a common status value that determines whether F-001~F-004 render) |
| Exception Handling | On API failure, default to the safe fallback value of **inactive** (promotion nudges not displayed, existing logic retained) — to ensure the existing service experience is not harmed even during an outage |
| Related Screens | All of S1~S5 (common layer) |
| Related API | GET /api/promo/status (provisional) |
