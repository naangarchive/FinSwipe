import { useState, useEffect, useId, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QuizCard } from "../briefing/QuizCard";
import { DigestCard } from "../briefing/DigestCard";
import { track } from "../../lib/analytics/ga";
// 타입
import type { PanInfo } from "motion/react";
import type { NewsCardData } from "../../types/news";
import type { BriefingResponse } from "../../types/digest";
import type { QuizQuestion } from "../../types/quiz";
// 유틸리티
import { getTimeAgo } from "../../utils/time";
import { getSourceName } from "../../utils/format";


interface CardDeckProps {
  articles: NewsCardData[];
  onVerticalSwipe: (direction: 1 | -1) => void;
  focusArticleId?: string | null;
  onFlipChange?: (flipped: boolean) => void;
}

// 티커별 감성점수 절댓값 최고 카드 = hero (순수 함수, 컴포넌트 밖 OK)
function computeHeroIds(articles: NewsCardData[]): Set<string> {
  const bestByTicker = new Map<string, { id: string; score: number }>();

  for (const a of articles) {
    const ticker = a.tickers?.[0];
    if (!ticker) continue;
    const score = Math.abs(a.sentimentScore ?? 0);
    const prev = bestByTicker.get(ticker);
    if (!prev || score > prev.score) {
      bestByTicker.set(ticker, { id: a.id, score });
    }
  }

  return new Set([...bestByTicker.values()].map(v => v.id));
}

const THEME = {
  positive: {
    card: 'linear-gradient(172deg,#d6f1e3 0%,#b7e3cb 48%,#8fd0ac 100%)',
    ink: '#16463a', soft: '#4a7263', acc: '#0f8f63',
    tint: '#f2fdf8', stroke: '#1f6e58',
  },
  negative: {
    card: 'linear-gradient(172deg,#fce8e8 0%,#f0a0a0 48%,#e06060 100%)',
    ink: '#461616', soft: '#724242', acc: '#c42020',
    tint: '#fff5f5', stroke: '#6e1f1f',
  },
  neutral: {
    card: 'linear-gradient(172deg,#f1f5f9 0%,#cbd5e1 48%,#94a3b8 100%)',
    ink: '#1e293b', soft: '#475569', acc: '#475569',
    tint: '#f8fafc', stroke: '#475569',
  },
  mixed: {
    card: 'linear-gradient(172deg,#fef3c7 0%,#fde68a 48%,#f59e0b 100%)',
    ink: '#451a03', soft: '#78350f', acc: '#d97706',
    tint: '#fffbeb', stroke: '#92400e',
  },
};

