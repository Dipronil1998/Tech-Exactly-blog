const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');
const {
  protect,
  authorize,
  checkUserOwnershipOrAdmin,
} = require('../middleware/authMiddleware');

const router = express.Router();

// All user management routes require authentication
router.use(protect);

// Admin-only: list all users
router.get('/', authorize('admin'), getAllUsers);

// Admin or Self: get user details
router.get('/:id', checkUserOwnershipOrAdmin, getUserById);

// Admin or Self: update user details
router.put('/:id', checkUserOwnershipOrAdmin, updateUser);

// Admin-only: update user role
router.put('/:id/role', authorize('admin'), updateUserRole);

// Admin-only: delete user
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
