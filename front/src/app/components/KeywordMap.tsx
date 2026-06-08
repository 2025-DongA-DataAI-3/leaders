import { useState, useEffect, useRef } from "react";
import { TrendingUp, ChevronRight, Flame, ArrowLeft, Zap } from "lucide-react";
import * as d3 from "d3";

interface BubbleData {
  id: string;
  keyword: string;
  type: "아이템" | "소비";
  frequency: number;
  changeRate: number;
  similarity: number;
  x: number;
  y: number;
  size: number;
  category: string;
}

interface TrendRanking {
  rank: number;
  keyword: string;
  type: "아이템" | "소비";
  change: string;
  category: string;
}

const linkData = [
  { source: "kw1", target: "kw2" },
  { source: "kw1", target: "kw3" },
  { source: "kw1", target: "kw4" },
  { source: "kw2", target: "kw6" },
  { source: "kw3", target: "kw8" },
  { source: "kw4", target: "kw9" },
  { source: "kw5", target: "kw1" },
  { source: "kw7", target: "kw2" },
  { source: "kw10", target: "kw3" },
  { source: "kw4", target: "kw5" },
];

const analysisData: Record<string, {
  trend: string;
  policy: string;
  market: string;
  news: string;
  url: string;
}> = {
  "AI 에이전트": {
    trend:  "GPT-4 등장 이후 업무 자동화 수요 폭발적 증가...",
    policy: "중소벤처기업부 AI 바우처 지원사업, 2026년 예산 확대...",
    market: "글로벌 AI 에이전트 시장 2026년 약 47조원 규모 전망...",
    news:   "국내 주요 대기업 AI 에이전트 도입 본격화, 스타트업 협업 증가...",
    url:    "https://techcrunch.com/ai-agents",
  },
  "비건 밀키트": {
    trend:  "Z세대 중심으로 채식 인구 급증, 환경 의식 소비 확산...",
    policy: "농림축산식품부 친환경 식품 창업 지원 공고 연 2회 모집...",
    market: "국내 밀키트 시장 연 30% 성장, 비건 라인 수요 급증...",
    news:   "마켓컬리 비건 라인 매출 전년比 3배, 쿠팡도 비건 카테고리 신설...",
    url:    "https://platum.kr/vegan-mealkit",
  },
  "스마트팜": {
    trend:  "식량 안보 이슈 + 기후변화로 실내농업 주목...",
    policy: "농림부 스마트팜 혁신밸리 2026년 4개소 추가 조성 예정...",
    market: "국내 스마트팜 시장 2025년 6조원 돌파 전망...",
    news:   "만나CEA 3년만에 매출 100억 달성, 후속 투자 유치 성공...",
    url:    "https://www.k-startup.go.kr/smartfarm",
  },
  "펫테크": {
    trend:  "반려동물 1500만 시대, 펫 관련 지출 연평균 12% 증가...",
    policy: "농림축산식품부 반려동물 연관산업 육성 지원사업 모집 중...",
    market: "국내 펫 시장 2026년 6조원 규모, 헬스케어·IT 융합 성장...",
    news:   "퍼피레드 누적 투자 200억, 펫보험 가입률 전년比 2배 증가...",
    url:    "https://www.venturesquare.net/pettech",
  },
  "디지털헬스케어": {
    trend:  "고령화 + 의료비 증가로 예방·관리형 헬스케어 수요 급증...",
    policy: "보건복지부 디지털헬스케어 규제 샌드박스 2026년 확대 운영...",
    market: "글로벌 디지털헬스 시장 2027년 800조원 규모 전망...",
    news:   "눔 기업가치 4조원, 국내 헬스케어 앱 MAU 전년比 40% 증가...",
    url:    "https://mobiinside.co.kr/digital-healthcare",
  },
};

// 1~3위 전용 색상
const TOP3_STYLES = [
    { bar: "#00C9A7", bg: "linear-gradient(90deg, #C2F0E8 0%, #fff 100%)", numColor: "#00C9A7", crown: "#FFD700" }, // 금
    { bar: "#00B394", bg: "linear-gradient(90deg, #D8F5EF 0%, #fff 100%)", numColor: "#00B394", crown: "#C0C0C0" }, // 은
    { bar: "#00997D", bg: "linear-gradient(90deg, #E8FAF7 0%, #fff 100%)", numColor: "#00997D", crown: "#CD7F32" }, // 동
];

interface TrendButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const TrendButton = ({ children, className, ...props }: TrendButtonProps) => (
  <button className={`${className || ""}`} {...props}>{children}</button>
);

