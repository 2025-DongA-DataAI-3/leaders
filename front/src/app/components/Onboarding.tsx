import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────
// 카드 데이터
// ─────────────────────────────────────────────
interface CardData {
  step: string;
  title: string;
  desc: string;
  win: string;
  body: React.ReactNode;
}

const CARD_GAP = 28;
const CARD_W   = 260;

// ─────────────────────────────────────────────
// 카드 바디 컴포넌트들
// ─────────────────────────────────────────────
function RankBody({ active }: { active: boolean }) {
  const rows = [
    { n: 1, k: "AI교육",      w: 90, p: "+120%" },
    { n: 2, k: "스마트스토어", w: 75, p: "+115%" },
    { n: 3, k: "무인카페",     w: 65, p: "+110%" },
    { n: 4, k: "팝업스토어",   w: 55, p: "+105%" },
    { n: 5, k: "펫케어",       w: 45, p: "+100%" },
  ];
  return (
    <>
      {rows.map((r) => (
        <div key={r.n} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 0", borderBottom:"0.5px solid rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize:11, fontWeight:600, color: active?"#00876F":"#aaa", width:14 }}>{r.n}</span>
          <span style={{ fontSize:11, color: active?"#1a5c50":"#888", flex:1 }}>{r.k}</span>
          <div style={{ width:52, height:2, borderRadius:2, overflow:"hidden", background:"rgba(0,0,0,0.08)" }}>
            <div style={{ height:"100%", width:`${r.w}%`, background: active?"#00C9A7":"#ccc", borderRadius:2 }} />
          </div>
          <span style={{ fontSize:9, color: active?"#00876F":"#aaa", width:30, textAlign:"right", fontWeight:600 }}>{r.p}</span>
        </div>
      ))}
    </>
  );
}

