const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment content cannot be empty'],
      maxlength: [1000, 'Comment content cannot exceed 1000 characters'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Comment must be associated with a post'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have an author'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a post's comments in chronological order
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
