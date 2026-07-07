# API 스펙

| 항목 | 내용 |
|---|---|
| 프로젝트명 | WOOX Pro 온보딩 기념 30일 집중 프로모션 |
| 작성일 | 2026-07-03 |
| 버전 | v1.0 |
| 참조 문서 | 02.기획문서/기능명세서_FE.md, 02.기획문서/기능명세서_BE.md, PRD.md |

> 엔드포인트 경로·필드명은 초안이며, 기존 TetherMax API 네이밍 컨벤션에 맞춰 구현 단계에서 조정될 수 있다.

---

## API 공통 사항

| 항목 | 내용 |
|---|---|
| Base URL | 기존 TetherMax API 서버 기준 (⚠️ OI-01 배포 환경 확정 후 확정) |
| 인증 방식 | 기존 TetherMax 세션/토큰 방식 재사용. 단, GET /api/promo/status는 비로그인(로그인 전 화면, S3·S4)에서도 호출 가능해야 하므로 인증 불필요 |
| 응답 형식 | JSON |
| 문자 인코딩 | UTF-8 |
| 다국어 | 응답에 번역 텍스트를 직접 담지 않고 i18n 키만 반환한다. 실제 문구는 FE의 다국어 리소스에서 로케일에 맞게 렌더링 (금액·%p 같은 결과값은 예외적으로 서버가 숫자로 반환) |
| 시간대 | 모든 타임스탬프 필드는 **UTC(ISO 8601)** 로 응답한다. 배치 처리(KST 20:00)·프로모션 판정(D+30)은 서버 내부적으로 KST 기준이나, API 응답과 화면 노출은 UTC → **사용자 기기 로컬 타임존** 변환을 거친다(FE 렌더링 시 적용). KST 고정 문구로 응답하지 않는다 (NFR-007) |

### 공통 에러 코드

| HTTP 상태 코드 | 에러 코드 | 설명 |
|---|---|---|
| 400 | BAD_REQUEST | 잘못된 요청 (필수 파라미터 누락, 비율 합계 오류 등) |
| 401 | UNAUTHORIZED | 인증 필요 |
| 404 | NOT_FOUND | 리소스 없음 (존재하지 않는 거래소 ID 등) |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |

> 프로모션 관련 API는 "노출 조건 미충족"을 에러로 취급하지 않는다. 역효과·미지원·계산 불가 등은 200 OK + `visible: false`로 응답한다 (기능명세서_BE F-001·F-003 예외 처리 참조).

---

## API 엔드포인트 목록

| API-ID | Method | URL | 기능명 | 관련 기능 ID |
|---|---|---|---|---|
| API-001 | GET | /api/promo/status | 프로모션 활성 상태 조회 | F-004, F-005 |
| API-002 | GET | /api/promo/withdrawal-feedback | 출금 완료 후 가상 피드백/이벤트 분기 조회 | F-001, F-002 |
| API-003 | POST | /api/promo/cashback-preview/compare | 캐시백 프리뷰 WOOX Pro 비교 조회 | F-003 |

---

## API 상세

### API-001. 프로모션 활성 상태 조회

| 항목 | 내용 |
|---|---|
| Method | GET |
| URL | /api/promo/status |
| 설명 | 백오피스 영역별 노출 on/off 5개를 조회한다. F-001·F-003·F-004가 자기 영역 플래그를 소비한다. 로그인 여부와 무관하게 호출 가능하다(REQ-019). **(2026-07-07 정책: D+30·2개 WOOX 이벤트 게이트 폐지 → 영역별 on/off)** |

