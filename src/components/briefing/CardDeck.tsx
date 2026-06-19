import { useState, useEffect, useId } from "react";
import { motion } from "motion/react";
import type { PanInfo } from "motion/react";
import type { NewsCardData } from "../../types/news";
//유틸함수
import { getTimeAgo } from "../../utils/time";
import { getSourceName } from "../../utils/format";

interface CardDeckProps {
  articles: NewsCardData[];
  groupTicker: string;
  onVerticalSwipe: (direction: 1 | -1) => void;
}

// 테마
const THEME = {
  positive: {
    card: 'linear-gradient(172deg,#d6f1e3 0%,#b7e3cb 48%,#8fd0ac 100%)',
    ink: '#16463a', soft: '#4a7263', acc: '#0f8f63',
    tint: '#f2fdf8', stroke: '#1f6e58',
    dot: 'bg-emerald-600', pill: 'bg-emerald-50 text-emerald-800',
  },
  negative: {
    card: 'linear-gradient(172deg,#fce8e8 0%,#f0a0a0 48%,#e06060 100%)',
    ink: '#461616', soft: '#724242', acc: '#c42020',
    tint: '#fff5f5', stroke: '#6e1f1f',
    dot: 'bg-rose-600', pill: 'bg-rose-50 text-rose-800',
  },
  neutral: {
    card: 'linear-gradient(172deg,#f1f5f9 0%,#cbd5e1 48%,#94a3b8 100%)',
    ink: '#1e293b', soft: '#475569', acc: '#475569',
    tint: '#f8fafc', stroke: '#475569',
    dot: 'bg-slate-500', pill: 'bg-slate-100 text-slate-700',
  },
  mixed: {
    card: 'linear-gradient(172deg,#fef3c7 0%,#fde68a 48%,#f59e0b 100%)',
    ink: '#451a03', soft: '#78350f', acc: '#d97706',
    tint: '#fffbeb', stroke: '#92400e',
    dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800',
  },
};

// 스파크라인
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

// 앞면
function FrontFace({ article, groupTicker }: { article: NewsCardData; groupTicker: string }) {
  const label = (article.sentimentLabel ?? 'neutral') as keyof typeof THEME;
  const t = THEME[label] ?? THEME.neutral;

  const chg = article.changePct1d;
  const chgStr = chg != null
    ? `${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(1)}%`
    : null;

  const score = article.sentimentScore ?? 0;
  const scoreStr = `${score > 0 ? '+' : ''}${score}`;

  const eventTag = article.eventCategory ?? null;

  return (
    <div
      className="absolute inset-0 rounded-[28px] overflow-hidden flex flex-col"
      style={{ background: t.card, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never }}
    >
      {/* 상단 컬러 선 */}
      <div className="h-0.75 shrink-0" style={{ background: t.acc }} />

      {/* 종목 + 가격 */}
      <div className="flex items-start justify-between px-4 pt-4 shrink-0">
        <div>
          <p className="text-2xl font-black leading-none" style={{ color: t.ink }}>{groupTicker}</p>
          {article.tickerNames?.[0] && (
            <p className="text-[11px] mt-1" style={{ color: t.soft }}>{article.tickerNames[0].corp}</p>
          )}
        </div>
        {article.currentPrice != null && (
          <div className="text-right">
            <p className="text-base font-bold leading-none" style={{ color: t.ink }}>
              ${article.currentPrice.toFixed(2)}
            </p>
            {chgStr && (
              <p className="text-[12px] font-semibold mt-1" style={{ color: t.acc }}>{chgStr}</p>
            )}
          </div>
        )}
      </div>

      {/* 스파크라인 */}
      {article.sparkline && article.sparkline.length > 1 && (
        <div className="mx-2 mt-2 h-25 shrink-0">
          <Sparkline data={article.sparkline} strokeColor={t.stroke} />
        </div>
      )}

      {/* 감성 big-num */}
      <div className="flex-1 flex flex-col justify-center px-4 gap-2">
        <span
          className="inline-flex items-center gap-1.5 self-start text-sm font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.7)', color: t.ink }}
        >
          {label === 'positive' ? '강한 긍정' : label === 'negative' ? '강한 부정' : label === 'mixed' ? '혼재' : '중립'}
        </span>
        <p className="text-[72px] font-black leading-none" style={{ color: t.ink, letterSpacing: '-2px' }}>
          {scoreStr}
        </p>
        {article.sentimentReason && (
          <p className="text-sm leading-relaxed" style={{ color: t.soft }}>
            {article.sentimentReason}
          </p>
        )}
      </div>

      {/* 푸터 */}
      <div
        className="mx-3 mb-3 rounded-2xl px-4 py-3 shrink-0"
        style={{ background: 'rgba(255,255,255,0.75)' }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerUpCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          window.open(article.sourceUrl, '_blank');
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {eventTag && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.7)', color: t.ink }}>
              {eventTag}
            </span>
          )}
          <span className="text-xs" style={{ color: t.soft }}>{getSourceName(article.sourceUrl)}</span>
          <span className="text-xs" style={{ color: t.soft }}>{getTimeAgo(article.publishedAt)}</span>
        </div>
        <p className="text-base font-semibold leading-snug line-clamp-2" style={{ color: t.ink }}>
          {article.headlineKo}
        </p>
      </div>
    </div>
  );
}

