import { useState } from "react";
import type { BriefingResponse } from "../../types/digest";

interface DigestCardProps {
  briefing: BriefingResponse;
  articlesCount: number;
}

export function DigestCard({ briefing, articlesCount }: DigestCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'indicator'>('summary');

  const avg = briefing.sentiment_overview.avg_score;
  const isPositive = avg >= 0.1;
  const isNegative = avg <= -0.1;
  const acc = isPositive ? '#0f8f63' : isNegative ? '#c42020' : '#2563eb';
  const accBg = isPositive ? '#f0fdf4' : isNegative ? '#fff5f5' : '#eff6ff';

  const sentimentText = isPositive ? '긍정' : isNegative ? '부정' : '중립';
  const scoreStr = `${avg >= 0 ? '+' : ''}${avg.toFixed(2)}`;

  const getTimeAgo = (isoStr: string) => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return '방금 전';
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  const sentimentColor = (label: string) => {
    if (label === 'positive') return '#0f8f63';
    if (label === 'negative') return '#c42020';
    return '#94a3b8';
  };

  return (
    <div className="absolute inset-x-4 top-0 bottom-4 rounded-[28px] overflow-hidden flex flex-col bg-white border border-gray-100 shadow-sm">
      {/* 상단 포인트 바 */}
      <div className="h-1 shrink-0" style={{ background: acc }} />

      {/* 헤더 */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-black text-gray-900">오늘의 시장 브리핑</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: accBg, color: acc }}>
              {articlesCount}건 분석
            </span>
          </div>
          <p className="text-xs mt-1 text-gray-400">{briefing.user_tendency} · ✨ 통합 인사이트</p>
        </div>
        <div className="text-right">
          <p className="text-base font-bold" style={{ color: acc }}>{scoreStr}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{sentimentText}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex shrink-0 border-b border-gray-100">
        {(['summary', 'indicator'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-xs font-semibold transition-colors"
            style={{
              color: activeTab === tab ? acc : '#94a3b8',
              borderBottom: activeTab === tab ? `2px solid ${acc}` : '2px solid transparent',
            }}
          >
            {tab === 'summary' ? '요약' : '보조지표'}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

        {/* ── 요약 탭 ── */}
        {activeTab === 'summary' && (
          <>
            {/* 감성 오버뷰 */}
            <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">오늘의 시장</p>
              <p className="text-sm text-gray-800 leading-relaxed font-medium mb-3">
                {briefing.briefing.오늘의_시장}
              </p>
              <div className="flex gap-2">
                {[
                  { label: '긍정', value: briefing.sentiment_overview.positive, color: '#0f8f63', bg: '#f0fdf4' },
                  { label: '부정', value: briefing.sentiment_overview.negative, color: '#c42020', bg: '#fff5f5' },
                  { label: '중립', value: briefing.sentiment_overview.neutral, color: '#94a3b8', bg: '#f1f5f9' },
                ].map((s, i) => (
                  <div key={i} className="flex-1 rounded-xl p-2 text-center"
                    style={{ background: s.bg }}>
                    <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 핵심 이슈 */}
            <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">핵심 이슈</p>
              <p className="text-sm text-gray-700 leading-relaxed">{briefing.briefing.핵심_이슈}</p>
            </div>

            {/* 오늘 체크포인트 */}
            <div className="rounded-2xl p-3 border-l-4" style={{ background: accBg, borderColor: acc }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: acc }}>
                오늘 체크포인트
              </p>
              <p className="text-sm leading-relaxed" style={{ color: acc }}>
                {briefing.briefing.오늘_체크포인트}
              </p>
            </div>

            {/* 주목 기사 */}
            {briefing.top_articles.length > 0 && (
              <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">주목 기사</p>
                <div className="flex flex-col gap-2">
                  {briefing.top_articles.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: sentimentColor(a.sentiment_label) }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{a.headline_ko}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {a.tickers.slice(0, 2).map((t, j) => (
                            <span key={j} className="text-[9px] font-bold text-gray-400">${t}</span>
                          ))}
                          <span className="text-[9px] text-gray-300">{getTimeAgo(a.published_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 면책조항 */}
            <p className="text-[10px] text-center text-gray-300 leading-relaxed pb-1">
              본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.
            </p>
          </>
        )}

        {/* ── 보조지표 탭 ── */}
        {activeTab === 'indicator' && (
          <>
            {briefing.indicators.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                보조지표 데이터가 없어요
              </div>
            ) : (
              briefing.indicators.map((ind, idx) => {
                const rsi = ind.RSI ?? 50;
                const chg1d = ind.change_pct_1d ?? 0;
                const chg1m = ind.change_pct_1m ?? 0;
                const vr = ind.volume_ratio ?? 1;
                const vp = Math.round((vr - 1) * 100);
                const trend = ind.MACD?.trend ?? '중립';
                const rsiColor = rsi >= 70 ? '#ea580c' : rsi <= 30 ? '#0f8f63' : '#64748b';
                const macdColor = trend.includes('상승') ? '#0f8f63' : trend.includes('하락') ? '#c42020' : '#64748b';

                return (
                  <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                    {/* 종목 헤더 */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900">{ind.ticker}</p>
                        {ind.current_price != null && (
                          <p className="text-xs text-gray-500">${ind.current_price.toFixed(2)}</p>
                        )}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: chg1d >= 0 ? '#0f8f63' : '#c42020' }}>
                        {chg1d >= 0 ? '▲' : '▼'} {Math.abs(chg1d).toFixed(1)}%
                      </p>
                    </div>

                    {/* 지표 그리드 */}
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {/* RSI */}
                      <div className="p-3 bg-white">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">RSI</p>
                        <p className="text-lg font-black" style={{ color: rsiColor }}>{rsi.toFixed(1)}</p>
                        <p className="text-[9px] font-bold mt-0.5" style={{ color: rsiColor }}>{ind.RSI_signal ?? '중립'}</p>
                      </div>
                      {/* MACD */}
                      <div className="p-3 bg-white">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">MACD</p>
                        <p className="text-lg font-black" style={{ color: macdColor }}>
                          {trend.includes('상승') ? '강세' : trend.includes('하락') ? '약세' : '중립'}
                        </p>
                        <p className="text-[9px] font-bold mt-0.5" style={{ color: macdColor }}>{trend}</p>
                      </div>
                      {/* 거래량 */}
                      <div className="p-3 bg-white">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">거래량</p>
                        <p className="text-lg font-black" style={{ color: vr > 1.2 ? '#0f8f63' : vr < 0.8 ? '#c42020' : '#64748b' }}>
                          {vp >= 0 ? '+' : ''}{vp}%
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">평균 대비</p>
                      </div>
                      {/* 1개월 */}
                      <div className="p-3 bg-white">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">1개월</p>
                        <p className="text-lg font-black" style={{ color: chg1m >= 0 ? '#0f8f63' : '#c42020' }}>
                          {chg1m >= 0 ? '+' : ''}{chg1m.toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">등락률</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* 면책조항 */}
            <p className="text-[10px] text-center text-gray-300 leading-relaxed pb-1 mt-2">
              본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}