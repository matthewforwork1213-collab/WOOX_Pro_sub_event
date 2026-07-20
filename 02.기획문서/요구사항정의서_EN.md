# Requirements Specification

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date | 2026-07-03 |
| Version | v1.0 |
| Reference Documents | PRD_EN.md, 01.관리문서/착수보고서.md (Korean only), 02.기획문서/서비스기획서.md (Korean only), 02.기획문서/화면변경목록_EN.md |

---

## 1. Functional Requirements

### 1.1 Feature 1 — Post-Withdrawal WOOX Pro Promotion Branch Display

| ID | Category | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|---|
| REQ-001 | Feature 1 | When a withdrawal not involving WOOX Pro is completed, display Virtual Feedback ("With WOOX Pro, +X USDT") in place of the existing event ad | Must | When the case is not an Adverse Case AND the saving amount is > 0 AND the calculation conditions are met, Virtual Feedback is displayed in the ad area (display correction for amounts under 1 USDT is covered by REQ-003) |
| REQ-002 | Feature 1 | The Virtual Feedback amount is calculated by reverse-calculating the user's Actual Payback Amount (UID Table, once-daily KST 20:00 batch) | Must | The result of `Base Fee = Actual Payback ÷ Payback Rate` matches the verification example in PRD §2-A-1 |
| REQ-003 | Feature 1 | If the saving amount is less than 1 USDT, display the minimum display value of 1 USDT; if it is 0 or below, fall back to the base logic (existing event) | Must | When a saving amount of 0.3 USDT is entered, "1 USDT" is displayed; when the saving amount is 0 or below, Virtual Feedback is not displayed |
| REQ-004 | Feature 1 | When withdrawing from multiple exchanges (UIDs) simultaneously, calculate the additional gain for each exchange separately, sum only the values that are not an Adverse Case and are positive, and display them as a single total amount | Must | Even with 5 or more UIDs, no individual listing is shown — only a single total amount plus an "based on N exchanges" caption is displayed |
| REQ-005 | Feature 1 | For withdrawals that include WOOX Pro, display in priority order: (1) TetherMax-type event, (2) WOOX Pro "with-type" event; if neither exists, (3) fall back to the existing base event logic. If a tier has 2+ candidates, pick 1 at random (the "WOOX Pro's own event" and "house ad" concepts are removed) | Must | If a TetherMax-type event is active in the Admin it shows first; if none but a WOOX Pro "with-type" event is active it shows next; if neither, the existing base logic shows |
| REQ-006 | Feature 1 | If another exchange's Total Saving Rate is equal to or higher than WOOX Pro's (Adverse Case), Virtual Feedback is not displayed | Must | When an Adverse Case input occurs, the system falls back to the base event logic instead of Virtual Feedback |
| REQ-007 | Feature 1 | Clicking the Virtual Feedback CTA navigates to the WOOX Pro exchange detail page (URL is the value registered during Admin onboarding) | Must | Clicking the CTA correctly navigates to the WOOX Pro detail URL registered in the Admin |

### 1.2 Feature 2 — Inline WOOX Pro Comparison Card in Cashback Preview Results

| ID | Category | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|---|
| REQ-008 | Feature 2 | When entering the results page after selecting another exchange, insert the WOOX Pro Comparison Card inline below the existing result card, without a popup or Dim overlay | Must | When the results page loads, the Comparison Card renders directly below the result card with no Dim overlay or modal |
| REQ-009 | Feature 2 | The estimated figures on the Comparison Card are calculated using the existing cashback engine's Monthly Estimated Cashback formula (balance · leverage · TIME · Maker/Taker weighted fee rate · Payback Rate · Correction Factor of 0.7) | Must | Values calculated for WOOX Pro and the current exchange with the same input values match the formula in PRD §2-A-1 |
| REQ-010 | Feature 2 | If the user has already selected WOOX Pro, the Comparison Card is not inserted | Must | When the exchange = WOOX Pro is selected, only the existing results screen is shown, without the Comparison Card |
| REQ-011 | Feature 2 | If another exchange's Total Saving Rate (reflecting the Correction Factor) is equal to or higher than WOOX Pro's, or if WOOX Pro does not support the relevant conditions (leverage, product), the Comparison Card is not inserted | Must | For an Adverse Case or unsupported-condition input, the Comparison Card is not displayed |
| REQ-012 | Feature 2 | The Comparison Card provides a collapse function, and no forced-close (X) UI is provided | Must | Clicking the card's collapse button collapses the card, and no separate close button exists |
| REQ-013 | Feature 2 | The bottom of the Comparison Card states, in lowercase, that it is based on the "standard user / base tier" basis | Must | This wording is always displayed at the bottom of the card |
| REQ-014 | Feature 2 | Clicking the Comparison Card CTA navigates to the WOOX Pro exchange detail page | Must | Correct navigation is confirmed upon clicking the CTA |
| REQ-015 | Feature 2 | (Optional) A "View Details" option may be provided that allows expanding the per-UID saving breakdown from the multi-UID combined total amount | Could | Clicking "View Details" expands the list of per-UID saving amounts (even if not implemented, the REQ-004 total amount display is still maintained) |

