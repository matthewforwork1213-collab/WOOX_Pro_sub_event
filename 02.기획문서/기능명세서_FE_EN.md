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

### 1.1 Visibility Control — Per-Area Backoffice On/Off (2026-07-07 policy)

> **Policy change (2026-07-07)**: The previous "D+30 + 2 WOOX Pro events" common gate is abolished → visibility is controlled via **per-area backoffice on/off**. F-005 provides 5 flags. The promotion period is also admin-controlled (C-level decision, OI-07 updated, 2026-07-07).

- Each area falls back as below when its corresponding backoffice flag is **OFF** (per-area independent).

| Area | Backoffice flag | When OFF |
|---|---|---|
| F-001 Virtual Feedback | `s1Feedback` | Card not shown → **original base event logic (1 random ongoing exchange event)** |
| F-003 Comparison Card | `s2Compare` | Card not inserted → existing result screen only |
| F-004 Banner #2 (S1) | `s1Banner` | That banner not shown |
| F-004 Banner #1 (S2) | `s2Banner` | That banner not shown |
| F-004 Banner #3·#4·#5 | `loginBanners` | Three positions hidden collectively |

> **Note — distinguish two cases.** The above is **backoffice OFF** (visibility control). In contrast, when the flag is ON but an individual request is **ineligible (`visible=false`: adverse/calculation impossible)**, F-001 takes the 3-tier fallback of **Onboarding Event → house ad** (§2 F-001 processing, PRD §2-A-2). F-002 (WOOX-included event branching) operates regardless of any visibility flag.

- **Safe default**: On settings-query failure, treat all as **OFF** — the existing service experience is not harmed even during an outage.

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
- The click destination for CTAs and the Travel Rule banner is the **WOOX Pro exchange detail page**, and the URL uses **`wooxProDetailUrl` from the API-001 response** (admin onboarding-registered value) (OI-06, REQ-014). Feature 1 CTA · Feature 2 CTA · Feature 3 banner all navigate to this value.

---

## 2. Feature Details

### F-001. Post-Withdrawal Virtual Feedback Card (WOOX Pro Not Included)

| Item | Content |
|---|---|
| Description | On the Withdrawal Completion Screen (S1), for withdrawals not including WOOX Pro, the existing ad area is replaced with a Virtual Feedback Card |
| Input | Screen entry event (withdrawal completion), list of withdrawal UIDs (multiple possible) — no separate user input |
| Processing | 1) On entry, request virtual feedback data from BE with the UID list 2) If `visible=true`, render the card; if `false`, fall back to base event logic (Onboarding Event priority when active, otherwise general house ad — 화면변경목록 A-2·A-3, PRD §2-A-3) 3) Render with the **Total Saving basis copy template** (OI-08 confirmed) 4) The "standard user / base tier basis" caption is **always** shown (REQ-004·013). If `exchangeCount`≥2, render the aggregated total and add "based on N exchanges" to the caption (no individual UID listing); if `exchangeCount`=1, show the single amount + base caption. **Even for multiple UIDs, `savingPercentPoint` is provided by the server as a single value (base-fee weighted average), so the FE displays it as-is** (the FE does not compute %p) |
| Copy Template | Headline: "If you had used WOOX Pro for this withdrawal, you could have saved an additional **+{savingAmount} USDT ({savingPercentPoint}%p)** in fees" · Sub: "Fee differences add up to a larger amount than you'd think" · CTA link: "View WOOX Pro Fee Comparison >" |
| Output (UI) | Virtual Feedback Card (headline, savings amount USDT, %p, sub copy, CTA button, "standard user / base tier basis" caption) |
| Exception Handling | `visible=false` (counter-effect·calculation impossible·0 or below) → card not shown, replaced with base logic. API failure/timeout → base event logic fallback (Virtual Feedback not shown). When displaying a time such as a batch time-lag notice, convert UTC→local (§1.3) |
| Related Screens | S1 — PC·MO·App (webview) |
| Related API | GET /api/promo/withdrawal-feedback (API-002, Case A) |
| Requirements | REQ-001~004, 006, 007 |

### F-002. Post-Withdrawal WOOX Pro Event Branching (WOOX Pro Included)

