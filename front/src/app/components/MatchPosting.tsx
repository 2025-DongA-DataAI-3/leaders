import { useState, useEffect, ReactNode } from 'react';
import { Calendar as CalendarIcon, List, Bookmark, Clock, DollarSign, X, ChevronLeft, ChevronRight, Banknote, GraduationCap, Building2 } from 'lucide-react';

type SupportType = '창업자금 지원' | '창업교육지원' | '창업공간지원';

interface Program {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  dday: number;
  amount: string;
  category: string;
  supportType: SupportType;
  summary: string;
  url: string;
}

type ViewMode = 'list' | 'calendar';

const PROGRAMS: Program[] = [
  { id: '1',  title: '청년창업사관학교 12기',     agency: '중소벤처기업부',       deadline: '2026-05-25', dday: 18, amount: '최대 1억원',           category: 'IT/소프트웨어',   supportType: '창업자금 지원', summary: '만 39세 이하 청년 창업자에게 사업화 자금 및 전담 멘토링을 제공하는 집중 육성 프로그램', url: 'https://www.k-startup.go.kr' },
  { id: '2',  title: '예비창업패키지',             agency: '창업진흥원',           deadline: '2026-06-10', dday: 34, amount: '최대 1억원',           category: '제조/생산',       supportType: '창업자금 지원', summary: '창업 전 단계의 예비 창업자를 대상으로 사업화 자금과 창업 교육을 패키지로 지원', url: 'https://www.k-startup.go.kr' },
  { id: '3',  title: '초기창업패키지',             agency: '창업진흥원',           deadline: '2026-06-20', dday: 44, amount: '최대 1억원',           category: '유통/서비스',     supportType: '창업자금 지원', summary: '창업 3년 이내 초기 창업기업에 사업화 자금을 지원하여 빠른 시장 안착을 돕는 프로그램', url: 'https://www.k-startup.go.kr' },
  { id: '4',  title: '재도전 성공패키지',          agency: '중소벤처기업부',       deadline: '2026-07-01', dday: 55, amount: '최대 5천만원',         category: '바이오/헬스케어', supportType: '창업자금 지원', summary: '폐업 후 재창업을 준비 중인 창업자에게 사업화 자금과 심리 회복 상담까지 지원', url: 'https://www.k-startup.go.kr' },
  { id: '5',  title: 'TIPS(민간투자주도형 R&D)',   agency: '중소벤처기업부',       deadline: '2026-07-20', dday: 74, amount: '최대 5억원',           category: 'IT/소프트웨어',   supportType: '창업자금 지원', summary: '엑셀러레이터 투자 연계로 기술 창업기업에 R&D 자금을 최대 5억원 매칭 지원', url: 'https://www.k-startup.go.kr' },
  { id: '6',  title: '창업도약패키지',             agency: '창업진흥원',           deadline: '2026-06-25', dday: 49, amount: '최대 3억원',           category: '친환경/에너지',   supportType: '창업자금 지원', summary: '창업 3~7년의 도약기 기업에 사업 확장을 위한 자금과 전략 컨설팅을 집중 지원', url: 'https://www.k-startup.go.kr' },
  { id: '7',  title: '창업진흥원 온라인 창업스쿨', agency: '창업진흥원',           deadline: '2026-06-15', dday: 39, amount: '무료',                 category: 'IT/소프트웨어',   supportType: '창업교육지원',  summary: '비즈니스 모델 설계부터 투자 유치까지 창업 전 과정을 온라인으로 학습할 수 있는 무료 교육', url: 'https://www.k-startup.go.kr' },
  { id: '8',  title: 'K-Startup 글로벌 창업교육', agency: '중소벤처기업부',       deadline: '2026-06-30', dday: 54, amount: '교육비 전액 지원',     category: '유통/서비스',     supportType: '창업교육지원',  summary: '글로벌 시장 진출을 목표로 하는 창업자를 위한 해외 멘토 매칭 및 현지화 전략 교육', url: 'https://www.k-startup.go.kr' },
  { id: '9',  title: '소상공인 창업학교',          agency: '소상공인시장진흥공단', deadline: '2026-07-10', dday: 64, amount: '무료',                 category: '유통/서비스',     supportType: '창업교육지원',  summary: '소규모 점포 창업을 준비하는 예비 소상공인 대상 경영·세무·마케팅 실무 교육 과정', url: 'https://www.semas.or.kr' },
  { id: '10', title: '여성기업 창업교육 프로그램', agency: '여성기업종합지원센터', deadline: '2026-07-05', dday: 59, amount: '교육비 80% 지원',     category: '유통/서비스',     supportType: '창업교육지원',  summary: '여성 예비창업자 및 초기 창업자를 위한 비즈니스 실무 교육과 네트워킹 프로그램', url: 'https://www.wbiz.or.kr' },
  { id: '11', title: 'K-스타트업 센터 입주',       agency: '창업진흥원',           deadline: '2026-07-15', dday: 69, amount: '공간 무상 지원',       category: '친환경/에너지',   supportType: '창업공간지원',  summary: '창업 초기 기업에 사무 공간과 회의실, 네트워킹 프로그램을 무료로 제공하는 입주 지원', url: 'https://www.k-startup.go.kr' },
  { id: '12', title: '청년창업허브 입주기업 모집', agency: '서울시',               deadline: '2026-06-28', dday: 52, amount: '임대료 최대 80% 감면', category: 'IT/소프트웨어',   supportType: '창업공간지원',  summary: '서울 소재 만 39세 이하 청년 창업자에게 시세 대비 저렴한 오피스 공간과 공용 장비 제공', url: 'https://startup.seoul.go.kr' },
  { id: '13', title: '메이커스페이스 전문랩 입주', agency: '창업진흥원',           deadline: '2026-07-25', dday: 79, amount: '장비 이용 무료',       category: '제조/생산',       supportType: '창업공간지원',  summary: '시제품 제작이 필요한 하드웨어·제조 창업자에게 3D 프린터 등 전문 장비와 작업 공간 제공', url: 'https://www.k-startup.go.kr' },
];

