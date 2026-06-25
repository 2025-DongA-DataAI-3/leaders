import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Login() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      alert("아이디와 비밀번호를 모두 입력해 주세요!");
      return;
    }
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("userName", data.user.nickname);
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
          localStorage.setItem("runTutorialTrigger", "true");
        }
        navigate('/');
      } else {
        alert(data.message || "로그인 실패! 아이디와 비밀번호를 확인하세요.");
      }
    } catch (error) {
      alert("서버 연결 실패! 백엔드 서버가 켜져 있는지 확인하세요.");
    }
  };

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/login`;
    sessionStorage.setItem('oauth_provider', 'google');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=email profile&prompt=select_account`;
  };

  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/login`;
    sessionStorage.setItem('oauth_provider', 'kakao');
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=login`;
  };

  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/login`;
    const STATE = Math.random().toString(36).substring(2);
    sessionStorage.setItem('naver_state', STATE);
    sessionStorage.setItem('oauth_provider', 'naver');
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return;

    const oauthProvider = sessionStorage.getItem('oauth_provider');
    const savedNaverState = sessionStorage.getItem('naver_state');

    let provider = 'kakao';
    let endpoint = '/oauth/kakao';
    let body: any = { code };

    if (oauthProvider === 'google') {
      provider = 'google';
      endpoint = '/oauth/google/redirect';
      body = { code };
    } else if (oauthProvider === 'naver' && state === savedNaverState) {
      provider = 'naver';
      endpoint = '/oauth/naver';
      body = { code, state };
    }

    sessionStorage.removeItem('oauth_provider');
    sessionStorage.removeItem('naver_state');

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginProvider', provider);
        localStorage.setItem('userName', data.user.nickname);
        localStorage.setItem('user_id', data.user.user_id);
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
          localStorage.setItem("runTutorialTrigger", "true");
        }
        navigate('/');
      })
      .catch(() => alert('소셜 로그인 실패! 다시 시도해주세요.'));
  }, []);

  // 동그란 소셜 버튼 스타일
  const circleBtn: React.CSSProperties = {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "transform 0.15s",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "20px"
    } as React.CSSProperties}>

      <div style={{
        backgroundColor: "white", padding: "40px 30px",
        borderRadius: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        width: "360px", textAlign: "center"
      } as React.CSSProperties}>

        {/* 로고 */}
        <div style={{ marginBottom: "25px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/logo.png" alt="TrendPilot" style={{ width: "60px", height: "60px" }} />
          <h2 style={{ margin: "10px 0 5px 0", fontWeight: "bold", color: "#111" }}>TrendPilot</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>서비스 한 줄 설명</p>
        </div>

        {/* 일반 로그인 폼 */}
        <form onSubmit={handleLocalLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" } as React.CSSProperties}>
          <input
            type="text" placeholder="아이디 입력" autoComplete="username"
            value={userId} onChange={(e) => setUserId(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" } as React.CSSProperties}
          />
          <input
            type="password" placeholder="비밀번호 입력" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" } as React.CSSProperties}
          />
          <button type="submit" style={{
            width: "100%", height: "45px",
            backgroundColor: "#00C9A7", color: "white",
            border: "none", borderRadius: "8px",
            fontSize: "15px", fontWeight: "bold", cursor: "pointer",
          } as React.CSSProperties}>
            로그인
          </button>
        </form>

        {/* 비밀번호 찾기 버튼 */}
        <div style={{ textAlign: "right", marginBottom: "20px" }}>
          <a href="/forgot-password" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>
            비밀번호를 잊으셨나요?
          </a>
        </div>

        {/* SNS LOGIN 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#eee" }} />
          <span style={{ color: "#aaa", fontSize: "12px", whiteSpace: "nowrap" }}>SNS LOGIN</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#eee" }} />
        </div>

        {/* 동그란 소셜 버튼 3개 */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>

          {/* 카카오 */}
          <button type="button" onClick={handleKakaoLogin} title="카카오 로그인"
            style={{ ...circleBtn, backgroundColor: "#FEE500" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd" clipRule="evenodd"
                d="M12 3C6.477 3 2 6.253 2 10.253c0 2.625 1.767 4.929 4.432 6.234l-1.136 4.145a.414.414 0 00.617.465l4.814-3.207c.422.052.854.079 1.273.079 5.523 0 10-3.253 10-7.253S17.523 3 12 3z"
                fill="#000000" fillOpacity="0.9"
              />
            </svg>
          </button>

          {/* 네이버 */}
          <button type="button" onClick={handleNaverLogin} title="네이버 로그인"
            style={{ ...circleBtn, backgroundColor: "#03C75A" }}>
            <span style={{ color: "white", fontWeight: "900", fontSize: "20px", fontFamily: "sans-serif", lineHeight: 1 }}>N</span>
          </button>

          {/* 구글 */}
          <button type="button" onClick={handleGoogleLogin} title="구글 로그인"
            style={{ ...circleBtn, backgroundColor: "#fff", border: "1px solid #ddd" }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>

        </div>

        <div style={{ marginTop: "24px", fontSize: "13px", color: "#666" }}>
          계정이 없나요?{" "}
          <a href="/signup" style={{ color: "#00C9A7", fontWeight: "bold", textDecoration: "underline" }}>
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
}