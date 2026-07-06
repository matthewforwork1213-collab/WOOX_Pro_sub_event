/*
 * mock-api.js — WOOX Pro 온보딩 프로모션 프로토타입용 목(mock) 백엔드
 * 기능명세서_BE.md 의 F-001~F-005 로직·응답 스키마를 그대로 구현한다.
 * 내부 수치(할인율·페이백율·보정계수)는 계산에만 쓰고 응답에는 결과값만 담는다(REQ-023).
 */
(function (global) {
  'use strict';

  // ---- 상수 (기능명세서_BE §2.1) --------------------------------------------
  const CORRECTION_FACTOR = 0.7;            // 보정계수: 기능2 프리뷰에만 적용
  const WOOX = { discount: 0, payback: 0.80 }; // 할인율 0, 페이백율 80% (내부 전용)

  // 거래 빈도 → TIME 매핑 (기능명세서_BE §2.5)
  const TIME_MAP = { '0_1': 0.6, '1_2': 1.5, '2_5': 3.0, '5_10': 7.5, '10_PLUS': 20.0 };

  // 거래소 파라미터(어드민/캐시백 엔진 값 재현). 할인율은 대부분 0.
  // makerFee/takerFee 는 예시 수수료율. onboarded=노출 대상.
  const EXCHANGES = {
    bitget:  { name: 'Bitget',  logo: 'B', color: '#00CBFF', payback: 0.54, discount: 0, makerFee: 0.0002, takerFee: 0.0006, onboarded: true, wooxSupported: true },
    zoomex:  { name: 'Zoomex',  logo: 'Z', color: '#111827', payback: 0.60, discount: 0, makerFee: 0.0002, takerFee: 0.00055, onboarded: true, wooxSupported: true },
    bitmart: { name: 'BitMart', logo: 'M', color: '#1E9E7A', payback: 0.50, discount: 0, makerFee: 0.0004, takerFee: 0.0006, onboarded: true, wooxSupported: true },
    // 역효과 케이스용: 페이백율이 WOOX(80%)와 같거나 높은 가상의 거래소
    superx:  { name: 'SuperX',  logo: 'S', color: '#7C3AED', payback: 0.85, discount: 0, makerFee: 0.0002, takerFee: 0.0006, onboarded: true, wooxSupported: true },
    wooxpro: { name: 'WOOX Pro', logo: '∞', color: '#1D4ED8', payback: 0.80, discount: 0, makerFee: 0.0002, takerFee: 0.0006, onboarded: true, wooxSupported: true }
  };

  // ---- 산식 (기능명세서_BE §2.2~2.5) ----------------------------------------
  // 명목 토탈세이빙율 = 1 − (1−할인율)(1−페이백율)
  function nominalTS(ex) { return 1 - (1 - ex.discount) * (1 - ex.payback); }
  // 프리뷰 전용 토탈세이빙율 = 1 − (1−할인율)(1−페이백율×0.7)
  function previewTS(ex) { return 1 - (1 - ex.discount) * (1 - ex.payback * CORRECTION_FACTOR); }
  // 표시 %p = 명목 토탈세이빙율(WOOX) − 명목 토탈세이빙율(현재), 보정계수 미반영
  function percentPoint(ex) { return round1((nominalTS(WOOX) - nominalTS(ex)) * 100); }

  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }

  // 프로모션 활성 게이트 (기능명세서_BE §1.1 / F-005)
  //   active = (D+30 이내) AND (2개 WOOX Pro 이벤트 모두 미종료)
  function isActive(env) {
    if (env.simulateStatusError) return false; // 안전 기본값(장애 시 비활성)
    return env.withinD30 && !env.event1Terminated && !env.event2Terminated;
  }

  // ==== API-001: 프로모션 상태 (F-004·F-005) =================================
  function getStatus(env) {
    if (env.simulateStatusError) {
      // 판정 불가 시 500 대신 active:false 안전 응답 (기능명세서_BE F-005 예외)
      return { status: 'success', data: { active: false, travelRuleBanner: { i18nKey: 'promo.travelrule.badge' } } };
    }
    return {
      status: 'success',
      data: { active: isActive(env), travelRuleBanner: { i18nKey: 'promo.travelrule.badge' } }
    };
  }

  // ==== API-002: 출금 완료 후 가상 피드백 / 이벤트 분기 (F-001·F-002) ========
  // params: { wooxIncluded:bool, uids:[{exchange, actualPayback}], eventTier, forceError }
  function withdrawalFeedback(env, params) {
    if (!isActive(env)) {
      // 프로모션 비활성 → 원 base 로직(진행 중 거래소 이벤트 임의 1개). house_ad 아님.
      return { status: 'success', data: { case: 'base', baseFallback: true } };
    }
    if (params.forceError) {
      return { status: 'error', httpStatus: 500, code: 'INTERNAL_ERROR' }; // FE는 base 폴백
    }

    // Case B: WOOX Pro 포함 → 이벤트 분기 (F-002)
    if (params.wooxIncluded) {
      const tier = params.eventTier || 'woox_event';
      return { status: 'success', data: { case: 'woox_pro_included', eventType: tier } };
    }

    // Case A: WOOX Pro 미포함 → 가상 피드백 (F-001)
    const included = [];
    let sumSaving = 0, sumBaseFee = 0;
    (params.uids || []).forEach(function (u) {
      const ex = EXCHANGES[u.exchange];
      if (!ex || u.actualPayback == null) return;                 // 데이터 없음 → 해당 UID 제외
      // 기준 수수료 역산 = 실제 페이백 ÷ ((1−할인율)×페이백율)
      const baseFee = u.actualPayback / ((1 - ex.discount) * ex.payback);
      const currentNet = baseFee * (1 - nominalTS(ex));
      const wooxNet = baseFee * (1 - nominalTS(WOOX));
      const saving = currentNet - wooxNet;
      // 역효과 판정: 타 명목TS ≥ WOOX(80%) 면 제외 / 절약액 양수만 합산
      if (nominalTS(ex) >= nominalTS(WOOX) || saving <= 0) return;
      included.push(u.exchange);
      sumSaving += saving;
      sumBaseFee += baseFee;
    });

    if (included.length === 0) {
      // 전부 역효과·계산불가 → visible=false (FE는 base 폴백)
      return { status: 'success', data: { case: 'non_woox_pro', visible: false } };
    }

    // 복수 UID %p = 추가절약 총액 ÷ Σ기준수수료 (기준수수료 가중평균, §2.3) — 보정 전 값
    const aggPercentPoint = round1((sumSaving / sumBaseFee) * 100);
    // 표시 하한: 양수인데 1 USDT 미만이면 1 로 보정
    const savingAmount = sumSaving < 1 ? 1 : round2(sumSaving);

    return {
      status: 'success',
      data: {
        case: 'non_woox_pro',
        visible: true,
        savingAmount: savingAmount,
        savingPercentPoint: aggPercentPoint,
        exchangeCount: included.length
      }
    };
  }

  // ==== API-003: 캐시백 프리뷰 WOOX Pro 비교 (F-003) =========================
  // params: { exchange, balance, leverage, makerRatio, takerRatio, dailyTradeFrequency, forceError }
  function cashbackCompare(env, params) {
    if (!isActive(env)) return { status: 'success', data: { visible: false, reason: 'inactive' } };

    // 입력 검증
    if (params.makerRatio + params.takerRatio !== 100)
      return { status: 'error', httpStatus: 400, code: 'BAD_REQUEST', message: 'Maker + Taker must equal 100%.' };
    const ex = EXCHANGES[params.exchange];
    if (!ex) return { status: 'error', httpStatus: 404, code: 'NOT_FOUND', message: 'Unknown exchange.' };
    if (params.exchange === 'wooxpro')
      return { status: 'success', data: { visible: false, reason: 'woox_selected' } }; // 방어(FE는 미호출)
    if (params.forceError) return { status: 'error', httpStatus: 500, code: 'INTERNAL_ERROR', message: 'Calculation failed.' };
    if (params.unsupported || !ex.wooxSupported)
      return { status: 'success', data: { visible: false, reason: 'unsupported' } }; // WOOX 미지원 조건

    // 역효과: 프리뷰 전용 토탈세이빙율로 판정 (타 ≥ WOOX 면 미노출)
    if (previewTS(ex) >= previewTS(WOOX)) return { status: 'success', data: { visible: false, reason: 'adverse' } };

    // Monthly Estimated Cashback = balance × leverage × TIME × 2 × 30 × actualFeePaid × payback × 0.7
    const TIME = TIME_MAP[params.dailyTradeFrequency] || 0.6;
    const mk = params.makerRatio / 100, tk = params.takerRatio / 100;
    const baseK = params.balance * params.leverage * TIME * 2 * 30;
    function monthlyCashback(x) {
      const actualFeePaid = x.makerFee * (1 - x.discount) * mk + x.takerFee * (1 - x.discount) * tk;
      return baseK * actualFeePaid * x.payback * CORRECTION_FACTOR;
    }
    const currentEst = monthlyCashback(ex);
    const wooxEst = monthlyCashback(Object.assign({}, WOOX, { makerFee: ex.makerFee, takerFee: ex.takerFee }));
    // savingAmount 정답 = 순비용 차액. 비교 거래소 할인율 0 이면 캐시백 차이와 동일(BE §2.5).
    const saving = wooxEst - currentEst;

    return {
      status: 'success',
      data: {
        visible: true,
        currentExchangeEstimate: round2(currentEst),
        wooxProEstimate: round2(wooxEst),
        savingAmount: saving < 1 ? 1 : round2(saving),
        savingPercentPoint: percentPoint(ex) // 명목 %p (0.7 미반영)
      }
    };
  }

  global.MockAPI = {
    EXCHANGES: EXCHANGES,
    TIME_MAP: TIME_MAP,
    getStatus: getStatus,
    withdrawalFeedback: withdrawalFeedback,
    cashbackCompare: cashbackCompare,
    _util: { nominalTS: nominalTS, previewTS: previewTS, percentPoint: percentPoint, isActive: isActive }
  };
})(window);
