import { useState, useRef, useEffect, forwardRef } from 'react';
import { FileDown, Save, Sparkles, Check, X, Paperclip, Loader2, FileText, PenLine, Database } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useLocation } from "react-router-dom";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';

const A4_W = 794;
const A4_H = 1122;
const PAGE_GAP = 24;
const MARGIN_H = 80;
const MARGIN_V = 72;

interface Section {
  key: string;
  label: string;
  sub?: string;
  number?: string;
  placeholder: string;
}

interface UserData {
  적용분야: string[];
  보유기술: string;
  마케팅전략: string;
  추진계획: string;
  창업동기: string;
  팀구성: string;
}

interface DocContent {
  [key: string]: string;
}

interface BusinessPlanData {
  title: string;
  summary: string;
  founder: string;
  date: string;
  content: DocContent;
}

interface SavedPlan {
  id: string;
  title: string;
  timestamp: number;
  plan: BusinessPlanData;
  templateName: string;
}

const defaultSections: Section[] = [
  { key: 'cover',              label: '표지',           placeholder: '' },
  { key: 'overview',           label: '아이템 개요',     sub: '핵심 한 줄 요약',           number: '0',   placeholder: '무엇을, 누구를 위해, 어떻게 해결하는지 핵심을 한두 문장으로 요약하세요.' },
  { key: 'problemRecognition', label: '문제인식',        sub: '개발배경 및 필요성',        number: '1',   placeholder: '창업자들이 겪는 문제점과 시장의 한계를 구체적으로 서술하세요.' },
  { key: 'marketAnalysis',     label: '목표시장 분석',   sub: '시장 규모 및 타겟 고객',     number: '1-1', placeholder: 'TAM·SAM·SOM 구조로 시장 규모와 타겟 고객을 분석하세요.' },
  { key: 'solution',           label: '해결방안',        sub: '실현가능성',                number: '2',   placeholder: '어떤 기술·방식으로 문제를 해결하는지 구체적으로 서술하세요.' },
  { key: 'competitiveness',    label: '경쟁력 확보방안', sub: '차별성 및 진입장벽',         number: '2-1', placeholder: '경쟁사 대비 차별점과 진입장벽을 서술하세요.' },
  { key: 'growthStrategy',     label: '성장전략',        sub: '단계별 사업화 방안',         number: '3',   placeholder: '분기별 목표와 사업화 로드맵을 작성하세요.' },
  { key: 'revenueModel',       label: '수익 구조',       sub: '수익 모델 및 매출 계획',     number: '4',   placeholder: '수익 모델, 가격 전략, 예상 매출을 작성하세요.' },
  { key: 'team',                label: '팀 구성',         sub: '대표자 및 팀원 보유역량',    number: '5',   placeholder: '대표자와 팀원의 역할, 보유역량, 외부 협력기관을 서술하세요.' },
];

