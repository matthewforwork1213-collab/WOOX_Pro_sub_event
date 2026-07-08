# Functional Specification (Backoffice)

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Document Type | **Backoffice (Admin) only** — separate from the user-front functional specs (`기능명세서_FE_EN.md`·`기능명세서_BE_EN.md`) |
| Date | 2026-07-07 |
| Version | v1.0 |
| Reference Documents | PRD_백오피스_EN.md, 02.기획문서/API스펙_EN.md (Backoffice API), 02.기획문서/기능명세서_BE_EN.md (F-005) |

> The functional spec for the **visibility-control page** where an admin controls promotion visibility via on/off. For user-facing screen rendering and formulas, refer to the user-front functional specs.

---

## Feature List

| F-ID | Feature Name | Reference | Priority | Status |
|---|---|---|---|---|
| A-001 | Query visibility-control settings | PRD_백오피스 §2 | P0 | Design |
| A-002 | Save visibility-control settings (on/off) | PRD_백오피스 §2 | P0 | Design |
| A-003 | Record change audit log | PRD_백오피스 §3 | P1 | Design |

---

## A-001. Query Visibility-Control Settings

| Item | Content |
|---|---|
| Description | On entering the visibility-control page, query the current state of the 5 flags (on/off) and reflect them in the toggle UI |
| Input | Screen entry (authenticated admin session) |
| Processing | 1) Verify admin permission 2) Query the 5 flags via `GET /api/admin/promo/visibility` 3) Show each toggle's current value |
| Output (UI) | 5 toggles (groups: Withdrawal-complete S1 / Cashback Preview S2 / Login 3-page), each with ON·OFF state |
| Exception Handling | On query failure, show an error notice + retry. No permission → block access |
| Related API | GET /api/admin/promo/visibility (API-B01) |

## A-002. Save Visibility-Control Settings (on/off)

| Item | Content |
|---|---|
| Description | When an admin changes an individual toggle, save it to the server so that it is reflected in new user-front requests immediately |
| Input | Toggle change (item key + new value), admin session |
| Processing | 1) Verify admin permission 2) Save the 5 flags including the changed item via `PUT /api/admin/promo/visibility` 3) On success, "Saved" feedback 4) The saved value is reflected as-is by the user front `GET /api/promo/status` (API-001) (no long-term caching, NFR-004) |
| Save target | `s1Feedback`·`s1Banner`·`s2Compare`·`s2Banner`·`loginBanners` (each bool). Default all ON |
| Rules | Each item is **saved independently** (a single area can be turned OFF). Partial control allowed. No D+30 · event-dependency determination |
| Exception Handling | On save failure, roll back the toggle + show an error notice. No permission → block. On concurrent-edit conflict, last save wins (⚠️ related to OI-B2) |
| Related API | PUT /api/admin/promo/visibility (API-B02) |

## A-003. Record Change Audit Log

| Item | Content |
|---|---|
| Description | Record a change history on each flag change |
| Input | Save event (A-002) |
| Processing | On save, record **who · when · item · previous value · new value** to the audit log |
| Output | (Optional) show recent change history at the bottom of the visibility-control page |
| Exception Handling | Decouple so that an audit-write failure does not block the settings save itself (save success takes priority); failures are notified separately |
| Open Item | ⚠️ OI-B2: audit store · retention period · view UI scope to be finalized |

---

## Screen — Visibility-Control Page

| Item | Content |
|---|---|
| Composition | 3 group cards — (1) Withdrawal-complete S1: WOOX Pro Virtual Feedback · Travel Rule banner #2 (2) Cashback Preview S2: WOOX Pro comparison · Travel Rule banner #1 (3) Login 3-page: Travel Rule banner (#3·#4·#5 collectively) |
| Each row | Label + description + position tag (#) + on/off toggle + current state (ON/OFF) |
| Auxiliary | All ON / All OFF, "Open user prototype" link, save feedback |
| Policy notice | State at the top: "2026-07-07 C-level decision: the period is controlled by admin (D+30 abolished)" |
| Prototype | `src/backoffice/index.html` (saves the 5 flags in localStorage `wooxpromo_admin`, shared with the user prototype) |

---

## Requirement/Policy Traceability

| Item | Basis |
|---|---|
| 5-area on/off · independent control | REQ-020·021, PRD §3-3, PRD_백오피스 §2 |
| Controlled via the backoffice page (dependency on existing event termination buttons abolished) | REQ-022 |
| The saved values are read by the user front | 기능명세서_BE/FE F-005, API-001 |
| Real-time reflection · no long-term caching | NFR-004 |
| Period controlled by admin (D+30 abolished) | C-level decision 2026-07-07, OI-07 updated |
| Travel Rule banner click CTA change → legal re-confirmation | OI-09 |
