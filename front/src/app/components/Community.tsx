import React, { useState, useEffect, forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, MessageSquare, TrendingUp, User, Search, Bookmark, ChevronDown, ChevronRight } from 'lucide-react';

// ==========================================
// 1. 공통 UI 컴포넌트 (로컬 선언)
// ==========================================

interface CommButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
const CommButton = forwardRef<HTMLButtonElement, CommButtonProps>(
  ({ className, style, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        style?: React.CSSProperties;
        className?: string;
        [key: string]: any;
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

interface CommInputProps extends InputHTMLAttributes<HTMLInputElement> {}
const CommInput = forwardRef<HTMLInputElement, CommInputProps>(
  ({ className, style, ...props }, ref) => (
    <input ref={ref} className={className ?? ''} style={style} {...props} />
  )
);
CommInput.displayName = 'CommInput';

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
// 2. 타입 정의
// ==========================================

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: { id: string; label: string }[];
}

// DB에서 내려오는 게시글 row 타입
interface PostRow {
  post_id: string;
  user_id: string;
  author: string;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  updated_at: string | null;
  majorcategory: string | null;
  subcategory: string | null;
  comment_count: number;
}

interface CommunityStats {
  total: number;
  weekly: number;
  active_users: number;
}

// ==========================================
// 3. Sidebar 컴포넌트
// ==========================================

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (sectionId: string, itemId: string) => void;
  sections: SidebarSection[];
}

function Sidebar({ selectedCategory, onSelectCategory, sections }: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // sections가 로드되면 전부 열린 상태로 초기화
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach(s => { initial[s.id] = true; });
    setOpenSections(initial);
  }, [sections]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <nav className="w-56 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden self-start">
      {sections.map((section) => (
        <div key={section.id}>
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
            {openSections[section.id]
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
            }
          </button>

          {openSections[section.id] && (
            <ul className="border-t border-gray-100">
              {section.items.map((item) => {
                const isActive = selectedCategory === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelectCategory(section.id, item.id)}
                      className={`w-full text-left px-5 py-2 transition-colors relative ${
                        isActive
                          ? 'text-[#00C9A7] font-medium bg-[#F0FDF9]'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontSize: '13px' }}
                    >
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

          <div className="border-t border-gray-100" />
        </div>
      ))}
    </nav>
  );
}

// ==========================================
// 4. 유틸: 상대시간 포맷
// ==========================================

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ==========================================
// 5. 메인 Community 컴포넌트
// ==========================================

const API_BASE = 'http://localhost:5000';

export default function Community() {
  const navigate = useNavigate();

  // 사이드바 카테고리 (DB)
  const [sidebarSections, setSidebarSections] = useState<SidebarSection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedSection, setSelectedSection] = useState('창업 분야');

  // 게시글 목록 (DB)
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색어 (입력값과 실제 검색 트리거 분리)
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 북마크 상태: post_id 목록
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  // 통계
  const [stats, setStats] = useState<CommunityStats>({ total: 0, weekly: 0, active_users: 0 });

  const userId = localStorage.getItem('user_id');

  // ── 카테고리 목록 불러오기 ──
  useEffect(() => {
    fetch(`${API_BASE}/api/community/categories`)
      .then(res => res.json())
      .then(data => {
        const grouped: Record<string, { id: string; label: string }[]> = {};

        data.forEach((row: { majorcategory: string; subcategory: string }) => {
          if (!grouped[row.majorcategory]) {
            grouped[row.majorcategory] = [{ id: '전체', label: '전체' }];
          }
          grouped[row.majorcategory].push({
            id: row.subcategory,
            label: row.subcategory,
          });
        });

        const sections: SidebarSection[] = Object.entries(grouped).map(([key, items]) => ({
          id: key,
          label: key,
          icon: key === '창업 분야'
            ? <span>🗂</span>
            : key === '창업 소통'
            ? <span>💬</span>
            : <span>⚙️</span>,
          items,
        }));

        setSidebarSections(sections);
        if (sections.length > 0) {
          setSelectedSection(sections[0].id);
        }
      })
      .catch(err => console.error('카테고리 로드 실패:', err));
  }, []);

  // ── 통계 불러오기 ──
  useEffect(() => {
    fetch(`${API_BASE}/api/posts/stats/summary`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('통계 로드 실패:', err));
  }, []);

  // ── 내 북마크 목록 불러오기 ──
  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/posts/bookmarks/${userId}`)
      .then(res => res.json())
      .then((data: { post_id: string }[]) => {
        setSavedPosts(data.map(d => d.post_id));
      })
      .catch(err => console.error('북마크 로드 실패:', err));
  }, [userId]);

  // ── 게시글 목록 불러오기 (카테고리/검색 변경 시 재조회) ──
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (selectedCategory !== '전체') {
      params.set('majorcategory', selectedSection);
      params.set('subcategory', selectedCategory);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    fetch(`${API_BASE}/api/posts?${params.toString()}`)
      .then(res => res.json())
      .then((data: PostRow[]) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('게시글 로드 실패:', err);
        setPosts([]);
        setLoading(false);
      });
  }, [selectedCategory, selectedSection, searchQuery]);

  const handleSelectCategory = (sectionId: string, itemId: string) => {
    setSelectedSection(sectionId);
    setSelectedCategory(itemId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // ── 북마크 토글 (DB 연동) ──
  const handleSavePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (data.bookmarked) {
        setSavedPosts(prev => [...prev, postId]);
      } else {
        setSavedPosts(prev => prev.filter(id => id !== postId));
      }
    } catch (err) {
      console.error('북마크 토글 실패:', err);
    }
  };

  const activeSectionParent =
    sidebarSections.find(s => s.id === selectedSection)?.label ?? '';
  const activeItemLabel = selectedCategory;

  return (
    <div className="min-h-screen py-8 px-6 bg-[#F5FFFE]">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">커뮤니티</h1>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            창업자들과 경험을 공유하고 소통하세요
          </p>
        </div>

        <div className="flex gap-6 items-start">

          {/* 좌측 사이드바 - DB에서 불러온 sections 전달 */}
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            sections={sidebarSections}
          />

          <div className="flex-1 min-w-0">

            <div className="flex items-center justify-between mb-5">
              <div>
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
                <CommButton
                  onClick={() => navigate('/community-write')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-colors"
                  style={{ fontSize: '14px' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  글쓰기
                </CommButton>
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

            {/* 검색창 - 폼으로 묶어서 엔터 검색 지원 */}
            <form onSubmit={handleSearchSubmit} className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <CommInput
                type="text"
                placeholder="게시글 검색... (Enter로 검색)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent"
                style={{ fontSize: '14px' }}
              />
            </form>

            {/* 통계 카드 - DB 실제 값 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { icon: <MessageCircle className="w-5 h-5 text-[#00C9A7]" />, label: '전체 게시글', value: stats.total.toLocaleString() },
                { icon: <TrendingUp className="w-5 h-5 text-[#00C9A7]" />, label: '이번 주 활동', value: `+${stats.weekly}` },
                { icon: <User className="w-5 h-5 text-[#00C9A7]" />, label: '활성 회원', value: stats.active_users.toLocaleString() },
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

            {/* 게시글 목록 */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <p className="text-gray-400">불러오는 중...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <CommCard
                    key={post.post_id}
                    onClick={() => navigate(`/community-post/${post.post_id}`)}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-[#00C9A7]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{post.author}</span>
                            <span className="text-sm text-gray-400">·</span>
                            <span className="text-sm text-gray-500">{formatTimestamp(post.created_at)}</span>
                          </div>
                          {post.subcategory && (
                            <span
                              className="inline-block mt-1 text-xs px-2 py-1 rounded-full"
                              style={{ background: '#E0F7F3', color: '#00C9A7' }}
                            >
                              {post.subcategory}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="mb-2 text-gray-900 font-semibold" style={{ fontSize: '18px' }}>
                      {post.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {post.content}
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      {/* 댓글 수 - DB 값 */}
                      <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span style={{ fontSize: '14px' }}>{post.comment_count}</span>
                      </div>

                      {/* 조회수 */}
                      <div className="flex items-center gap-2 px-3 py-2 text-gray-400" style={{ fontSize: '13px' }}>
                        조회 {post.view_count}
                      </div>

                      {/* 저장 버튼 - DB 연동 */}
                      <CommButton
                        onClick={(e) => handleSavePost(e, post.post_id)}
                        className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          savedPosts.includes(post.post_id)
                            ? 'bg-[#E0F7F3] text-[#00C9A7]'
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                        style={{ fontSize: '14px' }}
                      >
                        <Bookmark className="w-4 h-4" fill={savedPosts.includes(post.post_id) ? '#00C9A7' : 'none'} />
                        <span className="text-xs">
                          {savedPosts.includes(post.post_id) ? '저장됨' : '저장'}
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