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
};

module.exports = schemas;