interface TrendXIconProps { className?: string; }
const TrendXIcon = ({ className }: TrendXIconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function KeywordMap() {
  const [top10Trends, setTop10Trends] = useState<TrendRanking[]>([]);
  const [bubbleData, setBubbleData]   = useState<BubbleData[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/trends/ranking')
      .then(res => res.json())
      .then(data => {
        setTop10Trends(data.map((item: any) => ({
          rank:     item.ranking,
          keyword:  item.keyword,
          type:     "아이템" as const,
          change:   `+${item.growth_rate}%`,
          category: item.category_id ?? "기타",
        })));
        setBubbleData(data.map((item: any) => ({
          id:         String(item.keyword_id),
          keyword:    item.keyword,
          type:       "아이템" as const,
          frequency:  item.frequency,
          changeRate: item.growth_rate,
          similarity: 0.8,
          x: 50, y: 50,
          size:     Math.max(60, Math.min(140, item.frequency / 20)),
          category: item.category_id ?? "기타",
        })));
      })
      .catch(err => console.error('API 호출 실패:', err));
  }, []);

  const [viewMode,      setViewMode]      = useState<"ranking" | "bubbles">("ranking");
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [filterType,    setFilterType]    = useState<"전체" | "아이템" | "소비">("전체");
  const svgRef = useRef<SVGSVGElement>(null);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "IT/소프트웨어":   "#8B5CF6",
      "제조/생산":       "#3B82F6",
      "유통/서비스":     "#F59E0B",
      "바이오/헬스케어": "#10B981",
      "친환경/에너지":   "#22C55E",
    };
    return colors[category] || "#00C9A7";
  };

  const filteredBubbles    = filterType === "전체" ? bubbleData : bubbleData.filter(b => b.type === filterType);
  const handleBubbleClick  = (id: string) => setSelectedBubble(prev => prev === id ? null : id);
  const selectedBubbleData = bubbleData.find(b => b.id === selectedBubble);
  const analysis           = selectedBubbleData ? analysisData[selectedBubbleData.keyword] : null;

  useEffect(() => {
    if (viewMode !== "bubbles" || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = svgRef.current.parentElement;
    const width  = container ? container.clientWidth  : 800;
    const height = container ? container.clientHeight : 600;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const nodes = filteredBubbles.map(d => ({ ...d, x: width / 2 + Math.random() * 10, y: height / 2 + Math.random() * 10 }));
    const links = linkData.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link",    d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge",  d3.forceManyBody().strength(-300))
      .force("center",  d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.size * 0.7 + 5));

    const drag = (sim: any) => {
      function dragstarted(e: any, d: any) { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
      function dragged(e: any, d: any)     { d.fx = e.x; d.fy = e.y; }
      function dragended(e: any, d: any)   { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    };

    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#e2e8f0").attr("stroke-opacity", 0.8).attr("stroke-width", 1.5);

    const nodeGroup = svg.append("g").selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .style("opacity", d => selectedBubble && selectedBubble !== (d as any).id ? 0.25 : 1)
      .on("click", (_, d: any) => handleBubbleClick(d.id))
      .call(drag(simulation) as any);

    nodeGroup.append("circle")
      .attr("r", (d: any) => d.size * 0.7)
      .attr("fill", (d: any) => getCategoryColor(d.category))
      .attr("opacity", 0.85)
      .attr("stroke", "white").attr("stroke-width", 2.5)
      .on("mouseover", function() { d3.select(this).attr("opacity", 1).attr("stroke-width", 3); })
      .on("mouseout",  function() { d3.select(this).attr("opacity", 0.85).attr("stroke-width", 2.5); });

    nodeGroup.append("text")
      .text((d: any) => d.keyword)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .style("fill", "white").style("font-size", "13px").style("font-weight", "700")
      .style("pointer-events", "none");

    nodeGroup.append("text")
      .text((d: any) => `${d.changeRate > 0 ? '+' : ''}${d.changeRate}%`)
      .attr("y", 17).attr("text-anchor", "middle")
      .style("fill", "rgba(255,255,255,0.85)").style("font-size", "10px")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [viewMode, filteredBubbles, selectedBubble]);

  return (
    <div className="min-h-screen bg-[#F5FFFE] py-8 px-6">
      <div className="max-w-7xl mx-auto">

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-6 h-6" style={{ color: '#00C9A7' }} />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">창업 트렌드 버블맵</h1>
          </div>
          <p className="text-sm text-gray-400 ml-8">실시간 뉴스 기반 키워드 트렌드 분석</p>
        </div>

        <div className="flex gap-6">

          {/* ── 좌측: TOP 10 랭킹 ── */}
          <div className={`transition-all duration-300 ${viewMode === "ranking" ? "w-1/2 mx-auto" : "w-72 flex-shrink-0"}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* 카드 헤더 */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Trending Now</p>
                    <h2 className="text-lg font-bold text-gray-900">급상승 TOP 10</h2>
                  </div>

                </div>
              </div>

              {/* 랭킹 목록 */}
              <div className="divide-y divide-gray-50">
                {top10Trends.map((item, index) => {
                  const isTop3  = item.rank <= 3;
                  const top3Style = isTop3 ? TOP3_STYLES[item.rank - 1] : null;

                  return (
                    <div
                      key={item.rank}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer relative"
                      style={{ background: isTop3 ? top3Style!.bg : 'white' }}
                    >
                      {/* 1~3위 컬러 바 */}
                      {isTop3 && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                          style={{ background: top3Style!.bar }}
                        />
                      )}

                      {/* 순위 숫자 + 왕관 */}
                      <div className="flex-shrink-0 text-center relative" style={{ width: '28px' }}>
                        {isTop3 ? (
                          <>
                            {/* 왕관 SVG */}
                            <svg
                              viewBox="0 0 24 14"
                              className="absolute -top-3 left-1/2 -translate-x-1/2"
                              style={{ width: '18px', height: '11px', fill: top3Style!.crown }}
                            >
                              <path d="M0 14 L3 4 L8 9 L12 0 L16 9 L21 4 L24 14 Z" />
                            </svg>
                            <span className="text-xl font-black" style={{ color: top3Style!.numColor, lineHeight: 1 }}>
                              {item.rank}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-gray-500">
                            {item.rank}
                          </span>
                        )}
                      </div>
                      

                      {/* 키워드 + 카테고리 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${isTop3 ? "text-gray-900 text-sm" : "text-gray-600 text-sm"}`}>
                            {item.keyword}
                          </span>
                          
                        </div>
                        {viewMode === "ranking" && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                        )}
                      </div>

                      {/* 상승률 */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-red-400" />
                        <span className={`font-bold text-red-400 ${isTop3 ? "text-sm" : "text-xs"}`}>
                          {item.change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 버블맵 보기 버튼 */}
              {viewMode === "ranking" && (
                <div className="flex justify-center px-6 py-5 border-t border-gray-50">
                  <TrendButton
                    onClick={() => setViewMode("bubbles")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#00C9A7' }}
                  >
                    <Zap className="w-4 h-4" />
                    버블맵으로 보기
                    <ChevronRight className="w-4 h-4" />
                  </TrendButton>
                </div>
              )}
            </div>
          </div>

          {/* ── 우측: 버블맵 ── */}
          {viewMode === "bubbles" && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                {/* 필터 */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-2">
                    {(["전체", "아이템", "소비"] as const).map((type) => (
                      <TrendButton
                        key={type}
                        onClick={() => setFilterType(type)}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background:  filterType === type ? '#00C9A7' : '#F3F4F6',
                          color:       filterType === type ? 'white'   : '#6B7280',
                        }}
                      >
                        {type}
                      </TrendButton>
                    ))}
                  </div>
                  <TrendButton
                    onClick={() => setViewMode("ranking")}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> 랭킹 보기
                  </TrendButton>
                </div>

                {/* D3 영역 */}
                <div
                  className="relative rounded-xl border border-gray-100 overflow-hidden transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #F8FFFE 0%, #F0F9FF 100%)',
                    height: selectedBubble ? '260px' : '580px',
                  }}
                >
                  <svg ref={svgRef} className="w-full h-full" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm pointer-events-none">
                    <p className="text-xs text-gray-400 mb-1.5 font-medium">크기 = 빈도  ·  색상 = 카테고리</p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#00C9A7" }} />아이템</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#D97706" }} />소비</span>
                    </div>
                  </div>
                </div>

                {/* 상세 분석 */}
                {selectedBubble && analysis && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Trend Analysis</p>
                        <h3 className="text-lg font-bold text-gray-900">{selectedBubbleData?.keyword}</h3>
                      </div>
                      <TrendButton onClick={() => setSelectedBubble(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <TrendXIcon className="w-4 h-4" />
                      </TrendButton>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {[
                        { num: "01", title: "왜 트렌드인가",    desc: "배경과 사회적 맥락", content: analysis.trend,  accent: "#00C9A7", light: "#E0F7F3" },
                        { num: "02", title: "관련 정책 및 공고", desc: "정부 지원사업",       content: analysis.policy, accent: "#6366F1", light: "#EEF2FF" },
                        { num: "03", title: "시장현황",           desc: "규모 및 성장성",      content: analysis.market, accent: "#F59E0B", light: "#FEF3C7" },
                        { num: "04", title: "뉴스인사이트",       desc: "최신 시장 시그널",    content: analysis.news,   accent: "#3B82F6", light: "#EFF6FF" },
                      ].map((item) => (
                        <div key={item.num} className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                            style={{ background: item.light, color: item.accent }}
                          >
                            {item.num}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900">{item.title}</span>
                              <span className="text-xs text-gray-400">{item.desc}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                          </div>
                        </div>
                      ))}

                      <a
                        href={analysis.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border-2 hover:shadow-sm transition-all"
                        style={{ borderColor: '#00C9A7', background: '#F0FDFB' }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: '#00C9A7' }}>
                          →
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-0.5">원문 보기</p>
                          <p className="text-xs truncate" style={{ color: '#00C9A7' }}>{analysis.url}</p>
                        </div>
                      </a>
                    </div> 
                  </div>   
                )}

              </div>
            </div>  
          )}

        </div> 
      </div>   
    </div>    
  );
}