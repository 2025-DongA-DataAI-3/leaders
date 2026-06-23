import { useState, useEffect } from "react";
import { User, Heart, Bookmark, Settings, Bell, LogOut, UserX, HelpCircle, X, TrendingUp, FileText, Clock, Save, Trash2, ChevronDown, ThumbsUp, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { initialPosts } from "../../app/data/posts";

interface SavedPlan {
  plan_id: string;
  title: string;
  summary: string;
  template_name: string;
  content: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const [savedKeywords, setSavedKeywords] = useState<string[]>([]);

const savedArticles = [
  {
    title: "국내 SaaS 시장 3년간 2배 성장 전망",
    source: "전자신문",
    date: "2026.05.10",
  },
  {
    title: "스마트팩토리 정부 지원 사업 확대",
    source: "한국경제",
    date: "2026.05.09",
  },
  {
    title: "모바일 커머스 시장 10조원 돌파",
    source: "IT조선",
    date: "2026.05.07",
  },
];

// 정부지원 공고 데이터
const allPrograms = [
  {
    id: '1',
    title: '청년창업사관학교 12기',
    agency: '중소벤처기업부',
    deadline: '2026-05-25',
    dday: 18,
    amount: '최대 1억원',
    category: 'IT/소프트웨어',
    url: 'https://www.k-startup.go.kr',
  },
  {
    id: '2',
    title: '예비창업패키지',
    agency: '창업진흥원',
    deadline: '2026-06-10',
    dday: 34,
    amount: '최대 1억원',
    category: '제조/생산',
    url: 'https://www.k-startup.go.kr',
  },
  {
    id: '3',
    title: '초기창업패키지',
    agency: '창업진흥원',
    deadline: '2026-06-20',
    dday: 44,
    amount: '최대 1억원',
    category: '유통/서비스',
    url: 'https://www.k-startup.go.kr',
  },
  {
    id: '4',
    title: '재도전 성공패키지',
    agency: '중소벤처기업부',
    deadline: '2026-07-01',
    dday: 55,
    amount: '최대 5천만원',
    category: '바이오/헬스케어',
    url: 'https://www.k-startup.go.kr',
  },
  {
    id: '5',
    title: 'K-스타트업 센터 입주',
    agency: '창업진흥원',
    deadline: '2026-07-15',
    dday: 69,
    amount: '공간 지원',
    category: '친환경/에너지',
    url: 'https://www.k-startup.go.kr',
  },
];

// ================= [로컬 컴포넌트 시작: MyPageButton] =================
interface MyPageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const MyPageButton = ({ children, className = "", ...props }: MyPageButtonProps) => {
  return (
    <button
      className={`transition-colors font-medium focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
MyPageButton.displayName = "MyPageButton";
// ================= [로컬 컴포넌트 끝: MyPageButton] =================


// ================= [로컬 컴포넌트 시작: MyPageDialog] =================
interface MyPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
}

const MyPageDialog = ({
  isOpen,
  onClose,
  title,
  description,
  cancelText = "취소",
  confirmText = "확인",
  onConfirm,
}: MyPageDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <h3 className="mb-4 text-gray-900 text-xl font-bold">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
          {description}
        </p>
        <div className="flex gap-3">
          <MyPageButton
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            {cancelText}
          </MyPageButton>
          <MyPageButton
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {confirmText}
          </MyPageButton>
        </div>
      </div>
    </div>
  );
};
MyPageDialog.displayName = "MyPageDialog";
// ================= [로컬 컴포넌트 끝: MyPageDialog] =================


export default function MyPage() {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const userName = localStorage.getItem("userName") || "사용자";
  const [savedProgramIds, setSavedProgramIds] = useState<string[]>([]);
  const [savedBusinessPlans, setSavedBusinessPlans] = useState<SavedPlan[]>([]);
  const [savedCommunityPostIds, setSavedCommunityPostIds] = useState<string[]>([]);

  // 아코디언 상태 관리
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    businessPlans: false,
    keywords: false,
    saved: false,
    savedPrograms: false,
    savedArticles: false,
    savedPosts: false,
    settings: false,
    accountSettings: false,
    notifications: false,
    accountManagement: false,
  });

  useEffect(() => {
  const user_id = localStorage.getItem('user_id');

  const saved = localStorage.getItem('savedPrograms');
  if (saved) {
    try { setSavedProgramIds(JSON.parse(saved)); } catch { setSavedProgramIds([]); }
  }

  const savedCommunity = localStorage.getItem('savedCommunityPosts');
  if (savedCommunity) {
    try { setSavedCommunityPostIds(JSON.parse(savedCommunity)); } catch { setSavedCommunityPostIds([]); }
  }

  if (user_id) {
    // 사업계획서
    fetch(`http://localhost:5000/api/business-plan/list/${user_id}`)
      .then(res => res.json())
      .then(data => setSavedBusinessPlans(Array.isArray(data) ? data : []))
      .catch(() => setSavedBusinessPlans([]));

    // 관심 키워드 ← 추가
    fetch(`http://localhost:5000/api/keywords/${user_id}`)
      .then(res => res.json())
      .then(data => setSavedKeywords(Array.isArray(data) ? data.map((d: any) => d.keyword_id) : []))
      .catch(() => setSavedKeywords([]));
  }
}, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const savedPrograms = allPrograms.filter(program => savedProgramIds.includes(program.id));
  const savedCommunityPosts = initialPosts.filter(post => savedCommunityPostIds.includes(post.id));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IT/소프트웨어': return '#8B5CF6';
      case '제조/생산': return '#3B82F6';
      case '유통/서비스': return '#F59E0B';
      case '바이오/헬스케어': return '#10B981';
      case '친환경/에너지': return '#22C55E';
      default: return '#00C9A7';
    }
  };

  const handleUnsaveProgram = (programId: string) => {
    const newSaved = savedProgramIds.filter(id => id !== programId);
    setSavedProgramIds(newSaved);
    localStorage.setItem('savedPrograms', JSON.stringify(newSaved));
  };

  const handleDeleteBusinessPlan = async (planId: string) => {
  const user_id = localStorage.getItem('user_id');
  try {
    await fetch(`http://localhost:5000/api/business-plan/${planId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
    setSavedBusinessPlans(prev => prev.filter(p => p.plan_id !== planId));
  } catch (err) {
    console.error('삭제 에러:', err);
    alert('삭제 중 오류가 발생했습니다.');
  }
};

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loginProvider");
    localStorage.removeItem("userName");
    localStorage.removeItem("hasSeenOnboarding");
    navigate("/login");
  };

const handleDeleteAccount = async () => {
  try {
    const user_id = localStorage.getItem("user_id");

    const res = await fetch('http://localhost:5000/api/auth/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.clear();
      navigate("/login");
      setShowDeleteConfirm(false);
    } else {
      alert('회원탈퇴 실패: ' + data.message);
    }
  } catch (err) {
    console.error('회원탈퇴 실패:', err);
    alert('회원탈퇴 중 오류가 발생했습니다.');
  }
};
const handleDeleteKeyword = async (keyword: string) => {
  const user_id = localStorage.getItem('user_id');
  try {
    await fetch('http://localhost:5000/api/keywords/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, keyword }),
    });
    setSavedKeywords(prev => prev.filter(k => k !== keyword));
  } catch (err) {
    console.error('키워드 삭제 에러:', err);
  }
};

  const handleResetOnboarding = () => {
    localStorage.removeItem("hasSeenOnboarding");
    localStorage.removeItem("hasCompletedSurvey");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F5FFFE] py-8 px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 text-gray-900 text-3xl font-bold">마이페이지</h1>
          <p className="text-gray-600">
            내 정보와 저장한 콘텐츠를 관리하세요.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#00C9A7] flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="mb-1 text-gray-900 text-2xl font-bold">{userName}</h2>
              <p className="text-gray-600">{userName.toLowerCase().replace(" ", "")}@example.com</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#E0F7F3] rounded-lg p-4 text-center">
              <div className="text-3xl text-[#00C9A7] mb-1 font-bold">{savedBusinessPlans.length}</div>
              <div className="text-sm text-gray-600">임시 저장</div>
            </div>
            <div className="bg-[#E0F7F3] rounded-lg p-4 text-center">
              <div className="text-3xl text-[#00C9A7] mb-1 font-bold">{savedKeywords.length}</div>
              <div className="text-sm text-gray-600">관심 키워드</div>
            </div>
            <div className="bg-[#E0F7F3] rounded-lg p-4 text-center">
              <div className="text-3xl text-[#00C9A7] mb-1 font-bold">{savedPrograms.length + savedArticles.length + savedCommunityPosts.length}</div>
              <div className="text-sm text-gray-600">저장한 콘텐츠</div>
            </div>
          </div>
        </div>

        {/* 1. 임시 저장한 사업계획서 */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <MyPageButton
            onClick={() => toggleSection('businessPlans')}
            className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
          > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5 text-[#00C9A7]" />
              <h2 className="text-gray-900 text-xl font-bold">임시 저장한 사업계획서</h2>
              <span className="ml-2 px-2 py-0.5 bg-[#E0F7F3] text-[#00C9A7] rounded-full text-sm font-semibold">{savedBusinessPlans.length}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.businessPlans ? 'rotate-180' : ''
              }`}
            />
          </MyPageButton>
          {expandedSections.businessPlans && (
            <div className="px-8 pb-8">
              <div className="flex justify-end mb-4">
                <MyPageButton
                  onClick={() => navigate('/business-plan')}
                  className="px-4 py-2 text-[#00C9A7] hover:bg-[#E0F7F3] rounded-lg text-sm"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  새로 작성
                </MyPageButton>
              </div>
              {savedBusinessPlans.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Save className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">임시 저장한 사업계획서가 없습니다.</p>
                  <MyPageButton
                    onClick={() => navigate('/business-plan')}
                    className="mt-4 px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] text-sm"
                  > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                    사업계획서 작성하기
                  </MyPageButton>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedBusinessPlans
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map((savedPlan) => (
                      <div
                        key={savedPlan.plan_id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-[#00C9A7] hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => navigate(`/business-plan?saved=${savedPlan.plan_id}`)}
                          >
                            <h4 className="mb-2 text-gray-900 font-semibold">{savedPlan.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(new Date(savedPlan.updated_at).getTime())}
                              </span>
                            </div>
                            {savedPlan.summary && (
                              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {savedPlan.summary}
                              </p>
                            )}
                          </div>
                          <MyPageButton
                            onClick={() => handleDeleteBusinessPlan(savedPlan.plan_id)}
                            className="p-2 ml-3 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="삭제"
                          > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                            <Trash2 className="w-4 h-4" />
                          </MyPageButton>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. 관심 키워드 */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <MyPageButton
            onClick={() => toggleSection('keywords')}
            className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
          > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#00C9A7]" />
              <h2 className="text-gray-900 text-xl font-bold">관심 키워드</h2>
              <span className="ml-2 px-2 py-0.5 bg-[#E0F7F3] text-[#00C9A7] rounded-full text-sm font-semibold">{savedKeywords.length}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.keywords ? 'rotate-180' : ''
              }`}
            />
          </MyPageButton>
          {expandedSections.keywords && (
  <div className="px-8 pb-8">
    <div className="flex flex-wrap gap-3">
      {savedKeywords.length === 0 ? (
        <p className="text-sm text-gray-400">저장한 관심 키워드가 없습니다.</p>
      ) : (
        savedKeywords.map((keyword, idx) => (
          <div key={idx}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E0F7F3] text-[#00C9A7] rounded-full border border-[#00C9A7]/30 text-sm">
            {keyword}
            <button
              onClick={() => handleDeleteKeyword(keyword)}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))
      )}
    </div>
  </div>
)}
        </div>

        {/* 3. 저장 (2단계 아코디언) */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <MyPageButton
            onClick={() => toggleSection('saved')}
            className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
          > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#00C9A7]" />
              <h2 className="text-gray-900 text-xl font-bold">저장</h2>
              <span className="ml-2 px-2 py-0.5 bg-[#E0F7F3] text-[#00C9A7] rounded-full text-sm font-semibold">
                {savedPrograms.length + savedArticles.length + savedCommunityPosts.length}
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.saved ? 'rotate-180' : ''
              }`}
            />
          </MyPageButton>
          {expandedSections.saved && (
            <div className="px-8 pb-8 space-y-4">
              {/* 저장한 공고 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MyPageButton
                  onClick={() => toggleSection('savedPrograms')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00C9A7]" />
                    <h3 className="text-gray-900 text-sm font-semibold">저장한 공고</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{savedPrograms.length}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSections.savedPrograms ? 'rotate-180' : ''
                    }`}
                  />
                </MyPageButton>
                {expandedSections.savedPrograms && (
                  <div className="p-4 pt-0">
                    {savedPrograms.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">저장한 공고가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedPrograms.map((program) => (
                          <div
                            key={program.id}
                            className="p-3 border border-gray-200 rounded-lg hover:border-[#00C9A7] hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">{program.title}</h4>
                                  <span
                                    className="px-2 py-0.5 rounded text-white text-xs font-semibold"
                                    style={{ background: getCategoryColor(program.category) }}
                                  >
                                    {program.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{program.agency}</span>
                                  <span>•</span>
                                  <span>D-{program.dday}</span>
                                </div>
                              </div>
                              <MyPageButton
                                onClick={() => handleUnsaveProgram(program.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500"
                                title="스크랩 취소"
                              > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                                <Bookmark className="w-3.5 h-3.5" fill="#00C9A7" />
                              </MyPageButton>
                            </div>
                            <a
                              href={program.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-white whitespace-nowrap text-xs inline-block font-medium hover:opacity-90 transition-opacity"
                              style={{ background: '#00C9A7' }}
                            >
                              지원하기
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 저장한 기사 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MyPageButton
                  onClick={() => toggleSection('savedArticles')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00C9A7]" />
                    <h3 className="text-gray-900 text-sm font-semibold">저장한 기사</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{savedArticles.length}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSections.savedArticles ? 'rotate-180' : ''
                    }`}
                  />
                </MyPageButton>
                {expandedSections.savedArticles && (
                  <div className="p-4 pt-0">
                    <div className="space-y-3">
                      {savedArticles.map((article, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-gray-200 rounded-lg hover:border-[#00C9A7] hover:shadow-md transition-all"
                        >
                          <h4 className="mb-1 text-sm font-medium text-gray-900">{article.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{article.source}</span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 저장한 커뮤니티 글 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MyPageButton
                  onClick={() => toggleSection('savedPosts')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#00C9A7]" />
                    <h3 className="text-gray-900 text-sm font-semibold">저장한 커뮤니티 글</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{savedCommunityPosts.length}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSections.savedPosts ? 'rotate-180' : ''
                    }`}
                  />
                </MyPageButton>
                {expandedSections.savedPosts && (
                  <div className="p-4 pt-0">
                    {savedCommunityPosts.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">저장한 커뮤니티 글이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedCommunityPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => navigate(`/community-post/${post.id}`)}
                            className="p-3 border border-gray-200 rounded-lg hover:border-[#00C9A7] hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#E0F7F3', color: '#00C9A7' }}>
                                {post.category}
                              </span>
                            </div>
                            <h4 className="mb-1 text-sm font-medium text-gray-900">{post.title}</h4>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{post.content}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {post.commentList.length}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. 설정 (2단계 아코디언) */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <MyPageButton
            onClick={() => toggleSection('settings')}
            className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
          > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00C9A7]" />
              <h2 className="text-gray-900 text-xl font-bold">설정</h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.settings ? 'rotate-180' : ''
              }`}
            />
          </MyPageButton>
          {expandedSections.settings && (
            <div className="px-8 pb-8 space-y-4">
              {/* 알림 설정 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MyPageButton
                  onClick={() => toggleSection('notifications')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#00C9A7]" />
                    <h3 className="text-gray-900 text-sm font-semibold">알림 설정</h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSections.notifications ? 'rotate-180' : ''
                    }`}
                  />
                </MyPageButton>
                {expandedSections.notifications && (
                  <div className="p-4 pt-0">
                    <p className="text-xs text-gray-500 mb-3">알림을 받을 항목을 개별로 설정할 수 있습니다.</p>
                    <div className="space-y-2">
                      {[
                        {
                          icon: TrendingUp,
                          iconBg: "#EDE9FE",
                          iconColor: "#7C3AED",
                          label: "키워드 트렌드 급등 알림",
                          desc: "관심 키워드가 트렌드 상위권 진입 시 알림",
                          key: "notif_keyword",
                          defaultOn: true,
                        },
                        {
                          icon: FileText,
                          iconBg: "#E0F7F3",
                          iconColor: "#00C9A7",
                          label: "새 지원 공고 등록 알림",
                          desc: "관심 분야에 새 공고가 올라오면 알림",
                          key: "notif_announcement",
                          defaultOn: true,
                        },
                        {
                          icon: Clock,
                          iconBg: "#FEE2E2",
                          iconColor: "#DC2626",
                          label: "마감 임박 공고 알림",
                          desc: "스크랩한 공고 마감 D-3, D-1일에 알림",
                          key: "notif_deadline",
                          defaultOn: true,
                        },
                        {
                          icon: MessageCircle,
                          iconBg: "#FEF9C3",
                          iconColor: "#CA8A04",
                          label: "커뮤니티 댓글 알림",
                          desc: "내 게시글에 댓글이 달리면 알림",
                          key: "notif_comment",
                          defaultOn: false,
                        },
                      ].map(({ icon: Icon, iconBg, iconColor, label, desc, key, defaultOn }) => (
                        <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
                            </div>
                            <div>
                              <div className="text-gray-900 text-xs font-medium">{label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" defaultChecked={defaultOn} />
                            <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00C9A7]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 계정 관리 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <MyPageButton
                  onClick={() => toggleSection('accountManagement')}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00C9A7]" />
                    <h3 className="text-gray-900 text-sm font-semibold">계정 관리</h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedSections.accountManagement ? 'rotate-180' : ''
                    }`}
                  />
                </MyPageButton>
                {expandedSections.accountManagement && (
                  <div className="p-4 pt-0 space-y-2">
                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">회원 정보 수정</div>
                          <div className="text-xs text-gray-500">이름, 이메일 변경</div>
                        </div>
                      </div>
                      <MyPageButton
                        onClick={() => navigate('/profile-edit')}
                        className="px-3 py-1.5 text-xs text-[#00C9A7] hover:bg-[#E0F7F3] rounded-lg"
                      > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                        수정
                      </MyPageButton>
                    </div>

                    <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-xs font-medium text-gray-900">온보딩 튜토리얼 다시 보기</div>
                          <div className="text-xs text-gray-500">처음 사용법을 다시 확인</div>
                        </div>
                      </div>
                      <MyPageButton
                        onClick={handleResetOnboarding}
                        className="px-3 py-1.5 text-xs text-[#00C9A7] hover:bg-[#E0F7F3] rounded-lg"
                      > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                        보기
                      </MyPageButton>
                    </div>

                    <MyPageButton
                      onClick={handleLogout}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-[#00C9A7] hover:bg-[#E0F7F3] flex items-center gap-2"
                    > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                      <LogOut className="w-4 h-4 text-gray-600" />
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-900">로그아웃</div>
                        <div className="text-xs text-gray-500">현재 계정에서 로그아웃</div>
                      </div>
                    </MyPageButton>

                    <MyPageButton
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full p-3 border border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 flex items-center gap-2"
                    > {/* ★ 기존 구형 button에서 로컬 컴포넌트 MyPageButton으로 치환됨 */}
                      <UserX className="w-4 h-4 text-red-600" />
                      <div className="text-left">
                        <div className="text-xs font-medium text-red-600">회원 탈퇴</div>
                        <div className="text-xs text-red-500">계정 및 모든 데이터 삭제</div>
                      </div>
                    </MyPageButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ★ 기존 인라인 모달 마크업 구역 전체를 로컬 컴포넌트 MyPageDialog로 치환함 */}
        <MyPageDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="회원 탈퇴 확인"
          description="회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?"
          cancelText="취소"
          confirmText="탈퇴하기"
          onConfirm={handleDeleteAccount}
        />
      </div>
    </div>
  );
}