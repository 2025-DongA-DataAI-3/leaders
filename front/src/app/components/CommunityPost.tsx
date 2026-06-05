import { useState, forwardRef, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, cloneElement, isValidElement, type SVGProps } from 'react';
import { useParams, useNavigate } from 'react-router';
import { initialPosts, Comment } from '../data/posts';

/* ==========================================================================
   [방어벽 1] Radix UI 사상 기반 Slot 컴포넌트 (공용 UI 제거 대비)
   ========================================================================== */
interface SlotProps {
  children?: ReactNode;
}

const Slot = ({ children, ...props }: SlotProps & Record<string, any>) => {
  if (isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      ...children.props,
      className: `${props.className || ''} ${children.props.className || ''}`.trim() || undefined,
      style: { ...props.style, ...children.props.style },
    });
  }
  return null;
};

/* ==========================================================================
   [방어벽 2] 외부 의존성이 0%인 1:1 순수 SVG 로컬 아이콘 팩
   ========================================================================== */
const Icons = {
  ArrowLeft: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  ),
  Flag: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
  ),
  ThumbsUp: ({ fill = "none", ...props }: SVGProps<SVGSVGElement> & { fill?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
  ),
  MessageSquare: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  AlertTriangle: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
  ),
  X: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  Send: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  )
};

/* ==========================================================================
   [방어벽 3] 도메인 전용 독립형 버튼 컴포넌트
   ========================================================================== */
export interface PostActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PostActionButton = forwardRef<HTMLButtonElement, PostActionButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={`${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
PostActionButton.displayName = "PostActionButton";

/* ==========================================================================
   [방어벽 4] 도메인 전용 독립형 텍스트에어리어 컴포넌트
   ========================================================================== */
export interface PostActionTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const PostActionTextarea = forwardRef<HTMLTextAreaElement, PostActionTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
PostActionTextarea.displayName = "PostActionTextarea";

/* ==========================================================================
   [방어벽 5] 완전 격리형 로컬 신고 모달 컴포넌트
   ========================================================================== */
interface PostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCategory: string;
  setReportCategory: (cat: string) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  reportSubmitted: boolean;
  onSubmit: () => void;
}

const PostReportModal = ({
  isOpen,
  onClose,
  reportCategory,
  setReportCategory,
  reportReason,
  setReportReason,
  reportSubmitted,
  onSubmit
}: PostReportModalProps) => {
  if (!isOpen) return null;

  const reportCategories = [
    '스팸/광고',
    '욕설/혐오 표현',
    '허위 정보',
    '개인정보 침해',
    '저작권 침해',
    '기타',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-500">
            <Icons.AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">게시글 신고</span>
          </div>
          <PostActionButton
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <Icons.X className="w-5 h-5" />
          </PostActionButton>
        </div>

        {reportSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <p className="font-semibold text-gray-900 mb-1">신고가 접수되었습니다</p>
            <p className="text-sm text-gray-500">검토 후 적절한 조치를 취하겠습니다.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 유형 <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reportCategories.map((cat) => (
                  <PostActionButton
                    key={cat}
                    onClick={() => setReportCategory(cat)}
                    className={`px-3 py-2 rounded-lg border text-left transition-all ${
                      reportCategory === cat
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={{ fontSize: '13px' }}
                  >
                    {cat}
                  </PostActionButton>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유 <span className="text-red-400">*</span>
              </label>
              <PostActionTextarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="신고 사유를 구체적으로 작성해 주세요. (최소 10자 이상)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none text-gray-800"
                style={{ fontSize: '14px' }}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{reportReason.length}자</p>
            </div>

            <div className="flex gap-2 pt-1">
              <PostActionButton
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ fontSize: '14px' }}
              >
                취소
              </PostActionButton>
              <PostActionButton
                onClick={onSubmit}
                disabled={!reportCategory || reportReason.trim().length < 10}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                  reportCategory && reportReason.trim().length >= 10
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                style={{ fontSize: '14px' }}
              >
                신고 접수
              </PostActionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


/* ==========================================================================
   메인 CommunityPost 컴포넌트
   ========================================================================== */
