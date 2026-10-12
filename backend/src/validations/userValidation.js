const { z } = require('zod');

// Schema for updating a user
const updateUserSchema = z.object({
  name: z.string().trim().optional(),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores')
    .optional(),
  role: z.enum(['user', 'admin']).optional(),
});

// Schema for updating user role (Admin only)
const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    required_error: 'Role must be either "user" or "admin"',
  }),
});

module.exports = {
  updateUserSchema,
  updateRoleSchema,
};
