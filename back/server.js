import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './src/routes/auth.js'
import pool from './src/db.js'

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/oauth', authRouter); //소셜 로그인

// 트렌드 키워드 보내는 주소
// 테스트용 API: 주소창에 http://localhost:5000/api/users 를 치면 DB 데이터를 가져옴
app.get('/api/trends/keywords', async (req, res) => {
  try {
    // 백엔드가 알아서 복잡한 테이블을 조회해 옴.
    // 예시: 'users'라는 테이블에서 모든 데이터를 조회 (실제 테이블명으로 변경 필요)
    const [rows] = await pool.query('SELECT keyword, frequency, growth_rate FROM trend_keywords'); 
    res.json(rows); // 리액트한테 던져주기
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

// 1. TOP 10 랭킹 (ranking 순서대로)
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

// 2. 키워드 상세 (버블 클릭 시)
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

// 회원탈퇴
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