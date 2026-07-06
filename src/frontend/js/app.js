/*
 * app.js — WOOX Pro 온보딩 프로모션 클릭 프로토타입 (화면·배너·모달·에러·시나리오)
 * 화면: S1(출금 완료)·S2(캐시백 프리뷰)·로그인·회원가입·마이페이지
 * 정책 근거: 서비스기획서(손실회피 넛지·강압없는 신뢰형), 요구사항정의서(REQ/NFR),
 *            기능명세서_FE/BE (상태·예외·산식). 내부 수치는 화면 비노출.
 */
(function () {
  'use strict';
  var API = window.MockAPI;
  var EX = API.EXCHANGES;

  // ---------------- 전역 상태 ----------------
  var state = {
    screen: 's1',
    env: { withinD30: true, event1Terminated: false, event2Terminated: false, simulateStatusError: false },
    s1: { mode: 'feedback', dismissed: false },
    s2: { exchange: 'bitget', mode: 'comparison', collapsed: false, oi10: false },
    auth: { loggedIn: false },
  };

  // 시나리오 정의(드로어)
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
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(function () { w.removeChild(t); }, 3100);
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

  // 상태 조회(프로모션 활성)
  function status() { return API.getStatus(state.env).data; }

  // ---------------- 트레블룰 배너 (기능 3) ----------------
  // 로고=하드코딩 이미지 자리표시, 문구="Travel Rule Integration"(i18n). 로고 앞→문구 뒤 고정. 클릭 없음.
  function banner(pos) {
    if (!status().active) return ''; // 공통 종료 게이트: 비활성 시 미노출
    return '<div class="tr-wrap"><div class="tr-banner" title="트레블룰 배너 위치 #' + pos + ' (정적·클릭 없음)">' +
      '<span class="logos"><span class="tr-logo bithumb">Bithumb</span><span class="tr-logo woox">WOOX Pro</span></span>' +
      '<span class="txt">Travel Rule Integration</span></div></div>';
  }

  // ---------------- 공통 조각 ----------------
  function statusbar(dark) {
    return '<div class="statusbar"><span>9:41</span><span class="sig">▪▪▪ &#128246; &#128267;</span></div>';
  }
  function phoneOpen(dark) { return '<div class="phone ' + (dark ? 'dark' : '') + '">' + statusbar(dark) + '<div class="phone-body">'; }
  function phoneClose() { return '</div></div>'; }

  // ======================================================================
  // S1 — 출금 완료 화면 (기능 1 + 배너 #2)
  // ======================================================================
  function renderS1() {
    var m = state.s1.mode;
    var body = '';
    var active = status().active;

    // 상단 출금 완료 요약
    body += '<div class="appbar"><div class="brand"><span class="inf">∞</span> TetherMax</div>' +
      '<div class="icons">◍ ≡</div></div>';
    body += '<div class="screen-pad">';
    body += '<div class="center"><div style="font-size:44px;color:#16a34a">✓</div>' +
      '<div class="h1" style="margin-top:0">Withdrawal Complete</div>' +
      '<div class="muted">1,000 USDT · Bitget</div></div><div class="sp16"></div>';

    // 광고 영역 분기
    if (!active) {
      body += sectionLabel('프로모션 종료 → 원 base 이벤트(진행 중 거래소 이벤트 임의 1개)');
      body += eventAd('base');
    } else if (m === 'feedback' || m === 'multi') {
      var res = API.withdrawalFeedback(state.env, {
        wooxIncluded: false,
        uids: m === 'multi'
          ? [{ exchange: 'bitget', actualPayback: 54 }, { exchange: 'zoomex', actualPayback: 36 }]
          : [{ exchange: 'bitget', actualPayback: 54 }]
      });
      if (res.data && res.data.visible) body += feedbackCard(res.data);
      else { body += sectionLabel('visible=false → base 폴백'); body += eventAd('base'); }
    } else if (m === 'adverse') {
      var r2 = API.withdrawalFeedback(state.env, { wooxIncluded: false, uids: [{ exchange: 'superx', actualPayback: 60 }] });
      body += sectionLabel('역효과(타 거래소 토탈세이빙 ≥ WOOX) → 미노출, base 폴백');
      body += eventAd('base');
    } else if (m === 'woox_event' || m === 'onboarding_event' || m === 'house_ad') {
      var r3 = API.withdrawalFeedback(state.env, { wooxIncluded: true, eventTier: m });
      body += sectionLabel('WOOX Pro 포함 → 이벤트 분기: ' + m);
      body += eventAd(r3.data.eventType);
    } else if (m === 'error') {
      body += sectionLabel('가상 피드백 API 실패(500) → base 이벤트 폴백');
      body += eventAd('base');
    }

    // 트레블룰 배너 #2 (결과 카드 영역 바깥 하단)
    body += banner(2);
    body += '</div>';

    mountPhone(body, false);
    wireS1();
  }

  function sectionLabel(t) { return '<div class="tag-note">· ' + t + ' ·</div><div class="sp8"></div>'; }

  function feedbackCard(d) {
    var basis = 'Based on standard user / base tier' + (d.exchangeCount > 1 ? ' · ' + d.exchangeCount + ' exchanges' : '');
    return '<div class="feedback">' +
      '<span class="badge">WOOX Pro</span>' +
      '<div class="headline">If you\'d used WOOX Pro for this withdrawal, you could have saved ' +
      '<span class="amount">+' + fmt(d.savingAmount) + ' USDT (' + d.savingPercentPoint + '%p)</span> more in fees</div>' +
      '<div class="sub">Fee differences add up to more than you\'d expect.</div>' +
      '<div class="cta" data-action="s1-compare">View WOOX Pro Fee Comparison ›</div>' +
      '<div class="basis">' + basis + '</div>' +
      '</div>';
  }

  function eventAd(type) {
    var title = 'Trade to win up to $100K prize pool', tag = 'Bitget', color = EX.bitget.color;
    if (type === 'woox_event') { title = 'WOOX Pro Launch Event · Up to 100 USDT'; tag = 'WOOX Pro'; color = EX.wooxpro.color; }
    else if (type === 'onboarding_event') { title = 'TetherMax × WOOX Pro Onboarding Event'; tag = 'TetherMax'; color = '#1d4ed8'; }
    else if (type === 'house_ad') { title = 'Earn cashback on every trade with TetherMax'; tag = 'TetherMax'; color = '#1d4ed8'; }
    return '<div class="center"><div class="h2" style="text-align:center">Explore This Limited-Time Event</div></div>' +
      '<div class="event-ad" style="--c:' + color + '">' +
      '<span class="ex-tag"><span class="exlogo" style="background:' + color + '">' + tag.charAt(0) + '</span>' + tag + '</span>' +
      '<div class="ev-title">' + title + '</div><div class="trophy">🏆</div></div>' +
      '<div class="sp12"></div>' +
      '<div class="btn-row"><button class="btn btn-ghost" data-action="event-close">Close</button>' +
      '<button class="btn btn-primary" data-action="event-learnmore" data-type="' + type + '">Learn more</button></div>';
  }

  function wireS1() {
    onClick('[data-action="s1-compare"]', function () { openWooxDetail(); });
    onClick('[data-action="event-learnmore"]', function (e) {
      var t = e.currentTarget.getAttribute('data-type');
      if (t === 'woox_event' || t === 'onboarding_event') openWooxDetail();
      else openExchangeEvent();
    });
    onClick('[data-action="event-close"]', function () { toast('이벤트를 닫았습니다 (프로토타입)'); });
  }

  // ======================================================================
  // S2 — 캐시백 프리뷰 결과 (기능 2 + 배너 #1)
  // ======================================================================
  function monthly(exKey, p) {
    var x = EX[exKey], TIME = API.TIME_MAP[p.freq];
    var mk = p.makerRatio / 100, tk = p.takerRatio / 100;
    var baseK = p.balance * p.leverage * TIME * 2 * 30;
    var fees = baseK * (x.makerFee * (1 - x.discount) * mk + x.takerFee * (1 - x.discount) * tk);
    var cashback = fees * x.payback * 0.7;
    return { fees: fees, cashback: cashback };
  }

  function renderS2() {
    var s = state.s2;
    var exKey = s.mode === 'woox_selected' ? 'wooxpro' : (s.mode === 'err404' ? 'ghost' : s.exchange);
    var exView = EX[exKey] || { name: 'Unknown', payback: 0, color: '#999' };
    var params = { balance: 1000, leverage: 1, makerRatio: 20, takerRatio: 80, freq: '1_2' };
    if (s.mode === 'err400') params.takerRatio = 70; // 합 90 → 400

    var body = '';
    body += '<div class="appbar"><div class="brand"><span class="inf">∞</span> TetherMax</div><div class="icons">◍ ≡</div></div>';
    body += '<div class="screen-pad">';
    body += '<div class="center h1" style="line-height:1.25">You\'re all set.<br/>Here\'s your summary.</div><div class="sp16"></div>';

    // 요약 카드
    var sum = (EX[exKey] && exKey !== 'ghost') ? monthly(exKey, params) : { fees: 0, cashback: 0 };
    body += '<div class="card">' +
      '<div class="field-row"><span class="muted">Exchange</span><span><span class="exlogo" style="background:' + exView.color + '">' + (exView.name || '?').charAt(0) + '</span> ' + exView.name + '</span></div></div>' +
      '<div class="sp12"></div>' +
      '<div class="grid2">' +
      stat('Account balance', params.balance.toFixed(2) + ' USDT') + stat('Leverage', params.leverage + 'x') +
      stat('Order Type Ratio', params.makerRatio + '% Maker / ' + params.takerRatio + '% Taker') +
      stat('Trading frequency', '1-2 trades a day') + '</div><div class="sp12"></div>';

    body += '<div class="card" style="border-color:#c9d6f5">' +
      '<div class="field-row"><span class="muted">Trading Fees</span><b>' + fmt(sum.fees) + ' USDT/mo</b></div>' +
      '<div class="field-row"><span class="muted">× Cashback Rate</span><b>× ' + Math.round(exView.payback * 100) + '%</b></div>' +
      '<hr style="border:none;border-top:1px solid var(--border)"/>' +
      '<div class="field-row"><b>Cashback</b><b style="color:var(--brand)">' + fmt(sum.cashback) + ' USDT/mo*</b></div>' +
      '<div class="tiny muted">*Calculated based on paid trading fees</div></div>';

    // OI-10 개발 경고(옵션)
    if (s.oi10) body += '<div class="inline-warn">⚠︎ [개발용] 어드민 "테더맥스 적용" 이중곱 버그(OI-10) 미수정 상태 — 비교 숫자 정확도 미보장. 런칭 전 선행 수정 필요.</div>';

    // 기능 2: 인라인 비교 카드
    var cmp = API.cashbackCompare(state.env, {
      exchange: exKey, balance: params.balance, leverage: params.leverage,
      makerRatio: params.makerRatio, takerRatio: params.takerRatio,
      dailyTradeFrequency: params.freq, forceError: s.mode === 'err500',
      unsupported: s.mode === 'unsupported'
    });

    if (cmp.status === 'error') {
      // 400/404/500 → 카드 미삽입, 결과 화면만 + 토스트
      body += '<div class="tag-note">비교 카드 미삽입 (에러 ' + cmp.httpStatus + ')</div>';
      setTimeout(function () { toast('[' + cmp.httpStatus + ' ' + cmp.code + '] ' + (cmp.message || ''), 'err'); }, 60);
    } else if (cmp.data.visible) {
      body += compareCard(exView, cmp.data);
    } else {
      var reasonMap = { adverse: '역효과(현재 거래소가 유리) → 비교 카드 미노출', unsupported: 'WOOX Pro 미지원 조건 → 미노출', woox_selected: '이미 WOOX Pro 선택 → API 미호출·카드 없음', inactive: '프로모션 종료 → 미노출' };
      body += '<div class="tag-note">' + (reasonMap[cmp.data.reason] || '미노출') + '</div>';
    }

    // Payout Details (참고 S2)
    body += payoutDetails(exView.name);
    body += '<div class="sp12"></div>';
    body += '<div class="btn-row"><button class="btn btn-ghost" style="flex:0 0 54px" data-action="s2-reset">↻</button>' +
      '<button class="btn btn-primary" data-action="s2-start-current" data-ex="' + exView.name + '">Start ' + exView.name + ' Cashback ⧉</button></div>';

    // 트레블룰 배너 #1 (결과 페이지 하단)
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
      '<span class="t">You\'re losing out with your current exchange</span>' +
      '<span class="chev">▾</span></div>' +
      '<div class="c-body">' +
      '<div class="cmp-row"><span class="lbl">' + exView.name + ' · est. cashback</span><span class="val">' + fmt(d.currentExchangeEstimate) + ' USDT/mo</span></div>' +
      '<div class="cmp-row"><span class="lbl">WOOX Pro · est. cashback</span><span class="val cmp-win">' + fmt(d.wooxProEstimate) + ' USDT/mo</span></div>' +
      '<div class="save-hl">With WOOX Pro you\'d get <span class="big">+' + fmt(d.savingAmount) + ' USDT/mo</span> (' + d.savingPercentPoint + '%p)</div>' +
      '<div class="sp12"></div>' +
      '<button class="btn btn-primary" data-action="s2-start">Start with WOOX Pro</button>' +
      '<div class="basis-note">standard user / base tier basis · collapse available (no forced close)</div>' +
      '</div></div>';
  }

  function payoutDetails(exName) {
    return '<div class="payout"><b>Payout Details</b><div class="steps">' +
      '<div class="step"><span class="ic">🕒</span><div class="s-k">Schedule</div><div class="s-v">Daily</div></div>' +
      '<div class="dash"></div>' +
      '<div class="step"><span class="ic">$</span><div class="s-k">Payout Time</div><div class="s-v">07:00</div></div>' +
      '<div class="dash"></div>' +
      '<div class="step"><span class="ic">📍</span><div class="s-k">Destination</div><div class="s-v">TetherMax</div></div>' +
      '</div></div>';
  }

  function wireS2() {
    onClick('[data-action="s2-collapse"]', function () { state.s2.collapsed = !state.s2.collapsed; renderS2(); });
    onClick('[data-action="s2-start"]', function () { openWooxDetail(); });
    onClick('[data-action="s2-start-current"]', function (e) { toast(e.currentTarget.getAttribute('data-ex') + ' 캐시백 시작 (기존 흐름·프로토타입)'); });
    onClick('[data-action="s2-reset"]', function () { toast('입력 초기화 (프로토타입)'); });
  }

  // ======================================================================
  // 로그인 / 회원가입 (데스크톱) — 배너 #3·#4
  // ======================================================================
  function siteNav() {
    return '<div class="site-nav"><div class="brand"><span class="inf">∞</span> TetherMax</div>' +
      '<span class="navlink">Exchanges</span><span class="navlink">Events</span><span class="navlink">Benefits</span>' +
      '<span class="navlink">Cashback Preview</span><span class="navlink">Point</span><span class="spacer"></span>' +
      '<button class="btn btn-ghost" style="width:auto;padding:9px 16px" data-action="go-login">Login</button>' +
      '<button class="btn btn-primary" style="width:auto;padding:9px 16px" data-action="go-signup">Sign Up</button></div>';
  }

  function renderLogin() {
    var body = '<div class="desktop">' + siteNav() +
      '<div style="padding:40px 20px">' +
      // 배너 #4 (PC 로그인 상단)
      banner(4) +
      '<div class="h1">Hi, welcome back!</div>' +
      '<div class="form">' +
      '<div class="card" style="background:var(--surface-2);border:none;display:flex;align-items:center;gap:12px">' +
      '<div><div class="muted tiny">Log in now to complete missions</div><b style="color:var(--brand)">to earn more USDT</b></div></div>' +
      '<div class="sp16"></div>' +
      '<input class="input" id="lg-email" placeholder="Email" />' +
      '<div id="lg-email-err"></div><div class="sp12"></div>' +
      '<input class="input" id="lg-pw" type="password" placeholder="Password" />' +
      '<div id="lg-pw-err"></div>' +
      '<div class="sp12"></div><span class="link" data-action="forgot">Forgot Password?</span>' +
      '<div id="lg-cred-err"></div>' +
      '<div class="sp24"></div>' +
      '<button class="btn btn-primary" data-action="login-submit">Continue</button>' +
      '<div class="sp16"></div><div class="center">Don\'t have an account? <span class="link" data-action="go-signup">Sign Up Now</span></div>' +
      '</div></div></div>';
    mountDesktop(body);
    wireAuth();
  }

  function renderSignup() {
    var body = '<div class="desktop">' + siteNav() +
      '<div style="padding:40px 20px">' +
      '<div class="h1">Create Account</div>' +
      '<div class="center muted">We\'ll send you a code to verify this email</div><div class="sp16"></div>' +
      '<div class="form">' +
      '<div class="card" style="background:var(--surface-2);border:none">Sign up and trade to earn rewards <b style="color:var(--brand)">up to 100 USDT</b> 🎁</div>' +
      '<div class="sp16"></div>' +
      '<input class="input" id="su-email" placeholder="Email" />' +
      '<div id="su-email-err"></div><div class="sp12"></div>' +
      '<input class="input" id="su-pw" type="password" placeholder="Password" />' +
      '<div id="su-pw-err"></div><div class="sp12"></div>' +
      '<input class="input" id="su-ref" placeholder="Referral Code (optional)" />' +
      '<div class="sp16"></div>' +
      '<label class="checkbox-row"><input type="checkbox" id="su-terms" /> <span>I have read and agree to the <span class="link">Terms of Use</span> and <span class="link">Privacy Policy</span></span></label>' +
      '<div class="sp16"></div>' +
      '<button class="btn btn-primary" id="su-btn" data-action="signup-submit" disabled>Continue</button>' +
      '<div class="sp16"></div><div class="center">Already have an account? <span class="link" data-action="go-login">Log in</span></div>' +
      '</div></div></div>';
    mountDesktop(body);
    wireAuth();
    // 실시간 검증(약관+필드) → Continue 활성화
    ['su-email', 'su-pw', 'su-terms'].forEach(function (id) {
      var e = document.getElementById(id);
      e.addEventListener('input', signupValidate); e.addEventListener('change', signupValidate);
    });
  }

  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function signupValidate() {
    var email = $('#su-email').value.trim(), pw = $('#su-pw').value, terms = $('#su-terms').checked;
    var ok = isEmail(email) && pw.length >= 8 && terms;
    $('#su-btn').disabled = !ok;
  }

  function wireAuth() {
    onClick('[data-action="go-login"]', function () { go('login'); });
    onClick('[data-action="go-signup"]', function () { go('signup'); });
    onClick('[data-action="forgot"]', function () {
      modal('<div class="modal-title">Reset your password</div><div class="modal-sub">We\'ll email a reset link if the account exists.</div><div class="sp16"></div><input class="input" placeholder="Email" /><div class="sp16"></div><button class="btn btn-primary" data-action="forgot-send">Send reset link</button>', { center: true });
      onClick('[data-action="forgot-send"]', function () { closeModal(); toast('비밀번호 재설정 링크를 보냈습니다(있는 계정일 경우).'); });
    });
    onClick('[data-action="login-submit"]', function () {
      clearErr(['lg-email-err', 'lg-pw-err', 'lg-cred-err']);
      var email = $('#lg-email').value.trim(), pw = $('#lg-pw').value, bad = false;
      if (!email) { setErr('lg-email-err', 'Enter your email.'); markErr('lg-email'); bad = true; }
      else if (!isEmail(email)) { setErr('lg-email-err', 'Invalid email format.'); markErr('lg-email'); bad = true; }
      if (!pw) { setErr('lg-pw-err', 'Enter your password.'); markErr('lg-pw'); bad = true; }
      if (bad) return;
      if (email === 'wrong@test.com' || pw === 'wrong') { setErr('lg-cred-err', 'Email or password is incorrect.'); return; }
      state.auth.loggedIn = true; toast('로그인 성공'); go('mypage');
    });
    onClick('[data-action="signup-submit"]', function () {
      clearErr(['su-email-err', 'su-pw-err']);
      var email = $('#su-email').value.trim(), pw = $('#su-pw').value, bad = false;
      if (!isEmail(email)) { setErr('su-email-err', 'Invalid email format.'); markErr('su-email'); bad = true; }
      if (pw.length < 8) { setErr('su-pw-err', 'Password must be at least 8 characters.'); markErr('su-pw'); bad = true; }
      if (bad) return;
      modal('<div class="modal-title">Verify your email</div><div class="modal-sub">We sent a 6-digit code to ' + email + '</div><div class="sp16"></div><input class="input" placeholder="6-digit code" maxlength="6" /><div class="sp16"></div><button class="btn btn-primary" data-action="verify-ok">Verify & Continue</button>', { center: true });
      onClick('[data-action="verify-ok"]', function () { closeModal(); state.auth.loggedIn = true; toast('가입 완료'); go('mypage'); });
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
      '<div class="wt">Welcome to TetherMax!</div>' +
      '<div class="ws">Create an account or log in to start earning Cashback.</div>' +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn btn-ghost dark" data-action="go-login">Log In</button>' +
      '<button class="btn btn-primary" data-action="go-signup">Sign Up</button></div>' +
      // 배너 #3 (Log In/Sign Up 버튼 바로 아래). 프로모션 종료 시 자동 미노출.
      banner(3) +
      '</div>' +
      '<div class="m-card">' +
      menuRow('⇅', 'Exchanges') + menuRow('▤', 'Events') + menuRow('✦', 'Benefits') +
      menuRow('▦', 'Cashback Preview') + menuRow('◈', 'Point') +
      '</div>' +
      '<div class="m-card">' +
      '<div class="m-row">🎨 <span>Theme</span><span class="spacer"></span><span class="switch on"><span class="knob"></span></span></div>' +
      '<div class="m-row">🌐 <span>Language</span><span class="spacer"></span><span class="val">English</span></div>' +
      '</div>' +
      '<div class="m-card">' + menuRow('ⓘ', 'Terms of Use') + menuRow('▤', 'Privacy Policy') + '</div>' +
      '<div class="m-card">' + menuRow('∞', 'About TetherMax') + menuRow('📢', 'Notices') + '</div>' +
      '<div class="headset">🎧</div>' +
      '</div>' + phoneClose();
    mountRaw(b);
    onClick('[data-action="go-login"]', function () { go('login'); });
    onClick('[data-action="go-signup"]', function () { go('signup'); });
    onClick('[data-action="mp-close"]', function () { go('s1'); });
  }
  function menuRow(ic, lb) { return '<div class="m-row"><span class="ic">' + ic + '</span><span>' + lb + '</span></div>'; }

  // ======================================================================
  // 마이페이지 (S5) — 데스크톱 대시보드 + 우측 프로필 드로어, 배너 #5(회원 ID 하단)
  // ======================================================================
  function renderMypage() {
    var body = '<div class="desktop mypage-desktop">' + siteNav() +
      // 배경 대시보드 (딤 처리됨)
      '<div class="dash">' +
      '<div>' +
      '<div class="bal-card"><span class="coins">🪙</span><div style="flex:1"><div class="b-amt">5,000.50 USDT</div><div class="b-k">Total Cashback Balance</div></div>' +
      '<button class="btn btn-primary" style="width:auto;padding:9px 16px">Withdraw</button></div>' +
      '<div class="uid-card"><div class="u-head"><b>Linked UID</b><span class="link">See All</span></div>' +
      '<div class="u-row"><span class="exlogo" style="background:' + EX.bitget.color + '">B</span><b>Bitget</b><span class="spacer"></span><b>5,000.50 USDT</b></div>' +
      '<div class="u-sub">● UID 685432171</div>' +
      '<div class="u-more">⊕ Using multiple exchanges? Link more UIDs</div></div>' +
      '</div>' +
      '<div>' +
      '<div class="sect-title">Exclusive For Members</div>' +
      '<div class="ev-grid">' +
      evCard('Predict Bitcoin price and win up to 1,000.00 USDT', '🔮', 'Rewards', 'Up to 1,000.00 USDT', '<span class="ev-badge">Ongoing</span>') +
      evCard('Earn More Cashback. Earn Extra USDT', '💰', 'Rewards', 'Up to 500.00 USDT', '<span class="ev-badge">Ongoing</span>') +
      '</div>' +
      '<div class="sect-title" style="margin-top:22px">Limited Time Offers</div>' +
      '<div class="ev-grid">' +
      evCard('Trade to win up to $100K prize pool', '🏆', 'Rewards', '$100,000.00', '<span class="ev-badge count">⏱ Ends in 45 M 37 S</span>', true) +
      evCard('Trade to win up to $100K prize pool', '🏆', 'Rewards', '$100,000.00', '<span class="ev-badge count">⏱ Ends in 45 M 37 S</span>', true) +
      '</div>' +
      '</div></div>' +
      // 딤 + 우측 프로필 드로어
      '<div class="pm-dim" data-action="mp-dim"></div>' +
      '<div class="pm-drawer">' +
      '<div class="pm-close" data-action="mp-dim">✕</div>' +
      '<div class="pm-avatar">🐯</div>' +
      '<div class="pm-email">abc****@live.com</div>' +
      '<div class="pm-mid">Member ID: 10047039 ⧉</div>' +
      // 배너 #5 (회원 ID 바로 아래)
      banner(5) +
      '<div class="pm-grid">' +
      pmCell('◪', 'Cashback Summary') + pmCell('✉', 'Invite Friends') +
      pmCell('▥', 'Cashback Ranking') + pmCell('★', 'My Coupons') +
      '</div>' +
      '<div class="pm-list">' +
      '<div class="row">🛡 &nbsp; Account Security</div>' +
      '<div class="row">🔔 &nbsp; Notification Settings</div></div>' +
      '<div class="pm-list"><div class="row" data-action="logout">⇥ &nbsp; Log Out</div></div>' +
      '</div></div>';
    mountDesktop(body);
    onClick('[data-action="mp-dim"]', function () { toast('드로어를 닫았습니다 (프로토타입 · 마이페이지 유지)'); });
    onClick('[data-action="logout"]', function () {
      modal('<div class="modal-title">Log out?</div><div class="modal-sub">You can log back in anytime.</div><div class="sp16"></div><div class="btn-row"><button class="btn btn-ghost" data-action="lo-cancel">Cancel</button><button class="btn btn-primary" data-action="lo-ok">Log Out</button></div>', { center: true });
      onClick('[data-action="lo-cancel"]', closeModal);
      onClick('[data-action="lo-ok"]', function () { closeModal(); state.auth.loggedIn = false; toast('로그아웃'); go('login'); });
    });
  }
  function pmCell(ic, lb) { return '<div class="pm-cell"><span class="ic">' + ic + '</span><span class="lb">' + lb + '</span></div>'; }
  function evCard(title, emoji, rk, rv, badge, dark2) {
    return '<div class="ev-card"><div class="ev-img ' + (dark2 ? 'dark2' : '') + '">' +
      '<span class="ev-tag"><span class="exlogo" style="background:' + EX.bitget.color + '">B</span>Bitget</span>' +
      '<div class="ev-t">' + title + '</div><div class="ev-emoji">' + emoji + '</div></div>' +
      '<div class="ev-foot"><div class="ev-rw"><span>🎁 ' + rk + '</span><b>' + rv + '</b></div>' + badge +
      '<button class="btn btn-primary ev-join">Join Now</button></div></div>';
  }

  // ---------------- WOOX Pro 상세(=CTA 목적지, OI-06) ----------------
  function openWooxDetail() {
    modal('<div class="center"><span class="tr-logo woox" style="height:26px;font-size:14px">WOOX Pro</span></div>' +
      '<div class="modal-title" style="margin-top:12px">WOOX Pro — Lower fees, more cashback</div>' +
      '<div class="modal-sub">80% cashback on trading fees · Bithumb Travel Rule integrated</div>' +
      '<div class="sp16"></div>' +
      '<div class="card"><div class="cmp-row"><span class="lbl">Cashback rate</span><b class="cmp-win">80%</b></div>' +
      '<div class="cmp-row"><span class="lbl">Fee discount</span><b>Applied at checkout</b></div>' +
      '<div class="cmp-row"><span class="lbl">Travel Rule</span><b>Bithumb integrated</b></div></div>' +
      '<div class="sp16"></div><button class="btn btn-primary" data-action="woox-go">Start with WOOX Pro ⧉</button>' +
      '<div class="tiny muted center" style="margin-top:8px">CTA URL = 어드민 온보딩 등록 값 (OI-06)</div>', { center: true });
    onClick('[data-action="woox-go"]', function () { closeModal(); toast('WOOX Pro 상세 페이지로 이동 (프로토타입)'); });
  }
  function openExchangeEvent() {
    modal('<div class="modal-title">Bitget Event</div><div class="modal-sub">Trade to win up to $100K prize pool</div><div class="sp16"></div><button class="btn btn-primary" data-action="ev-go">Join Event ⧉</button>', { center: true });
    onClick('[data-action="ev-go"]', function () { closeModal(); toast('거래소 이벤트로 이동 (프로토타입)'); });
  }

  // ---------------- 마운트 헬퍼 ----------------
  function mountPhone(inner, dark) { stage().innerHTML = phoneOpen(dark) + inner + phoneClose(); }
  function mountDesktop(inner) { stage().innerHTML = inner; }
  function mountRaw(html) { stage().innerHTML = html; }

  function onClick(sel, fn) {
    // strict 모드에서 실제 이벤트의 currentTarget은 읽기 전용이므로 합성 객체를 전달한다.
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
      case 'signup': renderSignup(); break;
      case 'mweb': renderMweb(); break;
      case 'mypage': renderMypage(); break;
    }
    renderDrawer();
  }
  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.classList.toggle('active', t.getAttribute('data-screen') === state.screen);
    });
  }

  // ---------------- 시나리오 드로어 ----------------
  function renderDrawer() {
    var d = document.getElementById('drawer');
    var e = state.env;
    var promoActive = status().active;
    var h = '';
    h += '<div class="d-head"><h3>시나리오 · Scenarios</h3><button class="icon-btn" style="width:30px;height:30px" data-d="close">✕</button></div>';

    // 프로모션 게이트
    h += '<div class="d-sec"><div class="lbl">프로모션 게이트 (F-005 · REQ-020)</div>';
    h += toggleRow('D+30 이내', 'withinD30', e.withinD30);
    h += toggleRow('WOOX 이벤트 1 종료', 'event1Terminated', e.event1Terminated);
    h += toggleRow('WOOX 이벤트 2 종료', 'event2Terminated', e.event2Terminated);
    h += toggleRow('상태 API 장애(안전=비활성)', 'simulateStatusError', e.simulateStatusError);
    h += '<div class="hint">현재 프로모션: <b style="color:' + (promoActive ? '#34d399' : '#f87171') + '">' + (promoActive ? '활성' : '비활성(종료)') + '</b> · OR 로직·D+30. 비활성이면 3기능 일괄 base 롤백.</div></div>';

    // S1
    h += '<div class="d-sec"><div class="lbl">S1 · 출금 완료 (기능 1)</div><div class="opts">';
    S1_MODES.forEach(function (m) { h += '<span class="opt ' + (state.s1.mode === m.k ? 'on' : '') + '" data-s1="' + m.k + '">' + m.t + '</span>'; });
    h += '</div><div class="req">선택 REQ: ' + (find(S1_MODES, state.s1.mode).req) + '</div></div>';

    // S2
    h += '<div class="d-sec"><div class="lbl">S2 · 캐시백 프리뷰 (기능 2)</div><div class="opts">';
    S2_MODES.forEach(function (m) { h += '<span class="opt ' + (state.s2.mode === m.k ? 'on' : '') + '" data-s2="' + m.k + '">' + m.t + '</span>'; });
    h += '</div>';
    h += '<div style="margin-top:8px" class="opts">';
    ['bitget', 'zoomex', 'bitmart'].forEach(function (x) { h += '<span class="opt ' + (state.s2.exchange === x ? 'on' : '') + '" data-s2ex="' + x + '">' + EX[x].name + '</span>'; });
    h += '</div>';
    h += toggleRow('OI-10 경고 표시', 's2oi10', state.s2.oi10);
    h += '<div class="req">선택 REQ: ' + (find(S2_MODES, state.s2.mode).req) + '</div></div>';

    // 인증
    h += '<div class="d-sec"><div class="lbl">인증 상태</div>';
    h += '<div class="hint">로그인: <b>' + (state.auth.loggedIn ? '됨' : '안됨') + '</b> · 로그인 화면에서 wrong@test.com / wrong 입력 시 자격 에러 재현</div></div>';

    h += '<div class="d-sec"><div class="hint">배너 5위치: #1 S2하단 · #2 S1 · #3 모바일-로그인전(Log In/Sign Up 아래) · #4 PC로그인상단 · #5 마이페이지 회원ID하단. 프로모션 종료 시 전부 미노출.</div></div>';

    d.innerHTML = h;

    // 드로어 이벤트
    d.querySelector('[data-d="close"]').addEventListener('click', function () { d.classList.remove('open'); });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s1]'), function (n) { n.onclick = function () { state.s1.mode = n.getAttribute('data-s1'); render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s2]'), function (n) { n.onclick = function () { state.s2.mode = n.getAttribute('data-s2'); state.s2.collapsed = false; render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-s2ex]'), function (n) { n.onclick = function () { state.s2.exchange = n.getAttribute('data-s2ex'); render(); }; });
    Array.prototype.forEach.call(d.querySelectorAll('[data-tg]'), function (n) {
      n.onclick = function () {
        var key = n.getAttribute('data-tg');
        if (key === 's2oi10') state.s2.oi10 = !state.s2.oi10;
        else state.env[key] = !state.env[key];
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

  go('s1');
})();
