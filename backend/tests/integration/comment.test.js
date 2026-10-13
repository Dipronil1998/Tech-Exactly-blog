const request = require('supertest');
const app = require('../../src/app');
const dbHandler = require('../helpers/dbHandler');

describe('Integration Test: Comment Management', () => {
  let userToken;
  let testPost;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    const reg = await request(app).post('/api/auth/register').send({
      username: 'commenter',
      email: 'commenter@example.com',
      password: 'Password123!',
    });
    userToken = reg.body.data.accessToken;

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Story Open For Comments',
        content: 'Article content awaiting feedback.',
      });
    testPost = postRes.body.data.post;
  });

  describe('POST /api/posts/:postId/comments', () => {
    it('should create comment using post ObjectId', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Brilliant article, loved the breakdown!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Brilliant article, loved the breakdown!');
      expect(res.body.data.comment.author.username).toBe('commenter');
    });

    it('should create comment using post slug', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost.slug}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Leaving a thought via post slug!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject comment without authentication (401)', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .send({ content: 'Unauthenticated comment' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts/:postId/comments', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'First test comment' });
    });

    it('should list all comments for a post with author populated', async () => {
      const res = await request(app).get(`/api/posts/${testPost._id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(1);
      expect(res.body.data.comments[0].content).toBe('First test comment');
      expect(res.body.data.comments[0].author.username).toBe('commenter');
    });
  });

  describe('PUT /api/comments/:id & DELETE /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Comment before edit' });
      commentId = res.body.data.comment._id;
    });

    it('should update own comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Updated comment text' });

      expect(res.status).toBe(200);
      expect(res.body.data.comment.content).toBe('Updated comment text');
    });

    it('should delete own comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      // Verify comment no longer found
      const getRes = await request(app).get(`/api/comments/${commentId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
