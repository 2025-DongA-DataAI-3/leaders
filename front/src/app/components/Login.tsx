import React, { useState } from 'react';

export default function Login() {
  // 🆕 일반 로그인 입력값을 보관할 소중한 바구니들
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // 🆕 일반 로그인 버튼을 눌렀을 때 4000번 백엔드로 쏴주는 명품 함수!
  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !password) {
      alert("아이디와 비밀번호를 모두 입력해 주세요쿵야!!! 😡");
      return;
    }

    try {
      // ⭐ [주소 세탁] 은혜님이 띄워놓은 4000번 백엔드 서버의 로그인 엔드포인트로 정확히 조준!!!
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 리액트의 아이디, 비번 바구니를 이쁘게 포장해서 백엔드로 발사!
        body: JSON.stringify({ userId: userId, password: password }),
      });

      const data = await response.json();

      // 🟢 [버그 수정 완료] 존재하지도 않는 data.success 조건 필터를 도려내고, 서버 응답이 성공(ok)이면 무조건 패스!!!
      if (response.ok) {
        alert(data.message || "일반 로그인 대성공! 🚀"); 
        
        // 조원들이 쓰는 방식대로 유저 정보를 로컬 스토리지에 저장!
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("userName", data.user.nickname);
        
        window.location.href = "/"; // 로그인 성공 후 메인 페이지로 당당하게 이동!
      } else {
        alert(data.message || "로그인 실패! 아이디와 비밀번호를 확인하세요 😭");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      alert("서버 연결 실패 😭 4000번 백엔드(server.js)가 켜져 있는지 확인하세요!");
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
      
      {/* 흰색 카드 형태의 로그인 박스 */}
      <div style={{
        backgroundColor: "white",
        padding: "40px 30px",
        borderRadius: "16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        width: "360px",
        textAlign: "center"
      } as React.CSSProperties}>
        
        {/* 로고 아이콘 모양 (TrendPilot) */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "40px" }}>📉</span>
          <h2 style={{ margin: "10px 0 5px 0", fontWeight: "bold", color: "#111" }}>TrendPilot</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>서비스 한 줄 설명</p>
        </div>

        {/* 🧡 은혜님의 일반 로그인 입력창 구역 첫 화면 전면 배치 */}
        <form onSubmit={handleLocalLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" } as React.CSSProperties}>
          <input
            type="text"
            placeholder="아이디 입력"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" } as React.CSSProperties}
          />
          <input
            type="password"
            placeholder="비밀번호 입력"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            } as React.CSSProperties}
          >
            로그인 🚀
          </button>
        </form>

        <div style={{ borderTop: "1px solid #eee", padding: "15px 0", color: "#aaa", fontSize: "12px", marginBottom: "10px" }}>
          또는 소셜 계정으로 시작하기
        </div>

        {/* 소셜 로그인 버튼 구역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" } as React.CSSProperties}>
          <button type="button" style={{ width: "100%", height: "45px", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" } as React.CSSProperties}>
            🔴 구글로 시작하기
          </button>
          <button type="button" style={{ width: "100%", height: "45px", backgroundColor: "#FEE500", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" } as React.CSSProperties}>
            🟡 카카오로 시작하기
          </button>
          <button type="button" style={{ width: "100%", height: "45px", backgroundColor: "#03C75A", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" } as React.CSSProperties}>
            🟢 네이버로 시작하기
          </button>
        </div>

        {/* 🆕 [버그 전면 수정 완료!] 얼어붙는 span 구문을 통째로 도려내고, 에러율 0%인 무적의 순정 인터넷 통로 <a> 태그 문법으로 강제 전환!!! 🚀 */}
        <div style={{ marginTop: "20px", fontSize: "13px", color: "#666" }}>
          계정이 없나요?{" "}
          <a 
            href="/signup" 
            style={{ color: "#00C7ae", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
          >
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
}