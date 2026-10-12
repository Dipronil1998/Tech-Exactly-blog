const express = require('express');
const {
  createComment,
  getPostComments,
  getCommentById,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const {
  protect,
  checkCommentOwnershipOrAdmin,
} = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getPostComments);
router.get('/:id', getCommentById);

router.post('/', protect, createComment);
router.put('/:id', protect, checkCommentOwnershipOrAdmin, updateComment);
router.delete('/:id', protect, checkCommentOwnershipOrAdmin, deleteComment);

module.exports = router;

