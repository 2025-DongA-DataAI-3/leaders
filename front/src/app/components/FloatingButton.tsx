import { useState, useEffect, useRef, forwardRef, type ButtonHTMLAttributes, type ReactNode, cloneElement, isValidElement } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Activity, MessageCircle, X, Bell, TrendingUp, FileText, Clock, CheckCheck, HelpCircle, Mail, Phone, ChevronRight, GraduationCap, Send, Maximize2, Minimize2 } from "lucide-react";
import Onboarding from "./Onboarding";
import StartupSurvey from "./StartupSurvey";

/* ==========================================================================
   [원형 유지] 외부 의존성 없이 작동하는 로컬 버튼 컴포넌트 (Polymorphic Button)
   ========================================================================== */
interface SlotProps {
  children?: ReactNode;
}
// Slot: 자식 컴포넌트에게 부모의 props와 className, style을 안전하게 병합해주는 유틸리티
const Slot = ({ children, ...props }: SlotProps & Record<string, any>) => {
  if (isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      ...props,
      ...(children as React.ReactElement<any>).props,
      className: `${props.className || ''} ${(children as React.ReactElement<any>).props.className || ''}`.trim() || undefined,
      style: { ...props.style, ...(children as React.ReactElement<any>).props.style },
    });
  }
  return null;
};

export interface RootIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

