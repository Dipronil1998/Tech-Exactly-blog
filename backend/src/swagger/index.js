const swaggerJsdoc = require('swagger-jsdoc');
const schemas = require('./components/schemas');
const securitySchemes = require('./components/security');
const authPaths = require('./paths/auth.paths');
const healthPaths = require('./paths/health.paths');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blog API - Authentication & Session Service',
    version: '1.0.0',
    description: `
Interactive REST API documentation for the Blog backend authentication system.

### Architecture
This Swagger documentation is organized into modular files:
- **Schemas Component**: Data contracts & validation models
- **Security Component**: JWT Bearer and Cookie authentication schemes
- **Paths Component**: Modular route definitions (Auth, Health, etc.)
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
    ...healthPaths,
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
