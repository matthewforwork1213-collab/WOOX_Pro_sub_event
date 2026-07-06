# Functional Specification (FE)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Commemoration 30-Day Focused Promotion |
| Date Written | 2026-07-03 |
| Revision Date | 2026-07-06 |
| Version | v1.1 |
| Reference Documents | 02.기획문서/요구사항정의서_EN.md, PRD_EN.md, 02.기획문서/API스펙_EN.md, 02.기획문서/화면변경목록_EN.md, 02.기획문서/기능명세서_BE_EN.md |

> This document is the functional specification from the frontend (screen/UI) perspective. For calculation logic and data processing, refer to `기능명세서_BE_EN.md`.
> **This document internalizes all state branching, rendering rules, copy templates, and exceptions so that an FE developer can implement using only this document + the API Spec (#7).** Related policies are directly reflected so that no other document needs to be opened (REQ numbers are noted alongside for source traceability).

---

## 0. Document Usage Guide (FE/BE Distinction Definition)

- **FE/BE is a "development area" distinction** (frontend code / backend code). It is not a user-front vs. back-office distinction.
- All 5 features (F-001~F-005) are **entirely user-front features**, and the same feature is specified separately by the screen owner (FE) and the calculation owner (BE). A single feature appears in both documents.
- **No new back-office (admin) screens.** Only reading existing values and reusing existing buttons is done (details in `기능명세서_BE_EN.md` §5).

---

## 1. Common Rendering Policy (Common to F-001~F-005)

Each feature detail (§2) references this section rather than repeating it.

### 1.1 Promotion Gate Consumption and Fallback

- All promotion UI is **dependent on the F-005 state (`active`)**. It is queried once at the common layout level, or queried upon entering each screen.
- Fallback when `active=false` or on API failure/timeout:

| Feature | Fallback Behavior |
|---|---|
| F-001 (Virtual Feedback) | Card not shown → **revert to the original base event logic (show 1 randomly selected ongoing exchange event)** |
| F-002 (Event Branching) | **Revert to the original base event logic (show 1 randomly selected ongoing exchange event)** (no `eventType` branching when the promotion has ended) |
| F-003 (Comparison Card) | Card not inserted → existing result screen only |
| F-004 (Banner) | 5-location banners not shown |

- **Safe default**: On status API failure, treated as `active=false` (inactive) — the existing service experience is not harmed even during an outage.

> **Note — distinguish the two fallbacks.** The table above is the **revert to original base** when the promotion is **inactive (`active=false`: terminated/expired)**. In contrast, when the promotion is **active** but an individual request is ineligible (`visible=false`: adverse case/calculation impossible), F-001 takes the 3-tier fallback of **Onboarding Event → house ad** (§2 F-001 processing step 2, PRD §2-A-2). The Onboarding Event and house ad are **content available while the promotion is active**, so they are not shown once the promotion has ended.

### 1.2 Platform Scope Matrix

| Screen | Location | Web PC | Web MO | App (webview) |
|---|---|---|---|---|
| S1 | Withdrawal Completion Screen (F-001/F-002 + Banner #2) | O | O | O |
| S2 | Cashback Preview Result (F-003 + Banner #1) | O | O | O |
| S3 | Top of PC Login Page (Banner #4) | O | - | X (Native) |
| S4 | MO Pre-Login Menu (Banner #3) | - | O | X (Native) |
| S5 | Below Member ID on My Page (Banner #5) | O | O | X (Native) |

- **App webview targets are S1·S2 only.** S3~S5 are native areas in the app, so they are excluded from this scope and applied only on Web (PC/MO) (NFR-006).

### 1.3 Time Display (Local Time Conversion)

- Timestamps in the API response are UTC. When displaying a time on screen (e.g., batch time-lag notice text, NFR-005), it **must be converted to the user's device local timezone** for rendering. **Displaying a fixed KST text is prohibited** (NFR-007).

### 1.4 Display Rules (Amount·%p·Internal Figures)

- Amounts are **denoted in USDT alone**, with full multilingual support (REQ-024).
- Changes are denoted in **%p (percentage point), not %**.
- The savings amount is already corrected by the server for values below 1 USDT (to 1) before being sent down, so the FE displays the received value as-is (gating is handled by the server via `visible`, `기능명세서_BE_EN.md` §1.5).
- **Internal figures (discount rate·payback rate·correction factor·commission rate·margin rate) are never displayed on screen.** They are not included in the response either (REQ-023).
- The lowercase caption **"standard user / base tier basis"** is always displayed at the bottom of every comparison card and feedback (REQ-013).

### 1.5 Internationalization (i18n)

- The server sends down only **i18n keys**, not translated text. The actual text is rendered per locale from the FE multilingual resources (amount·%p result values use server numbers).
- Unsupported languages are displayed in the fallback language (NFR-003).

### 1.6 CTA

- The Primary CTA applies the **TetherMax brand color** (CLAUDE.md rule 5).
- The CTA destination is the **WOOX Pro exchange detail page**, and the URL uses the **admin onboarding registration value** (OI-06, REQ-014).

---

## 2. Feature Details

### F-001. Post-Withdrawal Virtual Feedback Card (WOOX Pro Not Included)

| Item | Content |
|---|---|
| Description | On the Withdrawal Completion Screen (S1), for withdrawals not including WOOX Pro, the existing ad area is replaced with a Virtual Feedback Card |
| Input | Screen entry event (withdrawal completion), list of withdrawal UIDs (multiple possible) — no separate user input |
| Processing | 1) On entry, request virtual feedback data from BE with the UID list 2) If `visible=true`, render the card; if `false`, fall back to base event logic (Onboarding Event priority when active, otherwise general house ad — 화면변경목록 A-2·A-3, PRD §2-A-3) 3) Render with the **Total Saving basis copy template** (OI-08 confirmed) 4) The "standard user / base tier basis" caption is **always** shown (REQ-004·013). If `exchangeCount`≥2, render the aggregated total and add "based on N exchanges" to the caption (no individual UID listing); if `exchangeCount`=1, show the single amount + base caption |
| Copy Template | Headline: "If you had used WOOX Pro for this withdrawal, you could have saved an additional **+{savingAmount} USDT ({savingPercentPoint}%p)** in fees" · Sub: "Fee differences add up to a larger amount than you'd think" · CTA link: "View WOOX Pro Fee Comparison >" |
| Output (UI) | Virtual Feedback Card (headline, savings amount USDT, %p, sub copy, CTA button, "standard user / base tier basis" caption) |
| Exception Handling | `visible=false` (counter-effect·calculation impossible·0 or below) → card not shown, replaced with base logic. API failure/timeout → base event logic fallback (Virtual Feedback not shown). When displaying a time such as a batch time-lag notice, convert UTC→local (§1.3) |
| Related Screens | S1 — PC·MO·App (webview) |
| Related API | GET /api/promo/withdrawal-feedback (API-002, Case A) |
| Requirements | REQ-001~004, 006, 007 |

### F-002. Post-Withdrawal WOOX Pro Event Branching (WOOX Pro Included)

| Item | Content |
|---|---|
| Description | Withdrawals including WOOX Pro are branched and shown in the order of (1) WOOX Pro's own event (2) TetherMax Onboarding Event (3) general house ad |
| Input | Screen entry event, list of withdrawal UIDs |
| Processing | Render the corresponding ad component per the `eventType` (`woox_event`/`onboarding_event`/`house_ad`) in the BE response |
| Output (UI) | Ad card per event type (WOOX Pro's own event banner / Onboarding Event banner / general house ad). Event detail content reuses existing event data |
| Exception Handling | On API failure, fall back to the existing base logic ("randomly show 1 ongoing exchange event") |
| Related Screens | S1 — PC·MO·App (webview) |
| Related API | GET /api/promo/withdrawal-feedback (API-002, Case B — same endpoint, branched by `case`) |
| Requirements | REQ-005 |

### F-003. Cashback Preview WOOX Pro Comparison Card (Inline)

| Item | Content |
|---|---|
| Description | On the Cashback Preview Result Page (S2), when another exchange is selected, a WOOX Pro Comparison Card is inserted **inline directly below the existing result card, with no popup or dim** |
| Input | Preview input values (exchange·asset scale·leverage·Maker/Taker ratio·trade frequency), comparison card collapse toggle click |
| Processing | 1) Pass the preview input values as-is to BE to request the comparison result 2) If `visible=true`, render the comparison card below the result card (expanded by default) 3) On collapse button click, toggle expand/collapse using local state only (no re-request) 4) Render with the **Total Saving basis copy template** (OI-08 confirmed) |
| Copy Template | Headline: "You're losing out with the exchange you selected right now" · Sub: "With WOOX Pro, estimated monthly savings: **+{savingAmount} USDT ({savingPercentPoint}%p)**" · Primary CTA: "Start with WOOX Pro" |
| Output (UI) | Comparison Card (headline, savings amount USDT, %p, "standard user / base tier basis" caption, CTA button, collapse toggle) |
| Collapse Policy | Collapse **provided** (OI-05 confirmed). **No forced close (X) UI** (REQ-012). Both collapsed/expanded states supported |
| Exception Handling | `visible=false` (counter-effect·WOOX Pro unsupported condition) → comparison card not rendered, existing result screen only. When exchange=WOOX Pro is selected, **the API itself is not called** (comparison card concept unnecessary, REQ-010) |
| Related Screens | S2 — PC·MO·App (webview) |
| Related API | POST /api/promo/cashback-preview/compare (API-003) |
| Requirements | REQ-008~015 |

