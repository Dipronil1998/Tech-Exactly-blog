// Comment Management Endpoints Paths (RBAC: Authors edit/delete own comments, Admins manage all)
const commentPaths = {
  '/api/posts/{postId}/comments': {
    post: {
      tags: ['Comments'],
      summary: 'Add a comment to a post',
      description: 'Authenticated users can comment on an existing blog post.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'postId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID or Slug to comment on',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCommentRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Comment created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentResponse' },
            },
          },
        },
        400: {
          description: 'Validation error (e.g., empty comment)',
        },
        401: {
          description: 'Unauthorized. Authentication token required.',
        },
        404: {
          description: 'Post not found or has been deleted',
        },
      },
    },
    get: {
      tags: ['Comments'],
      summary: 'Get all comments for a post',
      description: 'Public endpoint to retrieve comments for a post in reverse chronological order.',
      parameters: [
        {
          name: 'postId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID or Slug',
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
          description: 'Comments per page',
        },
      ],
      responses: {
        200: {
          description: 'Comments retrieved successfully',
        },
        404: {
          description: 'Post not found',
        },
      },
    },
  },
  '/api/comments/{id}': {
    get: {
      tags: ['Comments'],
      summary: 'Get single comment by ID',
      description: 'Retrieve details of a single comment.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Comment ID',
        },
      ],
      responses: {
        200: {
          description: 'Comment retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentResponse' },
            },
          },
        },
        404: {
          description: 'Comment not found',
        },
      },
    },
    put: {
      tags: ['Comments'],
      summary: 'Update a comment (Author or Admin)',
      description: `
**Role-Based Access Control Rule:**
- **Regular User**: Can edit ONLY their own comments.
- **Admin**: Can edit ANY comment.
Enforced at the API middleware level.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Comment ID to update',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCommentRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Comment updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentResponse' },
            },
          },
        },
        400: {
          description: 'Validation error',
        },
        401: {
          description: 'Unauthorized. Token required.',
        },
        403: {
          description: 'Forbidden. You can only edit your own comments unless Admin.',
        },
        404: {
          description: 'Comment not found',
        },
      },
    },
    delete: {
      tags: ['Comments'],
      summary: 'Delete a comment (Author or Admin)',
      description: `
**Role-Based Access Control Rule:**
- **Regular User**: Can delete ONLY their own comments.
- **Admin**: Can delete ANY comment.
Enforced at the API middleware level.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Comment ID to delete',
        },
      ],
      responses: {
        200: {
          description: 'Comment deleted successfully',
        },
        401: {
          description: 'Unauthorized. Token required.',
        },
        403: {
          description: 'Forbidden. You can only delete your own comments unless Admin.',
        },
        404: {
          description: 'Comment not found',
        },
      },
    },
  },
};

module.exports = commentPaths;
