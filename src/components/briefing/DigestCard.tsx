import { useState, useEffect, useRef, useId } from "react";
import { track } from "../../lib/analytics/ga";
import type { BriefingResponse } from "../../types/digest";
import type {
  MarketBriefingResponse,
  SentimentLabel,
  EventCategory,
  SentimentTrendPoint,
} from "../../types/market-briefing";

interface DigestCardProps {
  briefing: BriefingResponse;
  articlesCount: number;
  onReset: () => void;
}

// ── 색 팔레트 ──────────────────────────
const C = {
  green: '#0f8f63',
  red: '#c42020',
  blue: '#2563eb',
  amber: '#d97706',
  muted: '#94a3b8',
  greenBg: '#f0fdf4',
  redBg: '#fff5f5',
  blueBg: '#eff6ff',
  amberBg: '#fffbeb',
  surface: '#f8fafc',
};

const CAT_KO: Record<string, string> = {
  earnings: '실적', guidance: '가이던스', analyst: '애널리스트', product: '제품',
  ma: 'M&A', macro: '거시', regulatory: '규제', other: '기타',
};

const SECTOR_KO: Record<string, string> = {
  'Technology': '기술', 'Industrials': '산업재', 'Financials': '금융',
  'Consumer Discretionary': '경기소비재', 'Health Care': '헬스케어', 'Healthcare': '헬스케어',
  'Communication Services': '커뮤니케이션', 'Consumer Staples': '필수소비재',
  'Energy': '에너지', 'Utilities': '유틸리티', 'Real Estate': '부동산', 'Materials': '소재',
};

const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const dotColor = (l: SentimentLabel) =>
  l === 'positive' ? C.green : l === 'negative' ? C.red : l === 'mixed' ? C.amber : C.muted;
const sentColor = (v: number) => (v > 0.06 ? C.green : v < -0.06 ? C.red : C.muted);

const catStyle = (cat: EventCategory) => {
  const map: Record<string, { c: string; bg: string }> = {
    earnings: { c: C.red, bg: C.redBg },
    analyst: { c: C.amber, bg: C.amberBg },
    guidance: { c: C.amber, bg: C.amberBg },
    macro: { c: C.blue, bg: C.blueBg },
    product: { c: C.green, bg: C.greenBg },
    ma: { c: '#7c3aed', bg: '#f5f3ff' },
  };
  return map[cat] ?? { c: '#64748b', bg: '#f1f5f9' };
};

// ── 섹션 라벨 (구분선 포함) ────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-1">
      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{children}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── SVG 스파크라인 ─────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const gId = useId();
  if (!data || data.length < 2) return <p className="text-[10px] text-gray-300">가격 데이터 없음</p>;
  const W = 200, H = 44, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const xs = (W - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: pad + i * xs,
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${H} L${pts[0].x.toFixed(1)} ${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-11" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="2.2" fill={color} />
    </svg>
  );
}

// ── SVG 감성 추이 차트 (막대 + 평균선) ──────────────────────
function SentimentTrendChart({ trend }: { trend: SentimentTrendPoint[] }) {
  if (!trend.length) return null;
  const W = 320, H = 130, pad = 6, mid = H / 2;
  const n = trend.length;
  const bw = (W - pad * 2) / n;
  const maxCnt = Math.max(...trend.map(t => Math.max(t.positive, t.negative)), 1) * 1.15;

  const linePts = trend.map((t, i) => {
    const cx = pad + bw * i + bw / 2;
    const y = mid - (t.avgScore ?? 0) * (mid - 10);
    return { cx, y };
  });
  const linePath = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="#e2e8f0" strokeWidth="1" />
        {trend.map((t, i) => {
          const cx = pad + bw * i + bw / 2;
          const bar = bw * 0.34;
          const ph = (t.positive / maxCnt) * (mid - 8);
          const nh = (t.negative / maxCnt) * (mid - 8);
          return (
            <g key={i}>
              <rect x={cx - bar - 1} y={mid - ph} width={bar} height={ph} fill={C.green} rx="1" />
              <rect x={cx + 1} y={mid} width={bar} height={nh} fill={C.red} rx="1" />
            </g>
          );
        })}
        <path d={linePath} stroke={C.blue} strokeWidth="2" fill="none" />
        {linePts.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.y} r="2.4" fill={C.blue} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {trend.map((t, i) => (
          <span key={i} className="text-[8px] text-gray-400">{t.date.slice(5).replace('-', '.')}</span>
        ))}
      </div>
    </>
  );
}

