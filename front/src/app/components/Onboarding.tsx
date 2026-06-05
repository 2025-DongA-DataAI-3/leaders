import { useState, useEffect, forwardRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

interface Step {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const steps: Step[] = [
  {
    title: "TrendPilot에 오신 것을 환영합니다",
    description:
      "뉴스 데이터 및 창업지원공고 기반 키워드 분석을 통해 맞춤형 사업계획서 작성으로 창업 진입 장벽을 완화시키는 플랫폼입니다.",
  },
  {
    title: "키워드맵으로 트렌드 탐색",
    description:
      "IT, 제조, 유통, 바이오, 친환경 등 다양한 창업 분야의 최신 트렌드를 확인하고, 키워드를 클릭하면 연관관계를 시각적으로 볼 수 있습니다.",
    targetSelector: "nav a[href='/']",
    position: "bottom",
  },
  {
    title: "추천 맞춤 공고",
    description:
      "당신의 창업 성향에 맞는 정부 지원사업을 자동으로 추천받고, 지원하기 버튼을 눌러 바로 신청할 수 있습니다.",
    targetSelector: "nav a[href='/match-posting']",
    position: "bottom",
  },
  {
    title: "사업계획서 작성",
    description:
      "AI가 자동으로 생성한 사업계획서 초안을 수정하고, PDF, Word, HWP 등 다양한 형식으로 다운로드하세요.",
    targetSelector: "nav a[href='/business-plan']",
    position: "bottom",
  },
  {
    title: "커뮤니티",
    description:
      "다른 창업자들과 정보를 공유하고, 경험을 나누며 함께 성장하세요.",
    targetSelector: "nav a[href='/community']",
    position: "bottom",
  },
  {
    title: "AI 챗봇으로 즉시 질문",
    description:
      "궁금한 트렌드나 지원사업이 있다면 우측 하단의 AI 챗봇에게 바로 물어보세요. 실시간으로 답변을 받을 수 있습니다.",
    targetSelector: ".fixed.bottom-6.right-6 button",
    position: "left",
  },
];

// ================= [로컬 컴포넌트 시작: OnboardButton] =================
interface OnboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const OnboardButton = forwardRef<HTMLButtonElement, OnboardButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${className || ""}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
OnboardButton.displayName = "OnboardButton";
// ================= [로컬 컴포넌트 끝: OnboardButton] =================


// ================= [로컬 컴포넌트 시작: OnboardCloseButton] =================
interface OnboardCloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const OnboardCloseButton = forwardRef<HTMLButtonElement, OnboardCloseButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${className || ""}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
OnboardCloseButton.displayName = "OnboardCloseButton";
// ================= [로컬 컴포넌트 끝: OnboardCloseButton] =================


export default function Onboarding({
  onComplete,
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const [highlightPosition, setHighlightPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const step = steps[currentStep];
    if (step.targetSelector) {
      const element = document.querySelector(
        step.targetSelector,
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // 말풍선 위치 계산
        const tooltipWidth = 400;
        const tooltipHeight = 200;
        let top = 0;
        let left = 0;

        switch (step.position) {
          case "bottom":
            top = rect.bottom + 20;
            left =
              rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "top":
            top = rect.top - tooltipHeight - 20;
            left =
              rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top =
              rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - 20;
            break;
          case "right":
            top =
              rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + 20;
            break;
          default:
            top = window.innerHeight / 2 - tooltipHeight / 2;
            left = window.innerWidth / 2 - tooltipWidth / 2;
        }

        // 화면 밖으로 나가지 않도록 조정
        top = Math.max(
          20,
          Math.min(
            top,
            window.innerHeight - tooltipHeight - 20,
          ),
        );
        left = Math.max(
          20,
          Math.min(left, window.innerWidth - tooltipWidth - 20),
        );

        setTooltipPosition({ top, left });
      }
    } else {
      // 타겟 요소가 없으면 중앙에 표시
      setTooltipPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      setHighlightPosition({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 어두운 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleSkip}
      />

      {/* 하이라이트 영역 */}
      {step.targetSelector && highlightPosition.width > 0 && (
        <>
          {/* 하이라이트 박스 */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
              boxShadow:
                "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 201, 167, 0.5)",
              borderRadius: "12px",
              border: "3px solid #00C9A7",
              zIndex: 101,
            }}
          />
          {/* 펄스 애니메이션 */}
          <div
            className="absolute pointer-events-none animate-ping"
            style={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
              borderRadius: "12px",
              border: "2px solid #00C9A7",
              opacity: 0.3,
              zIndex: 101,
            }}
          />
        </>
      )}

      {/* 말풍선 툴팁 */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: "400px",
          maxWidth: "calc(100vw - 40px)",
          zIndex: 102,
        }}
      >
        <div className="relative bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white p-5 rounded-t-2xl">
          <OnboardCloseButton
            onClick={handleSkip}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          > {/* ★ 기존 구형 우상단 닫기 button에서 로컬 컴포넌트로 치환됨 */}
            <X className="w-5 h-5" />
          </OnboardCloseButton>
          <div className="text-sm mb-1 opacity-90">
            {currentStep + 1} / {steps.length}
          </div>
          <h3 className="text-lg font-semibold">
            {step.title}
          </h3>
        </div>

        <div className="p-5">
          <p className="text-gray-700 leading-relaxed mb-5">
            {step.description}
          </p>

          {/* 진행 바 */}
          <div className="mb-4">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00C9A7] to-[#00A88E] transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex items-center justify-between">
            <OnboardButton
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors text-sm ${
                currentStep === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            > {/* ★ 기존 구형 이전 button에서 로컬 컴포넌트로 치환됨 */}
              <ChevronLeft className="w-4 h-4" />
              이전
            </OnboardButton>

            <OnboardButton
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            > {/* ★ 기존 구형 건너뛰기 button에서 로컬 컴포넌트로 치환됨 */}
              건너뛰기
            </OnboardButton>

            <OnboardButton
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            > {/* ★ 기존 구형 다음/시작하기 button에서 로컬 컴포넌트로 치환됨 */}
              {currentStep === steps.length - 1
                ? "시작하기"
                : "다음"}
              <ChevronRight className="w-4 h-4" />
            </OnboardButton>
          </div>
        </div>
      </div>
    </div>
  );
}