// 뒷면
function BackFace({ article, groupTicker }: { article: NewsCardData; groupTicker: string }) {
  const label = (article.sentimentLabel ?? 'neutral') as keyof typeof THEME;
  const t = THEME[label] ?? THEME.neutral;
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
    <div
      className="absolute inset-0 rounded-[28px] overflow-hidden flex flex-col bg-white"
      style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never }}
    >
      <div className="h-0.75 shrink-0" style={{ background: t.acc }} />

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* 헤더 */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-black leading-none" style={{ color: t.ink }}>{groupTicker}</p>
            <p className="text-[10px] mt-1" style={{ color: t.soft }}>
              {article.tickerNames?.[0]?.corp ?? ''}
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: t.tint, color: t.acc }}>
            ${groupTicker}
          </span>
        </div>

        {/* 인사이트 */}
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

        {/* 감성 점수 */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border-b border-gray-100" style={{ background: t.tint }}>
          <p className="text-[42px] font-black leading-none shrink-0" style={{ color: t.acc }}>
            {scoreStr}
          </p>
          <div>
            <p className="text-sm font-bold" style={{ color: t.ink }}>
              {label === 'positive' ? '강한 긍정' : label === 'negative' ? '강한 부정' : label === 'mixed' ? '혼재' : '중립'}
            </p>
            {article.sentimentReason && (
              <p className="text-sm mt-1 leading-relaxed max-w-55" style={{ color: t.soft }}>
                {article.sentimentReason}
              </p>
            )}
          </div>
        </div>

        {/* 기술적 지표 */}
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

        {/* 면책조항 */}
        <p className="text-[10px] text-center leading-relaxed text-gray-400 pb-1">
          본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.{'\n'}
          투자 결정 및 손실에 대한 책임은 투자자 본인에게 있습니다.
        </p>
      </div>
    </div>
  );
}

// 메인
export const CardDeck = ({ articles, groupTicker, onVerticalSwipe }: CardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);  
  const [gone, setGone] = useState(false);
  const [goneDir, setGoneDir] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [articles]);

  useEffect(() => {
    setIsFlipped(false);
    setGone(false);
  }, [currentIndex]);

  const currentArticle = articles[currentIndex];
  const nextArticle = articles[currentIndex + 1];

  const dismiss = (dir: 1 | -1) => {
    if (gone) return;
    setGoneDir(dir);
    setGone(true);
    setTimeout(() => setCurrentIndex(prev => prev + 1), 380);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {    
    if (gone) return;
    const { offset, velocity } = info;

    if (Math.abs(offset.y) > Math.abs(offset.x) && Math.abs(offset.y) > 80) {
      onVerticalSwipe(offset.y < 0 ? 1 : -1);
      return;
    }

   // 뒷면일 때는 세로 스와이프 무시
    if (!isFlipped && Math.abs(offset.y) > Math.abs(offset.x) && Math.abs(offset.y) > 80) {
      onVerticalSwipe(offset.y < 0 ? 1 : -1);
      return;
    }

    if (Math.abs(offset.x) > 90 || Math.abs(velocity.x) > 450) {
      dismiss(offset.x > 0 ? 1 : -1);
    }
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

  return (
    <div className="relative w-full h-full max-h-175">
      {/* 다음 카드 */}
      {nextArticle && (
        <motion.div
          className="absolute inset-x-4 top-0 bottom-4 rounded-[28px] bg-white border border-gray-100"
          animate={{ scale: 0.97, y: 10 }}
          style={{ zIndex: 1 }}
        />
      )}

      {/* 현재 카드 */}
      <motion.div
        className="absolute inset-x-4 top-0 bottom-4 cursor-grab active:cursor-grabbing select-none"
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
        onDragEnd={handleDragEnd}
        onTap={() => { if (!gone) setIsFlipped(f => !f); }}
      >

        {/* 3D flip */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <FrontFace article={currentArticle} groupTicker={groupTicker} />
          <BackFace article={currentArticle} groupTicker={groupTicker} />
        </motion.div>
      </motion.div>
    </div>
  );
};