// KeywordMap.tsx — 최종본

import { useState, useEffect, useRef } from "react";
import { TrendingUp, ChevronRight, ArrowLeft, Zap, ExternalLink, Newspaper } from "lucide-react";
import * as d3 from "d3";

interface SeedAnalysis {
  reason:       string;
  startupItems: string[];
  market:       string;
  govLinks:     { label: string; url: string }[];
  headlines:    { title: string; url: string }[];
  category:     string;
}

const SEED_DATA: Record<string, SeedAnalysis> = {
  스마트스토어: {
    category: "AI/기술창업",
    reason: "1인 창업자의 온라인 판매 진입 장벽이 낮아지면서 네이버 스마트스토어 신규 개설 수가 매년 증가하고 있습니다. 소자본으로 시작 가능한 구조와 SNS 연동 마케팅이 결합되며 주목받고 있습니다.",
    startupItems: ["온라인 쇼핑몰", "핸드메이드 제품 판매", "리셀링 스토어", "디지털 콘텐츠 판매"],
    market: "국내 이커머스 시장은 2024년 기준 약 228조원 규모로, 네이버 스마트스토어 입점 사업자 수는 60만 개를 돌파했습니다. 1인 셀러 비중이 전체의 70% 이상을 차지합니다.",
    govLinks: [
      { label: "소상공인시장진흥공단 온라인 판로 지원", url: "https://www.semas.or.kr" },
      { label: "중소벤처기업부 디지털 전환 바우처", url: "https://www.mss.go.kr" },
    ],
    headlines: [
      { title: "네이버 스마트스토어 60만 돌파…1인 셀러 전성시대", url: "https://n.news.naver.com" },
      { title: "스마트스토어 월 매출 1000만원 달성 비결은?", url: "https://n.news.naver.com" },
      { title: "정부, 소상공인 온라인 판로 지원 예산 확대", url: "https://n.news.naver.com" },
    ],
  },
  전자책: {
    category: "콘텐츠",
    reason: "지식 콘텐츠 소비가 디지털화되면서 전문가 개인이 직접 전자책을 제작·판매하는 흐름이 확산되고 있습니다.",
    startupItems: ["전자책 출판", "지식 콘텐츠 플랫폼", "PDF 강의 판매", "뉴스레터 구독 비즈니스"],
    market: "국내 전자책 시장은 연평균 15% 성장 중이며, 개인 작가의 셀프 퍼블리싱 비중이 2023년 대비 2배 이상 증가했습니다.",
    govLinks: [{ label: "한국콘텐츠진흥원 1인 창작자 지원", url: "https://www.kocca.kr" }],
    headlines: [
      { title: "전자책 셀프 출판 시장 급성장…개인 작가 수익화 활발", url: "https://n.news.naver.com" },
      { title: "크몽 전자책 거래액 전년比 40% 증가", url: "https://n.news.naver.com" },
      { title: "지식 콘텐츠 플랫폼 클래스101, 전자책 카테고리 신설", url: "https://n.news.naver.com" },
    ],
  },
  무인카페: {
    category: "푸드/외식",
    reason: "인건비 부담과 비대면 소비 선호가 맞물리며 무인 카페 창업이 급증하고 있습니다.",
    startupItems: ["무인 카페", "무인 아이스크림 할인점", "무인 스터디카페", "무인 편의점"],
    market: "무인 점포 수는 2023년 기준 전국 5만 개를 돌파했습니다. 무인카페 창업 비용은 일반 카페 대비 30~50% 낮습니다.",
    govLinks: [
      { label: "소상공인진흥공단 창업 지원 프로그램", url: "https://www.semas.or.kr" },
      { label: "중소벤처기업부 혁신 창업 패키지", url: "https://www.mss.go.kr" },
    ],
    headlines: [
      { title: "무인카페 전국 1만 개 돌파…인건비 절감 창업 인기", url: "https://n.news.naver.com" },
      { title: "무인 점포 창업 열풍, 소자본 창업자 몰린다", url: "https://n.news.naver.com" },
      { title: "무인카페 프랜차이즈 시장 경쟁 본격화", url: "https://n.news.naver.com" },
    ],
  },
  플리마켓: {
    category: "공간/오프라인",
    reason: "중고 거래 문화 확산과 핸드메이드·로컬 브랜드에 대한 소비자 관심이 높아지면서 플리마켓이 창업 테스트베드로 주목받고 있습니다.",
    startupItems: ["핸드메이드 공예품 판매", "빈티지 의류 리셀링", "로컬 푸드 판매", "DIY 소품 브랜드"],
    market: "서울시 공공 플리마켓 연간 방문객이 200만 명을 넘어섰습니다.",
    govLinks: [{ label: "서울시 사회적경제 지원센터", url: "https://www.sehub.net" }],
    headlines: [
      { title: "플리마켓 창업 열풍…소자본 브랜드 테스트 공간으로", url: "https://n.news.naver.com" },
      { title: "서울 성수동 플리마켓 방문객 100만 명 돌파", url: "https://n.news.naver.com" },
      { title: "핸드메이드 브랜드, 플리마켓에서 온라인으로 확장", url: "https://n.news.naver.com" },
    ],
  },
  AI교육: {
    category: "교육",
    reason: "생성형 AI 확산으로 AI 리터러시 수요가 폭발적으로 증가했습니다.",
    startupItems: ["AI 활용 강의 플랫폼", "기업 대상 AI 교육 컨설팅", "어린이 코딩·AI 교육", "AI 프롬프트 튜터링"],
    market: "국내 에듀테크 시장은 2025년 5조원 규모로 성장 전망입니다.",
    govLinks: [
      { label: "과학기술정보통신부 AI 교육 바우처", url: "https://www.msit.go.kr" },
      { label: "중소벤처기업부 AI 바우처 지원사업", url: "https://www.mss.go.kr" },
    ],
    headlines: [
      { title: "AI 교육 스타트업 투자 급증…1인 강사도 수익화 성공", url: "https://n.news.naver.com" },
      { title: "직장인 AI 역량 교육 수요 폭발…오프라인 강의도 인기", url: "https://n.news.naver.com" },
      { title: "정부, AI 교육 바우처 2026년 예산 대폭 확대", url: "https://n.news.naver.com" },
    ],
  },
  디지털노마드: {
    category: "디지털서비스",
    reason: "재택근무 및 원격 근무 문화 정착으로 장소에 구애받지 않는 업무 방식이 확산되고 있습니다.",
    startupItems: ["원격 근무 컨설팅", "디지털 노마드 커뮤니티 운영", "공유 오피스 큐레이션", "원격 팀 빌딩 서비스"],
    market: "국내 프리랜서 인구는 2024년 기준 약 450만 명으로, 전체 취업자의 16%를 차지합니다.",
    govLinks: [{ label: "중소벤처기업부 1인 기업 지원사업", url: "https://www.mss.go.kr" }],
    headlines: [
      { title: "디지털 노마드 인구 100만 시대…관련 서비스 창업 주목", url: "https://n.news.naver.com" },
      { title: "원격 근무 확산에 공유 오피스 수요 급증", url: "https://n.news.naver.com" },
      { title: "프리랜서 플랫폼 크몽·숨고, 거래액 1조 돌파", url: "https://n.news.naver.com" },
    ],
  },
  제로웨이스트: {
    category: "친환경",
    reason: "환경에 대한 소비자 의식 향상과 ESG 트렌드가 맞물리며 제로웨이스트 제품 및 서비스 수요가 증가하고 있습니다.",
    startupItems: ["제로웨이스트 편집숍", "친환경 포장재 판매", "리필 스테이션", "비건 생활용품 브랜드"],
    market: "국내 친환경 소비재 시장은 2025년 8조원 규모 전망입니다.",
    govLinks: [
      { label: "환경부 녹색제품 인증 지원", url: "https://www.me.go.kr" },
      { label: "한국환경산업기술원 친환경 창업 지원", url: "https://www.keiti.re.kr" },
    ],
    headlines: [
      { title: "제로웨이스트 편집숍 전국 200개 돌파…친환경 창업 봇물", url: "https://n.news.naver.com" },
      { title: "MZ세대 친환경 소비 확산…제로웨이스트 매출 3배 급증", url: "https://n.news.naver.com" },
      { title: "환경부, 친환경 소상공인 지원 예산 500억 편성", url: "https://n.news.naver.com" },
    ],
  },
  아이돌봄: {
    category: "시니어/돌봄",
    reason: "맞벌이 가구 증가와 돌봄 공백 문제가 사회적 이슈로 떠오르면서 민간 아이돌봄 서비스 수요가 급증하고 있습니다.",
    startupItems: ["아이돌봄 매칭 플랫폼", "방과후 돌봄 서비스", "육아 코칭 서비스", "시간제 베이비시터 중개"],
    market: "정부 아이돌봄 서비스 이용 가구는 연 50만 가구를 넘어섰습니다.",
    govLinks: [
      { label: "여성가족부 아이돌봄 서비스 사업자 등록", url: "https://www.mogef.go.kr" },
      { label: "보건복지부 사회서비스 바우처", url: "https://www.moe.go.kr" },
    ],
    headlines: [
      { title: "맞벌이 가구 증가에 아이돌봄 플랫폼 창업 봇물", url: "https://n.news.naver.com" },
      { title: "정부 돌봄 바우처 확대…민간 서비스 시장 커진다", url: "https://n.news.naver.com" },
      { title: "아이돌봄 O2O 스타트업 투자 유치 잇달아", url: "https://n.news.naver.com" },
    ],
  },
  팝업스토어: {
    category: "공간/오프라인",
    reason: "체험 마케팅 트렌드와 MZ세대의 오프라인 경험 소비 선호가 결합되며 팝업스토어가 브랜드 론칭 및 테스트의 핵심 채널로 부상했습니다.",
    startupItems: ["팝업스토어 기획·운영 대행", "단기 임대 공간 중개", "브랜드 체험 이벤트 기획", "소규모 팝업 F&B"],
    market: "국내 팝업스토어 시장은 2024년 기준 약 1,200억원 규모로 추산됩니다.",
    govLinks: [{ label: "소상공인시장진흥공단 상권 활성화 지원", url: "https://www.semas.or.kr" }],
    headlines: [
      { title: "팝업스토어 전성시대…성수동 단기 임대료 3배 급등", url: "https://n.news.naver.com" },
      { title: "브랜드 론칭 채널로 팝업스토어 각광…기획사 창업 증가", url: "https://n.news.naver.com" },
      { title: "단기 공간 임대 플랫폼 '스페이스클라우드' 거래액 급증", url: "https://n.news.naver.com" },
    ],
  },
  출장세차: {
    category: "시니어/돌봄",
    reason: "차량 보유 인구 증가와 시간 절약 소비 트렌드가 맞물리며 방문형 세차 서비스 수요가 급성장하고 있습니다.",
    startupItems: ["출장 세차 서비스", "차량 관리 구독 서비스", "세차 O2O 플랫폼", "아파트 단지 전담 세차"],
    market: "국내 자동차 관리 서비스 시장은 연 3조원 이상 규모이며, 출장 세차 앱 이용자 수가 2023년 대비 150% 증가했습니다.",
    govLinks: [{ label: "소상공인시장진흥공단 서비스업 창업 지원", url: "https://www.semas.or.kr" }],
    headlines: [
      { title: "출장 세차 앱 이용자 급증…1인 창업 인기 아이템으로", url: "https://n.news.naver.com" },
      { title: "아파트 단지 전담 세차 서비스 확산…구독 모델 주목", url: "https://n.news.naver.com" },
      { title: "세차 O2O 스타트업 누적 거래 100만 건 돌파", url: "https://n.news.naver.com" },
    ],
  },
  비건: {
    category: "친환경",
    reason: "채식 인구 증가와 동물복지·환경 의식 향상이 맞물리며 비건 식품 및 라이프스타일 제품 수요가 빠르게 늘고 있습니다.",
    startupItems: ["비건 카페·레스토랑", "비건 밀키트 판매", "식물성 단백질 식품 브랜드", "비건 화장품·생활용품"],
    market: "국내 비건 식품 시장은 2025년 2,500억원 규모로 성장 전망이며, 채식 전문 식당 수가 2020년 대비 3배 이상 증가했습니다.",
    govLinks: [
      { label: "농림축산식품부 친환경 식품 창업 지원", url: "https://www.mafra.go.kr" },
      { label: "한국비건인증원 비건 인증 안내", url: "https://www.vegan-korea.com" },
    ],
    headlines: [
      { title: "비건 식품 시장 연 30% 성장…창업 아이템으로 주목", url: "https://n.news.naver.com" },
      { title: "국내 채식 전문 식당 3배 증가…비건 카페도 급증", url: "https://n.news.naver.com" },
      { title: "식물성 단백질 식품 스타트업 투자 유치 잇달아", url: "https://n.news.naver.com" },
    ],
  },
  업사이클링: {
    category: "친환경",
    reason: "자원 순환 경제에 대한 관심이 높아지며 폐자재·중고 소재를 활용한 업사이클링 제품 창업이 늘고 있습니다.",
    startupItems: ["업사이클링 패션 브랜드", "폐기물 재활용 소품 제작", "기업 협업 업사이클링 굿즈", "업사이클링 공방 운영"],
    market: "글로벌 업사이클링 시장은 2027년 1,500억 달러 규모 전망이며, 국내에서도 업사이클링 브랜드 수가 매년 40% 이상 증가 중입니다.",
    govLinks: [
      { label: "환경부 자원순환 창업 지원", url: "https://www.me.go.kr" },
      { label: "한국환경산업기술원 녹색 창업 패키지", url: "https://www.keiti.re.kr" },
    ],
    headlines: [
      { title: "업사이클링 브랜드 전년比 40% 증가…ESG 협업 봇물", url: "https://n.news.naver.com" },
      { title: "폐현수막·청바지로 가방 만드는 스타트업 매출 급증", url: "https://n.news.naver.com" },
      { title: "대기업, 업사이클링 스타트업과 협업 러시", url: "https://n.news.naver.com" },
    ],
  },
  홈케어: {
    category: "시니어/돌봄",
    reason: "고령화 사회 진입과 1인 가구 증가로 가정 내 청소·수리·관리 서비스 수요가 빠르게 성장하고 있습니다.",
    startupItems: ["가정 청소 방문 서비스", "홈 인테리어 소품 판매", "1인 가구 생활 편의 구독", "가전 렌탈·관리 서비스"],
    market: "국내 홈서비스 시장은 2025년 4조원 규모로 성장 전망입니다.",
    govLinks: [{ label: "소상공인시장진흥공단 생활서비스업 지원", url: "https://www.semas.or.kr" }],
    headlines: [
      { title: "홈케어 플랫폼 누적 이용자 500만 돌파…시장 급성장", url: "https://n.news.naver.com" },
      { title: "1인 가구 증가에 가정 방문 서비스 창업 인기", url: "https://n.news.naver.com" },
      { title: "청소연구소·미소, 기업 가치 1조 돌파 목전", url: "https://n.news.naver.com" },
    ],
  },
  펫케어: {
    category: "시니어/돌봄",
    reason: "반려동물 보유 인구 1,500만 시대를 맞아 펫 의료·미용·호텔·용품 등 관련 시장이 전방위 성장하고 있습니다.",
    startupItems: ["반려동물 미용 서비스", "펫 호텔·유치원", "수제 펫푸드 브랜드", "펫 헬스케어 앱"],
    market: "국내 펫 시장은 2026년 6조원 규모 전망이며, 반려동물 관련 창업 건수가 매년 20% 이상 증가 중입니다.",
    govLinks: [{ label: "농림축산식품부 반려동물 연관산업 육성 지원", url: "https://www.mafra.go.kr" }],
    headlines: [
      { title: "펫 시장 6조원 전망…반려동물 창업 아이템 각광", url: "https://n.news.naver.com" },
      { title: "펫케어 전용 로봇청소기 애견호텔 도입 확산", url: "https://n.news.naver.com" },
      { title: "수제 펫푸드 스타트업 투자 유치 잇달아", url: "https://n.news.naver.com" },
    ],
  },
};

