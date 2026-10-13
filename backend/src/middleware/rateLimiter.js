const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiter for authentication endpoints (registration, login, refresh)
// Protects against credential stuffing and brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest || isProduction ? 15 : 200, // Strict in production and tests, generous in development
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
