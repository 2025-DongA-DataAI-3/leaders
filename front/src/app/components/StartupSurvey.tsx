import React, { useState } from "react";
// 💡 [변경점] 사용하지 않는 'Check' 아이콘은 빌드 최적화를 위해 import에서 제거함
import { Lightbulb } from "lucide-react";

// ==========================================================================
// 📌 [변경점] 컴포넌트 외부 데이터 분리 영역
// 원본 코드에서 컴포넌트 내부에 선언되어 있던 옵션 배열들을 바깥으로 뺐습니다.
// 이렇게 하면 컴포넌트가 재렌더링될 때마다 배열이 메모리에 새로 할당되는 것을 방지합니다.
// ==========================================================================
const AGE_OPTIONS = ["20대", "30대", "40대", "50대", "60대"];
const STARTUP_STATUS_OPTIONS = ["준비중", "3년미만", "3년이상"];
const REGION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

interface StartupSurveyProps {
  onComplete: () => void;
}


// ==========================================================================
// 🚀 [START] StartupSurvey 컴포넌트 시작
// ==========================================================================
export default function StartupSurvey({ onComplete }: StartupSurveyProps) {
  
  // ------------------------------------------------------------------------
  // 2-1. 내부 상태(State) 관리 영역 (원본 유지)
  // ------------------------------------------------------------------------
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [hasStartup, setHasStartup] = useState("");
  const [idea, setIdea] = useState("");

  // ------------------------------------------------------------------------
  // 2-2. 이벤트 핸들러 영역
  // ------------------------------------------------------------------------
  // 💡 [변경점] 일반 함수였던 handleSubmit을 FormEvent를 받는 핸들러로 수정.
  // <form onSubmit={...}> 구조와 결합하여 웹 접근성 및 엔터키 제출을 지원합니다.
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!age || !region || !hasStartup) {
    alert("연령대, 지역, 창업 상태를 선택해주세요.");
    return;
  }

  // localStorage 저장 (기존 유지)
  localStorage.setItem("userAge", age);
  localStorage.setItem("userRegion", region);
  localStorage.setItem("userHasStartup", hasStartup);
  localStorage.setItem("userIdea", idea);

  // DB 저장 추가
  try {
    const user_id = localStorage.getItem("user_id");

    await fetch("http://localhost:5000/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        age_group: age,
        region,
        startup_status: hasStartup,
        idea,
      }),
    });
  } catch (err) {
    console.error("진단 저장 실패:", err);
  }

  onComplete();
};

  // ------------------------------------------------------------------------
  // 2-3. 화면 렌더링(JSX) 영역
  // ------------------------------------------------------------------------
  return (
    // 💡 [변경점] backdrop-blur-sm를 추가하여 모달 뒤쪽 배경을 부드럽게 흐림 처리 (시각적 완성도 업)
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      
      {/* 💡 [변경점] animate-fade-in를 넣어 창이 뜰 때 부드럽게 나타나도록 연출 */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in">
        
        {/* [A] 상단 헤더 (원본 유지 및 텍스트 가독성 살짝 보정) */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white p-6 z-10 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-1">창업 성향 진단</h2>
          <p className="text-white/85 text-xs sm:text-sm">
            맞춤형 트렌드 분석을 위해 몇 가지 정보를 알려주세요
          </p>
        </div>

        {/* ==================================================================
          * 💡 [중요 변경점] 기존 <div> 구조에서 시맨틱한 <form> 구조로 변경
          * 이 내부의 모든 버튼들은 이벤트 전파 방지를 위해 type="button"을 명시하고,
          * 최종 완료 버튼만 submit 타입으로 작동하게 조율했습니다.
          * ================================================================== */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* 가. 연령대 선택 (버튼 패딩 및 폰트 굵기 스타일 미세 조정) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              연령대 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AGE_OPTIONS.map((option) => (
                <button
                  type="button" // 💡 [변경점] form 내부에서 의도치 않은 submit이 터지는 것을 방지
                  key={option}
                  onClick={() => setAge(option)}
                  className={`px-2 py-2.5 text-sm rounded-lg border-2 font-medium transition-all ${
                    age === option
                      ? "border-[#00C9A7] bg-[#E0F7F3] text-[#00C9A7]"
                      : "border-gray-200 hover:border-[#00C9A7]/50 text-gray-600 bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 나. 지역 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              지역 <span className="text-red-500">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              // 💡 [변경점] 텍스트 크기를 text-sm으로 맞추고 모바일 환경 대응을 위해 bg-white 명시
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C9A7] text-gray-700 transition-colors"
            >
              <option value="">지역을 선택하세요</option>
              {REGION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 다. 창업 상태 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              창업 상태 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STARTUP_STATUS_OPTIONS.map((option) => (
                <button
                  type="button" // 💡 [변경점] 의도치 않은 submit 방지
                  key={option}
                  onClick={() => setHasStartup(option)}
                  className={`px-4 py-3 text-sm rounded-lg border-2 font-medium transition-all ${
                    hasStartup === option
                      ? "border-[#00C9A7] bg-[#E0F7F3] text-[#00C9A7]"
                      : "border-gray-200 hover:border-[#00C9A7]/50 text-gray-600 bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 라. 창업 아이디어 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              창업 아이디어
              <span className="ml-2 text-xs font-normal text-gray-400">선택사항</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              아이디어를 바탕으로 적합한 창업 지원 공고를 매칭해 드립니다
            </p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="예) 시니어를 위한 AI 건강관리 앱 — 만성질환 데이터를 분석해 맞춤 운동·식단을 추천합니다"
              rows={4}
              // 💡 [변경점] style={{ fontSize: '14px' }} 인라인 코드를 Tailwind 표준 규격인 text-sm, leading-relaxed로 일원화
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00C9A7] resize-none text-gray-800 placeholder:text-gray-300 transition-colors leading-relaxed"
            />
            
            {/* 💡 [변경점] 아래 안내 팁 박스의 style={{ background: '#F0FDF9' }} 등 인라인 코드를 Tailwind(bg-[#F0FDF9], text-[#065F46])로 전면 교체 */}
            <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-[#F0FDF9]">
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#00C9A7]" />
              <p className="text-xs text-[#065F46] leading-relaxed">
                해결하려는 문제, 대상 고객, 핵심 기능 중 아는 만큼만 적으세요. 완성된 계획이 아니어도 됩니다.
              </p>
            </div>
          </div>

          {/* 마. 최종 제출 버튼 */}
          <button
            type="submit" // 💡 [변경점] 클릭이 아니라 form 전송 트리거로 작동하도록 변경
            // 💡 [변경점] 누를 때 살짝 찌그러지는 효과(active:scale-[0.99])와 부드러운 그림자 효과를 더해 버튼다운 손맛을 살림
            className="w-full px-6 py-4 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] active:scale-[0.99] transition-all font-semibold text-lg shadow-md shadow-[#00C9A7]/10"
          >
            완료
          </button>
        </form>
        {/* 입력 폼 본문 끝 */}

      </div>
    </div>
  );
}
// ==========================================================================
// 🚀 [END] StartupSurvey 컴포넌트 끝
// ==========================================================================