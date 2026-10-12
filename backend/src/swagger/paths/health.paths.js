// Health check endpoint paths
const healthPaths = {
  '/api/health': {
    get: {
      tags: ['Health'],
      summary: 'Check API service health',
      responses: {
        200: {
          description: 'Service is operational',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'ok',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  service: {
                    type: 'string',
                    example: 'blog-backend-auth',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = healthPaths;
