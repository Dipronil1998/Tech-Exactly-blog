const { registerSchema, loginSchema } = require('../../src/validations/authValidation');
const { createPostSchema, updatePostSchema } = require('../../src/validations/postValidation');
const { createCommentSchema, updateCommentSchema } = require('../../src/validations/commentValidation');

describe('Unit Test: Zod Request Validations', () => {
  describe('authValidation', () => {
    it('should validate valid user registration payload', () => {
      const validData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: 'Password123!',
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('valid@example.com');
    });

    it('should reject short passwords (< 6 chars)', () => {
      const invalidData = {
        username: 'validuser',
        email: 'valid@example.com',
        password: '123',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      const errors = result.error.issues || result.error.errors || [];
      expect(errors[0].message).toMatch(/at least 6 characters/i);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        username: 'validuser',
        email: 'not-an-email',
        password: 'Password123!',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      const errors = result.error.issues || result.error.errors || [];
      expect(errors[0].message).toMatch(/valid email/i);
    });

    it('should validate valid login payload with identifier', () => {
      const validData = {
        email: 'valid@example.com',
        password: 'Password123!',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject login without password', () => {
      const invalidData = {
        email: 'valid@example.com',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('postValidation', () => {
    it('should validate valid post payload', () => {
      const validPost = {
        title: 'Valid Story Title',
        content: 'This is sufficiently long story content for testing.',
        status: 'published',
      };
      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should reject post with title shorter than 3 characters', () => {
      const invalidPost = {
        title: 'Hi',
        content: 'Valid content here.',
      };
      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject post with content shorter than 5 characters', () => {
      const invalidPost = {
        title: 'Valid Title Here',
        content: 'Tiny',
      };
      const result = createPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should allow partial updates in updatePostSchema', () => {
      const partialUpdate = {
        title: 'Updated Title Only',
      };
      const result = updatePostSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('commentValidation', () => {
    it('should validate comment content', () => {
      const validComment = {
        content: 'Great insight and beautifully written article!',
      };
      const result = createCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
    });

    it('should reject empty or whitespace-only comments', () => {
      const emptyComment = {
        content: '   ',
      };
      const result = createCommentSchema.safeParse(emptyComment);
      expect(result.success).toBe(false);
    });

    it('should reject comment exceeding 1000 characters', () => {
      const longComment = {
        content: 'a'.repeat(1001),
      };
      const result = createCommentSchema.safeParse(longComment);
      expect(result.success).toBe(false);
    });
  });
});
