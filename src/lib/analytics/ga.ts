// ─────────────────────────────────────────────────────────────
//  FinSwipe · GA4 계측 레이어
//  - PM 측정 스펙(2장 GA4 이벤트)의 이벤트/파라미터를 TS 타입으로 고정
//  - 이벤트명·파라미터 오타는 컴파일 단계에서 잡힘 (콘솔 커스텀 측정기준과 이름 일치 강제)
//  - gtag는 자체 배칭/전송을 하므로 /events/batch 같은 큐 로직 불필요 (call site에서 fire-and-forget)
//
//  [스펙에서 제외된 이벤트 — 여기 없는 이유 기록]
//  · card_save                         : 앱에 저장/북마크 기능 없음 → 삭제
//  · ticker_search / add / remove      : 관심종목 페이지 삭제로 발화 지점 없음 → 삭제
//  · card_skip_context / insight_unlock: 서버 계산값(skip_reason_inferred / implied_level)이라
//                                        FE가 못 쏨. 백엔드 자체 지표(내부 DB)로 이관 → GA4 미사용
// ─────────────────────────────────────────────────────────────

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ── 이벤트 ↔ 파라미터 스키마 (PM 문서 2-1 / 2-2 기준) ──────────
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
    dwell_ms: number; // 배치 dwell과 동일한 값
    is_hero: boolean;
    is_auto_added: boolean;
    sentiment: string;
    same_ticker_seen: boolean;
    feed_source: "cold_start" | "behavior";
  };
  card_open: { ticker: string };
  card_share: { ticker: string };
  feed_complete: { cards_swiped: number };
  feed_reset: Record<string, never>;

  // ── 2-2. 콜드스타트·퀴즈·인사이트 이벤트 ──
  // onboarding_card_swipe: 온보딩 화면 신규 개발 후 붙일 예정 (백엔드 작업 대기). 타입만 선반영.
  onboarding_card_swipe: {
    ticker: string;
    sector: string;
    direction: "left" | "right";
    dwell_ms: number;
  };
  quiz_card_impression: {
    topic: string;
    difficulty: string;
    position: number;
  };
  quiz_card_answer: {
    topic: string;
    difficulty: string;
    correct: boolean;
    answer_ms: number;
    dwell_ms: number;
    is_skipped: boolean; // 스킵 시 true (correct=false)
  };
  quiz_card_skip: {
    topic: string;
    position: number;
    dwell_ms: number; // 스킵 전 체류 시간
  };
  feed_personalized: { source: "cold_start" | "behavior" };

  // ──
  insight_feedback: {
    helpful: boolean;        // 도움됐어요=true / 별로예요=false
    cards_consumed: number;  // 이 브리핑까지 소비한 카드 수
    dwell_ms: number;        // 브리핑 카드 체류 시간
  };
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