| Item | Content |
|---|---|
| Description | Withdrawals including WOOX Pro branch in the order of (1) TetherMax-type event (2) WOOX Pro "with-type" event; if neither exists, (3) fall back to the existing base event logic (the "own event" and "house ad" concepts are removed, 2026-07-07) |
| Input | Screen entry event, list of withdrawal UIDs |
| Processing | Render per the `eventType` (`tethermax_event`/`woox_with_event`/`base`) in the BE response. If `base`, show no promo card and run the existing base event logic (1 random ongoing exchange event) |
| Output (UI) | Ad card per event type (TetherMax-type event banner / WOOX Pro "with-type" event banner), or `base` = existing event ad. Event detail content reuses existing event data |
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
| Output (UI) | Comparison Card (headline, **current exchange vs WOOX Pro monthly estimated cashback** (`currentExchangeEstimate`·`wooxProEstimate`), savings amount USDT (`savingAmount`), %p (`savingPercentPoint`), "standard user / base tier basis" caption, CTA button, collapse toggle) |
| Collapse Policy | Collapse **provided** (OI-05 confirmed). **No forced close (X) UI** (REQ-012). Both collapsed/expanded states supported |
| Exception Handling | `visible=false` (counter-effect·WOOX Pro unsupported condition) → comparison card not rendered, existing result screen only. When exchange=WOOX Pro is selected, **the API itself is not called** (comparison card concept unnecessary, REQ-010) |
| Related Screens | S2 — PC·MO·App (webview) |
| Related API | POST /api/promo/cashback-preview/compare (API-003) |
| Requirements | REQ-008~015 |

### F-004. WOOX Pro × Bithumb Travel Rule Integration Banner (5 Locations)

| Item | Content |
|---|---|
| Description | A Travel Rule Integration Banner is shown in 5 locations (visibility via backoffice on/off). Navigates to WOOX Pro detail on click |
| Input | Screen entry event (each of the 5 screens) — no user input. On click, navigates to the WOOX Pro exchange detail |
| Processing | 1) On entry, check the per-position backoffice flag (#2=`s1Banner`, #1=`s2Banner`, #3·#4·#5=`loginBanners`) 2) If ON, render the banner component — logo (`[Bithumb logo]` ⇄ `[WOOX Pro logo]`, design-hardcoded image · left-right arrow ⇄ between the logos) + text (i18n text, per locale: KO "트레블룰 연동" / EN "Travel Rule Integration") 3) Pre-login screens (#3·#4) also use identical logic regardless of session (REQ-019) 4) **On banner click, navigate to the WOOX Pro exchange detail page** (CTA URL = admin onboarding-registered value, OI-06) |
| Banner Composition Rule | Order fixed as **logo (front, ⇄ between) → text (back)** (common across all languages, REQ-017). Logo is a hardcoded image (not admin-loaded), text is multilingual text (image prohibited). **Restrained badge** style. **Navigates to WOOX Pro detail on click** (REQ-018 revised 2026-07-07 — changed from the previous static/no-click. ⚠️ OI-09 legal re-confirmation needed) |
| 5 Locations | #1 Below Cashback Preview Result (S2) · #2 Outside below Withdrawal Result Card (S1) · #3 Below MO pre-login button (S4) · #4 Top of PC Login Page (S3) · #5 Below Member ID on My Page (S5) |
| Exception Handling | If a position's backoffice flag is OFF, that banner is not shown (#3·#4·#5 collectively via `loginBanners`). In the App environment, only S1·S2 are rendered; S3~S5 are native and thus excluded (§1.2) |
| Related Screens | S1·S2 — PC·MO·App / S3·S4·S5 — Web (PC/MO) only |
| Related API | GET /api/promo/status (API-001) — uses the per-position banner flags (`s1Banner`/`s2Banner`/`loginBanners`) + `travelRuleBanner.i18nKey` + `wooxProDetailUrl` (click destination) |
| Requirements | REQ-016~019 |

### F-005. Visibility Control State Reflection (Backoffice On/Off)

| Item | Content |
|---|---|
| Description | Queries the 5 per-area backoffice on/off flags (`s1Feedback`·`s1Banner`·`s2Compare`·`s2Banner`·`loginBanners`) and decides each area's rendering (2026-07-07: D+30 · 2-WOOX-event gate abolished) |
| Input | Screen entry event — no user input |
| Processing | 1) On entry (or once at the common layout), query the status API 2) For each area flag that is OFF, fall back per the §1.1 table (only that area to base) |
| Output (UI) | None (not a directly rendered element) — the 5 flags that determine each area's rendering |
| Exception Handling | On API failure, safe default is **all flags OFF** (nudges/banners not shown, existing logic maintained) |
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
| S3~S5 | `loginBanners` ON | Location-specific banner only (#4/#3/#5) |
| Each area | Its backoffice flag OFF | Only that area hidden (base). There is no global inactive state — per-area independent |

---

## 4. Exception·Fallback Matrix (FE)

| Situation | FE Behavior |
|---|---|
| Status API (F-005) failure | Safe default all OFF, nudges·banners not shown |
| F-001 `visible=false` | Card not shown → Onboarding Event → house ad fallback |
| F-001/F-002 API failure·500 | Existing base event logic fallback |
| F-001 400 (`uids` format error) | base event logic fallback (rare — `uids` is a system-provided value) |
| F-003 `visible=false` | Comparison card not inserted, result screen only |
| F-003 exchange=WOOX Pro | API not called, no comparison card |
| F-003 400/404 | After input validation, comparison card not inserted (result screen maintained) |
| F-003 500 · timeout | Comparison card not inserted, existing result screen only (a nudge failure must not block the result screen) |
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