const templateSections: Record<string, Section[]> = {
  '예비창업패키지': [
    { key: 'cover',           label: '표지',           placeholder: '' },
    { key: 'itemIntro',       label: '창업아이템 소개', sub: '아이템 개요 및 핵심 기능',  number: '1', placeholder: '창업 아이템의 핵심 기능과 차별점을 소개하세요.' },
    { key: 'problem',         label: '문제인식',        sub: '시장 문제 및 필요성',       number: '2', placeholder: '타겟 고객이 겪는 문제와 현 시장의 한계를 서술하세요.' },
    { key: 'market',          label: '시장분석',        sub: '시장 규모 및 성장성',       number: '3', placeholder: 'TAM·SAM·SOM 기준 시장 규모와 성장성을 분석하세요.' },
    { key: 'differentiation', label: '차별성',          sub: '경쟁사 대비 우위',          number: '4', placeholder: '경쟁사 현황과 자사의 핵심 경쟁력을 서술하세요.' },
    { key: 'execution',       label: '실행계획',        sub: '월별·분기별 추진 일정',     number: '5', placeholder: '6개월간 단계별 실행계획을 작성하세요.' },
    { key: 'team',            label: '팀 구성',         sub: '창업팀 구성원 및 역할',     number: '6', placeholder: '팀원별 역할과 보유 역량을 서술하세요.' },
    { key: 'finance',         label: '자금 계획',       sub: '지원금 활용 및 수익 전망',  number: '7', placeholder: '지원금 사용 항목과 예상 매출을 작성하세요.' },
  ],
  '초기창업패키지': [
    { key: 'cover',       label: '표지',        placeholder: '' },
    { key: 'overview',    label: '회사 개요',   sub: '기업 현황 및 비전',      number: '1', placeholder: '현재 사업 현황, 핵심 가치, 비전을 서술하세요.' },
    { key: 'product',     label: '제품/서비스', sub: '주요 제품 상세',         number: '2', placeholder: '제공하는 제품/서비스의 핵심 기능을 서술하세요.' },
    { key: 'market',      label: '시장분석',    sub: '목표시장 및 고객',       number: '3', placeholder: '시장 규모, 트렌드, 타겟 고객 페르소나를 분석하세요.' },
    { key: 'competition', label: '경쟁분석',    sub: '경쟁사 비교',            number: '4', placeholder: '주요 경쟁사와 비교한 차별화 포인트를 서술하세요.' },
    { key: 'marketing',   label: '마케팅 전략', sub: '고객 획득 전략',         number: '5', placeholder: '채널별 마케팅 전략과 고객 획득 계획을 서술하세요.' },
    { key: 'finance',     label: '재무 계획',   sub: '매출 목표 및 손익',      number: '6', placeholder: '3년간 매출 목표, 비용 구조, 손익분기점을 작성하세요.' },
  ],
};

const fieldOptions = ['AI/기술', '푸드/외식', '유통/서비스', '친환경', '교육', '디지털서비스', '바이오/헬스케어', '제조/생산', '공간/오프라인', '시니어/돌봄'];

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const PlanButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={className} ref={ref} {...props} />;
  }
);
PlanButton.displayName = "PlanButton";

function AutoResizeTextarea({
  value, onChange, placeholder, className, style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={{ ...style, overflow: 'hidden' }}
      rows={1}
    />
  );
}
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="rounded-lg px-3 py-2 shadow-lg text-center border border-gray-200"
            style={{ 
              fontSize: '12px', lineHeight: '1.5',
              whiteSpace: 'nowrap',        // ← 줄바꿈 없이 한 줄
              background: 'white',         // ← 흰색 배경
              color: '#374151',          // ← 텍스트 어두운 회색
            }}>
            {text}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'white'}}/>
        </div>
      )}
    </div>
  );
}

