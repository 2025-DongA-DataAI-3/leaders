import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { MessageCircle, X, Bell, TrendingUp, FileText, Clock, CheckCheck, HelpCircle, Mail, Phone, ChevronRight, GraduationCap } from "lucide-react";
import Onboarding from "../Onboarding";
import StartupSurvey from "../StartupSurvey";

interface Notification {
  id: string;
  type: "keyword_trend" | "new_announcement" | "deadline_alert";
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "keyword_trend",
    title: "AI 에이전트 키워드 급등",
    body: "'AI 에이전트'가 이번 주 트렌드 1위로 진입했습니다.",
    timestamp: "10분 전",
    isRead: false,
    link: "/insight/AI 에이전트",
  },
  {
    id: "n2",
    type: "new_announcement",
    title: "새 공고: K-스타트업 2026 모집",
    body: "관심 분야(IT/소프트웨어)에 새로운 지원 공고가 등록되었습니다.",
    timestamp: "1시간 전",
    isRead: false,
    link: "/match-posting",
  },
  {
    id: "n3",
    type: "deadline_alert",
    title: "마감 임박 D-3: 청년창업사관학교 12기",
    body: "스크랩한 공고 마감이 3일 남았습니다. 서둘러 확인하세요.",
    timestamp: "3시간 전",
    isRead: false,
    link: "/match-posting",
  },
  {
    id: "n4",
    type: "keyword_trend",
    title: "SaaS 플랫폼 키워드 상승",
    body: "'SaaS 플랫폼'이 지난주 대비 검색량 38% 증가했습니다.",
    timestamp: "어제",
    isRead: true,
    link: "/insight/SaaS 플랫폼",
  },
  {
    id: "n5",
    type: "new_announcement",
    title: "새 공고: 초기창업패키지 2026",
    body: "관심 분야(바이오/헬스케어)에 새로운 지원 공고가 등록되었습니다.",
    timestamp: "2일 전",
    isRead: true,
    link: "/match-posting",
  },
];

const notificationIcon = {
  keyword_trend: TrendingUp,
  new_announcement: FileText,
  deadline_alert: Clock,
};

