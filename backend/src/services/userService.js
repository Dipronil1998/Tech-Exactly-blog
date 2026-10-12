const User = require('../models/User');
const Post = require('../models/Post');
const AppError = require('../utils/appError');

/**
 * Get all users with pagination, role filtering, and regex search
 */
const getAllUsers = async ({ page = 1, limit = 10, role, search } = {}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    query.$or = [{ username: searchRegex }, { email: searchRegex }, { name: searchRegex }];
  }

  const [users, totalUsers] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total: totalUsers,
      page: pageNum,
      pages: Math.ceil(totalUsers / limitNum),
      limit: limitNum,
    },
  };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

/**
 * Update user details
 * Handles unique username checks and role modification authorization.
 */
const updateUser = async (userId, updateData, currentUser) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const { name, username, role } = updateData;

  if (name !== undefined) {
    user.name = name;
  }

  // Check unique username if changing
  if (username && username !== user.username) {
    const existing = await User.findOne({ username });
    if (existing) {
      throw new AppError('Username is already in use.', 409);
    }
    user.username = username;
  }

  // Only admins can change roles
  if (role !== undefined) {
    if (currentUser.role !== 'admin') {
      throw new AppError('Access denied. Only administrators can change roles.', 403);
    }
    user.role = role;
  }

  await user.save();
  return user;
};

/**
 * Update user role (Promote / Demote)
 * Enforces rule that admins cannot remove their own admin privileges.
 */
const updateUserRole = async (userId, newRole, currentUserId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Prevent admin from demoting themselves
  if (currentUserId.toString() === user._id.toString() && newRole !== 'admin') {
    throw new AppError('You cannot remove your own admin privileges.', 400);
  }

  user.role = newRole;
  await user.save();
  return user;
};

/**
 * Delete a user and cascade delete their posts
 * Enforces rule that admins cannot delete their own account.
 */
const deleteUser = async (userId, currentUserId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Prevent admin from deleting themselves
  if (currentUserId.toString() === user._id.toString()) {
    throw new AppError('You cannot delete your own admin account.', 400);
  }

  // Delete user and cascade delete user's posts
  await Promise.all([
    user.deleteOne(),
    Post.deleteMany({ author: user._id }),
  ]);

  return true;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
};