### 1.3 Feature 3 — WOOX Pro × Bithumb Travel Rule Integration Banner

| ID | Category | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|---|
| REQ-016 | Feature 3 | While the backoffice banner flags are ON, display the Travel Rule Integration Banner in 5 locations (bottom of the Cashback Preview results, outside the bottom of the withdrawal result card, below the pre-login button on MO, top of the PC login page, below the member ID on My Page after login) | Must | The banner is correctly displayed in all 5 locations (only S1 and S2 apply to the App) |
| REQ-017 | Feature 3 | The banner is composed, in this order, of `[Bithumb logo]` ⇄ `[WOOX Pro logo]` (hardcoded in the design, with a left-right arrow ⇄ between the logos) + copy (KO "트레블룰 연동" / EN "Travel Rule Integration"), and this order is maintained across all languages | Must | Even when the language is switched, the logo-⇄-logo-copy order is maintained and only the copy is translated |
| REQ-018 | Feature 3 | The banner **navigates to the WOOX Pro exchange detail page when clicked**. The CTA destination URL is the admin onboarding-registered value (OI-06). (Feature 3 revised 2026-07-07 — changed from the previous "static, no click navigation." ⚠️ The OI-09 legal risk acceptance was premised on a static informational banner and must be re-confirmed) | Must | Clicking (tapping) the banner navigates to the WOOX Pro exchange detail page |
| REQ-019 | Feature 3 | Display of the banner on pre-login screens (#3, #4) is determined solely by the backoffice `loginBanners` flag, regardless of the user's session | Must | The banner is displayed even in a logged-out state as long as `loginBanners` is ON |

### 1.4 Common Requirements (Promotion Active/Termination, Data, and Display Rules)

| ID | Category | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|---|
| REQ-020 | Common | Each display area's visibility is determined by **backoffice on/off**: (a) Withdrawal-complete WOOX Pro Virtual Feedback, (b) Withdrawal-complete Travel Rule banner (#2), (c) Cashback Preview WOOX Pro comparison, (d) Cashback Preview Travel Rule banner (#1), (e) login 3-page Travel Rule banner (#3·#4·#5, collectively). **(Policy change 2026-07-07: the previous "D+30 AND both WOOX events not ended" gate is abolished. period is also admin-controlled = C-level decision, OI-07 updated)** | Must | Toggling each item in the backoffice immediately shows/hides that area |
| REQ-021 | Common | Each area is shown/hidden **independently** per its on/off; when hidden, only that area falls back to base (**partial control allowed** — changed from the previous "collective rollback / no partial termination") | Must | Turning OFF a specific area leaves the others unaffected |
| REQ-022 | Common | Visibility control is performed via the **new backoffice page's on/off** (the previous dependency on the 2 WOOX Pro event end buttons is abolished) | Must | Backoffice on/off changes are reflected in the user-facing display |
| REQ-023 | Common | The user-facing screen displays only the result values (saving amount in USDT, %p); internal figures such as the Discount Rate, Payback Rate, Correction Factor, Commission Rate, and Margin Rate are never displayed | Must | No internal raw-data figures are included anywhere in the response payload or the screen |
| REQ-024 | Common | The saving amount is displayed solely in USDT and supports all languages; the rate of change is displayed in %p (percentage point) units rather than % (percent). %p is defined as Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange) (without reflecting the Correction Factor), and applies commonly to Features 1 and 2 (confirmed 2026-07-03, PRD §2-A-1) | Must | The currency notation is unified as USDT across all supported languages, and %p is calculated from the same Nominal Total Saving Rate difference everywhere in Features 1 and 2 |
| REQ-025 | Common | The display method for the Virtual Feedback / Comparison Card is shown on a **Total Saving basis** (OI-08 confirmed, 2026-07-03 — the Payback Rate basis has been discarded) | Must | All Virtual Feedback / Comparison Card copy is displayed in the Total Saving basis framing, in the form "You could have saved an additional OOO USDT" |

