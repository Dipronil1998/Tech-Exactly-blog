const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Get aggregate statistics for Admin Dashboard:
 * - Total number of users
 * - Total number of posts
 * - Total number of comments
 * - Recent activity highlights
 */
const getAdminStats = async () => {
  const [
    totalUsers,
    totalPosts,
    totalComments,
    totalSoftDeletedPosts,
    adminUsersCount,
    regularUsersCount,
    recentUsers,
    recentPosts,
    recentComments,
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ isDeleted: false }),
    Comment.countDocuments(),
    Post.countDocuments({ isDeleted: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'user' }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email name role createdAt'),
    Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username email name role'),
    Comment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username email name role')
      .populate('post', 'title slug'),
  ]);

  return {
    overview: {
      totalUsers,
      totalPosts,
      totalComments,
      totalSoftDeletedPosts,
      adminUsersCount,
      regularUsersCount,
    },
    recentUsers,
    recentPosts,
    recentComments,
  };
};

/**
 * Get all comments across the entire system for Admin oversight
 */
const getAllComments = async ({ page = 1, limit = 20 } = {}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [comments, totalComments] = await Promise.all([
    Comment.find()
      .populate('author', 'username email name role')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Comment.countDocuments(),
  ]);

  return {
    comments,
    pagination: {
      total: totalComments,
      page: pageNum,
      pages: Math.ceil(totalComments / limitNum),
      limit: limitNum,
    },
  };
};

module.exports = {
  getAdminStats,
  getAllComments,
};
