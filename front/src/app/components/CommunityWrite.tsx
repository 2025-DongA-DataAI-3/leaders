import React, { useState, useEffect, useRef} from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Bold, Italic, Link as LinkIcon, Image } from 'lucide-react';

// ================= [로컬 컴포넌트: CommCard] =================
interface CommCardProps extends React.HTMLAttributes<HTMLDivElement> {}
const CommCard = React.forwardRef<HTMLDivElement, CommCardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${className || ''}`} {...props} />
));
CommCard.displayName = 'CommCard';

// ================= [로컬 컴포넌트: CommButton] =================
interface CommButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
const CommButton = React.forwardRef<HTMLButtonElement, CommButtonProps>(({ className, ...props }, ref) => (
  <button ref={ref} className={`${className || ''}`} {...props} />
));
CommButton.displayName = 'CommButton';

// ================= [로컬 컴포넌트: CommInput] =================
interface CommInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const CommInput = React.forwardRef<HTMLInputElement, CommInputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${className || ''}`} {...props} />
));
CommInput.displayName = 'CommInput';

// ================= [로컬 컴포넌트: CommTextArea] =================
interface CommTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const CommTextArea = React.forwardRef<HTMLTextAreaElement, CommTextAreaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`${className || ''}`} {...props} />
));
CommTextArea.displayName = 'CommTextArea';

// ==========================================
// 카테고리 타입 (DB: post_keywords)
// ==========================================
interface KeywordRow {
  post_keyword_id: string;
  majorcategory: string;
  subcategory: string;
}

// 게시글 상세 (수정 모드 진입 시 사용)
interface PostDetail {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  post_keyword_id: string | null;
  majorcategory: string | null;
  subcategory: string | null;
}

const API_BASE = '';

