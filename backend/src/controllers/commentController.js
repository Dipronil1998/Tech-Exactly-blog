const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { createCommentSchema, updateCommentSchema } = require('../validations/commentValidation');

// @desc    Add a comment to a blog post
// @route   POST /api/posts/:postId/comments
// @access  Private (Authenticated users)
const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Validate if postId is a valid ObjectId or query post by slug/id
    const isObjectId = mongoose.Types.ObjectId.isValid(postId);
    const postQuery = isObjectId ? { _id: postId } : { slug: postId.toLowerCase() };
    postQuery.isDeleted = false;

    const post = await Post.findOne(postQuery);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or has been deleted.',
      });
    }

    // Validate comment payload with Zod
    const validationResult = createCommentSchema.safeParse(req.body);
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

    const { content } = validationResult.data;

    const comment = new Comment({
      content,
      post: post._id,
      author: req.user._id,
    });

    await comment.save();
    await comment.populate('author', 'username email name role');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments for a blog post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(postId);
    const postQuery = isObjectId ? { _id: postId } : { slug: postId.toLowerCase() };
    postQuery.isDeleted = false;

    const post = await Post.findOne(postQuery);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      Comment.find({ post: post._id })
        .populate('author', 'username email name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ post: post._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          total: totalComments,
          page,
          pages: Math.ceil(totalComments / limit),
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single comment by ID
// @route   GET /api/comments/:id
// @access  Public
const getCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username email name role')
      .populate('post', 'title slug');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (Author or Admin)
const updateComment = async (req, res, next) => {
  try {
    const validationResult = updateCommentSchema.safeParse(req.body);
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

    // req.comment is already verified by checkCommentOwnershipOrAdmin middleware
    const comment = req.comment;
    comment.content = validationResult.data.content;

    await comment.save();
    await comment.populate('author', 'username email name role');

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      data: {
        comment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Author or Admin)
const deleteComment = async (req, res, next) => {
  try {
    // req.comment is already verified by checkCommentOwnershipOrAdmin middleware
    const comment = req.comment;

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getPostComments,
  getCommentById,
  updateComment,
  deleteComment,
};
