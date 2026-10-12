// Reusable Express middleware for Zod schema validation
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const formattedErrors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: issues[0]?.message || 'Validation error',
      errors: formattedErrors,
    });
  }

  // Replace req.body with sanitized and validated data
  req.body = result.data;
  next();
};

module.exports = validate;
