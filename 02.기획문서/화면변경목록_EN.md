# Screen Change List (Design Draft Scope)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date Written | 2026-07-02 |
| Version | v1.0 |
| Reference Documents | PRD_EN.md (§2, §2-A, §3), 서비스기획서.md (Korean only, no English version) |
| Purpose | Prior to placing the design draft order, organize the scope of screens/platforms/states subject to change |

> This document is not the Screen Design Spec (#9) but a **scope document for the design order**. Logic/policy has been finalized in the PRD, and the layout for each screen size below will be finalized at the draft stage.

---

## 1. Target Platforms

| Platform | Notes |
|---|---|
| Web PC | Desktop browser |
| Web MO | Mobile browser |
| App (iOS/Android) | **Webview** — in principle shares Web MO rendering. **However, the app webview scope covers S1·S2 only.** S3–S5 (login page, pre-login menu, My Page) are **native areas in the app**, so they are excluded from this (web) scope and are changed only on Web (PC/MO) |

---

## 2. Screens Subject to Change (Summary)

| # | Screen | Related Feature | PC (Web) | MO (Web) | App (Webview) | Key Change |
|---|---|---|---|---|---|---|
| S1 | Withdrawal Completion Screen | Feature 1 + Banner #2 | ● | ● | ● | Ad area → Virtual Feedback/event branching by condition + Travel Rule banner outside the bottom of the result card |
| S2 | Cashback Preview Result Page | Feature 2 + Banner #1 | ● | ● | ● | WOOX Pro Inline Comparison Card below the result card + Travel Rule banner at the bottom of the result |
| S3 | Login Page (PC) | Banner #4 | ● | - | ✕ (Native) | Travel Rule banner in the **top area** of the login page |
| S4 | Pre-Login Menu (MO) | Banner #3 | - | ● | ✕ (Native) | Travel Rule banner **directly below** the login/sign-up buttons |
| S5 | My Page (post-login) | Banner #5 | ● | ● | ✕ (Native) | Travel Rule banner **below** the member ID |

- ● = Change required for that platform / - = Not applicable / ✕ = Native area in the app, excluded from this (web) scope
- **The app webview scope covers S1·S2 only.** S3–S5 are app-native and are handled only on Web (PC/MO).
- Travel Rule banner = Feature 3. 5 locations (#1 bottom of preview, #2 outside bottom of withdrawal card, #3 MO pre-login, #4 PC login page, #5 My Page)

---

## 3. Per-Screen Detail

### S1. Withdrawal Completion Screen (Feature 1)

**Change A — Ad Area Content Branching**

| State | Condition | Display |
|---|---|---|
| A-1 | WOOX Pro not included & savings > 0 & calculable (amounts under 1 USDT are displayed as 1 USDT) | Virtual Feedback card ("If it had been WOOX Pro, +X USDT") |
| A-2 | A-1 not possible (adverse case/not calculable) & Onboarding Event active | TetherMax WOOX Pro Onboarding Event |
| A-3 | Neither A-1 nor A-2 possible | Existing house/exchange event (base fallback) |
| B-1 | WOOX Pro included & WOOX Pro's own event active | WOOX Pro Event (highest priority) |
| B-2 | WOOX Pro included & no own event | TetherMax Onboarding Event |
| B-3 | Neither B-1 nor B-2 possible | TetherMax general house ad |

- Virtual Feedback display method: **Finalized on a Total Saving basis** (OI-08, 2026-07-03). Only 1 framing type is needed for the draft: "You could have saved OOO USDT more."
- Simultaneous withdrawal across multiple exchanges (UID): sum only the positive UIDs that are not adverse cases into a **single total amount** + lowercase note "based on N exchanges · standard user/base tier". **Even with many UIDs (5+), do not list them individually — keep a single total amount** (optional: expandable via "View Details" — a design option).
- Adverse case prevention: **Not displayed if the other exchange's Total Saving Rate ≥ WOOX Pro's** (displayed only when WOOX Pro is strictly greater).
- Minimum threshold of 1 USDT (positive values under 1 are shown as 1 USDT; 0/negative values follow base logic).
- CTA: "View WOOX Pro Fee Comparison" → WOOX Pro exchange detail page.
- On promotion termination (common gate: either of the 2 WOOX Pro events terminated OR D+30): reverts to the existing ad logic (Virtual Feedback not displayed).

**Change B — Travel Rule Banner #2**: Inserted **outside the bottom** of the result card area.

### S2. Cashback Preview Result Page (Feature 2)

**Change A — WOOX Pro Inline Comparison Card** (no popup, no dim overlay)

| State | Condition | Display |
|---|---|---|
| Displayed | Other exchange selected & **not an adverse case (WOOX Pro Total Saving > other)** & accurate comparison possible & WOOX Pro not linked | WOOX Pro Comparison Card inserted inline **below** the existing result card |
| Not Displayed | WOOX Pro selected / adverse case (other's Total Saving ≥ WOOX Pro's) / WOOX Pro not supported (leverage/product) | Comparison card not inserted, only the existing result screen shown |

- Comparison card composition: current exchange vs. WOOX Pro comparison (difference in USDT + %p). USDT uses the existing cashback engine's **Monthly Estimated Cashback formula** (balance · leverage · TIME · Maker/Taker weighted fee rate · Payback Rate · Correction Factor of 0.7, PRD §2-A-1), while %p uses the **Nominal Total Saving Rate difference** (Correction Factor not applied, finalized 2026-07-03) — each uses a different formula. Example (simplified): under Zoomex conditions, approximately +567 USDT more saved per month under WOOX Pro compared to the current exchange.
- Display method: **Finalized on a Total Saving basis** (OI-08). Only 1 type is needed for the draft.
- The Correction Factor is a **fixed constant of 0.7** (same across all exchanges, hardcoded). **Prerequisite**: calculation accuracy cannot be guaranteed until the Admin's "TetherMax Applied" field double-multiplication bug (separate track, OI-10) is fixed.
- CTA: "Get Started with WOOX Pro" → WOOX Pro exchange detail page (brand color).
- Basis disclosure: lowercase "standard user/base tier basis" note at the bottom of the card.
- Collapse **provided** (OI-05 finalized) — draft needs both expanded/collapsed states. No forced close (X) button.
- Display frequency: always (when conditions are met). No session limit.
- On promotion termination (common gate): comparison card not inserted.

**Change B — Travel Rule Banner #1**: Inserted at the **bottom** of the result page (below the Inline Comparison Card).

### S3 · S4. Login-Related (Travel Rule Banner, Pre-Login)

| Screen | Platform | Location |
|---|---|---|
| S3 Login Page | PC | **Top area** of the page |
| S4 Pre-Login Menu | MO (Web) | **Directly below** the login/sign-up buttons |

- Since this is pre-login, no user information is needed — displayed based **only on the global promotion active status (common gate)**.

### S5. My Page (Travel Rule Banner #5, post-login)

- **Web PC / Web MO only.** The app's My Page is native and excluded from this scope.
- Banner inserted **below the member ID display area**.

---

## 4. Travel Rule Banner Common Specifications (identical across S1–S5)

| Item | Content |
|---|---|
| Composition | `[Bithumb logo]` `[WOOX Pro logo]` + Travel Rule Integration copy |
| Copy (Text) | KO: **"트레블룰 연동"** / EN: **"Travel Rule Integration"** (other languages follow standard localization) |
| Assets | Both logos = images, **hardcoded in design**. Copy is multilingual text (no images) |
| Order | Logo (front) → Text (back), fixed across all languages |
| Style | Understated badge (not over-emphasized) |
| Click | None (static, no link) |
| Display | Promotion-limited (common termination gate: 2 WOOX Pro events ended OR + D+30). All 5 locations removed upon termination |

---

## 5. Items to Be Finalized in the Draft by Screen Size (Not Documented Here)

| Item | Notes |
|---|---|
| **PC layout** for S1·S2·S5 | Currently shared screenshots are all MO. PC-based screens are needed |
| Banner responsive specs | Width/height/logo size/line breaks (logo+text on 1 line vs. 2 lines) for PC/MO respectively |
| App webview native chrome | Whether the safe area/top bar/bottom inset overlaps with the banner/CTA |
| Inline Comparison Card collapse UI | Collapse provided (OI-05 finalized) → draft needs both expanded/collapsed states |
| Multiple UID "View Details" | Single total amount display is the default. Draft needed if an expandable (details) UI is provided |
| Longest multilingual copy | Layout stability of the banner/card given text length differences across languages |

---

## 6. Reference: Confirmed / Open Items

**Confirmed**: Definitions of the 3 features, Feature 1 reverse-calculation model (Commission Rate not used, Payback data source = user UID table batch once daily at 20:00 KST), **Feature 2 calculation formula = existing cashback engine's Monthly Estimated Cashback (Maker/Taker weighted by fee rate tier, single Payback Rate value, Correction Factor = fixed constant of 0.7)**, Feature 2 inline conversion + **collapse provided**, Feature 3 banner (hardcoded logos · KO/EN copy), minimum threshold of 1 USDT, USDT-only + multilingual + %p, CTA (WOOX Pro exchange detail page), **multiple UIDs = single total summing only positive values (no listing even when numerous)**, **adverse case prevention = based on Total Saving Rate (not displayed if other's ≥ WOOX Pro's)**, **promotion termination = existing 2 WOOX Pro events' termination button OR + D+30, batch rollback of all 3 features (not new development)**, **start date = WOOX Pro exchange onboarding point**, **comparison target = all onboarded, display-enabled (Y) exchanges**, **sign-up URL = value registered in Admin**, **duration = launch + 30 days only (no permanent adoption)**, **display method = finalized on a Total Saving basis (OI-08, Payback Rate basis discarded)**, **%p definition = Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange), Correction Factor not applied, common to Feature 1·2 (2026-07-03)**.

**Open (OI)**: **OI-10 Admin double-multiplication bug fix (separate track, prerequisite before launch)** · OI-01 Deployment environment · Logo image assets (design to secure). (OI-08 has been finalized on a Total Saving basis)
