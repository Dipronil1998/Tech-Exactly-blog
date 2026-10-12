const User = require('../models/User');
const Post = require('../models/Post');
const { updateUserSchema, updateRoleSchema } = require('../validations/userValidation');

// @desc    Get all users (with search, role filter, pagination)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [{ username: searchRegex }, { email: searchRegex }, { name: searchRegex }];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page,
          pages: Math.ceil(totalUsers / limit),
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile or settings
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
const updateUser = async (req, res, next) => {
  try {
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation error',
        errors: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { name, username, role } = validationResult.data;

    if (name !== undefined) user.name = name;

    // Check unique username if changing
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Username is already in use.',
        });
      }
      user.username = username;
    }

    // Only admins can change roles
    if (role !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators can change roles.',
        });
      }
      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Promote / Demote)
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const validationResult = updateRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation error',
        errors: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === user._id.toString() && validationResult.data.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin privileges.',
      });
    }

    user.role = validationResult.data.role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to ${user.role}.`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and their posts
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
    }

    // Delete user and cascade delete user's posts
    await Promise.all([
      user.deleteOne(),
      Post.deleteMany({ author: user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'User and all associated posts deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
};
