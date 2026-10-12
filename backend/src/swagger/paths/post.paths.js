// Post Management Endpoints Paths (RBAC: Authors manage own posts, Admins manage all posts)
const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'Get all posts with filters and pagination',
      description: 'Retrieve published blog posts. Supports filtering by author, tag, keyword search, and pagination.',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        {
          name: 'author',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by author User ID',
        },
        {
          name: 'tag',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by tag',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search in post title',
        },
      ],
      responses: {
        200: {
          description: 'List of posts retrieved successfully',
        },
      },
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a new blog post',
      description: 'Authenticated users can create posts. Author is automatically assigned from the JWT access token.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreatePostRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Post created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostResponse' },
            },
          },
        },
        400: {
          description: 'Validation error (missing title/content, short fields)',
        },
        401: {
          description: 'Unauthorized. Authentication token required.',
        },
      },
    },
  },
  '/api/posts/{id}': {
    get: {
      tags: ['Posts'],
      summary: 'Get post by ID',
      description: 'Retrieve post content and author details.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID',
        },
      ],
      responses: {
        200: {
          description: 'Post details retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostResponse' },
            },
          },
        },
        404: {
          description: 'Post not found',
        },
      },
    },
    put: {
      tags: ['Posts'],
      summary: 'Update blog post (Author or Admin)',
      description: `
**Role-Based Access Control Rule:**
- **Regular User**: Can edit ONLY their own posts.
- **Admin**: Can edit ANY post.
Enforced at the API middleware level.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID to update',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdatePostRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Post updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostResponse' },
            },
          },
        },
        401: {
          description: 'Unauthorized. Token required.',
        },
        403: {
          description: 'Forbidden. You do not own this post and are not an admin.',
        },
        404: {
          description: 'Post not found',
        },
      },
    },
    delete: {
      tags: ['Posts'],
      summary: 'Delete blog post (Author or Admin)',
      description: `
**Role-Based Access Control Rule:**
- **Regular User**: Can delete ONLY their own posts.
- **Admin**: Can delete ANY post.
Enforced at the API middleware level.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID to delete',
        },
      ],
      responses: {
        200: {
          description: 'Post deleted successfully',
        },
        401: {
          description: 'Unauthorized. Token required.',
        },
        403: {
          description: 'Forbidden. You do not own this post and are not an admin.',
        },
        404: {
          description: 'Post not found',
        },
      },
    },
  },
  '/api/posts/{id}/restore': {
    patch: {
      tags: ['Posts'],
      summary: 'Restore a soft-deleted post (Author or Admin)',
      description: 'Restores a previously soft-deleted post (sets isDeleted to false and clears deletedAt timestamp).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Post ID to restore',
        },
      ],
      responses: {
        200: {
          description: 'Post restored successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PostResponse' },
            },
          },
        },
        400: {
          description: 'Post is not deleted',
        },
        401: {
          description: 'Unauthorized. Token required.',
        },
        403: {
          description: 'Forbidden. Author or Admin role required.',
        },
        404: {
          description: 'Post not found',
        },
      },
    },
  },
};

module.exports = postPaths;
