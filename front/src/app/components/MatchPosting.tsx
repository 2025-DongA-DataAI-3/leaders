import { useState, useEffect, ReactNode } from 'react';
import { Calendar as CalendarIcon, List, Bookmark, Clock, DollarSign, X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

// =========================================================================
// 타입 정의 및 인터페이스
// =========================================================================
interface Program {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  dday: number;
  amount: string;
  category: string;
  url: string;
}

type ViewMode = 'list' | 'calendar';

// =========================================================================
// 고정 상수 (공용 고정 데이터)
// =========================================================================
const PROGRAMS: Program[] = [
  { id: '1', title: '청년창업사관학교 12기', agency: '중소벤처기업부', deadline: '2026-05-25', dday: 18, amount: '최대 1억원', category: 'IT/소프트웨어', url: 'https://www.k-startup.go.kr' },
  { id: '2', title: '예비창업패키지', agency: '창업진흥원', deadline: '2026-06-10', dday: 34, amount: '최대 1억원', category: '제조/생산', url: 'https://www.k-startup.go.kr' },
  { id: '3', title: '초기창업패키지', agency: '창업진흥원', deadline: '2026-06-20', dday: 44, amount: '최대 1억원', category: '유통/서비스', url: 'https://www.k-startup.go.kr' },
  { id: '4', title: '재도전 성공패키지', agency: '중소벤처기업부', deadline: '2026-07-01', dday: 55, amount: '최대 5천만원', category: '바이오/헬스케어', url: 'https://www.k-startup.go.kr' },
  { id: '5', title: 'K-스타트업 센터 입주', agency: '창업진흥원', deadline: '2026-07-15', dday: 69, amount: '공간 지원', category: '친환경/에너지', url: 'https://www.k-startup.go.kr' },
];

const CATEGORY_MAP: Record<string, { label: string; bg: string }> = {
  'IT/소프트웨어': { label: 'IT/소프트웨어', bg: 'bg-[#8B5CF6]' },
  '제조/생산': { label: '제조/생산', bg: 'bg-[#3B82F6]' },
  '유통/서비스': { label: '유통/서비스', bg: 'bg-[#F59E0B]' },
  '바이오/헬스케어': { label: '바이오/헬스케어', bg: 'bg-[#10B981]' },
  '친환경/에너지': { label: '친환경/에너지', bg: 'bg-[#22C55E]' },
};

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const STORAGE_KEY = 'savedPrograms';

// =========================================================================
// [로컬 컴포넌트 영역] 100% 자급자족 외부 의존성 없는 독립형 UI 레이어
// =========================================================================

/* 1. 버튼 및 토글러 컴포넌트 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  children: ReactNode;
}
function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  // !rounded-lg로 외부 주입 클래스에 밀리지 않게 최우선 방어벽 설정
  const base = "px-4 py-2 !rounded-lg text-sm font-medium transition-colors flex items-center justify-center";
  const styles = {
    primary: "bg-[#00C9A7] hover:bg-[#00b394] text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    outline: "border border-gray-200 hover:bg-gray-50 text-gray-700",
    success: "bg-teal-50/50 border border-[#00C9A7] text-[#00C9A7]",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function IconButton({ icon, variant = 'secondary', onClick }: { icon: ReactNode; variant?: 'secondary' | 'danger'; onClick?: () => void }) {
  // 아이콘 버튼들도 완전 직각이 되지 않도록 중간 라운딩 강제 지정
  return <button onClick={onClick} className={`p-1.5 !rounded-lg transition-colors ${variant === 'danger' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>{icon}</button>;
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#00C9A7]' : 'bg-gray-300'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

/* 2. 폼 입력 필드 컴포넌트 */
function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  // !rounded-lg 로 강제화
  return <input className={`w-full px-3 py-2 text-sm !rounded-lg border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/20 focus:border-[#00C9A7] transition-all ${className}`} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}
