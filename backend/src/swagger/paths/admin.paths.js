/**
 * OpenAPI 3.0 path definitions for Admin Panel endpoints
 */
const adminPaths = {
  '/api/admin/stats': {
    get: {
      tags: ['Admin Panel'],
      summary: 'Get admin dashboard metrics',
      description: 'Retrieves total users, total posts, total comments, and platform highlights. Restricted to Administrators.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Admin dashboard statistics retrieved successfully.' },
                  data: {
                    type: 'object',
                    properties: {
                      overview: {
                        type: 'object',
                        properties: {
                          totalUsers: { type: 'integer', example: 12 },
                          totalPosts: { type: 'integer', example: 45 },
                          totalComments: { type: 'integer', example: 120 },
                          totalSoftDeletedPosts: { type: 'integer', example: 2 },
                          adminUsersCount: { type: 'integer', example: 2 },
                          regularUsersCount: { type: 'integer', example: 10 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Forbidden - User does not have admin role',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/admin/comments': {
    get: {
      tags: ['Admin Panel'],
      summary: 'Get all platform comments',
      description: 'Returns all comments system-wide with author and post details. Restricted to Administrators.',
      security: [{ bearerAuth: [] }],
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
          schema: { type: 'integer', default: 20 },
          description: 'Comments per page',
        },
      ],
      responses: {
        200: {
          description: 'List of comments across platform',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      comments: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Comment' },
                      },
                      pagination: {
                        $ref: '#/components/schemas/PaginationMetadata',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Admin access required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
};

module.exports = adminPaths;
