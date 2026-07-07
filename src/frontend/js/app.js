/*
 * app.js — WOOX Pro 온보딩 프로모션 클릭 프로토타입 (화면·배너·모달·에러·시나리오)
 * 화면: S1(출금 완료)·S2(캐시백 프리뷰)·로그인·회원가입·모바일 로그인 전·마이페이지
 * 한/영 전환: T(englishString) — i18n.js. 제품 화면 문자열만 번역(탭·시나리오·토스트는 개발용).
 */
(function () {
  'use strict';
  var API = window.MockAPI;
  var EX = API.EXCHANGES;
  var T = window.t; // 번역 함수 (KO 모드면 사전 번역, 아니면 원문 영문)

  // ---------------- 전역 상태 ----------------
  var state = {
    screen: 's1',
    prevScreen: 's1',
    s1: { mode: 'feedback', dismissed: false },
    s2: { exchange: 'bitget', mode: 'comparison', collapsed: false, oi10: false },
    auth: { loggedIn: false },
  };

  // 백오피스 노출 제어(2026-07-07 정책): 영역별 on/off. localStorage 공유(백오피스 페이지와 동일 키).
  var ADMIN_KEY = 'wooxpromo_admin';
  var ADMIN_DEF = { s1Feedback: true, s1Banner: true, s2Compare: true, s2Banner: true, loginBanners: true };
  function admin() {
    try { return Object.assign({}, ADMIN_DEF, JSON.parse(localStorage.getItem(ADMIN_KEY)) || {}); }
    catch (e) { return Object.assign({}, ADMIN_DEF); }
  }
  function setAdmin(k, v) { var a = admin(); a[k] = v; try { localStorage.setItem(ADMIN_KEY, JSON.stringify(a)); } catch (e) { } }

  var S1_MODES = [
    { k: 'feedback', t: '가상 피드백(단일)', req: 'REQ-001~003' },
    { k: 'multi', t: '복수 UID 합산', req: 'REQ-004' },
    { k: 'adverse', t: '역효과→base', req: 'REQ-006' },
    { k: 'woox_event', t: 'WOOX 포함·자체이벤트', req: 'REQ-005' },
    { k: 'onboarding_event', t: 'WOOX 포함·온보딩', req: 'REQ-005' },
    { k: 'house_ad', t: 'WOOX 포함·하우스', req: 'REQ-005' },
    { k: 'error', t: 'API 실패→base', req: 'NFR-004' },
  ];
  var S2_MODES = [
    { k: 'comparison', t: '비교 카드(정상)', req: 'REQ-008' },
    { k: 'adverse', t: '역효과 미노출', req: 'REQ-011' },
    { k: 'unsupported', t: 'WOOX 미지원', req: 'REQ-011' },
    { k: 'woox_selected', t: 'WOOX 선택(미호출)', req: 'REQ-010' },
    { k: 'err400', t: '에러 400(비율합)', req: 'API-003' },
    { k: 'err404', t: '에러 404(거래소)', req: 'API-003' },
    { k: 'err500', t: '에러 500(계산)', req: 'API-003' },
  ];

  // ---------------- 유틸 ----------------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function fmt(n) { return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function stage() { return document.getElementById('stage'); }

  function toast(msg, kind) {
    var w = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    w.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(function () { w.removeChild(el); }, 3100);
  }

  function modal(html, opts) {
    opts = opts || {};
    var root = document.getElementById('modal-root');
    root.innerHTML = '<div class="overlay ' + (opts.center ? 'center' : '') + '" data-close-overlay>' +
      '<div class="sheet ' + (opts.dark ? 'dark' : '') + '">' + html + '</div></div>';
    root.querySelector('[data-close-overlay]').addEventListener('click', function (e) {
      if (e.target === e.currentTarget && opts.dismissable !== false) closeModal();
    });
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

  // 배너 위치별 노출 여부(백오피스 on/off). #1=S2, #2=S1, #3·#4·#5=로그인 3페이지 일괄
  function bannerAllowed(pos) {
    var a = admin();
    if (pos === 1) return a.s2Banner;
    if (pos === 2) return a.s1Banner;
    return a.loginBanners; // #3·#4·#5
  }

  // ---------------- 트레블룰 배너 (기능 3) ----------------
  // 개정: 클릭 시 WOOX Pro 거래소 상세로 이동. 로고 사이 좌우 화살표(↔). 노출은 백오피스 on/off.
  // variant: '' 기본 pill | 'block' 별도 블록(모바일 로그인 전) | 'left' 좌측정렬 풀폭(마이페이지)
  function banner(pos, variant) {
    if (!bannerAllowed(pos)) return '';
    var cls = variant ? ' ' + variant : '';
    var wrapFull = (variant === 'block' || variant === 'left') ? ' full' : '';
    return '<div class="tr-wrap' + wrapFull + '"><div class="tr-banner' + cls + '" data-action="tr-click" title="WOOX Pro 거래소 상세로 이동 (배너 #' + pos + ')">' +
      '<span class="logos"><span class="tr-logo bithumb">Bithumb</span><span class="tr-arrow">↔</span><span class="tr-logo woox">WOOX Pro</span></span>' +
      '<span class="txt">' + T('Travel Rule Integration') + '</span></div></div>';
  }
  function bindBanner() { onClick('[data-action="tr-click"]', gotoWoox); }
  function gotoWoox() { state.prevScreen = state.screen; go('wooxdetail'); }

  // ---------------- 공통 조각 ----------------
  function statusbar() { return '<div class="statusbar"><span>9:41</span><span class="sig">▪▪▪ &#128246; &#128267;</span></div>'; }
  function phoneOpen(dark) { return '<div class="phone ' + (dark ? 'dark' : '') + '">' + statusbar() + '<div class="phone-body">'; }
  function phoneClose() { return '</div></div>'; }

  // ======================================================================
  // S1 — 출금 완료 화면 (기능 1 + 배너 #2)
  // ======================================================================
  function renderS1() {
    var m = state.s1.mode;
    var body = '';
    var feedbackOn = admin().s1Feedback; // 백오피스: WOOX Pro 가상 피드백 안내 on/off

    body += '<div class="appbar"><div class="brand"><span class="inf">∞</span> TetherMax</div><div class="icons">◍ ≡</div></div>';
    body += '<div class="screen-pad">';
    body += '<div class="center"><div style="font-size:44px;color:#16a34a">✓</div>' +
      '<div class="h1" style="margin-top:0">' + T('Withdrawal Complete') + '</div>' +
      '<div class="muted">1,000 USDT · Bitget</div></div><div class="sp16"></div>';

    if ((m === 'feedback' || m === 'multi') && !feedbackOn) {
      body += sectionLabel('백오피스 OFF: WOOX Pro 가상 피드백 안내 미표시 → base');
      body += eventAd('base');
    } else if (m === 'feedback' || m === 'multi') {
      var res = API.withdrawalFeedback({
        wooxIncluded: false,
        uids: m === 'multi'
          ? [{ exchange: 'bitget', actualPayback: 54 }, { exchange: 'zoomex', actualPayback: 36 }]
          : [{ exchange: 'bitget', actualPayback: 54 }]
      });
      if (res.data && res.data.visible) body += feedbackCard(res.data);
      else { body += sectionLabel('visible=false → base 폴백'); body += eventAd('base'); }
    } else if (m === 'adverse') {
      body += sectionLabel('역효과(타 거래소 토탈세이빙 ≥ WOOX) → 미노출, base 폴백');
      body += eventAd('base');
    } else if (m === 'woox_event' || m === 'onboarding_event' || m === 'house_ad') {
      var r3 = API.withdrawalFeedback({ wooxIncluded: true, eventTier: m });
      body += sectionLabel('WOOX Pro 포함 → 이벤트 분기: ' + m);
      body += eventAd(r3.data.eventType);
    } else if (m === 'error') {
      body += sectionLabel('가상 피드백 API 실패(500) → base 이벤트 폴백');
      body += eventAd('base');
    }

    body += banner(2);
    body += '</div>';
    mountPhone(body, false);
    wireS1();
  }

  function sectionLabel(txt) { return '<div class="tag-note">· ' + txt + ' ·</div><div class="sp8"></div>'; }

  function feedbackCard(d) {
    var basis = T('Based on standard user / base tier') + (d.exchangeCount > 1 ? ' · ' + d.exchangeCount + T(' exchanges') : '');
    return '<div class="feedback">' +
      '<span class="badge">WOOX Pro</span>' +
      '<div class="headline">' + T("If you'd used WOOX Pro for this withdrawal, you could have saved ") +
      '<span class="amount">+' + fmt(d.savingAmount) + ' USDT (' + d.savingPercentPoint + '%p)</span>' + T(' more in fees') + '</div>' +
      '<div class="sub">' + T("Fee differences add up to more than you'd expect.") + '</div>' +
      '<div class="cta" data-action="s1-compare">' + T('View WOOX Pro Fee Comparison ›') + '</div>' +
      '<div class="basis">' + basis + '</div>' +
      '</div>';
  }

  function eventAd(type) {
    var title = T('Trade to win up to $100K prize pool'), tag = 'Bitget', color = EX.bitget.color;
    if (type === 'woox_event') { title = T('WOOX Pro Launch Event · Up to 100 USDT'); tag = 'WOOX Pro'; color = EX.wooxpro.color; }
    else if (type === 'onboarding_event') { title = T('TetherMax × WOOX Pro Onboarding Event'); tag = 'TetherMax'; color = '#1d4ed8'; }
    else if (type === 'house_ad') { title = T('Earn cashback on every trade with TetherMax'); tag = 'TetherMax'; color = '#1d4ed8'; }
    return '<div class="center"><div class="h2" style="text-align:center">' + T('Explore This Limited-Time Event') + '</div></div>' +
      '<div class="event-ad">' +
      '<span class="ex-tag"><span class="exlogo" style="background:' + color + '">' + tag.charAt(0) + '</span>' + tag + '</span>' +
      '<div class="ev-title">' + title + '</div><div class="trophy">🏆</div></div>' +
      '<div class="sp12"></div>' +
      '<div class="btn-row"><button class="btn btn-ghost" data-action="event-close">' + T('Close') + '</button>' +
      '<button class="btn btn-primary" data-action="event-learnmore" data-type="' + type + '">' + T('Learn more') + '</button></div>';
  }

  function wireS1() {
    onClick('[data-action="s1-compare"]', gotoWoox);
    onClick('[data-action="event-learnmore"]', function (e) {
      var ty = e.currentTarget.getAttribute('data-type');
      if (ty === 'woox_event' || ty === 'onboarding_event') gotoWoox(); else openExchangeEvent();
    });
    onClick('[data-action="event-close"]', function () { toast('이벤트를 닫았습니다 (프로토타입)'); });
    bindBanner();
  }

  // ======================================================================
  // S2 — 캐시백 프리뷰 결과 (기능 2 + 배너 #1)
  // ======================================================================
  function monthly(exKey, p) {
    var x = EX[exKey], TIME = API.TIME_MAP[p.freq];
    var mk = p.makerRatio / 100, tk = p.takerRatio / 100;
    var baseK = p.balance * p.leverage * TIME * 2 * 30;
    var fees = baseK * (x.makerFee * (1 - x.discount) * mk + x.takerFee * (1 - x.discount) * tk);
    return { fees: fees, cashback: fees * x.payback * 0.7 };
  }

  function renderS2() {
    var s = state.s2;
    var exKey = s.mode === 'woox_selected' ? 'wooxpro' : (s.mode === 'err404' ? 'ghost' : s.exchange);
    var exView = EX[exKey] || { name: 'Unknown', payback: 0, color: '#999' };
    var params = { balance: 1000, leverage: 1, makerRatio: 20, takerRatio: 80, freq: '1_2' };
    if (s.mode === 'err400') params.takerRatio = 70;

    var body = '';
    body += '<div class="appbar"><div class="brand"><span class="inf">∞</span> TetherMax</div><div class="icons">◍ ≡</div></div>';
    body += '<div class="screen-pad">';
    body += '<div class="center h1" style="line-height:1.25">' + T("You're all set.<br/>Here's your summary.") + '</div><div class="sp16"></div>';

    var sum = (EX[exKey] && exKey !== 'ghost') ? monthly(exKey, params) : { fees: 0, cashback: 0 };
    body += '<div class="card">' +
      '<div class="field-row"><span class="muted">' + T('Exchange') + '</span><span><span class="exlogo" style="background:' + exView.color + '">' + (exView.name || '?').charAt(0) + '</span> ' + exView.name + '</span></div></div>' +
      '<div class="sp12"></div>' +
      '<div class="grid2">' +
      stat(T('Account balance'), params.balance.toFixed(2) + ' USDT') + stat(T('Leverage'), params.leverage + 'x') +
      stat(T('Order Type Ratio'), params.makerRatio + '% ' + T('Maker') + ' / ' + params.takerRatio + '% ' + T('Taker')) +
      stat(T('Trading frequency'), T('1-2 trades a day')) + '</div><div class="sp12"></div>';

    body += '<div class="card" style="border-color:#c9d6f5">' +
      '<div class="field-row"><span class="muted">' + T('Trading Fees') + '</span><b>' + fmt(sum.fees) + ' USDT/mo</b></div>' +
      '<div class="field-row"><span class="muted">' + T('× Cashback Rate') + '</span><b>× ' + Math.round(exView.payback * 100) + '%</b></div>' +
      '<hr style="border:none;border-top:1px solid var(--border)"/>' +
      '<div class="field-row"><b>' + T('Cashback') + '</b><b style="color:var(--brand)">' + fmt(sum.cashback) + ' USDT/mo*</b></div>' +
      '<div class="tiny muted">' + T('*Calculated based on paid trading fees') + '</div></div>';

    if (s.oi10) body += '<div class="inline-warn">⚠︎ [개발용] 어드민 "테더맥스 적용" 이중곱 버그(OI-10) 미수정 상태 — 비교 숫자 정확도 미보장. 런칭 전 선행 수정 필요.</div>';

    if (!admin().s2Compare) {
      // 백오피스 OFF: WOOX Pro 비교 안내 미표시
      body += '<div class="tag-note">백오피스 OFF: WOOX Pro 비교 안내 미표시 → 결과 화면만</div>';
    } else {
      var cmp = API.cashbackCompare({
        exchange: exKey, balance: params.balance, leverage: params.leverage,
        makerRatio: params.makerRatio, takerRatio: params.takerRatio,
        dailyTradeFrequency: params.freq, forceError: s.mode === 'err500', unsupported: s.mode === 'unsupported'
      });
      if (cmp.status === 'error') {
        body += '<div class="tag-note">비교 카드 미삽입 (에러 ' + cmp.httpStatus + ')</div>';
        setTimeout(function () { toast('[' + cmp.httpStatus + ' ' + cmp.code + '] ' + (cmp.message || ''), 'err'); }, 60);
      } else if (cmp.data.visible) {
        body += compareCard(exView, cmp.data);
      } else {
        var reasonMap = { adverse: '역효과(현재 거래소가 유리) → 비교 카드 미노출', unsupported: 'WOOX Pro 미지원 조건 → 미노출', woox_selected: '이미 WOOX Pro 선택 → API 미호출·카드 없음' };
        body += '<div class="tag-note">' + (reasonMap[cmp.data.reason] || '미노출') + '</div>';
      }
    }

    body += payoutDetails();
    body += '<div class="sp12"></div>';
    body += '<div class="btn-row"><button class="btn btn-ghost" style="flex:0 0 54px" data-action="s2-reset">↻</button>' +
      '<button class="btn btn-primary" data-action="s2-start-current" data-ex="' + exView.name + '">' + T('Start {ex} Cashback').replace('{ex}', exView.name) + ' ⧉</button></div>';

    body += banner(1);
    body += '</div>';
    mountPhone(body, false);
    wireS2();
  }

  function stat(k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  function compareCard(exView, d) {
    var collapsed = state.s2.collapsed;
    return '<div class="compare ' + (collapsed ? 'collapsed' : '') + '">' +
      '<div class="c-head" data-action="s2-collapse">' +
      '<span class="t">' + T("You're losing out with your current exchange") + '</span>' +
      '<span class="chev">▾</span></div>' +
      '<div class="c-body">' +
      '<div class="cmp-row"><span class="lbl">' + exView.name + ' · ' + T('est. cashback') + '</span><span class="val">' + fmt(d.currentExchangeEstimate) + ' USDT/mo</span></div>' +
      '<div class="cmp-row"><span class="lbl">WOOX Pro · ' + T('est. cashback') + '</span><span class="val cmp-win">' + fmt(d.wooxProEstimate) + ' USDT/mo</span></div>' +
      '<div class="save-hl">' + T("With WOOX Pro you'd get ") + '<span class="big">+' + fmt(d.savingAmount) + ' USDT/mo</span> (' + d.savingPercentPoint + '%p)</div>' +
      '<div class="sp12"></div>' +
      '<button class="btn btn-primary" data-action="s2-start">' + T('Start with WOOX Pro') + '</button>' +
      '<div class="basis-note">' + T('standard user / base tier basis · collapse available (no forced close)') + '</div>' +
      '</div></div>';
  }

  function payoutDetails() {
    return '<div class="payout"><b>' + T('Payout Details') + '</b><div class="steps">' +
      '<div class="step"><span class="ic">🕒</span><div class="s-k">' + T('Schedule') + '</div><div class="s-v">' + T('Daily') + '</div></div>' +
      '<div class="dash"></div>' +
      '<div class="step"><span class="ic">$</span><div class="s-k">' + T('Payout Time') + '</div><div class="s-v">07:00</div></div>' +
      '<div class="dash"></div>' +
      '<div class="step"><span class="ic">📍</span><div class="s-k">' + T('Destination') + '</div><div class="s-v">TetherMax</div></div>' +
      '</div></div>';
  }

  function wireS2() {
    onClick('[data-action="s2-collapse"]', function () { state.s2.collapsed = !state.s2.collapsed; renderS2(); });
    onClick('[data-action="s2-start"]', gotoWoox);
    onClick('[data-action="s2-start-current"]', function (e) { toast(e.currentTarget.getAttribute('data-ex') + ' 캐시백 시작 (기존 흐름·프로토타입)'); });
    onClick('[data-action="s2-reset"]', function () { toast('입력 초기화 (프로토타입)'); });
    bindBanner();
  }

  // ======================================================================
  // 로그인 / 회원가입 (데스크톱)
  // ======================================================================
  function siteNav() {
    return '<div class="site-nav"><div class="brand"><span class="inf">∞</span> TetherMax</div>' +
      '<span class="navlink">' + T('Exchanges') + '</span><span class="navlink">' + T('Events') + '</span><span class="navlink">' + T('Benefits') + '</span>' +
      '<span class="navlink">' + T('Cashback Preview') + '</span><span class="navlink">' + T('Point') + '</span><span class="spacer"></span>' +
      '<button class="btn btn-ghost" style="width:auto;padding:9px 16px" data-action="go-login">' + T('Login') + '</button>' +
      '<button class="btn btn-primary" style="width:auto;padding:9px 16px" data-action="go-signup">' + T('Sign Up') + '</button></div>';
  }

  function renderLogin() {
    var body = '<div class="desktop">' + siteNav() +
      '<div style="padding:40px 20px">' +
      '<div class="h1">' + T('Hi, welcome back!') + '</div>' +
      '<div class="form">' +
      '<div class="card" style="background:var(--surface-2);border:none;display:flex;align-items:center;gap:12px">' +
      '<div><div class="muted tiny">' + T('Log in now to complete missions') + '</div><b style="color:var(--brand)">' + T('to earn more USDT') + '</b></div></div>' +
      // 배너 #4 (요청 위치: 미션 카드와 이메일 입력 사이)
      banner(4) +
      '<div class="sp8"></div>' +
      '<input class="input" id="lg-email" placeholder="' + T('Email') + '" />' +
      '<div id="lg-email-err"></div><div class="sp12"></div>' +
      '<input class="input" id="lg-pw" type="password" placeholder="' + T('Password') + '" />' +
      '<div id="lg-pw-err"></div>' +
      '<div class="sp12"></div><span class="link" data-action="forgot">' + T('Forgot Password?') + '</span>' +
      '<div id="lg-cred-err"></div>' +
      '<div class="sp24"></div>' +
      '<button class="btn btn-primary" data-action="login-submit">' + T('Continue') + '</button>' +
      '<div class="sp16"></div><div class="center">' + T("Don't have an account? ") + '<span class="link" data-action="go-signup">' + T('Sign Up Now') + '</span></div>' +
      '</div></div></div>';
    mountDesktop(body);
    wireAuth();
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function wireAuth() {
    bindBanner();
    onClick('[data-action="go-login"]', function () { go('login'); });
    onClick('[data-action="go-signup"]', function () { toast('회원가입 화면은 이 프로모션 변경 대상이 아닙니다 (프로토타입 범위 외)'); });
    onClick('[data-action="forgot"]', function () {
      modal('<div class="modal-title">' + T('Reset your password') + '</div><div class="modal-sub">' + T("We'll email a reset link if the account exists.") + '</div><div class="sp16"></div><input class="input" placeholder="' + T('Email') + '" /><div class="sp16"></div><button class="btn btn-primary" data-action="forgot-send">' + T('Send reset link') + '</button>', { center: true });
      onClick('[data-action="forgot-send"]', function () { closeModal(); toast('비밀번호 재설정 링크를 보냈습니다(있는 계정일 경우).'); });
    });
    onClick('[data-action="login-submit"]', function () {
      clearErr(['lg-email-err', 'lg-pw-err', 'lg-cred-err']);
      var email = $('#lg-email').value.trim(), pw = $('#lg-pw').value, bad = false;
      if (!email) { setErr('lg-email-err', T('Enter your email.')); markErr('lg-email'); bad = true; }
      else if (!isEmail(email)) { setErr('lg-email-err', T('Invalid email format.')); markErr('lg-email'); bad = true; }
      if (!pw) { setErr('lg-pw-err', T('Enter your password.')); markErr('lg-pw'); bad = true; }
      if (bad) return;
      if (email === 'wrong@test.com' || pw === 'wrong') { setErr('lg-cred-err', T('Email or password is incorrect.')); return; }
      state.auth.loggedIn = true; toast('로그인 성공'); go('mypage');
    });
  }

  function setErr(id, msg) { var e = document.getElementById(id); if (e) e.innerHTML = '<div class="err-msg">' + msg + '</div>'; }
  function clearErr(ids) { ids.forEach(function (id) { var e = document.getElementById(id); if (e) e.innerHTML = ''; }); }
  function markErr(id) { var e = document.getElementById(id); if (e) { e.classList.add('err'); e.addEventListener('input', function () { e.classList.remove('err'); }, { once: true }); } }

  // ======================================================================
  // 모바일 · 로그인 전 메뉴 (S4) — 배너 #3
  // ======================================================================
  function renderMweb() {
    var b = phoneOpen(true) +
      '<div class="mweb">' +
      '<div class="close" data-action="mp-close">✕</div>' +
      '<div class="welcome-card">' +
      '<div class="wt">' + T('Welcome to TetherMax!') + '</div>' +
      '<div class="ws">' + T('Create an account or log in to start earning Cashback.') + '</div>' +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn btn-ghost dark" data-action="go-login">' + T('Log In') + '</button>' +
      '<button class="btn btn-primary" data-action="go-signup">' + T('Sign Up') + '</button></div>' +
      '</div>' +
      // 배너 #3 — 익스체인지~포인트처럼 별도 블록(버튼형)으로 분리
      banner(3, 'block') +
      '<div class="m-card">' +
      menuRow('⇅', T('Exchanges')) + menuRow('▤', T('Events')) + menuRow('✦', T('Benefits')) +
      menuRow('▦', T('Cashback Preview')) + menuRow('◈', T('Point')) +
      '</div>' +
      '<div class="m-card">' +
      '<div class="m-row">🎨 <span>' + T('Theme') + '</span><span class="spacer"></span><span class="switch on"><span class="knob"></span></span></div>' +
      '<div class="m-row">🌐 <span>' + T('Language') + '</span><span class="spacer"></span><span class="val">' + T('English') + '</span></div>' +
      '</div>' +
      '<div class="m-card">' + menuRow('ⓘ', T('Terms of Use')) + menuRow('▤', T('Privacy Policy')) + '</div>' +
      '<div class="m-card">' + menuRow('∞', T('About TetherMax')) + menuRow('📢', T('Notices')) + '</div>' +
      '<div class="headset">🎧</div>' +
      '</div>' + phoneClose();
    mountRaw(b);
    onClick('[data-action="go-login"]', function () { go('login'); });
    onClick('[data-action="go-signup"]', function () { toast('회원가입 화면은 이 프로모션 변경 대상이 아닙니다 (프로토타입 범위 외)'); });
    onClick('[data-action="mp-close"]', function () { go('s1'); });
    bindBanner();
  }
  function menuRow(ic, lb) { return '<div class="m-row"><span class="ic">' + ic + '</span><span>' + lb + '</span></div>'; }

  // ======================================================================
  // 마이페이지 (S5) — 데스크톱 대시보드 + 우측 프로필 드로어, 배너 #5
  // ======================================================================
  function renderMypage() {
    var body = '<div class="desktop mypage-desktop">' + siteNav() +
      '<div class="dash">' +
      '<div>' +
      '<div class="bal-card"><span class="coins">🪙</span><div style="flex:1"><div class="b-amt">5,000.50 USDT</div><div class="b-k">' + T('Total Cashback Balance') + '</div></div>' +
      '<button class="btn btn-primary" style="width:auto;padding:9px 16px">' + T('Withdraw') + '</button></div>' +
      '<div class="uid-card"><div class="u-head"><b>' + T('Linked UID') + '</b><span class="link">' + T('See All') + '</span></div>' +
      '<div class="u-row"><span class="exlogo" style="background:' + EX.bitget.color + '">B</span><b>Bitget</b><span class="spacer"></span><b>5,000.50 USDT</b></div>' +
      '<div class="u-sub">● UID 685432171</div>' +
      '<div class="u-more">⊕ ' + T('Using multiple exchanges? Link more UIDs') + '</div></div>' +
      '</div>' +
      '<div>' +
      '<div class="sect-title">' + T('Exclusive For Members') + '</div>' +
      '<div class="ev-grid">' +
      evCard(T('Predict Bitcoin price and win up to 1,000.00 USDT'), '🔮', T('Up to 1,000.00 USDT'), '<span class="ev-badge">' + T('Ongoing') + '</span>') +
      evCard(T('Earn More Cashback. Earn Extra USDT'), '💰', T('Up to 500.00 USDT'), '<span class="ev-badge">' + T('Ongoing') + '</span>') +
      '</div>' +
      '<div class="sect-title" style="margin-top:22px">' + T('Limited Time Offers') + '</div>' +
      '<div class="ev-grid">' +
      evCard(T('Trade to win up to $100K prize pool'), '🏆', '$100,000.00', '<span class="ev-badge count">⏱ ' + T('Ends in') + ' 45 M 37 S</span>', true) +
      evCard(T('Trade to win up to $100K prize pool'), '🏆', '$100,000.00', '<span class="ev-badge count">⏱ ' + T('Ends in') + ' 45 M 37 S</span>', true) +
      '</div>' +
      '</div></div>' +
      '<div class="pm-dim" data-action="mp-dim"></div>' +
      '<div class="pm-drawer">' +
      '<div class="pm-close" data-action="mp-dim">✕</div>' +
      '<div class="pm-avatar">🐯</div>' +
      '<div class="pm-email">abc****@live.com</div>' +
      '<div class="pm-mid">' + T('Member ID: ') + '10047039 ⧉</div>' +
      banner(5, 'left') +
      '<div class="pm-grid">' +
      pmCell('◪', T('Cashback Summary')) + pmCell('✉', T('Invite Friends')) +
      pmCell('▥', T('Cashback Ranking')) + pmCell('★', T('My Coupons')) +
      '</div>' +
      '<div class="pm-list">' +
      '<div class="row">🛡 &nbsp; ' + T('Account Security') + '</div>' +
      '<div class="row">🔔 &nbsp; ' + T('Notification Settings') + '</div></div>' +
      '<div class="pm-list"><div class="row" data-action="logout">⇥ &nbsp; ' + T('Log Out') + '</div></div>' +
      '</div></div>';
    mountDesktop(body);
    bindBanner();
    onClick('[data-action="mp-dim"]', function () { toast('드로어를 닫았습니다 (프로토타입 · 마이페이지 유지)'); });
    onClick('[data-action="logout"]', function () {
      modal('<div class="modal-title">' + T('Log out?') + '</div><div class="modal-sub">' + T('You can log back in anytime.') + '</div><div class="sp16"></div><div class="btn-row"><button class="btn btn-ghost" data-action="lo-cancel">' + T('Cancel') + '</button><button class="btn btn-primary" data-action="lo-ok">' + T('Log Out') + '</button></div>', { center: true });
      onClick('[data-action="lo-cancel"]', closeModal);
      onClick('[data-action="lo-ok"]', function () { closeModal(); state.auth.loggedIn = false; toast('로그아웃'); go('login'); });
    });
  }
  function pmCell(ic, lb) { return '<div class="pm-cell"><span class="ic">' + ic + '</span><span class="lb">' + lb + '</span></div>'; }
  function evCard(title, emoji, rv, badge, dark2) {
    return '<div class="ev-card"><div class="ev-img ' + (dark2 ? 'dark2' : '') + '">' +
      '<span class="ev-tag"><span class="exlogo" style="background:' + EX.bitget.color + '">B</span>Bitget</span>' +
      '<div class="ev-t">' + title + '</div><div class="ev-emoji">' + emoji + '</div></div>' +
      '<div class="ev-foot"><div class="ev-rw"><span>🎁 ' + T('Rewards') + '</span><b>' + rv + '</b></div>' + badge +
      '<button class="btn btn-primary ev-join">' + T('Join Now') + '</button></div></div>';
  }

  // ---------------- WOOX Pro 거래소 상세 페이지 (=CTA 목적지, OI-06) ----------------
  // 트레블룰 배너/CTA 클릭 시 팝업이 아니라 이 페이지로 이동한다.
  function renderWoox() {
    var body = phoneOpen(false) +
      '<div class="appbar"><span class="link" data-action="woox-back" style="text-decoration:none">‹ ' + T('Back') + '</span>' +
      '<div class="brand" style="font-size:15px"><span class="inf">∞</span> WOOX Pro</div><span style="width:40px"></span></div>' +
      '<div class="screen-pad">' +
      '<div class="center"><div class="tr-logo woox" style="height:34px;font-size:16px;border-radius:8px;padding:0 14px;display:inline-flex">WOOX Pro</div>' +
      '<div class="h1" style="margin-top:14px">' + T('WOOX Pro — Lower fees, more cashback') + '</div>' +
      '<div class="muted">' + T('80% cashback on trading fees · Bithumb Travel Rule integrated') + '</div></div>' +
      '<div class="sp16"></div>' +
      '<div class="card"><div class="cmp-row"><span class="lbl">' + T('Cashback rate') + '</span><b class="cmp-win">80%</b></div>' +
      '<div class="cmp-row"><span class="lbl">' + T('Fee discount') + '</span><b>' + T('Applied at checkout') + '</b></div>' +
      '<div class="cmp-row"><span class="lbl">' + T('Travel Rule') + '</span><b>Bithumb ↔ WOOX Pro</b></div></div>' +
      '<div class="sp16"></div><button class="btn btn-primary" data-action="woox-join">' + T('Sign Up for WOOX Pro') + '</button>' +
      '<div class="tiny muted center" style="margin-top:8px">CTA URL = 어드민 온보딩 등록 값 (OI-06)</div>' +
      '</div>' + phoneClose();
    mountRaw(body);
    onClick('[data-action="woox-back"]', function () { go(state.prevScreen || 's1'); });
    onClick('[data-action="woox-join"]', function () { toast('WOOX Pro 가입 (프로토타입)'); });
  }
  function openExchangeEvent() {
    modal('<div class="modal-title">' + T('Bitget Event') + '</div><div class="modal-sub">' + T('Trade to win up to $100K prize pool') + '</div><div class="sp16"></div><button class="btn btn-primary" data-action="ev-go">' + T('Join Event ⧉') + '</button>', { center: true });
    onClick('[data-action="ev-go"]', function () { closeModal(); toast('거래소 이벤트로 이동 (프로토타입)'); });
  }

  // ---------------- 마운트 헬퍼 ----------------
  function mountPhone(inner, dark) { stage().innerHTML = phoneOpen(dark) + inner + phoneClose(); }
  function mountDesktop(inner) { stage().innerHTML = inner; }
  function mountRaw(html) { stage().innerHTML = html; }

  function onClick(sel, fn) {
    function bind(n) { n.addEventListener('click', function (ev) { fn({ currentTarget: n, target: ev.target, nativeEvent: ev }); }); }
    Array.prototype.forEach.call(stage().querySelectorAll(sel), bind);
    Array.prototype.forEach.call(document.getElementById('modal-root').querySelectorAll(sel), bind);
  }

  // ---------------- 라우팅 ----------------
  function go(screen) { state.screen = screen; render(); syncTabs(); }
  function render() {
    closeModal();
    switch (state.screen) {
      case 's1': renderS1(); break;
      case 's2': renderS2(); break;
      case 'login': renderLogin(); break;
      case 'mweb': renderMweb(); break;
      case 'mypage': renderMypage(); break;
      case 'wooxdetail': renderWoox(); break;
    }
    renderDrawer();
  }
  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (n) {
      n.classList.toggle('active', n.getAttribute('data-screen') === state.screen);
    });
  }

  // ---------------- 시나리오 드로어 (개발용·한국어 고정) ----------------
  function renderDrawer() {
    var d = document.getElementById('drawer');
    var a = admin();
    var h = '';
    h += '<div class="d-head"><h3>시나리오 · Scenarios</h3><button class="icon-btn" style="width:30px;height:30px" data-d="close">✕</button></div>';
    h += '<div class="d-sec"><div class="lbl">백오피스 노출 제어 (2026-07-07 정책)</div>';
    h += toggleRow('S1 · WOOX Pro 가상 피드백', 's1Feedback', a.s1Feedback);
    h += toggleRow('S1 · 트레블룰 배너(#2)', 's1Banner', a.s1Banner);
    h += toggleRow('S2 · WOOX Pro 비교 안내', 's2Compare', a.s2Compare);
    h += toggleRow('S2 · 트레블룰 배너(#1)', 's2Banner', a.s2Banner);
    h += toggleRow('로그인 3페이지 트레블룰(#3·4·5)', 'loginBanners', a.loginBanners);
    h += '<div class="hint">D+30·WOOX 이벤트 종속 게이트 <b>폐지</b> → 영역별 on/off로 전면 통제. 별도 <b>백오피스 페이지</b>(../backoffice)와 동일 제어. ⚠️ D+30 폐지는 OI-07 충돌(C레벨 재승인 필요).</div></div>';
    h += '<div class="d-sec"><div class="lbl">S1 · 출금 완료 (기능 1)</div><div class="opts">';
    S1_MODES.forEach(function (m) { h += '<span class="opt ' + (state.s1.mode === m.k ? 'on' : '') + '" data-s1="' + m.k + '">' + m.t + '</span>'; });
    h += '</div><div class="req">선택 REQ: ' + (find(S1_MODES, state.s1.mode).req) + '</div></div>';
    h += '<div class="d-sec"><div class="lbl">S2 · 캐시백 프리뷰 (기능 2)</div><div class="opts">';
    S2_MODES.forEach(function (m) { h += '<span class="opt ' + (state.s2.mode === m.k ? 'on' : '') + '" data-s2="' + m.k + '">' + m.t + '</span>'; });
    h += '</div><div style="margin-top:8px" class="opts">';
    ['bitget', 'zoomex', 'bitmart'].forEach(function (x) { h += '<span class="opt ' + (state.s2.exchange === x ? 'on' : '') + '" data-s2ex="' + x + '">' + EX[x].name + '</span>'; });
    h += '</div>';
    h += toggleRow('OI-10 경고 표시', 's2oi10', state.s2.oi10);
    h += '<div class="req">선택 REQ: ' + (find(S2_MODES, state.s2.mode).req) + '</div></div>';
    h += '<div class="d-sec"><div class="lbl">인증 상태</div><div class="hint">로그인: <b>' + (state.auth.loggedIn ? '됨' : '안됨') + '</b> · 로그인 화면에서 wrong@test.com / wrong 입력 시 자격 에러 재현</div></div>';
    h += '<div class="d-sec"><div class="hint">배너 5위치: #1 S2하단 · #2 S1 · #3 모바일-로그인전(Log In/Sign Up 아래) · #4 PC로그인상단 · #5 마이페이지 회원ID하단. 각 위치는 위 백오피스 on/off로 제어(#3·4·5는 일괄).</div></div>';
    d.innerHTML = h;
    d.querySelector('[data-d="close"]').addEventListener('click', function () { d.classList.remove('open'); });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s1]'), function (n) { n.onclick = function () { state.s1.mode = n.getAttribute('data-s1'); render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s2]'), function (n) { n.onclick = function () { state.s2.mode = n.getAttribute('data-s2'); state.s2.collapsed = false; render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s2ex]'), function (n) { n.onclick = function () { state.s2.exchange = n.getAttribute('data-s2ex'); render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-tg]'), function (n) {
      n.onclick = function () {
        var key = n.getAttribute('data-tg');
        if (key === 's2oi10') state.s2.oi10 = !state.s2.oi10;
        else setAdmin(key, !admin()[key]); // 백오피스 on/off (localStorage 공유)
        render();
      };
    });
  }
  function toggleRow(label, key, on) {
    return '<div class="toggle"><span>' + label + '</span><span class="switch ' + (on ? 'on' : '') + '" data-tg="' + key + '"><span class="knob"></span></span></div>';
  }
  function find(arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i].k === k) return arr[i]; return { req: '-' }; }

  // ---------------- 초기화 ----------------
  document.getElementById('tabs').addEventListener('click', function (e) {
    var t = e.target.closest('.tab'); if (t) go(t.getAttribute('data-screen'));
  });
  document.getElementById('fab').addEventListener('click', function () { document.getElementById('drawer').classList.add('open'); });
  document.getElementById('btn-drawer').addEventListener('click', function () { document.getElementById('drawer').classList.toggle('open'); });

  // 한/영 토글
  var langBtn = document.getElementById('btn-lang');
  if (langBtn) {
    langBtn.textContent = window.__LANG === 'en' ? '한국어' : 'EN';
    langBtn.addEventListener('click', function () {
      window.setLang(window.__LANG === 'en' ? 'ko' : 'en');
      langBtn.textContent = window.__LANG === 'en' ? '한국어' : 'EN';
      render();
    });
  }

  // 백오피스 페이지에서 on/off 변경 시(다른 탭) 실시간 반영
  window.addEventListener('storage', function (e) { if (e.key === ADMIN_KEY) render(); });

  go('s1');
})();