export default function BusinessPlan() {
  const [searchParams] = useSearchParams();
  const location = useLocation(); 
  const [saved, setSaved] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachState, setAttachState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [templateName, setTemplateName] = useState('기본 양식');
  const [plan, setPlan] = useState<BusinessPlanData>({
    title: '창업 지원 통합 플랫폼 - TrendPilot',
    summary: '뉴스데이터 및 창업지원공고데이터 기반 키워드 분석을 통해 맞춤형 사업계획서 작성으로 창업 진입 장벽을 완화시키는 서비스',
    founder: '홍길동',
    date: '2026년 6월',
    content: {},
  });
  const [showUserDataModal, setShowUserDataModal] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    적용분야: [], 보유기술: '', 마케팅전략: '', 추진계획: '', 창업동기: '', 팀구성: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const getSavedPlans = (): SavedPlan[] => {
    try {
      const s = localStorage.getItem('savedBusinessPlans');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  };

  useEffect(() => {
  const savedId = searchParams.get('saved');
  if (!savedId) return;

  fetch(`http://localhost:5000/api/business-plan/detail/${savedId}`)
    .then(res => res.json())
    .then(data => {
      if (data.plan_id) {
        setPlan(prev => ({
          ...prev,
          title: data.title,
          summary: data.summary ?? prev.summary,
          content: data.content ?? {},
        }));
        setCurrentSaveId(savedId);
        if (data.template_name && data.template_name !== '기본 양식') {
          setTemplateName(data.template_name);
          setSections(templateSections[data.template_name] ?? defaultSections);
        }
      }
    })
    .catch(err => console.error('불러오기 에러:', err));
}, [searchParams]);

   const [keywordData, setKeywordData] = useState<any>(null);

  useEffect(() => {
    const keyword = location.state?.keyword;
    if (!keyword) return;

    // TrendPilot 자체를 설명하는 초기 summary("뉴스데이터 및 창업지원공고데이터 기반...")가
    // 그대로 남아있으면 GPT가 이걸 "이 사업 아이템의 요약"으로 오인해 본문 전체에
    // TrendPilot 얘기가 섞여 들어가는 문제가 있었다. 키워드로 진입한 경우 즉시 비워서
    // 그 오염을 막고, keyword-data 응답이 도착하면 트렌드 reason으로 채운다.
    setPlan(prev => ({ ...prev, title: `${keyword} 기반 창업 사업계획서`, summary: '' }));

    fetch(`http://localhost:8000/api/business-plan/keyword-data/${encodeURIComponent(keyword)}`)
    .then(res => res.json())
    .then(data => {
      setKeywordData(data);
      if (data?.reason) {
        setPlan(prev => ({ ...prev, summary: data.reason }));
      }
    })
    .catch(err => console.error('키워드 데이터 조회 실패:', err));
  }, [location.state]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      setCurrentPage(Math.floor(container.scrollTop / (A4_H + PAGE_GAP)) + 1);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const obs = new ResizeObserver(() => {
      setTotalPages(Math.ceil(doc.scrollHeight / (A4_H + PAGE_GAP)) || 1);
    });
    obs.observe(doc);
    return () => obs.disconnect();
  }, [sections, plan]);

  const updateContent = (key: string, val: string) =>
    setPlan(prev => ({ ...prev, content: { ...prev.content, [key]: val } }));

  const updateCoverField = (field: keyof Omit<BusinessPlanData, 'content'>, val: string) =>
    setPlan(prev => ({ ...prev, [field]: val }));

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFileName(file.name);
    setAttachState('loading');

    const formData = new FormData();
    formData.append('template', file);

    try {
      const response = await fetch('http://localhost:8000/api/business-plan/parse-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.detail ?? '양식 분석에 실패했습니다.');
        setAttachState('idle');
        setAttachedFileName(null);
        return;
      }

      const data = await response.json();
      setSections(data.sections);
      setTemplateName(data.templateName);
      setAttachState('done');
    } catch (err) {
      console.error('양식 분석 실패:', err);
      alert('양식 분석 중 오류가 발생했습니다.');
      setAttachState('idle');
      setAttachedFileName(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachedFileName(null);
    setAttachState('idle');
    setSections(defaultSections);
    setTemplateName('기본 양식');
  };

  const generateBusinessPlan = async () => {
  setIsGenerating(true);
  setPlan(prev => ({ ...prev, content: {} }));

  const keyword = location.state?.keyword ?? null;
  // KeywordMap.tsx에서 "이 키워드로 사업계획서 쓰기" 클릭 시 함께 넘어오는
  // 최신 시장분석(marketCache 값). FastAPI가 keyword_details.market_analysis
  // (DB 구버전)보다 이 값을 우선 사용한다. 키워드 없이 직접 진입했거나
  // 캐시가 비어 있었던 경우엔 빈 문자열/undefined이므로 백엔드가 자동으로 DB값에 폴백한다.
  const marketAnalysisOverride = location.state?.marketAnalysis || null;

  try {
    const response = await fetch('http://localhost:8000/api/business-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sections,
        keyword,
        marketAnalysisOverride,
        userData,
        plan: { title: plan.title, summary: plan.summary },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail ?? 'AI 생성 실패');
    }

    const data = await response.json();
    setPlan(prev => ({ ...prev, content: data.content }));
  } catch (err) {
    console.error('사업계획서 생성 실패:', err);
    alert('AI 생성 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해주세요.');
  } finally {
    setIsGenerating(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  const handleSave = async () => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('로그인이 필요합니다.');
    return;
  }

  const timestamp = Date.now();
  const newPlanId = currentSaveId ?? `bp-${timestamp}`;

  try {
    const response = await fetch('http://localhost:5000/api/business-plan/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: newPlanId,
        user_id,
        title: plan.title,
        summary: plan.summary,
        template_name: templateName,
        content: plan.content,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setCurrentSaveId(newPlanId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert('저장 실패: ' + data.message);
    }
  } catch (err) {
    console.error('저장 에러:', err);
    alert('저장 중 오류가 발생했습니다.');
  }
};

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ top: (page - 1) * (A4_H + PAGE_GAP), behavior: 'smooth' });
  };

  // PDF 다운로드
