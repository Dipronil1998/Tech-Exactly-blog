const request = require('supertest');
const app = require('../../src/app');
const Post = require('../../src/models/Post');
const dbHandler = require('../helpers/dbHandler');

describe('Integration Test: Post Management & Slugs', () => {
  let userToken;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    // Create an authenticated author
    const reg = await request(app).post('/api/auth/register').send({
      username: 'postauthor',
      email: 'postauthor@example.com',
      password: 'AuthorPassword123!',
    });
    userToken = reg.body.data.accessToken;
  });

  describe('POST /api/posts', () => {
    it('should create a post and generate a clean URL slug', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Understanding React Server Components',
          content: 'Detailed editorial breakdown of server components and streaming SSR.',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.slug).toBe('understanding-react-server-components');
      expect(res.body.data.post.isDeleted).toBe(false);
      expect(res.body.data.post.author).toBeDefined();
    });

    it('should resolve slug collisions with unique numerical suffix', async () => {
      // First post
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Modern Web Architecture',
          content: 'First article content here.',
        });

      // Second post with identical title
      const res2 = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Modern Web Architecture',
          content: 'Second article content here.',
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.post.slug).toBe('modern-web-architecture-1');
    });

    it('should reject post creation without auth token (401)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ title: 'Unauthorized Post', content: 'Some content' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts & /api/posts/:idOrSlug', () => {
    let createdPost;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Deep Dive into Mongoose Queries',
          content: 'Complete guide explaining aggregation pipelines and lean queries.',
        });
      createdPost = res.body.data.post;
    });

    it('should retrieve post by its generated slug', async () => {
      const res = await request(app).get(`/api/posts/${createdPost.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.title).toBe('Deep Dive into Mongoose Queries');
    });

    it('should retrieve post by its MongoDB ObjectId', async () => {
      const res = await request(app).get(`/api/posts/${createdPost._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.post.slug).toBe(createdPost.slug);
    });

    it('should support search and pagination in public feed', async () => {
      const res = await request(app).get('/api/posts?search=Mongoose&page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update post and regenerate slug when title changes', async () => {
      const createRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Old Title',
          content: 'Existing post content.',
        });
      const postId = createRes.body.data.post._id;

      const updateRes = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Brand New Title',
          content: 'Updated content.',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.post.title).toBe('Brand New Title');
      expect(updateRes.body.data.post.slug).toBe('brand-new-title');
    });
  });

  describe('Soft Delete & Restore Operations', () => {
    let post;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Soft Delete Post Test',
          content: 'Content that will be soft-deleted.',
        });
      post = res.body.data.post;
    });

    it('should soft-delete post and hide it from public feed', async () => {
      const delRes = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.post.isDeleted).toBe(true);

      // Verify post still exists in DB
      const postInDb = await Post.findById(post._id);
      expect(postInDb.isDeleted).toBe(true);
      expect(postInDb.deletedAt).toBeDefined();

      // Verify hidden from public endpoints
      const getRes = await request(app).get(`/api/posts/${post.slug}`);
      expect(getRes.status).toBe(404);

      const feedRes = await request(app).get('/api/posts');
      expect(feedRes.body.data.posts.length).toBe(0);
    });

    it('should restore a soft-deleted post', async () => {
      await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      const restoreRes = await request(app)
        .patch(`/api/posts/${post._id}/restore`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.post.isDeleted).toBe(false);
      expect(restoreRes.body.data.post.deletedAt).toBeNull();

      // Verify visible again in public feed
      const getRes = await request(app).get(`/api/posts/${post.slug}`);
      expect(getRes.status).toBe(200);
    });
  });
});
