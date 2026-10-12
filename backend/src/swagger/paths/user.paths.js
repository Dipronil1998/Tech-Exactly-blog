// User Management Endpoints Paths (RBAC: Admin & Self)
const userPaths = {
  '/api/users': {
    get: {
      tags: ['Users (Admin)'],
      summary: 'Get all users with pagination and search',
      description: 'Admin-only endpoint to retrieve all registered users.',
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
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        {
          name: 'role',
          in: 'query',
          schema: { type: 'string', enum: ['user', 'admin'] },
          description: 'Filter by user role',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search username, email, or name',
        },
      ],
      responses: {
        200: {
          description: 'List of users retrieved successfully',
        },
        401: {
          description: 'Unauthorized. Missing or invalid token.',
        },
        403: {
          description: 'Forbidden. Admin role required.',
        },
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: ['Users (Admin)'],
      summary: 'Get user by ID',
      description: 'Retrieve profile details. Accessible by Admins or account owner.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User details retrieved',
        },
        403: {
          description: 'Forbidden. You can only view your own profile unless Admin.',
        },
        404: {
          description: 'User not found.',
        },
      },
    },
    put: {
      tags: ['Users (Admin)'],
      summary: 'Update user profile',
      description: 'Update profile. Only Admins can modify the role parameter.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateUserRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'User updated successfully',
        },
        403: {
          description: 'Forbidden. Cannot update another user or elevate role without Admin role.',
        },
      },
    },
    delete: {
      tags: ['Users (Admin)'],
      summary: 'Delete a user and cascade delete their posts',
      description: 'Admin-only endpoint to remove a user account. Admins cannot delete their own account.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID to delete',
        },
      ],
      responses: {
        200: {
          description: 'User and all associated posts deleted successfully',
        },
        400: {
          description: 'Cannot delete own admin account',
        },
        403: {
          description: 'Forbidden. Admin role required.',
        },
        404: {
          description: 'User not found',
        },
      },
    },
  },
  '/api/users/{id}/role': {
    put: {
      tags: ['Users (Admin)'],
      summary: 'Promote or demote user role',
      description: 'Admin-only endpoint to set a user role to "admin" or "user".',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Target User ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Role updated successfully',
        },
        400: {
          description: 'Admin cannot remove their own admin privileges',
        },
        403: {
          description: 'Forbidden. Admin role required.',
        },
      },
    },
  },
};

module.exports = userPaths;
