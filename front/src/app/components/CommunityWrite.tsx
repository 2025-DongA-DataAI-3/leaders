import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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

const API_BASE = 'http://localhost:5000';

export default function CommunityWrite() {
  const navigate = useNavigate();

  // DB에서 불러온 전체 카테고리 목록
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);

  // 1단계: 대분류 선택
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  // 2단계: 소분류 선택 (post_keyword_id 저장)
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── 카테고리 목록 불러오기 ──
  useEffect(() => {
    fetch(`${API_BASE}/api/community/categories`)
      .then(res => res.json())
      .then((data: { majorcategory: string; subcategory: string; post_keyword_id?: string }[]) => {
        // post_keyword_id가 응답에 없을 수 있으니, 별도 엔드포인트가 있다면 그걸 우선 사용
        // 여기서는 majorcategory/subcategory만 내려온다고 가정하고 fallback 처리
        setKeywords(data as KeywordRow[]);
      })
      .catch(err => console.error('카테고리 로드 실패:', err));
  }, []);

  // 대분류 목록 (전체 제외, 중복 제거)
  const majorCategories = Array.from(new Set(keywords.map(k => k.majorcategory)));

  // 선택된 대분류에 속한 소분류 목록
  const subCategories = keywords.filter(k => k.majorcategory === selectedMajor);

  const handleSelectMajor = (major: string) => {
    setSelectedMajor(major);
    setSelectedKeywordId(''); // 대분류 바뀌면 소분류 선택 초기화
  };

  const handleSubmit = async () => {
    const userId = localStorage.getItem('user_id');

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
    if (!content.trim()) {
      alert('본문을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: title.trim(),
          content: content.trim(),
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
    } catch (err) {
      console.error('게시글 등록 에러:', err);
      alert('서버 연결에 실패했습니다.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate('/community');
      }
    } else {
      navigate('/community');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F8F5] via-[#F0FDFA] to-[#D5F3ED] py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          <CommButton
            onClick={() => navigate('/community')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base font-medium">커뮤니티</span>
          </CommButton>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">글쓰기</h1>
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

            {/* 텍스트 서식 툴바 (시각적 요소만, 기능 미구현) */}
            <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-xl">
              <CommButton type="button" className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="굵게">
                <Bold className="w-4 h-4" />
              </CommButton>
              <CommButton type="button" className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="기울임">
                <Italic className="w-4 h-4" />
              </CommButton>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <CommButton type="button" className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="링크 삽입">
                <LinkIcon className="w-4 h-4" />
              </CommButton>
              <CommButton type="button" className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600" title="이미지 첨부">
                <Image className="w-4 h-4" />
              </CommButton>
            </div>

            <CommTextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="창업자들과 공유하고 싶은 경험이나 이야기를 자유롭게 적어보세요."
              className="w-full px-4 py-4 border border-gray-200 border-t-0 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all text-base resize-none"
              rows={12}
              maxLength={5000}
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {content.length}/5000
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
              {submitting ? '등록 중...' : '등록하기'}
            </CommButton>
          </div>
        </CommCard>

        {/* 작성 가이드 */}
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
      </div>
    </div>
  );
}