### F-004. WOOX Pro × Bithumb Travel Rule Integration Banner (5 Locations)

| Item | Content |
|---|---|
| Description | During the promotion active period, a static Travel Rule Integration Banner is shown in 5 locations |
| Input | Screen entry event (each of the 5 screens) — no user input, and no behavior on click either (static) |
| Processing | 1) On entry, query the promotion active state (F-005) 2) If active, render the banner component — logo (`[Bithumb logo]` `[WOOX Pro logo]`, design-hardcoded image) + text (i18n text, per locale: KO "트레블룰 연동" / EN "Travel Rule Integration") 3) Pre-login screens (#3·#4) also use identical logic regardless of session (REQ-019) |
| Banner Composition Rule | Order fixed as **logo (front) → text (back)** (common across all languages, REQ-017). Logo is a hardcoded image (not admin-loaded), text is multilingual text (image prohibited). **Restrained badge** style. **No click navigation** (static, REQ-018) |
| 5 Locations | #1 Below Cashback Preview Result (S2) · #2 Outside below Withdrawal Result Card (S1) · #3 Below MO pre-login button (S4) · #4 Top of PC Login Page (S3) · #5 Below Member ID on My Page (S5) |
| Exception Handling | When promotion is inactive, all 5 locations are not shown. In the App environment, only S1·S2 are rendered; S3~S5 are native and thus excluded from rendering targets (§1.2) |
| Related Screens | S1·S2 — PC·MO·App / S3·S4·S5 — Web (PC/MO) only |
| Related API | GET /api/promo/status (API-001, uses `active` + `travelRuleBanner.i18nKey`) |
| Requirements | REQ-016~019 |

### F-005. Promotion Active State Reflection (Screen Branching)

| Item | Content |
|---|---|
| Description | Queries the promotion active/ended state that F-001~F-004 commonly reference, and if inactive, renders all screens with base logic |
| Input | Screen entry event — no user input |
| Processing | 1) On entry to each screen (or once at the common layout), query the status API 2) If `active=false`, immediately branch per the §1.1 fallback table |
| Output (UI) | None (not a directly rendered element) — a common state value that determines whether F-001~F-004 render |
| Exception Handling | On API failure, safe default is **inactive** (nudge not shown, existing logic maintained) |
| Related Screens | All of S1~S5 (common layer) |
| Related API | GET /api/promo/status (API-001) |
| Requirements | REQ-020~022 |

