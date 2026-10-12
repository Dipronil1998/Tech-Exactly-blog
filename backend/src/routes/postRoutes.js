const express = require('express');
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postController');
const { protect, checkPostOwnershipOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);

// Protected routes (Any authenticated user can create posts)
router.post('/', protect, createPost);

// Role & Ownership Protected routes (Author or Admin only)
router.put('/:id', protect, checkPostOwnershipOrAdmin, updatePost);
router.delete('/:id', protect, checkPostOwnershipOrAdmin, deletePost);

module.exports = router;
