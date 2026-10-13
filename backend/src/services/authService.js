const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');
const AppError = require('../utils/appError');

/**
 * Register a new user
 * Handles role verification, duplicate checking, user creation, and token generation.
 */
const registerUser = async ({ username, email, password, name, role, adminSecret }) => {
  // Check if role is admin and verify admin secret key
  let assignedRole = 'user';
  if (role === 'admin') {
    const configuredSecret = process.env.ADMIN_SECRET_KEY;
    if (!configuredSecret || adminSecret !== configuredSecret) {
      throw new AppError('Invalid or missing admin registration secret key.', 403);
    }
    assignedRole = 'admin';
  }

  // Check if email or username already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    throw new AppError(`${field} is already in use.`, 409);
  }

  // Create new user (password is hashed in pre-save hook)
  const user = new User({
    username,
    email,
    password,
    name,
    role: assignedRole,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token session
  user.refreshTokens = [{ token: refreshToken, createdAt: new Date() }];
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticate user & issue tokens
 * Handles identifier lookup, password verification, and session management.
 */
const loginUser = async ({ identifier, password }) => {
  const cleanIdentifier = (identifier || '').trim();

  // Find user by email or username, explicitly selecting the password
  const user = await User.findOne({
    $or: [{ email: cleanIdentifier.toLowerCase() }, { username: cleanIdentifier }],
  }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials.', 401);
  }

  // Verify password with bcrypt
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials.', 401);
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

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using refresh token (with token rotation)
 */
const refreshAccessToken = async (token) => {
  if (!token) {
    throw new AppError('Refresh token is required.', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  // Atomically remove the old refresh token if present (prevents race conditions / duplicate rotation)
  const updatedUser = await User.findOneAndUpdate(
    { _id: decoded.id, 'refreshTokens.token': token },
    { $pull: { refreshTokens: { token } } },
    { returnDocument: 'after' }
  );

  if (!updatedUser) {
    throw new AppError('Refresh token has been revoked or already used.', 401);
  }

  // Generate new token pair
  const newAccessToken = generateAccessToken(updatedUser);
  const newRefreshToken = generateRefreshToken(updatedUser);

  // Atomically append the new refresh token (retaining max 5 active tokens)
  await User.findByIdAndUpdate(decoded.id, {
    $push: {
      refreshTokens: {
        $each: [{ token: newRefreshToken, createdAt: new Date() }],
        $slice: -5,
      },
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Log out user & invalidate refresh token
 */
const logoutUser = async (token) => {
  if (token) {
    await User.updateOne(
      { 'refreshTokens.token': token },
      { $pull: { refreshTokens: { token } } }
    );
  }
  return true;
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
