import express from 'express';
import pool from '../db.js';

const router = express.Router();

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

export default router;