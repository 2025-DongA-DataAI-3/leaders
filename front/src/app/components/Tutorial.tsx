import { useState, useEffect, forwardRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
  navigate: (path: string) => void;
}

interface Step {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
  navigateTo?: string;
}

const steps: Step[] = [
  { title: "TrendPilot에 오신 것을 환영합니다", description: "뉴스 데이터 및 창업지원공고 기반 키워드 분석을 통해 맞춤형 사업계획서 작성으로 창업 진입 장벽을 완화시키는 플랫폼입니다." },
  { title: "키워드맵", description: "IT, 제조, 유통, 바이오, 친환경 등 다양한 창업 분야의 최신 트렌드를 확인할 수 있는 메인 페이지입니다.", targetSelector: "nav a[href='/keyword-map']", position: "bottom", navigateTo: "/keyword-map" },
  { title: "버블맵으로 보기", description: "키워드 간 연관관계를 버블 형태로 시각화합니다. 버블을 클릭하면 관련 키워드와 연결선을 강조해서 볼 수 있어요.", targetSelector: "[data-tutorial='bubble-map-btn']", position: "top" },
  { title: "랭킹 보기", description: "검색 관심도, 증가율, 뉴스 근거량 등을 종합한 점수로 트렌드 키워드 순위를 확인할 수 있습니다.", targetSelector: "[data-tutorial='ranking-btn']", position: "bottom" },
  { title: "키워드맵 화면", description: "씨드 키워드(고정 노드)와 AI가 추출한 연관 키워드(동적 노드)가 연결된 네트워크 맵입니다. 키워드를 클릭하면 상세 정보를 볼 수 있어요.", targetSelector: "[data-tutorial='keyword-map']", position: "left" },
  { title: "추천 맞춤 공고", description: "창업 성향 진단 결과를 바탕으로 나에게 맞는 정부 지원사업 공고를 자동으로 추천받을 수 있습니다.", targetSelector: "nav a[href='/match-posting']", position: "bottom" },
  { title: "공고 검색", description: "키워드로 원하는 지원사업 공고를 직접 검색할 수 있습니다. 검색어 입력 후 버튼을 누르거나 Enter를 눌러주세요.", targetSelector: "[data-tutorial='announcement-search-btn']", position: "bottom", navigateTo: "/match-posting" },
  { title: "내 맞춤 공고 보기", description: "진단 결과 기반으로 매칭된 나만의 추천 공고 목록을 필터링해서 볼 수 있습니다.", targetSelector: "[data-tutorial='my-match-btn']", position: "bottom" },
  { title: "캘린더 뷰", description: "공고 마감일을 캘린더 형태로 한눈에 확인할 수 있습니다. 일정 관리에 활용해보세요.", targetSelector: "[data-tutorial='calendar-view-btn']", position: "bottom" },
  { title: "지원하기", description: "관심 공고의 지원하기 버튼을 누르면 해당 공고의 공식 지원 페이지로 바로 이동합니다.", targetSelector: "[data-tutorial='apply-btn']", position: "left" },
  { title: "사업계획서 작성", description: "AI가 자동으로 사업계획서 초안을 생성해드립니다. 양식 첨부, 데이터 입력, AI 작성, 다운로드까지 한 번에 처리할 수 있어요.", targetSelector: "nav a[href='/business-plan']", position: "bottom" },
  { title: "양식 첨부하기", description: "기존 사업계획서 양식(HWP, PDF, Word)을 업로드하면 AI가 해당 양식에 맞게 내용을 채워드립니다.", targetSelector: "[data-tutorial='attach-form-btn']", position: "right", navigateTo: "/business-plan" },
  { title: "내 데이터 입력", description: "창업 아이템, 목표 시장, 예산 등 내 정보를 입력하면 AI가 더 정확한 사업계획서를 작성해드립니다.", targetSelector: "[data-tutorial='input-data-btn']", position: "right" },
  { title: "사업계획서 작성하기", description: "입력한 데이터를 바탕으로 AI가 사업계획서 초안을 자동 생성합니다. 생성 후 각 섹션을 직접 수정할 수 있어요.", targetSelector: "[data-tutorial='generate-bizplan-btn']", position: "top" },
  { title: "다운로드", description: "완성된 사업계획서를 PDF, Word, HWP 등 원하는 형식으로 다운로드할 수 있습니다.", targetSelector: "[data-tutorial='download-btn']", position: "top" },
  { title: "커뮤니티", description: "다른 창업자들과 정보를 공유하고 경험을 나눌 수 있는 공간입니다.", targetSelector: "nav a[href='/community']", position: "bottom" },
  { title: "분야별 게시판", description: "창업분야, 창업소통, 창업실무 3가지 카테고리로 나뉜 게시판에서 원하는 주제의 글을 찾아볼 수 있습니다.", targetSelector: "[data-tutorial='community-category']", position: "right", navigateTo: "/community" },
  { title: "글쓰기", description: "창업 경험, 정보, 질문을 자유롭게 게시할 수 있습니다. 볼드, 이탤릭 등 서식 도구도 지원해요.", targetSelector: "[data-tutorial='community-write-btn']", position: "left" },
  { title: "마이페이지", description: "나의 활동 내역과 저장 데이터를 한곳에서 관리할 수 있습니다.", targetSelector: "nav a[href='/mypage']", position: "bottom" },
  { title: "임시저장한 사업계획서", description: "작성 중 저장한 사업계획서 초안을 확인하고 이어서 수정할 수 있습니다.", targetSelector: "[data-tutorial='saved-bizplan']", position: "right", navigateTo: "/mypage" },
  { title: "관심 키워드", description: "키워드맵에서 저장한 관심 키워드 목록을 확인할 수 있습니다.", targetSelector: "[data-tutorial='interest-keywords']", position: "right" },
  { title: "저장", description: "스크랩한 공고, 북마크한 게시글 등 저장한 콘텐츠를 모아볼 수 있습니다.", targetSelector: "[data-tutorial='mypage-saved']", position: "right" },
  { title: "설정", description: "회원정보 수정, 알림 설정, 회원탈퇴 등 계정 관련 설정을 관리할 수 있습니다.", targetSelector: "[data-tutorial='mypage-settings']", position: "right" },
  { title: "튜토리얼 다시보기", description: "언제든지 이 버튼을 누르면 튜토리얼을 처음부터 다시 볼 수 있습니다.", targetSelector: "[data-tutorial='floating-tutorial-btn']", position: "left" },
  { title: "고객센터", description: "이메일·전화 문의와 자주 묻는 질문(FAQ)을 확인할 수 있습니다.", targetSelector: "[data-tutorial='floating-cs-btn']", position: "left" },
  { title: "AI 챗봇", description: "궁금한 트렌드나 지원사업이 있다면 AI 챗봇에게 바로 물어보세요. 실시간으로 답변을 받을 수 있습니다.", targetSelector: "[data-tutorial='floating-chatbot-btn']", position: "left" },
];

