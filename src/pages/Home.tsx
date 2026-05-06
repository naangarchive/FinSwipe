import { useEffect, useState, useRef } from "react";
import { trackEvent } from "../lib/analytics/events";

// Swiper 라이브러리
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import { SwipeCard } from '../components/briefing/SwipeCard';
import { supabase } from "../lib/supabase";
import type { NewsCardData, TickerGroup } from "../types/news";
import { Header } from "../components/layout/Header"
import { Navigation } from "../components/layout/Navigation"

export const Home = () => {
  const [groupedNews, setGroupedNews] = useState<TickerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortType, setSortType] = useState<'time' | 'power'>('time');

  // 시간을 추적하기 위한 Ref
  const startTimeRef = useRef<number>(Date.now());
  const hasFiredFeedViewed = useRef(false); // B-01 중복 발화 방지

  // [B-01] feed_viewed: 데이터 로딩 완료 시 1회 발화
  useEffect(() => {
    if (!isLoading && groupedNews.length > 0 && !hasFiredFeedViewed.current) {
      trackEvent("feed_viewed", {
        total_decks: groupedNews.length,
        total_tickers: groupedNews.length,
        sort_method: sortType
      });
      hasFiredFeedViewed.current = true;
    }
  }, [isLoading, groupedNews, sortType]);

  // [B-02] feed_sort_changed: 정렬 변경 시 발화
  const handleSortUpdate = (newMethod: 'time' | 'power') => {
    if (sortType === newMethod) return;

    trackEvent("feed_sort_changed", {
      from: sortType,
      to: newMethod
    });
    setSortType(newMethod);
  };


  const handleSlideChange = (swiper: any, articles: any[], groupTicker: string) => {
    const prevIdx = swiper.previousIndex;
    const currentIdx = swiper.activeIndex;
    const swipedCard = articles[prevIdx];

    if (!swipedCard) return;

    const duration = Date.now() - startTimeRef.current;

    // [B-05] 카드 스와이프
    trackEvent("card_swiped", {
      news_id: swipedCard.id,
      ticker: groupTicker,
      direction: currentIdx > prevIdx ? "next" : "left",
      time_on_card_ms: duration,
      card_index: prevIdx + 1,
      swipe_method: "gesture",
    });

    // [B-07] deck_completed: 마지막 카드에 도달했을 때
    if (swiper.isEnd) {
      trackEvent("deck_completed", {
        ticker: groupTicker,
        total_cards: articles.length,
        cards_consumed: articles.length,
        total_time_ms: duration,
        taps_count: 0
      });
    }
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);

        // 유저 관심종목 가져오기
        const { data: {session} } = await supabase.auth.getSession();
        const { data: profile } = await supabase
        .from("user_profiles")
        .select("tickers")
        .eq("id", session!.user.id )
        .maybeSingle();

        const userTickers: string[] = profile?.tickers ?? [];
        

        // 뉴스 가져오기
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .order('published_at', { ascending: false });

        if (error) throw error;

        const rawData = data as NewsCardData[];

        // 티커별 그룹화
        const groups: { [key: string]: NewsCardData[] } = {};

        rawData.forEach((article) => {          
          const tickerList = (article.tickers && article.tickers.length > 0) // ticker가 null이면 임시 할당
          ? article.tickers 
          : ['NULL'];

          tickerList.forEach((t) => {
            if (!userTickers.includes(t)) return;

            if (!groups[t]) {
              groups[t] = [];
            }
            if (!groups[t].find(item => item.id === article.id)) {
              groups[t].push(article);
            }
          });
        });

        // 객체 → 배열로 변환 및 정렬
        const formattedGroups = Object.keys(groups)
        .map((name) => ({
          tickerName: name,
          articles: groups[name],
        }))

        setGroupedNews(formattedGroups);


      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen font-medium">뉴스를 분류하고 있습니다...</div>;
  }
  return (
    <>
    <Header type="main" />
    <main className="w-full h-full py-6 pb-20 space-y-7 relative">      
      <div className="absolute right-4 top-6 flex p-1 rounded-[14px] bg-gray-100">
        <button 
          onClick={() => handleSortUpdate('time')}
          className={`w-18 h-9 rounded-[10px] font-semibold text-sm ${
            sortType === 'time'
            ? 'bg-white text-gray-900'
            : 'text-gray-500'
          }`}>시간순</button>
        <button 
          onClick={() => handleSortUpdate('power')}
          className={`w-18 h-9 rounded-[10px] font-semibold text-sm ${
            sortType === 'power'
            ? 'bg-white text-gray-900'
            : 'text-gray-500'
          }`}>파워순</button>
      </div>
      {groupedNews.length === 0 ? (
        <div className="flex flex-col justify-center items-center pt-20 space-y-2">
          <p className="text-gray-500 font-semibold text-lg">표시할 뉴스가 없습니다.</p>
          <p className="text-gray-400 text-sm">DB에 데이터가 있는지 확인해 주세요.</p>
        </div>
      ) : (        
        groupedNews.map((group) => (
        <section key={group.tickerName} className="space-y-3">          
          <div className="flex items-center gap-2 px-4">
            <h3 className="flex items-center px-4 h-10 text-sm font-bold text-blue-600 rounded-full bg-blue-600/10">{group.tickerName}
            </h3>
            <div className={`custom-pagination-${group.tickerName} text-sm font-medium text-gray-500`} />
          </div>          

          <Swiper
            onSlideChange={(swiper) => handleSlideChange(swiper, group.articles, group.tickerName)}
            modules={[Pagination, EffectCoverflow]}
            effect={'coverflow'}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1,
              scale: 0.9,
              slideShadows: false              
            }}
            centeredSlides={true}
            slidesPerView={1.1}
            spaceBetween={5}
            grabCursor={true}
            threshold={10}
            pagination={{
              el: `.custom-pagination-${group.tickerName}`,
              type: 'fraction'
            }}         
          >
            {group.articles.map((article: NewsCardData, index:number) => (
              <SwiperSlide key={`${group.tickerName}-${article.id}`}>
                <SwipeCard 
                  data={article}
                  groupTicker={group.tickerName}
                  articles={group.articles}
                  index={index}
                />
              </SwiperSlide>
            ))}
            
          </Swiper>

        </section>
      ))
      )}
      
    </main>
    <Navigation showDisclaimer={true}/>
    </>
  );
};