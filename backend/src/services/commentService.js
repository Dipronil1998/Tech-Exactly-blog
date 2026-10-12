const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const AppError = require('../utils/appError');

/**
 * Add a comment to a blog post (accepts post ObjectId or URL slug)
 */
const createComment = async ({ postIdOrSlug, content, authorId }) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(postIdOrSlug);
  const postQuery = isObjectId ? { _id: postIdOrSlug } : { slug: postIdOrSlug.toLowerCase() };
  postQuery.isDeleted = false;

  const post = await Post.findOne(postQuery);
  if (!post) {
    throw new AppError('Post not found or has been deleted.', 404);
  }

  const comment = new Comment({
    content,
    post: post._id,
    author: authorId,
  });

  await comment.save();
  await comment.populate('author', 'username email name role');

  return comment;
};

/**
 * Get all comments for a blog post with pagination
 */
const getCommentsByPost = async ({ postIdOrSlug, page = 1, limit = 20 } = {}) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(postIdOrSlug);
  const postQuery = isObjectId ? { _id: postIdOrSlug } : { slug: postIdOrSlug.toLowerCase() };
  postQuery.isDeleted = false;

  const post = await Post.findOne(postQuery);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [comments, totalComments] = await Promise.all([
    Comment.find({ post: post._id })
      .populate('author', 'username email name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Comment.countDocuments({ post: post._id }),
  ]);

  return {
    comments,
    pagination: {
      total: totalComments,
      page: pageNum,
      pages: Math.ceil(totalComments / limitNum),
      limit: limitNum,
    },
  };
};

/**
 * Get single comment by ID
 */
const getCommentById = async (commentId) => {
  const comment = await Comment.findById(commentId)
    .populate('author', 'username email name role')
    .populate('post', 'title slug');

  if (!comment) {
    throw new AppError('Comment not found.', 404);
  }

  return comment;
};

/**
 * Update a comment
 */
const updateComment = async (comment, content) => {
  comment.content = content;
  await comment.save();
  await comment.populate('author', 'username email name role');

  return comment;
};

/**
 * Delete a comment
 */
const deleteComment = async (comment) => {
  await comment.deleteOne();
  return true;
};

module.exports = {
  createComment,
  getCommentsByPost,
  getCommentById,
  updateComment,
  deleteComment,
};
