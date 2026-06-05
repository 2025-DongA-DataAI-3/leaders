import React, { useState, useEffect, forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, ThumbsUp, MessageSquare, TrendingUp, User, Search, Bookmark } from 'lucide-react';
import { initialPosts } from '../../app/data/posts';

// ==========================================
// 1. [Self-contained] 독립형 로컬 컴포넌트 선언 구역
// ==========================================

// [A] 버튼 컴포넌트
interface CommButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}
const CommButton = forwardRef<HTMLButtonElement, CommButtonProps>(
  ({ className, style, asChild = false, children, ...props }, ref) => {
    const combinedClassName = className ? `${className}` : '';

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
        style: { ...style, ...children.props.style },
        className: `${combinedClassName} ${children.props.className || ''}`.trim(),
      });
    }

    return (
      <button ref={ref} className={combinedClassName} style={style} {...props}>
        {children}
      </button>
    );
  }
);
CommButton.displayName = 'CommButton';


// [B] 검색창 컴포넌트
interface CommInputProps extends InputHTMLAttributes<HTMLInputElement> {}
const CommInput = forwardRef<HTMLInputElement, CommInputProps>(
  ({ className, style, ...props }, ref) => {
    const combinedClassName = className ? `${className}` : '';
    return (
      <input ref={ref} className={combinedClassName} style={style} {...props} />
    );
  }
);
CommInput.displayName = 'CommInput';


// [C] 게시글 카드 컴포넌트 (시맨틱 마크업을 위해 article 태그 사용)
interface CommCardProps extends HTMLAttributes<HTMLElement> {}
const CommCard = forwardRef<HTMLElement, CommCardProps>(
  ({ className, style, children, ...props }, ref) => {
    const combinedClassName = className ? `${className}` : '';
    return (
      <article ref={ref} className={combinedClassName} style={style} {...props}>
        {children}
      </article>
    );
  }
);
CommCard.displayName = 'CommCard';


// ==========================================
// 2. 메인 커뮤니티 도메인 컴포넌트
// ==========================================
export default function Community() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(initialPosts);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('savedCommunityPosts');
    if (saved) {
      try {
        setSavedPosts(JSON.parse(saved));
      } catch (e) {
        setSavedPosts([]);
      }
    }
  }, []);

  const categories = ['전체', 'IT/소프트웨어', '제조/생산', '유통/서비스', '바이오/헬스케어', '친환경/에너지'];

  const handleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleSavePost = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    let newSavedPosts: string[];
    if (savedPosts.includes(postId)) {
      newSavedPosts = savedPosts.filter(id => id !== postId);
    } else {
      newSavedPosts = [...savedPosts, postId];
    }
    setSavedPosts(newSavedPosts);
    localStorage.setItem('savedCommunityPosts', JSON.stringify(newSavedPosts));
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === '전체' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2">커뮤니티</h1>
          <p className="text-muted-foreground" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            창업자들과 경험을 공유하고 소통하세요
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          {/* ⭐️ 수정: alert창을 제거하고 정확한 라우터 이동 경로(/community-write)를 매핑했습니다. */}
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

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <CommInput
              type="text"
              placeholder="게시글 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent"
              style={{ fontSize: '14px' }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <CommButton
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#00C9A7] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#00C9A7]'
                }`}
                style={{ fontSize: '14px' }}
              >
                {category}
              </CommButton>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E0F7F3] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#00C9A7]" />
              </div>
              <div>
                <div className="text-sm text-gray-600">전체 게시글</div>
                <div className="text-xl font-bold text-gray-900">248</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E0F7F3] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00C9A7]" />
              </div>
              <div>
                <div className="text-sm text-gray-600">이번 주 활동</div>
                <div className="text-xl font-bold text-gray-900">+24</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E0F7F3] flex items-center justify-center">
                <User className="w-5 h-5 text-[#00C9A7]" />
              </div>
              <div>
                <div className="text-sm text-gray-600">활성 회원</div>
                <div className="text-xl font-bold text-gray-900">1,234</div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
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
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {post.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{post.author}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{post.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: '#E0F7F3', color: '#00C9A7' }}
                        >
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <h3 className="mb-3 text-gray-900 group-hover:text-[#00C9A7] transition-colors" style={{ fontSize: '18px', fontWeight: '600' }}>
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {post.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
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
                  
                  <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                    <MessageSquare className="w-4 h-4" />
                    <span style={{ fontSize: '14px' }}>{post.commentList.length}</span>
                  </div>

                  <CommButton
                    onClick={(e) => handleSavePost(e, post.id)}
                    className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      savedPosts.includes(post.id)
                        ? 'bg-[#E0F7F3] text-[#00C9A7]'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                    style={{ fontSize: '14px' }}
                    title={savedPosts.includes(post.id) ? "저장됨" : "저장하기"}
                  >
                    <Bookmark
                      className="w-4 h-4"
                      fill={savedPosts.includes(post.id) ? '#00C9A7' : 'none'}
                    />
                    <span className="text-xs">{savedPosts.includes(post.id) ? '저장됨' : '저장'}</span>
                  </CommButton>
                </div>
              </CommCard>
            ))
          )}
        </div>

      </div>
    </div>
  );
}