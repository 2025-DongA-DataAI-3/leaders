import React, { useState, useEffect, forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, ThumbsUp, MessageSquare, TrendingUp, User, Search, Bookmark, ChevronDown, ChevronRight } from 'lucide-react';
import { initialPosts } from '../../app/data/posts';

// ==========================================
// 1. 공통 UI 컴포넌트 (로컬 선언)
// ==========================================

/**
 * CommButton
 * - HTML button을 래핑한 공통 버튼 컴포넌트
 * - asChild=true 일 때: children 엘리먼트에 props를 병합해서 렌더 (Radix UI 패턴)
 * - asChild=false (기본): 일반 <button> 렌더
 * - children.props 타입을 명시적으로 선언해 TypeScript 에러 방지
 */
interface CommButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
const CommButton = forwardRef<HTMLButtonElement, CommButtonProps>(
  ({ className, style, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      // ✅ children.props에 style/className이 있음을 TypeScript에 알려줌
      const child = children as React.ReactElement<{
        style?: React.CSSProperties;
        className?: string;
        [key: string]: any; // 나머지 props 스프레드 허용
      }>;
      return React.cloneElement(child, {
        ...props,
        ref,
        style: { ...style, ...child.props.style },
        className: `${className ?? ''} ${child.props.className || ''}`.trim(),
      });
    }
    return (
      <button ref={ref} className={className ?? ''} style={style} {...props}>
        {children}
      </button>
    );
  }
);
CommButton.displayName = 'CommButton';

/**
 * CommInput
 * - HTML input을 래핑한 공통 입력 컴포넌트
 * - ref 포워딩 지원
 */
interface CommInputProps extends InputHTMLAttributes<HTMLInputElement> {}
const CommInput = forwardRef<HTMLInputElement, CommInputProps>(
  ({ className, style, ...props }, ref) => (
    <input ref={ref} className={className ?? ''} style={style} {...props} />
  )
);
CommInput.displayName = 'CommInput';

/**
 * CommCard
 * - 게시글 카드용 컴포넌트
 * - 시맨틱 마크업을 위해 <div> 대신 <article> 태그 사용
 */
interface CommCardProps extends HTMLAttributes<HTMLElement> {}
const CommCard = forwardRef<HTMLElement, CommCardProps>(
  ({ className, style, children, ...props }, ref) => (
    <article ref={ref} className={className ?? ''} style={style} {...props}>
      {children}
    </article>
  )
);
CommCard.displayName = 'CommCard';

// ==========================================
// 2. 사이드바 데이터 정의
// ==========================================

/**
 * SidebarSection 타입
 * - id: 섹션 식별자 (카테고리 필터값으로도 사용)
 * - label: 화면에 표시할 이름
 * - icon: 섹션 앞에 표시할 아이콘
 * - items: 하위 카테고리 목록 (없으면 빈 배열)
 */
interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { id: string; label: string }[];
}

/**
 * 사이드바 전체 섹션 데이터
 * - 분야: 창업 업종별 카테고리 (게시글 필터에 직접 사용)
 * - 구인: 공동창업자/개발자 등 팀원 모집 카테고리
 * - 기술: 개발/기술 스택 관련 카테고리
 *
 * ⚠️ items의 id값은 posts 데이터의 category 필드값과 반드시 일치해야 필터 작동
 */
const sidebarSections: SidebarSection[] = [
  {
    id: '분야',
    label: '분야',
    icon: <span>🗂</span>,
    items: [
      { id: '전체', label: '전체' },
      { id: 'AI/기술창업', label: 'AI/기술창업' },
      { id: '푸드/외식', label: '푸드/외식' },
      { id: '유통/서비스', label: '유통/서비스' },
      { id: '친환경', label: '친환경' },
      { id: '교육', label: '교육' },
      { id: '디지털서비스', label: '디지털서비스' },
      { id: '바이오/헬스케어', label: '바이오/헬스케어' },
      { id: '제조/생산', label: '제조/생산' },
      { id: '공간/오프라인', label: '공간/오프라인' },
    ],
  },
  {
    id: '구인',
    label: '구인',
    icon: <span>💼</span>,
    items: [
      { id: '공동창업자 모집', label: '공동창업자 모집' },
      { id: '개발자 구인', label: '개발자 구인' },
      { id: '디자이너 구인', label: '디자이너 구인' },
      { id: '마케터 구인', label: '마케터 구인' },
      { id: '투자자 찾기', label: '투자자 찾기' },
      { id: '멘토 찾기', label: '멘토 찾기' },
    ],
  },
  {
    id: '기술',
    label: '기술',
    icon: <span>⚙️</span>,
    items: [
      { id: 'AI/ML', label: 'AI/ML' },
      { id: '웹/앱 개발', label: '웹/앱 개발' },
      { id: '블록체인', label: '블록체인' },
      { id: '하드웨어/IoT', label: '하드웨어/IoT' },
      { id: '데이터 분석', label: '데이터 분석' },
      { id: '보안', label: '보안' },
    ],
  },
];

