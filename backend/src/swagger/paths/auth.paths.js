// Component 3: Authentication Endpoints Paths
const authPaths = {
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Creates a new user profile with bcrypt-hashed password and returns access & refresh tokens.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterRequest',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          headers: {
            'Set-Cookie': {
              schema: {
                type: 'string',
                example: 'refreshToken=eyJhbG...; Path=/; HttpOnly; SameSite=Lax',
              },
              description: 'HTTP-only refresh token cookie',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuthResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation Error (e.g., short password, invalid email format)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        409: {
          description: 'Username or Email is already registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        429: {
          description: 'Too Many Requests (Rate limit reached: max 15 requests per 15 min)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Log in with credentials',
      description: 'Authenticates a user via email/username and password. Sets an HTTP-only refresh token cookie and returns tokens.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          headers: {
            'Set-Cookie': {
              schema: {
                type: 'string',
                example: 'refreshToken=eyJhbG...; Path=/; HttpOnly; SameSite=Lax',
              },
              description: 'HTTP-only refresh token cookie',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuthResponse',
              },
            },
          },
        },
        400: {
          description: 'Missing required credentials',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        429: {
          description: 'Too Many Requests (Rate limit exceeded)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token with token rotation',
      description: 'Issues a brand new access token and rotated refresh token. The previous refresh token is immediately invalidated.',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RefreshRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Access token refreshed successfully',
          headers: {
            'Set-Cookie': {
              schema: {
                type: 'string',
                example: 'refreshToken=eyJhbG...; Path=/; HttpOnly; SameSite=Lax',
              },
              description: 'Updated HTTP-only refresh token cookie',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TokenRefreshResponse',
              },
            },
          },
        },
        401: {
          description: 'Invalid, expired, or revoked refresh token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        429: {
          description: 'Too Many Requests (Rate limit exceeded)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Log out user',
      description: 'Revokes the stored refresh token in the database and clears the HTTP-only cookie.',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LogoutRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Logged out successfully',
          headers: {
            'Set-Cookie': {
              schema: {
                type: 'string',
                example: 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
              },
              description: 'Cleared refresh token cookie',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenericMessageResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user profile',
      description: 'Returns the currently authenticated user profile based on the JWT Bearer token.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        200: {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserProfileResponse',
              },
            },
          },
        },
        401: {
          description: 'Access denied. Missing, invalid, or expired access token.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
};

module.exports = authPaths;
