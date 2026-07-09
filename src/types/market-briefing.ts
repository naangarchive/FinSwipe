// GET /news/market-briefing 응답 타입
// 로그인 불필요, 전 유저 공통. 직전 ET 마감 이후 뉴스 집계.

export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

export type EventCategory =
  | 'earnings' | 'guidance' | 'analyst' | 'product'
  | 'ma' | 'macro' | 'regulatory' | 'other';

export interface MarketGauge {
  positive: number;
  negative: number;
  mixed: number;
  neutral: number;
}

export interface NewsFlowItem {
  headlineKo: string;
  sentimentLabel: SentimentLabel;
  eventCategory: EventCategory;
  source: string;
  tickers: string[];
}

export interface SectorStrength {
  sector: string;
  count: number;
  avgSentiment: number;
}

export interface CategoryCount {
  category: EventCategory;
  cnt: number;
}

export interface BuzzItem {
  ticker: string;
  mentions: number;
  avgSentiment: number;
  changePct: number;
}

export interface MoverItem {
  ticker: string;
  changePct: number;
}

export interface Movers {
  gainers: MoverItem[];
  losers: MoverItem[];
}

export interface SentimentTrendPoint {
  date: string;
  positive: number;
  negative: number;
  avgScore: number;
}

export interface TickerIndicator {
  type: string;              // 'RSI' | 'MACD' | '거래량' 등
  value: number | null;
  displayText: string | null;
  label: string;             // '중립' | '골든크로스' 등
  caption: string;           // 서버가 주는 설명 문장
}

export interface IndicatorItem {
  ticker: string;
  changePct: number;
  sparkline: number[];
  indicators: TickerIndicator[];
}

export interface MarketBriefingResponse {
  date: string;
  totalCount: number;
  mood: '강세' | '약세' | '혼조';
  gauge: MarketGauge;
  newsFlow: NewsFlowItem[];
  sectorStrength: SectorStrength[];
  categories: CategoryCount[];
  buzz: BuzzItem[];
  movers: Movers;
  sentimentTrend: SentimentTrendPoint[];
  indicators: IndicatorItem[];
}