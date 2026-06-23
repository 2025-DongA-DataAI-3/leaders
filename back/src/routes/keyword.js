import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 관심 키워드 목록 조회
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await pool.query(
      'SELECT user_keyword_id, keyword_id, alert_enabled FROM user_keywords WHERE user_id = ?',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('관심 키워드 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 관심 키워드 저장
router.post('/save', async (req, res) => {
  try {
    const { user_id, keyword } = req.body;
    if (!user_id || !keyword) {
      return res.status(400).json({ success: false, message: '필수 값이 없습니다.' });
    }

    // 이미 저장된 키워드인지 확인
    const [existing] = await pool.query(
      'SELECT user_keyword_id FROM user_keywords WHERE user_id = ? AND keyword_id = ?',
      [user_id, keyword]
    );
    if (existing.length > 0) {
      return res.json({ success: false, message: '이미 저장된 키워드입니다.' });
    }

    await pool.query(
      'INSERT INTO user_keywords (user_keyword_id, user_id, keyword_id, alert_enabled) VALUES (?, ?, ?, ?)',
      [uuidv4(), user_id, keyword, 1]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('관심 키워드 저장 에러:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 관심 키워드 삭제
router.delete('/delete', async (req, res) => {
  try {
    const { user_id, keyword } = req.body;
    await pool.query(
      'DELETE FROM user_keywords WHERE user_id = ? AND keyword_id = ?',
      [user_id, keyword]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('관심 키워드 삭제 에러:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;