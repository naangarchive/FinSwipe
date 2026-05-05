import ReactGA from "react-ga4";

let isInitialized = false;

export const initGA = () => {
  const GA_ID = import.meta.env.VITE_GA_ID;

  if (!GA_ID) {
    console.warn("GA_ID가 없습니다.");
    return;
  }

  if (!isInitialized) {
    ReactGA.initialize(GA_ID);
    isInitialized = true;
    console.log("GA4 초기화 완료");
  }
};