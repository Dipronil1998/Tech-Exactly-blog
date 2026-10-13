const adminService = require('../services/adminService');

// @desc    Get system-wide dashboard metrics for Admin Panel
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminStats();

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard statistics retrieved successfully.',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform comments with pagination
// @route   GET /api/admin/comments
// @access  Private (Admin only)
const getAllComments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAllComments({ page, limit });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllComments,
};
