import { useState, useEffect, useRef } from "react";
import { TrendingUp, ChevronRight, ArrowLeft, Zap, ExternalLink, Newspaper } from "lucide-react";
import * as d3 from "d3";
import { useNavigate } from "react-router-dom";

interface SeedAnalysis {
  reason:       string;
  startupItems: string[];
  market:       string;
  govLinks:     { label: string; url: string }[];
  headlines:    { title: string; url: string }[];
  category:     string;
}

interface ScoreBreakdown {
  interest: number; growth: number; evidence: number;
  relevance: number; recency: number; total: number;
}
interface NewsArticle {
  title: string; url: string; source: string; published_at: string;
}
interface BubbleData {
  id: string; keyword: string; frequency: number; changeRate: number;
  x: number; y: number; size: number; category: string; isSeed: boolean;
  reason: string; startupItems: string[]; market: string;
  govLinks: { label: string; url: string }[];
  headlines: { title: string; url: string }[];
  marketAnalysis: string; scores: ScoreBreakdown;
  newsArticles: NewsArticle[]; govSupports: string[];
}
interface TrendRanking {
  rank: number; keyword: string; change: string; category: string; isSeed: boolean;
}
interface LinkData {
  source: string; target: string; similarity: number; linked_seed_count: number;
}

function mapApiItem(item: any): BubbleData {
  const kw     = item.keyword as string;
  const isSeed = item.type === "seed";

  return {
    id:         kw,
    keyword:    kw,
    frequency:  item.frequency   ?? item.article_count ?? 0,
    changeRate: item.growth_rate ?? 0,
    x: 50, y: 50,
    size: isSeed
      ? Math.max(35, Math.min(65, (item.frequency ?? 0) / 20))
      : Math.max(25, Math.min(45, (item.article_count ?? 0) * 2 + 40)),
    category:     item.category ?? "기타",
    isSeed,
    reason:       item.reason ?? "",
    startupItems: item.startup_item_types ?? [],
    market:       "",
    govLinks:     [],
    headlines: (item.news_articles ?? []).map((a: any) => ({
      title: a.title ?? "",
      url:   a.url   ?? "",
    })),
    marketAnalysis: item.market_analysis ?? "",
    newsArticles:   item.news_articles   ?? [],
    govSupports:    item.government_support_links ?? [],
    scores: {
      interest:  item.score_interest  ?? 0,
      growth:    item.score_growth    ?? 0,
      evidence:  item.score_evidence  ?? 0,
      relevance: item.score_relevance ?? 0,
      recency:   item.score_recency   ?? 0,
      total:     item.ranking_score   ?? 0,
    },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI/기술창업":   "#8B5CF6",
  "콘텐츠":        "#3B82F6",
  "푸드/외식":     "#f5a213",
  "교육":          "#00C9A7",
  "디지털서비스":  "#09b3d1",
  "친환경":        "#2bc764",
  "시니어/돌봄":   "#EC4899",
  "공간/오프라인": "#F97316",
  "기타":          "#94A3B8",
};
const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#94A3B8";

const SCORE_ITEMS = [
  { key: "interest",  label: "검색 관심도", weight: 0.30, color: "#00C9A7" },
  { key: "growth",    label: "검색 증가율", weight: 0.20, color: "#6366F1" },
  { key: "evidence",  label: "뉴스 근거량", weight: 0.20, color: "#F59E0B" },
] as const;

const SECTION_META = [
  { num: "01", title: "트렌드인 이유",    desc: "배경과 사회적 맥락", accent: "#14B8A6", light: "#dcf8f2" },
  { num: "02", title: "추천 창업 아이템", desc: "연관 창업 유형",     accent: "#A78BFA", light: "#F5F3FF" },
  { num: "03", title: "시장 현황",        desc: "규모 및 성장성",     accent: "#84CC16", light: "#f3fae1" },
  { num: "04", title: "관련 정책",        desc: "정부 지원사업 공고", accent: "#3B82F6", light: "#EFF6FF" },
  { num: "05", title: "관련 뉴스",        desc: "최신 시장 시그널",   accent: "#EC4899", light: "#FCE7F3" },
];

const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
};

