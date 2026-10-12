const { z } = require('zod');

const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

const updateCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
