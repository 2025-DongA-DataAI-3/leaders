import express from 'express';
import axios from 'axios';
import qs from 'qs';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 공통 소셜 로그인 처리 함수
const handleSocialLogin = async (res, provider, socialId, email, nickname, profileImage) => {
  try {
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE social_provider = ? AND social_id = ?',
      [provider, socialId]
    );

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO users (user_id, email, password, nickname, role, social_provider, social_id, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [socialId, email, `${provider}_authenticated`, nickname, 'USER', provider, socialId, profileImage]
      );
    } else {
      await pool.query(
        'UPDATE users SET nickname = ?, profile_image = ? WHERE social_provider = ? AND social_id = ?',
        [nickname, profileImage, provider, socialId]
      );
    }

    const [finalUser] = await pool.query(
      'SELECT * FROM users WHERE social_provider = ? AND social_id = ?',
      [provider, socialId]
    );

    res.json({ message: `${provider} 로그인 성공`, user: finalUser[0] });

  } catch (error) {
    console.error(`${provider} DB 처리 에러:`, error.message);
    res.status(500).json({ message: `${provider} 로그인 실패` });
  }
};

// 카카오 로그인
router.post('/kakao', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: '인가 코드가 없습니다.' });

  try {
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: 'http://localhost:5173/login',
        code,
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' } }
    );

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoId = String(userResponse.data.id);
    const nickname = userResponse.data.properties?.nickname || `카카오유저_${kakaoId}`;
    const profileImage = userResponse.data.properties?.profile_image || '';
    const email = userResponse.data.kakao_account?.email || `${kakaoId}@kakao.com`;

    await handleSocialLogin(res, 'kakao', kakaoId, email, nickname, profileImage);

  } catch (error) {
    console.error('카카오 로그인 에러:', error.response?.data || error.message);
    res.status(500).json({ message: '카카오 로그인 실패' });
  }
});

// 구글 로그인
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: '구글 토큰이 없습니다.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const nickname = payload.name || `구글유저_${googleId}`;
    const profileImage = payload.picture || '';

    await handleSocialLogin(res, 'google', googleId, email, nickname, profileImage);

  } catch (error) {
    console.error('구글 로그인 에러:', error.message);
    res.status(500).json({ message: '구글 로그인 실패' });
  }
});

// 구글 리디렉션 방식 (기존 토큰 방식 아래에 추가)
router.post('/google/redirect', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: '인가 코드가 없습니다.' });

  try {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:5173/login',
        code,
      }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const googleId = userResponse.data.id;
    const email = userResponse.data.email;
    const nickname = userResponse.data.name || `구글유저_${googleId}`;
    const profileImage = userResponse.data.picture || '';

    await handleSocialLogin(res, 'google', googleId, email, nickname, profileImage);

  } catch (error) {
    console.error('구글 리디렉션 로그인 에러:', error.response?.data || error.message);
    res.status(500).json({ message: '구글 로그인 실패' });
  }
});

// 네이버 로그인
router.post('/naver', async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ message: '인가 코드가 없습니다.' });

  try {
    const tokenResponse = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const naverUser = userResponse.data.response;
    const naverId = naverUser.id;
    const email = naverUser.email || `${naverId}@naver.com`;
    const nickname = naverUser.nickname || naverUser.name || `네이버유저_${naverId}`;
    const profileImage = naverUser.profile_image || '';

    await handleSocialLogin(res, 'naver', naverId, email, nickname, profileImage);

  } catch (error) {
    console.error('네이버 로그인 에러:', error.response?.data || error.message);
    res.status(500).json({ message: '네이버 로그인 실패' });
  }
});

export default router;