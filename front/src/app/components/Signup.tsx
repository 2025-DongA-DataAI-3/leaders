import React from 'react'
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Activity, Eye, EyeOff } from "lucide-react";

// ================= [로컬 컴포넌트 시작: TrendInput] =================
interface TrendInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const TrendInput = React.forwardRef<HTMLInputElement, TrendInputProps>(
  ({ className, label, type, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent ${className || ""}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
TrendInput.displayName = "TrendInput";
// ================= [로컬 컴포넌트 끝: TrendInput] =================


// ================= [로컬 컴포넌트 시작: TrendCheckbox] =================
interface TrendCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  labelNode: React.ReactNode;
}

const TrendCheckbox = React.forwardRef<HTMLInputElement, TrendCheckboxProps>(
  ({ className, labelNode, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input
          type="checkbox"
          className={`mt-1 w-4 h-4 text-[#00C9A7] border-gray-300 rounded focus:ring-[#00C9A7] ${className || ""}`}
          ref={ref}
          {...props}
        />
        <label className="ml-2 text-sm text-gray-700">
          {labelNode}
        </label>
      </div>
    );
  }
);
TrendCheckbox.displayName = "TrendCheckbox";
// ================= [로컬 컴포넌트 끝: TrendCheckbox] =================


// ================= [로컬 컴포넌트 시작: TrendButton] =================
interface TrendButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const TrendButton = React.forwardRef<HTMLButtonElement, TrendButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`w-full px-6 py-3 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-colors font-medium ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);
TrendButton.displayName = "TrendButton";
// ================= [로컬 컴포넌트 끝: TrendButton] =================


export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.email || !formData.password || !formData.passwordConfirm || !formData.name) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (!formData.agreeTerms || !formData.agreePrivacy) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    // 회원가입 처리
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loginProvider", "email");
    localStorage.setItem("userName", formData.name);

    alert("회원가입이 완료되었습니다!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7F3] to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          {/* 로고 */}
          <div className="text-center mb-8">
            <Link to="/login" className="inline-block">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#00C9A7] mb-4">
                <Activity className="w-9 h-9 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600 text-sm">
              TrendPilot과 함께 트렌드를 분석하세요
            </p>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 이름 */}
            <div>
              <TrendInput
                label="이름"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="홍길동"
                required
              /> {/* ★ 기존 구형 input에서 로컬 컴포넌트(TrendInput)로 치환됨 */}
            </div>

            {/* 이메일 */}
            <div>
              <TrendInput
                label="이메일"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                required
              /> {/* ★ 기존 구형 input에서 로컬 컴포넌트(TrendInput)로 치환됨 */}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <TrendInput
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="8자 이상 입력하세요"
                  className="pr-12"
                  required
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트(TrendInput)로 치환됨 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <TrendInput
                  type={showPasswordConfirm ? "text" : "password"}
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pr-12"
                  required
                /> {/* ★ 기존 구형 input에서 로컬 컴포넌트(TrendInput)로 치환됨 */}
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="pt-2 space-y-3">
              <TrendCheckbox
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                required
                labelNode={
                  <>
                    <a href="#" className="text-[#00C9A7] hover:underline">
                      이용약관
                    </a>
                    에 동의합니다 (필수)
                  </>
                }
              /> {/* ★ 기존 구형 input checkbox에서 로컬 컴포넌트(TrendCheckbox)로 치환됨 */}

              <TrendCheckbox
                name="agreePrivacy"
                checked={formData.agreePrivacy}
                onChange={handleInputChange}
                required
                labelNode={
                  <>
                    <a href="#" className="text-[#00C9A7] hover:underline">
                      개인정보처리방침
                    </a>
                    에 동의합니다 (필수)
                  </>
                }
              /> {/* ★ 기존 구형 input checkbox에서 로컬 컴포넌트(TrendCheckbox)로 치환됨 */}
            </div>

            {/* 회원가입 버튼 */}
            <TrendButton type="submit" className="mt-6">
              회원가입
            </TrendButton> {/* ★ 기존 구형 button에서 로컬 컴포넌트(TrendButton)로 치환됨 */}
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있나요?{" "}
              <Link to="/login" className="text-[#00C9A7] hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}