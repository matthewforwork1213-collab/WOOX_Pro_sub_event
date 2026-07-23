# API Specification

| Item | Content |
|---|---|
| Project Name | WOOX Pro Onboarding Anniversary 30-Day Intensive Promotion |
| Date | 2026-07-03 |
| Version | v1.0 |
| Reference Documents | 02.기획문서/기능명세서_FE_EN.md, 02.기획문서/기능명세서_BE_EN.md, PRD_EN.md |

> Endpoint paths and field names are a draft and may be adjusted during implementation to align with the existing TetherMax API naming conventions.

---

## API Common Conventions

| Item | Content |
|---|---|
| Base URL | Based on the existing TetherMax API server (⚠️ OI-01 to be confirmed once the deployment environment is finalized) |
| Authentication Method | Reuses the existing TetherMax session/token method. However, GET /api/promo/status must also be callable while not logged in (pre-login screens, S3·S4), so authentication is not required for it |
| Response Format | JSON |
| Character Encoding | UTF-8 |
| Multi-language | Responses do not embed translated text directly; they return only i18n keys. The actual copy is rendered per locale from the FE's multi-language resources (result values such as amounts and %p are an exception — the server returns these as numbers) |
| Timezone | All timestamp fields are returned in **UTC (ISO 8601)**. Batch processing (KST 20:00) is based on KST internally on the server, but API responses and on-screen display go through a UTC → **user device local timezone** conversion (applied at FE rendering time). Responses must not use fixed KST copy (NFR-007). (2026-07-07: D+30 auto-determination abolished — period controlled by backoffice) |

### Common Error Codes

| HTTP Status Code | Error Code | Description |
|---|---|---|
| 400 | BAD_REQUEST | Invalid request (missing required parameter, ratio sum error, etc.) |
| 401 | UNAUTHORIZED | Authentication required |
| 404 | NOT_FOUND | Resource not found (e.g., a non-existent exchange ID) |
| 500 | INTERNAL_ERROR | Internal server error |

> Promotion-related APIs do not treat "display condition not met" as an error. Adverse cases, calculation failures, etc. are returned as 200 OK + `visible: false` (see 기능명세서_BE_EN.md F-001 exception handling). F-003 (cashback comparison) is FE-calculated, so its adverse-case/unsupported judgment is performed on the FE (API-003 removed).

---

## API Endpoint List

| API-ID | Method | URL | Function Name | Related Feature ID |
|---|---|---|---|---|
| API-001 | GET | /api/promo/status | Query promotion visibility (5 flags) — user front | F-004, F-005 |
| API-002 | GET | /api/promo/withdrawal-feedback | Query virtual feedback/event branch after withdrawal completion | F-001, F-002 |
| ~~API-003~~ | ~~POST~~ | ~~/api/promo/cashback-preview/compare~~ | **(Removed)** F-003 is FE-calculated — see the API-003 section below | F-003 |
| API-B01 | GET | /api/admin/promo/visibility | **Backoffice** — query visibility-control settings | A-001 |
| API-B02 | PUT | /api/admin/promo/visibility | **Backoffice** — save visibility-control settings (on/off) | A-002 |

> API-B01·B02 are **backoffice (admin) only** and require admin authentication/permission. They target the same 5 flags as API-001 (user front), where the backoffice writes and the user front reads. See `기능명세서_백오피스.md`·`PRD_백오피스_EN.md`.

---

## API Details

### API-001. Query Promotion Active Status

| Item | Content |
|---|---|
| Method | GET |
| URL | /api/promo/status |
| Description | Queries the 5 per-area backoffice visibility on/off flags. F-001·F-003·F-004 consume their own area's flag. Callable regardless of login status (REQ-019). **(2026-07-07 policy: D+30 · 2-WOOX-event gate abolished → per-area on/off)** |

