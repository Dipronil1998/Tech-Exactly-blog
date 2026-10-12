// Component 2: OpenAPI Security Schemes
const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Provide your JWT access token generated upon login/registration. (Do not include "Bearer ")',
  },
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'refreshToken',
    description: 'HTTP-only cookie containing the refresh token',
  },
};

module.exports = securitySchemes;
