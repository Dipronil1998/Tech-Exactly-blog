const { z } = require('zod');

// Schema for user registration
const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().optional().default(''),
  role: z.enum(['user', 'admin']).optional().default('user'),
  adminSecret: z.string().optional(),
});

// Schema for user login
const loginSchema = z
  .object({
    email: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .refine((data) => !!(data.email || data.username), {
    message: 'Email or username is required',
    path: ['identifier'],
  });

// Schema for Google OAuth login / registration
const googleAuthSchema = z
  .object({
    idToken: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    googleId: z.string().optional(),
    avatar: z.string().optional(),
  })
  .refine((data) => !!(data.idToken || data.email || data.googleId), {
    message: 'Google ID token or account details are required',
  });

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
};