**Request**

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | - | - | No query parameters. If an auth token is present it may be referenced, but it is not required |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "s1Feedback": true,
    "s1Banner": true,
    "s2Compare": true,
    "s2Banner": true,
    "loginBanners": true,
    "travelRuleBanner": {
      "i18nKey": "promo.travelrule.badge"
    },
    "wooxProDetailUrl": "https://.../exchange/woox-pro"
  }
}
```

- `s1Feedback`: Whether the withdrawal-complete WOOX Pro Virtual Feedback (F-001) is shown. If false, F-001 falls back to base logic
- `s1Banner`·`s2Banner`·`loginBanners`: Whether the Travel Rule banner is shown (#2 / #1 / #3·#4·#5 collectively) (F-004)
- `s2Compare`: Whether the Cashback Preview WOOX Pro comparison (F-003) is shown. If false, the comparison card is not inserted (REQ-020~022)
- `travelRuleBanner.i18nKey`: The i18n key for the banner copy (the logo image is hardcoded in the design, so it is not delivered via the API, REQ-017)
- `wooxProDetailUrl`: **The WOOX Pro exchange detail URL to navigate to when a CTA or the Travel Rule banner is clicked** (admin onboarding-registered value, OI-06). Feature 1 CTA · Feature 2 CTA · Feature 3 banner all navigate to this value. Must be retrievable even pre-login (S3·S4)

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 500 | INTERNAL_ERROR | Determination not possible, e.g., settings-query failure — in this case the server prioritizes responding safely with **all 5 flags false** instead of an error (see 기능명세서_BE_EN.md F-005 exception handling) |

---

### API-002. Query Virtual Feedback/Event Branch After Withdrawal Completion

| Item | Content |
|---|---|
| Method | GET |
| URL | /api/promo/withdrawal-feedback |
| Description | Based on the list of paybackNo for the withdrawal (payback-request) records, returns Virtual Feedback (F-001) when WOOX Pro is not included, and the event branch (F-002) when WOOX Pro is included. Distinguished by the `case` field in the response |

**Request**

| Parameter | Type | Required | Description |
|---|---|---|---|
| paybackNos | string (comma-separated, server-issued paybackNo) | Y | List of **paybackNo (payback-request record IDs)** for this withdrawal (payback request). Each paybackNo record is **created at the withdrawal-request-complete moment** and carries the (exchange · UID · requested payback amount · event reward). The server **resolves exchange · UID · payback by looking up the record via paybackNo** → the client does not assemble `exchange:uid`. WOOX-included and zero-payback withdrawals also have a record, so F-002 is identifiable too. When withdrawing from multiple exchanges simultaneously, separate with commas (e.g., `100234,100235`) |

**Response (200 OK) — Case A: WOOX Pro Not Included (F-001)**

```json
{
  "status": "success",
  "data": {
    "case": "non_woox_pro",
    "visible": true,
    "savingAmount": 26.0,
    "savingPercentPoint": 26.0,
    "exchangeCount": 1
  }
}
```

- If `visible: false`, Virtual Feedback is not displayed, and it falls back to F-002 (not applicable) or the base event logic (REQ-001, REQ-006)
- `savingAmount`: Savings amount (USDT) on a Total Saving basis; a value already corrected to 1 by the server if it would otherwise be under 1 USDT (REQ-003)
- `savingPercentPoint`: **Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange)**, Correction Factor not applied (REQ-024, PRD §2-A-1)
- `exchangeCount`: **Distinct number of exchanges** included in the savings sum (for the "based on N exchanges" caption, REQ-004). Even if one exchange has 2+ UIDs, it counts as 1 exchange (e.g., 3 exchanges · 4 UIDs → `exchangeCount=3`). Calculation/summing is per UID; only the caption number is the distinct-exchange count

**Response (200 OK) — Case B: WOOX Pro Included (F-002)**

```json
{
  "status": "success",
  "data": {
    "case": "woox_pro_included",
    "eventType": "tethermax_event"
  }
}
```

- `eventType`: One of `tethermax_event` (TetherMax-type), `woox_with_event` (WOOX Pro with-type), or `base` (other-exchange with-type = excluding WOOX, existing base logic) (REQ-005). Priority: `tethermax_event` > `woox_with_event` > `base`; random 1 if a tier has 2+ candidates. **There are only two event types: TetherMax-type and with-type (per-exchange)** — label mapping: House·Onboarding = TetherMax-type / self = WOOX Pro with / counter·base = other-exchange with. The "own event" / "house ad" values are removed (2026-07-07)
- Detailed event content (banner image, copy) is queried separately from the existing event admin data (reuses the existing API)

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 400 | BAD_REQUEST | Missing `paybackNos` parameter or format error |
| 500 | INTERNAL_ERROR | Calculation failure — in this case the FE falls back to base logic (see 기능명세서_FE_EN.md F-001 exception handling) |

---

### API-003. (Removed) Query WOOX Pro Comparison for Cashback Preview

> **Removed 2026-07** — the Cashback Preview (F-003) is **calculated on the front-end** (reusing the existing preview engine). A separate comparison endpoint is unnecessary, so API-003 is removed (BE-confirmed, 2026-07).
> - **Comparison calc (FE)**: the FE itself computes the Monthly Estimated Cashback for the current exchange and WOOX Pro (0.7 correction applied), the savings amount (USDT), and the nominal %p.
> - **Visibility gate**: backoffice `s2Compare` (API-001) is ON **AND** the FE's adverse-case/unsupported check passes. **Adverse-case guard** (Business Rule #1, REQ-011) — if the other exchange's preview-specific Total Saving rate is **≥** WOOX Pro's, do **not** show; show only when WOOX Pro is **strictly greater (>)**. WOOX-Pro-unsupported (leverage/product) and `exchange`=WOOX Pro are also skipped by the FE (REQ-010·011).
> - **Compliance**: commission/margin rates are not used in the calc (Rule #7), and raw internal rates are not exposed as client constants (Rule #6, REQ-023). Only the 0.7 correction factor is hard-coded.
> - OI-10 (admin "TetherMax Applied" double-multiplication bug) remains a precondition for preview-calc accuracy.

---

## Backoffice (Admin) API

> Requires admin authentication/permission (reuse of the existing admin permission system). Targets the 5 visibility flags; the **backoffice writes and the user front (API-001) reads**. Details: `PRD_백오피스_EN.md`·`기능명세서_백오피스.md`.

### API-B01. Query Visibility-Control Settings (Admin)

| Item | Content |
|---|---|
| Method | GET |
| URL | /api/admin/promo/visibility |
| Auth | Admin session/permission required (promotion operation permission) |
| Description | On entering the visibility-control page, query the current state of the 5 flags (A-001) |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "s1Feedback": true,
    "s1Banner": true,
    "s2Compare": true,
    "s2Banner": true,
    "loginBanners": true
  }
}
```

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 401 | UNAUTHORIZED | Admin not authenticated |
| 403 | FORBIDDEN | No promotion operation permission |

