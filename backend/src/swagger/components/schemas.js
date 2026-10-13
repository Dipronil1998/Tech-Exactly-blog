// Component 1: OpenAPI Data Models & Schemas
const schemas = {
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '6618451f22144d32098d781b',
      },
      username: {
        type: 'string',
        example: 'john_doe',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com',
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        example: 'user',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        example: 'john_doe',
        description: 'Unique username (alphanumeric and underscores only)',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com',
        description: 'Valid, unique email address',
      },
      password: {
        type: 'string',
        minLength: 6,
        example: 'secureP@ssword123',
        description: 'Minimum 6 characters',
      },
      name: {
        type: 'string',
        example: 'John Doe',
        description: 'Display name (optional)',
      },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com',
        description: 'Email (or supply username)',
      },
      username: {
        type: 'string',
        example: 'john_doe',
        description: 'Username (or supply email)',
      },
      password: {
        type: 'string',
        example: 'secureP@ssword123',
        description: 'Account password',
      },
    },
  },
  GoogleAuthRequest: {
    type: 'object',
    properties: {
      idToken: {
        type: 'string',
        description: 'Google OAuth ID token credential',
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Google account email (optional if idToken is supplied)',
        example: 'user@gmail.com',
      },
      name: {
        type: 'string',
        description: 'Google account display name (optional)',
        example: 'Jane Doe',
      },
      avatar: {
        type: 'string',
        description: 'Google profile picture URL (optional)',
        example: 'https://lh3.googleusercontent.com/a/...',
      },
    },
  },
  RefreshRequest: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Refresh token (optional if supplied via HTTP-only cookie)',
      },
    },
  },
  LogoutRequest: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Refresh token to revoke (optional if supplied via cookie)',
      },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Login successful.',
      },
      data: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MTg0NTFmMiIsImlhdCI6MTYxODQ1MX0...',
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MTg0NTFmMiIsImp0aSI6ImZhZGYx...}',
          },
        },
      },
    },
  },
  TokenRefreshResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Access token refreshed successfully.',
      },
      data: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MTg0NTFmMiIsImlhdCI6MTYxODQ1MX0...',
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2MTg0NTFmMiIsImp0aSI6ImZhZGYx...}',
          },
        },
      },
    },
  },
  UserProfileResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
        },
      },
    },
  },
  GenericMessageResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Logged out successfully.',
      },
    },
  },
  ValidationErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Password must be at least 6 characters long',
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'password',
            },
            message: {
              type: 'string',
              example: 'Password must be at least 6 characters long',
            },
          },
        },
      },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Invalid credentials.',
      },
      code: {
        type: 'string',
        example: 'INVALID_TOKEN',
      },
    },
  },
  Post: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '6618451f22144d32098d785a',
      },
      title: {
        type: 'string',
        example: 'Mastering Node.js and RBAC',
      },
      slug: {
        type: 'string',
        example: 'mastering-nodejs-and-rbac',
        description: 'Auto-generated URL-friendly unique slug',
      },
      content: {
        type: 'string',
        example: 'A comprehensive guide to role-based access control in Express applications...',
      },
      author: {
        $ref: '#/components/schemas/User',
      },
      status: {
        type: 'string',
        enum: ['draft', 'published'],
        example: 'published',
      },
      isDeleted: {
        type: 'boolean',
        example: false,
        description: 'Soft delete flag',
      },
      deletedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
    },
  },
  CreatePostRequest: {
    type: 'object',
    required: ['title', 'content'],
    properties: {
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Mastering Node.js and RBAC',
      },
      content: {
        type: 'string',
        minLength: 5,
        example: 'A comprehensive guide to role-based access control in Express applications...',
      },
      status: {
        type: 'string',
        enum: ['draft', 'published'],
        default: 'published',
        example: 'published',
      },
    },
  },
  UpdatePostRequest: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Updated Post Title',
      },
      content: {
        type: 'string',
        minLength: 5,
        example: 'Updated post content...',
      },
      status: {
        type: 'string',
        enum: ['draft', 'published'],
        example: 'published',
      },
    },
  },
  PostResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Post created successfully.',
      },
      data: {
        type: 'object',
        properties: {
          post: {
            $ref: '#/components/schemas/Post',
          },
        },
      },
    },
  },
  UpdateUserRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: {
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        example: 'admin',
        description: 'New role to assign to the user',
      },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Jane Doe',
      },
      username: {
        type: 'string',
        example: 'jane_doe',
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        description: 'Role can only be changed by Admin users',
        example: 'admin',
      },
    },
  },
  Comment: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        example: '6618451f22144d32098d7999',
      },
      content: {
        type: 'string',
        example: 'Great article! Really helped clarify the concepts.',
      },
      author: {
        $ref: '#/components/schemas/User',
      },
      post: {
        type: 'string',
        example: '6618451f22144d32098d785a',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-10-12T18:30:00.000Z',
      },
    },
  },
  CreateCommentRequest: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        example: 'Great post, thanks for sharing!',
      },
    },
  },
  UpdateCommentRequest: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        example: 'Updated feedback on this article.',
      },
    },
  },
  CommentResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Comment created successfully.',
      },
      data: {
        type: 'object',
        properties: {
          comment: {
            $ref: '#/components/schemas/Comment',
          },
        },
      },
    },
  },
};

module.exports = schemas;
