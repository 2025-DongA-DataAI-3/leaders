import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, ChevronRight, ArrowLeft, Zap, ExternalLink, Newspaper, Heart } from "lucide-react";
import * as d3 from "d3";
import { useNavigate } from "react-router-dom";


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
  isTop10: boolean;  // 추가
}
interface TrendRanking {
  rank: number; keyword: string; change: string; category: string; isSeed: boolean;
}
interface LinkData {
  source: string; target: string; similarity: number; linked_seed_count: number;
}

function mapApiItem(item: any, size: number, isTop10: boolean): BubbleData {
  const kw     = item.keyword as string;
  const isSeed = item.type === "seed";

  return {
    id:         kw,
    keyword:    kw,
    frequency:  item.frequency   ?? item.article_count ?? 0,
    changeRate: item.growth_rate ?? 0,
    x: 50, y: 50,
    size,
    category:     item.category ?? "기타",
    isSeed,
    isTop10,      // ← 여기 누락되어 있었음
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
  const [viewMode,       setViewMode]       = useState<"ranking" | "bubbles">("bubbles");
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const navigate = useNavigate();
  const [marketCache, setMarketCache] = useState<Record<string, string>>({});
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    fetch("/api/keyword-map")
      .then(res => res.json())
      .then(data => {
        const seedItems = data.seed_nodes.map((s: any) => ({
          ...s,
          ranking_score: s.ranking_score ?? 0,
        }));

        const extractedItems = data.extracted_nodes.map((e: any) => ({
          ...e,
          frequency:   e.article_count ?? 0,
          growth_rate: 0,
          ranking_score: e.ranking_score ?? 0,
        }));

        // ranking_score 기준 정렬 → TOP5만 크기 차등
        const sorted   = [...seedItems].sort((a, b) => b.ranking_score - a.ranking_score);
        const top10Set = new Set(sorted.slice(0, 10).map((s: any) => s.keyword));
        
        const TOP5_SIZES: Record<number, number> = {
          1: 105,
          2: 95,
          3: 85,
          4: 75,
          5: 65,
          6: 60,
          7: 55,
          8: 50,
          9: 45,
          10: 40,
        };

        const toNode = (item: any) => {
          const rank = sorted.findIndex((s: any) => s.keyword === item.keyword); // 0-based
          const isTop10 = top10Set.has(item.keyword);

          const size = rank >= 0 && rank < 10
            ? TOP5_SIZES[rank + 1]   // TOP5_SIZES에 1~10 다 있으니 그대로 사용
            : 36;                     // 나머지는 36px 고정

          return mapApiItem(item, size, isTop10);
        };

        setBubbleData([
          ...seedItems.map(toNode),
          ...extractedItems.map(toNode),
        ]);

        // TOP10 랭킹 리스트: sorted 기준
        setTop10Trends(
          sorted.slice(0, 10).map((item: any, i: number) => ({
            rank:     i + 1,
            keyword:  item.keyword,
            change:   item.growth_rate != null
              ? `${item.growth_rate > 0 ? "+" : ""}${item.growth_rate}%`
              : "-",
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

  // 튜토리얼 viewMode 이벤트 리스너
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail as "ranking" | "bubbles";
      setViewMode(mode);
    };
    window.addEventListener("tutorial:setViewMode", handler);
    return () => window.removeEventListener("tutorial:setViewMode", handler);
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

    const zoomG = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
        setZoomLevel(Math.round((event.transform.k / 0.86) * 100));
      });

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.scale(0.86));

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(120)
        .strength(0.8))
      .force("charge", d3.forceManyBody()
        .strength((d: any) => d.isSeed ? -800 : -300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide()
        .radius((d: any) => d.size + 6)  // size 기반으로 충돌 반경
        .strength(1))
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06));

    simulation.alphaDecay(0.02);

    simulation.on("end", () => {
      nodes.forEach((d: any) => {
        d.fx = d.x;
        d.fy = d.y;
      });
    });

    const linkG = zoomG.append("g");
    const nodeG = zoomG.append("g");

    const linkSel = linkG.selectAll("line")
      .data(links).join("line")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

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
            if (cache[d.id]) return cache;
            setMarketLoading(true);
            fetch(`/api/keyword-map/market-analysis/${encodeURIComponent(d.id)}?reason=${encodeURIComponent(d.reason ?? "")}`)
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
        let html = `
          <div style="margin-bottom:8px;">
            <div style="margin-bottom:4px;">
              <span style="font-size:12px;font-weight:700;color:#111;">${d.keyword}</span>
            </div>
            <div style="height:1px;background:#f0f0f0;margin:8px 0;"></div>
          </div>`;

        const maxRaw = Math.max(...SCORE_ITEMS.map(s => (d.scores as any)[s.key] as number));

        SCORE_ITEMS.forEach(s => {
          const raw = (d.scores as any)[s.key] as number;
          const pct = maxRaw > 0 ? Math.round((raw / maxRaw) * 100) : 0;
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

    nodeGroup.append("circle")
      .attr("r", (d: any) => d.size)           // ← size 기반
      .attr("fill", (d: any) => getCategoryColor(d.category))
      .attr("opacity", 0.9)
      .attr("stroke", "white")
      .attr("stroke-width", 2.5);

    // 키워드 텍스트
    nodeGroup.append("text")
      .text((d: any) => d.keyword)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", "white")
      .style("font-size", (d: any) => {
        if (d.size >= 90) return "16px";
        if (d.size >= 70) return "14px";
        if (d.size >= 50) return "13px";
        if (d.size >= 38) return "11px";
        return "10px";
      })
      .style("font-weight", "700")
      .style("pointer-events", "none");

    // 변화율 텍스트
    nodeGroup.append("text")
      .text((d: any) => d.isTop10 ? `${d.changeRate > 0 ? "+" : ""}${d.changeRate}%` : "")
      .attr("y", (d: any) => d.size * 0.3)
      .attr("text-anchor", "middle")
      .style("fill", "rgba(255,255,255,0.9)")
      .style("font-size", (d: any) => {
        if (d.size >= 90) return "13px";
        if (d.size >= 70) return "12px";
        if (d.size >= 50) return "11px";
        return "10px";
      })
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
          <p className="text-sm text-gray-500 mt-1"> "검색관심도 · 검색증가율 · 뉴스근거량 · 문서관련도 · 최신성" 5가지 지표를 종합해 선정된 창업 트렌드를 분석해보세요."</p>
        </div>

        <div className="flex gap-6 items-stretch">
          {/* TOP 10 랭킹 */}
          <div className={`transition-all duration-300 ${viewMode === "ranking" ? "w-1/2 mx-auto" : "w-72 flex-shrink-0"}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
              <div className="px-6 py-5 border-b border-gray-50 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Trending Now</p>
                <h2 className="text-lg font-bold text-gray-900">트렌드 TOP 10</h2>
                <span className="text-xs text-gray-400 text-center leading-relaxed">
                  "5가지 지표를 종합한 트렌드 점수를 기준으로 <br/>매주 월요일 선정됩니다."
                </span>
              </div>
              <div className="divide-y divide-gray-50 flex-1 flex flex-col">
                {top10Trends.map(item => {
                  const isTop3    = item.rank <= 3;
                  const dotColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                  const barColors = ["#00C9A7", "#00B394", "#009E82"];
                  const catShort  = item.category?.split("/")[0] ?? item.category;
                  return (
                    <div key={item.rank} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer flex-1">
                      <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ background: isTop3 ? dotColors[item.rank - 1] : "#E5E7EB" }} />
                      <div className="flex-shrink-0 w-5 text-center">
                        {isTop3
                          ? <span className="text-lg font-black" style={{ color: barColors[item.rank - 1] }}>{item.rank}</span>
                          : <span className="text-base font-semibold text-gray-400">{item.rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold truncate ${isTop3 ? "text-base text-gray-900" : "text-base text-gray-600"}`}>
                            {item.keyword}
                          </span>
                        </div>
                        <span className="text-sm mt-0.5 block" style={{ color: isTop3 ? barColors[item.rank - 1] : "#9CA3AF" }}>
                          {isTop3 ? catShort : item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {(() => {
                          const isPositive = item.change.startsWith("+");
                          const isNeutral  = item.change === "-";
                          return (
                            <>
                              {isNeutral
                                ? <span className="text-xs text-gray-300">-</span>
                                : isPositive
                                  ? <TrendingUp   className={`w-3 h-3 ${isTop3 ? "text-red-400" : "text-red-300"}`} />
                                  : <TrendingDown className={`w-3 h-3 ${isTop3 ? "text-blue-400" : "text-blue-300"}`} />
                              }
                              <span className={`font-bold ${isTop3 ? "text-base" : "text-sm"} ${
                                isNeutral ? "text-gray-300" : isPositive ? "text-red-400" : "text-blue-400"
                              }`}>
                                {item.change}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 버블맵 */}
          {viewMode === "bubbles" && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-400">버블에 마우스를 올리면 트렌드 점수, 클릭하면 상세 분석을 확인할 수 있어요. 휠로 확대/축소 가능합니다.</p>
                </div>

                <div data-tutorial="keyword-map"
                  className="relative rounded-xl border border-gray-100 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #F8FFFE 0%, #F0F9FF 100%)",
                    height: selectedBubble ? "300px" : "750px",
                    position: "relative",
                    zIndex: 1,
                  }}>
                  <svg ref={svgRef} className="w-full h-full" />

                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm pointer-events-none">
                    <span className="text-xs font-semibold text-gray-500">{zoomLevel}%</span>
                  </div>

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
                          onClick={() => {
                            const user_id = localStorage.getItem('user_id');
                            if (!user_id) { alert('로그인이 필요합니다.'); return; }
                            fetch('/api/keywords/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ user_id, keyword: selectedData.keyword }),
                            })
                              .then(res => res.json())
                              .then(data => {
                                if (data.success) alert(`'${selectedData.keyword}' 키워드가 저장되었습니다.`);
                                else alert(data.message);
                              })
                              .catch(() => alert('저장 중 오류가 발생했습니다.'));
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                          style={{ background: "#00C9A7" }}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          키워드 저장
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBubble(null);
                          if (svgRef.current) {
                            d3.select(svgRef.current).selectAll<SVGGElement, unknown>("g g g").style("opacity", 1);
                            d3.select(svgRef.current).selectAll("line").style("opacity", 0.6);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
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

                      <div className="flex justify-center mt-1">
                        <button
                          onClick={() => navigate("/business-plan", {
                            state: {
                              keyword: selectedData.keyword,
                              marketAnalysis: marketCache[selectedData.keyword] || selectedData.marketAnalysis || "",
                            },
                          })}
                          className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                          style={{ background: "#00C9A7", fontSize: '13px' }}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          이 키워드로 사업계획서 쓰기
                        </button>
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
  );
}