### API-B02. Save Visibility-Control Settings (Admin)

| Item | Content |
|---|---|
| Method | PUT |
| URL | /api/admin/promo/visibility |
| Auth | Admin session/permission required |
| Description | Saves the 5 flags. A partial set of fields may be sent (omitted fields keep their existing value); each area is controlled independently. Reflected in API-001 immediately upon save (no long-term caching, NFR-004). Writes an audit log on change (A-003) |

**Request (application/json)**

| Parameter | Type | Required | Description |
|---|---|---|---|
| s1Feedback | bool | N | Show withdrawal-complete WOOX Pro Virtual Feedback |
| s1Banner | bool | N | Show withdrawal-complete Travel Rule banner (#2) |
| s2Compare | bool | N | Show Cashback Preview WOOX Pro comparison |
| s2Banner | bool | N | Show Cashback Preview Travel Rule banner (#1) |
| loginBanners | bool | N | Show login 3-page Travel Rule banner (#3·#4·#5 collectively) |

```json
{ "s2Compare": false }
```

**Response (200 OK)**: after saving, returns the latest values of all 5 flags in the same schema as API-B01

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 400 | BAD_REQUEST | Disallowed field/type |
| 401 | UNAUTHORIZED | Admin not authenticated |
| 403 | FORBIDDEN | No promotion operation permission |
