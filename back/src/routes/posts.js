import express from 'express';
import pool from '../db.js';

const router = express.Router();

// ==========================================
// 1. 게시글 목록 조회 (카테고리 필터 + 검색)
// GET /api/posts?majorcategory=창업 분야&subcategory=AI/기술창업&search=검색어
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { majorcategory, subcategory, search } = req.query;

    let query = `
      SELECT p.post_id, p.user_id, u.nickname AS author, p.title, p.content, 
             p.view_count, p.created_at, p.updated_at,
             pk.majorcategory, pk.subcategory,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_keywords pk ON p.post_keyword_id = pk.post_keyword_id
      WHERE 1=1
    `;
    const params = [];

    if (majorcategory && majorcategory !== '전체') {
      query += ' AND pk.majorcategory = ?';
      params.push(majorcategory);
    }
    if (subcategory && subcategory !== '전체') {
      query += ' AND pk.subcategory = ?';
      params.push(subcategory);
    }
    if (search) {
      query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('게시글 목록 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. 게시글 상세 조회 (댓글 포함, 조회수 +1)
// GET /api/posts/:post_id
// ==========================================
router.get('/:post_id', async (req, res) => {
  const { post_id } = req.params;

  try {
    // 조회수 +1
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE post_id = ?', [post_id]);

    // 게시글 정보
    const [posts] = await pool.query(`
      SELECT p.post_id, p.user_id, u.nickname AS author, p.title, p.content,
             p.view_count, p.created_at, p.updated_at,
             pk.majorcategory, pk.subcategory
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_keywords pk ON p.post_keyword_id = pk.post_keyword_id
      WHERE p.post_id = ?
    `, [post_id]);

    if (posts.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 댓글 목록
    const [comments] = await pool.query(`
      SELECT c.comment_id, c.user_id, u.nickname AS author, c.content, c.created_at
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [post_id]);

    res.json({
      ...posts[0],
      comments,
    });
  } catch (err) {
    console.error('게시글 상세 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. 게시글 작성
// POST /api/posts
// body: { user_id, title, content, post_keyword_id }
// ==========================================
router.post('/', async (req, res) => {
  const { user_id, title, content, post_keyword_id } = req.body;

  if (!user_id || !title || !content) {
    return res.status(400).json({ message: 'user_id, title, content는 필수입니다.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO posts (post_id, user_id, title, content, post_keyword_id, view_count)
       VALUES (UUID(), ?, ?, ?, ?, 0)`,
      [user_id, title, content, post_keyword_id || null]
    );

    // 방금 생성된 post_id 조회 (UUID()로 생성했으므로 다시 조회)
    const [rows] = await pool.query(
      `SELECT post_id FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );

    res.status(201).json({
      success: true,
      message: '게시글이 작성되었습니다.',
      post_id: rows[0]?.post_id,
    });
  } catch (err) {
    console.error('게시글 작성 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. 댓글 작성
// POST /api/posts/:post_id/comments
// body: { user_id, content }
// ==========================================
router.post('/:post_id/comments', async (req, res) => {
  const { post_id } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ message: 'user_id, content는 필수입니다.' });
  }

  try {
    // 게시글 존재 확인
    const [post] = await pool.query('SELECT post_id FROM posts WHERE post_id = ?', [post_id]);
    if (post.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    await pool.query(
      `INSERT INTO comments (comment_id, post_id, user_id, content)
       VALUES (UUID(), ?, ?, ?)`,
      [post_id, user_id, content]
    );

    // 작성된 댓글 정보 조회해서 반환 (프론트에서 즉시 렌더링용)
    const [newComment] = await pool.query(`
      SELECT c.comment_id, c.user_id, u.nickname AS author, c.content, c.created_at
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC LIMIT 1
    `, [post_id]);

    res.status(201).json({
      success: true,
      message: '댓글이 작성되었습니다.',
      comment: newComment[0],
    });
  } catch (err) {
    console.error('댓글 작성 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 5. 북마크 토글 (저장/저장취소)
// POST /api/posts/:post_id/bookmark
// body: { user_id }
// ==========================================
router.post('/:post_id/bookmark', async (req, res) => {
  const { post_id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id는 필수입니다.' });
  }

  try {
    // 게시글 존재 확인
    const [post] = await pool.query('SELECT post_id FROM posts WHERE post_id = ?', [post_id]);
    if (post.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 이미 북마크했는지 확인
    const [existing] = await pool.query(
      'SELECT bookmark_id FROM post_bookmarks WHERE user_id = ? AND post_id = ?',
      [user_id, post_id]
    );

    if (existing.length > 0) {
      // 이미 있으면 삭제 (저장 취소)
      await pool.query(
        'DELETE FROM post_bookmarks WHERE user_id = ? AND post_id = ?',
        [user_id, post_id]
      );
      return res.json({ success: true, bookmarked: false, message: '저장이 취소되었습니다.' });
    } else {
      // 없으면 추가 (저장)
      await pool.query(
        `INSERT INTO post_bookmarks (bookmark_id, user_id, post_id) VALUES (UUID(), ?, ?)`,
        [user_id, post_id]
      );
      return res.json({ success: true, bookmarked: true, message: '게시글이 저장되었습니다.' });
    }
  } catch (err) {
    console.error('북마크 토글 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 6. (보너스) 내가 북마크한 게시글 목록 조회
// GET /api/posts/bookmarks/:user_id
// ==========================================
router.get('/bookmarks/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT p.post_id, p.title, p.content, p.created_at,
             pk.majorcategory, pk.subcategory,
             u.nickname AS author
      FROM post_bookmarks pb
      JOIN posts p ON pb.post_id = p.post_id
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN post_keywords pk ON p.post_keyword_id = pk.post_keyword_id
      WHERE pb.user_id = ?
      ORDER BY pb.created_at DESC
    `, [user_id]);

    res.json(rows);
  } catch (err) {
    console.error('북마크 목록 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 7. 커뮤니티 통계 (전체 게시글, 이번 주 활동, 활성 회원)
// GET /api/posts/stats/summary
// ==========================================
router.get('/stats/summary', async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM posts');
 
    const [[{ weekly }]] = await pool.query(
      `SELECT COUNT(*) AS weekly FROM posts WHERE created_at >= NOW() - INTERVAL 7 DAY`
    );
 
    const [[{ active_users }]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS active_users FROM posts
       WHERE created_at >= NOW() - INTERVAL 30 DAY`
    );
 
    res.json({
      total,
      weekly,
      active_users,
    });
  } catch (err) {
    console.error('통계 조회 에러:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;