function Select({ options, className = '', ...props }: SelectProps) {
  // !rounded-lg 로 강제화
  return (
    <select className={`w-full px-3 py-2 text-sm !rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/20 focus:border-[#00C9A7] transition-all ${className}`} {...props}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

/* 3. 데이터 컨테이너 (레이아웃 틀) 컴포넌트 */
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  // !rounded-2xl 클래스를 박아넣어 외부 레이아웃 결합 시 무조건 16px이 깎이도록 처리
  return <div className={`bg-white !rounded-2xl border border-gray-200/80 shadow-sm ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default', className = '' }: { children: ReactNode; variant?: 'default' | 'success' | 'danger'; className?: string }) {
  // 배지 꼬리도 미세하게 부드러운 라운딩 유지
  const styles = {
    default: "px-2 py-0.5 !rounded text-xs font-medium",
    success: "px-2 py-0.5 !rounded font-semibold text-xs bg-teal-50 text-[#00C9A7]",
    danger: "px-2 py-0.5 !rounded font-semibold text-xs bg-red-50 text-red-600"
  };
  return <span className={`${styles[variant]} ${className}`}>{children}</span>;
}

function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-t border-gray-200/60 w-full ${className}`} />;
}

/* 4. 팝업 및 오버레이 컴포넌트 */
function Dialog({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {/* 팝업 오버레이 창도 !rounded-2xl 주입 */}
      <div className="bg-white !rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <IconButton icon={<X className="w-4 h-4" />} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Tooltip({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs p-2 !rounded-lg shadow-lg z-10 leading-normal">
        {message}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

/* 5. 데이터 내비게이션 컴포넌트 */
function Tabs({ activeTab, onChange, tabs }: { activeTab: string; onChange: (id: string) => void; tabs: { id: string; label: string; icon?: ReactNode }[] }) {
  return (
    <div className="flex gap-1 p-1 !rounded-lg bg-gray-100 border border-gray-200/40">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 !rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white shadow-sm text-[#00C9A7]' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {tab.icon}
            {tab.label}
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
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 !rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-[#00C9A7] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {p}
        </button>
      ))}
      <IconButton icon={<ChevronRight className="w-4 h-4" />} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} />
    </div>
  );
}

function Breadcrumb({ items }: { items: { label: string; active?: boolean }[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {idx > 0 && <span>/</span>}
          <span className={item.active ? "text-gray-600 font-semibold" : ""}>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

// =========================================================================
// [원래 코드 영역] 메인 매치포스팅 페이지 컴포넌트 (여기서부터 끝까지 덮어쓰기)
// =========================================================================
export default function MatchPosting() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [savedPrograms, setSavedPrograms] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 2026년 5월 기준 기본값
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isNotificationOn, setIsNotificationOn] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSavedPrograms(JSON.parse(saved)); } catch (e) { setSavedPrograms([]); }
    }
  }, []);

  const toggleSave = (id: string) => {
    const newSaved = savedPrograms.includes(id) ? savedPrograms.filter((p) => p !== id) : [...savedPrograms, id];
    setSavedPrograms(newSaved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
  };

  // 카테고리 및 검색어 필터링
  const filteredPrograms = PROGRAMS.filter(p => {
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchKeyword.toLowerCase()) || p.agency.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  /* =========================================================================
     🎯 계산 구역 (중복 제거 및 동적 페이지네이션 연산 완료)
     ========================================================================= */
  const ITEMS_PER_PAGE = 3; // 한 페이지당 보여줄 공고 개수 고정
  const totalPages = Math.ceil(filteredPrograms.length / ITEMS_PER_PAGE) || 1; // 동적 페이지 수 계산
  
  // 현재 페이지에 해당하는 데이터만 잘라내기
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 달력 시작 요일 오프셋 계산 (중복 선언 버그 해결!)
  const startDayOfWeek = new Date(2026, selectedMonth - 1, 1).getDay();

  // 필터 조건이 바뀔 때 페이지 번호를 1페이지로 안전하게 초기화해주는 안전장치
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterCategory]);

  return (
    <div className="min-h-screen py-8 px-6 bg-gray-50/50 text-gray-900">
      <div className="max-w-6xl mx-auto">
        
        {/* 상단 브레드크럼 (데이터 내비게이션 영역) */}
        <Breadcrumb items={[{ label: '홈' }, { label: '분석 스페이스' }, { label: '맞춤형 공고 추천', active: true }]} />

        {/* 대시보드 헤더 툴바 및 필터 검색창 레이아웃 */}
        <Card className="mb-6 p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">맞춤형 공고 추천 (MatchPosting)</h1>
                <Tooltip message="2026년 공고 기준으로 실시간 업데이트되는 매칭 시스템입니다.">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500">당신의 창업 성향에 맞는 지원사업을 실시간으로 확인하세요.</p>
            </div>
            
            {/* 마감 안내 메일/푸시 알림 제어 스위치 */}
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 !rounded-lg border border-gray-100">
              <span className="text-xs font-medium text-gray-600">마감 알림</span>
              <Switch checked={isNotificationOn} onChange={setIsNotificationOn} />
            </div>
          </div>
          
          <Divider className="my-4" />

          {/* 통합 검색 폼 컨트롤 배치 레이어 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input 
                placeholder="지원사업명 또는 주관기관 검색..." 
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: 'all', label: '전체 카테고리' },
                  { value: 'IT/소프트웨어', label: 'IT/소프트웨어' },
                  { value: '제조/생산', label: '제조/생산' },
                  { value: '유통/서비스', label: '유통/서비스' },
                  { value: '바이오/헬스케어', label: '바이오/헬스케어' },
                  { value: '친환경/에너지', label: '친환경/에너지' },
                ]}
              />
            </div>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>필터 가이드</Button>
          </div>
        </Card>

        {/* 탭 인터페이스 메뉴 및 데이터 요약 카운터 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Tabs 
            activeTab={viewMode} 
            onChange={(tab) => setViewMode(tab as ViewMode)} 
            tabs={[
              { id: 'list', label: 'D-Day 목록', icon: <List className="w-4 h-4" /> },
              { id: 'calendar', label: '캘린더 뷰', icon: <CalendarIcon className="w-4 h-4" /> }
            ]} 
          />
          <div className="text-sm font-medium text-gray-500 self-end sm:self-auto">
            조건에 맞는 사업: <span className="text-[#00C9A7] font-semibold">{filteredPrograms.length}개</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="font-medium text-gray-500">현재 페이지: <span className="text-gray-900 font-semibold">{currentPage}</span> / {totalPages}</span>
            <span className="mx-2 text-gray-300">|</span>
            스크랩: <span className="text-[#00C9A7] font-semibold">{savedPrograms.length}개</span>
          </div>
        </div>

        {/* 목록형 보기 화면 UI 레벨 */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((program) => {
                const isSaved = savedPrograms.includes(program.id);
                const categoryInfo = CATEGORY_MAP[program.category] || { label: program.category, bg: 'bg-[#00C9A7]' };
                
                return (
                  <Card key={program.id} className="p-6 transition-shadow hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                          <Badge className={`${categoryInfo.bg} text-white`}>{categoryInfo.label}</Badge>
                          <Badge variant={program.dday <= 20 ? 'danger' : 'success'}>D-{program.dday}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                          <span>{program.agency}</span>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /> 마감: {program.deadline}</span>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-gray-400" /> {program.amount}</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <Button 
                          variant={isSaved ? 'success' : 'outline'} 
                          onClick={() => toggleSave(program.id)}
                          className="w-full justify-center gap-1.5"
                        >
                          <Bookmark className="w-4 h-4" fill={isSaved ? '#00C9A7' : 'none'} stroke={isSaved ? '#00C9A7' : 'currentColor'} />
                          <span>스크랩</span>
                        </Button>
                        <a href={program.url} target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button className="w-full bg-[#00C9A7] hover:bg-[#00b394] text-white">지원하기</Button>
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white !rounded-2xl border border-gray-200 text-gray-400 text-sm">검색 결과가 없습니다.</div>
            )}
            
            {/* 페이지네이션 컴포넌트 하단 바인딩 */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}

        {/* 달력형 보기 화면 UI 레벨 */}
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
            
            {/* 달력 날짜 타일 생성 구역 */}
            <div className="grid grid-cols-7 gap-2">
              {/* 💡 빈 공백 타일은 날짜 반복문 '바깥'에 배치하여 정확히 첫 주 요일 오프셋만큼만 밀어줍니다 */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square p-2 bg-gray-50/10 opacity-0" />
              ))}

              {/* 주석 해제 및 실제 요일 매칭 연동 복구 */}
              {Array.from({ length: DAYS_IN_MONTH[selectedMonth - 1] }, (_, i) => i + 1).map((day) => {
                const dateStr = `2026-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayPrograms = filteredPrograms.filter((p) => p.deadline === dateStr && savedPrograms.includes(p.id));

                return (
                  <div key={day} className="aspect-square p-2 !rounded-lg border border-gray-100 flex flex-col justify-between hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    {dayPrograms.length > 0 && (
                      <div className="space-y-1 overflow-hidden">
                        {dayPrograms.map((program) => (
                          <div 
                            key={program.id} 
                            className={`text-[10px] px-1.5 py-0.5 !rounded text-white truncate font-medium ${CATEGORY_MAP[program.category]?.bg || 'bg-gray-500'}`}
                            title={program.title}
                          >
                            {program.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 달력 하단 스크랩 실시간 목록 서브 패널 */}
            <Divider className="my-6" />
            <h3 className="text-base font-semibold text-gray-900 mb-4">스크랩한 지원사업 명단</h3>
            {savedPrograms.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {PROGRAMS.filter((p) => savedPrograms.includes(p.id)).map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-3 !rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_MAP[program.category]?.bg || 'bg-gray-400'}`} />
                      <div className="truncate">
                        <div className="font-medium text-sm text-gray-900 truncate">{program.title}</div>
                        <div className="text-xs text-gray-500">마감: {program.deadline} (D-{program.dday})</div>
                      </div>
                    </div>
                    <IconButton icon={<X className="w-3 h-3" />} variant="danger" onClick={() => toggleSave(program.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-400">스크랩한 내역이 비어 있습니다.</div>
            )}
          </Card>
        )}

      </div>

      {/* 도움말 모달 팝업 가이드 레이어 */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="필터 적용 가이드">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          상단의 카테고리 필터와 검색창을 이용해 타겟팅된 지원사업만 선별하여 리스트 및 달력 형태로 조회할 수 있습니다. 스크랩 버튼을 누르면 달력에 자동 맵핑됩니다.
        </p>
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>확인했습니다</Button>
        </div>
      </Dialog>
    </div>
  );
}