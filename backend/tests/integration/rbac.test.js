const request = require('supertest');
const app = require('../../src/app');
const dbHandler = require('../helpers/dbHandler');

describe('Integration Test: Role-Based Access Control (RBAC)', () => {
  let adminToken;
  let userTokenA;
  let userTokenB;
  let userIdB;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    // 1. Register Admin with secret key
    const adminRes = await request(app).post('/api/auth/register').send({
      username: 'superadmin',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      adminSecret: 'super_secret_admin_key_for_blog_2026',
    });
    adminToken = adminRes.body.data.accessToken;

    // 2. Register User Alice
    const userARes = await request(app).post('/api/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'AlicePassword123!',
    });
    userTokenA = userARes.body.data.accessToken;

    // 3. Register User Bob
    const userBRes = await request(app).post('/api/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'BobPassword123!',
    });
    userTokenB = userBRes.body.data.accessToken;
    userIdB = userBRes.body.data.user._id;
  });

  describe('Admin Registration Guard', () => {
    it('should reject admin registration without correct adminSecret (403)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'fakeadmin',
        email: 'fakeadmin@example.com',
        password: 'Password123!',
        role: 'admin',
        adminSecret: 'wrong_secret',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('User Management RBAC', () => {
    it('should allow admin to list all users, but forbid regular users (403)', async () => {
      const adminList = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.users.length).toBe(3);

      const userList = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(userList.status).toBe(403);
    });

    it('should allow admin to promote user to admin role', async () => {
      const res = await request(app)
        .put(`/api/users/${userIdB}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
    });

    it('should forbid regular users from updating roles (403)', async () => {
      const res = await request(app)
        .put(`/api/users/${userIdB}/role`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });
  });

  describe('Post Ownership RBAC', () => {
    let alicePostId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          title: "Alice's Private Article",
          content: 'Authored exclusively by Alice.',
        });
      alicePostId = postRes.body.data.post._id;
    });

    it('should forbid Bob from editing or deleting Alice post (403)', async () => {
      const editRes = await request(app)
        .put(`/api/posts/${alicePostId}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({ title: 'Tampered by Bob' });
      expect(editRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/posts/${alicePostId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(delRes.status).toBe(403);
    });

    it('should allow Admin to edit or delete any user post', async () => {
      const editRes = await request(app)
        .put(`/api/posts/${alicePostId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Moderated by Admin' });
      expect(editRes.status).toBe(200);
      expect(editRes.body.data.post.title).toBe('Moderated by Admin');

      const delRes = await request(app)
        .delete(`/api/posts/${alicePostId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(200);
    });
  });

  describe('Comment Ownership RBAC', () => {
    let commentId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          title: 'Article for Comment RBAC',
          content: 'Post content.',
        });
      const postId = postRes.body.data.post._id;

      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({ content: "Alice's comment" });
      commentId = commentRes.body.data.comment._id;
    });

    it('should forbid Bob from deleting Alice comment (403)', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(res.status).toBe(403);
    });

    it('should allow Admin to delete any comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});