const SUPPORT_TYPE_CONFIG: Record<SupportType, { color: string; bg: string; lightBg: string; icon: ReactNode }> = {
  '창업자금 지원': { color: '#00C9A7', bg: 'bg-[#00C9A7]', lightBg: '#E0F7F3', icon: <Banknote className="w-4 h-4" /> },
  '창업교육지원':  { color: '#8B5CF6', bg: 'bg-[#8B5CF6]', lightBg: '#EDE9FE', icon: <GraduationCap className="w-4 h-4" /> },
  '창업공간지원':  { color: '#F59E0B', bg: 'bg-[#F59E0B]', lightBg: '#FEF3C7', icon: <Building2 className="w-4 h-4" /> },
};

const CATEGORY_MAP: Record<string, { label: string; bg: string }> = {
  'IT/소프트웨어':   { label: 'IT/소프트웨어',   bg: 'bg-[#8B5CF6]' },
  '제조/생산':       { label: '제조/생산',       bg: 'bg-[#3B82F6]' },
  '유통/서비스':     { label: '유통/서비스',     bg: 'bg-[#F59E0B]' },
  '바이오/헬스케어': { label: '바이오/헬스케어', bg: 'bg-[#10B981]' },
  '친환경/에너지':   { label: '친환경/에너지',   bg: 'bg-[#22C55E]' },
};

const MONTH_NAMES   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_OF_WEEK  = ['일', '월', '화', '수', '목', '금', '토'];
const STORAGE_KEY   = 'savedPrograms';

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
    default: "px-2 py-0.5 rounded-lg text-xs font-medium",
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white shadow-sm text-[#00C9A7]' : 'text-gray-600 hover:text-gray-900'}`}>
            {tab.icon}{tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <IconButton icon={<ChevronLeft className="w-4 h-4" />} onClick={() => onPageChange(Math.max(1, currentPage - 1))} />
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${p === currentPage ? 'bg-[#00C9A7] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {p}
        </button>
      ))}
      <IconButton icon={<ChevronRight className="w-4 h-4" />} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} />
    </div>
  );
}

// ── 메인 컴포넌트 ──

