import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, ThumbsUp, MessageSquare, Edit, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  author: string;
  avatar: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

// ================= [로컬 컴포넌트 시작: PostButton] =================
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
// ================= [로컬 컴포넌트 끝: PostButton] =================


// ================= [로컬 컴포넌트 시작: PostStatCard] =================
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
// ================= [로컬 컴포넌트 끝: PostStatCard] =================


// ================= [로컬 컴포넌트 시작: PostCard] =================
interface PostCardProps {
  post: Post;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PostCard = ({ post, onEdit, onDelete }: PostCardProps) => {
  const navigate = useNavigate(); // ◀ 페이지 이동을 위해 추가!

  return (
    <div 
      onClick={() => navigate(`/community-post/${post.id}`)} // ◀ 카드 클릭 시 올바른 상세 페이지로 이동!
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
      >
      {/* Post Header */}
      {/* 👇 중요: 수정/삭제 버튼이 있는 헤더 영역을 클릭할 때는 카드 전체 클릭 이벤트가 발동하지 않도록 막아줍니다. */}
      <div className="flex items-start justify-between mb-4" onClick={(e) => e.stopPropagation()}>
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
                style={{
                  background: '#E0F7F3',
                  color: '#00C9A7',
                }}
              >
                {post.category}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* ★ 기존 구형 button에서 로컬 컴포넌트 PostButton으로 치환됨 */}
          <PostButton
            onClick={() => onEdit(post.id)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Edit className="w-4 h-4" />
          </PostButton>
          
          {/* ★ 기존 구형 button에서 로컬 컴포넌트 PostButton으로 치환됨 */}
          <PostButton
            onClick={() => onDelete(post.id)}
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

      {/* Post Stats */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
          <ThumbsUp className="w-4 h-4" />
          <span>{post.likes}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600" style={{ fontSize: '14px' }}>
          <MessageSquare className="w-4 h-4" />
          <span>{post.comments}</span>
        </div>
      </div>
    </div>
  );
};
PostCard.displayName = 'PostCard';
// ================= [로컬 컴포넌트 끝: PostCard] =================


export default function MyPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: '나',
      avatar: '👤',
      category: 'IT/소프트웨어',
      title: 'SaaS 창업 준비 과정 공유합니다',
      content: '지난 6개월간 SaaS 서비스를 기획하고 예비창업패키지에 지원하면서 겪었던 시행착오와 배운 점들을 공유합니다. 가장 중요한 것은 명확한 타겟 고객 설정이었어요...',
      tags: ['SaaS', '창업준비', '예비창업패키지'],
      likes: 15,
      comments: 7,
      timestamp: '3일 전',
      isLiked: false,
    },
    {
      id: '2',
      author: '나',
      avatar: '👤',
      category: '유통/서비스',
      title: '모바일 커머스 시장 조사 자료 정리',
      content: '모바일 쇼핑몰 창업을 준비하면서 조사한 시장 동향과 경쟁사 분석 자료를 정리해봤습니다. 2026년 모바일 커머스 시장은 전년 대비 25% 성장이 예상되며...',
      tags: ['모바일커머스', '시장조사', '창업'],
      likes: 23,
      comments: 12,
      timestamp: '1주 전',
      isLiked: false,
    },
    {
      id: '3',
      author: '나',
      avatar: '👤',
      category: '바이오/헬스케어',
      title: '디지털헬스 규제 관련 질문입니다',
      content: '원격 건강관리 서비스를 개발 중인데, 의료기기 인증 관련 규제가 복잡하네요. 비슷한 분야에서 창업하신 분들은 어떻게 대응하셨나요?',
      tags: ['디지털헬스', '규제', '질문'],
      likes: 8,
      comments: 5,
      timestamp: '2주 전',
      isLiked: false,
    },
  ]);

  const handleDelete = (postId: string) => {
    if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const handleEdit = (postId: string) => {
    alert('게시글 수정 기능은 곧 제공될 예정입니다.');
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {/* ★ 기존 구형 button에서 로컬 컴포넌트 PostButton으로 치환됨 */}
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
          {/* ★ 기존 구형 스탯 마크업 영역에서 로컬 컴포넌트 PostStatCard로 치환됨 */}
          <PostStatCard 
            icon={<MessageCircle className="w-5 h-5 text-[#00C9A7]" />} 
            label="작성한 글" 
            value={posts.length} 
          />

          {/* ★ 기존 구형 스탯 마크업 영역에서 로컬 컴포넌트 PostStatCard로 치환됨 */}
          <PostStatCard 
            icon={<ThumbsUp className="w-5 h-5 text-[#00C9A7]" />} 
            label="받은 좋아요" 
            value={posts.reduce((sum, post) => sum + post.likes, 0)} 
          />

          {/* ★ 기존 구형 스탯 마크업 영역에서 로컬 컴포넌트 PostStatCard로 치환됨 */}
          <PostStatCard 
            icon={<MessageSquare className="w-5 h-5 text-[#00C9A7]" />} 
            label="댓글" 
            value={posts.reduce((sum, post) => sum + post.comments, 0)} 
          />
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <p className="text-gray-500">작성한 게시글이 없습니다.</p>
            </div>
          ) : (
            posts.map((post) => (
              /* ★ 기존 구형 리스트 맵핑 내부 마크업이 로컬 컴포넌트 PostCard로 정밀 치환됨 */
              <PostCard 
                key={post.id} 
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