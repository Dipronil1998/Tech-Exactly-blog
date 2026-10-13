module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  verbose: true,
  forceExit: true,
  testTimeout: 30000,
  detectOpenHandles: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
  ],
};