export default function MatchPosting() {
  const [viewMode, setViewMode]                 = useState<ViewMode>('list');
  const [savedPrograms, setSavedPrograms]       = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth]       = useState<number>(5);
  const [searchKeyword, setSearchKeyword]       = useState('');
  const [filterCategory, setFilterCategory]     = useState('all');
  const [activeTab, setActiveTab]               = useState<'전체' | SupportType>('전체');
  const [isNotificationOn, setIsNotificationOn] = useState(false); // 초기값 false (꺼진 상태)
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const [showMyPosts, setShowMyPosts] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSavedPrograms(JSON.parse(saved)); } catch { setSavedPrograms([]); }
    }
  }, []);

  const toggleSave = (id: string) => {
    const newSaved = savedPrograms.includes(id)
      ? savedPrograms.filter((p) => p !== id)
      : [...savedPrograms, id];
    setSavedPrograms(newSaved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
  };

  const filteredPrograms = PROGRAMS.filter((p) => {
  const matchesType     = activeTab === '전체' || p.supportType === activeTab;
  const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
  const matchesSearch   =
    p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    p.agency.toLowerCase().includes(searchKeyword.toLowerCase());
  const matchesMy       = !showMyPosts || savedPrograms.includes(p.id); // 추가
  return matchesType && matchesCategory && matchesSearch && matchesMy;
});

  const ITEMS_PER_PAGE    = 5;
  const totalPages        = Math.ceil(filteredPrograms.length / ITEMS_PER_PAGE) || 1;
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startDayOfWeek = new Date(2026, selectedMonth - 1, 1).getDay();

  useEffect(() => { setCurrentPage(1); }, [searchKeyword, filterCategory, activeTab]);

  const supportTabs: Array<'전체' | SupportType> = ['전체', '창업자금 지원', '창업교육지원', '창업공간지원'];
  const tabIcons: Record<string, ReactNode> = {
    '전체':         <List className="w-4 h-4" />,
    '창업자금 지원': <Banknote className="w-4 h-4" />,
    '창업교육지원':  <GraduationCap className="w-4 h-4" />,
    '창업공간지원':  <Building2 className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-[#F5FFFE] text-gray-900">
      <div className="max-w-8xl mx-auto">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">추천 맞춤 공고</h1>
          <p className="text-sm text-gray-500">당신의 창업 성향에 맞는 지원사업을 확인하세요</p>
        </div>
        {/* 검색/필터 카드 */}
        <Card className="mb-6 p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* 왼쪽 절반: 검색 + 카테고리 + 필터가이드 */}
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="지원사업명 또는 주관기관 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  options={[
                    { value: 'all',            label: '전체 카테고리' },
                    { value: 'IT/소프트웨어',   label: 'IT/소프트웨어' },
                    { value: '제조/생산',       label: '제조/생산' },
                    { value: '유통/서비스',     label: '유통/서비스' },
                    { value: '바이오/헬스케어', label: '바이오/헬스케어' },
                    { value: '친환경/에너지',   label: '친환경/에너지' },
                  ]}
                />
              </div>
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>필터 가이드</Button>
            </div>

            {/* 오른쪽 절반: 내 맞춤 공고 보기 버튼 */}
            <div className="flex-1 flex justify-end items-center">
              <button
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

        {/* 마감 알림 버튼 - 캘린더 뷰일 때만, 탭 아래 표시
            ✅ 전체 탭처럼: ON → 민트 배경 + 흰 글씨 / OFF → 흰 배경 + 회색 글씨 */}
        {viewMode === 'calendar' && (
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setIsNotificationOn(!isNotificationOn)}
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
                    {tab === '전체' ? PROGRAMS.length : PROGRAMS.filter((p) => p.supportType === tab).length}
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
                const isSaved      = savedPrograms.includes(program.id);
                const typeConfig   = SUPPORT_TYPE_CONFIG[program.supportType];
                const categoryInfo = CATEGORY_MAP[program.category] || { label: program.category, bg: 'bg-[#00C9A7]' };
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
                              <Badge variant={program.dday <= 20 ? 'danger' : 'success'}>D-{program.dday}</Badge>
                              <Badge className={`${categoryInfo.bg} text-white`}>{categoryInfo.label}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{program.title}</h3>
                            <p className="mb-3 text-gray-500 leading-snug" style={{ fontSize: '13px' }}>{program.summary}</p>
                            <div className="flex items-center gap-3 flex-wrap text-gray-400" style={{ fontSize: '13px' }}>
                              <span className="font-medium text-gray-600">{program.agency}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 마감 {program.deadline}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {program.amount}</span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col gap-2 min-w-[120px]">
                            <Button variant={isSaved ? 'success' : 'outline'} onClick={() => toggleSave(program.id)} className="w-full justify-center gap-1.5">
                              <Bookmark className="w-4 h-4" fill={isSaved ? typeConfig.color : 'none'} stroke={isSaved ? typeConfig.color : 'currentColor'} />
                              스크랩
                            </Button>
                            <a href={program.url} target="_blank" rel="noopener noreferrer" className="w-full">
                              <button className="w-full px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
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
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square opacity-0" />
              ))}
              {Array.from({ length: DAYS_IN_MONTH[selectedMonth - 1] }, (_, i) => i + 1).map((day) => {
                const dateStr     = `2026-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayPrograms = filteredPrograms.filter((p) => p.deadline === dateStr && savedPrograms.includes(p.id));
                return (
                  <div key={day} className="aspect-square p-2 rounded-xl border border-gray-100 flex flex-col justify-between hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    {dayPrograms.length > 0 && (
                      <div className="space-y-1 overflow-hidden">
                        {dayPrograms.map((program) => {
                          const typeConfig = SUPPORT_TYPE_CONFIG[program.supportType];
                          return (
                            <div key={program.id} className="text-[10px] px-1.5 py-0.5 rounded text-white truncate font-medium"
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
                {PROGRAMS.filter((p) => savedPrograms.includes(p.id)).map((program) => {
                  const typeConfig = SUPPORT_TYPE_CONFIG[program.supportType];
                  return (
                    <div key={program.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeConfig.color }} />
                        <div className="truncate">
                          <div className="font-medium text-sm text-gray-900 truncate">{program.title}</div>
                          <div className="text-xs text-gray-500">마감: {program.deadline} (D-{program.dday})</div>
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

      {/* 필터 가이드 모달 */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="필터 적용 가이드">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          지원 유형 탭으로 창업자금·교육·공간 지원을 구분하고, 카테고리 필터와 검색창으로 원하는 공고를 찾을 수 있습니다. 스크랩 버튼을 누르면 캘린더에 자동 맵핑됩니다.
        </p>
        <div className="space-y-2 mb-4">
          {(Object.entries(SUPPORT_TYPE_CONFIG) as [SupportType, typeof SUPPORT_TYPE_CONFIG[SupportType]][]).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ background: config.color }} />
              <span>{type}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>확인했습니다</Button>
        </div>
      </Dialog>
    </div>
  );
}