const express = require('express');
const {
  getDashboardStats,
  getAllComments,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication & admin RBAC on all admin endpoints
router.use(protect);
router.use(authorize('admin'));

// Admin Dashboard aggregate metrics
router.get('/stats', getDashboardStats);

// System-wide comments oversight
router.get('/comments', getAllComments);

module.exports = router;
