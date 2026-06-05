import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Activity, AlertTriangle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(false);

  // 구글 GSI 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      (window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
    };
    document.body.appendChild(script);
  }, []);

  // 구글 콜백
  const handleGoogleCallback = async (response: any) => {
    try {
      const res = await fetch('http://localhost:5000/oauth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      loginSuccess('google', data.user.nickname);
    } catch {
      setLoginError(true);
    }
  };

  // 카카오 로그인
  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = 'http://localhost:5173/login';
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=login`;
  };

  // 네이버 로그인
  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = 'http://localhost:5173/login';
    const STATE = Math.random().toString(36).substring(2);
    sessionStorage.setItem('naver_state', STATE);
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
  };

  // 구글 버튼 클릭
  const handleGoogleLogin = () => {
    (window as any).google.accounts.id.prompt();
  };

  // 카카오/네이버 인가코드 처리 (콜백)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) return;

    // 네이버는 state가 있음
    const provider = state ? 'naver' : 'kakao';
    const endpoint = `http://localhost:5000/oauth/${provider}`;
    const body = provider === 'naver' ? { code, state } : { code };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        loginSuccess(provider, data.user.nickname);
      })
      .catch(() => setLoginError(true));

  }, []);

  const loginSuccess = (provider: string, nickname: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loginProvider', provider);
    localStorage.setItem('userName', nickname);
    localStorage.setItem('runTutorialTrigger', 'true');
    navigate('/');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TrendPilot</h1>
            <p className="text-gray-600">
              서비스 한 줄 설명
            </p>
          </div>

          {/* 로그인 실패 메시지 */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm">로그인에 실패했습니다.</p>
                <p className="text-red-600 text-sm">다시 시도해주세요.</p>
              </div>
            </div>
          )}

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => {
                setLoginError(false);
                handleGoogleLogin();
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-[#00C9A7] hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium">구글로 시작하기</span>
            </button>

            <button
              onClick={() => {
                setLoginError(false);
                handleKakaoLogin();
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#FEE500] rounded-lg hover:bg-[#FDD835] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3C6.477 3 2 6.253 2 10.253c0 2.625 1.767 4.929 4.432 6.234l-1.136 4.145a.414.414 0 00.617.465l4.814-3.207c.422.052.854.079 1.273.079 5.523 0 10-3.253 10-7.253S17.523 3 12 3z"
                  fill="#000000"
                  fillOpacity="0.9"
                />
              </svg>
              <span className="text-gray-900 font-medium">카카오로 시작하기</span>
            </button>

            <button
              onClick={() => {
                setLoginError(false);
                handleNaverLogin();
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#03C75A] rounded-lg hover:bg-[#02B351] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              <span className="text-white font-medium">네이버로 시작하기</span>
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 이메일 로그인 */}
          <button
            onClick={() => {
              setLoginError(false);
            }}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
          >
            이메일 로그인
          </button>

          {/* 회원가입 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              계정이 없나요?{" "}
              <Link to="/signup" className="text-[#00C9A7] hover:underline font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}