const { z } = require('zod');

// Schema for creating a new post
const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(5, 'Content must be at least 5 characters long'),
  tags: z.array(z.string().trim()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('published'),
});

// Schema for updating an existing post
const updatePostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters long')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    content: z
      .string()
      .trim()
      .min(5, 'Content must be at least 5 characters long')
      .optional(),
    tags: z.array(z.string().trim()).optional(),
    status: z.enum(['draft', 'published']).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.tags !== undefined ||
      data.status !== undefined,
    {
      message: 'At least one field (title, content, tags, or status) must be provided for update.',
    }
  );

module.exports = {
  createPostSchema,
  updatePostSchema,
};
