// Jest environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = '9002';
process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_for_jest_mode_2026';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_for_jest_mode_2026';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ADMIN_SECRET_KEY = 'super_secret_admin_key_for_blog_2026';
process.env.CLIENT_URL = 'http://localhost:3000';