const handleDownloadPDF = () => {
  const sections = bodySections.map(section => `
    <div style="margin-bottom: 28px;">
      <div style="border-bottom: 2px solid #00C9A7; padding-bottom: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        ${section.number ? `<span style="background:#00C9A7; color:white; width:20px; height:20px; border-radius:4px; display:inline-flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0;">${section.number}</span>` : ''}
        <span style="font-size:13px; font-weight:700; color:#111;">${section.label}</span>
        ${section.sub ? `<span style="font-size:10px; color:#9CA3AF; margin-left:4px;">${section.sub}</span>` : ''}
      </div>
      <p style="font-size:13px; line-height:1.95; color:#374151; white-space:pre-wrap; margin:0;">${plan.content[section.key] ?? ''}</p>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${plan.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
          background: white;
          color: #111;
        }
        .page {
          width: 794px;
          min-height: 1122px;
          padding: 80px 72px;
          margin: 0 auto;
          page-break-after: always;
        }
        @media print {
          body { margin: 0; }
          .page { margin: 0; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
      </style>
    </head>
    <body>
      <!-- 표지 -->
      <div class="page" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
        <div style="width:100%; border-bottom: 1px solid #00C9A7; margin-bottom: 48px;"></div>
        <div style="background:#E0F7F3; color:#00C9A7; padding:3px 12px; border-radius:999px; font-size:11px; font-weight:600; margin-bottom:20px;">${templateName}</div>
        <h1 style="font-size:26px; font-weight:800; color:#111; margin-bottom:16px; line-height:1.4;">${plan.title}</h1>
        <p style="font-size:14px; color:#666; line-height:1.7; margin-bottom:32px;">${plan.summary}</p>
        <div style="width:100%; display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:24px;">
          <div style="border-bottom:1px solid #f0f0f0; padding-bottom:8px; text-align:left;">
            <div style="font-size:10px; color:#aaa; margin-bottom:4px;">대표자</div>
            <div style="font-size:13px; color:#555;">${plan.founder}</div>
          </div>
          <div style="border-bottom:1px solid #f0f0f0; padding-bottom:8px; text-align:left;">
            <div style="font-size:10px; color:#aaa; margin-bottom:4px;">작성일</div>
            <div style="font-size:13px; color:#555;">${plan.date}</div>
          </div>
        </div>
        <div style="margin-top:auto; padding-top:24px; border-top:1px solid #f0f0f0; width:100%; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:700; color:#00C9A7;">TrendPilot</span>
          <span style="font-size:10px; color:#ccc;">1</span>
        </div>
      </div>

      <!-- 본문 -->
      <div class="page">
        ${sections}
        <div style="margin-top:32px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.07); display:flex; justify-content:space-between;">
          <span style="font-size:9px; color:#D1D5DB;">TrendPilot</span>
          <span style="font-size:9px; color:#D1D5DB;">2</span>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

// Word(.docx) 다운로드
const handleDownloadWord = async () => {
  const children = [
    new Paragraph({
      text: plan.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: plan.summary,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `대표자: ${plan.founder}`, break: 1 }),
                 new TextRun({ text: `작성일: ${plan.date}` })],
      spacing: { after: 600 },
    }),
    ...bodySections.flatMap(section => [
      new Paragraph({
        text: `${section.number ? section.number + '. ' : ''}${section.label}${section.sub ? ' - ' + section.sub : ''}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        text: plan.content[section.key] ?? '',
        spacing: { after: 300 },
      }),
    ]),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${plan.title}.docx`);
};

// PPT(.pptx) 다운로드
const handleDownloadPPT = () => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';

  // 표지 슬라이드
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: 'FFFFFF' };
  coverSlide.addText(plan.title, {
    x: 0.5, y: 2.5, w: 9, h: 1.5,
    fontSize: 28, bold: true, color: '111111',
    align: 'center',
  });
  coverSlide.addText(plan.summary, {
    x: 0.5, y: 4.2, w: 9, h: 0.8,
    fontSize: 14, color: '666666',
    align: 'center',
  });
  coverSlide.addText(`대표자: ${plan.founder}  |  작성일: ${plan.date}`, {
    x: 0.5, y: 5.2, w: 9, h: 0.5,
    fontSize: 12, color: '999999',
    align: 'center',
  });
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 6.8, w: 10, h: 0.08,
    fill: { color: '00C9A7' },
    line: { color: '00C9A7' },
  });

  // 섹션별 슬라이드
  bodySections.forEach(section => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };

    // 상단 타이틀 바
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 1.1,
      fill: { color: '00C9A7' },
      line: { color: '00C9A7' },
    });
    slide.addText(
      `${section.number ? section.number + '.  ' : ''}${section.label}`,
      {
        x: 0.3, y: 0.1, w: 9, h: 0.9,
        fontSize: 20, bold: true, color: 'FFFFFF',
      }
    );
    if (section.sub) {
      slide.addText(section.sub, {
        x: 0.3, y: 0.65, w: 9, h: 0.4,
        fontSize: 11, color: 'E0F7F3',
      });
    }

    // 본문 내용
    slide.addText(plan.content[section.key] ?? '(내용 없음)', {
      x: 0.5, y: 1.3, w: 9, h: 5.2,
      fontSize: 13, color: '333333',
      valign: 'top',
      wrap: true,
    });
  });

  pptx.writeFile({ fileName: `${plan.title}.pptx` });
};

  const bodySections = sections.filter(s => s.key !== 'cover');

  return (
    <div className="flex flex-col bg-[#F5FFFE]" style={{ height: 'calc(100vh - 62px)' }}>

      {/* 상단 타이틀 + 버튼 헤더 */}
      <div className="flex-shrink-0 px-8 pt-7 pb-5 bg-[#F5FFFE]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">사업계획서 작성</h1>
          <p className="text-gray-900">AI로 초안을 생성하거나 직접 내용을 입력하세요</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.hwp" className="hidden" onChange={handleFileAttach} />
         
          {/* ↓ 기존 버튼을 Tooltip으로 감싸기 */}
          <Tooltip text={"공고 양식 파일을 업로드하면\n해당 양식에 맞게 섹션이 자동 구성됩니다."}>
            <button
              data-tutorial="attach-form-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachState === 'loading'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors disabled:opacity-40 text-gray-600"
              style={{ fontSize: '13px' }}
            >
              <Paperclip className="w-4 h-4" />
              양식 첨부하기
              {attachState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
              {attachState === 'done' && attachedFileName && (
                <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{attachedFileName}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeAttachment(); }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </button>
          </Tooltip>

          <Tooltip text={"보유기술, 창업동기, 마케팅전략 등\n내 정보를 입력하면 AI가 더 정확하게 작성해요."}>
            <button
              data-tutorial="input-data-btn"
              onClick={() => setShowUserDataModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors text-gray-600"
              style={{ fontSize: '13px' }}
            >
              <Database className="w-4 h-4" />
              내 데이터 입력
              {(userData.적용분야.length > 0 || userData.창업동기) && (
                <span className="w-2 h-2 rounded-full bg-[#00C9A7]" />
              )}
            </button>
          </Tooltip>

          <Tooltip text={"입력한 데이터를 바탕으로 AI가\n사업계획서 초안을 자동으로 작성합니다."}>
            <button
              data-tutorial="generate-bizplan-btn"
              onClick={generateBusinessPlan}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#00C9A7', fontSize: '13px' }}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
              {isGenerating ? 'AI 작성 중...' : '사업계획서 작성하기'}
            </button>
          </Tooltip>
        
        </div>
      </div>
      <div className="flex-shrink-0 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }} />

      {/* 문서 영역 */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ background: '#D0D3D8' }}>
          {isGenerating && Object.keys(plan.content).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white rounded-2xl shadow-xl p-14 flex flex-col items-center gap-5">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#00C9A7' }} />
                <div className="text-center">
                  <p className="text-gray-800" style={{ fontSize: '15px', fontWeight: 600 }}>AI가 사업계획서를 작성하고 있습니다</p>
                  <p className="text-gray-400 mt-1" style={{ fontSize: '12px' }}>입력한 데이터를 기반으로 내용을 생성 중...</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: `${A4_W * (zoom / 100)}px`,
              margin: '0 auto',
            }}>
              <div
                ref={docRef}
                style={{
                  width: `${A4_W}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                  fontFamily: "'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', sans-serif",
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    #D0D3D8 0px,
                    #D0D3D8 ${PAGE_GAP / 2}px,
                    white ${PAGE_GAP / 2}px,
                    white ${A4_H + PAGE_GAP / 2}px,
                    #D0D3D8 ${A4_H + PAGE_GAP / 2}px,
                    #D0D3D8 ${A4_H + PAGE_GAP}px
                  )`,
                }}
              >
                <div style={{ padding: `${PAGE_GAP / 2}px 0` }}>

                  {/* 표지 */}
                  <div className="flex flex-col" style={{ width: '100%', minHeight: `${A4_H}px`, padding: `${MARGIN_H}px ${MARGIN_V}px`, boxSizing: 'border-box' }}>
                    <div className="flex items-center gap-3 mb-14">
                      <div className="h-px flex-1" style={{ background: '#00C9A7' }} />
                      <span className="tracking-widest uppercase text-gray-400" style={{ fontSize: '10px' }}>Business Plan</span>
                      <div className="h-px flex-1" style={{ background: '#00C9A7' }} />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
                      <div className="px-3 py-0.5 rounded-full" style={{ background: '#E0F7F3', color: '#00C9A7', fontSize: '11px', fontWeight: 600 }}>
                        {templateName}
                      </div>
                      <AutoResizeTextarea
                        value={plan.title}
                        onChange={v => updateCoverField('title', v)}
                        placeholder="사업명을 입력하세요"
                        className="w-full text-center border-0 border-b border-gray-200 bg-transparent focus:outline-none focus:border-[#00C9A7] resize-none"
                        style={{ fontSize: '26px', fontWeight: 800, color: '#111', lineHeight: '1.4' }}
                      />
                      <AutoResizeTextarea
                        value={plan.summary}
                        onChange={v => updateCoverField('summary', v)}
                        placeholder="사업 요약을 한 줄로 작성하세요"
                        className="w-full text-center border-0 border-b border-gray-100 bg-transparent focus:outline-none focus:border-[#00C9A7] resize-none text-gray-500"
                        style={{ fontSize: '14px', lineHeight: '1.7' }}
                      />
                      <div className="grid grid-cols-2 gap-4 w-full mt-6">
                        {([{ field: 'founder' as const, label: '대표자' }, { field: 'date' as const, label: '작성일' }]).map(({ field, label }) => (
                          <div key={field} className="text-left border-b border-gray-100 pb-2">
                            <div className="text-gray-400 mb-1" style={{ fontSize: '10px' }}>{label}</div>
                            <input value={plan[field]} onChange={e => updateCoverField(field, e.target.value)}
                              className="w-full bg-transparent focus:outline-none text-gray-700" style={{ fontSize: '13px' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-auto pt-5 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded" style={{ background: '#00C9A7' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#00C9A7' }}>Trendpilot</span>
                      </div>
                      <span className="text-gray-300" style={{ fontSize: '10px' }}>1</span>
                    </div>
                  </div>

                  {/* 본문 섹션 */}
                  <div style={{ padding: `${MARGIN_H}px ${MARGIN_V}px`, background: 'transparent', minHeight: `${A4_H - PAGE_GAP}px` }}>
                    {!isGenerating && Object.keys(plan.content).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
                        <Sparkles className="w-10 h-10" />
                        <p style={{ fontSize: '13px' }}>상단의 '사업계획서 작성하기' 버튼을 눌러 AI 초안을 생성하거나 직접 입력하세요.</p>
                      </div>
                    )}
                    {bodySections.map((section, idx) => (
                      <div key={section.key} style={{ marginBottom: idx < bodySections.length - 1 ? '28px' : 0 }}>
                        <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '2px solid #00C9A7' }}>
                          {section.number && (
                            <span className="w-5 h-5 rounded flex items-center justify-center text-white flex-shrink-0"
                              style={{ background: '#00C9A7', fontSize: '9px', fontWeight: 700 }}>
                              {section.number}
                            </span>
                          )}
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{section.label}</span>
                          {section.sub && <span className="ml-1" style={{ fontSize: '10px', color: '#9CA3AF' }}>{section.sub}</span>}
                        </div>
                        <AutoResizeTextarea
                          value={plan.content[section.key] ?? ''}
                          onChange={v => updateContent(section.key, v)}
                          placeholder={section.placeholder}
                          className="w-full bg-transparent focus:outline-none resize-none text-gray-700"
                          style={{ fontSize: '13px', lineHeight: '1.95', minHeight: '80px' }}
                        />
                      </div>
                    ))}
                    <div className="mt-8 pt-3 flex justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <span style={{ fontSize: '9px', color: '#D1D5DB' }}>Trendpilot</span>
                      <span style={{ fontSize: '9px', color: '#D1D5DB' }}>2</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측 페이지 패널 */}
        <div className="flex-shrink-0 bg-white border-l flex flex-col py-3 px-2.5 gap-2 overflow-y-auto"
          style={{ width: '80px', borderColor: 'rgba(0,0,0,0.08)' }}>
          <p className="text-center text-gray-400 mb-0.5" style={{ fontSize: '9px' }}>페이지</p>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => goToPage(p)} className="flex flex-col items-center gap-1">
              <div className="w-full rounded transition-all border" style={{
                aspectRatio: '210/297',
                background: currentPage === p ? '#E0F7F3' : 'white',
                borderColor: currentPage === p ? '#00C9A7' : 'rgba(0,0,0,0.12)',
                boxShadow: currentPage === p ? '0 0 0 1.5px #00C9A7' : '0 1px 3px rgba(0,0,0,0.1)',
              }}>
                <div className="p-1 mt-1 space-y-1">
                  {p === 1 ? (
                    <>
                      <div className="h-0.5 rounded mx-auto" style={{ background: '#00C9A7', width: '50%' }} />
                      <div className="h-0.5 rounded bg-gray-200 w-full" />
                      <div className="h-0.5 rounded bg-gray-100" style={{ width: '70%' }} />
                    </>
                  ) : (
                    [1,2,3].map(i => <div key={i} className="h-0.5 rounded bg-gray-200 w-full" />)
                  )}
                </div>
              </div>
              <span style={{ fontSize: '9px', color: currentPage === p ? '#00C9A7' : '#9CA3AF', fontWeight: currentPage === p ? 700 : 400 }}>
                {p}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 하단 버튼 바 (줌 컨트롤 포함) */}
      <div className="flex-shrink-0 bg-white border-t px-6 py-2.5 flex items-center justify-between"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}>

        <span className="text-gray-400" style={{ fontSize: '12px' }}>
          {currentPage} / {totalPages} 페이지
        </span>

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:border-[#00C9A7] hover:text-[#00C9A7] text-gray-500 transition-colors"
            style={{ fontSize: '16px', lineHeight: '1' }}
          >
            −
          </button>
          <span
            className="text-gray-600 cursor-pointer hover:text-[#00C9A7] transition-colors"
            style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}
            onClick={() => setZoom(100)}
          >
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:border-[#00C9A7] hover:text-[#00C9A7] text-gray-500 transition-colors"
            style={{ fontSize: '16px', lineHeight: '1' }}
          >
            +
          </button>
        </div>

        <div className="flex gap-3">
          <PlanButton
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border transition-all"
            style={{
              background: saved ? '#E0F7F3' : 'white',
              borderColor: saved ? '#00C9A7' : 'rgba(0,0,0,0.12)',
              color: saved ? '#00C9A7' : '#374151',
              fontSize: '13px',
            }}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '저장됨' : '임시저장'}
          </PlanButton>
          <PlanButton
            data-tutorial="download-btn"
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: '#00C9A7', fontSize: '13px' }}
          >
            <FileDown className="w-4 h-4" /> 다운로드
          </PlanButton>
        </div>
      </div>

      {/* 내 데이터 입력 모달 */}
      {showUserDataModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden" style={{ maxWidth: '560px', maxHeight: '88vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div>
                <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>내 데이터 입력</p>
                <p className="text-gray-400 mt-0.5" style={{ fontSize: '12px' }}>입력한 정보를 바탕으로 사업계획서를 작성합니다</p>
              </div>
              <button onClick={() => setShowUserDataModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(88vh - 130px)' }}>
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                  적용분야 <span className="text-gray-400" style={{ fontWeight: 400 }}>(복수 선택)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {fieldOptions.map(opt => {
                    const active = userData.적용분야.includes(opt);
                    return (
                      <button key={opt}
                        onClick={() => setUserData(prev => ({
                          ...prev,
                          적용분야: active ? prev.적용분야.filter(x => x !== opt) : [...prev.적용분야, opt],
                        }))}
                        className="px-3 py-1.5 rounded-full border transition-all"
                        style={{
                          fontSize: '12px',
                          background: active ? '#00C9A7' : 'white',
                          borderColor: active ? '#00C9A7' : 'rgba(0,0,0,0.12)',
                          color: active ? 'white' : '#555',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              {([
                { key: '보유기술',   label: '보유기술',    placeholder: '보유한 기술, 전문성, 자격증 등을 입력하세요', rows: 2 },
                { key: '창업동기',   label: '창업동기',    placeholder: '창업을 결심하게 된 계기와 해결하고 싶은 문제를 입력하세요', rows: 3 },
                { key: '마케팅전략', label: '마케팅 전략', placeholder: '목표 고객에게 어떻게 알리고 판매할 계획인지 입력하세요', rows: 3 },
                { key: '추진계획',   label: '추진 계획',   placeholder: '단계별 실행 계획을 입력하세요', rows: 3 },
                { key: '팀구성',     label: '팀 구성',     placeholder: '팀원 구성과 각자의 역할을 입력하세요', rows: 2 },
              ] as const).map(({ key, label, placeholder, rows }) => (
                <div key={key}>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: '13px', fontWeight: 600 }}>{label}</label>
                  <textarea
                    value={userData[key]}
                    onChange={e => setUserData(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent resize-none text-gray-700"
                    style={{ fontSize: '13px', lineHeight: '1.7' }}
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <button onClick={() => setShowUserDataModal(false)}
                className="px-5 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'rgba(0,0,0,0.12)', fontSize: '13px' }}>닫기</button>
              <button onClick={() => setShowUserDataModal(false)}
                className="px-5 py-2 rounded-lg text-white"
                style={{ background: '#00C9A7', fontSize: '13px' }}>저장하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 다운로드 모달 */}
      {showDownloadModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>파일 형식 선택</span>
        <button onClick={() => setShowDownloadModal(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {[
          {
            format: 'PDF',
            desc: 'PDF 문서 형식',
            bg: '#FEF2F2', color: '#DC2626',
            onClick: () => { handleDownloadPDF(); setShowDownloadModal(false); },
          },
          {
            format: 'Word (.docx)',
            desc: 'Microsoft Word 문서',
            bg: '#EFF6FF', color: '#2563EB',
            onClick: () => { handleDownloadWord(); setShowDownloadModal(false); },
          },
          {
            format: 'PPT (.pptx)',
            desc: '파워포인트 프레젠테이션',
            bg: '#FFF7ED', color: '#EA580C',
            onClick: () => { handleDownloadPPT(); setShowDownloadModal(false); },
          },
        ].map(({ format, desc, bg, color, onClick }) => (
          <button key={format}
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-[#00C9A7] hover:bg-[#E0F7F3] transition-all">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <FileDown className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-left">
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{format}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
}