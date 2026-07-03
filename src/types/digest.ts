export interface TimelineSession {
  label: string;
  sentiment: string;
  count: number;
  articles: { headlineKo: string }[];
}

export interface TimelineResponse {
  sessions: TimelineSession[];
}

export interface BriefingResponse {
  type: string;
  articles_count: number;
  sentiment_overview: {
    positive: number;
    negative: number;
    neutral: number;
    avg_score: number;
  };
  briefing: {
    오늘의_시장: string;
    핵심_이슈: string;
    오늘_체크포인트: string;
  };
  summary: string;
  top_articles: {
    headline_ko: string;
    headline: string;
    sentiment_label: string;
    sentiment_score: number;
    tickers: string[];
    published_at: string;
  }[];
  indicators: {
    ticker: string;
    current_price?: number | null;
    change_pct_1d?: number | null;
    change_pct_1m?: number | null;
    volume_ratio?: number | null;
    RSI?: number | null;
    RSI_signal?: string | null;
    MACD?: {
      macd?: number | null;
      signal?: number | null;
      histogram?: number | null;
      trend?: string | null;
    } | null;
  }[];
  user_level: number;
  user_tendency: string;
  generated_at: string;
}