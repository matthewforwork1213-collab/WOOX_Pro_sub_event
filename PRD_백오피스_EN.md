# PRD (Backoffice) — WOOX Pro Promotion Visibility Control

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Document Type | **Backoffice (Admin) PRD** — separate from the user-front PRD (`PRD_EN.md`) |
| Date | 2026-07-07 |
| Version | v1.0 |
| Reference Documents | PRD_EN.md, 02.기획문서/기능명세서_백오피스.md (Korean only), 02.기획문서/API스펙_EN.md (Backoffice API), .progress.md (OI-07) |

> This document defines only the backoffice features by which an **admin (operations/marketing) controls promotion visibility**. User-facing screens, formulas, and copy are covered in `PRD_EN.md` (user front). The two documents are a "user-front vs. backoffice perspective split of the same feature," which is distinct from the frontend/backend (code layer) split.

---

## 1. Overview

| Item | Content |
|---|---|
| Purpose | Let admins **directly control the per-area visibility (on/off)** of the 3 promotion features (Virtual Feedback, Comparison Card, Travel Rule Banner) |
| Background (policy change) | 2026-07-07 **C-level decision**: the previous "D+30 auto-termination + dependency on the 2 WOOX Pro events (OR)" gate is abolished, and the **promotion period and visibility are controlled from the backoffice**. Updates OI-07 ("launch + 30 days only, not made permanent") |
| Target users | TetherMax operations/marketing admins (reuse of the existing admin permission system) |
| New development scope | **One visibility-control page + admin read/save API** (other values — discount rate, payback rate, event registration, etc. — reuse the existing admin, not new) |
| Menu location | A new **'WOOX pro sub'** item is added at the **bottom of the existing admin GNB 'Event' menu**. No new top-level menu is created; it is placed **below the existing Event sub-items** (Event Reward Payment ~ Bitget Campaign - Volume) |

---

## 2. Feature — Per-Area Visibility On/Off (5 items)

The admin toggles the 5 items below independently (partial control allowed). Saving takes effect on new user-facing requests immediately.

| # | Backoffice item | Controlled target (user front) | Storage key | When OFF (user screen) |
|---|---|---|---|---|
| 1 | Withdrawal-complete · WOOX Pro Virtual Feedback | Feature 1 (S1) | `s1Feedback` | Virtual Feedback not shown → existing ad logic |
| 2 | Withdrawal-complete · Bithumb Travel Rule banner | Feature 3 banner #2 (S1) | `s1Banner` | Banner not shown |
| 3 | Cashback Preview · WOOX Pro comparison | Feature 2 (S2) | `s2Compare` | Comparison card not inserted (result screen only) |
| 4 | Cashback Preview · Bithumb Travel Rule banner | Feature 3 banner #1 (S2) | `s2Banner` | Banner not shown |
| 5 | Login 3-page · Bithumb Travel Rule banner (collective) | Feature 3 banners #3·#4·#5 | `loginBanners` | PC login · MO pre-login · My Page — three positions hidden collectively |

- **Independent control**: a single area can be turned OFF. The previous "collective rollback of 3 features / no partial termination" is abolished.
- **Period control**: without any automated termination schedule, the admin controls start/end via on/off (no D+30 auto-termination).
- **Event branching for WOOX Pro-included withdrawals (F-002)** is not one of these 5 toggles (it operates at all times).

---

## 3. Permissions · Audit · Data

| Item | Content |
|---|---|
| Access permission | Reuse of the existing admin permission system. Only holders of promotion operation permission can view/change (⚠️ OI-B1: detailed role scope to be finalized) |
| Audit log | On each toggle change, record **who · when · previous value · new value** (⚠️ OI-B2: audit store · retention period to be finalized) |
| Stored data | 5 boolean flags. Persisted server-side (the prototype simulates via localStorage). Default = all ON |
| Reflection timing | Immediately (within a few minutes) for new requests after save. No long-term caching of the gate query result (NFR-004) |
| On failure | If the settings query fails, the user front safely falls back to **all OFF** (nudges/banners not shown) |

---

## 4. Relationship with the User Front

- The user front reads the 5 flags via `GET /api/promo/status` (API-001) to decide each area's rendering (기능명세서_FE/BE F-005).
- The backoffice reads/saves the 5 flags via `GET/PUT /api/admin/promo/visibility` (API Spec Backoffice API).
- In other words, **the backoffice writes, and the user front reads.** They share the same 5 flags.

---

## 5. Out of Scope

- Existing admin values such as discount rate, payback rate, exchange onboarding, event registration/termination (not new development, read only)
- Management of the Travel Rule banner click destination URL (OI-06, uses the existing onboarding-registered value)
- Admin "TetherMax Applied" field double-multiplication bug (OI-10, separate engineering track)

---

## 6. Backoffice Open Items

| OI | Item | Owner | Status |
|---|---|---|---|
| OI-B1 | Visibility-control permission role scope (who can change) | Ops/Security | Pending |
| OI-B2 | Change audit log store · retention period | Dev/Ops | Pending |
| OI-09 | The Travel Rule banner changed to a click CTA (navigates to WOOX Pro detail) → the legal risk acceptance, which presumed a static informational banner, must be **re-confirmed** | PM/Legal | Re-confirm |
