import { useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper/types';
import { Article } from '../briefing/Article';
import type { NewsCardData } from "../../types/news";

export const TickerSection = ({ group }: { group: { tickerName: string; articles: NewsCardData[] } }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(null);

  const [page, setPage] = useState(0);
  const pageSize = 5;

  const pagedArticles = group.articles.slice(page * pageSize, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * pageSize < group.articles.length;


  return (
    <div className="flex flex-col h-full">
      {/* 고정 영역 */}
      <div className="px-4 pt-6 pb-0">
        <h3 className="mb-4 text-2xl font-bold">{group.tickerName}</h3>
        <div className="flex gap-6 justify-center mb-4">
          {['뉴스', '요약', '보조지표'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => swiperInstance?.slideTo(i)}
              className={`pb-1 text-sm font-medium border-b-2 transition-all ${
                activeSlide === i
                  ? 'text-gray-900 border-blue-600'
                  : 'text-gray-500 border-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 스와이프 영역 */}
      <Swiper
        direction="horizontal"
        slidesPerView={1}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
        className="w-full flex-1"
      >
        <SwiperSlide>
          <div className="flex flex-col gap-2 px-4 overflow-y-auto" style={{ height: 'calc(100dvh - 240px)' }}>
            {pagedArticles.map((article, index) => (
              <Article
                key={article.id}
                data={article}
                groupTicker={group.tickerName}
                articles={group.articles}
                index={index}
              />
            ))}
            {group.articles.length > 5 && (
              <div className="flex gap-3 mt-5">
              <button 
                onClick={() => setPage(p => p - 1)}
                disabled={!hasPrev}
                className="grow h-11 text-sm text-gray-700 rounded-[10px] bg-gray-100 disabled:opacity-40"                
              >이전 뉴스</button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNext}
                className="grow h-11 text-sm text-gray-700 rounded-[10px] bg-gray-100
                disabled:opacity-40"
              >다음 뉴스</button>
            </div>
            )}
            
          </div>          
        </SwiperSlide>

        <SwiperSlide>
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-gray-400">준비중입니다</p>
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-gray-400">준비중입니다</p>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};