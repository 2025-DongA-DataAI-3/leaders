import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';

// ================= [로컬 컴포넌트: PostButton] =================
interface PostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PostButton = forwardRef<HTMLButtonElement, PostButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`transition-colors focus-visible:outline-none ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PostButton.displayName = 'PostButton';

// ================= [로컬 컴포넌트: PostStatCard] =================
interface PostStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

const PostStatCard = ({ icon, label, value }: PostStatCardProps) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
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
  );
};
PostStatCard.displayName = 'PostStatCard';

// ==========================================
// 타입 정의 (DB 응답)
// ==========================================
interface MyPostRow {
  post_id: string;
  user_id: string;
  author: string;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  updated_at: string | null;
  post_keyword_id: string | null;
  majorcategory: string | null;
  subcategory: string | null;
  comment_count: number;
}

const API_BASE = '';

// ==========================================
// 유틸: 상대시간 포맷
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

// ================= [로컬 컴포넌트: PostCard] =================
interface PostCardProps {
  post: MyPostRow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PostCard = ({ post, onEdit, onDelete }: PostCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/community-post/${post.post_id}`)}
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{post.author}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{formatTimestamp(post.created_at)}</span>
            </div>
            {post.subcategory && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: '#E0F7F3', color: '#00C9A7' }}
                >
                  {post.subcategory}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <PostButton
            onClick={() => onEdit(post.post_id)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Edit className="w-4 h-4" />
          </PostButton>

          <PostButton
            onClick={() => onDelete(post.post_id)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </PostButton>
        </div>
      </div>

      {/* Post Content */}
      <h3 className="mb-3 text-gray-900" style={{ fontSize: '18px', fontWeight: '600' }}>
        {post.title}
      </h3>
      <p className="text-gray-600 mb-4 line-clamp-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>
        {post.content}
      </p>

      {/* Post Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
          <Eye className="w-4 h-4" />
          <span>{post.view_count}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
          <MessageSquare className="w-4 h-4" />
          <span>{post.comment_count}</span>
        </div>
      </div>
    </div>
  );
};
PostCard.displayName = 'PostCard';

// ==========================================
// 메인 MyPosts 컴포넌트
// ==========================================
export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MyPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('user_id');

  // ── 내가 쓴 글 불러오기 ──
  const fetchMyPosts = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/api/posts/my/${userId}`)
      .then(res => res.json())
      .then((data: MyPostRow[]) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('내 글 목록 로드 실패:', err);
        setPosts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── 게시글 삭제 ──
  const handleDelete = async (postId: string) => {
    if (!userId) return;
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || '삭제에 실패했습니다.');
        return;
      }

      setPosts(prev => prev.filter(post => post.post_id !== postId));
    } catch (err) {
      console.error('게시글 삭제 에러:', err);
      alert('서버 연결에 실패했습니다.');
    }
  };

  // ── 게시글 수정 페이지로 이동 ──
  const handleEdit = (postId: string) => {
    navigate(`/community-write?edit=${postId}`);
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
          <PostButton
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E]"
          >
            로그인하러 가기
          </PostButton>
        </div>
      </div>
    );
  }

  const totalComments = posts.reduce((sum, post) => sum + post.comment_count, 0);
  const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <PostButton
            onClick={() => navigate('/community')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7]"
          >
            <ArrowLeft className="w-4 h-4" />
            커뮤니티로 돌아가기
          </PostButton>
        </div>

        <div className="mb-6">
          <h1 className="mb-2">내가 쓴 글</h1>
          <p className="text-muted-foreground" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            총 {posts.length}개의 게시글
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <PostStatCard
            icon={<MessageCircle className="w-5 h-5 text-[#00C9A7]" />}
            label="작성한 글"
            value={posts.length}
          />
          <PostStatCard
            icon={<Eye className="w-5 h-5 text-[#00C9A7]" />}
            label="총 조회수"
            value={totalViews}
          />
          <PostStatCard
            icon={<MessageSquare className="w-5 h-5 text-[#00C9A7]" />}
            label="댓글"
            value={totalComments}
          />
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <p className="text-gray-400">불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <p className="text-gray-500">작성한 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.post_id}
                post={post}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}