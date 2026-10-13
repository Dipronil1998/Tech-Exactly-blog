const request = require('supertest');
const assert = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_1234567890123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_1234567890123456';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_key_99999';

const app = require('../src/app');

async function runAdminTests() {
  let mongoServer;
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  try {
    console.log('\n[Admin Test Suite] Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Admin Test Suite] Connected to in-memory MongoDB.');

    // 1. Setup Admin and Regular User
    console.log('\n--- Setup: Registering Admin & Regular User ---');
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin_boss',
        email: 'boss@example.com',
        password: 'adminPassword123!',
        name: 'Admin Boss',
        role: 'admin',
        adminSecret: 'test_admin_secret_key_99999',
      });
    assert(adminRes.status === 201, 'Admin registered successfully');
    const adminToken = adminRes.body.data.accessToken;

    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'regular_user',
        email: 'reg@example.com',
        password: 'userPassword123!',
        name: 'Regular User',
      });
    assert(userRes.status === 201, 'Regular user registered successfully');
    const userToken = userRes.body.data.accessToken;

    // Create 2 posts
    const postRes1 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Post Number One',
        content: 'Content of the first post',
      });
    const postId1 = postRes1.body.data.post._id;

    const postRes2 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Post Number Two',
        content: 'Content of the second post by admin',
      });
    const postId2 = postRes2.body.data.post._id;

    // Create 2 comments
    await request(app)
      .post(`/api/posts/${postId1}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Comment on first post' });

    await request(app)
      .post(`/api/posts/${postId2}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ content: 'Comment on second post' });

    // 2. Authentication & RBAC Enforcement on /api/admin/stats
    console.log('\n--- Test 1: RBAC Access Control on Admin Dashboard ---');
    const noAuthRes = await request(app).get('/api/admin/stats');
    test('Unauthenticated request to /api/admin/stats is rejected with 401', () => {
      assert(noAuthRes.status === 401);
      assert(noAuthRes.body.success === false);
    });

    const userStatsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    test('Regular user request to /api/admin/stats is rejected with 403 Forbidden', () => {
      assert(userStatsRes.status === 403);
      assert(userStatsRes.body.success === false);
    });

    // 3. Admin successfully retrieves dashboard metrics
    console.log('\n--- Test 2: Admin Dashboard Metrics Retrieval ---');
    const adminStatsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    test('Admin request returns 200 OK', () => {
      assert(adminStatsRes.status === 200);
      assert(adminStatsRes.body.success === true);
    });

    test('Returns correct total number of users (2)', () => {
      assert.strictEqual(adminStatsRes.body.data.overview.totalUsers, 2);
    });

    test('Returns correct total number of posts (2)', () => {
      assert.strictEqual(adminStatsRes.body.data.overview.totalPosts, 2);
    });

    test('Returns correct total number of comments (2)', () => {
      assert.strictEqual(adminStatsRes.body.data.overview.totalComments, 2);
    });

    test('Returns recent activity lists', () => {
      assert(Array.isArray(adminStatsRes.body.data.recentUsers));
      assert(Array.isArray(adminStatsRes.body.data.recentPosts));
      assert(Array.isArray(adminStatsRes.body.data.recentComments));
    });

    // 4. Admin comments oversight endpoint
    console.log('\n--- Test 3: Admin Comments Oversight Endpoint ---');
    const adminCommentsRes = await request(app)
      .get('/api/admin/comments')
      .set('Authorization', `Bearer ${adminToken}`);

    test('Admin can list all platform comments (200)', () => {
      assert(adminCommentsRes.status === 200);
      assert(adminCommentsRes.body.data.comments.length === 2);
    });

    // Summary
    console.log(`\n========================================`);
    console.log(`ADMIN RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

if (require.main === module) {
  runAdminTests();
}

module.exports = runAdminTests;
