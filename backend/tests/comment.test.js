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
const Comment = require('../src/models/Comment');
const Post = require('../src/models/Post');

let mongoServer;

async function runCommentTests() {
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
    console.log('\n[Comment Test Suite] Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Comment Test Suite] Connected to in-memory MongoDB.');

    // 1. Setup Admin, Alice, Bob, and a Blog Post
    console.log('\n--- Setup: Registering Users & Creating Post ---');

    // Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin_commenter',
        email: 'admin_c@example.com',
        password: 'password123!',
        role: 'admin',
        adminSecret: 'test_admin_secret_key_99999',
      });
    const adminToken = adminRes.body.data.accessToken;

    // Alice
    const aliceRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice_commenter',
        email: 'alice_c@example.com',
        password: 'password123!',
        name: 'Alice Commenter',
      });
    const aliceToken = aliceRes.body.data.accessToken;
    const aliceId = aliceRes.body.data.user._id;

    // Bob
    const bobRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'bob_commenter',
        email: 'bob_c@example.com',
        password: 'password123!',
        name: 'Bob Commenter',
      });
    const bobToken = bobRes.body.data.accessToken;
    const bobId = bobRes.body.data.user._id;

    // Alice creates a Post
    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Building Interactive Blogs in 2026',
        content: 'Today we discuss implementing discussion sections and comments.',
      });
    const postId = postRes.body.data.post._id;
    const postSlug = postRes.body.data.post.slug;

    // 2. Create Comments
    console.log('\n--- Test 1: Create Comments on Post ---');
    const commentRes1 = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: 'Feel free to leave feedback on this article!',
      });
    assert(commentRes1.status === 201, 'Alice can create a comment (201)');
    assert(!!commentRes1.body.data.comment._id, 'Comment has valid _id');
    assert(commentRes1.body.data.comment.author.username === 'alice_commenter', 'Comment author populated');
    assert(commentRes1.body.data.comment.post.toString() === postId.toString(), 'Comment associated with post');
    const comment1Id = commentRes1.body.data.comment._id;

    // Bob creates a comment using post slug
    const commentRes2 = await request(app)
      .post(`/api/posts/${postSlug}/comments`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        content: 'Loved this post! Great breakdown of the concepts.',
      });
    assert(commentRes2.status === 201, 'Bob can create a comment using post slug (201)');
    assert(commentRes2.body.data.comment.author.username === 'bob_commenter', 'Bob populated as author');
    const comment2Id = commentRes2.body.data.comment._id;

    // 3. Zod Payload Validation
    console.log('\n--- Test 2: Comment Validation with Zod ---');
    const emptyComment = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: '   ',
      });
    assert(emptyComment.status === 400, 'Rejects empty comment with 400');
    assert(Array.isArray(emptyComment.body.errors), 'Returns structured Zod validation errors');

    const missingContent = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({});
    assert(missingContent.status === 400, 'Rejects missing content with 400');

    const unauthComment = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .send({
        content: 'Anonymous comment without token',
      });
    assert(unauthComment.status === 401, 'Rejects unauthenticated comment with 401');

    // 4. Get Comments for a Post
    console.log('\n--- Test 3: Get Post Comments ---');
    const listComments = await request(app).get(`/api/posts/${postId}/comments`);
    assert(listComments.status === 200, 'Public can view post comments (200)');
    assert(listComments.body.data.comments.length === 2, 'Lists all comments for post');
    assert(listComments.body.data.pagination.total === 2, 'Pagination total count matches');

    // Get single comment
    const singleComment = await request(app).get(`/api/comments/${comment1Id}`);
    assert(singleComment.status === 200, 'Can retrieve single comment by ID (200)');
    assert(singleComment.body.data.comment.content === 'Feel free to leave feedback on this article!', 'Comment content matches');

    // 5. Update Comment RBAC
    console.log('\n--- Test 4: Update Comment RBAC ---');
    // Alice CAN edit her own comment
    const aliceEditSelf = await request(app)
      .put(`/api/comments/${comment1Id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: 'Updated: Feel free to leave any comments or questions below!',
      });
    assert(aliceEditSelf.status === 200, 'Alice can edit her own comment (200)');
    assert(aliceEditSelf.body.data.comment.content.includes('Updated:'), 'Comment content successfully updated');

    // Bob CANNOT edit Alice's comment
    const bobEditAlice = await request(app)
      .put(`/api/comments/${comment1Id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        content: 'Hacked by Bob!',
      });
    assert(bobEditAlice.status === 403, "Bob CANNOT edit Alice's comment (403 Forbidden)");

    // Admin CAN edit Alice's comment
    const adminEditAlice = await request(app)
      .put(`/api/comments/${comment1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: '[Moderated by Admin] Please keep discussions constructive.',
      });
    assert(adminEditAlice.status === 200, "Admin CAN edit any user's comment (200)");

    // 6. Delete Comment RBAC
    console.log('\n--- Test 5: Delete Comment RBAC ---');
    // Bob CANNOT delete Alice's comment
    const bobDeleteAlice = await request(app)
      .delete(`/api/comments/${comment1Id}`)
      .set('Authorization', `Bearer ${bobToken}`);
    assert(bobDeleteAlice.status === 403, "Bob CANNOT delete Alice's comment (403 Forbidden)");

    // Alice CAN delete her own comment
    const aliceDeleteSelf = await request(app)
      .delete(`/api/comments/${comment1Id}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    assert(aliceDeleteSelf.status === 200, 'Alice can delete her own comment (200)');

    // Verify comment 1 deleted
    const verifyComment1Deleted = await request(app).get(`/api/comments/${comment1Id}`);
    assert(verifyComment1Deleted.status === 404, 'Deleted comment returns 404');

    // Admin CAN delete Bob's comment
    const adminDeleteBob = await request(app)
      .delete(`/api/comments/${comment2Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminDeleteBob.status === 200, "Admin CAN delete any user's comment (200)");

    // Summary
    console.log(`\n========================================`);
    console.log(`COMMENT RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Comment test execution failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runCommentTests();
