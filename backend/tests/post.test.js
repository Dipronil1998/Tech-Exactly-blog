const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_12345';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_67890';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const app = require('../src/app');
const Post = require('../src/models/Post');

let mongoServer;

async function runPostTests() {
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
    console.log('\n[Post Test Suite] Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Post Test Suite] Connected to in-memory MongoDB.');

    // 1. Setup authenticated user
    console.log('\n--- Setup: Registering Author ---');
    const authorRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'tech_author',
        email: 'author@example.com',
        password: 'authorPassword123!',
        name: 'Tech Author',
      });
    assert(authorRes.status === 201, 'Author registered successfully (201)');
    const token = authorRes.body.data.accessToken;

    // 2. Post Creation & Slug Generation
    console.log('\n--- Test 1: Create Post & Auto Slug Generation ---');
    const postRes1 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mastering Node.js & Clean Architecture (2026 Guide)!',
        content: 'Comprehensive deep dive into building scalable backend services.',
        status: 'published',
      });

    assert(postRes1.status === 201, 'Post created successfully (201)');
    assert(!!postRes1.body.data.post._id, 'Post has valid _id');
    assert(postRes1.body.data.post.slug === 'mastering-nodejs-clean-architecture-2026-guide', 'Generated clean URL-friendly slug');
    assert(postRes1.body.data.post.isDeleted === false, 'Post is not deleted by default');
    assert(postRes1.body.data.post.deletedAt === null, 'Post deletedAt is null');
    assert(!!postRes1.body.data.post.createdAt, 'Post has createdAt timestamp');
    assert(!!postRes1.body.data.post.updatedAt, 'Post has updatedAt timestamp');
    assert(postRes1.body.data.post.author.username === 'tech_author', 'Post author is populated correctly');
    const post1Id = postRes1.body.data.post._id;
    const post1Slug = postRes1.body.data.post.slug;

    // 3. Slug Collision Handling
    console.log('\n--- Test 2: Slug Collision / Duplicate Handling ---');
    const postRes2 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mastering Node.js & Clean Architecture (2026 Guide)!',
        content: 'Another post with the exact same title to test uniqueness.',
      });

    assert(postRes2.status === 201, 'Second post with duplicate title created (201)');
    assert(postRes2.body.data.post.slug === 'mastering-nodejs-clean-architecture-2026-guide-1', 'Slug collision resolved with unique counter suffix');
    const post2Id = postRes2.body.data.post._id;

    // 4. Payload Validation with Zod
    console.log('\n--- Test 3: Zod Payload Validation ---');
    const invalidPost1 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hi', // too short (< 3)
        content: 'Valid content long enough',
      });
    assert(invalidPost1.status === 400, 'Rejects title shorter than 3 characters with 400');
    assert(Array.isArray(invalidPost1.body.errors), 'Returns structured Zod errors array');

    const invalidPost2 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Valid Post Title',
        content: 'Tiny', // too short (< 5)
      });
    assert(invalidPost2.status === 400, 'Rejects content shorter than 5 characters with 400');

    const invalidPost3 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'No title provided in payload.',
      });
    assert(invalidPost3.status === 400, 'Rejects missing title with 400');

    // 5. Query Post by ID and by Slug
    console.log('\n--- Test 4: Query by ObjectId and Slug ---');
    const getById = await request(app).get(`/api/posts/${post1Id}`);
    assert(getById.status === 200, 'Can retrieve post by ObjectId (200)');
    assert(getById.body.data.post.slug === post1Slug, 'Retrieved post matches slug');

    const getBySlug = await request(app).get(`/api/posts/${post1Slug}`);
    assert(getBySlug.status === 200, 'Can retrieve post by URL slug (200)');
    assert(getBySlug.body.data.post._id.toString() === post1Id.toString(), 'Slug query matches correct post');

    // 6. Update Post (and Slug Regeneration)
    console.log('\n--- Test 5: Update Post & Slug Update ---');
    const updateRes = await request(app)
      .put(`/api/posts/${post1Id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title for Clean Architecture',
        content: 'Updated content with fresh insights on testing and patterns.',
      });
    assert(updateRes.status === 200, 'Post updated successfully (200)');
    assert(updateRes.body.data.post.slug === 'updated-title-for-clean-architecture', 'Slug was automatically regenerated from new title');

    // 7. Soft Delete
    console.log('\n--- Test 6: Soft Delete Operation ---');
    const deleteRes = await request(app)
      .delete(`/api/posts/${post1Id}`)
      .set('Authorization', `Bearer ${token}`);
    assert(deleteRes.status === 200, 'Delete request succeeds with 200');
    assert(deleteRes.body.data.post.isDeleted === true, 'Post isDeleted flag set to true');
    assert(!!deleteRes.body.data.post.deletedAt, 'Post deletedAt timestamp set');

    // Verify post still exists in DB (soft deleted, not destroyed)
    const rawPostInDb = await Post.findById(post1Id);
    assert(!!rawPostInDb, 'Post still exists in MongoDB');
    assert(rawPostInDb.isDeleted === true, 'Database record has isDeleted: true');

    // 8. Soft-deleted post excluded from general queries
    console.log('\n--- Test 7: Soft-Deleted Posts Hidden from Public Feeds ---');
    const publicList = await request(app).get('/api/posts');
    assert(publicList.status === 200, 'Public feed returns 200');
    const foundDeletedInList = publicList.body.data.posts.some((p) => p._id.toString() === post1Id.toString());
    assert(!foundDeletedInList, 'Soft-deleted post is excluded from public list');

    // Soft-deleted post returns 404 on public single-post request
    const publicGetDeleted = await request(app).get(`/api/posts/${post1Id}`);
    assert(publicGetDeleted.status === 404, 'Public query for soft-deleted post returns 404');

    // 9. Restore Soft-Deleted Post
    console.log('\n--- Test 8: Restore Soft-Deleted Post ---');
    const restoreRes = await request(app)
      .patch(`/api/posts/${post1Id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    assert(restoreRes.status === 200, 'Restore endpoint returns 200');
    assert(restoreRes.body.data.post.isDeleted === false, 'Restored post has isDeleted: false');
    assert(restoreRes.body.data.post.deletedAt === null, 'Restored post deletedAt is cleared to null');

    // Restored post is visible again in public feeds
    const publicListAfterRestore = await request(app).get('/api/posts');
    const foundRestoredInList = publicListAfterRestore.body.data.posts.some((p) => p._id.toString() === post1Id.toString());
    assert(foundRestoredInList, 'Restored post is visible again in public list');

    // Summary
    console.log(`\n========================================`);
    console.log(`POST RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Post test execution failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPostTests();
