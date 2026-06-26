import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface CardData {
  step: string;
  title: string;
  desc: string;
  win: string;
  body: React.ReactNode;
}

const CARD_GAP = 28;
const CARD_W   = 320;

// ─────────────────────────────────────────────
// 1. 키워드맵 버블 프리뷰
// ─────────────────────────────────────────────
function BubbleMapBody({ active }: { active: boolean }) {
  const bubbles = [
    { x: 130, y: 100, r: 42, label: "홈케어",    change: "-4.6%",  cat: "#EC4899" },
    { x: 70,  y: 160, r: 36, label: "제로웨이스트", change: "+60.6%", cat: "#2bc764" },
    { x: 195, y: 155, r: 34, label: "플리마켓",  change: "+14.6%", cat: "#F97316" },
    { x: 130, y: 210, r: 30, label: "스마트스토어", change: "-12%", cat: "#8B5CF6" },
    { x: 60,  y: 90,  r: 22, label: "펫케어",    change: "+22.1%", cat: "#EC4899" },
    { x: 210, y: 90,  r: 20, label: "팝업스토어", change: "-33.2%", cat: "#F97316" },
    { x: 35,  y: 200, r: 18, label: "무인카페",  change: "-16.1%", cat: "#f5a213" },
    { x: 220, y: 220, r: 18, label: "디지털노마드", change: "+23.2%", cat: "#09b3d1" },
  ];
  const links = [
    [0,1],[0,2],[0,3],[1,3],[2,3],[3,6],[2,5],[0,4],
  ];
  return (
    <svg viewBox="0 0 260 270" style={{ width:"100%", height:"100%" }}>
      {links.map(([a,b], i) => (
        <line key={i}
          x1={bubbles[a].x} y1={bubbles[a].y}
          x2={bubbles[b].x} y2={bubbles[b].y}
          stroke={active ? "#CBD5E1" : "#e5e7eb"} strokeWidth="1" strokeOpacity="0.6"
        />
      ))}
      {bubbles.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={b.r}
            fill={active ? b.cat : "#d1d5db"} opacity={active ? 0.9 : 0.5}
            stroke="white" strokeWidth="1.5"
          />
          <text x={b.x} y={b.y - 3} textAnchor="middle"
            style={{ fontSize: b.r > 30 ? 8 : 7, fill:"white", fontWeight:700 }}>
            {b.label}
          </text>
          <text x={b.x} y={b.y + 8} textAnchor="middle"
            style={{ fontSize: 6, fill:"rgba(255,255,255,0.85)" }}>
            {b.change}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 2. 키워드 상세 분석 패널
// ─────────────────────────────────────────────
function AnalysisBody({ active }: { active: boolean }) {
  const accent = active ? "#00C9A7" : "#d1d5db";
  const text   = active ? "#1a5c50" : "#aaa";
  const bg     = active ? "rgba(0,201,167,0.08)" : "rgba(0,0,0,0.03)";
  const border = active ? "rgba(0,201,167,0.2)" : "rgba(0,0,0,0.06)";

  const sections = [
    { num:"01", title:"트렌드인 이유",    val:"반려동물 1,500만 시대, 펫 지출 연 12% 증가" },
    { num:"02", title:"추천 창업 아이템", chips:["펫 호텔","수제 펫푸드","펫 미용"] },
    { num:"03", title:"시장 현황",        val:"국내 펫 시장 2026년 6조원 전망" },
    { num:"04", title:"관련 정책",        val:"농림부 반려동물 육성 지원 →" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
        <span style={{ fontSize:9, fontWeight:700, color:"#888", letterSpacing:1 }}>TREND ANALYSIS</span>
        <span style={{ fontSize:12, fontWeight:700, color: active?"#0a3d35":"#999" }}>펫케어</span>
        <span style={{ marginLeft:"auto", fontSize:8, padding:"2px 7px", borderRadius:99,
          background: active?"#E0F7F3":"#f3f4f6", color: accent }}>키워드 저장</span>
      </div>
      {sections.map((s) => (
        <div key={s.num} style={{ borderRadius:7, padding:"6px 8px", background:bg, border:`0.5px solid ${border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
            <span style={{ fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:4,
              background: active?"rgba(0,201,167,0.15)":"rgba(0,0,0,0.05)", color:accent }}>{s.num}</span>
            <span style={{ fontSize:9, fontWeight:700, color: active?"#111":"#aaa" }}>{s.title}</span>
          </div>
          {s.chips ? (
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {s.chips.map(c => (
                <span key={c} style={{ fontSize:8, padding:"2px 6px", borderRadius:99,
                  background: active?"rgba(167,139,250,0.15)":"rgba(0,0,0,0.04)",
                  color: active?"#7C3AED":"#bbb" }}>{c}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:9, color:text, lineHeight:1.4 }}>{s.val}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. 추천 맞춤 공고
// ─────────────────────────────────────────────
function MatchPostingBody({ active }: { active: boolean }) {
  const rows = [
    { dd:"D-3",  ddC:"#00C9A7", ddBg:"rgba(0,201,167,0.15)", title:"소상공인 온라인 판로 지원사업", org:"소상공인시장진흥공단", tag:"창업자금", tagC:"#00876F", tagBg:"rgba(0,201,167,0.1)", match:95 },
    { dd:"D-14", ddC:"#7C3AED", ddBg:"rgba(124,58,237,0.12)", title:"AI 바우처 지원사업 2026 2차",  org:"중소벤처기업부",       tag:"교육지원", tagC:"#7C3AED", tagBg:"rgba(124,58,237,0.08)", match:88 },
    { dd:"상시",  ddC:"#999",    ddBg:"rgba(0,0,0,0.05)",      title:"여성 창업 패키지 지원 프로그램", org:"창업진흥원",           tag:"공간지원", tagC:"#d97706", tagBg:"rgba(217,119,6,0.08)",   match:72 },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {/* 검색바 */}
      <div style={{ display:"flex", gap:5, marginBottom:2 }}>
        <div style={{ flex:1, height:22, borderRadius:8, border:`1px solid ${active?"rgba(0,201,167,0.3)":"rgba(0,0,0,0.08)"}`,
          background:"white", display:"flex", alignItems:"center", paddingLeft:8 }}>
          <span style={{ fontSize:8, color:"#ccc" }}>지원사업명 검색...</span>
        </div>
        <div style={{ padding:"0 8px", height:22, borderRadius:8, background: active?"#00C9A7":"#d1d5db",
          display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:8, color:"white", fontWeight:600 }}>검색</span>
        </div>
      </div>
      {/* 내 맞춤 공고 토글 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"4px 8px", borderRadius:8, background: active?"rgba(0,201,167,0.08)":"rgba(0,0,0,0.03)",
        marginBottom:2 }}>
        <span style={{ fontSize:8, fontWeight:600, color: active?"#0a3d35":"#aaa" }}>✦ 내 맞춤 공고 보기</span>
        <div style={{ width:24, height:13, borderRadius:99, background: active?"#00C9A7":"#d1d5db", position:"relative" }}>
          <div style={{ position:"absolute", top:2, left: active?11:2, width:9, height:9,
            borderRadius:"50%", background:"white", transition:"left 0.2s" }} />
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 7px", borderRadius:7,
          background: active?"rgba(0,201,167,0.06)":"rgba(0,0,0,0.03)",
          border:`0.5px solid ${active?"rgba(0,201,167,0.15)":"rgba(0,0,0,0.06)"}` }}>
          <span style={{ fontSize:7, fontWeight:700, padding:"1px 4px", borderRadius:4, flexShrink:0,
            color:r.ddC, background:r.ddBg }}>{r.dd}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, fontWeight:600, color: active?"#0a3d35":"#888",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
            <div style={{ fontSize:7, color:"#aaa" }}>{r.org}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2, flexShrink:0 }}>
            <span style={{ fontSize:7, padding:"1px 5px", borderRadius:4, color:r.tagC, background:r.tagBg }}>{r.tag}</span>
            {active && <span style={{ fontSize:7, color:"#00C9A7", fontWeight:700 }}>{r.match}%</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. 사업계획서 에디터
// ─────────────────────────────────────────────
function BizPlanBody({ active }: { active: boolean }) {
  const accent = active ? "#00C9A7" : "#d1d5db";
  const bg     = active ? "rgba(0,201,167,0.08)" : "rgba(0,0,0,0.03)";
  const border = active ? "rgba(0,201,167,0.2)"  : "rgba(0,0,0,0.06)";
  const text   = active ? "#1a5c50" : "#aaa";

  const sections = [
    { num:"1", label:"아이템 개요",     val:"뉴스 데이터 기반 창업 트렌드 분석 및 맞춤형 사업계획서 자동 생성 플랫폼" },
    { num:"2", label:"문제인식",        val:"예비창업자들의 정보 탐색 비용과 사업계획서 작성 진입 장벽이 높음" },
    { num:"3", label:"목표시장 분석",   val:"국내 예비창업자 약 120만 명, 연간 창업지원금 신청 30만 건" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {/* 버튼 3개 */}
      <div style={{ display:"flex", gap:4, marginBottom:2 }}>
        {["양식 첨부","내 데이터 입력"].map(t => (
          <div key={t} style={{ flex:1, borderRadius:7, padding:"4px 0", fontSize:8, textAlign:"center",
            border:`1px solid ${border}`, color:text, background:"white" }}>{t}</div>
        ))}
        <div style={{ flex:1, borderRadius:7, padding:"4px 0", fontSize:8, textAlign:"center",
          background: active?"#00C9A7":"#d1d5db", color:"white", fontWeight:700 }}>AI 작성</div>
      </div>
      {/* 표지 미니 */}
      <div style={{ borderRadius:8, padding:"7px 8px", background:"white",
        border:`0.5px solid ${border}`, textAlign:"center", marginBottom:2 }}>
        <div style={{ fontSize:7, color: accent, marginBottom:2, letterSpacing:1 }}>BUSINESS PLAN</div>
        <div style={{ fontSize:10, fontWeight:700, color: active?"#0a3d35":"#bbb", marginBottom:3 }}>
          펫케어 기반 창업 사업계획서
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          {["대표자 홍길동","2026년 6월"].map(t => (
            <span key={t} style={{ fontSize:7, color:"#aaa" }}>{t}</span>
          ))}
        </div>
      </div>
      {/* 섹션들 */}
      {sections.map(s => (
        <div key={s.num} style={{ borderRadius:7, padding:"5px 7px", background:bg,
          border:`0.5px solid ${border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:2,
            borderBottom:`1px solid ${border}`, paddingBottom:2 }}>
            <span style={{ fontSize:7, fontWeight:700, width:14, height:14, borderRadius:3,
              background:accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0 }}>{s.num}</span>
            <span style={{ fontSize:8, fontWeight:700, color: active?"#111":"#aaa" }}>{s.label}</span>
          </div>
          <div style={{ fontSize:8, color:text, lineHeight:1.4 }}>{s.val}</div>
        </div>
      ))}
      {/* 다운로드 버튼 */}
      <div style={{ display:"flex", gap:4, marginTop:2 }}>
        <div style={{ flex:1, borderRadius:7, padding:"4px 0", fontSize:8, textAlign:"center",
          border:`1px solid ${border}`, color:text, background:"white" }}>임시저장</div>
        <div style={{ flex:1, borderRadius:7, padding:"4px 0", fontSize:8, textAlign:"center",
          background: active?"#00C9A7":"#d1d5db", color:"white", fontWeight:700 }}>다운로드</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 5. communityBody
// ─────────────────────────────────────────────
function CommunityBody({ active }: { active: boolean }) {
  const posts = [
    { tag:"성공·실패",   title:"무인카페 1년 운영하고 폐업한 이야기",        meta:"이상원 · 5시간 전 · 댓글 12" },
    { tag:"창업 아이템", title:"출장세차 창업, 차량 몇 대로 시작하셨나요?", meta:"김창업 · 1일 전 · 댓글 8" },
    { tag:"창업 실무",   title:"1인 사업자 부가세 신고 처음 해보는 분들께", meta:"박세무 · 2일 전 · 댓글 21" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {/* 카테고리 탭 */}
      <div style={{ display:"flex", gap:4, marginBottom:2 }}>
        {["창업분야","창업소통","창업실무"].map((t, i) => (
          <div key={t} style={{ flex:1, padding:"3px 0", borderRadius:7, fontSize:8, textAlign:"center",
            background: i===1 ? (active?"#00C9A7":"#d1d5db") : (active?"rgba(0,201,167,0.1)":"rgba(0,0,0,0.04)"),
            color: i===1 ? "white" : (active?"#00876F":"#aaa"),
            fontWeight: i===1 ? 700 : 400,
            border: i===1 ? "none" : `0.5px solid ${active?"rgba(0,201,167,0.2)":"rgba(0,0,0,0.06)"}`,
          }}>{t}</div>
        ))}
      </div>
      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:2 }}>
        <div style={{ padding:"3px 10px", borderRadius:7, fontSize:8, fontWeight:600,
          background: active?"#00C9A7":"#d1d5db", color:"white" }}>✏️ 글쓰기</div>
      </div>
      {/* 게시글 목록 */}
      {posts.map((p, i) => (
        <div key={i} style={{ borderRadius:7, padding:"6px 8px",
          background: active?"rgba(0,201,167,0.06)":"rgba(0,0,0,0.03)",
          border:`0.5px solid ${active?"rgba(0,201,167,0.12)":"rgba(0,0,0,0.06)"}` }}>
          <span style={{ display:"inline-block", fontSize:7, padding:"1px 6px", borderRadius:5, marginBottom:3,
            background: active?"rgba(0,201,167,0.12)":"rgba(0,0,0,0.05)",
            color: active?"#00876F":"#aaa" }}>{p.tag}</span>
          <div style={{ fontSize:10, fontWeight:500, marginBottom:2, color: active?"#0a3d35":"#666" }}>{p.title}</div>
          <div style={{ fontSize:8, color:"#aaa" }}>{p.meta}</div>
        </div>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────
// 6. ChatbotBody
// ─────────────────────────────────────────────
function ChatbotBody({ active }: { active: boolean }) {
  const msgs = [
    { role:"user", text:"펫케어 창업 정부 지원 받을 수 있나요?" },
    { role:"ai",   text:"농림부 반려동물 연관산업 육성 지원사업을 추천드립니다. D-14 마감 임박!" },
    { role:"user", text:"사업계획서 작성도 도와주세요!" },
    { role:"ai",   text:"네! 키워드 기반으로 초안을 바로 생성해드릴게요 ✨" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, height:"100%" }}>
      {/* 헤더 */}
      <div style={{ padding:"5px 8px", borderRadius:8,
        background: active?"linear-gradient(to right, #00C9A7, #00A88E)":"#e5e7eb",
        display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:9, color:"white", fontWeight:700 }}>🤖 창업 AI 챗봇</span>
      </div>
      {/* 메시지들 */}
      <div style={{ display:"flex", flexDirection:"column", gap:5, flex:1 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{
              maxWidth:"80%", padding:"5px 8px", borderRadius: m.role==="user"?"8px 8px 2px 8px":"8px 8px 8px 2px",
              fontSize:9, lineHeight:1.45,
              background: m.role==="user"
                ? (active?"#00C9A7":"#d1d5db")
                : (active?"rgba(0,201,167,0.1)":"rgba(0,0,0,0.04)"),
              color: m.role==="user" ? "white" : (active?"#1a5c50":"#aaa"),
              border: m.role==="ai" ? `0.5px solid ${active?"rgba(0,201,167,0.2)":"rgba(0,0,0,0.08)"}` : "none",
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      {/* 입력창 */}
      <div style={{ display:"flex", gap:5, marginTop:"auto" }}>
        <div style={{ flex:1, height:22, borderRadius:8,
          border:`1px solid ${active?"rgba(0,201,167,0.3)":"rgba(0,0,0,0.08)"}`,
          background:"white", display:"flex", alignItems:"center", paddingLeft:8 }}>
          <span style={{ fontSize:8, color:"#ccc" }}>메시지를 입력하세요...</span>
        </div>
        <div style={{ width:22, height:22, borderRadius:8,
          background: active?"#00C9A7":"#d1d5db",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:10, color:"white" }}>↑</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 카드 컴포넌트
// ─────────────────────────────────────────────
function Card({ data, offset, onClick }: { data: CardData; offset: number; onClick: () => void }) {
  const abs    = Math.abs(offset);
  const active = offset === 0;

  const x       = offset * (CARD_W + CARD_GAP);
  const scale   = active ? 1 : 0.86;
  const opacity = abs > 1.5 ? 0 : active ? 1 : 0.6;
  const zIndex  = 10 - abs * 3;
  const visible = abs <= 2;

  return (
    <div
      onClick={onClick}
      style={{
        position:     "absolute",
        width:         CARD_W,
        height:        500,
        borderRadius:  20,
        overflow:     "hidden",
        display:      "flex",
        flexDirection:"column",
        cursor:       "pointer",
        willChange:   "transform, opacity",
        transition:   "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease, box-shadow 0.55s ease",
        transform:    `translateX(${x}px) scale(${scale})`,
        opacity:       visible ? opacity : 0,
        pointerEvents: visible ? "auto" : "none",
        zIndex,
        background:    active ? "#00C9A7" : "#E8E8E8",
        boxShadow:     active
          ? "0 20px 48px rgba(0,201,167,0.35)"
          : "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* 카드 상단 */}
      <div style={{ padding:"24px 20px 16px", flexShrink:0 }}>
        <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", marginBottom:9,
          color: active?"rgba(0,60,50,0.6)":"#aaa" }}>{data.step}</div>
        <div style={{ fontSize:19, fontWeight:600, lineHeight:1.35, marginBottom:7,
          color: active?"#003c32":"#444" }}
          dangerouslySetInnerHTML={{ __html: data.title.replace(/<em>/g,
            `<em style="color:${active?"rgba(0,60,50,0.55)":"#bbb"};font-style:normal">`) }}
        />
        <div style={{ fontSize:11, lineHeight:1.6, color: active?"rgba(0,60,50,0.65)":"#aaa" }}>{data.desc}</div>
      </div>

      {/* 윈도우 */}
      <div style={{
        flex:1, margin:"0 16px 18px", borderRadius:12, overflow:"hidden",
        display:"flex", flexDirection:"column",
        background: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)"
      }}>
        {/* 윈도우 바 */}
        <div style={{ padding:"7px 12px", display:"flex", alignItems:"center", gap:4, flexShrink:0,
          background: active?"rgba(0,201,167,0.12)":"rgba(0,0,0,0.04)" }}>
          {["#ff5f56","#ffbd2e","#27c93f"].map(c => (
            <div key={c} style={{ width:6, height:6, borderRadius:"50%", background:c }} />
          ))}
          <span style={{ fontSize:9, marginLeft:5, color: active?"#2d7a6a":"#bbb" }}>{data.win}</span>
        </div>
        {/* 윈도우 바디 */}
        <div style={{ padding:12, flex:1, overflow:"hidden" }}>
          {data.body}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 온보딩 컴포넌트
// ─────────────────────────────────────────────
export default function Onboarding() {
  const navigate  = useNavigate();
  const [cur, setCur] = useState(0);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const N = 6;

  const go = useCallback((n: number) => {
    setCur(((n % N) + N) % N);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCur(p => (p + 1) % N), 4500);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setCur(p => (p + 1) % N), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const CARDS: CardData[] = [
    {
      step:"01 — 키워드 버블맵",
      title:"트렌드를 한눈에\n<em>키워드 버블맵</em>",
      desc:"실시간 뉴스 기반 창업 키워드를 버블 크기와 연결선으로 시각화",
      win:"창업 트렌드 버블맵",
      body:<BubbleMapBody active={cur===0} />,
    },
    {
      step:"02 — 키워드 분석",
      title:"클릭 하나로 보는\n<em>창업 인사이트</em>",
      desc:"트렌드 이유, 추천 아이템, 시장 현황, 관련 정책까지 한 번에",
      win:"펫케어 — Trend Analysis",
      body:<AnalysisBody active={cur===1} />,
    },
    {
      step:"03 — 맞춤 공고",
      title:"나에게 딱 맞는\n<em>정부 지원사업</em>",
      desc:"창업 성향 진단 기반으로 맞춤 공고를 자동으로 추천",
      win:"추천 맞춤 공고",
      body:<MatchPostingBody active={cur===2} />,
    },
    {
      step:"04 — 사업계획서",
      title:"AI가 초안을 잡아주는\n<em>사업계획서</em>",
      desc:"양식 첨부 또는 내 정보 입력만 하면 AI가 초안을 완성",
      win:"사업계획서 작성",
      body:<BizPlanBody active={cur===3} />,
    },
    {
      step:"05 — 커뮤니티",
      title:"창업자들과 함께하는\n<em>경험 공유 공간</em>",
      desc:"실제 창업자의 성공·실패 경험과 아이디어를 나누세요",
      win:"커뮤니티 · 창업 소통",
      body:<CommunityBody active={cur===4} />,
    },
    {
      step:"06 — AI 챗봇",
      title:"창업 고민을 바로 해결하는\n<em>AI 상담사</em>",
      desc:"창업 아이템, 정책 자금, 사업계획서까지 무엇이든 물어보세요",
      win:"AI 챗봇",
      body:<ChatbotBody active={cur===4} />,
    },

  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F5FFFE" }}>
      <div style={{ padding:"52px 0 44px", background:"#F5FFFE", overflow:"hidden" }}>

        {/* 히어로 텍스트 */}
        <div style={{ textAlign:"center", marginBottom:40, padding:"0 24px" }}>
          <div style={{ fontSize:13, letterSpacing:3, color:"#00876F", textTransform:"uppercase", marginBottom:12 }}>
            TrendPilot
          </div>
          <h1 style={{ fontSize:40, fontWeight:600, color:"#0a3d35", lineHeight:1.3, marginBottom:10 }}>
            <span style={{ color:"#00C9A7" }}>트렌드</span>를 읽고,
            <span style={{ color:"#00C9A7" }}> 창업</span>을 쓰다
          </h1>
          <p style={{ fontSize:18, color:"#2d7a6a", lineHeight:1.65, maxWidth:400, margin:"0 auto 28px" }}>
            트렌드 분석부터 정부 지원 매칭까지,<br />창업의 빈칸을 채워드립니다
          </p>
          <button
            onClick={() => {
              const userId = localStorage.getItem("user_id");
              if (!userId) { navigate("/login"); return; }
              localStorage.removeItem("is_new_user");
              localStorage.setItem("hasSeenOnboarding", "true");
              const runTutorial = localStorage.getItem("runTutorialTrigger");
              if (runTutorial === "true") {
                localStorage.removeItem("runTutorialTrigger");
                navigate("/keyword-map");
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("startTutorial"));
                }, 300);
              } else {
                navigate("/keyword-map");
              }
            }}
            style={{
              padding:"12px 32px", borderRadius:24, border:"none",
              background:"#00C9A7", color:"white", fontSize:16, fontWeight:600,
              cursor:"pointer", boxShadow:"0 4px 16px rgba(0,201,167,0.35)",
              display:"inline-flex", alignItems:"center", gap:8,
            }}
          >
            TrendPilot 시작하기
            <span style={{
              width:24, height:24, borderRadius:"50%",
              background:"rgba(255,255,255,0.25)",
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              fontSize:13,
            }}>→</span>
          </button>
        </div>

        {/* 캐러셀 스테이지 */}
        <div style={{ position:"relative", width:"100%", height:560,
          display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {CARDS.map((card, i) => {
            let offset = i - cur;
            if (offset > N / 2) offset -= N;
            if (offset < -N / 2) offset += N;
            return <Card key={i} data={card} offset={offset} onClick={() => go(i)} />;
          })}
        </div>

        {/* 네비게이션 */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginTop:24 }}>
          <button onClick={() => go(cur - 1)}
            style={{ background:"white", border:"0.5px solid rgba(0,139,111,0.2)",
              color:"#00876F", padding:"6px 18px", borderRadius:14, fontSize:12, cursor:"pointer" }}>←</button>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {Array.from({ length: N }, (_, i) => (
              <div key={i} onClick={() => go(i)} style={{
                width: i===cur ? 18 : 5, height:5,
                borderRadius: i===cur ? 3 : "50%",
                background: i===cur ? "#00C9A7" : "rgba(0,139,111,0.2)",
                cursor:"pointer", transition:"all 0.3s",
              }} />
            ))}
          </div>
          <button onClick={() => go(cur + 1)}
            style={{ background:"white", border:"0.5px solid rgba(0,139,111,0.2)",
              color:"#00876F", padding:"6px 18px", borderRadius:14, fontSize:12, cursor:"pointer" }}>→</button>
        </div>

        <p style={{ textAlign:"center", marginTop:32, fontSize:13, color:"#2d7a6a", opacity:0.6 }}>
          생각은 당신이, 실행은 우리가
        </p>
      </div>
    </div>
  );
}