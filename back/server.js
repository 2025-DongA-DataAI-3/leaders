import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './src/routes/auth.js'
import pool from './src/db.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/oauth', authRouter); // 소셜 로그인

// ==========================================
// 📊 트렌드 API
// ==========================================

app.get('/api/trends/keywords', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT keyword, frequency, growth_rate FROM trend_keywords');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

app.get('/api/trends/ranking', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tk.keyword_id, tk.keyword, tk.frequency, tk.growth_rate, tk.ai_insight,
             tm.ranking, tm.category_id
      FROM trend_keywords tk
      JOIN trend_map tm ON tk.keyword_id = tm.keyword_id
      ORDER BY tm.ranking ASC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

app.get('/api/trends/keywords/:keyword_id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tk.keyword, tk.frequency, tk.growth_rate, tk.ai_insight
      FROM trend_keywords tk
      WHERE tk.keyword_id = ?
    `, [req.params.keyword_id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

// ==========================================
// 👤 일반 회원가입 / 로그인
// ==========================================

// 일반 회원가입
app.post("/api/signup", async (req, res) => {
  const userId = req.body.userId || req.body.userid || req.body.id;
  const password = req.body.password || req.body.userPw || req.body.pw;
  const nickname = req.body.nickname || req.body.name || "유저";
  const email = req.body.email || `${userId}@trendpilot.com`;

  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: "이미 존재하는 아이디입니다." });
    }

    // 이메일 중복 체크
    const [existingEmail] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, message: "이미 사용 중인 이메일입니다." });
    }

    await pool.query(
      "INSERT INTO users (user_id, email, password, nickname, role) VALUES (?, ?, ?, ?, ?)",
      [userId, email, password, nickname, "USER"]
    );

    res.json({ success: true, message: "회원가입 성공!" });
  } catch (error) {
    console.error("회원가입 에러:", error);
    res.status(500).json({ success: false, message: `DB 저장 실패: ${error.message}` });
  }
});

// 일반 로그인
app.post("/api/login", async (req, res) => {
  const userId = req.body.userId || req.body.userid || req.body.id;
  const password = req.body.password || req.body.userPw || req.body.pw;

  if (!userId || !password) {
    return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const [user] = await pool.query(
      "SELECT * FROM users WHERE user_id = ? AND password = ?",
      [userId, password]
    );

    if (user.length === 0) {
      return res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }

    res.json({ success: true, message: "로그인 성공!", user: user[0] });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({ success: false, message: "로그인 중 서버 오류 발생" });
  }
});

// ==========================================
// 🗑️ 회원탈퇴
// ==========================================

app.delete('/api/auth/delete', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('DELETE FROM users WHERE user_id = ?', [user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 작동 중입니다!`);
});