import { useState, useEffect } from "react";
import type { BriefingResponse } from "../../types/digest";

interface TimelineSession {
  label: string;
  sentiment: string;
  count: number;
  articles: { headlineKo: string }[];
}

interface DigestCardProps {
  briefing: BriefingResponse;
  articlesCount: number;
}

export function DigestCard({ briefing, articlesCount }: DigestCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'indicator'>('summary');
  const [timeline, setTimeline] = useState<TimelineSession[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const avg = briefing.sentiment_overview.avg_score;
  const isPositive = avg >= 0.1;
  const isNegative = avg <= -0.1;
  const acc = isPositive ? '#0f8f63' : isNegative ? '#c42020' : '#2563eb';
  const accBg = isPositive ? '#f0fdf4' : isNegative ? '#fff5f5' : '#eff6ff';

  // 대표 종목 (첫 번째 indicator)
  const rep = briefing.indicators?.[0];
  const rsi = rep?.RSI ?? 50;
  const chg1d = rep?.change_pct_1d ?? 0;
  const chg1m = rep?.change_pct_1m ?? 0;
  const vr = rep?.volume_ratio ?? 1;
  const vp = Math.round((vr - 1) * 100);
  const trend = rep?.MACD?.trend ?? '중립';

  // 타임라인 (대표 종목 기준)
  useEffect(() => {
    if (!rep?.ticker) return;
    const fetchTimeline = async () => {
      setTimelineLoading(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/analysis/ticker-timeline?ticker=${rep.ticker}&sessions=5`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTimeline(data.sessions ?? []);
      } catch {
        setTimeline([]);
      } finally {
        setTimelineLoading(false);
      }
    };
    fetchTimeline();
  }, [rep?.ticker]);

  // 오늘 한마디
  const getVerdict = () => {
    const sent = avg > 0.15 ? 'pos' : avg < -0.15 ? 'neg' : 'neu';
    let msg = '';
    if (sent === 'pos' && chg1d >= 0) msg = '긍정적인 뉴스 흐름 속에 주가도 상승했어요. 우호적인 하루였어요.';
    else if (sent === 'pos' && chg1d < 0) msg = '뉴스는 긍정적이지만 주가는 하락했어요. 차익실현 움직임일 수 있어요.';
    else if (sent === 'neg' && chg1d < 0) msg = '부정적인 뉴스와 함께 주가도 약세였어요. 주의가 필요한 흐름이에요.';
    else if (sent === 'neg' && chg1d >= 0) msg = '악재에도 주가는 버텼어요. 저가 매수세가 들어온 모습이에요.';
    else msg = '오늘 뉴스 흐름은 중립적이에요. 아직 뚜렷한 방향성은 없어요.';
    if (rsi >= 70) msg += ' RSI가 과열 구간이라 단기 변동성에 유의하세요.';
    else if (rsi <= 30) msg += ' RSI는 과매도 구간으로 기술적 반등 가능성이 있어요.';
    return msg;
  };

  const rsiDesc = () => {
    if (rsi >= 70) return `RSI ${rsi.toFixed(1)} — 과매수 구간이에요. 조정이 올 수 있으니 주의하세요.`;
    if (rsi <= 30) return `RSI ${rsi.toFixed(1)} — 과매도 구간이에요. 반등 가능성을 볼 수 있어요.`;
    return `RSI ${rsi.toFixed(1)} — 안정적인 구간이에요.`;
  };

  const macdDesc = () => {
    if (trend.includes('상승')) return '모멘텀이 상승 방향으로 강화되고 있어요.';
    if (trend.includes('하락')) return '모멘텀이 약화되어 하락 추세 전환 중이에요.';
    return '방향성이 아직 명확하지 않은 상태예요.';
  };

  const volDesc = () => {
    if (vr > 1.2) return '거래량이 평균보다 많아요. 큰 움직임의 신호예요.';
    if (vr < 0.8) return '거래량이 적어요. 많은 투자자가 관망 중이에요.';
    return '거래량이 평균 수준이에요.';
  };

  const sentimentColor = (s: string) => {
    if (s === 'positive') return '#0f8f63';
    if (s === 'negative') return '#c42020';
    return '#94a3b8';
  };

  const sentimentKo = (s: string) => {
    if (s === 'positive') return '긍정';
    if (s === 'negative') return '부정';
    return '중립';
  };

  // 칩 데이터
  const chips = [
    {
      icon: avg > 0.15 ? '🟢' : avg < -0.15 ? '🔴' : '⚪',
      label: '감성',
      value: avg > 0.15 ? '긍정' : avg < -0.15 ? '부정' : '중립',
      color: acc,
      bg: accBg,
    },
    {
      icon: '📊',
      label: 'RSI',
      value: rsi.toFixed(0),
      color: rsi >= 70 ? '#ea580c' : rsi <= 30 ? '#0f8f63' : '#64748b',
      bg: rsi >= 70 ? '#fff7ed' : rsi <= 30 ? '#f0fdf4' : '#f1f5f9',
    },
    {
      icon: '🔊',
      label: '거래량',
      value: `${vp >= 0 ? '+' : ''}${vp}%`,
      color: vr > 1.2 ? '#c42020' : vr < 0.8 ? '#2563eb' : '#64748b',
      bg: vr > 1.2 ? '#fff5f5' : vr < 0.8 ? '#eff6ff' : '#f1f5f9',
    },
    {
      icon: '⚡',
      label: '추세',
      value: trend.includes('상승') ? '강세' : trend.includes('하락') ? '약세' : '중립',
      color: trend.includes('상승') ? '#0f8f63' : trend.includes('하락') ? '#c42020' : '#64748b',
      bg: trend.includes('상승') ? '#f0fdf4' : trend.includes('하락') ? '#fff5f5' : '#f1f5f9',
    },
    {
      icon: chg1d >= 0 ? '▲' : '▼',
      label: '1일',
      value: `${chg1d >= 0 ? '+' : ''}${chg1d.toFixed(1)}%`,
      color: chg1d >= 0 ? '#0f8f63' : '#c42020',
      bg: chg1d >= 0 ? '#f0fdf4' : '#fff5f5',
    },
  ];

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
            {/* 오늘 한마디 */}
            <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">오늘 한마디</p>
              <p className="text-sm font-bold text-gray-800 leading-relaxed mb-3">{getVerdict()}</p>
              <div className="flex gap-1.5">
                {chips.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center py-2 rounded-xl border"
                    style={{ background: c.bg, borderColor: c.bg }}>
                    <span className="text-sm leading-none">{c.icon}</span>
                    <span className="text-[8px] text-gray-400 mt-1">{c.label}</span>
                    <span className="text-[9px] font-black mt-0.5" style={{ color: c.color }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 핵심 이슈 */}
            <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">핵심 이슈</p>
              <p className="text-sm text-gray-700 leading-relaxed">{briefing.briefing.핵심_이슈}</p>
            </div>

            {/* 타임라인 */}
            {!timelineLoading && timeline.length > 0 && (
              <div className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  거래일별 흐름 · 미국장 마감 기준
                </p>
                <div className="flex flex-col gap-0">
                  {timeline.map((s, idx) => (
                    <div key={idx} className="relative flex gap-3 pb-3 last:pb-0">
                      {idx < timeline.length - 1 && (
                        <div className="absolute left-[7px] top-3 bottom-0 w-[1.5px] bg-gray-100" />
                      )}
                      <div className="w-3.5 h-3.5 rounded-full border-2 bg-white shrink-0 mt-0.5 z-10"
                        style={{ borderColor: sentimentColor(s.sentiment) }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[10px] font-bold text-gray-700">{s.label} 장</p>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              color: sentimentColor(s.sentiment),
                              background: s.sentiment === 'positive' ? '#f0fdf4' : s.sentiment === 'negative' ? '#fff5f5' : '#f1f5f9'
                            }}>
                            {sentimentKo(s.sentiment)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {s.articles?.[0]?.headlineKo ?? ''}
                          {s.count > 1 && <span className="text-gray-400"> +{s.count - 1}건</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {chg1m !== 0 && (
                  <p className="text-[9px] text-gray-300 mt-2 pt-2 border-t border-gray-50">
                    최근 1개월 {chg1m >= 0 ? '+' : ''}{chg1m.toFixed(1)}%
                  </p>
                )}
              </div>
            )}

            {/* 오늘 체크포인트 */}
            <div className="rounded-2xl p-3 border-l-4" style={{ background: accBg, borderColor: acc }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: acc }}>
                오늘 체크포인트
              </p>
              <p className="text-sm leading-relaxed" style={{ color: acc }}>
                {briefing.briefing.오늘_체크포인트}
              </p>
            </div>

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
                const indRsi = ind.RSI ?? 50;
                const indChg1d = ind.change_pct_1d ?? 0;
                const indChg1m = ind.change_pct_1m ?? 0;
                const indVr = ind.volume_ratio ?? 1;
                const indVp = Math.round((indVr - 1) * 100);
                const indTrend = ind.MACD?.trend ?? '중립';
                const rsiColor = indRsi >= 70 ? '#ea580c' : indRsi <= 30 ? '#0f8f63' : '#64748b';
                const macdColor = indTrend.includes('상승') ? '#0f8f63' : indTrend.includes('하락') ? '#c42020' : '#64748b';

                return (
                  <div key={idx} className="rounded-2xl p-3 bg-white border border-gray-100 shadow-sm flex flex-col gap-3">
                    {/* 종목 헤더 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black text-gray-900">{ind.ticker}</p>
                        {ind.current_price != null && (
                          <p className="text-xs text-gray-500">${ind.current_price.toFixed(2)}</p>
                        )}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: indChg1d >= 0 ? '#0f8f63' : '#c42020' }}>
                        {indChg1d >= 0 ? '▲' : '▼'} {Math.abs(indChg1d).toFixed(1)}%
                      </p>
                    </div>

                    {/* RSI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-500">RSI (14일)</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: rsiColor, background: indRsi >= 70 ? '#fff7ed' : indRsi <= 30 ? '#f0fdf4' : '#f1f5f9' }}>
                          {ind.RSI_signal ?? '중립'}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 mb-1">{indRsi.toFixed(1)}</p>
                      <div className="relative h-2 rounded-full overflow-hidden mb-1">
                        <div className="absolute inset-0 rounded-full"
                          style={{ background: 'linear-gradient(90deg,#22c55e 0%,#eab308 55%,#ef4444 80%)' }} />
                        <div className="absolute top-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full"
                          style={{ left: `${Math.min(indRsi, 100)}%`, transform: 'translate(-50%, -50%)' }} />
                      </div>
                      <p className="text-[10px] text-gray-500">{rsiDesc()}</p>
                    </div>

                    {/* MACD */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-500">MACD</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: macdColor, background: indTrend.includes('상승') ? '#f0fdf4' : indTrend.includes('하락') ? '#fff5f5' : '#f1f5f9' }}>
                          {indTrend}
                        </span>
                      </div>
                      <p className="text-2xl font-black mb-1" style={{ color: macdColor }}>
                        {indTrend.includes('상승') ? '강세' : indTrend.includes('하락') ? '약세' : '중립'}
                      </p>
                      {(() => {
                        const histogram = ind.MACD?.histogram ?? 0;
                        const bars = [0.8, 0.6, 0.9, 0.7, 0.5, 0.3, histogram > 0 ? 0.2 : -0.2, histogram];
                        const maxVal = Math.max(...bars.map(Math.abs), 0.1);
                        return (
                          <div className="flex items-end gap-0.5 h-8 mb-1">
                            {bars.map((v, i) => {
                              const h = Math.round((Math.abs(v) / maxVal) * 28) + 3;
                              const isPos = v >= 0;
                              const isStrong = Math.abs(v) > 0.5;
                              return (
                                <div key={i} className="flex-1 rounded-sm"
                                  style={{ height: `${h}px`, background: isPos ? isStrong ? '#0f8f63' : '#86efac' : isStrong ? '#c42020' : '#fca5a5' }} />
                              );
                            })}
                          </div>
                        );
                      })()}
                      <p className="text-[10px] text-gray-500">{macdDesc()}</p>
                    </div>

                    {/* 거래량 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-500">거래량</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: indVr > 1.2 ? '#c42020' : indVr < 0.8 ? '#2563eb' : '#64748b', background: indVr > 1.2 ? '#fff5f5' : indVr < 0.8 ? '#eff6ff' : '#f1f5f9' }}>
                          {indVr > 1.2 ? '거래 활발' : indVr < 0.8 ? '관망세' : '평균'}
                        </span>
                      </div>
                      <p className="text-2xl font-black mb-1"
                        style={{ color: indVr > 1.2 ? '#c42020' : indVr < 0.8 ? '#2563eb' : '#64748b' }}>
                        {indVp >= 0 ? '+' : ''}{indVp}%
                      </p>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1">
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.min(indVr * 50, 100)}%`, background: indVr > 1.2 ? '#fca5a5' : '#93c5fd' }} />
                      </div>
                      <p className="text-[10px] text-gray-500">{volDesc()}</p>
                    </div>

                    {/* 1일/1개월 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-2 bg-gray-50">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">1일 등락</p>
                        <p className="text-lg font-black" style={{ color: indChg1d >= 0 ? '#0f8f63' : '#c42020' }}>
                          {indChg1d >= 0 ? '+' : ''}{indChg1d.toFixed(1)}%
                        </p>
                      </div>
                      <div className="rounded-xl p-2 bg-gray-50">
                        <p className="text-[9px] font-bold text-gray-400 mb-1">1개월 등락</p>
                        <p className="text-lg font-black" style={{ color: indChg1m >= 0 ? '#0f8f63' : '#c42020' }}>
                          {indChg1m >= 0 ? '+' : ''}{indChg1m.toFixed(1)}%
                        </p>
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