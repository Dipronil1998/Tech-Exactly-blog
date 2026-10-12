const postService = require('../services/postService');
const { createPostSchema, updatePostSchema } = require('../validations/postValidation');

// @desc    Create a new post with auto-generated slug
// @route   POST /api/posts
// @access  Private (Any authenticated user)
const createPost = async (req, res, next) => {
  try {
    const validationResult = createPostSchema.safeParse(req.body);
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

    const { title, content, status } = validationResult.data;
    const post = await postService.createPost({
      title,
      content,
      status,
      authorId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (soft-deleted posts excluded by default)
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res, next) => {
  try {
    const { page, limit, author, status, search } = req.query;
    const includeDeleted = req.query.includeDeleted === 'true';

    const result = await postService.getAllPosts({
      page,
      limit,
      includeDeleted,
      author,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID or Slug
// @route   GET /api/posts/:idOrSlug
// @access  Public
const getPostByIdOrSlug = async (req, res, next) => {
  try {
    const post = await postService.getPostByIdOrSlug(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post (updates slug if title changes)
// @route   PUT /api/posts/:id
// @access  Private (Author or Admin)
const updatePost = async (req, res, next) => {
  try {
    const validationResult = updatePostSchema.safeParse(req.body);
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

    // req.post is verified by checkPostOwnershipOrAdmin middleware
    const post = await postService.updatePost(req.post, validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post (soft delete by default, hard delete for admins)
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
const deletePost = async (req, res, next) => {
  try {
    const hardDelete = req.query.hardDelete === 'true';
    const isAdmin = req.user.role === 'admin';

    const result = await postService.deletePost(req.post, { hardDelete, isAdmin });

    if (result.hardDeleted) {
      return res.status(200).json({
        success: true,
        message: 'Post permanently deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post soft deleted successfully.',
      data: {
        post: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a soft-deleted post
// @route   PATCH /api/posts/:id/restore
// @access  Private (Author or Admin)
const restorePost = async (req, res, next) => {
  try {
    const post = await postService.restorePost(req.post);

    return res.status(200).json({
      success: true,
      message: 'Post restored successfully.',
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById: getPostByIdOrSlug,
  updatePost,
  deletePost,
  restorePost,
};
