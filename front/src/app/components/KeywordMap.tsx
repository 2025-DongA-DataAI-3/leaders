import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, ChevronRight, Flame, ArrowLeft } from "lucide-react";
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

// D3 chart 연결선 선언하기
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
  { source: "kw4", target: "kw5" }
];

const analysisData: Record<string, {
  why: string;
  when: string;
  what: string;
  how: string;
  who: string;
  source: string;
}> = {
  "AI 에이전트": { why: "GPT-4 등장 이후 업무 자동화 수요 폭발...", when: "지금 시작하면 딱 좋음...", what: "B2B SaaS 모델로 월 구독료 받기...", how: "특정 업무에 특화된 AI 에이전트 개발...", who: "미국 Adept AI는 시리즈 B에서 4억 달러...", source: "https://techcrunch.com/ai-agents" },
  "비건 밀키트": { why: "Z세대 중심으로 채식 인구 급증...", when: "지금 바로 가능...", what: "정기 구독 모델...", how: "레시피 개발 → 식자재 소싱...", who: "마켓컬리 비건 라인 매출 전년比 3배...", source: "https://platum.kr/vegan-mealkit" },
  "스마트팜": { why: "식량 안보 이슈 + 기후변화로 실내농업 주목...", when: "준비 기간 6개월 필요...", what: "농산물 판매 + 농장 견학...", how: "소규모 시설 구축 → 데이터 축적...", who: "만나CEA는 3년만에 매출 100억 달성...", source: "https://www.k-startup.go.kr/smartfarm" },
  "펫테크": { why: "반려동물 1500만 시대...", when: "지금이 적기...", what: "구독 모델...", how: "펫 오너 페인포인트 파악...", who: "'퍼피레드' 누적 투자 200억...", source: "https://www.venturesquare.net/pettech" },
  "디지털헬스케어": { why: "고령화 + 의료비 증가...", when: "규제 이슈 있지만 완화 추세...", what: "앱 구독료...", how: "전문가 협업 필수...", who: "'눔' 기업가치 4조원...", source: "https://mobiinside.co.kr/digital-healthcare" }
};

interface TrendButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const TrendButton = ({ children, className, ...props }: TrendButtonProps) => (
  <button className={`${className || ""}`} {...props}>{children}</button>
);
TrendButton.displayName = "TrendButton";

interface TrendXIconProps { className?: string; }
const TrendXIcon = ({ className }: TrendXIconProps) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
TrendXIcon.displayName = "TrendXIcon";


