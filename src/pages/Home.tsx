import { useEffect, useState } from "react";
import type { NewsCardData } from "../types/news";
import { CardDeck } from "../components/briefing/CardDeck";
import { Header } from "../components/layout/Header";

export const Home = () => {
  const [articles, setArticles] = useState<NewsCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusArticleId, setFocusArticleId] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      const res = await fetch(
        `${API_BASE_URL}/news/latest?userId=${userId}&limit=30&offset=0`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error('뉴스 불러오기 실패');
      const data = await res.json();
      setArticles(data.data ?? []);
    } catch (err) {
      console.error('뉴스 불러오기 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // homeRefresh 이벤트
    const onRefresh = () => fetchNews();
    window.addEventListener('homeRefresh', onRefresh);
    return () => window.removeEventListener('homeRefresh', onRefresh);
  }, []);

  // 챗봇 알림 → 기사 포커스
  useEffect(() => {
    if (!isLoading && articles.length > 0) {
      const alertArticleStr = sessionStorage.getItem('alertArticle');
      if (alertArticleStr) {
        const article = JSON.parse(alertArticleStr);
        sessionStorage.removeItem('alertArticle');
        setTimeout(() => setFocusArticleId(article.id), 300);
        return;
      }

      const focusId = sessionStorage.getItem('focusArticleId');
      if (focusId) {
        sessionStorage.removeItem('focusArticleId');
        setTimeout(() => setFocusArticleId(focusId), 300);
      }
    }
  }, [isLoading, articles]);

  return (
    <>
      <Header type="main" />
      <main className="flex flex-col" style={{ height: 'calc(100dvh - 60px)' }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">            
            <p className="text-sm">오늘의 뉴스가 없어요</p>
            <button
              onClick={fetchNews}
              className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-xl"
            >
              다시 불러오기
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 px-4 py-2">
            <CardDeck
              articles={articles}
              onVerticalSwipe={() => {}}
              focusArticleId={focusArticleId}
            />
          </div>
        )}
      </main>
    </>
  );
};