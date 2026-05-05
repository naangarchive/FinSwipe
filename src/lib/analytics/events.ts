// 동의·초기화 체크
import ReactGA from "react-ga4";
import { sanitizeParams } from "./sanitize";

// 동의 여부 확인 (기본값 true, 나중에 설정 페이지와 연동)
const hasAnalyticsConsent = () => {
  const consent = localStorage.getItem("analytics_consent");
  return consent === null || consent === "true"; 
};

export const trackEvent = (eventName: string, params?: object) => {
  if (!hasAnalyticsConsent()) return;

  const sanitizedParams = sanitizeParams({
    ...params,
    timestamp_client: Date.now(), // 모든 이벤트 공통 정보
  });

  ReactGA.event(eventName, sanitizedParams);

  if (import.meta.env.DEV) {
    console.log(`📊 [GA4 Event]: ${eventName}`, sanitizedParams);
  }
};