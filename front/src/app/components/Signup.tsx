import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🆕 RHY : SPA 방식의 부드러운 페이지 이동을 위해 라우터 훅 도입

export default function Signup() {
  // 🆕 RHY : 페이지 이동을 제어할 네비게이트 함수 선언
  const navigate = useNavigate();

  // 🆕 회원가입 입력값들을 안전하게 보관할 소중한 바구니 4형제
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // 🆕 가입하기 버튼을 눌렀을 때 백엔드 5000번 가입 주소로 쏴주는 명품 함수!
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !password || !nickname || !email) {
      alert("모든 입력창을 빈칸 없이 꽉꽉 채워주세요!!");
      return;
    }

    try {
      // ⭐ 백엔드 server.js의 회원가입 창구(/api/signup) 포트 4000번으로 정확히 조준!!!
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 은혜님의 소중한 가입 상자를 이쁘게 포장해서 백엔드로 발사!
        body: JSON.stringify({ 
          userId: userId, 
          password: password, 
          nickname: nickname, 
          email: email 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "회원가입이 완벽하게 대성공했습니다! 🎉");
        // 🔄 RHY [핵심 수정] 회원가입 성공 시 로그인 화면으로 라우팅 변경
        // 기존 : window.location.href = "/"; // 가입 성공하면 기분 좋게 로그인 창으로 자동 이동!
        // 변경 : 새로고침 없이 로그인 전용 주소인 '/login'으로 부드럽게 이동
        navigate('/login')
          // ⚠️ 주의: App.tsx(라우터 설정)에 '/login' 경로와 로그인 컴포넌트가 매핑되어 있어야 정상 작동합니다.
        

      } else {
        alert(data.message || "회원가입 실패! 이미 있는 아이디인지 확인하세요 😭");
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      alert("서버 연결 실패 5000번 백엔드 서버가 잘 켜져 있는지 확인하세요!");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px"
    } as React.CSSProperties}>
      
      {/* 흰색 카드 형태의 회원가입 박스 */}
      <div style={{
        backgroundColor: "white",
        padding: "40px 30px",
        borderRadius: "16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        width: "360px",
        textAlign: "center"
      } as React.CSSProperties}>
        
        {/* 타이틀 로고 */}
        <div style={{ marginBottom: "25px" }}>
          <span style={{ fontSize: "40px" }}>📝</span>
          <h2 style={{ margin: "10px 0 5px 0", fontWeight: "bold", color: "#111" }}>TrendPilot</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>새로운 계정 만들기</p>
        </div>

        {/* 🧡 은혜님의 꽉 찬 회원가입 폼 주머니 */}
        <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" } as React.CSSProperties}>
          <input
            type="text"
            placeholder="사용할 아이디 입력"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" } as React.CSSProperties}
          />
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" } as React.CSSProperties}
          />
          <input
            type="text"
            placeholder="닉네임 입력 (예: 트렌드쿠키)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" } as React.CSSProperties}
          />
          <input
            type="email"
            placeholder="이메일 주소 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" } as React.CSSProperties}
          />
          
          <button
            type="submit"
            style={{
              width: "100%",
              height: "45px",
              backgroundColor: "#00C7ae",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "10px"
            } as React.CSSProperties}
          >
            가입하기 🎉
          </button>
        </form>

        {/* 로그인 창으로 돌아가는 순정 링크 */}
        <div style={{ marginTop: "20px", fontSize: "13px", color: "#666" }}>
          이미 계정이 있으신가요?{" "}
          {/* 기존 : 
           <a 
            href="/" 
            style={{ color: "#00C7ae", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
          >
            로그인하러 가기
          </a> */}

          {/* 🔄 RHY [변경 사항] 기존 <a> 태그의 href="/" 대신 span 태그와 navigate 사용
            - 이 링크를 누를 때도 메인(진단 페이지)이 아닌 로그인 화면으로 부드럽게 넘어가도록 통일했습니다.
          */}
          <span 
            onClick={() => navigate('/login')} 
            style={{ color: "#00C7ae", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
          >
            로그인하러 가기
          </span>



        </div>
      </div>
    </div>
  );
}