const notificationColor = {
  keyword_trend: { bg: "#EDE9FE", icon: "#7C3AED" },
  new_announcement: { bg: "#E0F7F3", icon: "#00C9A7" },
  deadline_alert: { bg: "#FEE2E2", icon: "#DC2626" },
};

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      return;
    }
    const hasCompletedSurvey = localStorage.getItem("hasCompletedSurvey");
    if (!hasCompletedSurvey) {
      setShowSurvey(true);
    }
  }, [navigate, isLoggedIn]);

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

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
    const hasCompletedSurvey = localStorage.getItem("hasCompletedSurvey");
    if (!hasCompletedSurvey) {
      setShowSurvey(true);
    }
  };

  const handleSurveyComplete = () => {
    localStorage.setItem("hasCompletedSurvey", "true");
    setShowSurvey(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setShowNotifications(false);
    navigate(notif.link);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const faqData = [
    {
      question: "TrendPilot은 어떤 서비스인가요?",
      answer: "TrendPilot은 예비·초기 창업자를 위한 정보 탐색 및 사업계획서 작성 지원 플랫폼입니다. 뉴스 데이터와 창업지원공고 기반 키워드 분석을 통해 맞춤형 사업계획서 작성을 도와드립니다."
    },
    {
      question: "사업계획서는 어떻게 작성하나요?",
      answer: "창업 성향 진단을 완료하시면 AI가 자동으로 사업계획서 초안을 생성해드립니다. 이후 각 섹션을 클릭하여 수정하실 수 있으며, 저장 버튼을 눌러 임시 저장하거나 다운로드하실 수 있습니다."
    },
    {
      question: "공고 매칭률은 어떻게 계산되나요?",
      answer: "창업 성향 진단 결과(가용 자본, 기술 역량, 지역, 관심 분야 등)를 바탕으로 각 정부 지원사업의 지원 조건과 비교하여 매칭률을 산출합니다."
    },
    {
      question: "키워드 트렌드는 얼마나 자주 업데이트되나요?",
      answer: "키워드 트렌드는 매일 새벽 자동으로 업데이트됩니다. 최신 뉴스 데이터를 분석하여 실시간 창업 트렌드를 반영합니다."
    },
    {
      question: "저장한 데이터는 어디서 확인할 수 있나요?",
      answer: "마이페이지에서 저장한 키워드, 기사, 공고, 사업계획서 임시 저장본, 아이디어 메모 등을 모두 확인하실 수 있습니다."
    },
  ];

  if (!isLoggedIn) return null;

  const navItems = [
    { path: "/", label: "키워드맵" },
    { path: "/match-posting", label: "추천 맞춤 공고" },
    { path: "/business-plan", label: "사업계획서 작성" },
    { path: "/community", label: "커뮤니티" },
    { path: "/mypage", label: "마이페이지" },
  ];

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

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showSurvey && <StartupSurvey onComplete={handleSurveyComplete} />}

      <div className="min-h-screen bg-[#F5FFFE]">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="/logo.png"
                alt="TrendPilot"
                className="h-9 w-auto"
              />
            </Link>

            <div className="flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                    isActive(item.path)
                      ? "bg-[#E0F7F3] text-[#00C9A7] font-medium"
                      : "text-gray-600 hover:text-[#00C9A7] hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    showNotifications
                      ? "bg-[#E0F7F3] text-[#00C9A7]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#00C9A7]"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#00C9A7]" />
                        <span className="font-semibold text-gray-900" style={{ fontSize: "15px" }}>
                          알림
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full font-medium">
                            {unreadCount}개 안읽음
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00C9A7] transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          모두 읽음
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-gray-400" style={{ fontSize: "14px" }}>
                          새로운 알림이 없습니다.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const Icon = notificationIcon[notif.type];
                          const colors = notificationColor[notif.type];
                          return (
                            <button
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                                !notif.isRead ? "bg-[#F0FDFB]" : ""
                              }`}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: colors.bg }}
                              >
                                <Icon className="w-4 h-4" style={{ color: colors.icon }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`leading-snug ${
                                      notif.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                                    }`}
                                    style={{ fontSize: "13px" }}
                                  >
                                    {notif.title}
                                  </p>
                                  {!notif.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-[#00C9A7] flex-shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-gray-500 mt-0.5 leading-snug" style={{ fontSize: "12px" }}>
                                  {notif.body}
                                </p>
                                <p className="text-gray-400 mt-1" style={{ fontSize: "11px" }}>
                                  {notif.timestamp}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-[1440px] mx-auto">
          <Outlet />
        </main>

        {/* 플로팅 버튼 (튜토리얼, 고객센터, 챗봇) */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {/* 튜토리얼 다시보기 */}
          <button
            onClick={() => {
              localStorage.removeItem("hasSeenOnboarding");
              localStorage.removeItem("hasCompletedSurvey");
              window.location.reload();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
            title="튜토리얼 다시보기"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="font-semibold text-sm">튜토리얼</span>
          </button>

          {/* 고객센터 */}
          {showCustomerService ? (
            <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#6366F1] to-[#4F46E5]">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  고객센터
                </h3>
                <button
                  onClick={() => {
                    setShowCustomerService(false);
                    setSelectedFAQ(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  {/* 문의하기 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">문의하기</h4>
                    <div className="space-y-2">
                      <a
                        href="mailto:support@TrendPilot.com"
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#6366F1] hover:bg-[#EEF2FF] transition-all"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                          <Mail className="w-4 h-4 text-[#6366F1]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">이메일 문의</div>
                          <div className="text-xs text-gray-500">support@TrendPilot.com</div>
                        </div>
                      </a>
                      <a
                        href="tel:1588-0000"
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#6366F1] hover:bg-[#EEF2FF] transition-all"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#6366F1]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">전화 상담</div>
                          <div className="text-xs text-gray-500">1588-0000 (평일 09:00-18:00)</div>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">자주 묻는 질문</h4>
                    <div className="space-y-2">
                      {faqData.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setSelectedFAQ(selectedFAQ === index ? null : index)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span className="text-sm font-medium text-gray-900 pr-2">
                              {faq.question}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                                selectedFAQ === index ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          {selectedFAQ === index && (
                            <div className="px-3 pb-3">
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerService(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">고객센터</span>
            </button>
          )}

          {/* 챗봇 */}
          {showChatbot ? (
            <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#00C9A7] to-[#00A88E]">
                <h3 className="text-white font-semibold">AI 어시스턴트</h3>
                <button
                  onClick={() => setShowChatbot(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    안녕하세요! TrendPilot 창업 지원 어시스턴트입니다. 무엇을 도와드릴까요?
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <input
                  type="text"
                  placeholder="메시지를 입력하세요..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-sm"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowChatbot(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">AI 챗봇</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
