const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    // Fetch user without password or sensitive arrays
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid access token.',
      code: 'INVALID_TOKEN',
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }
    next();
  };
};

// Post ownership verification middleware:
// Allows author of the post OR users with admin role to manage the post
const checkPostOwnershipOrAdmin = async (req, res, next) => {
  const Post = require('../models/Post');
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own posts.',
      });
    }

    // Attach verified post to request object
    req.post = post;
    next();
  } catch (error) {
    next(error);
  }
};

// User ownership verification middleware:
// Allows self OR admin to manage the user profile
const checkUserOwnershipOrAdmin = (req, res, next) => {
  const isSelf = req.params.id === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view or manage your own profile.',
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  checkPostOwnershipOrAdmin,
  checkUserOwnershipOrAdmin,
};
