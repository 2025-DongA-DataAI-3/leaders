import { useState, useEffect, ReactNode } from 'react';
import { Calendar as CalendarIcon, List, Bookmark, Clock, X, ChevronLeft, ChevronRight, Banknote, GraduationCap, Building2, HelpCircle } from 'lucide-react';
import StartupSurvey from "./StartupSurvey";

type SupportType = '창업자금 지원' | '창업교육지원' | '창업공간지원' | '기타';

interface Program {
  id: string;
  title: string;
  agency: string;
  startDate: string;
  deadline: string;
  dday: number | null;
  supportType: SupportType;
  region: string;
  url: string;
  matchScore: number;
}

type ViewMode = 'list' | 'calendar';

const SUPPORT_TYPE_CONFIG: Record<SupportType, { color: string; bg: string; lightBg: string; icon: ReactNode }> = {
  '창업자금 지원': { color: '#00C9A7', bg: 'bg-[#00C9A7]', lightBg: '#E0F7F3', icon: <Banknote className="w-4 h-4" /> },
  '창업교육지원':  { color: '#8B5CF6', bg: 'bg-[#8B5CF6]', lightBg: '#EDE9FE', icon: <GraduationCap className="w-4 h-4" /> },
  '창업공간지원':  { color: '#F59E0B', bg: 'bg-[#F59E0B]', lightBg: '#FEF3C7', icon: <Building2 className="w-4 h-4" /> },
  '기타':        { color: '#3B82F6', bg: 'bg-[#3B82F6]', lightBg: '#DBEAFE', icon: <HelpCircle className="w-4 h-4" /> },
};

const MONTH_NAMES   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_OF_WEEK  = ['일', '월', '화', '수', '목', '금', '토'];
const STORAGE_KEY   = 'savedPrograms';

// ── 유틸 함수 ──

function mapSupportType(field: string): SupportType {
  if (field.includes('사업화')) return '창업자금 지원';
  if (field.includes('교육') || field.includes('멘토링') || field.includes('컨설팅')) return '창업교육지원';
  if (field.includes('공간') || field.includes('시설') || field.includes('보육')) return '창업공간지원';
  return '기타';
}

function calcDday(endDate: string | null): number | null {
  if (!endDate || endDate.startsWith('0000') || endDate.startsWith('1899')) return null;

  const datePart = endDate.slice(0, 10); // 'YYYY-MM-DD'
  const [y, m, d] = datePart.split('-').map(Number);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(y, m - 1, d);
  end.setHours(0, 0, 0, 0);

  return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr || dateStr.startsWith('0000') || dateStr.startsWith('1899')) return '미정';
  return dateStr.slice(0, 10);
}

