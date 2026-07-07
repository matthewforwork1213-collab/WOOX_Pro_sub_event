/*
 * i18n.js — 한/영 전환 사전. 기본 EN(참고 화면과 동일), 토글 시 KO.
 * t(englishString) 는 KO 모드에서 사전에 있으면 번역, 없으면 원문(영문) 반환.
 * 사전은 "영문 원문 → 한국어" 키로 관리한다.
 */
(function (g) {
  'use strict';
  var KO = {
    // ---- 트레블룰 배너 (기능 3, 스펙 정의) ----
    'Travel Rule Integration': '트레블룰 연동',

    // ---- S1 출금 완료 ----
    'Withdrawal Complete': '출금 완료',
    'Explore This Limited-Time Event': '한정 이벤트 확인하기',
    "If you'd used WOOX Pro for this withdrawal, you could have saved ": '이번 출금에 WOOX Pro를 사용했다면 수수료를 ',
    ' more in fees': ' 더 아낄 수 있었어요',
    "Fee differences add up to more than you'd expect.": '수수료 차이가 쌓이면 생각보다 큰 금액이 됩니다.',
    'View WOOX Pro Fee Comparison ›': 'WOOX Pro 수수료 비교 보기 ›',
    'Based on standard user / base tier': '일반 유저/기본 등급 기준',
    ' exchanges': '개 거래소',
    'Trade to win up to $100K prize pool': '거래하고 최대 $100K 상금 풀에 도전',
    'WOOX Pro Launch Event · Up to 100 USDT': 'WOOX Pro 런칭 이벤트 · 최대 100 USDT',
    'TetherMax × WOOX Pro Onboarding Event': '테더맥스 × WOOX Pro 온보딩 이벤트',
    'Earn cashback on every trade with TetherMax': '테더맥스로 모든 거래에서 캐시백 받기',
    'Close': '닫기',
    'Learn more': '자세히 보기',

    // ---- S2 캐시백 프리뷰 ----
    "You're all set.<br/>Here's your summary.": '준비 완료.<br/>요약을 확인하세요.',
    'Exchange': '거래소',
    'Account balance': '계좌 잔액',
    'Leverage': '레버리지',
    'Order Type Ratio': '주문 유형 비율',
    'Maker': '메이커',
    'Taker': '테이커',
    'Trading frequency': '거래 빈도',
    '1-2 trades a day': '하루 1-2회 거래',
    'Trading Fees': '거래 수수료',
    '× Cashback Rate': '× 캐시백율',
    'Cashback': '캐시백',
    '*Calculated based on paid trading fees': '*실제 낸 거래 수수료 기준 계산',
    "You're losing out with your current exchange": '지금 거래소로는 손해 보고 있어요',
    'est. cashback': '예상 캐시백',
    "With WOOX Pro you'd get ": 'WOOX Pro라면 매월 ',
    'Start with WOOX Pro': 'WOOX Pro로 시작',
    'standard user / base tier basis · collapse available (no forced close)': '일반 유저/기본 등급 기준 · 접기 가능(강제 닫기 없음)',
    'Payout Details': '지급 상세',
    'Schedule': '주기',
    'Daily': '매일',
    'Payout Time': '지급 시각',
    'Destination': '목적지',
    'Start {ex} Cashback': '{ex} 캐시백 시작',

    // ---- 네비게이션 / 공통 ----
    'Exchanges': '거래소',
    'Events': '이벤트',
    'Benefits': '혜택',
    'Cashback Preview': '캐시백 미리보기',
    'Point': '포인트',
    'Login': '로그인',
    'Log In': '로그인',
    'Sign Up': '회원가입',
    'Continue': '계속',
    'Email': '이메일',
    'Password': '비밀번호',

    // ---- 로그인 ----
    'Hi, welcome back!': '다시 오신 걸 환영해요!',
    'Log in now to complete missions': '지금 로그인하고 미션을 완료하세요',
    'to earn more USDT': '더 많은 USDT를 받으세요',
    'Forgot Password?': '비밀번호를 잊으셨나요?',
    "Don't have an account? ": '계정이 없으신가요? ',
    'Sign Up Now': '지금 가입하기',

    // ---- 회원가입 ----
    'Create Account': '계정 만들기',
    "We'll send you a code to verify this email": '이 이메일로 인증 코드를 보내드립니다',
    'Sign up and trade to earn rewards ': '가입하고 거래하면 리워드 ',
    'up to 100 USDT': '최대 100 USDT',
    'Referral Code (optional)': '추천 코드 (선택)',
    'I have read and agree to the ': '다음에 동의합니다: ',
    'Terms of Use': '이용약관',
    'and': '및',
    'Privacy Policy': '개인정보 처리방침',
    'Already have an account? ': '이미 계정이 있으신가요? ',
    'Log in': '로그인',

    // ---- 검증 / 에러 ----
    'Enter your email.': '이메일을 입력하세요.',
    'Invalid email format.': '이메일 형식이 올바르지 않습니다.',
    'Enter your password.': '비밀번호를 입력하세요.',
    'Email or password is incorrect.': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Password must be at least 8 characters.': '비밀번호는 8자 이상이어야 합니다.',

    // ---- 모바일 로그인 전 메뉴 ----
    'Welcome to TetherMax!': 'TetherMax에 오신 걸 환영해요!',
    'Create an account or log in to start earning Cashback.': '계정을 만들거나 로그인하고 캐시백을 받아보세요.',
    'Theme': '테마',
    'Language': '언어',
    'English': '한국어',
    'About TetherMax': 'TetherMax 소개',
    'Notices': '공지사항',

    // ---- 마이페이지 ----
    'Total Cashback Balance': '총 캐시백 잔액',
    'Withdraw': '출금',
    'Linked UID': '연동 UID',
    'See All': '전체 보기',
    'Using multiple exchanges? Link more UIDs': '여러 거래소를 쓰시나요? UID를 더 연동하세요',
    'Exclusive For Members': '회원 전용',
    'Limited Time Offers': '한정 혜택',
    'Rewards': '리워드',
    'Ongoing': '진행 중',
    'Ends in': '종료까지',
    'Join Now': '지금 참여',
    'Predict Bitcoin price and win up to 1,000.00 USDT': '비트코인 가격을 예측하고 최대 1,000.00 USDT 받기',
    'Earn More Cashback. Earn Extra USDT': '더 많은 캐시백. 추가 USDT 획득',
    'Up to 1,000.00 USDT': '최대 1,000.00 USDT',
    'Up to 500.00 USDT': '최대 500.00 USDT',
    'Member ID: ': '회원 ID: ',
    'Cashback Summary': '캐시백 요약',
    'Invite Friends': '친구 초대',
    'Cashback Ranking': '캐시백 랭킹',
    'My Coupons': '내 쿠폰',
    'Account Security': '계정 보안',
    'Notification Settings': '알림 설정',
    'Log Out': '로그아웃',

    // ---- WOOX Pro 상세 모달 ----
    'WOOX Pro — Lower fees, more cashback': 'WOOX Pro — 더 낮은 수수료, 더 많은 캐시백',
    '80% cashback on trading fees · Bithumb Travel Rule integrated': '거래 수수료 80% 캐시백 · 빗썸 트레블룰 연동',
    'Cashback rate': '캐시백율',
    'Fee discount': '수수료 할인',
    'Applied at checkout': '결제 시 적용',
    'Travel Rule': '트레블룰',
    'Bithumb integrated': '빗썸 연동',
    'Start with WOOX Pro ⧉': 'WOOX Pro로 시작 ⧉',
    'Back': '뒤로',
    'Sign Up for WOOX Pro': 'WOOX Pro 가입하기',

    // ---- 일반 모달 ----
    'Log out?': '로그아웃 할까요?',
    'You can log back in anytime.': '언제든 다시 로그인할 수 있어요.',
    'Cancel': '취소',
    'Reset your password': '비밀번호 재설정',
    "We'll email a reset link if the account exists.": '계정이 있으면 재설정 링크를 이메일로 보내드려요.',
    'Send reset link': '재설정 링크 보내기',
    'Verify your email': '이메일 인증',
    'Verify & Continue': '인증하고 계속',
    'Bitget Event': 'Bitget 이벤트',
    'Join Event ⧉': '이벤트 참여 ⧉'
  };

  g.__LANG = 'en';
  g.t = function (s) { return (g.__LANG === 'ko' && KO[s] != null) ? KO[s] : s; };
  g.setLang = function (l) { g.__LANG = l; };
})(window);
