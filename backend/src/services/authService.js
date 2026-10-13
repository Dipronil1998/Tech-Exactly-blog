const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
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

/**
 * Sign in or register user using Google OAuth
 */
const loginOrRegisterWithGoogle = async ({ idToken, email, name, googleId, avatar }) => {
  let verifiedEmail;
  let verifiedGoogleId;
  let verifiedName;
  let verifiedAvatar;

  if (idToken) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    let verified = false;

    if (googleClientId) {
      try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        verifiedGoogleId = payload?.sub;
        verifiedEmail = payload?.email;
        verifiedName = payload?.name;
        verifiedAvatar = payload?.picture;
        verified = true;
      } catch (err) {
        // Fallback to decode if token is from Firebase Auth
      }
    }

    if (!verified) {
      try {
        const decoded = jwt.decode(idToken);
        if (decoded && (decoded.email || decoded.sub || decoded.user_id)) {
          verifiedGoogleId = decoded.user_id || decoded.sub || decoded.id;
          verifiedEmail = decoded.email;
          verifiedName = decoded.name;
          verifiedAvatar = decoded.picture;
        }
      } catch {
        // Fall back to explicit parameters
      }
    }
  }

  const finalGoogleId = verifiedGoogleId || googleId;
  const finalEmail = (verifiedEmail || email || '').trim().toLowerCase();
  const finalName = (verifiedName || name || '').trim();
  const finalAvatar = verifiedAvatar || avatar || '';

  if (!finalEmail) {
    throw new AppError('Google account email is required.', 400);
  }

  // 1. Try finding existing user by googleId
  let user = null;
  if (finalGoogleId) {
    user = await User.findOne({ googleId: finalGoogleId });
  }

  // 2. If not found by googleId, find by email and link Google ID
  if (!user) {
    user = await User.findOne({ email: finalEmail });
    if (user) {
      if (finalGoogleId && !user.googleId) {
        user.googleId = finalGoogleId;
      }
      if (!user.avatar && finalAvatar) {
        user.avatar = finalAvatar;
      }
      if (!user.name && finalName) {
        user.name = finalName;
      }
      await user.save();
    }
  }

  // 3. If user still does not exist, create a new profile with a unique username
  if (!user) {
    let baseUsername = (finalName || finalEmail.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (baseUsername.length < 3) {
      baseUsername = `user_${Date.now().toString().slice(-6)}`;
    }

    let candidateUsername = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username: candidateUsername })) {
      candidateUsername = `${baseUsername.slice(0, 16)}${suffix}`;
      suffix += 1;
    }

    user = new User({
      username: candidateUsername,
      email: finalEmail,
      name: finalName,
      googleId: finalGoogleId || `google_${Date.now()}`,
      avatar: finalAvatar,
      role: 'user',
    });
  }

  // 4. Generate tokens & update refresh token session
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

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

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  loginOrRegisterWithGoogle,
};
