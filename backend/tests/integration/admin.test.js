const request = require('supertest');
const app = require('../../src/app');
const dbHandler = require('../helpers/dbHandler');

describe('Integration Test: Admin Dashboard & Oversight', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    // 1. Admin user
    const adminRes = await request(app).post('/api/auth/register').send({
      username: 'adminuser',
      email: 'admin@platform.com',
      password: 'AdminPassword123!',
      role: 'admin',
      adminSecret: 'super_secret_admin_key_for_blog_2026',
    });
    adminToken = adminRes.body.data.accessToken;

    // 2. Regular user
    const userRes = await request(app).post('/api/auth/register').send({
      username: 'regularuser',
      email: 'user@platform.com',
      password: 'UserPassword123!',
    });
    userToken = userRes.body.data.accessToken;

    // 3. Create posts and comments
    const p1 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'First Community Article', content: 'Discussion post 1.' });

    const p2 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Official Update', content: 'Discussion post 2.' });

    await request(app)
      .post(`/api/posts/${p1.body.data.post._id}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Helpful article!' });

    await request(app)
      .post(`/api/posts/${p2.body.data.post._id}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Official admin note.' });
  });

  describe('GET /api/admin/stats', () => {
    it('should reject unauthenticated access (401)', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should forbid regular users from accessing stats (403)', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return accurate dashboard metrics to Admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalUsers).toBe(2);
      expect(res.body.data.stats.totalPosts).toBe(2);
      expect(res.body.data.stats.totalComments).toBe(2);
      expect(res.body.data.recentPosts.length).toBe(2);
      expect(res.body.data.recentComments.length).toBe(2);
    });
  });

  describe('GET /api/admin/comments', () => {
    it('should list all comments across all posts for Admin', async () => {
      const res = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(2);
    });

    it('should forbid regular users from viewing admin comments (403)', async () => {
      const res = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });
});