---

## 2. Non-Functional Requirements

| ID | Category | Requirement | Threshold |
|---|---|---|---|
| NFR-001 | Performance | The response speed of the Virtual Feedback / Comparison Card calculation API must not cause perceptible delay to the user | Average calculation API response within 500ms (PM-proposed value, subject to adjustment upon confirmation) |
| NFR-002 | Security | Internal settlement figures (Discount Rate, Payback Rate, Correction Factor, Commission Rate, Margin Rate) must not be exposed anywhere in the API response or the client bundle | The API response payload includes only result values (amount, %p), with no raw-data fields |
| NFR-003 | Accessibility / Internationalization | All user-facing copy in Features 1, 2, and 3 must be provided in translation for every language supported by the TetherMax platform | 100% coverage of supported languages (fallback language displayed if missing) |
| NFR-004 | Availability | Backoffice on/off changes must be applied near-real-time | Reflected immediately (within a few minutes) for new requests after the change (no long-term caching) |
| NFR-005 | Data Consistency | Feature 1's UID payback data is updated via a once-daily batch (KST 20:00), and the time gap between the withdrawal point and the batch point must be handled in a way that does not mislead the user | The reverse-calculation formula operates without error even when calculating with data from a period not yet reflected by the batch (falls back to base per the REQ-006 criteria in case of negative values or non-calculable cases) |
| NFR-006 | Platform Compatibility | Features 1 and 2 must operate with identical logic on PC, MO, and App (webview); S3–S5 of Feature 3 apply only to Web (PC/MO) | The platform matrix in 화면변경목록_EN.md matches the actual implementation |
| NFR-007 | Internationalization (Time Display) | The times used for batch and promotion determination (KST 20:00, D+30, etc.) are on a server-internal basis, and when related notice copy is displayed on screen, it must be **converted and displayed in the user's device's local time (device time zone)** | No fixed-KST copy is displayed; devices in different time zones each render their own local time (confirmed 2026-07-03) |

---

## 3. Priority Matrix (MoSCoW)

| Priority | Requirement IDs | Share |
|---|---|---|
| Must | REQ-001~REQ-014, REQ-016~REQ-025, NFR-001~NFR-007 | approx. 92% |
| Should | (Not applicable — the collapse function has been confirmed and folded into Must) | 0% |
| Could | REQ-015 (multi-UID "View Details") | approx. 4% |
| Won't (excluded, out of scope for this project) | Fixing the cashback engine's double-multiplication bug (OI-10, separate track), building the audit-log store (OI-B2), creating new permission roles (OI-B1) | approx. 4% |

---

## 4. User Stories

| ID | As a [User] | I want [Feature] | So that [Value] |
|---|---|---|---|
| US-001 | A user who does not use WOOX Pro | I want to see, right after completing a withdrawal, how much more in fees I could have saved if I had used WOOX Pro | I can feel the loss in real monetary terms and consider switching to WOOX Pro |
| US-002 | A user who entered another exchange's conditions via the Cashback Preview | I want to compare the difference with WOOX Pro directly on the results screen | I can decide whether to switch on the spot, without a separate calculation |
| US-003 | A user who is already using WOOX Pro | I don't want to see unnecessary comparison nudges or pop-ups | I can use the service without being interrupted, since I've already made the optimal choice |
| US-004 | A new or existing user of the TetherMax platform | I want to know that WOOX Pro is integrated with Bithumb via the Travel Rule | I can verify regulatory compliance for fund transfers and trust the service |
| US-005 | A project PM / operations manager | I want to immediately terminate all 3 promotion features at once if a problem occurs | I can quickly roll back using only the existing event termination button, with no new development |
| US-006 | A C-level decision maker | (decision complete) I want to finalize the display method | Finalized on a **Total Saving basis** after demo comparison (OI-08, 2026-07-03). The Payback Rate basis is discarded |

---

- [x] Requirements Specification writing complete
- [x] All requirements based on PRD §2, §2-A, §3, §6 fully reflected
- [x] MoSCoW priorities and user stories derived and complete
- [ ] Pending user approval
