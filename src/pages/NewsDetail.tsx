import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from '../lib/supabase';
import type { NewsCardData } from '../types/news';
import { Header } from "../components/layout/Header"
//유틸리티
import { getTimeAgo } from "../utils/time";
import { getSourceName } from "../utils/format";
//이미지
import defaultThumb from "../assets/thumb_img.jpg";
import Thunder from "../assets/ic_thunder.svg";

export const NewsDetail = () => {  

  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsCardData | null>(null);

  const location = useLocation();
  const groupTicker = location.state?.groupTicker;

  const articles: NewsCardData[] = location.state?.articles ?? [];
  const currentIndex = articles.findIndex(a => a.id === id);

  useEffect(() => {
    const fetchDetail = async () => {
      const { data } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id',id)
      .single();

      if (data) setNews(data);
    }
    fetchDetail();
  }, [id]);

  if (!news) {
    return <div className="p-10 text-center">로딩 중...</div>;
  }

  const handleNextNews = () => {
    const next = articles[currentIndex + 1];
    if (next) {
      navigate(`/detail/${next.id}`, { state: { groupTicker, articles } });
    } else {
      navigate(-1);
    }
  };
  

  return (
    <>
    <Header type="detail" />
    <div className='overflow-hidden relative h-68 bg-gray-100'>        
      {/* 이미지 */}
      <img src={news.image_url || defaultThumb} alt="" className='w-full h-full object-cover opacity-30'/>
      {/* 센티먼트, 티커 */}
      <div className="absolute left-0 bottom-0 p-5 flex flex-col gap-3">          
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 h-6 leading-6 rounded-full text-sm font-semibold ${
            news.sentiment_label === 'positive' ? 'bg-emerald-50 text-[#22C55E]' : 
            news.sentiment_label === 'negative' ? 'bg-rose-50 text-[#EF4444]' : 
            news.sentiment_label === 'mixed' ? 'bg-yellow-50 text-[#F59E0B]' : 
            'bg-gray-100 text-gray-500' // Neutral
            }`}
          >
            {news.sentiment_label}
          </span>
          {groupTicker && (
            <span className="px-3 h-6 leading-6 rounded-full text-white bg-gray-900 text-xs font-bold"> 
              {groupTicker}
            </span>
          )}
          {news.tickers?.filter(t => t !== groupTicker).map((t) => (
            <span key={t} className="px-3 h-6 leading-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-900">{t}</span>
          ))}
        </div>          
        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900">{news.headline_ko}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{getSourceName(news.source_url)}</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">{getTimeAgo(news.published_at)}</span>
        </div>
      </div>
    </div>
    <div className="relative px-4 py-8 pb-32 bg-gray-50 space-y-4">      

      {/* 3줄 요약 */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-4">
            <img src={Thunder} alt="제목" />
            <p className="text-lg font-bold text-gray-900">3줄 요약</p>
        </div>
        
        <ul className="flex flex-col gap-3">
      {news.xai_ko?.highlights.slice(0, 3).map((highlight, index) => {
        const { excerpt, start_char, end_char } = highlight;
        const before = excerpt.slice(0, start_char);
        const highlighted = excerpt.slice(start_char, end_char);
        const after = excerpt.slice(end_char);

        return (
          <li key={index} className="flex gap-3 p-4 border border-blue-100 rounded-[14px]">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-blue-600 rounded-full">
              {index + 1}
            </span>
            <span className="text-sm text-gray-700 leading-relaxed">
              {before}
              <mark className="bg-yellow-200 text-gray-900">{highlighted}</mark>
              {after}
            </span>
          </li>
        );
      })}
    </ul>
      </div>

      {/* 본문 요약영역 */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{news.summary}</div>

      {/* 하단버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full min-w-80 max-w-107.5 z-50">
        <div className="flex gap-2 px-4 py-6 bg-linear-to-t from-white via-white/95 to-transparent">
          <button 
            onClick={() => window.open(news.source_url, '_blank')}
            className="flex-1 h-14 bg-blue-600 text-white rounded-xl font-semibold text-basic cursor-pointer"
          >
            자세히보기
          </button>
          <button
            onClick={handleNextNews}
            className="flex-1 h-14 bg-gray-100 text-gray-900 rounded-xl font-semibold text-basic cursor-pointer"
          >
            다음 뉴스
          </button>
        </div>
      </div>
    </div>
    </>
  );
};