const express = require('express');
const {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes protected by strict rate limiter
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/refresh', authLimiter, refreshToken);

// Logout route
router.post('/logout', logout);

// Protected routes requiring valid JWT access token
router.get('/me', protect, getMe);

module.exports = router;