function Sparkline({ data, strokeColor }: { data: number[]; strokeColor: string }) {
  const gId = useId();
  if (!data || data.length < 2) return null;
  const W = 290, H = 88, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const xs = (W - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: pad + i * xs,
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)} ${H} L${pts[0].x.toFixed(1)} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="1" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gId})`} />
      <path d={linePath} stroke={strokeColor} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const getSentimentText = (label: string, score: number) => {
  if (label === 'positive') return score >= 60 ? '강한 긍정' : '약한 긍정';
  if (label === 'negative') return score <= -60 ? '강한 부정' : '약한 부정';
  if (label === 'mixed') return '혼재';
  return '중립';
};

function FrontFace({ article }: { article: NewsCardData }) {
  const label = (article.sentimentLabel ?? 'neutral') as keyof typeof THEME;
  const t = THEME[label] ?? THEME.neutral;
  const ticker = article.tickers?.[0] ?? '';
  const chg = article.changePct1d;
  const chgStr = chg != null ? `${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(1)}%` : null;
  const score = article.sentimentScore ?? 0;
  const scoreStr = `${score > 0 ? '+' : ''}${score}`;
  const eventTag = article.eventCategory ?? null;

  return (
    <div className="absolute inset-0 rounded-[28px] overflow-hidden flex flex-col"
      style={{ background: t.card, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never }}>
      <div className="h-0.75 shrink-0" style={{ background: t.acc }} />
      <div className="flex items-start justify-between px-4 pt-4 shrink-0">
        <div>
          <p className="text-2xl font-black leading-none" style={{ color: t.ink }}>{ticker}</p>
          {article.tickerNames?.[0] && (
            <p className="text-[11px] mt-1" style={{ color: t.soft }}>{article.tickerNames[0].corp}</p>
          )}
        </div>
        {article.currentPrice != null && (
          <div className="text-right">
            <p className="text-base font-bold leading-none" style={{ color: t.ink }}>${article.currentPrice.toFixed(2)}</p>
            {chgStr && <p className="text-[12px] font-semibold mt-1" style={{ color: t.acc }}>{chgStr}</p>}
          </div>
        )}
      </div>
      {article.sparkline && article.sparkline.length > 1 && (
        <div className="mt-2 h-25 shrink-0 w-full">
          <Sparkline data={article.sparkline} strokeColor={t.stroke} />
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center px-4 gap-2">
        <span className="inline-flex items-center gap-1.5 self-start text-sm font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.7)', color: t.ink }}>
          {getSentimentText(label, score)}
        </span>
        <p className="text-[72px] font-black leading-none" style={{ color: t.ink, letterSpacing: '-2px' }}>{scoreStr}</p>
        {article.sentimentReason && (
          <p className="text-sm leading-relaxed" style={{ color: t.soft }}>{article.sentimentReason}</p>
        )}
      </div>
      <div className="mx-3 mb-3 rounded-2xl px-4 py-3 shrink-0"
        style={{ background: 'rgba(255,255,255,0.75)' }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerUpCapture={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(article.sourceUrl, '_blank'); }}>
        <div className="flex items-center gap-2 mb-1.5">
          {eventTag && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.7)', color: t.ink }}>{eventTag}</span>
          )}
          <span className="text-xs" style={{ color: t.soft }}>{getSourceName(article.sourceUrl)}</span>
          <span className="text-xs" style={{ color: t.soft }}>{getTimeAgo(article.publishedAt)}</span>
        </div>
        <p className="text-base font-semibold leading-snug line-clamp-2" style={{ color: t.ink }}>{article.headlineKo}</p>
      </div>
    </div>
  );
}

function BackFace({ article }: { article: NewsCardData }) {
  const label = (article.sentimentLabel ?? 'neutral') as keyof typeof THEME;
  const t = THEME[label] ?? THEME.neutral;
  const ticker = article.tickers?.[0] ?? '';
  const score = article.sentimentScore ?? 0;
  const scoreStr = `${score > 0 ? '+' : ''}${score}`;
  const indicators = article.indicators ?? [];

  const signalColor = (ind: { label: string }) => {
    const l = ind.label;
    if (['과열', '데드크로스', '하단 이탈', '과매도'].includes(l)) return '#c42020';
    if (['골든크로스', '급등', '상단 돌파', '과매수'].includes(l)) return '#0f8f63';
    return '#64748b';
  };

  const displayVal = (ind: { value: number | null; displayText?: string | null; type: string }) => {
    if (ind.value !== null && ind.value !== undefined) {
      if (ind.type === '거래량') {
        const pct = Math.round((ind.value - 1) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      }
      return String(ind.value);
    }
    return ind.displayText ?? '—';
  };

  return (
    <div className="absolute inset-0 rounded-[28px] overflow-hidden flex flex-col bg-white"
      style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never }}>
      <div className="h-0.75 shrink-0" style={{ background: t.acc }} />
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-black leading-none" style={{ color: t.ink }}>{ticker}</p>
            <p className="text-[10px] mt-1" style={{ color: t.soft }}>{article.tickerNames?.[0]?.corp ?? ''}</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: t.tint, color: t.acc }}>
            ${ticker}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.soft }}>핵심 인사이트</p>
          <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: t.tint }}>
            {article.summary3linesKo && article.summary3linesKo.length > 0 ? (
              article.summary3linesKo.map((line, idx) => (
                <div key={idx} className="flex gap-2 text-sm leading-relaxed" style={{ color: t.ink }}>
                  <span className="text-[10px] font-black mt-0.5 shrink-0" style={{ color: t.acc }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {line}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">요약 정보가 없습니다.</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: t.tint }}>
          <p className="text-[42px] font-black leading-none shrink-0" style={{ color: t.acc }}>{scoreStr}</p>
          <div>
            <p className="text-sm font-bold" style={{ color: t.ink }}>{getSentimentText(label, score)}</p>
            {article.sentimentReason && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: t.soft }}>{article.sentimentReason}</p>
            )}
          </div>
        </div>
        {indicators.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.soft }}>기술적 지표</p>
            <div className="grid grid-cols-2 gap-2">
              {indicators.map((ind, idx) => (
                <div key={idx} className="rounded-2xl p-3" style={{ background: t.tint }}>
                  <p className="text-[10px] font-semibold" style={{ color: t.soft }}>{ind.type}</p>
                  <p className="text-xl font-black mt-1" style={{ color: t.ink }}>{displayVal(ind)}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: signalColor(ind) }}>{ind.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-[10px] text-center leading-relaxed text-gray-400 pb-1">
          본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.{'\n'}
          투자 결정 및 손실에 대한 책임은 투자자 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
}

export const CardDeck = ({ articles, onVerticalSwipe, focusArticleId, onFlipChange }: CardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [gone, setGone] = useState(false);
  const [goneDir, setGoneDir] = useState(0);

  // 다이제스트 상태
  const [digestData, setDigestData] = useState<BriefingResponse | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState(false);

  // 퀴즈
  const [quizCard, setQuizCard] = useState<QuizQuestion | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizInsertIndex, setQuizInsertIndex] = useState(0);

  const eventQueue = useRef<{ type: string; article_id: string; dwell_ms?: number }[]>([]);
  const cardStartTime = useRef<number>(0);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // GA4 카드 레벨용
  const seenTickers = useRef<Set<string>>(new Set());
  const heroIds = useMemo(() => computeHeroIds(articles), [articles]);
  const isAutoAdded = (a: NewsCardData) => a.source === "explore";

  const flushEvents = async () => {
    if (eventQueue.current.length === 0) return;
    const events = [...eventQueue.current];
    eventQueue.current = [];
    console.log('이벤트 전송:', events);
    try {
      const accessToken = localStorage.getItem('accessToken');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ events }),
      });

    } catch (err) {
      console.error('이벤트 전송 실패:', err);
    }
  };

  useEffect(() => {
    flushTimer.current = setInterval(flushEvents, 30000);
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      flushEvents();
    };
  }, []);

  useEffect(() => {
    if (!currentArticle) return;
    cardStartTime.current = Date.now();
    eventQueue.current.push({ type: 'impression', article_id: currentArticle.id });
    if (eventQueue.current.length >= 30) flushEvents();

    // GA4
    track("card_impression", {
      ticker: currentArticle.tickers?.[0] ?? "",
      sector: currentArticle.sector ?? "",
      event_type: currentArticle.eventCategory ?? "",
      card_rank: currentIndex,
      is_hero: heroIds.has(currentArticle.id),
      is_auto_added: isAutoAdded(currentArticle),
    });
  }, [currentIndex]);

  const canShowQuiz = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('quizDaily');
    if (!stored) return true;
    const { date, count } = JSON.parse(stored);
    if (date !== today) return true;
    return count < 2;
  };

  const incrementQuizCount = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('quizDaily');
    const count = stored && JSON.parse(stored).date === today ? JSON.parse(stored).count : 0;
    localStorage.setItem('quizDaily', JSON.stringify({ date: today, count: count + 1 }));
  };

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setDigestData(null);
    setDigestLoading(false);
    setDigestError(false);
    seenTickers.current.clear();   // 새 피드 → 세션 티커 초기화

    if (articles.length > 0) {
      const insertAt = Math.floor(Math.random() * 5) + 3; // 3~7 사이
      setQuizInsertIndex(insertAt);
    }
  }, [articles]);

  useEffect(() => {
    setIsFlipped(false);
    setGone(false);
    setDragX(0);
  }, [currentIndex]);

  // focusArticleId로 해당 기사 인덱스로 이동
  useEffect(() => {
    if (focusArticleId && articles.length > 0) {
      const idx = articles.findIndex(a => a.id === focusArticleId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        sessionStorage.removeItem('pendingFocusArticleId');
      }
    }
  }, [focusArticleId, articles]);

  useEffect(() => {

    if (currentIndex === quizInsertIndex && canShowQuiz() && !showQuiz) {
      const fetchQuiz = async () => {
        try {
          const accessToken = localStorage.getItem('accessToken');
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quiz/single`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) return;
          const data: QuizQuestion = await res.json();
          setQuizCard(data);
          setShowQuiz(true);
          incrementQuizCount();
        } catch {
          console.error('퀴즈 불러오기 실패');
        }
      };
      fetchQuiz();
    }
  }, [currentIndex]);

  const currentArticle = articles[currentIndex];
  const nextArticle = articles[currentIndex + 1];

  // 카드 소진 시 digest API 호출
  useEffect(() => {
    if (!currentArticle && !digestData && !digestLoading) {
      const fetchDigest = async () => {
        setDigestLoading(true);
        setDigestError(false);
        try {
          const accessToken = localStorage.getItem('accessToken');
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analysis/digest`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error('digest 실패');
          const data: BriefingResponse = await res.json();
          setDigestData(data);
          track("feed_complete", { cards_swiped: articles.length });
        } catch {
          setDigestError(true);
        } finally {
          setDigestLoading(false);
        }
      };
      fetchDigest();
    }
  }, [currentArticle, digestData, digestLoading]);

  const dismiss = (dir: 1 | -1) => {
    if (gone) return;

    if (currentArticle) {
      const accessToken = localStorage.getItem('accessToken');

      // dwell 이벤트 (배치)
      const dwell_ms = Date.now() - cardStartTime.current;
      eventQueue.current.push({ type: 'dwell', article_id: currentArticle.id, dwell_ms });
      if (eventQueue.current.length >= 30) flushEvents();

      // GA4 card_swipe
      const ticker = currentArticle.tickers?.[0] ?? "";
      track("card_swipe", {
        direction: dir === 1 ? "right" : "left",
        dwell_ms,
        is_hero: heroIds.has(currentArticle.id),
        is_auto_added: isAutoAdded(currentArticle),
        sentiment: currentArticle.sentimentLabel ?? "",
        same_ticker_seen: seenTickers.current.has(ticker),
      });
      seenTickers.current.add(ticker);

      // read / like / dislike
      fetch(`${import.meta.env.VITE_API_BASE_URL}/news/${currentArticle.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(err => console.error('읽음 저장 실패:', err));

      const endpoint = dir === 1 ? 'like' : 'dislike';
      fetch(`${import.meta.env.VITE_API_BASE_URL}/news/${currentArticle.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(err => console.error(`${endpoint} 저장 실패:`, err));
    }

    setGoneDir(dir);
    setGone(true);
    setTimeout(() => setCurrentIndex(prev => prev + 1), 380);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setDragX(0);
    if (gone) return;
    const { offset, velocity } = info;
    if (!isFlipped && Math.abs(offset.y) > Math.abs(offset.x) && Math.abs(offset.y) > 80) {
      onVerticalSwipe(offset.y < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(offset.x) > 90 || Math.abs(velocity.x) > 450) {
      dismiss(offset.x > 0 ? 1 : -1);
    }
  };

  // 카드 소진 후 화면
  if (!currentArticle) {
    if (digestLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-sm text-gray-400">오늘의 시장을 분석하고 있어요...</p>
        </div>
      );
    }

    if (digestError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 px-8 text-center">
          <p className="text-2xl">😵</p>
          <p className="text-sm">인사이트를 불러오지 못했어요</p>
          <button onClick={() => { setDigestError(false); setDigestData(null); }}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-xl">
            다시 시도
          </button>
        </div>
      );
    }

    if (digestData) {
      return (
        <div className="relative w-full h-full max-h-175">
          <DigestCard briefing={digestData} articlesCount={articles.length} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={() => {
                track("feed_reset", {});
                setCurrentIndex(0);
                setDigestData(null);
                setDigestError(false);
              }}
              className="px-4 py-2 text-xs text-gray-400 border border-gray-200 rounded-full bg-white/80"
            >
              처음부터 다시보기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <p>모든 뉴스를 확인했습니다</p>
        <button onClick={() => {
          track("feed_reset", {});
          setCurrentIndex(0)
        }}
          className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-xl">
          처음부터 다시보기
        </button>
      </div>
    );
  }

  const likeOpacity = Math.min(Math.max(dragX / 100, 0), 1);
  const dislikeOpacity = Math.min(Math.max(-dragX / 100, 0), 1);

  // 퀴즈 카드 표시
  if (showQuiz && quizCard) {
    return (
      <div className="relative w-full h-full max-h-175">
        <QuizCard
          quiz={quizCard}
          position={quizInsertIndex}
          onComplete={() => {
            setShowQuiz(false);
            setQuizCard(null);
          }}
        />
      </div>
    );
  }
  return (

    <div className="relative w-full h-full max-h-175">

      {nextArticle && (
        <motion.div
          className="absolute inset-x-4 top-0 bottom-4 rounded-[28px] bg-white border border-gray-100"
          animate={{ scale: 0.97, y: 10 }}
          style={{ zIndex: 1 }}
        />
      )}
      <motion.div
        className="absolute w-full left-0 inset-x-4 top-0 bottom-4 cursor-grab active:cursor-grabbing select-none"
        style={{ zIndex: 2, perspective: 1300 }}
        animate={
          gone
            ? { x: goneDir * 900, rotate: goneDir * 20, opacity: 0 }
            : { x: 0, rotate: 0, opacity: 1 }
        }
        transition={
          gone
            ? { duration: 0.36, ease: [0.4, 0, 1, 1] }
            : { type: 'spring', stiffness: 300, damping: 30 }
        }
        drag={!gone}
        dragElastic={0.12}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        onTap={() => {
          if (!gone) {
            const next = !isFlipped;
            setIsFlipped(next);
            onFlipChange?.(next);
            // 앞면→뒷면 플립 시 open 이벤트
            if (next && currentArticle) {
              eventQueue.current.push({ type: 'open', article_id: currentArticle.id });
              if (eventQueue.current.length >= 30) flushEvents();
              track("card_open", { ticker: currentArticle.tickers?.[0] ?? "" });
            }
          }
        }}
      >
        <AnimatePresence>
          {likeOpacity > 0.1 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: likeOpacity }} exit={{ opacity: 0 }}
              className="absolute top-6 right-5 border-2 border-emerald-500 text-emerald-500 font-bold text-base px-3 py-1 rounded-lg rotate-12 z-10 bg-white/80"
            >
              관심있음
            </motion.div>
          )}
          {dislikeOpacity > 0.1 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: dislikeOpacity }} exit={{ opacity: 0 }}
              className="absolute top-6 left-5 border-2 border-gray-400 text-gray-500 font-bold text-base px-3 py-1 rounded-lg -rotate-12 z-10 bg-white/80"
            >
              관심없음
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <FrontFace article={currentArticle} />
          <BackFace article={currentArticle} />
        </motion.div>
      </motion.div>
    </div>
  );
};