import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import type { NewsCardData } from "../types/news";
import { TickerSection } from "../components/briefing/TickerSection";

// Swiper 라이브러리
import type { Swiper as SwiperClass } from 'swiper/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// 컴포넌트
import { Header } from "../components/layout/Header"
import { Navigation } from "../components/layout/Navigation"

export const Home = () => {
  const [rawData, setRawData] = useState<NewsCardData[]>([]);
  const [userTickers, setUserTickers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainSwiper, setMainSwiper] = useState<SwiperClass | null>(null);

  const groupedNews = useMemo(() => {
    const safeRawData = rawData || [];

    // 1. 데이터 정렬
    const sortedData = [...safeRawData].sort((a, b) => {
      const aRead = !!a.is_read;
      const bRead = !!b.is_read;
      if (aRead !== bRead) return aRead ? 1 : -1;
      return Math.abs(b.sentimentScore || 0) - Math.abs(a.sentimentScore || 0);
    });

    // 2. 티커별 그룹화 (모든 관심 티커를 빈 배열로 먼저 초기화)
    const groups: { [key: string]: NewsCardData[] } = {};
    userTickers.forEach(ticker => {
      groups[ticker] = [];
    });

    // 3. 기사 분배
    sortedData.forEach((article) => {
      const tickerList = (article.tickers && article.tickers.length > 0) ? article.tickers : ['NULL'];
      tickerList.forEach((t) => {
        if (groups[t] && !groups[t].find(item => item.id === article.id)) {
          groups[t].push(article);
        }
      });
    });

    // 4. 결과 반환 및 정렬
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        tickerName: name,
        articles: groups[name],
      }));
  }, [rawData, userTickers]);

  const fetchInitialData = async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      const json = await fetch(`${import.meta.env.VITE_API_BASE_URL}/news/latest?userId=${userId}&limit=50&offset=0`)
      .then(res => {
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        return res.json();
      });

      setRawData((json.data ?? []) as NewsCardData[]);
      setUserTickers(json.userTickers ?? []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      if (!isSilent) setRawData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData(false);
    
    const handleFocus = () => { fetchInitialData(true); };
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    // 로딩 완료 + 데이터 있음 + 스와이퍼 렌더링 완료 상태일 때만 실행
    if (!isLoading && groupedNews.length > 0 && mainSwiper) {
      const targetTicker = sessionStorage.getItem('scrollTargetTicker');
      
      if (targetTicker) {
        const targetIndex = groupedNews.findIndex(g => g.tickerName === targetTicker);
        
        if (targetIndex !== -1) {
          // 약간의 딜레이를 주어야 Swiper가 완전히 그려진 후 안전하게 이동합니다.
          setTimeout(() => {
            mainSwiper.slideTo(targetIndex, 0);
            sessionStorage.removeItem('scrollTargetTicker');
          }, 100);
        } else {
          // 만약 티커를 못 찾았다면 찌꺼기가 남지 않게 지워줍니다.
          sessionStorage.removeItem('scrollTargetTicker');
        }
      }
    }
  }, [isLoading, groupedNews, mainSwiper]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen font-medium">뉴스를 분류하고 있습니다...</div>;
  }

  return (
    <>
      <Header type="main" />
      <main className="w-full space-y-7 relative">
        {groupedNews.length === 0 ? (
          <div className="flex flex-col justify-center items-center pt-20 space-y-2">
            <p className="text-gray-500 font-semibold text-lg">표시할 뉴스가 없습니다.</p>
          </div>
        ) : (
          // 바깥 Swiper - 티커별 세로 스와이프
          <Swiper
            direction="vertical"
            slidesPerView={1}
            style={{ height: 'calc(100dvh - 186px)' }}
            modules={[Pagination]}
            onSwiper={setMainSwiper}
          >
            {groupedNews.map((group) => (
              <SwiperSlide key={group.tickerName}>
                {group.articles.length === 0 ? (
                  // 뉴스 없으면 슬라이드 1개만
                  <div className="h-dvh flex flex-col items-center justify-center px-4">
                    <h3 className="text-2xl font-bold mb-4">{group.tickerName}</h3>
                    <p className="text-gray-400 text-sm">현재 {group.tickerName} 관련 뉴스가 없습니다.</p>
                  </div>
                ) : (
                  <TickerSection group={group} />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </main>
      <Navigation showDisclaimer={true} />
    </>
  );
};