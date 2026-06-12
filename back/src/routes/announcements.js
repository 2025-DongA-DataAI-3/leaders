import express from 'express';
import pool from '../db.js';

const router = express.Router();

const HISTORY_LEVELS = ['예비창업자', '1년미만', '2년미만', '3년미만'];

function getHistoryLevel(history) {
  return HISTORY_LEVELS.indexOf(history);
}

function checkBizEnvyMatch(bizEnvy, userLevel) {
  if (!bizEnvy || userLevel < 0) return false;
  const conditions = bizEnvy.split(',').map(s => s.trim());
  return conditions.some(cond => {
    const condLevel = HISTORY_LEVELS.indexOf(cond);
    if (condLevel === -1) return false;
    return userLevel <= condLevel;
  });
}

// 전체 공고 목록
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT fa.announcement_id, fa.title, fa.organization, fa.support_field,
             fa.detail_url, fa.region, fa.target,
             ra.start_date, ra.end_date
      FROM filtered_announcements fa
      LEFT JOIN raw_announcements ra ON fa.raw_announcement_id = ra.raw_announcement_id
      ORDER BY ra.end_date ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('공고 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 맞춤 추천
router.get('/recommend', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ message: 'user_id가 필요합니다.' });
    }

    const [memoRows] = await pool.query(
      'SELECT target, region, history FROM user_memos WHERE user_id = ?',
      [user_id]
    );
    if (memoRows.length === 0) {
      return res.status(404).json({ message: '창업 성향 진단 정보가 없습니다.' });
    }
    const { target: userTarget, region: userRegion, history: userHistory } = memoRows[0];
    const userLevel = getHistoryLevel(userHistory);

    const [rows] = await pool.query(`
      SELECT fa.announcement_id, fa.title, fa.organization, fa.support_field,
             fa.detail_url, fa.region, fa.target, fa.biz_envy,
             ra.start_date, ra.end_date
      FROM filtered_announcements fa
      LEFT JOIN raw_announcements ra ON fa.raw_announcement_id = ra.raw_announcement_id
    `);

    const scored = rows.map((row) => {
      let score = 0;
      if (row.region === '전국' || row.region === userRegion) score += 1;
      if (checkBizEnvyMatch(row.biz_envy, userLevel)) score += 1;
      if (row.target && userTarget && row.target.includes(userTarget)) score += 1;
      return { ...row, match_score: score };
    });

    scored.sort((a, b) => b.match_score - a.match_score);

    res.json(scored);
  } catch (err) {
    console.error('추천 공고 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;