function BubbleBody({ active }: { active: boolean }) {
  const items = [
    { l:"01 트렌드인 이유", v:"반려동물 1,500만 시대, 펫 지출 연 12% 증가", isChip:false },
    { l:"02 추천 아이템",   v:"",  isChip:true,  chips:["펫 호텔","수제 펫푸드","펫 미용"] },
    { l:"03 시장 현황",     v:"국내 펫 시장 2026년 6조원 전망", isChip:false },
    { l:"04 관련 정책",     v:"농림부 반려동물 육성 지원 →", isChip:false, accent:true },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
      {items.map((it) => (
        <div key={it.l} style={{
          borderRadius:7, padding:7,
          background: active?"rgba(0,201,167,0.1)":"rgba(0,0,0,0.03)",
          border: active?"0.5px solid rgba(0,201,167,0.2)":"0.5px solid rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize:8, letterSpacing:"0.5px", textTransform:"uppercase", opacity:0.55, marginBottom:3, color: active?"#00876F":"#aaa" }}>{it.l}</div>
          {it.isChip && it.chips ? (
            <div>{it.chips.map(c => (
              <span key={c} style={{ display:"inline-block", padding:"2px 6px", borderRadius:7, fontSize:9, margin:1,
                background: active?"rgba(0,201,167,0.12)":"rgba(0,0,0,0.05)",
                color: active?"#00876F":"#aaa",
                border: active?"0.5px solid rgba(0,201,167,0.25)":"0.5px solid rgba(0,0,0,0.08)"
              }}>{c}</span>
            ))}</div>
          ) : (
            <div style={{ fontSize:10, lineHeight:1.45, color: it.accent?(active?"#00876F":"#aaa"):active?"#1a5c50":"#888" }}>{it.v}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AnnounceBody({ active }: { active: boolean }) {
  const rows = [
    { dd:"D-3", ddStyle:{ background:"rgba(0,201,167,0.15)", color:"#00876F" }, title:"소상공인 온라인 판로 지원사업", sub:"소상공인시장진흥공단 · 전국", tag:"창업자금", tagStyle:{ color:"#00876F", background:"rgba(0,201,167,0.1)" } },
    { dd:"D-1", ddStyle:{ background:"rgba(239,68,68,0.1)", color:"#dc2626" },  title:"AI 바우처 지원사업 2026 2차",  sub:"중소벤처기업부 · 전국",         tag:"교육지원", tagStyle:{ color:"#7c3aed", background:"rgba(124,58,237,0.08)" } },
    { dd:"상시", ddStyle:{ background:"rgba(0,0,0,0.05)", color:"#999" },       title:"여성 창업 패키지 지원 프로그램", sub:"창업진흥원 · 서울",           tag:"공간지원", tagStyle:{ color:"#d97706", background:"rgba(217,119,6,0.08)" } },
  ];
  return (
    <>
      {rows.map((r) => (
        <div key={r.dd+r.title} style={{
          display:"flex", alignItems:"center", gap:5, padding:"5px 6px", borderRadius:6, marginBottom:4,
          background: active?"rgba(0,201,167,0.08)":"rgba(0,0,0,0.03)",
          border: active?"0.5px solid rgba(0,201,167,0.15)":"0.5px solid rgba(0,0,0,0.06)"
        }}>
          <span style={{ fontSize:8, fontWeight:600, padding:"2px 5px", borderRadius:5, ...r.ddStyle }}>{r.dd}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, lineHeight:1.3, color: active?"#1a5c50":"#888" }}>{r.title}</div>
            <div style={{ fontSize:8, opacity:0.45, marginTop:1 }}>{r.sub}</div>
          </div>
          <span style={{ fontSize:8, padding:"1px 5px", borderRadius:4, ...r.tagStyle }}>{r.tag}</span>
        </div>
      ))}
    </>
  );
}

function BizPlanBody({ active }: { active: boolean }) {
  return (
    <>
      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
        {["양식 첨부","데이터 입력"].map(t => (
          <div key={t} style={{ flex:1, borderRadius:10, padding:5, fontSize:9, textAlign:"center",
            background:"rgba(0,201,167,0.1)", border:"0.5px solid rgba(0,201,167,0.2)", color:"#00876F" }}>{t}</div>
        ))}
        <div style={{ flex:1, borderRadius:10, padding:5, fontSize:9, textAlign:"center", background:"#00C9A7", color:"#003c32", fontWeight:600 }}>AI 작성</div>
      </div>
      <div style={{ background:"white", border:"0.5px solid rgba(0,201,167,0.2)", borderRadius:8, padding:10 }}>
        <div style={{ textAlign:"center", fontSize:8, color:"#00876F", marginBottom:4, letterSpacing:1 }}>BUSINESS PLAN</div>
        <div style={{ textAlign:"center", fontSize:12, fontWeight:600, color:"#0a3d35", marginBottom:8 }}>창업 지원 통합 플랫폼 · TrendPilot</div>
        <div style={{ display:"flex", gap:5, marginBottom:5 }}>
          <div style={{ flex:1, borderRadius:6, padding:7,
            background: active?"rgba(0,201,167,0.08)":"rgba(0,0,0,0.03)",
            border: active?"0.5px solid rgba(0,201,167,0.15)":"0.5px solid rgba(0,0,0,0.06)"
          }}>
            <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3, opacity:0.5, color: active?"#00876F":"#aaa" }}>사업 개요</div>
            <div style={{ fontSize:10, lineHeight:1.4, color: active?"#1a5c50":"#888" }}>뉴스 데이터 기반 키워드 분석 및 창업 지원사업 매칭 플랫폼</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {[["목표 시장","1인 창업자 및 예비창업자"],["수익 모델","구독형 프리미엄"]].map(([l,v]) => (
            <div key={l} style={{ flex:1, borderRadius:6, padding:7,
              background: active?"rgba(0,201,167,0.08)":"rgba(0,0,0,0.03)",
              border: active?"0.5px solid rgba(0,201,167,0.15)":"0.5px solid rgba(0,0,0,0.06)"
            }}>
              <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:3, opacity:0.5, color: active?"#00876F":"#aaa" }}>{l}</div>
              <div style={{ fontSize:10, lineHeight:1.4, color: active?"#1a5c50":"#888" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CommunityBody({ active }: { active: boolean }) {
  const posts = [
    { tag:"성공·실패",  title:"무인카페 1년 운영하고 폐업한 이야기",        meta:"이상원 · 5시간 전 · 댓글 12 · 조회 234" },
    { tag:"창업 아이템", title:"출장세차 창업, 차량 몇 대로 시작하셨나요?", meta:"김창업 · 1일 전 · 댓글 8 · 조회 187" },
    { tag:"창업 실무",  title:"1인 사업자 부가세 신고 처음 해보는 분들께",  meta:"박세무 · 2일 전 · 댓글 21 · 조회 412" },
  ];
  return (
    <>
      {posts.map((p) => (
        <div key={p.title} style={{
          borderRadius:7, padding:8, marginBottom:4,
          background: active?"rgba(0,201,167,0.06)":"rgba(0,0,0,0.03)",
          border: active?"0.5px solid rgba(0,201,167,0.12)":"0.5px solid rgba(0,0,0,0.06)"
        }}>
          <span style={{ display:"inline-block", fontSize:8, padding:"1px 6px", borderRadius:5, marginBottom:4,
            background: active?"rgba(0,201,167,0.12)":"rgba(0,0,0,0.05)",
            color: active?"#00876F":"#aaa"
          }}>{p.tag}</span>
          <div style={{ fontSize:11, fontWeight:500, marginBottom:2, color: active?"#0a3d35":"#666" }}>{p.title}</div>
          <div style={{ fontSize:9, opacity:0.4, color: active?"#1a5c50":"#aaa" }}>{p.meta}</div>
        </div>
      ))}
    </>
  );
}

function ChatbotBody({ active }: { active: boolean }) {
  return (
    <>
      <div style={{ marginBottom:5 }}>
        <div style={{ fontSize:8, opacity:0.4, marginBottom:2, color: active?"#1a5c50":"#aaa", textAlign:"right" }}>나</div>
        <div style={{ textAlign:"right" }}>
          <span style={{ display:"inline-block", padding:"7px 10px", borderRadius:"10px 10px 2px 10px", fontSize:10, lineHeight:1.5, background:"#00C9A7", color:"#003c32" }}>
            펫케어 창업 정부 지원 받을 수 있나요?
          </span>
        </div>
      </div>
      <div style={{ marginBottom:5 }}>
        <div style={{ fontSize:8, opacity:0.4, marginBottom:2, color: active?"#1a5c50":"#aaa" }}>TrendPilot AI</div>
        <span style={{ display:"inline-block", padding:"7px 10px", borderRadius:"10px 10px 10px 2px", fontSize:10, lineHeight:1.5, maxWidth:"85%",
          background: active?"rgba(0,201,167,0.1)":"rgba(0,0,0,0.04)",
          color: active?"#1a5c50":"#888",
          border: active?"0.5px solid rgba(0,201,167,0.2)":"0.5px solid rgba(0,0,0,0.08)"
        }}>
          농림부 <strong>반려동물 연관산업 육성 지원사업</strong>을 추천드립니다. D-14 마감 임박!
        </span>
      </div>
      <div style={{ marginBottom:5 }}>
        <div style={{ fontSize:8, opacity:0.4, marginBottom:2, color: active?"#1a5c50":"#aaa", textAlign:"right" }}>나</div>
        <div style={{ textAlign:"right" }}>
          <span style={{ display:"inline-block", padding:"7px 10px", borderRadius:"10px 10px 2px 10px", fontSize:10, lineHeight:1.5, background:"#00C9A7", color:"#003c32" }}>
            네, 작성 도와주세요!
          </span>
        </div>
      </div>
      <div style={{ display:"flex", gap:5, marginTop:7 }}>
        {["관련 공고 보기","사업계획서 작성"].map(t => (
          <div key={t} style={{ flex:1, borderRadius:12, padding:"5px 7px", fontSize:9, textAlign:"center",
            background: active?"rgba(0,201,167,0.1)":"rgba(0,0,0,0.04)",
            border: active?"0.5px solid rgba(0,201,167,0.25)":"0.5px solid rgba(0,0,0,0.08)",
            color: active?"#00876F":"#aaa"
          }}>{t}</div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// 카드 컴포넌트
// ─────────────────────────────────────────────
function Card({ data, offset, onClick }: { data: CardData; offset: number; onClick: () => void }) {
  const abs   = Math.abs(offset);
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
        position:    "absolute",
        width:        CARD_W,
        height:       460,
        borderRadius: 20,
        overflow:    "hidden",
        display:     "flex",
        flexDirection:"column",
        cursor:      "pointer",
        willChange:  "transform, opacity",
        transition:  "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease, box-shadow 0.55s ease",
        transform:   `translateX(${x}px) scale(${scale})`,
        opacity:      visible ? opacity : 0,
        pointerEvents:visible ? "auto" : "none",
        zIndex,
        background:  active ? "#00C9A7" : "#E8E8E8",
        boxShadow:   active
          ? "0 20px 48px rgba(0,201,167,0.35)"
          : "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* 카드 상단 */}
      <div style={{ padding:"24px 20px 16px", flexShrink:0 }}>
        <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", marginBottom:9, color: active?"rgba(0,60,50,0.6)":"#aaa" }}>
          {data.step}
        </div>
        <div style={{ fontSize:19, fontWeight:600, lineHeight:1.35, marginBottom:7, color: active?"#003c32":"#444" }}
          dangerouslySetInnerHTML={{ __html: data.title.replace(/<em>/g,`<em style="color:${active?"rgba(0,60,50,0.55)":"#bbb"};font-style:normal">`) }}
        />
        <div style={{ fontSize:11, lineHeight:1.6, color: active?"rgba(0,60,50,0.65)":"#aaa" }}>{data.desc}</div>
      </div>

      {/* 윈도우 */}
      <div style={{
        flex:1, margin:"0 16px 18px", borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column",
        background: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)"
      }}>
        {/* 윈도우 바 */}
        <div style={{
          padding:"7px 12px", display:"flex", alignItems:"center", gap:4, flexShrink:0,
          background: active ? "rgba(0,201,167,0.12)" : "rgba(0,0,0,0.04)"
        }}>
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
      step:"01 — 키워드 트렌드",
      title:"뉴스에서 발견하는<br><em>창업 기회</em>",
      desc:"실시간 뉴스 키워드 분석으로 급상승 창업 트렌드를 한눈에",
      win:"급상승 TOP 10",
      body:<RankBody active={cur===0} />,
    },
    {
      step:"02 — 버블맵 분석",
      title:"클릭 하나로 보는<br><em>창업 아이템 인사이트</em>",
      desc:"트렌드 이유, 추천 아이템, 시장 현황, 관련 정책까지 한 번에",
      win:"펫케어 — Trend Analysis",
      body:<BubbleBody active={cur===1} />,
    },
    {
      step:"03 — 맞춤 공고 매칭",
      title:"나에게 딱 맞는<br><em>정부 지원사업</em>",
      desc:"창업 성향 진단 기반으로 맞춤 공고를 자동으로 추천",
      win:"추천 맞춤 공고",
      body:<AnnounceBody active={cur===2} />,
    },
    {
      step:"04 — 사업계획서 작성",
      title:"AI가 초안을 잡아주는<br><em>사업계획서</em>",
      desc:"양식 첨부 또는 내 정보 입력만 하면 AI가 초안을 완성",
      win:"사업계획서 작성",
      body:<BizPlanBody active={cur===3} />,
    },
    {
      step:"05 — 커뮤니티",
      title:"창업자들과 함께하는<br><em>경험 공유 공간</em>",
      desc:"실제 창업자의 성공·실패 경험과 아이디어를 나누세요",
      win:"커뮤니티 · 창업 소통",
      body:<CommunityBody active={cur===4} />,
    },
    {
      step:"06 — AI 챗봇",
      title:"창업 고민을 바로 해결하는<br><em>AI 상담사</em>",
      desc:"창업 아이템, 정책 자금, 사업계획서까지 무엇이든 물어보세요",
      win:"AI 챗봇",
      body:<ChatbotBody active={cur===5} />,
    },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F5FFFE" }}>

      {/* ── 온보딩 본문 ── */}
      <div style={{ padding:"52px 0 44px", background:"#F5FFFE", overflow:"hidden" }}>

        {/* 히어로 텍스트 */}
        <div style={{ textAlign:"center", marginBottom:40, padding:"0 24px" }}>
          <div style={{ fontSize:13, letterSpacing:3, color:"#00876F", textTransform:"uppercase", marginBottom:12 }}>
            TrendPilot
          </div>
          <h1 style={{ fontSize:40, fontWeight:600, color:"#0a3d35", lineHeight:1.3, marginBottom:10 }}>
            <span style={{ color: "#00C9A7" }}>트렌드</span>를 읽고,
            <span style={{ color: "#00C9A7" }}> 창업</span>을 쓰다
          </h1>
          <p style={{ fontSize:18, color:"#2d7a6a", lineHeight:1.65, maxWidth:400, margin:"0 auto 28px" }}>
            트렌드 분석부터 정부 지원 매칭까지,<br />창업의 빈칸을 채워드립니다
          </p>
          <button
              onClick={() => { /* 기존 로직 그대로 */ }}
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
        <div style={{ position:"relative", width:"100%", height:520, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {CARDS.map((card, i) => {
            let offset = i - cur;
            if (offset > N / 2) offset -= N;
            if (offset < -N / 2) offset += N;
            return (
              <Card
                key={i}
                data={{ ...card, body: i === 0 ? <RankBody active={cur===0} /> :
                  i === 1 ? <BubbleBody active={cur===1} /> :
                  i === 2 ? <AnnounceBody active={cur===2} /> :
                  i === 3 ? <BizPlanBody active={cur===3} /> :
                  i === 4 ? <CommunityBody active={cur===4} /> :
                  <ChatbotBody active={cur===5} />
                }}
                offset={offset}
                onClick={() => go(i)}
              />
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginTop:24 }}>
          <button
            onClick={() => go(cur - 1)}
            style={{
              background:"white", border:"0.5px solid rgba(0,139,111,0.2)",
              color:"#00876F", padding:"6px 18px", borderRadius:14,
              fontSize:12, cursor:"pointer",
            }}
          >←</button>

          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {Array.from({ length: N }, (_, i) => (
              <div
                key={i}
                onClick={() => go(i)}
                style={{
                  width: i === cur ? 18 : 5,
                  height:5, borderRadius: i === cur ? 3 : "50%",
                  background: i === cur ? "#00C9A7" : "rgba(0,139,111,0.2)",
                  cursor:"pointer",
                  transition:"all 0.3s",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => go(cur + 1)}
            style={{
              background:"white", border:"0.5px solid rgba(0,139,111,0.2)",
              color:"#00876F", padding:"6px 18px", borderRadius:14,
              fontSize:12, cursor:"pointer",
            }}
          >→</button>
        </div>

        {/* 하단 슬로건 */}
        <p style={{ textAlign:"center", marginTop:32, fontSize:13, color:"#2d7a6a", opacity:0.6 }}>
          생각은 당신이, 실행은 우리가 
        </p>
      </div>
    </div>
  );
}
