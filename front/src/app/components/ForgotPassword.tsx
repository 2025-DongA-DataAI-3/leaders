import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    // 인증 링크 발송 시뮬레이션
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F7F3] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#00C9A7] mb-4">
              <Activity className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trendpilot</h1>
          </div>

          {/* 로그인으로 돌아가기 */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors mb-6 w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">로그인으로 돌아가기</span>
          </button>

          {!emailSent ? (
            <>
              {/* 제목 및 설명 */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h2>
                <p className="text-gray-600 text-sm">
                  가입한 이메일을 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              {/* 이메일 입력 폼 */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    이메일 주소
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-[#00C9A7] text-white rounded-lg hover:bg-[#00A88E] transition-all font-medium"
                >
                  인증 링크 발송
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E0F7F3] mb-4">
                <Mail className="w-8 h-8 text-[#00C9A7]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인하세요</h3>
              <p className="text-gray-600 text-sm mb-6">
                <span className="font-medium text-[#00C9A7]">{email}</span>로<br />
                비밀번호 재설정 링크를 보냈습니다.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="text-[#00C9A7] hover:underline font-medium text-sm"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
