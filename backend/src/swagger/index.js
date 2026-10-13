const swaggerJsdoc = require('swagger-jsdoc');
const schemas = require('./components/schemas');
const securitySchemes = require('./components/security');
const authPaths = require('./paths/auth.paths');
const userPaths = require('./paths/user.paths');
const postPaths = require('./paths/post.paths');
const commentPaths = require('./paths/comment.paths');
const adminPaths = require('./paths/admin.paths');
const healthPaths = require('./paths/health.paths');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blog API - Authentication & RBAC Service',
    version: '1.0.0',
    description: `
Interactive REST API documentation for the Blog backend authentication and Role-Based Access Control (RBAC) system.

### Architecture & RBAC Rules
- **Admin**: Can manage all users (list, promote, delete), manage all posts, and manage all comments.
- **Regular User**: Can create posts and comments, and edit/delete ONLY their own posts and comments.
- **Enforcement**: RBAC is enforced strictly at the API and middleware level.
    `,
    contact: {
      name: 'Blog API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Local Development Server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, token refresh, logout, and current user profile',
    },
    {
      name: 'Admin Panel',
      description: 'System-wide dashboard statistics and oversight (Admin only)',
    },
    {
      name: 'Posts',
      description: 'Blog post operations (Authors manage own posts, Admins manage all posts)',
    },
    {
      name: 'Comments',
      description: 'Comment operations (Users manage own comments, Admins manage all comments)',
    },
    {
      name: 'Users (Admin)',
      description: 'User management and role assignment (Admin only)',
    },
    {
      name: 'Health',
      description: 'Service health check endpoint',
    },
  ],
  components: {
    securitySchemes,
    schemas,
  },
  paths: {
    ...authPaths,
    ...adminPaths,
    ...userPaths,
    ...postPaths,
    ...commentPaths,
    ...healthPaths,
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