export function DigestCard({ briefing, articlesCount, onReset }: DigestCardProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'chart'>('brief');
  const [market, setMarket] = useState<MarketBriefingResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState(false);

  // 피드백
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const shownAt = useRef<number>(Date.now());

  // read-briefing
  useEffect(() => {
    let cancelled = false;
    const fetchMarket = async () => {
      setMarketLoading(true);
      setMarketError(false);
      try {
        const accessToken = localStorage.getItem('accessToken');   // ← 추가
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/news/read-briefing`, {
          headers: { Authorization: `Bearer ${accessToken}` },      // ← 추가
        });
        if (!res.ok) throw new Error('read-briefing 실패');
        const data: MarketBriefingResponse = await res.json();
        if (!cancelled) {
          setMarket(data);
          shownAt.current = Date.now();
        }
      } catch (err) {
        console.error('시장 브리핑 조회 실패:', err);
        if (!cancelled) setMarketError(true);
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    };
    fetchMarket();
    return () => { cancelled = true; };
  }, []);

  // 피드백 전송
  const handleFeedback = (helpful: boolean) => {
    if (feedback) return;
    const dwell_ms = Date.now() - shownAt.current;
    setFeedback(helpful ? 'helpful' : 'not_helpful');

    // GA4 지표
    track("insight_feedback", { helpful, cards_consumed: articlesCount, dwell_ms });

    // 백엔드 신호 전송 (insight_card_pref / insight_card_dwell_ms)
    const accessToken = localStorage.getItem('accessToken');
      fetch(`${import.meta.env.VITE_API_BASE_URL}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          events: [{ type: helpful ? 'insight_helpful' : 'insight_not_helpful', dwell_ms }],
        }),
      }).catch(err => console.error('인사이트 피드백 전송 실패:', err));
    };

  const mood = market?.mood ?? '혼조';
  const moodColor = mood === '강세' ? C.green : mood === '약세' ? C.red : C.amber;
  const moodBg = mood === '강세' ? C.greenBg : mood === '약세' ? C.redBg : C.amberBg;
  const moodArrow = mood === '강세' ? '▲' : mood === '약세' ? '▼' : '▬';

  const g = market?.gauge;
  const tot = g ? (g.positive + g.negative + g.mixed + g.neutral) || 1 : 1;
  const posP = g ? Math.round((g.positive / tot) * 100) : 0;
  const negP = g ? Math.round((g.negative / tot) * 100) : 0;

  const topSector = market?.sectorStrength?.[0];
  const topSectorKo = topSector ? (SECTOR_KO[topSector.sector] ?? topSector.sector) : '-';

  return (
    <div className="absolute left-0 w-full inset-x-4 top-0 bottom-4 rounded-[28px] overflow-hidden flex flex-col bg-white border border-gray-100 shadow-sm">

      {/* 상단 포인트 바 */}
      <div className="h-1 shrink-0" style={{ background: moodColor }} />

      {/* 헤더 */}
      <div className="px-4 pt-4 shrink-0 bg-white">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
          오늘의 시장 브리핑
        </p>
        <div className="flex items-baseline gap-2.5 flex-wrap mb-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">MARKET WRAP</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ color: moodColor, background: moodBg, border: `1px solid ${moodColor}33` }}>
            {moodArrow} {mood}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-gray-400 mb-2.5">
          <span>美 증시 마감 종합</span>
          <span className="text-gray-200">·</span>
          <span>{market?.date?.replace(/-/g, '.') ?? '-'}</span>
          <span className="text-gray-200">·</span>
          <span>뉴스 {market?.totalCount ?? articlesCount}건 분석</span>
        </div>
      </div>

      {/* 감성 게이지 */}
      <div className="px-4 py-2.5 shrink-0 border-t border-gray-100" style={{ background: C.surface }}>
        <div className="flex justify-between text-[9px] font-semibold mb-1">
          <span style={{ color: C.red }}>부정 {negP}%</span>
          <span style={{ color: C.green }}>긍정 {posP}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex bg-gray-200">
          <div style={{ width: `${negP}%`, background: `linear-gradient(90deg, ${C.red}, ${C.red}99)` }} />
          <div className="ml-auto" style={{ width: `${posP}%`, background: `linear-gradient(90deg, ${C.green}99, ${C.green})` }} />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex shrink-0 border-t border-b border-gray-100" style={{ background: C.surface }}>
        {([['brief', '브리핑'], ['chart', '보조지표']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 py-3 text-[13px] font-semibold transition-colors"
            style={{
              color: activeTab === key ? (key === 'brief' ? C.blue : C.amber) : C.muted,
              borderBottom: activeTab === key
                ? `2px solid ${key === 'brief' ? C.blue : C.amber}`
                : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {marketLoading && (
          <div className="py-16 text-center">
            <div className="flex gap-1.5 justify-center mb-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p className="text-xs text-gray-400">시장 브리핑을 불러오는 중…</p>
          </div>
        )}

        {marketError && (
          <div className="py-16 text-center text-gray-400">
            <p className="text-2xl mb-2">😵</p>
            <p className="text-sm">시장 브리핑을 불러오지 못했어요</p>
          </div>
        )}

        {market && !marketLoading && (
          <>
            {/* ══════════ 브리핑 탭 ══════════ */}
            {activeTab === 'brief' && (
              <div className="flex flex-col">
                {/* 파워 섹터 */}
                <SectionLabel>오늘의 파워 섹터</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {market.sectorStrength.slice(0, 4).map((s, i) => {
                    const v = s.avgSentiment;
                    const col = v > 0.06 ? C.green : v < -0.06 ? C.red : C.amber;
                    const st = v > 0.1 ? '강세' : v > 0.03 ? '긍정 우위'
                      : v < -0.1 ? '약세' : v < -0.03 ? '부정 우위' : '관망·혼재';
                    return (
                      <div key={i} className="rounded-xl px-3 py-2.5 border border-gray-100"
                        style={{ background: C.surface, borderTop: `2.5px solid ${col}` }}>
                        <p className="text-[9px] text-gray-400 mb-1">
                          {SECTOR_KO[s.sector] ?? s.sector} · {s.count}건
                        </p>
                        <p className="text-[15px] font-semibold" style={{ color: col }}>{st}</p>
                      </div>
                    );
                  })}
                </div>

                {/* 오늘의 시장 */}
                <div className="mt-6" />
                <SectionLabel>오늘의 시장</SectionLabel>
                <div className="rounded-xl px-4 py-3.5 border border-gray-100 relative overflow-hidden"
                  style={{ background: C.surface }}>
                  <div className="absolute left-0 top-0 bottom-0 w-0.75" style={{ background: C.blue }} />
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1.5">전반 분위기</p>
                  <p className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
                    {mood === '강세' ? '전반적으로 상승 우위로 마감했어요'
                      : mood === '약세' ? '관망세 속 약세로 마감했어요'
                        : '뚜렷한 방향 없이 혼조세로 마감했어요'}
                  </p>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed">
                    {briefing.briefing.오늘의_시장 ??
                      `오늘은 총 ${market.totalCount}건의 뉴스를 살펴봤어요. 긍정 ${posP}% · 부정 ${negP}%로 시장은 전반적으로 ${mood === '강세' ? '상승 우위' : mood === '약세' ? '하락 우위' : '혼조'} 흐름이었고, ${topSectorKo} 섹터에 관심이 가장 집중됐어요.`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {market.sectorStrength.slice(0, 3).map((s, i) => {
                      const v = s.avgSentiment;
                      const st = v > 0.06 ? { c: C.green, bg: C.greenBg } : v < -0.06 ? { c: C.red, bg: C.redBg } : { c: '#64748b', bg: '#f1f5f9' };
                      return (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ color: st.c, background: st.bg, border: `1px solid ${st.c}33` }}>
                          {SECTOR_KO[s.sector] ?? s.sector} {s.count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 뉴스 대시보드 */}
                <div className="mt-6" />
                <SectionLabel>뉴스 대시보드</SectionLabel>
                <div className="flex flex-col gap-3">
                  {/* 주요 뉴스 흐름 */}
                  <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                    <p className="text-[11px] font-semibold text-gray-800 mb-3">주요 뉴스 흐름</p>
                    {market.newsFlow.map((n, i) => (
                      <div key={i} className="flex gap-2.5 py-2.5 border-b border-gray-100 last:border-0 last:pb-0">
                        <span className="shrink-0 w-1.75 h-1.75 rounded-full mt-1.25"
                          style={{ background: dotColor(n.sentimentLabel) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-800 leading-snug mb-0.5">{n.headlineKo}</p>
                          <p className="text-[10px] text-gray-400">
                            <span style={{ color: C.blue }}>{CAT_KO[n.eventCategory] ?? n.eventCategory}</span>
                            {n.source && ` · ${n.source}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 섹터별 영향 강도 */}
                  <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                    <p className="text-[11px] font-semibold text-gray-800 mb-3">섹터별 영향 강도</p>
                    {(() => {
                      const maxSec = Math.max(...market.sectorStrength.map(s => s.count), 1);
                      return market.sectorStrength.map((s, i) => {
                        const v = s.avgSentiment;
                        const tag = v > 0.1 ? '강세' : v > 0.03 ? '긍정' : v < -0.1 ? '강한 부정' : v < -0.03 ? '부정' : '혼재';
                        const tCol = v > 0.03 ? C.green : v < -0.03 ? C.red : C.amber;
                        return (
                          <div key={i} className="mb-2.5 last:mb-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-xs text-gray-700">{SECTOR_KO[s.sector] ?? s.sector}</span>
                              <span className="text-[10px] font-medium" style={{ color: tCol }}>{tag} · {s.count}건</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width: `${Math.round((s.count / maxSec) * 100)}%`, background: sentColor(v) }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* 뉴스 카테고리 */}
                  <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                    <p className="text-[11px] font-semibold text-gray-800 mb-3">뉴스 카테고리</p>
                    <div className="flex flex-wrap gap-1.5">
                      {market.categories.map((c, i) => {
                        const st = catStyle(c.category);
                        return (
                          <span key={i} className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5"
                            style={{ color: st.c, background: st.bg, border: `1px solid ${st.c}33` }}>
                            {CAT_KO[c.category] ?? c.category} <b className="font-semibold">{c.cnt}</b>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 오늘의 종목 */}
                <div className="mt-6" />
                <SectionLabel>오늘의 종목</SectionLabel>
                <div className="flex flex-col gap-3">
                  {/* 뜨거운 종목 */}
                  <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                    <p className="text-[11px] font-semibold text-gray-800 mb-3">
                      오늘 가장 뜨거운 종목 <span className="text-[10px] font-normal text-gray-400">· 언급 순</span>
                    </p>
                    {(() => {
                      const maxM = Math.max(...market.buzz.map(x => x.mentions), 1);
                      return market.buzz.map((x, i) => (
                        <div key={i} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                          <span className="text-sm font-black text-gray-900 w-12 shrink-0">{x.ticker}</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.round((x.mentions / maxM) * 100)}%`, background: sentColor(x.avgSentiment) }} />
                          </div>
                          <span className="text-[11px] text-gray-400 w-8 text-right shrink-0">{x.mentions}건</span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* 무버스 */}
                  <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                    <p className="text-[11px] font-semibold text-gray-800 mb-3">
                      오늘의 무버스 <span className="text-[10px] font-normal text-gray-400">· 대표 종목 등락률</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <p className="text-[10px] font-semibold mb-2" style={{ color: C.green }}>▲ 급등</p>
                        {(market.movers.gainers.length ? market.movers.gainers : [{ ticker: '–', changePct: NaN }]).map((m, i) => (
                          <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
                            <span className="text-sm font-bold text-gray-800">{m.ticker}</span>
                            {!isNaN(m.changePct) && (
                              <span className="text-xs font-semibold" style={{ color: C.green }}>{pct(m.changePct)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold mb-2" style={{ color: C.red }}>▼ 급락</p>
                        {(market.movers.losers.length ? market.movers.losers : [{ ticker: '–', changePct: NaN }]).map((m, i) => (
                          <div key={i} className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
                            <span className="text-sm font-bold text-gray-800">{m.ticker}</span>
                            {!isNaN(m.changePct) && (
                              <span className="text-xs font-semibold" style={{ color: C.red }}>{pct(m.changePct)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 핵심 이슈 */}
                <div className="mt-6" />
                <SectionLabel>핵심 이슈</SectionLabel>
                <div className="rounded-xl px-4 py-3.5 border border-gray-100 relative overflow-hidden"
                  style={{ background: C.surface }}>
                  <div className="absolute left-0 top-0 bottom-0 w-0.75"
                    style={{ background: `linear-gradient(to bottom, ${C.red}, ${C.blue})` }} />
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1.5">가장 파급력 큰 이슈</p>
                  <p className="text-[12.5px] text-gray-600 leading-relaxed">{briefing.briefing.핵심_이슈}</p>
                </div>

                {/* 오늘 체크포인트 */}
                <div className="mt-6" />
                <SectionLabel>오늘 체크포인트</SectionLabel>
                <div className="rounded-xl px-4 py-3.5 border border-gray-100 relative overflow-hidden"
                  style={{ background: C.surface }}>
                  <div className="absolute left-0 top-0 bottom-0 w-0.75"
                    style={{ background: `linear-gradient(to bottom, ${C.red}, ${C.blue})` }} />
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-1.5">봐야 할 것</p>
                  <p className="text-[12.5px] text-gray-600 leading-relaxed">{briefing.briefing.오늘_체크포인트}</p>
                </div>

                <p className="text-[10px] text-center text-gray-300 leading-relaxed mt-6 pb-1">
                  본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.
                </p>
              </div>
            )}

            {/* ══════════ 보조지표 탭 ══════════ */}
            {activeTab === 'chart' && (
              <div className="flex flex-col">
                {/* 감성 추이 */}
                <SectionLabel>시장 감성 추이 (최근 {market.sentimentTrend.length}일)</SectionLabel>
                <div className="rounded-xl p-4 border border-gray-100" style={{ background: C.surface }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400">일별 긍정/부정</span>
                    <div className="flex gap-2.5">
                      {[['긍정', C.green], ['부정', C.red], ['평균', C.blue]].map(([l, c]) => (
                        <span key={l} className="text-[9px] text-gray-400 flex items-center gap-1">
                          <span className="w-2 h-0.5 rounded-full inline-block" style={{ background: c }} />{l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <SentimentTrendChart trend={market.sentimentTrend} />
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-2.5 pt-2.5 border-t border-gray-100">
                    AI가 매일 전체 뉴스를 읽고 낸 감성이에요. 초록이 높을수록 긍정, 빨강이 높을수록 부정 뉴스가 많았고,
                    파란 선(평균)이 전체 방향을 보여줘요.
                  </p>
                </div>

                {/* 대표 종목 가격 흐름 */}
                <div className="mt-6" />
                <SectionLabel>대표 종목 가격 흐름</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {market.indicators.map((it, i) => (
                    <div key={i} className="rounded-xl px-3 py-3 border border-gray-100" style={{ background: C.surface }}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-lg font-black text-gray-900">{it.ticker}</span>
                        <span className="text-[11px] font-semibold"
                          style={{ color: it.changePct >= 0 ? C.green : C.red }}>
                          {pct(it.changePct)}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 mb-1.5">최근 흐름</p>
                      <Sparkline data={it.sparkline} color={it.changePct >= 0 ? C.green : C.red} />
                    </div>
                  ))}
                </div>

                {/* 대표 종목 현재 지표 */}
                <div className="mt-6" />
                <SectionLabel>대표 종목 현재 지표</SectionLabel>
                <div className="flex flex-col gap-2.5">
                  {market.indicators.map((it, i) => (
                    <div key={i} className="rounded-xl px-4 py-3.5 border border-gray-100" style={{ background: C.surface }}>
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-lg font-black text-gray-900">{it.ticker}</span>
                        <span className="text-[11px] font-semibold"
                          style={{ color: it.changePct >= 0 ? C.green : C.red }}>
                          {pct(it.changePct)}
                        </span>
                      </div>
                      <div className="flex gap-px rounded-lg overflow-hidden bg-gray-100">
                        {it.indicators.slice(0, 3).map((ind, j) => {
                          const val = ind.value != null
                            ? (ind.type === 'RSI' ? ind.value.toFixed(0) : ind.value.toFixed(2))
                            : (ind.displayText ?? ind.label ?? '–');
                          return (
                            <div key={j} className="flex-1 px-2.5 py-2.5 bg-white">
                              <p className="text-[8px] uppercase text-gray-400 mb-1">{ind.type}</p>
                              <p className="text-sm font-bold text-gray-900">{val}</p>
                            </div>
                          );
                        })}
                      </div>
                      {it.indicators[0]?.caption && (
                        <p className="text-[11px] text-gray-500 leading-relaxed mt-2.5">{it.indicators[0].caption}</p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-gray-400 leading-relaxed mt-4">
                  ※ RSI·MACD·거래량은 현재값 스냅샷이에요.
                </p>
                <p className="text-[10px] text-center text-gray-300 leading-relaxed mt-4 pb-1">
                  본 서비스는 투자 참고용 정보를 제공하며, 수익성을 보장하지 않습니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════ 하단 피드백 + 다시보기 ══════════ */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
        {feedback ? (
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gray-400 flex-1">
              {feedback === 'helpful' ? '의견 감사해요!' : '의견 감사해요.'}
            </p>
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-full text-[11px] text-gray-400 border border-gray-200 bg-white shrink-0 opacity-80 hover:opacity-100"
            >
              처음부터 다시보기
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gray-500 shrink-0">이 브리핑이 도움 됐나요?</p>
            <div className="flex gap-1.5 ml-auto">
              <button
                onClick={() => handleFeedback(true)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors opacity-80 hover:opacity-100"
                style={{ color: C.green, borderColor: `${C.green}44`, background: C.greenBg }}
              >
                도움됐어요
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-gray-200 bg-gray-50 text-gray-500 opacity-80 hover:opacity-100"
              >
                별로예요
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}