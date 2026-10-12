const mongoose = require('mongoose');
const Post = require('../models/Post');
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

    const { title, content, tags, status } = validationResult.data;

    const post = new Post({
      title,
      content,
      tags,
      status,
      author: req.user._id,
      isDeleted: false,
    });

    await post.save();
    await post.populate('author', 'username email name role');

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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Soft delete filter: exclude deleted posts by default
    const includeDeleted = req.query.includeDeleted === 'true';
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    // Filter by author
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Keyword search in title or content
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .populate('author', 'username email name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total: totalPosts,
          page,
          pages: Math.ceil(totalPosts / limit),
          limit,
        },
      },
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
    const { id } = req.params;

    // Check if parameter is a valid MongoDB ObjectId or a slug
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id.toLowerCase() };

    const post = await Post.findOne(query).populate('author', 'username email name role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // If soft-deleted, prevent public viewing unless admin or owner
    if (post.isDeleted) {
      const isOwner = req.user && post.author._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Post not found.',
        });
      }
    }

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

    // post is already retrieved and RBAC verified by checkPostOwnershipOrAdmin middleware
    const post = req.post;

    if (post.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a soft-deleted post. Please restore it first.',
      });
    }

    const { title, content, tags, status } = validationResult.data;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (status !== undefined) post.status = status;

    await post.save();
    await post.populate('author', 'username email name role');

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

// @desc    Soft delete a post (sets isDeleted: true and deletedAt timestamp)
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
const deletePost = async (req, res, next) => {
  try {
    // post is already retrieved and RBAC verified by checkPostOwnershipOrAdmin middleware
    const post = req.post;

    // Optional hard delete if requested by admin
    if (req.query.hardDelete === 'true' && req.user.role === 'admin') {
      await post.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Post permanently deleted.',
      });
    }

    if (post.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Post is already soft-deleted.',
      });
    }

    // Soft delete
    await post.softDelete();

    return res.status(200).json({
      success: true,
      message: 'Post soft deleted successfully.',
      data: {
        post,
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
    const post = req.post;

    if (!post.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Post is not deleted.',
      });
    }

    await post.restore();
    await post.populate('author', 'username email name role');

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
