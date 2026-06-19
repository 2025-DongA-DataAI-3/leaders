import express from 'express';
import pool from '../db.js';

const router = express.Router();

// JSON 컬럼 안전 파싱 헬퍼
function parseJson(val) {
  if (val == null) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
  return val; // 이미 객체/배열인 경우 (MySQL 드라이버가 자동 파싱한 경우)
}

// 키워드맵 전체 조회 (시드 + 추출 키워드 + 네트워크 링크)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
  SELECT 
    kd.keyword, kd.type, kd.category, kd.reason,
    kd.startup_item_types, kd.market_analysis,
    kd.government_support_links, kd.compact_evidence_articles,
    kd.linked_seed_categories,
    kr.ranking_score, kr.article_count, kr.search_growth_rate,
    kr.search_interest,
    kr.interest_score, kr.growth_score, kr.article_count_score,
    kr.doc_relevance_score, kr.recency_score
  FROM keyword_details kd
  LEFT JOIN keyword_ranking kr ON kd.keyword = kr.keyword
`);

    const seed_nodes = [];
    const extracted_nodes = [];
    const links = [];

    rows.forEach(row => {
      const node = {
  keyword: row.keyword,
  type: row.type,
  category: row.category,
  reason: row.reason,
  startup_item_types: parseJson(row.startup_item_types) ?? [],
  market_analysis: row.market_analysis,
  government_support_links: parseJson(row.government_support_links) ?? [],
  news_articles: parseJson(row.compact_evidence_articles) ?? [],
  article_count: row.article_count ?? 0,
  growth_rate: row.search_growth_rate ?? 0,
  ranking_score: row.ranking_score ?? 0,
  search_interest: row.search_interest ?? 0,
  score_interest: row.interest_score ?? 0,
  score_growth: row.growth_score ?? 0,
  score_evidence: row.article_count_score ?? 0,
  score_relevance: row.doc_relevance_score ?? 0,
  score_recency: row.recency_score ?? 0,
};

      if (row.type === 'seed') {
        seed_nodes.push(node);
      } else {
        extracted_nodes.push(node);

        const linkedSeeds = parseJson(row.linked_seed_categories) ?? [];
        linkedSeeds.forEach(seedKw => {
          links.push({
            source: seedKw,
            target: row.keyword,
            linked_seed_count: linkedSeeds.length,
          });
        });
      }
    });

    res.json({ seed_nodes, extracted_nodes, links });
  } catch (error) {
    console.error('키워드맵 조회 에러:', error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

// 키워드별 시장 현황 단건 조회 (버블 클릭 시 호출)
router.get('/market-analysis/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const [rows] = await pool.query(
      'SELECT market_analysis FROM keyword_details WHERE keyword = ?',
      [keyword]
    );

    if (rows.length === 0) {
      return res.status(404).json({ market_analysis: '' });
    }

    res.json({ market_analysis: rows[0].market_analysis ?? '' });
  } catch (error) {
    console.error('시장현황 조회 에러:', error);
    res.status(500).json({ message: 'DB 조회 중 서버 에러 발생' });
  }
});

export default router;