---

## 3. Per-Screen State Branching Matrix

| Screen | Condition | Render Result |
|---|---|---|
| S1 | WOOX Pro not included & `visible=true` | Virtual Feedback Card (F-001) + Banner #2 |
| S1 | WOOX Pro not included & `visible=false` | Onboarding Event → house ad fallback + Banner #2 |
| S1 | WOOX Pro included | Event per `eventType` (F-002) + Banner #2 |
| S2 | Other exchange & `visible=true` | Result card + inline Comparison Card (F-003, expanded) + Banner #1 |
| S2 | Other exchange & `visible=false` (counter-effect·unsupported) | Result card only + Banner #1 |
| S2 | WOOX Pro selected | Result card only (API not called) + Banner #1 |
| S3~S5 | Promotion active | Location-specific banner only (#4/#3/#5) |
| All | Promotion inactive | No nudges·banners shown at all (base) |

---

## 4. Exception·Fallback Matrix (FE)

| Situation | FE Behavior |
|---|---|
| Status API (F-005) failure | Treated as `active=false`, nudges·banners not shown |
| F-001 `visible=false` | Card not shown → Onboarding Event → house ad fallback |
| F-001/F-002 API failure·500 | Existing base event logic fallback |
| F-001 400 (`uids` format error) | base event logic fallback (rare — `uids` is a system-provided value) |
| F-003 `visible=false` | Comparison card not inserted, result screen only |
| F-003 exchange=WOOX Pro | API not called, no comparison card |
| F-003 400/404 | After input validation, comparison card not inserted (result screen maintained) |
| Time display needed | UTC→device local time conversion (fixed KST prohibited) |
| App environment S3~S5 | Excluded from rendering (native) |

---

## 5. Requirements Traceability (FE Portion)

| REQ/NFR | Reflected Location |
|---|---|
| REQ-001~004, 006, 007 | F-001 |
| REQ-005 | F-002 |
| REQ-008~014 | F-003 (collapse=REQ-012, caption=REQ-013, CTA=REQ-014) |
| REQ-015 (multi-UID detail view, Could·may be unimplemented) | Feature 1 (multi-UID) optional display. Expand option for per-UID breakdown from F-001's aggregated total (REQ-004 total retained even if unimplemented) |
| REQ-016~019 | F-004 |
| REQ-020~022 | F-005, §1.1 |
| REQ-023 (internal figures not shown) | §1.4 |
| REQ-024 (USDT·%p denotation) | §1.4 |
| REQ-025 (Total Saving framing) | F-001·F-003 copy templates |
| NFR-003 (multilingual) | §1.5 |
| NFR-006 (platform) | §1.2 |
| NFR-007 (time display) | §1.3 |
| OI-06 (CTA URL) | §1.6 |
