import { useState, useRef, useEffect, forwardRef } from 'react';
import { FileDown, Save, Sparkles, Check, X, Paperclip, Loader2, FileText, PenLine, Database } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

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
  { key: 'problemRecognition', label: '문제인식',        sub: '개발배경 및 필요성',        number: '1',   placeholder: '창업자들이 겪는 문제점과 시장의 한계를 구체적으로 서술하세요.' },
  { key: 'marketAnalysis',     label: '목표시장 분석',   sub: '시장 규모 및 타겟 고객',     number: '1-1', placeholder: 'TAM·SAM·SOM 구조로 시장 규모와 타겟 고객을 분석하세요.' },
  { key: 'solution',           label: '해결방안',        sub: '실현가능성',                number: '2',   placeholder: '어떤 기술·방식으로 문제를 해결하는지 구체적으로 서술하세요.' },
  { key: 'competitiveness',    label: '경쟁력 확보방안', sub: '차별성 및 진입장벽',         number: '2-1', placeholder: '경쟁사 대비 차별점과 진입장벽을 서술하세요.' },
  { key: 'growthStrategy',     label: '성장전략',        sub: '단계별 사업화 방안',         number: '3',   placeholder: '분기별 목표와 사업화 로드맵을 작성하세요.' },
  { key: 'revenueModel',       label: '수익 구조',       sub: '수익 모델 및 매출 계획',     number: '4',   placeholder: '수익 모델, 가격 전략, 예상 매출을 작성하세요.' },
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

export default function BusinessPlan() {
  const [searchParams] = useSearchParams();

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
    const found = getSavedPlans().find(p => p.id === savedId);
    if (found) {
      setPlan(found.plan);
      setCurrentSaveId(savedId);
      if (found.templateName && found.templateName !== '기본 양식') {
        setTemplateName(found.templateName);
        setSections(templateSections[found.templateName] ?? defaultSections);
      }
    }
  }, [searchParams]);

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

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFileName(file.name);
    setAttachState('loading');
    setTimeout(() => {
      const key = Object.keys(templateSections).find(k => file.name.includes(k)) ?? '예비창업패키지';
      setSections(templateSections[key]);
      setTemplateName(key);
      setAttachState('done');
    }, 1800);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    try {
      const response = await fetch('http://localhost:8000/api/ai/business-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: attachedFileName ?? '003_창업_사업계획서_양식.hwp',
          user_idea: plan.title,
          service_description: plan.summary,
          target_customer: userData.적용분야.join(', ') || '예비창업자 및 초기 소상공인',
          news_summary: userData.창업동기 || '예비창업자 정보 탐색 시간 평균 18시간',
          announcement_title: `${templateName} 모집 공고`,
          announcement_content: userData.보유기술 || '소상공인의 디지털 전환 및 기술 기반 창업 지원',
        }),
      });
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      const firstBodyKey = sections.find(s => s.key !== 'cover')?.key ?? 'problemRecognition';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setPlan(prev => ({
          ...prev,
          content: { ...prev.content, [firstBodyKey]: (prev.content[firstBodyKey] ?? '') + chunk },
        }));
      }
    } catch (err) {
      console.error('사업계획서 생성 실패:', err);
      alert('AI 생성 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsGenerating(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = () => {
    const plans = getSavedPlans();
    const timestamp = Date.now();
    if (currentSaveId) {
      const updated = plans.map(p =>
        p.id === currentSaveId ? { ...p, title: plan.title, timestamp, plan, templateName } : p
      );
      localStorage.setItem('savedBusinessPlans', JSON.stringify(updated));
    } else {
      const newSave: SavedPlan = { id: `bp-${timestamp}`, title: plan.title, timestamp, plan, templateName };
      plans.push(newSave);
      localStorage.setItem('savedBusinessPlans', JSON.stringify(plans));
      setCurrentSaveId(newSave.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goToPage = (page: number) => {
    scrollRef.current?.scrollTo({ top: (page - 1) * (A4_H + PAGE_GAP), behavior: 'smooth' });
  };

  const bodySections = sections.filter(s => s.key !== 'cover');

  return (
    <div className="flex flex-col bg-[#F5FFFE]" style={{ height: 'calc(100vh - 62px)' }}>

      {/* 상단 타이틀 + 버튼 헤더 */}
      <div className="flex-shrink-0 px-8 pt-7 pb-5 bg-[#F5FFFE]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">사업계획서 작성</h1>
          <p className="text-sm text-gray-500">AI로 초안을 생성하거나 직접 내용을 입력하세요</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.hwp" className="hidden" onChange={handleFileAttach} />

          <button
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

          <button
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

          <button
            onClick={generateBusinessPlan}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00C9A7', fontSize: '13px' }}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            {isGenerating ? 'AI 작성 중...' : '사업계획서 작성하기'}
          </button>
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
                { format: 'PDF',         desc: 'PDF 문서 형식',           bg: '#FEF2F2', color: '#DC2626' },
                { format: 'Word',        desc: 'Microsoft Word (.docx)', bg: '#EFF6FF', color: '#2563EB' },
                { format: 'HWP',         desc: '한글 문서 (.hwp)',        bg: '#FFF7ED', color: '#EA580C' },
                { format: 'Google Docs', desc: 'Google 문서로 내보내기',  bg: '#F0FDF4', color: '#16A34A' },
              ].map(({ format, desc, bg, color }) => (
                <button key={format}
                  onClick={() => { alert(`${format} 다운로드가 시작됩니다.`); setShowDownloadModal(false); }}
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
