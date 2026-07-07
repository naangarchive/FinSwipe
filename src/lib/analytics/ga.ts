// ─────────────────────────────────────────────────────────────
//  FinSwipe · GA4 계측 레이어
//  - PM 측정 스펙(2장 GA4 이벤트)의 이벤트/파라미터를 TS 타입으로 고정
//  - 이벤트명·파라미터 오타는 컴파일 단계에서 잡힘 (콘솔 커스텀 측정기준과 이름 일치 강제)
//  - gtag는 자체 배칭/전송을 하므로 /events/batch 같은 큐 로직 불필요 (call site에서 fire-and-forget)
// ─────────────────────────────────────────────────────────────

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ── 이벤트 ↔ 파라미터 스키마 (PM 문서 2-1 / 2-2 그대로) ──────────
// 여기 정의된 파라미터 key는 GA4 콘솔의 '맞춤 측정기준' 이름과 반드시 일치해야 조회됨.
// (한도: 이벤트당 파라미터 25개 / 속성당 이벤트 500종)
type GA4EventMap = {
  // ── 2-1. 코어 이벤트 ──
  login: { method: "google" };
  onboarding_complete: { duration_ms: number };
  feed_view: { card_count: number };
  card_impression: {
    ticker: string;
    sector: string;
    event_type: string; // 실적/급등락/거시/기타
    card_rank: number;
    is_hero: boolean;
    is_auto_added: boolean;
  };
  card_swipe: {
    direction: "left" | "right";
    dwell_ms: number; // ← 배치 dwell과 동일한 값
    is_hero: boolean;
    is_auto_added: boolean;
    sentiment: string;
    same_ticker_seen: boolean;
  };
  card_open: { ticker: string };
  card_save: { ticker: string; is_hero: boolean };
  card_share: { ticker: string };
  ticker_search: { query: string; results_count: number };
  ticker_add: { ticker: string; source: string };
  ticker_remove: { ticker: string; source: string };
  feed_complete: { cards_swiped: number };
  feed_reset: Record<string, never>;

  // ── 2-2. 콜드스타트·퀴즈·인사이트 이벤트 ──
  onboarding_card_swipe: {
    ticker: string;
    sector: string;
    direction: "left" | "right";
    dwell_ms: number;
  };
  // ⚠️ skip_reason_inferred 는 서버 추론값(문서 1-2). FE가 스와이프 순간에 못 채움.
  //    → 이 이벤트는 BE가 서버사이드로 쏘거나, API 응답에 값을 실어줄 때만 FE emit 가능. PM 확인 필요.
  card_skip_context: { skip_reason_inferred: string; sentiment: string };
  quiz_card_impression: { topic: string; difficulty: string; position: number };
  quiz_card_answer: {
    topic: string;
    difficulty: string;
    correct: boolean;
    answer_ms: number;
  };
  quiz_card_skip: { topic: string; position: number };
  // ⚠️ level_tier 는 implied_level(서버 계산값) 기반. API가 클라에 내려줘야 채울 수 있음. BE 확인 필요.
  insight_unlock: { level_tier: string; cards_consumed: number };
  feed_personalized: { source: "cold_start" | "behavior" };
};

// ── 초기화 ──────────────────────────────────────────────────
// App 진입 시 1회 호출 (예: main.tsx 또는 App useEffect).
let initialized = false;
export function initGA(): void {
  if (initialized || !GA_ID || typeof window === "undefined") return;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // 카드형 피드라 자동 page_view는 끔. 문서 스펙은 전부 커스텀 이벤트.
  window.gtag("config", GA_ID, { send_page_view: false });

  initialized = true;
}

// ── 타입 안전한 이벤트 전송 ─────────────────────────────────
export function track<K extends keyof GA4EventMap>(
  event: K,
  params: GA4EventMap[K],
): void {
  if (!GA_ID) {
    // 로컬/미설정 환경: 콘솔로만 확인 (dev 검증용)
    if (import.meta.env.DEV) console.debug("[GA4]", event, params);
    return;
  }
  window.gtag?.("event", event, params);
}

// ── user_id (유저 단위 분석용) ──────────────────────────────
// ⚠️ 반드시 내부 userId만. email 등 PII 금지 (문서 4장 GA4 user_id 가드레일).
export function setGAUserId(internalUserId: string): void {
  if (!GA_ID) return;
  window.gtag?.("config", GA_ID, { user_id: internalUserId });
}

// ── 동의(consent) — 문서 4장 '동의 누락' 가드레일 대응 ─────────
// 온보딩에서 수집 동의 받은 뒤 granted=true 로 호출.
// (PM이 Consent Mode 완전판을 원하면 default 'denied' → update 로 확장)
export function updateGAConsent(granted: boolean): void {
  if (!GA_ID) return;
  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}