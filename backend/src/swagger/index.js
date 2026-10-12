const swaggerJsdoc = require('swagger-jsdoc');
const schemas = require('./components/schemas');
const securitySchemes = require('./components/security');
const authPaths = require('./paths/auth.paths');
const userPaths = require('./paths/user.paths');
const postPaths = require('./paths/post.paths');
const healthPaths = require('./paths/health.paths');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blog API - Authentication & RBAC Service',
    version: '1.0.0',
    description: `
Interactive REST API documentation for the Blog backend authentication and Role-Based Access Control (RBAC) system.

### Architecture & RBAC Rules
- **Admin**: Can manage all users (list, promote, delete) and manage all posts (edit, delete any post).
- **Regular User**: Can create posts and edit/delete ONLY their own posts.
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
      name: 'Posts',
      description: 'Blog post operations (Authors manage own posts, Admins manage all posts)',
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
    ...userPaths,
    ...postPaths,
    ...healthPaths,
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
