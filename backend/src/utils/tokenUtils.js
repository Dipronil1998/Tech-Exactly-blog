const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

// Calculate cookie max age in ms from environment variable or default 7 days
const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevents XSS attacks by disallowing client-side JavaScript access (document.cookie)
    secure: isProduction, // Send only over HTTPS in production, false for local HTTP
    sameSite: isProduction ? (process.env.COOKIE_SAME_SITE || 'strict') : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
};

const generateAccessToken = (user) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || 'user',
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user._id.toString(),
    jti: crypto.randomUUID(), // Unique token identifier preventing collision & replay
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const setRefreshTokenCookie = (res, token) => {
  if (!token) return;
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshTokenCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  const { httpOnly, secure, sameSite, path } = getRefreshTokenCookieOptions();
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly,
    secure,
    sameSite,
    path,
  });
};

module.exports = {
  REFRESH_TOKEN_COOKIE_NAME,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