interface OnboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
const OnboardButton = forwardRef<HTMLButtonElement, OnboardButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={className || ""} {...props}>{children}</button>
  )
);
OnboardButton.displayName = "OnboardButton";

interface OnboardCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
const OnboardCloseButton = forwardRef<HTMLButtonElement, OnboardCloseButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button ref={ref} className={className || ""} {...props}>{children}</button>
  )
);
OnboardCloseButton.displayName = "OnboardCloseButton";

export default function Onboarding({ onComplete, navigate }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: window.innerHeight / 2 - 150,
    left: window.innerWidth / 2 - 200,
  });
  const [highlightPosition, setHighlightPosition] = useState({
    top: 0, left: 0, width: 0, height: 0,
  });

  useEffect(() => {
    // 이전 스텝 요소 zIndex 초기화
    const prevStep = steps[currentStep - 1];
    if (prevStep?.targetSelector) {
      const prevEl = document.querySelector(prevStep.targetSelector) as HTMLElement;
      if (prevEl) {
        prevEl.style.position = "";
        prevEl.style.zIndex = "";
      }
    }

    const step = steps[currentStep];

    // viewMode 강제 전환
    if (currentStep === 3) {
      // 랭킹버튼은 bubbles 모드에서만 보임
      window.dispatchEvent(new CustomEvent("tutorial:setViewMode", { detail: "bubbles" }));
    } else if (currentStep >= 4 ) {
      // 키워드맵 화면, 사업계획서 버튼은 bubbles 모드에서만 보임
      window.dispatchEvent(new CustomEvent("tutorial:setViewMode", { detail: "bubbles" }));
    } else if (currentStep <= 2) {
      // 나머지 키워드맵 관련은 ranking 모드
      window.dispatchEvent(new CustomEvent("tutorial:setViewMode", { detail: "ranking" }));
    }

    // 페이지 이동
    if (step.navigateTo) {
      navigate(step.navigateTo);
    }

    // 렌더링 대기 후 요소 탐색
    const timer = setTimeout(() => {
      if (step.targetSelector) {
        const element = document.querySelector(step.targetSelector);
        if (element) {
          element.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "center" });

          setTimeout(() => {
            const el = element as HTMLElement;
            el.style.position = "relative";
            el.style.zIndex = "103";

            const rect = element.getBoundingClientRect();
            setHighlightPosition({
              top: rect.top, left: rect.left,
              width: rect.width, height: rect.height,
            });

            const tooltipWidth = 380;
            const tooltipHeight = 250;
            let top = 0, left = 0;

            switch (step.position) {
              case "bottom": top = rect.bottom + 24; left = rect.left + rect.width / 2 - tooltipWidth / 2; break;
              case "top":    top = rect.top - tooltipHeight - 24; left = rect.left + rect.width / 2 - tooltipWidth / 2; break;
              case "left":   top = rect.top + rect.height / 2 - tooltipHeight / 2; left = rect.left - tooltipWidth - 24; if (left < 20) left = rect.right + 24; break;
              case "right":  top = rect.top + rect.height / 2 - tooltipHeight / 2; left = rect.right + 24; if (left + tooltipWidth > window.innerWidth - 20) left = rect.left - tooltipWidth - 24; break;
              default:       top = window.innerHeight / 2 - tooltipHeight / 2; left = window.innerWidth / 2 - tooltipWidth / 2;
            }

            top  = Math.max(20, Math.min(top,  window.innerHeight - tooltipHeight - 20));
            left = Math.max(20, Math.min(left, window.innerWidth  - tooltipWidth  - 20));

            // 툴팁이 하이라이트 영역과 겹치면 반대편으로
            const hlTop    = rect.top    - 12;
            const hlBottom = rect.bottom + 12;
            const hlLeft   = rect.left   - 12;
            const hlRight  = rect.right  + 12;
            const overlapV = top < hlBottom && top + tooltipHeight > hlTop;
            const overlapH = left < hlRight && left + tooltipWidth > hlLeft;
            if (overlapV && overlapH) {
              top = hlTop > tooltipHeight + 20
                ? hlTop - tooltipHeight - 24
                : hlBottom + 24;
              top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
            }

            setTooltipPosition({ top, left });
          }, 50);
        }
      } else {
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
        });
        setHighlightPosition({ top: 0, left: 0, width: 0, height: 0 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // 스크롤/리사이즈 시 좌표 재계산
  useEffect(() => {
    const step = steps[currentStep];
    if (!step.targetSelector) return;
    const recalc = () => {
      const element = document.querySelector(step.targetSelector!);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setHighlightPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [currentStep]);

  const handleNext = () => { currentStep < steps.length - 1 ? setCurrentStep(s => s + 1) : onComplete(); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };
  const handleSkip = () => onComplete();
  const step = steps[currentStep];
  const hasHighlight = !!step.targetSelector && highlightPosition.width > 0;

  return (
    <div className="fixed inset-0 z-[100]">

      {/* 타겟 없을 때 기본 오버레이 */}
      {!hasHighlight && (
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
      )}

      {/* 하이라이트 영역 */}
      {hasHighlight && (
        <>
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 100 }}>
            <defs>
              <radialGradient
                id="hole-gradient"
                cx={highlightPosition.left + highlightPosition.width / 2}
                cy={highlightPosition.top + highlightPosition.height / 2}
                r={Math.max(highlightPosition.width, highlightPosition.height) * 0.8}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#00C9A7" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#00C9A7" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
              </radialGradient>
              <mask id="highlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightPosition.left - 12} y={highlightPosition.top - 12}
                  width={highlightPosition.width + 24} height={highlightPosition.height + 24}
                  rx="14" ry="14" fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#highlight-mask)" />
            <rect width="100%" height="100%" fill="url(#hole-gradient)" mask="url(#highlight-mask)" />
          </svg>

          {/* 민트 외곽선 글로우 */}
          <div className="absolute pointer-events-none" style={{
            top: highlightPosition.top - 12, left: highlightPosition.left - 12,
            width: highlightPosition.width + 24, height: highlightPosition.height + 24,
            borderRadius: 14, border: "2px solid rgba(0,201,167,0.9)",
            boxShadow: "0 0 0 1px rgba(0,201,167,0.5), 0 0 8px 3px rgba(0,201,167,0.4), 0 0 20px 8px rgba(0,201,167,0.2), 0 0 40px 16px rgba(0,201,167,0.08)",
            zIndex: 105,
          }} />

          {/* 펄스 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 105 }}>
            <rect
              x={highlightPosition.left - 12} y={highlightPosition.top - 12}
              width={highlightPosition.width + 24} height={highlightPosition.height + 24}
              rx="14" ry="14" fill="none" stroke="#00C9A7" strokeWidth="2"
            >
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="stroke-width" values="2;8;2" dur="2s" repeatCount="indefinite" />
            </rect>
          </svg>
        </>
      )}

      {/* 말풍선 툴팁 */}
      <div className="absolute bg-white rounded-2xl shadow-2xl"
        style={{ top: tooltipPosition.top, left: tooltipPosition.left, width: 380, maxWidth: "calc(100vw - 40px)", zIndex: 110 }}
      >
        <div className="relative bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white p-5 rounded-t-2xl">
          <OnboardCloseButton onClick={handleSkip} className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </OnboardCloseButton>
          <div className="text-sm mb-1 opacity-90">{currentStep + 1} / {steps.length}</div>
          <h3 className="text-lg font-semibold">{step.title}</h3>
        </div>
        <div className="p-5">
          <p className="text-gray-700 leading-relaxed mb-5">{step.description}</p>
          <div className="mb-4">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00C9A7] to-[#00A88E] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <OnboardButton onClick={handlePrev} disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm ${currentStep === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}>
              <ChevronLeft className="w-4 h-4" /> 이전
            </OnboardButton>
            <OnboardButton onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              건너뛰기
            </OnboardButton>
            <OnboardButton onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium">
              {currentStep === steps.length - 1 ? "시작하기" : "다음"}
              <ChevronRight className="w-4 h-4" />
            </OnboardButton>
          </div>
        </div>
      </div>
    </div>
  );
}