const SEED_KEYWORDS = new Set(Object.keys(SEED_DATA));

const EXTRACTED_CATEGORY: Record<string, string> = {
  "편의점":       "공간/오프라인",
  "스마트홈":     "AI/기술창업",
  "로봇청소기":   "AI/기술창업",
  "뷰티테크":     "AI/기술창업",
  "클린뷰티":     "친환경",
  "에어컨":       "기타",
  "동물병원":     "시니어/돌봄",
  "푸드테크":     "푸드/외식",
  "키즈카페":     "공간/오프라인",
  "리필스테이션": "친환경",
  "커피머신":     "푸드/외식",
  "다회용기":     "친환경",
  "산후조리원":   "시니어/돌봄",
  "프롭테크":     "디지털서비스",
  "공유오피스":   "디지털서비스",
  "그린바이오":   "친환경",
  "안마의자":     "시니어/돌봄",
};

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
  const kw = item.keyword as string;
  const isSeed = SEED_KEYWORDS.has(kw);
  const seed = isSeed ? SEED_DATA[kw] : null;
  return {
    id: kw,
    keyword: kw,
    frequency: item.frequency ?? 0,
    changeRate: item.growth_rate ?? 0,
    x: 50, y: 50,
    size: isSeed
      ? Math.max(35, Math.min(65, (item.frequency ?? 0) / 20))
      : Math.max(25, Math.min(45, (item.frequency ?? 0) * 2 + 40)),
    category: item.category_id ?? "기타",
    isSeed,
    reason: seed?.reason ?? item.reason ?? "분석 데이터를 불러오는 중입니다.",
    startupItems: seed?.startupItems ?? (Array.isArray(item.startup_item_types) ? item.startup_item_types : []),
    market: seed?.market ?? "",
    govLinks: seed?.govLinks ?? [],
    headlines: seed?.headlines ?? [],
    marketAnalysis: !isSeed ? (item.market_analysis ?? "") : "",
    newsArticles: !isSeed ? (item.news_articles ?? []) : [],
    govSupports: !isSeed ? (item.government_support_links ?? []) : [],
    scores: {
      interest: item.score_interest ?? 0,
      growth: item.score_growth ?? 0,
      evidence: item.score_evidence ?? 0,
      relevance: item.score_relevance ?? 0,
      recency: item.score_recency ?? 0,
      total: item.ranking_score ?? 0,
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
  { key: "relevance", label: "문서 관련도", weight: 0.20, color: "#3B82F6" },
  { key: "recency",   label: "최신성",      weight: 0.10, color: "#EC4899" },
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

  useEffect(() => {
    fetch("http://localhost:8000/api/keyword-map")
      .then(res => res.json())
      .then(data => {
        const seedItems = data.seed_nodes.map((s: any, i: number) => ({
          keyword:         s.keyword,
          keyword_id:      s.keyword,
          frequency:       1400 - i * 70,
          growth_rate:     120 - i * 5,
          ranking:         i + 1,
          category_id:     SEED_DATA[s.keyword]?.category ?? "기타",
          ranking_score:   0,
          score_interest:  0, score_growth: 0, score_evidence: 0,
          score_relevance: 0, score_recency: 0,
        }));
        const extractedItems = data.extracted_nodes.map((e: any, i: number) => ({
          keyword:                  e.keyword,
          keyword_id:               e.keyword,
          frequency:                e.article_count ?? 0,
          growth_rate:              0,
          ranking:                  seedItems.length + i + 1,
          category_id:              EXTRACTED_CATEGORY[e.keyword] ?? "기타",
          ranking_score:            e.max_keybert_score ?? 0,
          score_interest:  0, score_growth: 0, score_evidence: 0,
          score_relevance: 0, score_recency: 0,
          linked_seeds:             e.linked_seeds ?? [],
          linked_seed_count:        e.linked_seed_count ?? 1,
          news_articles:            e.news_articles ?? [],
          government_support_links: e.government_support_links ?? [],
          reason:                   e.reason ?? "",
          startup_item_types:       e.startup_item_types ?? [],
        }));
        setBubbleData([...seedItems, ...extractedItems].map(mapApiItem));
        setTop10Trends(
          seedItems.slice(0, 10).map((item: any) => ({
            rank: item.ranking, keyword: item.keyword,
            change: `+${item.growth_rate}%`, category: item.category_id, isSeed: true,
          }))
        );
        setNetworkLinks(
          data.links.map((l: any) => ({
            source: l.source, target: l.target,
            similarity: 1 / (l.linked_seed_count ?? 1),
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
        setZoomLevel(Math.round(event.transform.k * 100));  // ← 퍼센트 업데이트
      });

    svg.call(zoom);
    // 초기 100% 기준으로 시작
    svg.call(zoom.transform, d3.zoomIdentity);

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
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Trend Analysis</p>
                        <h3 className="text-lg font-bold text-gray-900">{selectedData.keyword}</h3>
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
                          const text = selectedData.isSeed ? selectedData.market : (selectedData.marketAnalysis || "");
                          return text
                            ? <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                            : <p className="text-sm text-gray-400 italic">시장 현황 분석을 불러오는 중...</p>;
                        })()}
                      </SectionCard>
                      <SectionCard meta={SECTION_META[3]}>
                        {selectedData.isSeed ? (
                          selectedData.govLinks.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {selectedData.govLinks.map((g, i) => (
                                <a key={i} href={g.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 hover:opacity-80 transition-opacity"
                                  style={{ background: SECTION_META[3].light, color: SECTION_META[3].accent }}>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />{g.label}
                                </a>
                              ))}
                            </div>
                          ) : <p className="text-sm text-gray-400">연결된 정책 공고 없음</p>
                        ) : (
                          (selectedData.govSupports?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedData.govSupports.map((name, i) => (
                                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{ background: SECTION_META[3].light, color: SECTION_META[3].accent }}>{name}</span>
                              ))}
                            </div>
                          ) : <p className="text-sm text-gray-400">연결된 정책 공고 없음</p>
                        )}
                      </SectionCard>
                      <SectionCard meta={SECTION_META[4]}>
                        {(() => {
                          const articles: NewsArticle[] = selectedData.isSeed
                            ? selectedData.headlines.map(h => ({ title: h.title, url: h.url, source: "", published_at: "" }))
                            : (selectedData.newsArticles ?? []);
                          return articles.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {articles.map((a, i) => (
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
                          ) : <p className="text-sm text-gray-400">관련 뉴스 없음</p>;
                        })()}
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
