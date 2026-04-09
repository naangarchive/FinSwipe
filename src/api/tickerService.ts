import { supabase } from "../lib/supabase";
import type { TickerInfo } from "../types/tickers";

export const getUniqueTickersFromNews = async (): Promise<TickerInfo[]> => {
  //1. 모든 뉴스에서 tickers, categorys 컬럼 가져오기
  const { data, error } = await supabase
    .from('news_articles')
    .select('tickers, categories');

  if (error || !data) return [];

  //2. 가공 로직
  const allTickers = data.flatMap((row) => row.tickers || []);

  //3. 중복 제거 및 정렬
  const uniqueTickers = Array.from(new Set(allTickers)).sort();
  
  //4. StockCard에서 사용할 형식으로 변환
  return uniqueTickers.map((symbol) => ({
    symbol: symbol,
    name: symbol,
    categories: ["technology, markets"], //기본 카테고리 지정
  }));
};