// ==========================================
// 3. Sidebar 컴포넌트
// ==========================================

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

/**
 * Sidebar
 * - 좌측 카테고리 네비게이션 컴포넌트
 * - 각 섹션은 클릭 시 아코디언 방식으로 펼침/접기
 * - 선택된 항목은 좌측 초록 바 + 배경색으로 하이라이트
 * - 초기 상태: 모든 섹션 펼쳐진 상태 (openSections 기본값)
 */
function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  // 각 섹션의 펼침/접힘 상태 관리
  // 기본값: 모든 섹션 오픈
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    분야: true,
    구인: true,
    기술: true,
  });

  // 섹션 헤더 클릭 시 토글
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <nav className="w-56 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden self-start">
      {sidebarSections.map((section) => (
        <div key={section.id}>
          {/* ── 섹션 헤더 버튼 ── */}
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <span className="font-semibold text-gray-800" style={{ fontSize: '14px' }}>
                {section.label}
              </span>
            </div>
            {/* 펼침/접힘 상태에 따라 아이콘 전환 */}
            {openSections[section.id]
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
            }
          </button>

          {/* ── 하위 카테고리 목록 (섹션 오픈 시에만 렌더) ── */}
          {openSections[section.id] && (
            <ul className="border-t border-gray-100">
              {section.items.map((item) => {
                const isActive = selectedCategory === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelectCategory(item.id)}
                      className={`w-full text-left px-5 py-2 transition-colors relative ${
                        isActive
                          ? 'text-[#00C9A7] font-medium bg-[#F0FDF9]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontSize: '13px' }}
                    >
                      {/* 선택된 항목 좌측 초록 강조 바 */}
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C9A7] rounded-r" />
                      )}
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 섹션 간 구분선 */}
          <div className="border-t border-gray-100" />
        </div>
      ))}
    </nav>
  );
}

// ==========================================
// 4. 메인 Community 컴포넌트
// ==========================================

/**
 * Community (메인 컴포넌트)
 * - 전체 커뮤니티 페이지 구성
 * - 좌측: Sidebar (카테고리 필터)
 * - 우측: 검색창 + 통계카드 + 게시글 목록
 * - 상태: 선택 카테고리, 검색어, 게시글 목록, 저장된 게시글
 */
export default function Community() {
  const navigate = useNavigate();

  // 현재 선택된 카테고리 (사이드바 항목 id값과 동일)
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 게시글 목록 상태 (좋아요 토글 등 로컬 수정 반영용)
  const [posts, setPosts] = useState(initialPosts);

  // 저장된 게시글 id 목록 (localStorage 연동)
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  /**
   * 마운트 시 localStorage에서 저장된 게시글 목록 불러오기
   * - try/catch: SSR 환경이나 localStorage 접근 불가 시 에러 방지
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedCommunityPosts');
      if (saved) setSavedPosts(JSON.parse(saved));
    } catch {
      setSavedPosts([]);
    }
  }, []);

  /**
   * 좋아요 토글 핸들러
   * - e.stopPropagation(): 카드 클릭(상세 이동) 이벤트 버블링 차단
   * - isLiked 반전 + likes 카운트 ±1
   */
  const handleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  /**
   * 게시글 저장 토글 핸들러
   * - e.stopPropagation(): 카드 클릭 이벤트 버블링 차단
   * - savedPosts 배열에 추가/제거 후 localStorage에도 동기화
   */
  const handleSavePost = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    const newSaved = savedPosts.includes(postId)
      ? savedPosts.filter(id => id !== postId)
      : [...savedPosts, postId];
    setSavedPosts(newSaved);
    try {
      localStorage.setItem('savedCommunityPosts', JSON.stringify(newSaved));
    } catch { /* localStorage 저장 실패 시 무시 */ }
  };

  /**
   * 게시글 필터링
   * - 카테고리: '전체'면 전부 표시, 아니면 post.category와 일치하는 것만
   * - 검색어: 제목 / 본문 / 태그 중 하나라도 포함되면 표시
   * - post.tags가 undefined일 경우 ?? [] 로 방어 처리
   */
  const filteredPosts = posts.filter(post => {
    const matchesCategory =
      selectedCategory === '전체' || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags ?? []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  /**
   * 현재 선택된 카테고리의 상위 섹션명과 항목명 추출
   * - 헤더 브레드크럼 표시용: ex) "분야 · AI/기술창업"
   */
  const activeSectionParent =
    sidebarSections.find(s => s.items.some(i => i.id === selectedCategory))?.label ?? '';
  const activeItemLabel =
    sidebarSections.flatMap(s => s.items).find(i => i.id === selectedCategory)?.label ?? selectedCategory;

  return (
    <div className="min-h-screen py-8 px-6 bg-[#F5FFFE]">
      <div className="max-w-6xl mx-auto">

        {/* ── 페이지 타이틀 ── */}
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">커뮤니티</h1>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            창업자들과 경험을 공유하고 소통하세요
          </p>
        </div>

        {/* ── 2컬럼 레이아웃: 사이드바 + 메인 ── */}
        <div className="flex gap-6 items-start">

          {/* 좌측 사이드바 */}
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 우측 메인 영역 */}
          <div className="flex-1 min-w-0">

            {/* ── 브레드크럼 헤더 + 액션 버튼 ── */}
            <div className="flex items-center justify-between mb-5">
              <div>
                {/* 선택된 섹션과 항목을 "분야 · 전체" 형식으로 표시 */}
                <h2 className="text-lg font-bold text-gray-900">
                  {activeSectionParent
                    ? `${activeSectionParent} · ${activeItemLabel}`
                    : activeItemLabel}
                </h2>
                <p className="text-gray-500" style={{ fontSize: '13px' }}>
                  창업자들과 경험을 공유하고 소통하세요
                </p>
              </div>
              <div className="flex gap-2">
                {/* 글쓰기 버튼 → /community-write 라우터 이동 */}
                <CommButton
                  onClick={() => navigate('/community-write')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  글쓰기
                </CommButton>
                {/* 내가 쓴 글 버튼 → /my-posts 라우터 이동 */}
                <CommButton
                  onClick={() => navigate('/my-posts')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:border-[#00C9A7] hover:text-[#00C9A7] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  <User className="w-4 h-4" />
                  내가 쓴 글
                </CommButton>
              </div>
            </div>

            {/* ── 검색창 ── */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <CommInput
                type="text"
                placeholder="게시글 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent"
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* ── 통계 카드 3개 ── */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { icon: <MessageCircle className="w-5 h-5 text-[#00C9A7]" />, label: '전체 게시글', value: '248' },
                { icon: <TrendingUp className="w-5 h-5 text-[#00C9A7]" />, label: '이번 주 활동', value: '+24' },
                { icon: <User className="w-5 h-5 text-[#00C9A7]" />, label: '활성 회원', value: '1,234' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E0F7F3] flex items-center justify-center">
                      {icon}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{label}</div>
                      <div className="text-xl font-bold text-gray-900">{value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 게시글 목록 ── */}
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                // 검색/필터 결과 없을 때 빈 상태 표시
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <CommCard
                    key={post.id}
                    onClick={() => navigate(`/community-post/${post.id}`)}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-[#00C9A7]/30 transition-all cursor-pointer"
                  >
                    {/* 게시글 작성자 정보 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* 아바타 이모지 */}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          {post.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{post.author}</span>
                            <span className="text-sm text-gray-400">·</span>
                            <span className="text-sm text-gray-500">{post.timestamp}</span>
                          </div>
                          {/* 카테고리 뱃지 */}
                          <span
                            className="inline-block mt-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: '#E0F7F3', color: '#00C9A7' }}
                          >
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 제목 */}
                    <h3 className="mb-2 text-gray-900 font-semibold" style={{ fontSize: '18px' }}>
                      {post.title}
                    </h3>

                    {/* 본문 미리보기 */}
                    <p className="text-gray-600 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {post.content}
                    </p>

                    {/* 해시태그 목록 (tags 없을 경우 ?? [] 방어 처리) */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(post.tags ?? []).map((tag, idx) => (
                        <span key={idx} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* 하단 액션 버튼 영역 */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">

                      {/* 좋아요 버튼: 클릭 시 isLiked 토글 + likes 카운트 변경 */}
                      <CommButton
                        onClick={(e) => handleLike(e, post.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          post.isLiked
                            ? 'bg-[#E0F7F3] text-[#00C9A7]'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                        style={{ fontSize: '14px' }}
                      >
                        <ThumbsUp className="w-4 h-4" fill={post.isLiked ? '#00C9A7' : 'none'} />
                        <span>{post.likes}</span>
                      </CommButton>

                      {/* 댓글 수 표시 (commentList 없을 경우 ?? [] 방어 처리) */}
                      <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span style={{ fontSize: '14px' }}>{(post.commentList ?? []).length}</span>
                      </div>

                      {/* 저장 버튼: 클릭 시 savedPosts 토글 + localStorage 동기화 */}
                      <CommButton
                        onClick={(e) => handleSavePost(e, post.id)}
                        className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          savedPosts.includes(post.id)
                            ? 'bg-[#E0F7F3] text-[#00C9A7]'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                        style={{ fontSize: '14px' }}
                      >
                        <Bookmark className="w-4 h-4" fill={savedPosts.includes(post.id) ? '#00C9A7' : 'none'} />
                        <span className="text-xs">
                          {savedPosts.includes(post.id) ? '저장됨' : '저장'}
                        </span>
                      </CommButton>
                    </div>
                  </CommCard>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
