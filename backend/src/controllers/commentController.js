const commentService = require('../services/commentService');
const { createCommentSchema, updateCommentSchema } = require('../validations/commentValidation');

// @desc    Add a comment to a blog post
// @route   POST /api/posts/:postId/comments
// @access  Private (Authenticated users)
const createComment = async (req, res, next) => {
  try {
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

    const comment = await commentService.createComment({
      postIdOrSlug: req.params.postId,
      content: validationResult.data.content,
      authorId: req.user._id,
    });

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
    const { page, limit } = req.query;
    const result = await commentService.getCommentsByPost({
      postIdOrSlug: req.params.postId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
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
    const comment = await commentService.getCommentById(req.params.id);

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
    const comment = await commentService.updateComment(
      req.comment,
      validationResult.data.content
    );

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
    await commentService.deleteComment(req.comment);

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
