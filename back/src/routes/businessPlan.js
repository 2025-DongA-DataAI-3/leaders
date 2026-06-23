import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 저장 또는 업데이트
router.post('/save', async (req, res) => {
  try {
    const { plan_id, user_id, title, summary, template_name, content } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const [existing] = await pool.query(
      'SELECT plan_id FROM saved_business_plans WHERE plan_id = ?',
      [plan_id]
    );

    if (existing.length > 0) {
      // 기존 저장본 업데이트
      await pool.query(
        `UPDATE saved_business_plans 
         SET title = ?, summary = ?, template_name = ?, content = ?, updated_at = NOW()
         WHERE plan_id = ? AND user_id = ?`,
        [title, summary, template_name, JSON.stringify(content), plan_id, user_id]
      );
    } else {
      // 신규 저장
      await pool.query(
        `INSERT INTO saved_business_plans (plan_id, user_id, title, summary, template_name, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [plan_id, user_id, title, summary, template_name, JSON.stringify(content)]
      );
    }

    res.json({ success: true, plan_id });
  } catch (err) {
    console.error('사업계획서 저장 에러:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 목록 조회
router.get('/list/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await pool.query(
      `SELECT plan_id, title, summary, template_name, content, created_at, updated_at
       FROM saved_business_plans
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('사업계획서 목록 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 단건 조회
router.get('/detail/:plan_id', async (req, res) => {
  try {
    const { plan_id } = req.params;
    const [rows] = await pool.query(
      `SELECT plan_id, title, summary, template_name, content, created_at, updated_at
       FROM saved_business_plans WHERE plan_id = ?`,
      [plan_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '저장된 사업계획서를 찾을 수 없습니다.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('사업계획서 단건 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// 삭제
router.delete('/:plan_id', async (req, res) => {
  try {
    const { plan_id } = req.params;
    const { user_id } = req.body;

    await pool.query(
      'DELETE FROM saved_business_plans WHERE plan_id = ? AND user_id = ?',
      [plan_id, user_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('사업계획서 삭제 에러:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;