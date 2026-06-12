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

// 스크랩 추가
router.post('/bookmarks', async (req, res) => {
  try {
    const { user_id, announcement_id } = req.body;
    if (!user_id || !announcement_id) {
      return res.status(400).json({ message: 'user_id와 announcement_id가 필요합니다.' });
    }
    await pool.query(
      `INSERT INTO user_bookmarks (bookmark_id, user_id, announcement_id, deadline_alert)
       VALUES (UUID(), ?, ?, 0)`,
      [user_id, announcement_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('스크랩 추가 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 스크랩 삭제
router.delete('/bookmarks', async (req, res) => {
  try {
    const { user_id, announcement_id } = req.body;

    // 해당 공고의 announcement_id로 알림 메시지를 찾아 삭제
    const [rows] = await pool.query(
      'SELECT title FROM filtered_announcements WHERE announcement_id = ?',
      [announcement_id]
    );
    if (rows.length > 0) {
      const title = rows[0].title;
      await pool.query(
        `DELETE FROM notifications 
         WHERE user_id = ? AND type = 'deadline_alert' AND message LIKE ?`,
        [user_id, `%${title}`]
      );
    }

    await pool.query(
      'DELETE FROM user_bookmarks WHERE user_id = ? AND announcement_id = ?',
      [user_id, announcement_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('스크랩 삭제 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 스크랩 목록 조회
router.get('/bookmarks', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ message: 'user_id가 필요합니다.' });
    }
    const [rows] = await pool.query(
      'SELECT announcement_id FROM user_bookmarks WHERE user_id = ?',
      [user_id]
    );
    res.json(rows.map(r => r.announcement_id));
  } catch (err) {
    console.error('스크랩 목록 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 마감 임박 알림 생성 + 조회
router.get('/notifications', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ message: 'user_id가 필요합니다.' });
    }

    // 1. 스크랩한 공고 중 D-5 이내인 것 조회
    const [bookmarked] = await pool.query(`
      SELECT ub.announcement_id, fa.title, ra.end_date
      FROM user_bookmarks ub
      JOIN filtered_announcements fa ON ub.announcement_id = fa.announcement_id
      LEFT JOIN raw_announcements ra ON fa.raw_announcement_id = ra.raw_announcement_id
      WHERE ub.user_id = ?
    `, [user_id]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const row of bookmarked) {
      if (!row.end_date || String(row.end_date).startsWith('0000') || String(row.end_date).startsWith('1899')) continue;
      const end = new Date(row.end_date);
      end.setHours(0, 0, 0, 0);
      const dday = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (dday >= 0 && dday <= 5) {
        const message = `마감 임박 D-${dday}: ${row.title}`;
        const [existing] = await pool.query(
          `SELECT notification_id FROM notifications 
           WHERE user_id = ? AND type = 'deadline_alert' AND message = ?`,
          [user_id, message]
        );
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO notifications (notification_id, user_id, type, message, is_read, target_number)
             VALUES (UUID(), ?, 'deadline_alert', ?, 0, ?)`,
            [user_id, message, dday]
          );
        }
      }
    }

    // 2. 알림 목록 조회
    const [rows] = await pool.query(
      `SELECT notification_id, type, message, is_read, created_at, target_number
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [user_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('알림 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 알림 읽음 처리
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 전체 읽음 처리
router.patch('/notifications/read-all', async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 마감알림 설정 조회
router.get('/alert-setting', async (req, res) => {
  try {
    const { user_id } = req.query;
    const [rows] = await pool.query(
      'SELECT deadline_alert_enabled FROM users WHERE user_id = ?',
      [user_id]
    );
    res.json({ enabled: !!rows[0]?.deadline_alert_enabled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 마감알림 설정 변경
router.patch('/alert-setting', async (req, res) => {
  try {
    const { user_id, enabled } = req.body;
    await pool.query(
      'UPDATE users SET deadline_alert_enabled = ? WHERE user_id = ?',
      [enabled ? 1 : 0, user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;