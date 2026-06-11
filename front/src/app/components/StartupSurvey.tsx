import React, { useState, useEffect } from "react";
// 💡 [변경점] 사용하지 않는 'Check' 아이콘은 빌드 최적화를 위해 import에서 제거함
import { Lightbulb } from "lucide-react";

// ==========================================================================
// 📌 [변경점] 컴포넌트 외부 데이터 분리 영역
// 옵션 배열들을 컴포넌트 외부에 배치
// 컴포넌트가 재렌더링될 때마다 배열이 메모리에 새로 할당되는 것을 방지
// ==========================================================================
const TARGET_OPTIONS = ["1인창조기업", "일반인", "대학생"];
const HISTORY_OPTIONS = ["예비창업자", "1년미만", "2년미만", "3년미만"];
const REGION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

interface StartupSurveyProps {
  onComplete: () => void;
}
//  const FIELD_OPTIONS = [
//    "AI/기술창업", "푸드/외식", "친환경", "시니어/돌봄", 
//    "콘텐츠", "공간/오프라인", "디지털서비스", "교육", "기타"
//  ];

// ==========================================================================
// 🚀 [START] StartupSurvey 컴포넌트 시작
// ==========================================================================
export default function StartupSurvey({ onComplete }: StartupSurveyProps) {
  
  // ------------------------------------------------------------------------
  // 2-1. 내부 상태(State) 관리 영역 (원본 유지)
  // ------------------------------------------------------------------------
  const [target, setTarget] = useState("");
  const [history, setHistory] = useState("");
  const [region, setRegion] = useState("");
  const [tech, setTech] = useState("");
  const [idea, setIdea] = useState("");

  // 💡 백엔드 동적 데이터 연동을 위한 상태들
  const [fields, setFields] = useState<string[]>([]); 
  const [field, setField] = useState("");             

  // 💡 백엔드 API 호출 데이터 로드 추가
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/startup/fields"); 
        if (response.ok) {
          const data = await response.json(); 
          setFields(data);
        }
      } catch (error) {
        console.error("사업 분야 카테고리를 가져오는 중 실패:", error);
        setFields(["AI/기술창업", "푸드/외식", "카페/제과", "친환경", "시니어/돌봄", "콘텐츠", "공간/오프라인", "디지털서비스", "교육", "미용/뷰티", "기타"]);
      }
    };
    fetchFields();
  }, []);

  // ------------------------------------------------------------------------
  // 2-2. 이벤트 핸들러 영역
  // ------------------------------------------------------------------------
  // 💡 [변경점] 일반 함수였던 handleSubmit을 FormEvent를 받는 핸들러로 수정.
  // <form onSubmit={...}> 구조와 결합하여 웹 접근성 및 엔터키 제출을 지원합니다.
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!target || !history || !region || !field) {
    alert("대상, 창업이력, 지역, 사업분야를 모두 선택해주세요.");
    return;
  }

  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    alert("로그인이 필요합니다.");
    return;
  }

  // localStorage 저장 (기존 유지)
  localStorage.setItem("userTarget", target);
  localStorage.setItem("userHistory", history);
  localStorage.setItem("userRegion", region);
  localStorage.setItem("userField", field);
  localStorage.setItem("userTech", tech);
  localStorage.setItem("userIdea", idea);

  // DB 저장
  try {
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        target,
        history,
        region,
        field,
        tech,
        idea,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      alert(data.message || "저장 중 오류가 발생했습니다.");
      return;
    }
  } catch (error) {
    console.error("설문 저장 실패:", error);
    alert("서버 연결 실패! 백엔드 서버가 켜져 있는지 확인하세요.");
    return;
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
          
          {/* 가. 대상 선택 (1인창조기업, 일반인, 대학생) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              대상 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_OPTIONS.map((option) => (
                <button
                  type="button" 
                  key={option}
                  onClick={() => setTarget(option)}
                  className={`px-2 py-2.5 text-sm rounded-lg border-2 font-medium transition-all ${
                    target === option
                      ? "border-[#00C9A7] bg-[#E0F7F3] text-[#00C9A7]"
                      : "border-gray-200 hover:border-[#00C9A7]/50 text-gray-600 bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 나. 창업 이력 선택 (예비창업자, 1년미만, 2년미만, 3년미만) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              창업 이력 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HISTORY_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setHistory(option)}
                  className={`px-1 py-2.5 text-xs sm:text-sm rounded-lg border-2 font-medium transition-all ${
                    history === option
                      ? "border-[#00C9A7] bg-[#E0F7F3] text-[#00C9A7]"
                      : "border-gray-200 hover:border-[#00C9A7]/50 text-gray-600 bg-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 다. 지역 선택 */}
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

          {/* 라. 사업 분야 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              사업 분야 <span className="text-red-500">*</span>
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#00C9A7] text-gray-700 transition-colors"
            >
              <option value="">사업 분야를 선택하세요</option>
              {fields.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 마. 보유 기술 입력 (텍스트) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              보유 기술
              <span className="ml-2 text-xs font-normal text-gray-400">선택사항</span>
            </label>
            <input
              type="text"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="예) React, Python, 자율주행 알고리즘, 3D 프린팅 등"
              className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00C9A7] text-gray-800 placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* 바. 창업 아이디어 입력 */}
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