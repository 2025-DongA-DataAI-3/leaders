import  React,  { useState}  from  'react';
import  { useNavigate }from 'react-router';
import  { ArrowLeft,Bold,  Italic, Link as LinkIcon, Image, X}  from  'lucide-react';

//  ================= [로컬 컴포넌트 시작:CommCard]  =================
interface CommCardProps extends React.HTMLAttributes<HTMLDivElement> {}
const CommCard=  React.forwardRef<HTMLDivElement,  CommCardProps>(({ className,...props },ref) =>{
return  (
<div
ref={ref}
className={`${className ||''}`}
{...props}
/>
);
});
CommCard.displayName  = 'CommCard';
//  ================= [로컬 컴포넌트 끝:CommCard]  =================


//  ================= [로컬 컴포넌트 시작:CommButton]  =================
interface CommButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>  {}
const CommButton=  React.forwardRef<HTMLButtonElement, CommButtonProps>(({ className, ...props }, ref) => {
return  (
<button
ref={ref}
className={`${className ||''}`}
{...props}
/>
);
});
CommButton.displayName  = 'CommButton';
//  ================= [로컬 컴포넌트 끝:CommButton]  =================


//  ================= [로컬 컴포넌트 시작:CommInput] =================
interface CommInputProps extends  React.InputHTMLAttributes<HTMLInputElement> {}
const CommInput =React.forwardRef<HTMLInputElement, CommInputProps>(({className, ...props}, ref)=> {
return  (
<input
ref={ref}
className={`${className ||''}`}
{...props}
/>
);
});
CommInput.displayName = 'CommInput';
//  ================= [로컬 컴포넌트 끝:CommInput] =================


//  ================= [로컬 컴포넌트 시작:CommTextArea]  =================
interface CommTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>  {}
const CommTextArea=  React.forwardRef<HTMLTextAreaElement, CommTextAreaProps>(({ className, ...props }, ref) => {
return  (
<textarea
ref={ref}
className={`${className ||''}`}
{...props}
/>
);
});
CommTextArea.displayName  = 'CommTextArea';
//  ================= [로컬 컴포넌트 끝:CommTextArea]  =================


export  default function CommunityWrite() {
const navigate=  useNavigate();
const [selectedCategory,setSelectedCategory] = useState<string>('');
const [title, setTitle]=  useState('');
const [content, setContent]=  useState('');
const [tagInput,setTagInput] = useState('');
const [tags,setTags] = useState<string[]>([]);

const categories=  ['IT/소프트웨어', '제조/생산','유통/서비스', '바이오/헬스케어','친환경/에너지'];

const handleTagInput=  (e: React.KeyboardEvent<HTMLInputElement>)=> {
if  (e.key  === 'Enter' || e.key===  ' '){
e.preventDefault();
const newTag=  tagInput.trim().replace(/^#/, '');
if  (newTag &&tags.length  < 5 && !tags.includes(newTag)){
setTags([...tags, newTag]);
setTagInput('');
}
}
};

const removeTag =(tagToRemove:  string) =>{
setTags(tags.filter(tag =>tag  !== tagToRemove));
};

const handleSubmit=  ()  =>  {
if  (!selectedCategory) {
alert('카테고리를 선택해주세요.');
return;
}
if  (!title.trim()) {
alert('제목을 입력해주세요.');
return;
}
if  (!content.trim()) {
alert('본문을 입력해주세요.');
return;
}

//  [리팩토링]  여기에  실제  게시글  등록  로직  추가
//  1.  여기에  나중에  axios나 fetch 같은 실제 게시글 등록 로직이 들어올 거야.
//  2.  등록이  성공하면  서버에서  새  글의  id(예:  1)를  넘겨주게  돼.

alert('게시글이 등록되었습니다!');

const newPostId =1; //★ 서버에서받아왔다고 가정하는임시 id값이야.

//  라우터  경로(`community-post/:id`)로  이동
navigate(`/community-post/${newPostId}`); 
};

const handleCancel=  ()  =>  {
if  (title  ||  content ||tags.length  > 0){
if  (confirm('작성  중인  내용이  있습니다. 정말취소하시겠습니까?')) {
navigate('/community');
}
} else{
navigate('/community');
}
};
//  여기까지가  [리팩토링 파트]

return  (
  <div  className="min-h-screen bg-gradient-to-br from-[#E8F8F5] via-[#F0FDFA]to-[#D5F3ED] py-8px-6">
    <div  className="max-w-4xl  mx-auto">
      {/* 헤더*/}
      <div  className="mb-6 flexitems-center gap-4">
        <CommButton
          onClick={() =>navigate('/community')}
          className="flex items-centergap-2  text-gray-600 hover:text-[#00C9A7]transition-colors"
        > {/* ★ 기존 구형 button에서 로컬 컴포넌트로 치환됨 */}
          <ArrowLeft  className="w-5  h-5"  />
          <span className="text-basefont-medium">커뮤니티</span>
        </CommButton> {/* ★ 기존 구형 button에서 로컬 컴포넌트로 치환됨 */}
        <div  className="h-6  w-px  bg-gray-300"></div>
        <h1 className="text-2xl font-boldtext-gray-900">글쓰기</h1>
      </div>

      {/* 메인카드 */}
      <CommCard className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      {/* 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              카테고리 선택 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <CommButton
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-[#00C9A7] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </CommButton>
              ))}
            </div>
          </div>

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
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              본문 <span className="text-red-500">*</span>
            </label>

            {/* 텍스트 서식 툴바 */}
            <div className="flex items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-xl">
              <CommButton
                type="button"
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                title="굵게"
              >
                <Bold className="w-4 h-4" />
              </CommButton>
              <CommButton
                type="button"
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                title="기울임"
              >
                <Italic className="w-4 h-4" />
              </CommButton>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <CommButton
                type="button"
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                title="링크 삽입"
              >
                <LinkIcon className="w-4 h-4" />
              </CommButton>
              <CommButton
                type="button"
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                title="이미지 첨부"
              >
                <Image className="w-4 h-4" />
              </CommButton>
            </div>

            {/* 텍스트 영역 */}
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

          {/* 태그 입력 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              태그
            </label>

            {/* 입력된 태그 표시 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#E0F7F3] text-[#00C9A7] rounded-full text-sm font-medium"
                  >
                    #{tag}
                    <CommButton
                      onClick={() => removeTag(tag)}
                      className="hover:bg-[#00C9A7] hover:text-white rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </CommButton>
                  </span>
                ))}
              </div>
            )}

            <CommInput
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="#태그 입력 (최대 5개)"
              disabled={tags.length >= 5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all text-base disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter 또는 Space로 태그 추가 ({tags.length}/5)
            </p>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3">
            <CommButton
              onClick={handleCancel}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all font-medium"
            >
              취소
            </CommButton>
            <CommButton
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-[#00C9A7] to-[#00A88E] text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              등록하기
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
            <li className="flex items-start gap-2">
              <span className="text-[#00C9A7] font-bold">•</span>
              <span>태그를 활용하면 다른 사용자들이 게시글을 쉽게 찾을 수 있습니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}