const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const dbHandler = require('../helpers/dbHandler');

describe('Integration Test: Authentication & Token Lifecycle', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  const testUser = {
    username: 'alexdev',
    email: 'alex@example.com',
    password: 'SecurePassword123!',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user, return tokens and set HttpOnly refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);

      // Verify DB hash
      const userInDb = await User.findOne({ email: testUser.email }).select('+password');
      expect(userInDb).toBeDefined();
      expect(userInDb.password).not.toBe(testUser.password);
      expect(userInDb.password).toMatch(/^\$2[aby]\$/);
    });

    it('should reject registration if email is already registered (409 Conflict)', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already in use|already registered/i);
    });

    it('should reject invalid input via Zod validation (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'al', email: 'invalid-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with valid email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should register a new OAuth user with Google details and return tokens', async () => {
      const googlePayload = {
        email: 'googleauthor@example.com',
        name: 'Google Author',
        googleId: 'google_oauth_12345',
        avatar: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .post('/api/auth/google')
        .send(googlePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(googlePayload.email);
      expect(res.body.data.user.name).toBe(googlePayload.name);
      expect(res.body.data.user.googleId).toBe(googlePayload.googleId);
      expect(res.body.data.user.avatar).toBe(googlePayload.avatar);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
    });

    it('should link Google account when an existing user signs in with Google email', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/google')
        .send({
          email: testUser.email,
          name: 'Alex Developer',
          googleId: 'google_alex_9999',
          avatar: 'https://example.com/alex.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.googleId).toBe('google_alex_9999');

      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb.googleId).toBe('google_alex_9999');
    });

    it('should reject Google login if required identifier is missing (400)', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should retrieve current user profile with valid Bearer token', async () => {
      const reg = await request(app).post('/api/auth/register').send(testUser);
      const token = reg.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject access without token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh & Token Rotation', () => {
    it('should refresh tokens, rotate the refresh token, and invalidate the old one', async () => {
      const reg = await request(app).post('/api/auth/register').send(testUser);
      const initialRefreshToken = reg.body.data.refreshToken;

      // 1. Refresh with the initial token
      const refRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(refRes.status).toBe(200);
      expect(refRes.body.success).toBe(true);
      const newAccessToken = refRes.body.data.accessToken;
      const rotatedRefreshToken = refRes.body.data.refreshToken;

      expect(newAccessToken).toBeDefined();
      expect(rotatedRefreshToken).toBeDefined();
      expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

      // Verify the new access token works
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`);
      expect(meRes.status).toBe(200);

      // 2. Replay attack test: Attempt to reuse old initialRefreshToken (must be rejected)
      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should revoke refresh token and clear cookie', async () => {
      const reg = await request(app).post('/api/auth/register').send(testUser);
      const refreshToken = reg.body.data.refreshToken;

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Subsequent refresh with that token must fail
      const refRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      expect(refRes.status).toBe(401);
    });
  });

  describe('Rate Limiting & Documentation', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      let triggered = false;
      for (let i = 0; i < 20; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'rate@example.com', password: 'password123' });

        if (res.status === 429) {
          triggered = true;
          expect(res.body.success).toBe(false);
          expect(res.body.message).toMatch(/too many authentication attempts/i);
          break;
        }
      }
      expect(triggered).toBe(true);
    });

    it('should serve Swagger OpenAPI JSON spec at /api/docs.json', async () => {
      const res = await request(app).get('/api/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.paths['/api/auth/register']).toBeDefined();
      expect(res.body.paths['/api/auth/login']).toBeDefined();
      expect(res.body.paths['/api/auth/google']).toBeDefined();
    });
  });
});
