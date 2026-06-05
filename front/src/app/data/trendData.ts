export interface TrendItem {
  keyword: string;
  trend: "up" | "down";
  change: string;
  summary: string;
}

export interface Article {
  title: string;
  source: string;
  url: string;
  date: string;
}

export interface InsightData {
  change: string;
  summary: string;
  similarity: number;
  frequency: number;
  growthRate: string;
  articles: Article[];
  threeYearArticles: {
    year: string;
    count: number;
  }[];
  aiSummary: string;
}

export const trendData: TrendItem[] = [
  {
    keyword: "SaaS 플랫폼",
    trend: "up",
    change: "+68%",
    summary: "구독 기반 소프트웨어 서비스 확산",
  },
  {
    keyword: "스마트팩토리",
    trend: "up",
    change: "+62%",
    summary: "제조업 디지털 전환 가속화",
  },
  {
    keyword: "모바일 커머스",
    trend: "up",
    change: "+58%",
    summary: "모바일 쇼핑 플랫폼 성장세",
  },
  {
    keyword: "디지털헬스",
    trend: "up",
    change: "+54%",
    summary: "헬스케어 IT 융합 서비스",
  },
  {
    keyword: "친환경 패키징",
    trend: "up",
    change: "+48%",
    summary: "지속가능한 포장재 수요 증가",
  },
  {
    keyword: "구독경제",
    trend: "up",
    change: "+45%",
    summary: "정기 구독 비즈니스 모델 확대",
  },
  {
    keyword: "AI 솔루션",
    trend: "up",
    change: "+42%",
    summary: "인공지능 기반 비즈니스 도구",
  },
  {
    keyword: "원격의료",
    trend: "up",
    change: "+38%",
    summary: "비대면 진료 서비스 성장",
  },
  {
    keyword: "3D프린팅",
    trend: "up",
    change: "+35%",
    summary: "맞춤형 제조 솔루션",
  },
  {
    keyword: "신재생에너지",
    trend: "up",
    change: "+32%",
    summary: "친환경 에너지 사업 확대",
  },
];

export const insightData: Record<string, InsightData> = {
  "SaaS 플랫폼": {
    change: "+68%",
    summary: "구독 기반 소프트웨어 서비스 확산",
    similarity: 87,
    frequency: 1245,
    growthRate: "+68%",
    threeYearArticles: [
      { year: "2024", count: 423 },
      { year: "2025", count: 741 },
      { year: "2026", count: 1245 },
    ],
    articles: [
      {
        title: "국내 SaaS 시장 3년간 2배 성장 전망",
        source: "전자신문",
        url: "#",
        date: "2026.05.10",
      },
      {
        title: "중소기업 SaaS 도입률 70% 돌파",
        source: "IT조선",
        url: "#",
        date: "2026.05.08",
      },
      {
        title: "AI 통합 SaaS 플랫폼 투자 급증",
        source: "벤처스퀘어",
        url: "#",
        date: "2026.05.05",
      },
      {
        title: "스타트업 필수 SaaS 도구 TOP 10",
        source: "매일경제",
        url: "#",
        date: "2026.05.03",
      },
    ],
    aiSummary:
      "SaaS 플랫폼은 초기 창업자들의 비즈니스 인프라 구축 비용을 크게 낮추는 핵심 솔루션입니다. 구독 기반 모델로 부담 없이 시작할 수 있어 창업 진입장벽을 낮추는데 기여하고 있습니다.",
  },
  "스마트팩토리": {
    change: "+62%",
    summary: "제조업 디지털 전환 가속화",
    similarity: 82,
    frequency: 1087,
    growthRate: "+62%",
    threeYearArticles: [
      { year: "2024", count: 389 },
      { year: "2025", count: 671 },
      { year: "2026", count: 1087 },
    ],
    articles: [
      {
        title: "스마트팩토리 정부 지원 사업 확대",
        source: "한국경제",
        url: "#",
        date: "2026.05.09",
      },
      {
        title: "중소 제조업체 스마트팩토리 도입 급증",
        source: "조선일보",
        url: "#",
        date: "2026.05.06",
      },
      {
        title: "스마트팩토리 솔루션 스타트업 투자 유치",
        source: "디지털타임스",
        url: "#",
        date: "2026.05.04",
      },
    ],
    aiSummary:
      "스마트팩토리는 제조업 창업의 경쟁력을 높이는 필수 요소로 자리잡았습니다. 정부 지원과 기술 발전으로 소규모 제조업체도 디지털 전환이 가능해지면서 창업 기회가 확대되고 있습니다.",
  },
  "모바일 커머스": {
    change: "+58%",
    summary: "모바일 쇼핑 플랫폼 성장세",
    similarity: 79,
    frequency: 952,
    growthRate: "+58%",
    threeYearArticles: [
      { year: "2024", count: 367 },
      { year: "2025", count: 602 },
      { year: "2026", count: 952 },
    ],
    articles: [
      {
        title: "모바일 커머스 시장 10조원 돌파",
        source: "IT조선",
        url: "#",
        date: "2026.05.07",
      },
      {
        title: "1인 창업자 모바일 쇼핑몰 성공 사례 급증",
        source: "전자신문",
        url: "#",
        date: "2026.05.05",
      },
      {
        title: "라이브 커머스 스타트업 투자 열풍",
        source: "벤처스퀘어",
        url: "#",
        date: "2026.05.02",
      },
    ],
    aiSummary:
      "모바일 커머스는 낮은 진입장벽과 높은 성장 가능성으로 창업 시장에서 가장 인기있는 분야입니다. 플랫폼 경제와 결합하면서 개인 창업자도 큰 성공을 거둘 수 있는 기회가 열렸습니다.",
  },
  "디지털헬스": {
    change: "+54%",
    summary: "헬스케어 IT 융합 서비스",
    similarity: 85,
    frequency: 834,
    growthRate: "+54%",
    threeYearArticles: [
      { year: "2024", count: 312 },
      { year: "2025", count: 541 },
      { year: "2026", count: 834 },
    ],
    articles: [
      {
        title: "디지털헬스케어 시장 연 30% 성장세",
        source: "매일경제",
        url: "#",
        date: "2026.05.08",
      },
      {
        title: "원격의료 스타트업 투자 급증",
        source: "헬스조선",
        url: "#",
        date: "2026.05.06",
      },
      {
        title: "AI 기반 헬스케어 서비스 정부 지원 확대",
        source: "벤처스퀘어",
        url: "#",
        date: "2026.05.03",
      },
    ],
    aiSummary:
      "디지털헬스는 고령화 사회의 필수 산업으로 떠오르며 창업 기회가 확대되고 있습니다. 기술과 의료의 융합으로 혁신적인 비즈니스 모델 창출이 가능해졌습니다.",
  },
};
