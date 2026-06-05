// forwardRef 추가 : 버튼 껍데기를 통과해 안에 있는 진짜 버튼 기능까지 연결
import { useState, useEffect, forwardRef } from 'react';
import { FileDown, Save, Sparkles, Check, X, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router';
// ⚠️ Slot과 cva를 쓰기 위해 이 두 줄은 파일 상단에 추가해 줘야 합니다!
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

// 버튼 기본 ui
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const PlanButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={className}
        ref={ref}
        {...props}
      />
    );
  }
);
PlanButton.displayName = "PlanButton";


interface BusinessPlanData {
  title: string;
  summary: string;
  content: string;
}

interface SavedPlan {
  id: string;
  title: string;
  timestamp: number;
  plan: BusinessPlanData;
}

export default function BusinessPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // ← AI 생성 중 상태

  const defaultPlan: BusinessPlanData = {
    title: '창업 지원 통합 플랫폼 - TrendPilot',
    summary: '뉴스데이터 및 창업지원공고데이터 기반 키워드 분석을 통해 맞춤형 사업계획서 작성으로 창업 진입 장벽을 완화시키는 서비스',
    content: '', // ← AI가 채워줌 (초기엔 비어 있음)
  };

  const [plan, setPlan] = useState<BusinessPlanData>(defaultPlan);

  useEffect(() => {
    const savedId = searchParams.get('saved');
    if (savedId) {
      const savedPlans = getSavedPlans();
      const savedPlan = savedPlans.find(p => p.id === savedId);
      if (savedPlan) {
        setPlan(savedPlan.plan);
        setCurrentSaveId(savedId);
      }
    }
    // 자동 호출 없음 — 버튼 클릭 시에만 생성
  }, [searchParams]);

  const getSavedPlans = (): SavedPlan[] => {
    try {
      const saved = localStorage.getItem('savedBusinessPlans');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  // ← AI 사업계획서 생성 함수
  const generateBusinessPlan = async () => {
    setIsGenerating(true);
    setPlan(prev => ({ ...prev, content: '' }));

    try {
      const response = await fetch('http://localhost:8000/api/ai/business-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: '003_창업_사업계획서_양식.hwp',
          user_idea: 'TrendPilot',
          service_description: '뉴스 데이터 기반으로 창업 트렌드를 분석하고 맞춤형 사업계획서를 자동 생성하는 플랫폼',
          target_customer: '사업계획서 작성에 어려움을 겪는 예비창업자 및 초기 소상공인',
          news_summary: '예비창업자 정보 탐색 시간 평균 18시간, 서식 작성 중도 포기율 70% 이상',
          announcement_title: '2026년 예비창업패키지 소상공인 특화 분야',
          announcement_content: '소상공인의 디지털 전환 및 기술 기반 창업을 지원하는 프로그램',
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setPlan(prev => ({ ...prev, content: prev.content + chunk }));
      }
    } catch (err) {
      console.error('사업계획서 생성 실패:', err);
      alert('AI 생성 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const savedPlans = getSavedPlans();
    const timestamp = Date.now();

    if (currentSaveId) {
      const updatedPlans = savedPlans.map(p =>
        p.id === currentSaveId ? { ...p, title: plan.title, timestamp, plan } : p
      );
      localStorage.setItem('savedBusinessPlans', JSON.stringify(updatedPlans));
    } else {
      const newSave: SavedPlan = {
        id: `bp-${timestamp}`,
        title: plan.title,
        timestamp,
        plan,
      };
      savedPlans.push(newSave);
      localStorage.setItem('savedBusinessPlans', JSON.stringify(savedPlans));
      setCurrentSaveId(newSave.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownload = () => {
    setShowDownloadModal(true);
  };

  const handleDownloadFormat = (format: string) => {
    alert(`${format.toUpperCase()} 파일 다운로드가 시작됩니다.`);
    setShowDownloadModal(false);
  };

  const updateField = (field: keyof BusinessPlanData, value: string) => {
    setPlan(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F5FFFE] py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* 상단 툴바 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 sticky top-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <button
                onClick={() => navigate("/match-posting")}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00C9A7] mb-3 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                대시보드로 돌아가기
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" style={{ color: '#00C9A7' }} />
                <h1 className="text-gray-900 text-2xl font-bold">사업계획서 작성</h1>
              </div>
              <p className="text-sm text-gray-500">
                AI로 초안을 생성하거나 직접 내용을 입력하세요.
              </p>
            </div>
            <div className="flex gap-3 self-end">
              {/* AI 초안 생성 버튼 */}
              <PlanButton
                onClick={generateBusinessPlan}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(to right, #00C9A7, #00A88E)', fontSize: '14px' }}
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'AI 작성 중...' : 'AI로 초안 생성'}
              </PlanButton>

              {/* 임시저장 버튼 */}
              <PlanButton
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all font-medium ${
                  saved ? 'bg-[#E0F7F3] border-[#00C9A7]' : 'hover:bg-gray-50 bg-white'
                }`}
                style={{ borderColor: saved ? '#00C9A7' : 'rgba(0,0,0,0.1)', fontSize: '14px' }}
              >
                {saved ? <Check className="w-4 h-4" style={{ color: '#00C9A7' }} /> : <Save className="w-4 h-4" />}
                {saved ? '저장됨' : '임시저장'}
              </PlanButton>

              {/* 다운로드 버튼 */}
              <PlanButton
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium hover:bg-[#00A88E] transition-all"
                style={{ background: '#00C9A7', fontSize: '14px' }}
              >
                <FileDown className="w-4 h-4" />
                다운로드
              </PlanButton>
            </div>
          </div>
        </div>

        {/* 통합 문서 편집창 */}
        <div className="bg-white rounded-2xl shadow-lg p-16 space-y-8">
          {/* 문서 표지 섹션 */}
          <div className="text-center pb-12 border-b border-gray-100">
            <div className="text-sm text-gray-400 font-bold tracking-wider mb-3">BUSINESS PLAN</div>
            <textarea
              value={plan.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full text-center text-4xl font-extrabold text-gray-900 border-0 focus:outline-none focus:ring-0 resize-none mb-6"
              rows={1}
              placeholder="사업명을 입력하세요"
            />
            <textarea
              value={plan.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              className="w-full text-center text-base text-gray-500 border-0 focus:outline-none focus:ring-0 resize-none bg-gray-50 p-4 rounded-xl"
              rows={2}
              placeholder="사업 요약을 입력하세요"
            />
          </div>

          {/* AI 생성 결과 텍스트 박스 */}
          <div>
            {/* 생성 중이고 아직 내용이 없을 때 로딩 표시 */}
            {isGenerating && plan.content === '' && (
              <div className="flex items-center gap-3 p-8 text-gray-400">
                <Sparkles className="w-5 h-5 animate-pulse" style={{ color: '#00C9A7' }} />
                <span className="text-sm">AI가 사업계획서를 작성하고 있습니다...</span>
              </div>
            )}

            {/* 내용이 없고 생성 중도 아닐 때 안내 문구 */}
            {!isGenerating && plan.content === '' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-4">
                <Sparkles className="w-10 h-10" />
                <p className="text-sm">상단의 'AI로 초안 생성' 버튼을 눌러 사업계획서를 작성해보세요.</p>
              </div>
            )}

            <textarea
              value={plan.content}
              onChange={(e) => updateField('content', e.target.value)}
              className="w-full min-h-[900px] p-4 border-0 focus:outline-none focus:ring-0 resize-none text-gray-800 bg-white"
              style={{ fontSize: '15px', lineHeight: '1.9', fontFamily: 'Noto Sans KR, sans-serif' }}
              placeholder={isGenerating ? '' : '내용을 입력하세요.'}
            />
          </div>
        </div>
      </div>

      {/* 다운로드 포맷 선택 모달 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">파일 형식 선택</h2>
              <button onClick={() => setShowDownloadModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-sm">다운로드할 파일 형식을 선택하세요</p>
              <div className="space-y-3">
                {[
                  { format: 'pdf', name: 'PDF', desc: 'PDF 문서 형식', cssClass: 'bg-red-50 hover:bg-red-100 text-red-600' },
                  { format: 'word', name: 'Word', desc: 'Microsoft Word (.docx)', cssClass: 'bg-blue-50 hover:bg-blue-100 text-blue-600' },
                  { format: 'hwp', name: 'HWP', desc: '한글 문서 (.hwp)', cssClass: 'bg-orange-50 hover:bg-orange-100 text-orange-600' },
                  { format: 'googledocs', name: 'Google Docs', desc: 'Google 문서로 내보내기', cssClass: 'bg-green-50 hover:bg-green-100 text-green-600' },
                ].map(({ format, name, desc, cssClass }) => (
                  <button
                    key={format}
                    onClick={() => handleDownloadFormat(format)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#00C9A7] hover:bg-[#E0F7F3] transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${cssClass}`}>
                      <FileDown className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-sm text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}