// RootIconButton: 디자인 일관성을 지키면서 유연한 마크업을 지원하는 다형성 버튼 컴포넌트
const RootIconButton = forwardRef<HTMLButtonElement, RootIconButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={`${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
RootIconButton.displayName = "RootIconButton";


/* ==========================================================================
   데이터 및 타입 선언 구역 (💡 백엔드 연동 시 API 응답 포맷의 기준점이 됩니다)
   ========================================================================== */
interface Notification {
  id: string;
  type: "keyword_trend" | "new_announcement" | "deadline_alert";
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

// 알림 타임스탬프 상대시간 변환 유틸
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  return `${days}일 전`;
}

// 알림 타입별 Lucide 아이콘 매핑 객체
const notificationIcon = { keyword_trend: TrendingUp, new_announcement: FileText, deadline_alert: Clock };

// 알림 타입별 동적 스타일 배정 객체
const notificationColor = {
  keyword_trend: { bg: "#EDE9FE", icon: "#7C3AED" },
  new_announcement: { bg: "#E0F7F3", icon: "#00C9A7" },
  deadline_alert: { bg: "#FEE2E2", icon: "#DC2626" },
};

// 고객센터 자주 묻는 질문(FAQ) 데이터 배열
const faqData = [
  { question: "TrendPilot은 어떤 서비스인가요?", answer: "TrendPilot은 예비·초기 창업자를 위한 정보 탐색 및 사업계획서 작성 지원 플랫폼입니다. 뉴스 데이터와 창업지원공고 기반 키워드 분석을 통해 맞춤형 사업계획서 작성을 도와드립니다." },
  { question: "사업계서는 어떻게 작성하나요?", answer: "창업 성향 진단을 완료하시면 AI가 자동으로 사업계획서 초안을 생성해드립니다. 이후 각 섹션을 클릭하여 수정하실 수 있으며, 저장 버튼을 눌러 임시 저장하거나 다운로드하실 수 있습니다." },
  { question: "공고 매칭률은 어떻게 계산되나요?", answer: "창업 성향 진단 결과(가용 자본, 기술 역량, 지역, 관심 분야 등)를 바탕으로 각 정부 지원사업의 지원 조건과 비교하여 매칭률을 산출합니다." },
  { question: "키워드 트렌드는 얼마나 자주 업데이트되나요?", answer: "키워드 트렌드는 매일 새벽 자동으로 업데이트됩니다. 최신 뉴스 데이터를 분석하여 실시간 창업 트렌드를 반영합니다." },
  { question: "저장한 데이터는 어디서 확인할 수 있나요?", answer: "마이페이지에서 저장한 키워드, 기사, 공고, 사업계획서 임시 저장본, 아이디어 메모 등을 모두 확인하실 수 있습니다." },
];

// 상단 네비게이션 바 라우팅 아이템 배열
const navItems = [
  { path: "/", label: "키워드맵" },
  { path: "/match-posting", label: "추천 맞춤 공고" },
  { path: "/business-plan", label: "사업계획서 작성" },
  { path: "/community", label: "커뮤니티" },
  { path: "/mypage", label: "마이페이지" },
];


/* ==========================================================================
   파일 내부 전용 고립 컴포넌트 구역 (관심사 분리 및 결합도 최적화 완료)
   ========================================================================== */

/**
 * 1. 내부 알림 드롭다운 컴포넌트
 * - 알림 목록 데이터 표현 및 읽음 처리 액션을 담당합니다.
 */
interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notif: Notification) => void;
  onMarkAllRead: () => void;
}
function NotificationDropdown({ notifications, unreadCount, onNotificationClick, onMarkAllRead }: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
      {/* 알림창 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "#00C9A7" }} />
          <span className="font-semibold text-gray-900" style={{ fontSize: "15px" }}>알림</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full font-medium">{unreadCount}개 안읽음</span>
          )}
        </div>
        {unreadCount > 0 && (
          <RootIconButton onClick={onMarkAllRead} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00C9A7] transition-colors">
            <CheckCheck className="w-3.5 h-3.5" /> 모두 읽음
          </RootIconButton>
        )}
      </div>
      {/* 알림 리스트 스크롤 영역 */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400" style={{ fontSize: "14px" }}>새로운 알림이 없습니다.</div>
        ) : (
          notifications.map((notif) => {
            const Icon = notificationIcon[notif.type];
            const colors = notificationColor[notif.type];
            return (
              <RootIconButton
                key={notif.id}
                onClick={() => onNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${!notif.isRead ? "bg-[#F0FDFB]" : ""}`}
              >
                {/* 알림 종류별 동적 아이콘 및 배경색 렌더링 */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: colors.bg }}>
                  <Icon className="w-4 h-4" style={{ color: colors.icon }} />
                </div>
                {/* 알림 본문 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`leading-snug ${notif.isRead ? "text-gray-600" : "text-gray-900 font-medium"}`} style={{ fontSize: "13px" }}>{notif.title}</p>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#00C9A7" }} />}
                  </div>
                  <p className="text-gray-500 mt-0.5 leading-snug" style={{ fontSize: "12px" }}>{notif.body}</p>
                  <p className="text-gray-400 mt-1" style={{ fontSize: "11px" }}>{notif.timestamp}</p>
                </div>
              </RootIconButton>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * 2. 내부 고객센터 컴포넌트
 * - FAQ 아코디언 토글 상태(`selectedFAQ`)를 자체적으로 가두어 두어, 
 * FAQ를 열고 닫을 때 메인 화면 전체가 다시 그려지는(Re-rendering) 자원 낭비를 방지합니다.
 */
interface CustomerServiceBoxProps {
  onClose: () => void;
}
function CustomerServiceBox({ onClose }: CustomerServiceBoxProps) {
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);
  return (
    <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
      {/* 고객센터 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200" style={{ background: "linear-gradient(to right, #6366F1, #4F46E5)" }}>
        <h3 className="text-white font-semibold flex items-center gap-2"><HelpCircle className="w-5 h-5" /> 고객센터</h3>
        <RootIconButton onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"><X className="w-5 h-5" /></RootIconButton>
      </div>
      {/* 고객센터 본문 스크롤 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* 하이퍼링크 문의 영역 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">문의하기</h4>
            <div className="space-y-2">
              <a href="mailto:support@TrendPilot.com" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-[#EEF2FF] transition-all">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center"><Mail className="w-4 h-4 text-[#6366F1]" /></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">이메일 문의</div>
                  <div className="text-xs text-gray-500">support@TrendPilot.com</div>
                </div>
              </a>
              <a href="tel:1588-0000" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-[#EEF2FF] transition-all">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center"><Phone className="w-4 h-4 text-[#6366F1]" /></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">전화 상담</div>
                  <div className="text-xs text-gray-500">1588-0000 (평일 09:00-18:00)</div>
                </div>
              </a>
            </div>
          </div>
          {/* 아코디언 FAQ 목록 영역 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">자주 묻는 질문</h4>
            <div className="space-y-2">
              {faqData.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <RootIconButton onClick={() => setSelectedFAQ(selectedFAQ === index ? null : index)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left">
                    <span className="text-sm font-medium text-gray-900 pr-2">{faq.question}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${selectedFAQ === index ? "rotate-90" : ""}`} />
                  </RootIconButton>
                  {selectedFAQ === index && (
                    <div className="px-3 pb-3"><p className="text-xs text-gray-600 leading-relaxed">{faq.answer}</p></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. 내부 AI 챗봇 컴포넌트
 * - 챗봇 입력 폼과 인터랙션을 고립시킵니다.
 * - 💡 향후 백엔드 WebSocket 통신, EventSource(SSE) 스트리밍 연동 시 이 내부 영역만 튜닝하면 됩니다.
 */
interface AIChatbotBoxProps {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function AIChatbotBox({ onClose, isExpanded, onToggleExpand }: AIChatbotBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지 올 때마다 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // 유저 메시지 추가
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // assistant 빈 메시지 먼저 추가 (스트리밍으로 채워나갈 자리)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages, // 이전 대화 내역 전달
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      // 스트리밍 청크 읽기
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // 마지막 assistant 메시지에 청크 누적
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "오류가 발생했습니다. 다시 시도해주세요.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 transition-all duration-300 ${
        isExpanded ? "w-[480px] h-[700px]" : "w-96 h-[500px]"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200" style={{ background: "linear-gradient(to right, #00C9A7, #00A88E)" }}>
        <h3 className="text-white font-semibold"> 창업 AI 챗봇</h3>
        <div className="flex items-center gap-1">
          <RootIconButton onClick={onToggleExpand} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </RootIconButton>
          <RootIconButton onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
            <X className="w-5 h-5" />
          </RootIconButton>
        </div>
      </div>

      {/* 대화 내역 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {/* 초기 인사말 */}
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="text-sm text-gray-700">안녕하세요! TrendPilot 창업 지원 어시스턴트입니다. 무엇을 도와드릴까요?</p>
        </div>

        {/* 메시지 목록 */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === "user"
                  ? "text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#00C9A7" } : undefined}
            >
              {/* 스트리밍 중 커서 효과 */}
              {msg.content || (msg.role === "assistant" && isLoading ? "▋" : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "응답 중..." : "메시지를 입력하세요..."}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm bg-white text-gray-900 disabled:bg-gray-50"
          />
          <RootIconButton
            type="submit"
            disabled={isLoading}
            className="p-2 text-white rounded-lg hover:opacity-90 active:scale-95 transition-all shrink-0 flex items-center justify-center disabled:opacity-50"
            style={{ backgroundColor: "#00C9A7" }}
          >
            <Send className="w-4 h-4" />
          </RootIconButton>
        </form>
      </div>
    </div>
  );
}


/* ==========================================================================
   메인 레이아웃 및 진입 트리거 컨트롤러 (Gating & Orchestration Layout)
   ========================================================================== */
export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null); // 알림 드롭다운 바깥 영역 클릭 감지용 참조(Ref)

  /* ------------------------------------------------------------------------
     모달 활성화 및 UI 레이어 토글 제어 상태 관리
     ------------------------------------------------------------------------ */
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [closingPanel, setClosingPanel] = useState<"chatbot" | "cs" | null>(null); 
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  // 알림 동적 상태 배열 (백엔드 API 연동)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  useEffect(() => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  const fetchNotifications = () => {
    fetch(`/api/announcements/notifications?user_id=${user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const mapped: Notification[] = data.map((row: any) => ({
          id: row.notification_id,
          type: row.type,
          title: row.message,
          body: row.type === 'deadline_alert' ? '스크랩한 공고 마감이 임박했습니다.' : '',
          timestamp: timeAgo(row.created_at),
          isRead: !!row.is_read,
          link: '/match-posting',
        }));
        setNotifications(mapped);
      })
      .catch((err) => console.error('알림 조회 실패:', err));
  };

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 5000); // 30초마다 폴링
  return () => clearInterval(interval);
}, []);

  /* ------------------------------------------------------------------------
     🛡️ [방어벽 시퀀스] 유저 상태별 온보딩 & 진단창 필터 순차 실행 엔진
     ------------------------------------------------------------------------ */
  useEffect(() => {
    // 0단계: 비로그인 유저는 예외 없이 튕겨냄
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    // 온보딩 재생 중에는 하위 조건 검사를 일시 차단하여 화면 흐트러짐 방지
    if (showOnboarding) return;

    const runTutorialTrigger = localStorage.getItem("runTutorialTrigger");
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding") === "true";
    const hasCompletedSurvey = localStorage.getItem("hasCompletedSurvey") === "true";

    // 🎯 마스터 마커 필터: 설문 진단 기록이 확인된 유저는 프리패스로 모든 팝업 플래그 완전 초기화 후 홈 진입
    if (hasCompletedSurvey) {
      setShowOnboarding(false);
      setShowSurvey(false);
      if (runTutorialTrigger === "true") {
        localStorage.removeItem("runTutorialTrigger");
      }
      return;
    }

    // 1단계 스텝 가드: 로그인 직후 트리거가 잡혔을 때 처음 가입자와 기존 미진단자 분기 실행
    if (runTutorialTrigger === "true") {
      localStorage.removeItem("runTutorialTrigger");
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
        setShowSurvey(false);
      } else {
        setShowSurvey(true);
      }
      return;
    }

    // 2단계 스텝 가드: 무조건적인 새로고침이나 우회 접근 시 안전장치 체인 활성화
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      return;
    }
    if (!hasCompletedSurvey) {
      setShowSurvey(true);
    }
  }, [navigate, isLoggedIn, showOnboarding]);  
  
  /* ------------------------------------------------------------------------
     알림 팝업 전용 외부 영역 터치 클로저 (Mousedown Event Binder)
     ------------------------------------------------------------------------ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  /* ------------------------------------------------------------------------
     모달 완료 단계별 연쇄 이동(바톤 터치) 가이드 핸들러
     ------------------------------------------------------------------------ */
  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true"); // 튜토리얼 확인 각인
    setShowOnboarding(false);
    
    // 온보딩이 성공적으로 꺼졌으니 확인 후 즉시 연속해서 설문조사 창을 바톤 터치로 띄움
    const hasCompletedSurvey = localStorage.getItem("hasCompletedSurvey");
    if (!hasCompletedSurvey) {
      setShowSurvey(true); 
    }
  };

  const handleSurveyComplete = () => {
    localStorage.setItem("hasCompletedSurvey", "true"); // 진단 완료 각인
    setShowSurvey(false);
  };

  /* ------------------------------------------------------------------------
     알림 인터랙션 상태 변경 핸들러 함수 구역
     ------------------------------------------------------------------------ */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

   // 알림 클릭 시 읽음 스위칭 처리 후 해당 도메인 링크로 네비게이션 이동
  const handleNotificationClick = (notif: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    fetch(`/api/announcements/notifications/${notif.id}/read`, { method: 'PATCH' });
    setShowNotifications(false);
    navigate(notif.link);
  };

  // 모두 읽음 클릭 핸들러
  const handleMarkAllRead = () => {
    const user_id = localStorage.getItem('user_id');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch('/api/announcements/notifications/read-all', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
  };
  // 닫기 핸들러 (애니메이션 후 실제 상태 변경)
  const handleClosePanel = (panel: "chatbot" | "cs") => {
    setClosingPanel(panel);
    setTimeout(() => {
      if (panel === "chatbot") setShowChatbot(false);
      else setShowCustomerService(false);
      setClosingPanel(null);
    }, 200); // 애니메이션 시간과 맞춤
  };

  // 현재 활성화된 네비게이션 메뉴 스타일 판단 서브 가드
  const isActive = (path: string) => {
    if (path === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/insight") ||
        location.pathname.startsWith("/trends")
      );
    }
    return location.pathname === path;
  };

  // 원본 디버깅 로그 시스템 유지
  console.log("====== 현재 모달 상태 ======");
  console.log("온보딩(튜토리얼) 표시 여부:", showOnboarding);
  console.log("창업성향진단 표시 여부:", showSurvey);
  console.log("============================");

  if (!isLoggedIn) return null;

  return (
    <>
      {/* 조건부 모달 바인딩 계층 */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showSurvey && <StartupSurvey onComplete={handleSurveyComplete} />}

      <div className="min-h-screen bg-[#F5FFFE]">
        {/* 상단 통합 네비게이션 레이아웃 */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
            {/* 로고 영역 */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/logo.png"
                alt="TrendPilot"
                className="h-9 w-auto"
              />
              <span className="text-lg font-black whitespace-nowrap" style={{ color: '#1F2937' }}>
                TrendPilot
              </span>
            </Link>
            {/* 링크 메뉴 및 우측 컨트롤 영역 */}
            <div className="flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                    isActive(item.path) ? "text-[#00C9A7] font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={isActive(item.path) ? { backgroundColor: "#E0F7F3" } : undefined}
                >
                  {item.label}
                </Link>
              ))}

              {/* 알림 벨 아이콘 레이어 컨트롤 그룹 */}
              <div className="relative" ref={notifRef}>
                <RootIconButton
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors text-gray-500 hover:bg-gray-50"
                  style={showNotifications ? { backgroundColor: "#E0F7F3", color: "#00C9A7" } : undefined}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">{unreadCount}</span>
                  )}
                </RootIconButton>

                {/* 독립 렌더링 알림창 주입 */}
                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllRead={handleMarkAllRead}
                  />
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 중첩 하위 라우팅 서브 뷰 타겟 맵 */}
        <main className="max-w-[1440px] mx-auto">
          <Outlet />
        </main>

        
        {/* 우측 하단 유틸리티 플로팅 메뉴 그룹 */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">

          {showChatbot ? (
            <div className={closingPanel === "chatbot" ? "animate-panel-close" : "animate-panel-pop"}>
              <AIChatbotBox
                onClose={() => handleClosePanel("chatbot")}
                isExpanded={isChatExpanded}
                onToggleExpand={() => setIsChatExpanded((v) => !v)}
              />
            </div>
          ) : showCustomerService ? (
            <div className={closingPanel === "cs" ? "animate-panel-close" : "animate-panel-pop"}>
              <CustomerServiceBox onClose={() => handleClosePanel("cs")} />
            </div>
          ) : (
            <>
              {/* 튜토리얼 초기화 및 강제 재적용 버튼 */}
              <RootIconButton
                onClick={() => {
                  localStorage.removeItem("hasSeenOnboarding");
                  localStorage.removeItem("hasCompletedSurvey");
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105 w-36 justify-center"
                style={{ background: "linear-gradient(to right, #8B5CF6, #7C3AED)" }}
                title="튜토리얼 다시보기"
              >
                <GraduationCap className="w-5 h-5" />
                <span className="font-semibold text-sm">튜토리얼</span>
              </RootIconButton>

              {/* 고객센터 독립 모듈 인터랙션 트리거 */}
              <RootIconButton
                onClick={() => setShowCustomerService(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105 w-36 justify-center"
                style={{ background: "linear-gradient(to right, #6366F1, #4F46E5)" }}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">고객센터</span>
              </RootIconButton>

              {/* AI 챗봇 독립 모듈 인터랙션 트리거 */}
              <RootIconButton
                onClick={() => setShowChatbot(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105 w-36 justify-center"
                style={{ background: "linear-gradient(to right, #00C9A7, #00A88E)" }}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">AI 챗봇</span>
              </RootIconButton>
            </>
          )}

        </div>

        {/* 패널 오픈 애니메이션 (앱 아이콘에서 펼쳐지는 느낌) */}
        <style>{`
          @keyframes panelPop {
            0% {
              opacity: 0;
              transform: scale(0.85) translate(15%, 15%);
              transform-origin: bottom right;
            }
            100% {
              opacity: 1;
              transform: scale(1) translate(0%, 0%);
            }
          }
          @keyframes panelClose {
            0% {
              opacity: 1;
              transform: scale(1) translate(0%, 0%);
            }
            100% {
              opacity: 0;
              transform: scale(0.85) translate(15%, 15%);
            }
          }
          .animate-panel-pop {
            animation: panelPop 0.25s ease-out forwards;
            transform-origin: bottom right;
          }
          .animate-panel-close {
            animation: panelClose 0.2s ease-in forwards;
            transform-origin: bottom right;
          }
        `}</style>
      </div>
    </>
  );
}