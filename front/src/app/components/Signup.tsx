import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [emailId, setEmailId] = useState<string>('');
  const [emailDomain, setEmailDomain] = useState<string>('naver.com');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');

  const [idCheckMsg, setIdCheckMsg] = useState<string>('');

  const passwordMismatch = password !== '' && passwordConfirm !== '' && password !== passwordConfirm;

  const handleIdCheck = async () => {
    if (!userId) {
      alert("아이디를 입력해주세요!");
      return;
    }
    try {
      const response = await fetch(`/api/check-id?userId=${userId}`);
      const data = await response.json();
      if (data.available) {
        setIdCheckMsg("사용 가능한 아이디입니다 ✅");
      } else {
        setIdCheckMsg("이미 사용 중인 아이디입니다 ❌");
      }
    } catch (error) {
      console.error("아이디 중복확인 에러:", error);
      setIdCheckMsg("중복확인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalDomain = emailDomain === 'custom' ? customDomain : emailDomain;
    const email = `${emailId}@${finalDomain}`;

    if (!userId || !password || !passwordConfirm || !nickname || !phone || !emailId || !finalDomain) {
      alert("모든 입력창을 빈칸 없이 꽉꽉 채워주세요!!");
      return;
    }

    if (passwordMismatch) {
      alert("비밀번호가 일치하지 않습니다!");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          password,
          nickname,
          email,
          phone,
          birthDate: birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
          alert(data.message || "회원가입이 완벽하게 대성공했습니다! 🎉");
          // 신규 가입자 튜토리얼 트리거 세팅
          localStorage.setItem("runTutorialTrigger", "true");
          navigate("/login");
      } else {
        alert(data.message || "회원가입 실패! 이미 있는 아이디인지 확인하세요 😭");
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      alert("서버 연결 실패 5000번 백엔드 서버가 잘 켜져 있는지 확인하세요!");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6px",
    textAlign: "left",
  } as React.CSSProperties;

  const fieldWrapperStyle = {
    marginBottom: "16px",
  } as React.CSSProperties;

  const hintStyle = {
    fontSize: "12px",
    fontWeight: "normal",
    marginLeft: "6px",
  } as React.CSSProperties;

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

      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        boxSizing: "border-box",
      } as React.CSSProperties}>

        <div style={{
          backgroundColor: "white",
          padding: "30px 40px",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
          width: "100%",
          maxWidth: "900px",
          textAlign: "center"
        } as React.CSSProperties}>

        {/* 타이틀 로고 */}
        <div style={{ marginBottom: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/logo.png" alt="TrendPilot" style={{ width: "60px", height: "60px" }} />
          <h2 style={{ margin: "10px 0 5px 0", fontWeight: "bold", color: "#111", fontSize: "22px" }}>회원가입</h2>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>회원이 되어 다양한 혜택을 경험해 보세요!</p>
        </div>

        <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column" } as React.CSSProperties}>

          {/* 아이디 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>
              아이디
              {idCheckMsg && (
                <span style={{ ...hintStyle, color: idCheckMsg.includes("✅") ? "#00C7ae" : "#ff4d4f" }}>
                  {idCheckMsg}
                </span>
              )}
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="아이디 입력 (6~20자)"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setIdCheckMsg(''); }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleIdCheck}
                style={{
                  whiteSpace: "nowrap",
                  padding: "0 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#00C7ae",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                } as React.CSSProperties}
              >
                중복 확인
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호 입력 (문자, 숫자, 특수문자 포함 8~20자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>
              비밀번호 확인
              {passwordMismatch && (
                <span style={{ ...hintStyle, color: "#ff4d4f" }}>비밀번호가 일치하지 않습니다</span>
              )}
            </label>
            <input
              type="password"
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              style={inputStyle}
            />
          </div>

         {/* 이름 (DB의 nickname 컬럼에 저장됨) */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>이름</label>
            <input
              type="text"
              placeholder="이름을 입력해주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 전화번호 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>전화번호</label>
            <input
              type="text"
              placeholder="휴대폰 번호 입력 ('-' 제외 11자리 입력)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 이메일 주소 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>이메일 주소</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="이메일 주소"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ color: "#666" }}>@</span>
              {emailDomain === 'custom' ? (
                <input
                  type="text"
                  placeholder="도메인 입력"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              ) : (
                <input
                  type="text"
                  value={emailDomain}
                  readOnly
                  style={{ ...inputStyle, flex: 1, backgroundColor: "#f8f9fa" }}
                />
              )}
              <select
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                style={{ ...inputStyle, width: "110px", flex: "none" }}
              >
                <option value="naver.com">naver.com</option>
                <option value="gmail.com">gmail.com</option>
                <option value="daum.net">daum.net</option>
                <option value="custom">직접입력</option>
              </select>
            </div>
          </div>

          {/* 생년월일 */}
          <div style={fieldWrapperStyle}>
            <label style={labelStyle}>생년월일</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">년도</option>
                {Array.from({ length: 80 }, (_, i) => 2025 - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">월</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={String(month).padStart(2, '0')}>{month}월</option>
                ))}
              </select>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">일</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={String(day).padStart(2, '0')}>{day}일</option>
                ))}
              </select>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
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
              가입하기
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                flex: 1,
                height: "45px",
                backgroundColor: "#f1f1f1",
                color: "#333",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              } as React.CSSProperties}
            >
              가입취소
            </button>
          </div>
        </form>

        {/* 로그인 링크 */}
        <div style={{ marginTop: "20px", fontSize: "13px", color: "#666" }}>
          이미 계정이 있으신가요?{" "}
          <span
            onClick={() => navigate('/login')}
            style={{ color: "#00C7ae", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
          >
            로그인하러 가기
          </span>
        </div>
      </div>
    </div>
   </div>
  );
}