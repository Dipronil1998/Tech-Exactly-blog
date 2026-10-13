const authService = require('../services/authService');
const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE_NAME,
} = require('../utils/tokenUtils');
const { registerSchema, loginSchema } = require('../validations/authValidation');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const result = await authService.registerUser(validationResult.data);

    // Set HTTP-only cookie for refresh token
    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      const formattedErrors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const { email, username, password } = validationResult.data;
    const result = await authService.loginUser({
      identifier: email || username,
      password,
    });

    // Set HTTP-only cookie
    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token using refresh token (with token rotation)
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] ||
      req.body?.refreshToken ||
      req.headers['x-refresh-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    let result;
    try {
      result = await authService.refreshAccessToken(token);
    } catch (err) {
      clearRefreshTokenCookie(res);
      return next(err);
    }

    setRefreshTokenCookie(res, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user & invalidate refresh token
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const token =
      req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] ||
      req.body?.refreshToken ||
      req.headers['x-refresh-token'];

    await authService.logoutUser(token);

    // Clear HTTP-only cookie
    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
