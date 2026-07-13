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

> Promotion-related APIs do not treat "display condition not met" as an error. Adverse cases, unsupported cases, calculation failures, etc. are returned as 200 OK + `visible: false` (see 기능명세서_BE_EN.md F-001 · F-003 exception handling).

---

## API Endpoint List

| API-ID | Method | URL | Function Name | Related Feature ID |
|---|---|---|---|---|
| API-001 | GET | /api/promo/status | Query promotion visibility (5 flags) — user front | F-004, F-005 |
| API-002 | GET | /api/promo/withdrawal-feedback | Query virtual feedback/event branch after withdrawal completion | F-001, F-002 |
| API-003 | POST | /api/promo/cashback-preview/compare | Query WOOX Pro comparison for cashback preview | F-003 |
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
| Description | Based on the list of withdrawal UIDs, returns Virtual Feedback (F-001) when WOOX Pro is not included, and the event branch (F-002) when WOOX Pro is included. Distinguished by the `case` field in the response |

**Request**

| Parameter | Type | Required | Description |
|---|---|---|---|
| uids | string (comma-separated) | Y | List of UIDs for this withdrawal completion. When withdrawing from multiple exchanges simultaneously, pass them comma-separated |

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
- `exchangeCount`: Number of UIDs included in the savings sum (for the N-exchange caption, REQ-004)

**Response (200 OK) — Case B: WOOX Pro Included (F-002)**

```json
{
  "status": "success",
  "data": {
    "case": "woox_pro_included",
    "eventType": "woox_event"
  }
}
```

- `eventType`: One of `woox_event` (WOOX Pro's own event), `onboarding_event` (TetherMax Onboarding Event), or `house_ad` (general House Ad) (REQ-005)
- Detailed event content (banner image, copy) is queried separately from the existing event admin data (reuses the existing API)

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 400 | BAD_REQUEST | Missing `uids` parameter or format error |
| 500 | INTERNAL_ERROR | Calculation failure — in this case the FE falls back to base logic (see 기능명세서_FE_EN.md F-001 exception handling) |

---

### API-003. Query WOOX Pro Comparison for Cashback Preview

| Item | Content |
|---|---|
| Method | POST |
| URL | /api/promo/cashback-preview/compare |
| Description | Using the preview conditions entered by the user, calculates the Monthly Estimated Cashback for both the current exchange and WOOX Pro, and returns the comparison result on a Total Saving basis |

**Request**

| Parameter | Type | Required | Description |
|---|---|---|---|
| exchange | string | Y | ID of the current exchange selected by the user (when it is WOOX Pro, the default contract is that the FE does not call this endpoint, REQ-010) |
| balance | number | Y | Asset size (USDT) |
| leverage | number | Y | Leverage multiple |
| makerRatio | number (0~100) | Y | Maker trade ratio (%). Must sum to 100 with takerRatio |
| takerRatio | number (0~100) | Y | Taker trade ratio (%). Must sum to 100 with makerRatio |
| dailyTradeFrequency | enum | Y | Trade frequency band. `0_1` (0~1 times) / `1_2` (1~2 times) / `2_5` (2~5 times) / `5_10` (5~10 times) / `10_PLUS` (10+ times) — see the TIME mapping table in PRD §2-A-1 |

**Response (200 OK)**

```json
{
  "status": "success",
  "data": {
    "visible": true,
    "currentExchangeEstimate": 945.00,
    "wooxProEstimate": 1512.00,
    "savingAmount": 567.00,
    "savingPercentPoint": 30.0
  }
}
```

- If `visible: false`, the comparison card is not displayed — conditions: Adverse Case (the other exchange's preview-specific Total Saving Rate ≥ WOOX Pro's), WOOX Pro not supported (leverage/product), or `exchange` is already WOOX Pro (REQ-011)
- `currentExchangeEstimate` / `wooxProEstimate`: The respective Monthly Estimated Cashback result values (with the 0.7 Correction Factor already applied). Raw data such as Discount Rate, Payback Rate, and Correction Factor are not included in the response (REQ-023)
- `savingAmount`: Savings difference (USDT) on a Total Saving basis, with the 0.7 Correction Factor applied (OI-08 confirmed)
- `savingPercentPoint`: **Nominal Total Saving Rate (WOOX Pro) − Nominal Total Saving Rate (current exchange)**, Correction Factor not applied — since the formula differs from `savingAmount`, it is not a simple proportional relationship (REQ-024)

**Error Response**

| Status Code | Error Code | Condition |
|---|---|---|
| 400 | BAD_REQUEST | makerRatio + takerRatio ≠ 100, or a required parameter is missing |
| 404 | NOT_FOUND | Non-existent `exchange` ID |
| 500 | INTERNAL_ERROR | Calculation failure. If the admin's "TetherMax Applied" field double-multiplication bug (OI-10) remains unfixed, result accuracy cannot be guaranteed, so this API must not be deployed to production until that bug fix is complete (see 기능명세서_BE_EN.md F-003) |

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