export default function CommunityPost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [posts, setPosts] = useState(initialPosts);
  const [newComment, setNewComment] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
          <PostActionButton
            onClick={() => navigate('/community')}
            className="px-4 py-2 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-colors"
          >
            커뮤니티로 돌아가기
          </PostActionButton>
        </div>
      </div>
    );
  }

  const handlePostLike = () => {
    setPosts(posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
        };
      }
      return p;
    }));
  };

  const handleCommentLike = (commentId: string) => {
    setPosts(posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          commentList: p.commentList.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes - 1 : c.likes + 1,
              };
            }
            return c;
          }),
        };
      }
      return p;
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: '나',
      avatar: '😊',
      content: newComment.trim(),
      timestamp: '방금 전',
      likes: 0,
      isLiked: false,
    };
    setPosts(posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments + 1,
          commentList: [...p.commentList, comment],
        };
      }
      return p;
    }));
    setNewComment('');
  };

  const handleReportSubmit = () => {
    if (!reportCategory || !reportReason.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportForm(false);
      setReportSubmitted(false);
      setReportReason('');
      setReportCategory('');
    }, 2000);
  };

  const handleCloseReportModal = () => {
    setShowReportForm(false);
    setReportReason('');
    setReportCategory('');
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold text-gray-900 mt-4 mb-1">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="text-gray-700 ml-4 list-disc" style={{ fontSize: '15px', lineHeight: '1.7' }}>
            {line.slice(2)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return (
        <p key={i} className="text-gray-700" style={{ fontSize: '15px', lineHeight: '1.7' }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back Button */}
        <PostActionButton
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#00C9A7] transition-colors mb-6"
          style={{ fontSize: '14px' }}
        >
          <Icons.ArrowLeft className="w-4 h-4" />
          커뮤니티로 돌아가기
        </PostActionButton>

        {/* Post Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {/* Post Header */}
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                  {post.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{post.author}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{post.timestamp}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: '#E0F7F3', color: '#00A88E' }}
                  >
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Report Button */}
              <PostActionButton
                onClick={() => setShowReportForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                style={{ fontSize: '13px' }}
              >
                <Icons.Flag className="w-3.5 h-3.5" />
                신고
              </PostActionButton>
            </div>

            {/* Title */}
            <h1 className="text-gray-900 mb-5" style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.4' }}>
              {post.title}
            </h1>
          </div>

          {/* Full Content */}
          <div className="px-6 pb-4 space-y-1">
            {renderContent(post.fullContent)}
          </div>

          {/* Tags */}
          <div className="px-6 pb-4 flex flex-wrap gap-2">
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
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            <PostActionButton
              onClick={handlePostLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                post.isLiked
                  ? 'bg-[#E0F7F3] text-[#00C9A7]'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              style={{ fontSize: '14px' }}
            >
              <Icons.ThumbsUp
                className="w-4 h-4"
                fill={post.isLiked ? '#00C9A7' : 'none'}
              />
              <span className="font-medium">{post.likes}</span>
              <span>좋아요</span>
            </PostActionButton>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500">
              <Icons.MessageSquare className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>댓글 {post.commentList.length}</span>
            </div>
          </div>
        </div>

        {/* Isolation Report Modal */}
        <PostReportModal
          isOpen={showReportForm}
          onClose={handleCloseReportModal}
          reportCategory={reportCategory}
          setReportCategory={setReportCategory}
          reportReason={reportReason}
          setReportReason={setReportReason}
          reportSubmitted={reportSubmitted}
          onSubmit={handleReportSubmit}
        />

        {/* Comments Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>
              댓글 <span className="text-[#00C9A7]">{post.commentList.length}</span>
            </h2>
          </div>

          {/* Comment List */}
          <div className="divide-y divide-gray-50">
            {post.commentList.length === 0 ? (
              <div className="py-10 text-center text-gray-400" style={{ fontSize: '14px' }}>
                첫 댓글을 남겨보세요!
              </div>
            ) : (
              post.commentList.map((comment) => (
                <div key={comment.id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {comment.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900" style={{ fontSize: '14px' }}>
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-400">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700 mb-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {comment.content}
                      </p>
                      <PostActionButton
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                          comment.isLiked
                            ? 'text-[#00C9A7] bg-[#E0F7F3]'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        style={{ fontSize: '12px' }}
                      >
                        <Icons.ThumbsUp
                          className="w-3.5 h-3.5"
                          fill={comment.isLiked ? '#00C9A7' : 'none'}
                        />
                        <span>{comment.likes}</span>
                      </PostActionButton>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex gap-3 items-end">
              <div className="w-9 h-9 rounded-full bg-[#E0F7F3] flex items-center justify-center text-lg flex-shrink-0">
                😊
              </div>
              <div className="flex-1">
                <PostActionTextarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAddComment();
                    }
                  }}
                  placeholder="댓글을 작성하세요... (Ctrl+Enter로 등록)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent resize-none text-gray-800"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <PostActionButton
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  newComment.trim()
                    ? 'bg-[#00C9A7] text-white hover:bg-[#00A88E]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Icons.Send className="w-4 h-4" />
              </PostActionButton>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}