const Post = require('../models/Post');
const { createPostSchema, updatePostSchema } = require('../validations/postValidation');

// @desc    Create a new post
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

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by author
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Filter by status (allow drafts if admin or requesting user's own posts)
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Keyword search in title
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
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

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username email name role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
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

// @desc    Update a post
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

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
const deletePost = async (req, res, next) => {
  try {
    // post is already retrieved and RBAC verified by checkPostOwnershipOrAdmin middleware
    const post = req.post;

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
