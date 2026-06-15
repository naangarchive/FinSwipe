import { useState, useRef, useEffect } from "react";
import type { NewsCardData } from "../../types/news";
import { getTimeAgo } from "../../utils/time";

interface CardDeckProps {
  articles: NewsCardData[];
  groupTicker: string;
  onVerticalSwipe: (direction: 1 | -1) => void;
}

export const CardDeck = ({ articles, groupTicker, onVerticalSwipe }: CardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragState, setDragState] = useState<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    axis: 'x' | 'y' | null;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 티커가 바뀌면 카드 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(0);
  }, [articles]);

  // 카드가 바뀌면 항상 앞면부터 보여줌
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const currentArticle = articles[currentIndex];
  const nextArticle = articles[currentIndex + 1];

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragState({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, axis: null });
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.x;
    const dy = e.clientY - dragState.y;

    if (!dragState.axis) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        const axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        setDragState({ ...dragState, dx, dy, axis });
      }
      return;
    }

    setDragState({ ...dragState, dx, dy });
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    const { dx, dy, axis } = dragState;

    if (axis === 'x' && Math.abs(dx) > 100) {
      const direction = dx > 0 ? 'like' : 'dislike';
      console.log(direction, currentArticle?.id);
      setCurrentIndex(prev => prev + 1);
    } else if (axis === 'y' && Math.abs(dy) > 80) {
      onVerticalSwipe(dy < 0 ? 1 : -1);
    } else if (axis === null) {
      // 거의 움직이지 않았으면 클릭으로 간주 → 카드 플립
      setIsFlipped(prev => !prev);
    }

    setDragState(null);
  };

  if (!currentArticle) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <p>모든 뉴스를 확인했습니다</p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-xl"
        >
          처음부터 다시보기
        </button>
      </div>
    );
  }

  const axis = dragState?.axis;
  const dx = axis === 'x' ? dragState!.dx : 0;
  const dy = axis === 'y' ? dragState!.dy : 0;

  const rotation = dx * 0.04;
  const likeOpacity = Math.min(Math.max(dx / 100, 0), 1);
  const dislikeOpacity = Math.min(Math.max(-dx / 100, 0), 1);

  // 감성에 따른 색상/배경
  const sentiment = currentArticle.sentimentLabel;
  const tint =
    sentiment === 'positive' ? '#F1FAF4' :
    sentiment === 'negative' ? '#FEF5F5' :
    '#F7F8F9';
  const pillClass =
    sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' :
    sentiment === 'negative' ? 'bg-rose-50 text-rose-600' :
    sentiment === 'mixed' ? 'bg-yellow-50 text-yellow-600' :
    'bg-gray-100 text-gray-500';

  // RSI 지표
  const indicator = currentArticle.indicator;
  const rsiValue = indicator ? Math.max(0, Math.min(100, indicator.value)) : null;
  const rsiColor =
    indicator?.label === '과매수' ? '#DC2626' :
    indicator?.label === '과매도' ? '#16A34A' :
    '#6B7280';

  return (
    <div className="relative w-full h-full max-h-[700px]">
      {/* 다음 카드 (뒤에) */}
      {nextArticle && (
        <div
          className="absolute inset-x-4 top-0 bottom-4 rounded-2xl border border-gray-200 bg-white"
          style={{ transform: 'translateY(10px) scale(0.97)', zIndex: 1 }}
        />
      )}

      {/* 현재 카드 */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-x-4 top-0 bottom-4 cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`,
          transition: dragState ? 'none' : 'transform 0.3s ease',
          zIndex: 2,
          perspective: '1300px',
        }}
      >
        {/* 좋아요 / 관심없음 스탬프 */}
        <div className="absolute top-6 right-6 border-2 border-emerald-500 text-emerald-500 font-bold text-lg px-3 py-1 rounded-lg rotate-12 z-10"
          style={{ opacity: likeOpacity }}>
          좋아요
        </div>
        <div className="absolute top-6 left-6 border-2 border-gray-400 text-gray-400 font-bold text-lg px-3 py-1 rounded-lg -rotate-12 z-10"
          style={{ opacity: dislikeOpacity }}>
          관심없음
        </div>

        {/* 3D flip 컨테이너 */}
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* 앞면 */}
          <div
            className="absolute inset-0 rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Hero 영역 */}
            <div className="relative flex flex-col flex-1 p-4" style={{ background: tint }}>
              <div className="text-xs text-gray-500">{getTimeAgo(currentArticle.publishedAt)}</div>

              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                {indicator && rsiValue !== null ? (
                  <>
                    <div className="text-3xl font-bold" style={{ color: rsiColor }}>
                      RSI {indicator.value}
                    </div>
                    <div className="w-4/5 h-2 rounded-full bg-gray-200 relative">
                      <div
                        className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${rsiValue}%`,
                          background: rsiColor,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    </div>
                    <div className="text-sm font-semibold" style={{ color: rsiColor }}>
                      {indicator.label}
                    </div>
                    <p className="text-xs text-gray-500 text-center px-6 leading-relaxed">
                      {indicator.caption}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-gray-300">보조지표 준비중</div>
                )}
              </div>

              {/* 워터마크 */}
              <span className="absolute right-4 bottom-2 text-6xl font-bold text-gray-900 opacity-5 select-none">
                {groupTicker}
              </span>
            </div>

            {/* 정보 영역 */}
            <div className="shrink-0 p-4 flex flex-col gap-3 bg-white">
              <p className="text-base font-medium text-gray-900 line-clamp-2">
                {currentArticle.headlineKo}
              </p>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pillClass}`}>
                  {currentArticle.sentimentScore >= 0 ? '+' : ''}{Math.floor(currentArticle.sentimentScore * 100)}
                </span>
                <span className="text-sm font-medium text-gray-900">${groupTicker}</span>
              </div>
            </div>
          </div>

          {/* 뒷면 - 3줄 요약 */}
          <div
            className="absolute inset-0 rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col p-5 gap-4"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex justify-between items-center">
              <p className="text-base font-semibold text-gray-900">AI 인사이트 · 3줄 요약</p>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                ${groupTicker}
              </span>
            </div>

            {currentArticle.summary3linesKo && currentArticle.summary3linesKo.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {currentArticle.summary3linesKo.map((line, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                    <span className="shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-blue-600" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">요약 정보가 없습니다.</p>
            )}

            {/* 뒷면 하단 면책조항 */}
            <p className="mt-auto text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
              본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다. 투자 결정 및 손실에 대한 책임은 투자자 본인에게 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};