// ── 로컬 컴포넌트 ──

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  children: ReactNode;
}
function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center";
  const styles = {
    primary:   "bg-[#00C9A7] hover:bg-[#00b394] text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    outline:   "border border-gray-200 hover:bg-gray-50 text-gray-700",
    success:   "bg-teal-50/50 border border-[#00C9A7] text-[#00C9A7]",
    danger:    "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function IconButton({ icon, variant = 'secondary', onClick }: { icon: ReactNode; variant?: 'secondary' | 'danger'; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`p-1.5 rounded-xl transition-colors ${variant === 'danger' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
      {icon}
    </button>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/20 focus:border-[#00C9A7] transition-all ${className}`} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}
function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select className={`w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/20 focus:border-[#00C9A7] transition-all ${className}`} {...props}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default', className = '' }: { children: ReactNode; variant?: 'default' | 'success' | 'danger'; className?: string }) {
  const styles = {
    default: "px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500",
    success: "px-2 py-0.5 rounded-lg font-semibold text-xs bg-teal-50 text-[#00C9A7]",
    danger:  "px-2 py-0.5 rounded-lg font-semibold text-xs bg-red-50 text-red-600",
  };
  return <span className={`${styles[variant]} ${className}`}>{children}</span>;
}

function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-t border-gray-200/60 w-full ${className}`} />;
}

function Dialog({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <IconButton icon={<X className="w-4 h-4" />} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Tabs({ activeTab, onChange, tabs }: { activeTab: string; onChange: (id: string) => void; tabs: { id: string; label: string; icon?: ReactNode }[] }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/40">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
           <button key={tab.id} onClick={() => onChange(tab.id)}
            data-tutorial={tab.id === 'calendar' ? 'calendar-view-btn' : undefined}  // ← 이 줄 추가
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white shadow-sm text-[#00C9A7]' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.icon}{tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  const PAGE_GROUP_SIZE = 10;
  const currentGroup = Math.ceil(currentPage / PAGE_GROUP_SIZE);
  const startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(currentGroup * PAGE_GROUP_SIZE, totalPages);
  const totalGroups = Math.ceil(totalPages / PAGE_GROUP_SIZE);

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* 이전 그룹 */}
      <IconButton
        icon={<ChevronLeft className="w-4 h-4" />}
        onClick={() => onPageChange(Math.max(1, startPage - 1))}
      />

      {/* 현재 그룹의 페이지 번호들 */}
      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${p === currentPage ? 'bg-[#00C9A7] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {p}
        </button>
      ))}

      {/* 다음 그룹 */}
      <IconButton
        icon={<ChevronRight className="w-4 h-4" />}
        onClick={() => onPageChange(Math.min(totalPages, endPage + 1))}
      />
    </div>
  );
}

// ── 메인 컴포넌트 ──

export default function MatchPosting() {
  const [viewMode, setViewMode]                 = useState<ViewMode>('list');
  const [programs, setPrograms]                 = useState<Program[]>([]);
  const [savedPrograms, setSavedPrograms]       = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [searchKeyword, setSearchKeyword]       = useState('');
  const [activeTab, setActiveTab]               = useState<'전체' | SupportType>('전체');
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const [showMyPosts, setShowMyPosts]           = useState(false);
  const [inputKeyword, setInputKeyword]   = useState('');
  const [showSurvey, setShowSurvey] = useState(false);

  // 스크랩 목록 로드 (localStorage 대신 DB)
useEffect(() => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  fetch(`/api/announcements/bookmarks?user_id=${user_id}`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setSavedPrograms(data.map(String));
      }
    })
    .catch((err) => console.error('스크랩 목록 조회 실패:', err));
}, []);
useEffect(() => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;
  fetch(`/api/announcements/alert-setting?user_id=${user_id}`)
    .then((res) => res.json())
    .then((data) => setIsNotificationOn(!!data.enabled))
    .catch((err) => console.error('알림설정 조회 실패:', err));
}, []);

  useEffect(() => {
    const user_id = localStorage.getItem('user_id');
    const endpoint = showMyPosts && user_id
     ? `/api/announcements/recommend?user_id=${user_id}`
     : '/api/announcements';

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setPrograms([]);
          return;
        }
        const mapped: Program[] = data.map((row: any) => ({
          id: String(row.announcement_id),
          title: row.title,
          agency: row.organization,
          startDate: formatDate(row.start_date),
          deadline: formatDate(row.end_date),
          dday: calcDday(row.end_date),
          supportType: mapSupportType(row.support_field),
          region: row.region,
          url: row.detail_url,
          matchScore: row.match_score ?? 0,
        }));
        setPrograms(mapped);
      })
      .catch((err) => {
        console.error('공고 조회 실패:', err);
        setPrograms([]);
      });
  }, [showMyPosts]);

  const toggleSave = async (id: string) => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('로그인이 필요합니다.');
    return;
  }

  const isSaved = savedPrograms.includes(id);
  const newSaved = isSaved
    ? savedPrograms.filter((p) => p !== id)
    : [...savedPrograms, id];
  setSavedPrograms(newSaved);

  try {
     if (isSaved) {
      await fetch('/api/announcements/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, announcement_id: id }),
      });
    } else {
      await fetch('/api/announcements/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, announcement_id: id }),
      });
      // 스크랩 직후 알림 즉시 생성 트리거 (벨 아이콘은 30초 폴링으로 반영)
      fetch(`/api/announcements/notifications?user_id=${user_id}`).catch(() => {});
    }
  } catch (err) {
    console.error('스크랩 처리 실패:', err);
    // 실패 시 롤백
    setSavedPrograms(savedPrograms);
  }
};

  const baseFilteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.agency.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesRecommend = !showMyPosts || p.matchScore > 1;
    return matchesSearch && matchesRecommend;
  });

  const filteredPrograms = baseFilteredPrograms.filter((p) =>
    activeTab === '전체' || p.supportType === activeTab
  );

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    const rank = (p: Program) => {
      if (p.dday !== null && p.dday >= 0) return 0; // 마감 안됨 (D-day 있음)
      if (p.dday === null) return 1;                // 상시
      return 2;                                      // 마감
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;

    if (showMyPosts && a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    if (ra === 0) return (a.dday as number) - (b.dday as number);
   return 0;
  });

  const ITEMS_PER_PAGE    = 5;
  const totalPages        = Math.ceil(sortedPrograms.length / ITEMS_PER_PAGE) || 1;
  const paginatedPrograms = sortedPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startDayOfWeek = new Date(2026, selectedMonth - 1, 1).getDay();

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const supportTabs: Array<'전체' | SupportType> = ['전체', '창업자금 지원', '창업교육지원', '창업공간지원', '기타'];
  const tabIcons: Record<string, ReactNode> = {
    '전체':         <List className="w-4 h-4" />,
    '창업자금 지원': <Banknote className="w-4 h-4" />,
    '창업교육지원':  <GraduationCap className="w-4 h-4" />,
    '창업공간지원':  <Building2 className="w-4 h-4" />,
    '기타':          <HelpCircle className="w-4 h-4" />,
  };

   
  const handleSearch = () => {
    setSearchKeyword(inputKeyword);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-[#F5FFFE] text-gray-900">
      <div className="max-w-8xl mx-auto">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">추천 맞춤 공고</h1>
          <p className="text-gray-900">당신의 창업 성향에 맞는 지원사업을 확인하세요</p>
        </div>
        {/* 검색/필터 카드 */}
        <Card className="mb-6 p-5">
          <div className="flex flex-col sm:flex-row gap-3">

            {/* 왼쪽 절반: 검색 */}
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="지원사업명 또는 주관기관 검색..."
                  value={inputKeyword}                          
                  onChange={(e) => setInputKeyword(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}  
                />
              </div>
              <Button variant="primary" onClick={handleSearch} data-tutorial="announcement-search-btn">
                검색
              </Button>
            </div>

            {/* 오른쪽 절반: 내 맞춤 공고 보기 버튼 */}
            <div className="flex-1 flex justify-end items-center gap-2">
               {/* ✅ 내 데이터 입력 버튼 추가 */}
              <Button variant="primary" onClick={() => setShowSurvey(true)}>
                  ✏️ 내 데이터 입력
              </Button>
              <button
                data-tutorial="my-match-btn"
                onClick={() => setShowMyPosts(prev => !prev)}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all"
                style={{
                  background: '#E0F7F3',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                ✦ 내 맞춤 공고 보기

                {/* 슬라이드 토글 — 내부만 색 변경 */}
                <div
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '999px',
                    background: showMyPosts
                      ? 'linear-gradient(135deg, #00C9A7, #00b394)'
                      : 'linear-gradient(135deg, #d1d5db, #e5e7eb)',
                    boxShadow: showMyPosts
                      ? 'inset 2px 2px 4px rgba(0,0,0,0.15)'
                      : 'inset 2px 2px 4px rgba(0,0,0,0.12), inset -1px -1px 3px rgba(255,255,255,0.6)',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 0.25s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: showMyPosts ? '18px' : '3px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.2), -1px -1px 3px rgba(255,255,255,0.8)',
                      transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </button>
            </div>

          </div>
        </Card>

        {/* 뷰 모드 탭 + 카운터 */}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <Tabs
            activeTab={viewMode}
            onChange={(tab) => setViewMode(tab as ViewMode)}
            tabs={[
              { id: 'list',     label: 'D-Day 목록', icon: <List className="w-4 h-4" /> },
              { id: 'calendar', label: '캘린더 뷰',   icon: <CalendarIcon className="w-4 h-4" /> },
              
            ]}
          />
          <div className="text-sm font-medium text-gray-500 self-end sm:self-auto">
            조건에 맞는 사업: <span className="text-[#00C9A7] font-semibold">{filteredPrograms.length}개</span>
            <span className="mx-2 text-gray-300">|</span>
            스크랩: <span className="text-[#00C9A7] font-semibold">{savedPrograms.length}개</span>
          </div>
        </div>

        {/* 마감 알림 버튼 - 캘린더 뷰일 때만 */}
        {viewMode === 'calendar' && (
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => {
            const user_id = localStorage.getItem('user_id');
            const newVal = !isNotificationOn;
            setIsNotificationOn(newVal);
            if (user_id) {
              fetch('/api/announcements/alert-setting', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, enabled: newVal }),
              });
            }
          }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
              style={{
                background:  isNotificationOn ? '#00C9A7' : 'white',
                borderColor: isNotificationOn ? '#00C9A7' : 'rgba(0,0,0,0.12)',
                color:       isNotificationOn ? '#374151' : '#555',
                fontSize:    '13px',
                fontWeight:  isNotificationOn ? 600 : 400,
              }}
            >
              🔔 마감 알림
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background: isNotificationOn ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color:      isNotificationOn ? 'white' : '#888',
                }}
              >
                {isNotificationOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        )}

        {/* 지원 유형 탭 (목록 뷰일 때만) */}
        {viewMode === 'list' && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {supportTabs.map((tab) => {
              const isActive = activeTab === tab;
              const config   = tab !== '전체' ? SUPPORT_TYPE_CONFIG[tab] : null;
              const color    = config?.color ?? '#00C9A7';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
                  style={{
                    background:  isActive ? color : 'white',
                    borderColor: isActive ? color : 'rgba(0,0,0,0.12)',
                    color:       isActive ? 'white' : '#555',
                    fontSize:    '13px',
                    fontWeight:  isActive ? 600 : 400,
                  }}
                >
                  {tabIcons[tab]}
                  {tab}
                  <span
                    className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                      color:      isActive ? 'white' : '#888',
                    }}
                  >
                    {tab === '전체' ? baseFilteredPrograms.length : baseFilteredPrograms.filter((p) => p.supportType === tab).length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 목록 뷰 */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((program) => {
                const isSaved    = savedPrograms.includes(program.id);
                const isExpired = program.dday !== null && program.dday < 0;
                const typeConfig = isExpired
                  ? { color: '#9CA3AF', bg: 'bg-[#9CA3AF]', lightBg: '#F3F4F6', icon: SUPPORT_TYPE_CONFIG[program.supportType].icon }
                  : SUPPORT_TYPE_CONFIG[program.supportType];
                return (
                  <div key={program.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      <div className="w-1 flex-shrink-0" style={{ background: typeConfig.color }} />
                      <div className="flex-1 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ background: typeConfig.lightBg, color: typeConfig.color }}>
                                {typeConfig.icon}{program.supportType}
                              </span>
                              <Badge variant={isExpired ? 'default' : (program.dday !== null && program.dday <= 20 ? 'danger' : 'success')}
                                className={isExpired ? 'bg-gray-100 text-gray-500' : ''}>
                                {program.dday !== null ? (isExpired ? '마감' : program.dday === 0 ? 'D-Day' : `D-${program.dday}`) : '상시'}
                              </Badge>
                              {program.region && (
                                <Badge className="bg-gray-100 text-gray-600">{program.region}</Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{program.title}</h3>
                            <div className="flex items-center gap-3 flex-wrap text-gray-400" style={{ fontSize: '13px' }}>
                              <span className="font-medium text-gray-600">{program.agency}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {program.startDate} ~ {program.deadline}
                              </span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 min-w-[120px]">
                            <Button variant={isSaved ? 'success' : 'outline'} onClick={() => toggleSave(program.id)} className="w-full justify-center gap-1.5">
                              <Bookmark className="w-4 h-4" fill={isSaved ? typeConfig.color : 'none'} stroke={isSaved ? typeConfig.color : 'currentColor'} />
                              스크랩
                            </Button>
                            <a href={program.url} target="_blank" rel="noopener noreferrer" className="w-full">
                              <button 
                                data-tutorial="apply-btn"
                                className="w-full px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                                style={{ background: typeConfig.color }}>
                                지원하기
                              </button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400 text-sm">검색 결과가 없습니다.</div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' && (
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">2026년</h2>
              <div className="w-32">
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  options={MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-500 mb-2">
              {DAYS_OF_WEEK.map((day) => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: DAYS_IN_MONTH[selectedMonth - 1] }, (_, i) => i + 1).map((day) => {
  const dateStr     = `2026-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayPrograms = filteredPrograms.filter((p) => p.deadline === dateStr && savedPrograms.includes(p.id));
  return (
    <div key={day} className="aspect-square p-2 rounded-xl border border-gray-100 flex flex-col hover:bg-gray-50 transition-colors overflow-hidden">
      <span className="text-sm font-medium text-gray-700 mb-1">{day}</span>
      {dayPrograms.length > 0 && (
        <div className="space-y-1 overflow-hidden">
          {dayPrograms.map((program) => {
            const typeConfig = SUPPORT_TYPE_CONFIG[program.supportType];
            return (
              <div key={program.id} className="text-sn px-1.5 py-1 rounded text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ background: typeConfig.color }} title={program.title}>
                {program.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
})}
            </div>
            <Divider className="my-6" />
            <h3 className="text-base font-semibold text-gray-900 mb-4">스크랩한 지원사업 명단</h3>
            {savedPrograms.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {programs.filter((p) => savedPrograms.includes(p.id)).map((program) => {
                  const typeConfig = SUPPORT_TYPE_CONFIG[program.supportType];
                  return (
                    <div key={program.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeConfig.color }} />
                        <div className="truncate">
                          <div className="font-medium text-sm text-gray-900 truncate">{program.title}</div>
                          <div className="text-xs text-gray-500">
                             마감: {program.deadline}{program.dday !== null ? (program.dday < 0 ? ' (마감)' : program.dday === 0 ? ' (D-Day)' : ` (D-${program.dday})`) : ' (상시)'}
                          </div>
                        </div>
                      </div>
                      <IconButton icon={<X className="w-3 h-3" />} variant="danger" onClick={() => toggleSave(program.id)} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-400">스크랩한 내역이 비어 있습니다.</div>
            )}
          </Card>
        )}
      </div>
      {/* ✅ 설문 모달 */}
      {showSurvey && (
        <StartupSurvey onComplete={() => setShowSurvey(false)} />
      )}
    </div>
  );
}