**Request**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| (없음) | - | - | 쿼리 파라미터 없음. 인증 토큰이 있으면 참고하되 필수는 아님 |

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
    }
  }
}
```

- `s1Feedback`: 출금완료 WOOX Pro 가상 피드백(F-001) 노출 여부. false면 F-001은 base 로직
- `s1Banner`·`s2Banner`·`loginBanners`: 트레블룰 배너(#2 / #1 / #3·#4·#5 일괄) 노출 여부 (F-004)
- `s2Compare`: 캐시백 프리뷰 WOOX Pro 비교(F-003) 노출 여부. false면 비교 카드 미삽입 (REQ-020~022)
- `travelRuleBanner.i18nKey`: 배너 문구의 i18n 키(로고 이미지는 디자인 하드코딩이므로 API로 내려주지 않음, REQ-017)

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|---|---|---|
| 500 | INTERNAL_ERROR | 설정 조회 실패 등 판정 불가 — 이 경우 서버는 에러 대신 **5개 플래그를 전부 false**로 안전하게 응답하는 것을 우선한다 (기능명세서_BE F-005 예외 처리) |

---

### API-002. 출금 완료 후 가상 피드백/이벤트 분기 조회

| 항목 | 내용 |
|---|---|
| Method | GET |
| URL | /api/promo/withdrawal-feedback |
| 설명 | 출금 UID 목록을 기준으로, WOOX Pro 미포함 시 가상 피드백(F-001)을, WOOX Pro 포함 시 이벤트 분기(F-002)를 반환한다. 응답의 `case` 필드로 구분한다 |

**Request**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| uids | string (콤마 구분) | Y | 이번 출금 완료 건의 UID 목록. 복수 거래소 동시 출금 시 콤마로 구분해 전달 |

**Response (200 OK) — Case A: WOOX Pro 미포함 (F-001)**

```json
{
  "status": "success",
  "data": {
    "case": "non_woox_pro",
    "visible": true,
    "savingAmount": 26.0,
    "savingPercentPoint": 15.0,
    "exchangeCount": 2
  }
}
```

- `visible: false`면 가상 피드백을 노출하지 않고 F-002(해당 없음) 또는 base 이벤트 로직으로 폴백 (REQ-001, REQ-006)
- `savingAmount`: 토탈 세이빙 기준 절약 금액(USDT), 1 USDT 미만은 서버에서 1로 보정 완료된 값 (REQ-003)
- `savingPercentPoint`: **명목 토탈세이빙율(WOOX Pro) − 명목 토탈세이빙율(현재 거래소)**, 보정계수 미반영 (REQ-024, PRD §2-A-1)
- `exchangeCount`: 절약액 합산에 포함된 UID 수(N개 거래소 기준 캡션용, REQ-004)

**Response (200 OK) — Case B: WOOX Pro 포함 (F-002)**

```json
{
  "status": "success",
  "data": {
    "case": "woox_pro_included",
    "eventType": "woox_event"
  }
}
```

- `eventType`: `woox_event`(WOOX Pro 자체 이벤트) / `onboarding_event`(테더맥스 온보딩 이벤트) / `house_ad`(일반 하우스 광고) 중 하나 (REQ-005)
- 이벤트 상세 콘텐츠(배너 이미지·문구)는 기존 이벤트 어드민 데이터를 별도 조회(기존 API 재사용)

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|---|---|---|
| 400 | BAD_REQUEST | `uids` 파라미터 누락 또는 형식 오류 |
| 500 | INTERNAL_ERROR | 계산 실패 — 이 경우 FE는 base 로직으로 폴백 (기능명세서_FE F-001 예외 처리) |

---

### API-003. 캐시백 프리뷰 WOOX Pro 비교 조회

| 항목 | 내용 |
|---|---|
| Method | POST |
| URL | /api/promo/cashback-preview/compare |
| 설명 | 유저가 입력한 프리뷰 조건으로 현재 거래소와 WOOX Pro의 Monthly Estimated Cashback을 각각 계산해 토탈 세이빙 기준 비교 결과를 반환한다 |

**Request**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| exchange | string | Y | 유저가 선택한 현재 거래소 ID (WOOX Pro인 경우 FE에서 호출하지 않는 것이 기본 계약, REQ-010) |
| balance | number | Y | 자산 규모(USDT) |
| leverage | number | Y | 레버리지 배수 |
| makerRatio | number (0~100) | Y | Maker 거래 비율(%). takerRatio와 합이 100이어야 함 |
| takerRatio | number (0~100) | Y | Taker 거래 비율(%). makerRatio와 합이 100이어야 함 |
| dailyTradeFrequency | enum | Y | 거래 빈도 구간. `0_1`(0~1회) / `1_2`(1~2회) / `2_5`(2~5회) / `5_10`(5~10회) / `10_PLUS`(10회 이상) — PRD §2-A-1 TIME 매핑표 참조 |

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

- `visible: false`면 비교 카드를 노출하지 않는다 — 조건: 역효과(타 거래소 프리뷰 전용 토탈세이빙율 ≥ WOOX Pro), WOOX Pro 미지원(레버리지/상품), `exchange`가 이미 WOOX Pro인 경우 (REQ-011)
- `currentExchangeEstimate` / `wooxProEstimate`: 각각의 Monthly Estimated Cashback 결과값(보정계수 0.7 반영 완료). 할인율·페이백율·보정계수 등 원자료는 응답에 포함하지 않는다 (REQ-023)
- `savingAmount`: 토탈 세이빙 기준 절약 차액(USDT), 보정계수 0.7 반영 (OI-08 확정)
- `savingPercentPoint`: **명목 토탈세이빙율(WOOX Pro) − 명목 토탈세이빙율(현재 거래소)**, 보정계수 미반영 — `savingAmount`와 산식이 다르므로 단순 비례 관계가 아님 (REQ-024)

**에러 Response**

| 상태 코드 | 에러 코드 | 조건 |
|---|---|---|
| 400 | BAD_REQUEST | makerRatio + takerRatio ≠ 100, 필수 파라미터 누락 |
| 404 | NOT_FOUND | 존재하지 않는 `exchange` ID |
| 500 | INTERNAL_ERROR | 계산 실패. 어드민 "테더맥스 적용" 필드 이중곱 버그(OI-10)가 미수정 상태면 결과 정확도가 보장되지 않으므로, 해당 버그 수정 완료 전에는 이 API를 프로덕션에 배포하지 않는다 (기능명세서_BE F-003 참조) |
