import type { TickerNameInfo } from "../types/tickers";
// 검색
export const searchTickerNames = async (term: string): Promise<TickerNameInfo[]> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/news/tickers`);
    const json = await res.json();
    const data: TickerNameInfo[] = json.data;

    if (!data || !Array.isArray(data)) return [];

    // 검색어 필터링
    const filtered = term
      ? data.filter((item) =>
          item.ticker.toLowerCase().includes(term.toLowerCase()) ||
          item.ko.includes(term)
        )
      : data.slice(0, 50); // 검색어 없으면 상위 50개만

    return filtered.sort((a, b) => a.ticker.localeCompare(b.ticker));
  } catch (error) {
    console.error("티커 검색 실패:", error);
    return [];
  }
};

