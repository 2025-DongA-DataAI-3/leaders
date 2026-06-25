import { useState, useEffect, forwardRef, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, cloneElement, isValidElement, type SVGProps } from 'react';
import { useParams, useNavigate } from 'react-router';

/* ==========================================================================
   Slot 컴포넌트
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
   로컬 아이콘 팩
   ========================================================================== */
const Icons = {
  ArrowLeft: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  ),
  Flag: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
  ),
  MessageSquare: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Eye: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
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
   공통 버튼/텍스트에어리어
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
   신고 모달 (UI만 유지, 서버 저장 없음)
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
   타입 정의 (DB 응답)
   ========================================================================== */
interface CommentRow {
  comment_id: string;
  user_id: string;
  author: string;
  content: string;
  created_at: string;
}

interface PostDetail {
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
  comments: CommentRow[];
}

const API_BASE = '';

/* ==========================================================================
   유틸: 상대시간 포맷
   ========================================================================== */
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

/* ==========================================================================
   본문 렌더링 (마크다운 비슷한 간단 포맷)
   ========================================================================== */
function renderContent(text: string) {
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
}

/* ==========================================================================
   메인 CommunityPost 컴포넌트
   ========================================================================== */
export default function CommunityPost() {
  const { id: postId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const userId = localStorage.getItem('user_id');

  // ── 게시글 상세 불러오기 ──
  const fetchPost = () => {
    if (!postId) return;
    setLoading(true);

    fetch(`${API_BASE}/api/posts/${postId}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data: PostDetail | null) => {
        if (data) setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('게시글 조회 실패:', err);
        setNotFound(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // ── 댓글 작성 ──
  const handleAddComment = async () => {
    if (!newComment.trim() || !post) return;

    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    setSubmittingComment(true);

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, content: newComment.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || '댓글 등록에 실패했습니다.');
        setSubmittingComment(false);
        return;
      }

      // 새 댓글을 목록 끝에 추가
      setPost(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev);
      setNewComment('');
    } catch (err) {
      console.error('댓글 작성 에러:', err);
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── 신고 (UI만, 서버 저장 없음) ──
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

  // ── 로딩 / 에러 상태 ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (notFound || !post) {
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
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{post.author}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{formatTimestamp(post.created_at)}</span>
                  </div>
                  {post.subcategory && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: '#E0F7F3', color: '#00A88E' }}
                    >
                      {post.subcategory}
                    </span>
                  )}
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
            {renderContent(post.content)}
          </div>

          {/* Post Meta (조회수 / 댓글수) */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500">
              <Icons.Eye className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>조회 {post.view_count}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500">
              <Icons.MessageSquare className="w-4 h-4" />
              <span style={{ fontSize: '14px' }}>댓글 {post.comments.length}</span>
            </div>
          </div>
        </div>

        {/* Report Modal */}
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
              댓글 <span className="text-[#00C9A7]">{post.comments.length}</span>
            </h2>
          </div>

          {/* Comment List */}
          <div className="divide-y divide-gray-50">
            {post.comments.length === 0 ? (
              <div className="py-10 text-center text-gray-400" style={{ fontSize: '14px' }}>
                첫 댓글을 남겨보세요!
              </div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.comment_id} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900" style={{ fontSize: '14px' }}>
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-400">{formatTimestamp(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {comment.content}
                      </p>
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
                  disabled={submittingComment}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent resize-none text-gray-800 disabled:opacity-50"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <PostActionButton
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  newComment.trim() && !submittingComment
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