const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
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
    // Validate request body using Zod schema
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

    const { username, email, password, name } = validationResult.data;

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `${field} is already in use.`,
      });
    }

    // Create new user (password is hashed in pre-save hook)
    const user = new User({
      username,
      email,
      password,
      name,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user document
    user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
    await user.save();

    // Set HTTP-only cookie for refresh token
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user,
        accessToken,
        refreshToken,
      },
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
    // Validate request body using Zod schema
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
    const identifier = (email || username || '').trim();

    // Find user by email or username, explicitly selecting the password
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Verify password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Maintain max 5 active refresh tokens (device sessions)
    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    // Set HTTP-only cookie
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        accessToken,
        refreshToken,
      },
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
    // Read refresh token from cookie, request body, or header
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

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Verify token exists in user's saved tokens list
    const tokenIndex = user.refreshTokens.findIndex((t) => t.token === token);
    if (tokenIndex === -1) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked or already used.',
      });
    }

    // Refresh Token Rotation: Remove the used token and issue a fresh pair
    user.refreshTokens.splice(tokenIndex, 1);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
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

    if (token) {
      // Invalidate the refresh token in the database
      await User.updateOne(
        { 'refreshTokens.token': token },
        { $pull: { refreshTokens: { token } } }
      );
    }

    // Clear the HTTP-only cookie
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
