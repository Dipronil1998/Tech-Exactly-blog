const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_12345';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_67890';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_key_99999';

const app = require('../src/app');
const User = require('../src/models/User');
const Post = require('../src/models/Post');

let mongoServer;

async function runRbacTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    console.log('\n[RBAC Test Suite] Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[RBAC Test Suite] Connected to in-memory MongoDB.');

    // 1. Setup Admin, Regular User 1 (Alice), Regular User 2 (Bob)
    console.log('\n--- Setup: Registering Users & Roles ---');

    // Register Admin
    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'super_admin',
        email: 'admin@example.com',
        password: 'adminPassword123!',
        name: 'Super Admin',
        role: 'admin',
        adminSecret: 'test_admin_secret_key_99999',
      });
    assert(adminReg.status === 201, 'Admin registered successfully (201)');
    assert(adminReg.body.data.user.role === 'admin', 'Registered user has "admin" role');
    const adminToken = adminReg.body.data.accessToken;
    const adminId = adminReg.body.data.user._id;

    // Reject admin registration if invalid secret
    const fakeAdminReg = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'fake_admin',
        email: 'fake@example.com',
        password: 'password123!',
        role: 'admin',
        adminSecret: 'wrong_secret',
      });
    assert(fakeAdminReg.status === 403, 'Unauthorized admin registration rejected with 403');

    // Register Regular User 1 (Alice)
    const aliceReg = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice_user',
        email: 'alice@example.com',
        password: 'alicePassword123!',
        name: 'Alice User',
      });
    assert(aliceReg.status === 201, 'Alice registered as regular user (201)');
    assert(aliceReg.body.data.user.role === 'user', 'Alice has "user" role');
    const aliceToken = aliceReg.body.data.accessToken;
    const aliceId = aliceReg.body.data.user._id;

    // Register Regular User 2 (Bob)
    const bobReg = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'bob_user',
        email: 'bob@example.com',
        password: 'bobPassword123!',
        name: 'Bob User',
      });
    assert(bobReg.status === 201, 'Bob registered as regular user (201)');
    const bobToken = bobReg.body.data.accessToken;
    const bobId = bobReg.body.data.user._id;

    // 2. User Management RBAC
    console.log('\n--- Test: User Management RBAC ---');

    // Admin can list all users
    const adminListUsers = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminListUsers.status === 200, 'Admin can list all users (200)');
    assert(adminListUsers.body.data.users.length >= 3, 'Admin sees all users in system');

    // Regular user CANNOT list all users
    const aliceListUsers = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceListUsers.status === 403, 'Regular user cannot list all users (403 Forbidden)');

    // Alice can view her own user profile
    const aliceViewSelf = await request(app)
      .get(`/api/users/${aliceId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceViewSelf.status === 200, 'Alice can view her own user profile (200)');

    // Alice CANNOT view Bob's user profile via user management endpoint
    const aliceViewBob = await request(app)
      .get(`/api/users/${bobId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceViewBob.status === 403, "Alice cannot view another user's profile (403 Forbidden)");

    // Alice CANNOT promote herself to admin
    const alicePromoteSelf = await request(app)
      .put(`/api/users/${aliceId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ role: 'admin' });
    assert(alicePromoteSelf.status === 403, 'Regular user cannot change role (403 Forbidden)');

    // Admin can update user role (promote Bob to admin)
    const adminPromoteBob = await request(app)
      .put(`/api/users/${bobId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    assert(adminPromoteBob.status === 200, 'Admin can update user role to admin (200)');
    assert(adminPromoteBob.body.data.user.role === 'admin', 'Bob role is now admin');

    // Admin can demote Bob back to user
    const adminDemoteBob = await request(app)
      .put(`/api/users/${bobId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    assert(adminDemoteBob.status === 200, 'Admin can demote user back to user (200)');

    // Admin cannot remove their own admin role
    const adminDemoteSelf = await request(app)
      .put(`/api/users/${adminId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });
    assert(adminDemoteSelf.status === 400, 'Admin cannot demote own admin account (400)');

    // Alice CANNOT delete a user
    const aliceDeleteBob = await request(app)
      .delete(`/api/users/${bobId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceDeleteBob.status === 403, 'Regular user cannot delete users (403 Forbidden)');

    // Admin cannot delete own account
    const adminDeleteSelf = await request(app)
      .delete(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDeleteSelf.status === 400, 'Admin cannot delete own account (400)');

    // 3. Post Management RBAC
    console.log('\n--- Test: Post Management RBAC ---');

    // Alice creates Post A
    const postARes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: "Alice's First Post",
        content: 'Content written by Alice for testing permissions.',
      });
    assert(postARes.status === 201, 'Alice can create a post (201)');
    const postAId = postARes.body.data.post._id;

    // Bob creates Post B
    const postBRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        title: "Bob's Tech Article",
        content: 'Content written by Bob for testing permissions.',
      });
    assert(postBRes.status === 201, 'Bob can create a post (201)');
    const postBId = postBRes.body.data.post._id;

    // Anyone can read posts
    const publicList = await request(app).get('/api/posts');
    assert(publicList.status === 200, 'Public list of posts accessible (200)');
    assert(publicList.body.data.posts.length >= 2, 'Lists created posts');

    // Alice CAN edit her own Post A
    const aliceEditPostA = await request(app)
      .put(`/api/posts/${postAId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: "Alice's Updated Post Title",
      });
    assert(aliceEditPostA.status === 200, 'Alice can edit her own post (200)');
    assert(aliceEditPostA.body.data.post.title === "Alice's Updated Post Title", 'Post title was updated');

    // Bob CANNOT edit Alice's Post A
    const bobEditPostA = await request(app)
      .put(`/api/posts/${postAId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        title: 'Tampered by Bob!',
      });
    assert(bobEditPostA.status === 403, "Bob CANNOT edit Alice's post (403 Forbidden)");

    // Bob CANNOT delete Alice's Post A
    const bobDeletePostA = await request(app)
      .delete(`/api/posts/${postAId}`)
      .set('Authorization', `Bearer ${bobToken}`);
    assert(bobDeletePostA.status === 403, "Bob CANNOT delete Alice's post (403 Forbidden)");

    // Admin CAN edit Alice's Post A
    const adminEditPostA = await request(app)
      .put(`/api/posts/${postAId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: "Moderated by Admin: Alice's Post",
      });
    assert(adminEditPostA.status === 200, "Admin CAN edit any user's post (200)");

    // Admin CAN delete Bob's Post B
    const adminDeletePostB = await request(app)
      .delete(`/api/posts/${postBId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDeletePostB.status === 200, "Admin CAN delete any user's post (200)");

    // Alice CAN delete her own Post A
    const aliceDeletePostA = await request(app)
      .delete(`/api/posts/${postAId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceDeletePostA.status === 200, 'Alice CAN delete her own post (200)');

    // Confirm Post A is deleted
    const verifyPostADeleted = await request(app).get(`/api/posts/${postAId}`);
    assert(verifyPostADeleted.status === 404, 'Deleted post returns 404 Not Found');

    // Admin can delete user Bob
    const adminDeleteBob = await request(app)
      .delete(`/api/users/${bobId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDeleteBob.status === 200, 'Admin can delete user (200)');

    console.log(`\n========================================`);
    console.log(`RBAC RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('RBAC test execution failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runRbacTests();