export default function CommunityWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editPostId = searchParams.get('edit'); // ?edit=post_id 가 있으면 수정 모드

  const isEditMode = !!editPostId;

  // DB에서 불러온 전체 카테고리 목록
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);

  // 1단계: 대분류 선택
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  // 2단계: 소분류 선택 (post_keyword_id 저장)
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);

  const userId = localStorage.getItem('user_id');


  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);


  // ── 카테고리 목록 불러오기 ──
  useEffect(() => {
    fetch(`${API_BASE}/api/community/categories`)
      .then(res => res.json())
      .then((data: KeywordRow[]) => {
        setKeywords(data);
      })
      .catch(err => console.error('카테고리 로드 실패:', err));
  }, []);

  // ── 수정 모드: 기존 게시글 데이터 불러오기 ──
  useEffect(() => {
    if (!editPostId) return;

    fetch(`${API_BASE}/api/posts/${editPostId}`)
      .then(res => res.json())
      .then((data: PostDetail) => {
        if (!data || !data.post_id) {
          alert('게시글을 찾을 수 없습니다.');
          navigate('/my-posts');
          return;
        }

        // 본인 글이 아니면 접근 차단
        if (data.user_id !== userId) {
          alert('본인이 작성한 글만 수정할 수 있습니다.');
          navigate('/my-posts');
          return;
        }

        setTitle(data.title);
        setContent(data.content);
        setTimeout(() => {
          if (editorRef.current) editorRef.current.innerHTML = data.content;
          }, 0);
        if (data.majorcategory) setSelectedMajor(data.majorcategory);
        if (data.post_keyword_id) setSelectedKeywordId(data.post_keyword_id);

        setLoadingPost(false);
      })
      .catch(err => {
        console.error('게시글 로드 실패:', err);
        alert('게시글을 불러오지 못했습니다.');
        navigate('/my-posts');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPostId]);

  // 대분류 목록 (중복 제거)
  const majorCategories = Array.from(new Set(keywords.map(k => k.majorcategory)));

  // 선택된 대분류에 속한 소분류 목록
  const subCategories = keywords.filter(k => k.majorcategory === selectedMajor);

  const handleSelectMajor = (major: string) => {
    setSelectedMajor(major);
    setSelectedKeywordId(''); // 대분류 바뀌면 소분류 선택 초기화
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!selectedMajor) {
      alert('카테고리(대분류)를 선택해주세요.');
      return;
    }
    if (!selectedKeywordId) {
      alert('카테고리(소분류)를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    const rawText = editorRef.current?.innerText?.trim() ?? '';
      if (!rawText) {
        alert('본문을 입력해주세요.');
        setSubmitting(false);
        return;
      }

    setSubmitting(true);

    try {
      if (isEditMode) {
        // ── 수정 ──
        const res = await fetch(`${API_BASE}/api/posts/${editPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            title: title.trim(),
            content: editorRef.current?.innerHTML?.trim() ?? '',
            post_keyword_id: selectedKeywordId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(data.message || '게시글 수정에 실패했습니다.');
          setSubmitting(false);
          return;
        }

        navigate(`/community-post/${editPostId}`);
      } else {
        // ── 새 글 작성 ──
        const res = await fetch(`${API_BASE}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            title: title.trim(),
            content: editorRef.current?.innerHTML?.trim() ?? '',
            post_keyword_id: selectedKeywordId,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(data.message || '게시글 등록에 실패했습니다.');
          setSubmitting(false);
          return;
        }

        navigate(`/community-post/${data.post_id}`);
      }
    } catch (err) {
      console.error('게시글 저장 에러:', err);
      alert('서버 연결에 실패했습니다.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate(isEditMode ? `/community-post/${editPostId}` : '/community');
      }
    } else {
      navigate(isEditMode ? `/community-post/${editPostId}` : '/community');
    }
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8F5] via-[#F0FDFA] to-[#D5F3ED] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          <CommButton
            onClick={() => navigate(isEditMode ? `/community-post/${editPostId}` : '/community')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base font-medium">{isEditMode ? '게시글로 돌아가기' : '커뮤니티'}</span>
          </CommButton>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? '글 수정' : '글쓰기'}</h1>
        </div>

        {/* 메인 카드 */}
        <CommCard className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

          {/* 1단계: 대분류 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {majorCategories.map((major) => (
                <CommButton
                  key={major}
                  onClick={() => handleSelectMajor(major)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedMajor === major
                      ? 'bg-[#00C9A7] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {major}
                </CommButton>
              ))}
            </div>
          </div>

          {/* 2단계: 소분류 선택 (대분류 선택 시에만 표시) */}
          {selectedMajor && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                세부 카테고리 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {subCategories.map((sub) => (
                  <CommButton
                    key={sub.post_keyword_id}
                    onClick={() => setSelectedKeywordId(sub.post_keyword_id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedKeywordId === sub.post_keyword_id
                        ? 'bg-[#00A88E] text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sub.subcategory}
                  </CommButton>
                ))}
              </div>
            </div>
          )}

          {/* 제목 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              제목 <span className="text-red-500">*</span>
            </label>
            <CommInput
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all text-base"
              maxLength={100}
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {title.length}/100
            </div>
          </div>

          {/* 본문 에디터 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              본문 <span className="text-red-500">*</span>
            </label>

            {/* 툴바 */}
            <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-xl">
              <CommButton type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('bold');
                  setIsBold(document.queryCommandState('bold'));  
                }}
                className={`p-2 rounded-lg transition-colors font-bold ${
                  isBold ? 'bg-[#00C9A7] text-white' : 'hover:bg-gray-200 text-gray-600'
                }`} title="굵게">
                <Bold className="w-4 h-4" />
              </CommButton>

              <CommButton type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('italic');
                  setIsItalic(document.queryCommandState('italic'));  
                }}
                className={`p-2 rounded-lg transition-colors italic ${
                  isItalic ? 'bg-[#00C9A7] text-white' : 'hover:bg-gray-200 text-gray-600'
                }`} title="기울임">
                <Italic className="w-4 h-4" />
              </CommButton>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <CommButton type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const url = prompt('링크 URL을 입력하세요:', 'https://');
                  if (url) document.execCommand('createLink', false, url);
                }}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="링크 삽입">
                <LinkIcon className="w-4 h-4" />
              </CommButton>
              <CommButton type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const url = prompt('이미지 URL을 입력하세요:', 'https://');
                  if (url) document.execCommand('insertImage', false, url);
                }}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="이미지 삽입">
                <Image className="w-4 h-4" />
              </CommButton>
            </div>

            {/* 에디터 영역 — relative 추가 */}
            <div className="relative">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="w-full px-4 py-4 border border-gray-200 border-t-0 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-[#00C9A7] text-base min-h-[300px]"
                style={{ lineHeight: '1.7' }}
              />
              {!content && (
                <div
                  className="absolute px-4 text-gray-400 text-base pointer-events-none"
                  style={{ top: '16px', left: 0 }}
                >
                  창업자들과 공유하고 싶은 경험이나 이야기를 자유롭게 적어보세요.
                </div>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-400 text-right">
              {content.replace(/<[^>]*>/g, '').length}/5000
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3">
            <CommButton
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              취소
            </CommButton>
            <CommButton
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              {submitting ? '저장 중...' : (isEditMode ? '수정하기' : '등록하기')}
            </CommButton>
          </div>
        </CommCard>

        {/* 작성 가이드 */}
        {!isEditMode && (
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 글쓰기 가이드</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-[#00C9A7] font-bold">•</span>
                <span>다른 창업자들에게 도움이 될 수 있는 경험이나 노하우를 공유해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00C9A7] font-bold">•</span>
                <span>욕설, 비방, 광고성 게시글은 관리자에 의해 삭제될 수 있습니다.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}