const userService = require('../services/userService');
const { updateUserSchema, updateRoleSchema } = require('../validations/userValidation');

// @desc    Get all users (with search, role filter, pagination)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, search });

    return res.status(200).json({
      success: true,
      data: result,
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
    const user = await userService.getUserById(req.params.id);

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

    const user = await userService.updateUser(req.params.id, validationResult.data, req.user);

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

    const user = await userService.updateUserRole(
      req.params.id,
      validationResult.data.role,
      req.user._id
    );

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
    await userService.deleteUser(req.params.id, req.user._id);

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
