import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router";
import { User, Mail, Lock, ArrowLeft, Check } from "lucide-react";

// ================= [로컬 컴포넌트 시작: ProfileButton] =================
interface ProfileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ProfileButton = forwardRef<HTMLButtonElement, ProfileButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${className || ""}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ProfileButton.displayName = "ProfileButton";
// ================= [로컬 컴포넌트 끝: ProfileButton] =================

// ================= [로컬 컴포넌트 시작: ProfileInput] =================
interface ProfileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const ProfileInput = forwardRef<HTMLInputElement, ProfileInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent ${className || ""}`}
        {...props}
      />
    );
  }
);
ProfileInput.displayName = "ProfileInput";
// ================= [로컬 컴포넌트 끝: ProfileInput] =================

// ================= [로컬 컴포넌트 시작: ProfileCard] =================
interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-2xl shadow-lg p-8 mb-6 ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ProfileCard.displayName = "ProfileCard";
// ================= [로컬 컴포넌트 끝: ProfileCard] =================


export default function ProfileEdit() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // localStorage에서 현재 사용자 정보 불러오기
    const userName = localStorage.getItem("userName") || "사용자";
    setFormData(prev => ({
      ...prev,
      name: userName,
      email: `${userName.toLowerCase().replace(" ", "")}@example.com`,
    }));
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 비밀번호 변경 시 검증
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        alert("현재 비밀번호를 입력해주세요.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert("새 비밀번호가 일치하지 않습니다.");
        return;
      }
      if (formData.newPassword.length < 6) {
        alert("새 비밀번호는 최소 6자 이상이어야 합니다.");
        return;
      }
    }

    // 이름 업데이트
    localStorage.setItem("userName", formData.name);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("/mypage");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5FFFE] py-8 px-8">
      <div className="max-w-2xl mx-auto">
        <ProfileButton
          onClick={() => navigate("/mypage")}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] mb-6 transition-colors"
        > {/* ★ 기존 구형 button에서 로컬 컴포넌트로 치환됨 */}
          <ArrowLeft className="w-4 h-4" />
          마이페이지로 돌아가기
        </ProfileButton>

        <div className="mb-8">
          <h1 className="mb-2 text-gray-900">회원정보 수정</h1>
          <p className="text-gray-600">
            개인정보를 안전하게 관리하세요.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <ProfileCard> {/* ★ 기존 구형 div 레이아웃에서 로컬 컴포넌트로 치환됨 */}
            <h2 className="mb-6 text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#00C9A7]" />
              기본 정보
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <ProfileInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트로 치환됨 */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <ProfileInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트로 치환됨 */}
              </div>
            </div>
          </ProfileCard> {/* ★ 기존 구형 div 레이아웃에서 로컬 컴포넌트로 치환됨 */}

          <ProfileCard> {/* ★ 기존 구형 div 레이아웃에서 로컬 컴포넌트로 치환됨 */}
            <h2 className="mb-6 text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#00C9A7]" />
              비밀번호 변경
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              비밀번호를 변경하지 않으려면 아래 필드를 비워두세요.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <ProfileInput
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange("currentPassword", e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트로 치환됨 */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <ProfileInput
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트로 치환됨 */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <ProfileInput
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="새 비밀번호를 다시 입력하세요"
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트로 치환됨 */}
              </div>
            </div>
          </ProfileCard> {/* ★ 기존 구형 div 레이아웃에서 로컬 컴포넌트로 치환됨 */}

          <div className="flex gap-3">
            <ProfileButton
              type="button"
              onClick={() => navigate("/mypage")}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            > {/* ★ 기존 구형 button에서 로컬 컴포넌트로 치환됨 */}
              취소
            </ProfileButton>
            <ProfileButton
              type="submit"
              className="flex-1 px-6 py-3 text-white rounded-lg transition-all flex items-center justify-center gap-2"
              style={{ background: saved ? "#10B981" : "#00C9A7" }}
            > {/* ★ 기존 구형 button에서 로컬 컴포넌트로 치환됨 */}
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  저장되었습니다
                </>
              ) : (
                "저장하기"
              )}
            </ProfileButton>
          </div>
        </form>
      </div>
    </div>
  );
}