export default function KeywordMap() {

const [top10Trends, setTop10Trends] = useState<TrendRanking[]>([]);
const [bubbleData, setBubbleData] = useState<BubbleData[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('http://localhost:5000/api/trends/ranking')
    .then(res => res.json())
    .then(data => {
      // TOP 10 랭킹 데이터 변환
      const ranking: TrendRanking[] = data.map((item: any) => ({
        rank: item.ranking,
        keyword: item.keyword,
        type: "아이템" as const,       // DB에 type 없으면 임시
        change: `+${item.growth_rate}%`,
        category: item.category_id ?? "기타",
      }));

      // 버블 데이터 변환
      const bubbles: BubbleData[] = data.map((item: any, idx: number) => ({
        id: String(item.keyword_id),
        keyword: item.keyword,
        type: "아이템" as const,
        frequency: item.frequency,
        changeRate: item.growth_rate,
        similarity: 0.8,
        x: 50, y: 50,
        size: Math.max(60, Math.min(140, item.frequency / 20)),
        category: item.category_id ?? "기타",
      }));

      setTop10Trends(ranking);
      setBubbleData(bubbles);
      setLoading(false);
    })
    .catch(err => {
      console.error('API 호출 실패:', err);
      setLoading(false);
    });
}, []);
  // 1. 상태 및 Ref 선언
  const [viewMode, setViewMode] = useState<"ranking" | "bubbles">("ranking");
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"전체" | "아이템" | "소비">("전체");
  const [animatingRanks, setAnimatingRanks] = useState<number[]>([]);
  const [pulseRanks, setPulseRanks] = useState<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // 2. 비동기 변동 효과
  useEffect(() => {
    const interval = setInterval(() => {
      const count = Math.floor(Math.random() * 3) + 2;
      const randomRanks: number[] = [];
      while (randomRanks.length < count) {
        const rank = Math.floor(Math.random() * 10) + 1;
        if (!randomRanks.includes(rank)) randomRanks.push(rank);
      }
      setAnimatingRanks(randomRanks);

      setTimeout(() => {
        const pulseCount = Math.floor(Math.random() * 2) + 1;
        const pulseRandomRanks: number[] = [];
        while (pulseRandomRanks.length < pulseCount) {
          const rank = Math.floor(Math.random() * 10) + 1;
          if (!pulseRandomRanks.includes(rank)) pulseRandomRanks.push(rank);
        }
        setPulseRanks(pulseRandomRanks);
      }, 500);

      setTimeout(() => {
        setAnimatingRanks([]);
        setPulseRanks([]);
      }, 2000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3. 변수 및 핸들러 선언 (순서 중요!)
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "IT/소프트웨어": "#8B5CF6",
      "제조/생산": "#3B82F6",
      "유통/서비스": "#F59E0B",
      "바이오/헬스케어": "#10B981",
      "친환경/에너지": "#22C55E",
    };
    return colors[category] || "#00C9A7";
  };

  const filteredBubbles = filterType === "전체"
    ? bubbleData
    : bubbleData.filter(b => b.type === filterType);

  const handleBubbleClick = (bubbleId: string) => {
    setSelectedBubble(prev => prev === bubbleId ? null : bubbleId);
  };

  const selectedBubbleData = bubbleData.find(b => b.id === selectedBubble);
  const analysis = selectedBubbleData ? analysisData[selectedBubbleData.keyword] : null;

// 4. D3 물리 엔진 시뮬레이션 (선 연결 포함 완벽한 Force Graph)
  useEffect(() => {
    if (viewMode !== "bubbles" || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 기존 렌더링 지우기

    const container = svgRef.current.parentElement;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 600;

    // ✨ 4-1. SVG의 내부 캔버스 비율을 꽉 차게 고정 (잘림 방지)
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // 데이터 복사 (D3가 내부적으로 객체를 변형하므로 얕은 복사 필요)
    // ✨ 4-2. 기존 퍼센트 x, y 값 무시하고 화면 정중앙에서 생성되도록 덮어쓰기
    const nodes = filteredBubbles.map(d => ({ 
      ...d,
      x: width / 2 + (Math.random() * 10), // 정중앙에서 시작
      y: height / 2 + (Math.random() * 10)
    }));
    // 💡 연결선 데이터도 D3 용으로 복사
    const links = linkData.map(d => ({ ...d })); 

    // 🔥 시뮬레이션에 링크(선) 잡아당기는 힘 추가!
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120)) // 선 길이 120px
      .force("charge", d3.forceManyBody().strength(-300)) // 척력을 강하게 줘서 넓게 퍼지게 함
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.size * 0.7) + 5));

    const drag = (sim: any) => {
      function dragstarted(event: any, d: any) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      }
      function dragged(event: any, d: any) {
        d.fx = event.x; d.fy = event.y;
      }
      function dragended(event: any, d: any) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    };

    // 💡 중요: 선을 먼저 그려야 버블 뒤로 숨습니다 (레이어 순서)
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#cbd5e1") // 선 색상 (연한 회색)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .style("opacity", d => selectedBubble && selectedBubble !== (d as any).id ? 0.3 : 1)
      .on("click", (event, d: any) => handleBubbleClick(d.id))
      .call(drag(simulation) as any);

    nodeGroup.append("circle")
      .attr("r", (d: any) => d.size * 0.7)
      .attr("fill", (d: any) => getCategoryColor(d.category))
      .attr("opacity", 0.8)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mouseover", function() { d3.select(this).attr("opacity", 1); })
      .on("mouseout", function() { d3.select(this).attr("opacity", 0.8); });

    nodeGroup.append("text")
      .text((d: any) => d.keyword)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", "white")
      .style("font-size", (d: any) => d.id === selectedBubble ? "11px" : "13px")
      .style("font-weight", "bold")
      .style("pointer-events", "none");

    nodeGroup.append("text")
      .text((d: any) => `${d.changeRate > 0 ? '+' : ''}${d.changeRate}%`)
      .attr("y", 16)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "10px")
      .style("pointer-events", "none");

    // 매 프레임마다 버블과 '선'의 좌표를 업데이트
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [viewMode, filteredBubbles, selectedBubble]);

  // 5. 화면 렌더링
  return (
    <>
      <style>{`
        @keyframes slideInFromLeft { 0% { opacity: 0; transform: translateX(-30px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(0, 201, 167, 0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#F5FFFE] to-[#E0F7F3] py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="mb-2 text-gray-900 flex items-center gap-2">
              <Flame className="w-8 h-8" style={{ color: '#00C9A7' }} /> 창업 트렌드 버블맵
            </h1>
            <p className="text-gray-600">실시간 트렌드 분석으로 창업 아이템을 발견하세요</p>
          </div>

          <div className="flex gap-6 transition-all duration-500">
            {/* Top10 랭킹 (좌측) */}
            <div className={`transition-all duration-500 ${viewMode === "ranking" ? "w-full" : "w-80 flex-shrink-0"}`}>
              <div className={`bg-white rounded-2xl shadow-xl relative overflow-hidden ${viewMode === "bubbles" ? "p-4" : "p-6"}`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00C9A7] to-transparent animate-shimmer"></div>
                <div className={`flex items-center justify-between mb-6 ${viewMode === "bubbles" ? "flex-col items-start gap-2" : ""}`}>
                  <div>
                    <h2 className={`font-bold text-gray-900 flex items-center gap-2 ${viewMode === "bubbles" ? "text-base" : "text-xl"}`}>
                      <TrendingUp className={viewMode === "bubbles" ? "w-5 h-5" : "w-6 h-6"} style={{ color: '#00C9A7' }} /> 급상승 TOP 10
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></div>
                      <span className="text-xs text-gray-500">실시간 업데이트 중</span>
                    </div>
                  </div>
                  {viewMode === "ranking" && (
                    <TrendButton onClick={() => setViewMode("bubbles")} className="flex items-center gap-2 px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-colors text-sm">
                      버블맵 보기 <ChevronRight className="w-4 h-4" />
                    </TrendButton>
                  )}
                </div>

                <div className={viewMode === "bubbles" ? "space-y-2" : "space-y-3"}>
                  {top10Trends.map((item, index) => {
                    const isAnimating = animatingRanks.includes(item.rank);
                    const isPulsing = pulseRanks.includes(item.rank);
                    return (
                      <div key={item.rank} className={`flex items-center rounded-xl hover:bg-gray-50 cursor-pointer border transition-all duration-500 ${isAnimating ? "border-[#00C9A7] bg-[#E0F7F3]/30 shadow-lg scale-105" : "border-gray-100"} ${viewMode === "bubbles" ? "gap-2 p-2" : "gap-4 p-4"}`} style={{ animation: `slideInFromLeft 0.5s ease-out ${index * 0.1}s both` }}>
                        <div className={`rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 flex-shrink-0 ${isPulsing ? "animate-pulse" : ""} ${viewMode === "bubbles" ? "w-7 h-7 text-xs" : "w-10 h-10"}`} style={{ background: item.rank <= 3 ? `linear-gradient(135deg, ${getCategoryColor(item.category)}, ${getCategoryColor(item.category)}dd)` : '#E5E7EB', color: item.rank <= 3 ? 'white' : '#6B7280', transform: isAnimating ? 'scale(1.1)' : 'scale(1)' }}>
                          {item.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center gap-1 ${viewMode === "bubbles" ? "mb-0.5" : "mb-1"}`}>
                            <h3 className={`font-semibold text-gray-900 transition-all duration-300 truncate ${isAnimating ? "text-[#00C9A7]" : ""} ${viewMode === "bubbles" ? "text-xs" : "text-sm"}`}>{item.keyword}</h3>
                            {viewMode === "ranking" && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: item.type === "아이템" ? "#E0F7F3" : "#FEF3C7", color: item.type === "아이템" ? "#00C9A7" : "#D97706" }}>{item.type}</span>
                            )}
                          </div>
                          {viewMode === "ranking" && <div className="text-xs text-gray-500">{item.category}</div>}
                        </div>
                        <div className={`flex items-center gap-1 text-red-500 font-bold transition-all duration-300 flex-shrink-0 ${isAnimating ? "scale-110" : ""} ${viewMode === "bubbles" ? "text-xs" : "text-sm"}`}>
                          <TrendingUp className={`${isPulsing ? "animate-bounce" : ""} ${viewMode === "bubbles" ? "w-3 h-3" : "w-4 h-4"}`} />
                          <span className={isPulsing ? "animate-pulse" : ""}>{item.change}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 버블맵 (우측) */}
            {viewMode === "bubbles" && (
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  {/* 필터 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                      {(["전체", "아이템", "소비"] as const).map((type) => (
                        <TrendButton key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${filterType === type ? "bg-[#00C9A7] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {type}
                        </TrendButton>
                      ))}
                    </div>
                    <TrendButton onClick={() => setViewMode("ranking")} className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors text-sm">
                      <ArrowLeft className="w-4 h-4" /> 랭킹 보기
                    </TrendButton>
                  </div>

                  {/* D3 렌더링 영역 */}
                  <div className={`relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100 transition-all duration-500 overflow-hidden ${selectedBubble ? "h-64" : "h-[600px]"}`}>
                    <svg ref={svgRef} className="w-full h-full"></svg>

                    {/* 범례 */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg pointer-events-none">
                      <div className="text-xs text-gray-600 mb-2 font-medium">크기 = 빈도 | 색상 = 카테고리</div>
                      <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: "#00C9A7" }}></div><span>아이템</span></div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{ background: "#D97706" }}></div><span>소비</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 상세 분석 뷰 */}
                  {selectedBubble && analysis && (
                    <div className="mt-6 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{selectedBubbleData?.keyword} 분석</h3>
                        <TrendButton onClick={() => setSelectedBubble(null)} className="text-gray-500 hover:text-gray-700">
                          <TrendXIcon className="w-5 h-5" />
                        </TrendButton>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { icon: "🔥", title: "이게 왜 요즘 인기야?", content: analysis.why },
                          { icon: "⏰", title: "지금 해도 돼?", content: analysis.when },
                          { icon: "💰", title: "돈 받을 수 있어?", content: analysis.what },
                          { icon: "⚙️", title: "어떻게 운영해?", content: analysis.how },
                          { icon: "👥", title: "실제로 된 사람 있어?", content: analysis.who },
                        ].map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#00C9A7] transition-all bg-white">
                            <div className="flex items-center gap-2 mb-2"><span className="text-2xl">{item.icon}</span><h4 className="font-bold text-gray-900 text-sm">{item.title}</h4></div>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
                          </div>
                        ))}
                        <div className="col-span-2 p-4 rounded-xl border-2 border-[#00C9A7] bg-[#E0F7F3]">
                          <div className="flex items-center gap-2 mb-2"><span className="text-2xl">📰</span><h4 className="font-bold text-gray-900 text-sm">원문 보고 싶어</h4></div>
                          <a href={analysis.source} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00C9A7] hover:underline font-medium">{analysis.source} →</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}