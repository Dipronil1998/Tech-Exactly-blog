const mongoose = require('mongoose');
const Post = require('../models/Post');
const AppError = require('../utils/appError');

/**
 * Create a new post with auto-generated slug
 */
const createPost = async ({ title, content, status, authorId }) => {
  const post = new Post({
    title,
    content,
    status,
    author: authorId,
    isDeleted: false,
  });

  await post.save();
  await post.populate('author', 'username email name role');

  return post;
};

/**
 * Get all posts with pagination, status/author filtering, and keyword search
 */
const getAllPosts = async ({
  page = 1,
  limit = 10,
  includeDeleted = false,
  author,
  status,
  search,
} = {}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  // Soft delete filter: exclude deleted posts by default
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  // Filter by author
  if (author) {
    query.author = author;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Keyword search in title or content
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const [posts, totalPosts] = await Promise.all([
    Post.find(query)
      .populate('author', 'username email name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Post.countDocuments(query),
  ]);

  return {
    posts,
    pagination: {
      total: totalPosts,
      page: pageNum,
      pages: Math.ceil(totalPosts / limitNum),
      limit: limitNum,
    },
  };
};

/**
 * Get single post by MongoDB ObjectId or URL slug
 */
const getPostByIdOrSlug = async (idOrSlug, currentUser = null) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
  const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

  const post = await Post.findOne(query).populate('author', 'username email name role');

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  // If soft-deleted, prevent public viewing unless author or admin
  if (post.isDeleted) {
    const isOwner = currentUser && post.author._id.toString() === currentUser._id.toString();
    const isAdmin = currentUser && currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Post not found.', 404);
    }
  }

  return post;
};

/**
 * Update an existing post (regenerates slug if title changed)
 */
const updatePost = async (post, updateData) => {
  if (post.isDeleted) {
    throw new AppError('Cannot update a soft-deleted post. Please restore it first.', 400);
  }

  const { title, content, status } = updateData;

  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (status !== undefined) post.status = status;

  await post.save();
  await post.populate('author', 'username email name role');

  return post;
};

/**
 * Delete a post (soft delete by default, optional hard delete for admins)
 */
const deletePost = async (post, { hardDelete = false, isAdmin = false } = {}) => {
  if (hardDelete && isAdmin) {
    await post.deleteOne();
    return { hardDeleted: true };
  }

  if (post.isDeleted) {
    throw new AppError('Post is already soft-deleted.', 400);
  }

  await post.softDelete();
  return post;
};

/**
 * Restore a soft-deleted post
 */
const restorePost = async (post) => {
  if (!post.isDeleted) {
    throw new AppError('Post is not deleted.', 400);
  }

  await post.restore();
  await post.populate('author', 'username email name role');

  return post;
};

module.exports = {
  createPost,
  getAllPosts,
  getPostByIdOrSlug,
  updatePost,
  deletePost,
  restorePost,
};