interface SectionMeta { num: string; title: string; desc: string; accent: string; light: string; }
function SectionCard({ meta, children }: { meta: SectionMeta; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
        style={{ background: meta.light, color: meta.accent }}>{meta.num}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-900">{meta.title}</span>
          <span className="text-xs text-gray-400">{meta.desc}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function KeywordMap() {
  const [top10Trends,    setTop10Trends]    = useState<TrendRanking[]>([]);
  const [bubbleData,     setBubbleData]     = useState<BubbleData[]>([]);
  const [networkLinks,   setNetworkLinks]   = useState<LinkData[]>([]);
  const [viewMode,       setViewMode]       = useState<"ranking" | "bubbles">("ranking");
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const navigate = useNavigate();
  const [marketCache, setMarketCache] = useState<Record<string, string>>({});
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/keyword-map")
      .then(res => res.json())
      .then(data => {
        const seedItems = data.seed_nodes.map((s: any, i: number) => ({
          ...s,
          frequency:     1400 - i * 70,
          growth_rate:   120  - i * 5,
          ranking_score: 0,
        }));

        const extractedItems = data.extracted_nodes.map((e: any, i: number) => ({
          ...e,
          frequency:     e.article_count    ?? 0,
          growth_rate:   0,
          ranking_score: e.max_keybert_score ?? 0,
        }));

        setBubbleData([...seedItems, ...extractedItems].map(mapApiItem));

        setTop10Trends(
          seedItems.slice(0, 10).map((item: any, i: number) => ({
            rank:     i + 1,
            keyword:  item.keyword,
            change:   `+${120 - i * 5}%`,
            category: item.category ?? "기타",
            isSeed:   true,
          }))
        );

        setNetworkLinks(
          data.links.map((l: any) => ({
            source:            l.source,
            target:            l.target,
            similarity:        1 / (l.linked_seed_count ?? 1),
            linked_seed_count: l.linked_seed_count ?? 1,
          }))
        );
      })
      .catch(err => console.error("키워드맵 API 호출 실패:", err));
  }, []);

  const selectedData = bubbleData.find(b => b.id === selectedBubble) ?? null;

  useEffect(() => {
    if (viewMode !== "bubbles" || !svgRef.current) return;
    if (bubbleData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svgRef.current.parentElement!;
    const width  = container.clientWidth  || 800;
    const height = container.clientHeight || 600;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const filteredData = bubbleData;
    const filteredIds  = new Set(filteredData.map(d => d.id));

    const nodes = filteredData.map(d => ({
      ...d,
      x: width  / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const links = networkLinks
  .filter(l => filteredIds.has(l.source as string) && filteredIds.has(l.target as string))
  .map(l => ({
    source:            l.source as string,
    target:            l.target as string,
    linked_seed_count: l.linked_seed_count,
  }));

    // 줌
    const zoomG = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
        setZoomLevel(Math.round((event.transform.k / 0.86) * 100));
      });

    svg.call(zoom);
    // 초기 100% 기준으로 시작
    svg.call(zoom.transform, d3.zoomIdentity.scale(0.86));

    // simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(120)
        .strength(0.8))
      .force("charge", d3.forceManyBody()
        .strength((d: any) => d.isSeed ? -800 : -300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide()
        .radius((d: any) => d.isSeed ? 58 : 42)
        .strength(1))
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06));

    simulation.alphaDecay(0.02);

    // simulation 끝나면 위치 완전 고정 (드래그 불가)
    simulation.on("end", () => {
      nodes.forEach((d: any) => {
        d.fx = d.x;
        d.fy = d.y;
      });
    });

    // 선 먼저(뒤), 노드 나중(앞)
    const linkG = zoomG.append("g");
    const nodeG = zoomG.append("g");

    const linkSel = linkG.selectAll("line")
      .data(links).join("line")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // 툴팁 HTML
    const tooltipEl = document.createElement("div");
    tooltipEl.style.cssText = `
      position:fixed;background:white;border:1px solid #e2e8f0;
      border-radius:10px;padding:10px 12px;font-family:sans-serif;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);pointer-events:none;
      z-index:9999;width:220px;display:none;
    `;
    document.body.appendChild(tooltipEl);

    const nodeGroup = nodeG
      .selectAll<SVGGElement, typeof nodes[0]>("g")
      .data(nodes).join("g")
      .style("cursor", "pointer")
      .style("opacity", 1)
      // 드래그 제거 — 클릭만 허용
      .on("click", (_, d: any) => {
        setSelectedBubble(prev => {
          const next = prev === d.id ? null : d.id;
          nodeGroup.style("opacity", (n: any) => !next || next === n.id ? 1 : 0.55);
          linkSel.style("opacity", (l: any) => {
            if (!next) return 0.6;
            const s = (l.source as any).id ?? l.source;
            const t = (l.target as any).id ?? l.target;
            return (s === next || t === next) ? 0.9 : 0;
          });
          return next;
        });
      
       if (d.id) {
          setMarketCache(cache => {
            if (cache[d.id]) return cache; // 이미 있으면 호출 안 함
            setMarketLoading(true);
            fetch(`http://localhost:5000/api/keyword-map/market-analysis/${encodeURIComponent(d.id)}?reason=${encodeURIComponent(d.reason ?? "")}`)
              .then(res => res.json())
              .then(data => {
                setMarketCache(prev => ({ ...prev, [d.id]: data.market_analysis }));
              })
              .finally(() => setMarketLoading(false));
            return cache;
          });
        }
      })
      .on("mouseenter", (event, d: any) => {
        const totalPct = Math.min(Math.round(d.scores.total * 100), 100);
        let html = `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:12px;font-weight:700;color:#111;">${d.keyword}</span>
              <span style="font-size:11px;font-weight:700;color:#00C9A7;">종합 ${d.scores.total.toFixed(2)}</span>
            </div>
            <div style="height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${totalPct}%;background:#00C9A7;border-radius:3px;"></div>
            </div>
            <div style="height:1px;background:#f0f0f0;margin:8px 0;"></div>
          </div>`;
        SCORE_ITEMS.forEach(s => {
          const raw = (d.scores as any)[s.key] as number;
          const pct = Math.min(Math.round(raw * 100), 100);
          const wtd = (raw * s.weight).toFixed(3);
          html += `
            <div style="margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
                <span style="color:#555;">${s.label} <span style="color:#bbb;">×${s.weight}</span></span>
                <span style="font-weight:700;color:${s.color};">${wtd}</span>
              </div>
              <div style="height:3px;background:#f0f0f0;border-radius:2px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${s.color};border-radius:2px;"></div>
              </div>
            </div>`;
        });
        tooltipEl.innerHTML = html;
        tooltipEl.style.display = "block";
        tooltipEl.style.left = `${Math.min(event.clientX + 14, window.innerWidth - 240)}px`;
        tooltipEl.style.top  = `${Math.max(event.clientY - 100, 8)}px`;
      })
      .on("mousemove", (event) => {
        tooltipEl.style.left = `${Math.min(event.clientX + 14, window.innerWidth - 240)}px`;
        tooltipEl.style.top  = `${Math.max(event.clientY - 100, 8)}px`;
      })
      .on("mouseleave", () => { tooltipEl.style.display = "none"; });
    // ← drag 완전 제거

    nodeGroup.append("circle")
      .attr("r", (d: any) => d.isSeed ? 52 : 36)
      .attr("fill", (d: any) => getCategoryColor(d.category))
      .attr("opacity", 0.9)
      .attr("stroke", "white")
      .attr("stroke-width", 2.5);

    nodeGroup.append("text")
      .text((d: any) => d.keyword)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", "white")
      .style("font-size", (d: any) => d.isSeed ? "12px" : "10px")
      .style("font-weight", "700")
      .style("pointer-events", "none");

    nodeGroup.append("text")
      .text((d: any) => `${d.changeRate > 0 ? "+" : ""}${d.changeRate}%`)
      .attr("y", (d: any) => d.isSeed ? 16 : 13)
      .attr("text-anchor", "middle")
      .style("fill", "rgba(255,255,255,0.9)")
      .style("font-size", (d: any) => d.isSeed ? "10px" : "9px")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      if (document.body.contains(tooltipEl)) document.body.removeChild(tooltipEl);
    };
  }, [viewMode, bubbleData, networkLinks]);

  return (
    <div className="min-h-screen bg-[#F5FFFE] py-8 px-6">
      <div className="max-w-8xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">창업 트렌드 버블맵</h1>
          <p className="text-sm text-gray-500 mt-1">실시간 뉴스 기반 키워드 트렌드를 분석해 보세요.</p>
        </div>

        <div className="flex gap-6 items-stretch">
          {/* TOP 10 랭킹 */}
          <div className={`transition-all duration-300 ${viewMode === "ranking" ? "w-1/2 mx-auto" : "w-72 flex-shrink-0"}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
              <div className="px-6 py-5 border-b border-gray-50 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Trending Now</p>
                <h2 className="text-lg font-bold text-gray-900">급상승 TOP 10</h2>
              </div>
              <div className="divide-y divide-gray-50 flex-1 flex flex-col">
                {top10Trends.map(item => {
                  const isTop3    = item.rank <= 3;
                  const dotColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  const barWidths = ["90%", "75%", "65%"];
                  const barColors = ["#00C9A7", "#00B394", "#009E82"];
                  const catShort  = item.category?.split("/")[0] ?? item.category;
                  return (
                    <div key={item.rank} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer flex-1">
                      <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: isTop3 ? dotColors[item.rank - 1] : "#E5E7EB" }} />
                      <div className="flex-shrink-0 w-5 text-center">
                        {isTop3
                          ? <span className="text-base font-black" style={{ color: barColors[item.rank - 1] }}>{item.rank}</span>
                          : <span className="text-sm font-semibold text-gray-400">{item.rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-sm truncate ${isTop3 ? "text-gray-900" : "text-gray-600"}`}>
                            {item.keyword}
                          </span>
                        </div>
                        {isTop3 ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div style={{ height: "3px", width: "70px", background: "#e5e7eb", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: barWidths[item.rank - 1], background: barColors[item.rank - 1], borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "10px", color: barColors[item.rank - 1], fontWeight: 600 }}>{catShort}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">{item.category}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-red-400" />
                        <span className={`font-bold text-red-400 ${isTop3 ? "text-sm" : "text-xs"}`}>{item.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {viewMode === "ranking" && (
                <div className="flex justify-center px-6 py-5 border-t border-gray-50 flex-shrink-0">
                  <button onClick={() => setViewMode("bubbles")}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "#00C9A7" }}>
                    <Zap className="w-4 h-4" />
                    버블맵으로 보기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 버블맵 */}
          {viewMode === "bubbles" && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs text-gray-400">버블에 마우스를 올리면 트렌드 점수, 클릭하면 상세 분석을 확인할 수 있어요. 휠로 확대/축소 가능합니다.</p>
                  <button onClick={() => setViewMode("ranking")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 shadow-sm"
                    style={{ background: "#00C9A7" }}>
                    <ArrowLeft className="w-4 h-4" />
                    랭킹보기
                  </button>
                </div>

                  <div className="relative rounded-xl border border-gray-100 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #F8FFFE 0%, #F0F9FF 100%)",
                    height: selectedBubble ? "300px" : "750px",
                  }}>
                  <svg ref={svgRef} className="w-full h-full" />

                  {/* 줌 레벨 표시 — 추가 */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm pointer-events-none">
                    <span className="text-xs font-semibold text-gray-500">{zoomLevel}%</span>
                  </div>

                  {/* 범례 — 기존 그대로 */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm pointer-events-none">
                    <p className="text-xs text-gray-500 mb-2 font-bold">분야별 색상</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-medium text-gray-600">
                      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                        <span key={cat} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 분석 패널 */}
                {selectedBubble && selectedData && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Trend Analysis</p>
                          <h3 className="text-lg font-bold text-gray-900">{selectedData.keyword}</h3>
                        </div>
                        <button
                          onClick={() => navigate("/business-plan", {
                            state: {
                              keyword: selectedData.keyword,
                              // KeywordMap에서 버블 클릭 시 /api/keyword-map/market-analysis/{keyword}로
                              // 새로 받아온 최신 시장분석이 있으면 함께 넘긴다.
                              // BusinessPlan.tsx -> FastAPI /generate 요청 시 이 값을
                              // marketAnalysisOverride로 그대로 전달하면, 백엔드가
                              // keyword_details.market_analysis(DB 구버전)보다 우선 사용한다.
                              // 캐시에 없으면 화면에 표시 중인 marketAnalysis(또는 빈 값)로 폴백.
                              marketAnalysis: marketCache[selectedData.keyword] || selectedData.marketAnalysis || "",
                            },
                          })}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                          style={{ background: "#00C9A7" }}>
                          <Zap className="w-3.5 h-3.5" />
                          이 키워드로 사업계획서 쓰기
                        </button>
                      </div> 
                      <button onClick={() => {
                        setSelectedBubble(null);
                        // SVG 노드 opacity 전체 초기화
                        if (svgRef.current) {
                          d3.select(svgRef.current)
                            .selectAll<SVGGElement, unknown>("g g g")
                            .style("opacity", 1);
                          d3.select(svgRef.current)
                            .selectAll("line")
                            .style("opacity", 0.6);
                        }
                      }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <SectionCard meta={SECTION_META[0]}>
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedData.reason}</p>
                      </SectionCard>
                      <SectionCard meta={SECTION_META[1]}>
                        {selectedData.startupItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedData.startupItems.map((it, i) => (
                              <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ background: SECTION_META[1].light, color: SECTION_META[1].accent }}>{it}</span>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-400">데이터 없음</p>}
                      </SectionCard>
                      <SectionCard meta={SECTION_META[2]}>
                        {(() => {
                          const text = marketCache[selectedData.id] || selectedData.marketAnalysis || "";
                          if (text) return <p className="text-sm text-gray-600 leading-relaxed">{text}</p>;
                          if (marketLoading) return (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border-2 border-[#84CC16] border-t-transparent animate-spin" />
                              <p className="text-sm text-gray-400">시장 현황 분석 중...</p>
                            </div>
                          );
                          return <p className="text-sm text-gray-400 italic">데이터 없음</p>;
                        })()}
                      </SectionCard>
                      <SectionCard meta={SECTION_META[3]}>
                        {(selectedData.govSupports?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedData.govSupports.map((name, i) => (
                              <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ background: SECTION_META[3].light, color: SECTION_META[3].accent }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-400">연결된 정책 공고 없음</p>}
                      </SectionCard>
                      <SectionCard meta={SECTION_META[4]}>
                        {(selectedData.newsArticles?.length ?? 0) > 0 ? (
                          <div className="flex flex-col gap-2">
                            {selectedData.newsArticles.map((a, i) => (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-start gap-2 group rounded-lg px-3 py-2.5 hover:opacity-80 transition-opacity"
                                style={{ background: SECTION_META[4].light }}>
                                <Newspaper className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: SECTION_META[4].accent }} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium leading-snug text-gray-700 group-hover:underline block">{a.title}</span>
                                  {a.published_at && (
                                    <span className="text-xs text-gray-400 mt-0.5 block">
                                      {a.source && `${a.source} · `}{fmtDate(a.published_at)}
                                    </span>
                                  )}
                                </div>
                                <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0 opacity-40 group-hover:opacity-80" style={{ color: SECTION_META[4].accent }} />
                              </a>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-400">관련 뉴스 없음</p>}
                      </SectionCard>
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