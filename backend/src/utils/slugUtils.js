/**
 * Converts a string into a clean, URL-friendly slug.
 * Example: "My First Post! & Guide (2026)" -> "my-first-post-guide-2026"
 */
const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize Unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics / accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading & trailing hyphens
};

/**
 * Generates a unique slug in the given Mongoose Model.
 * Appends an incrementing counter if a duplicate slug exists.
 *
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {string} title - The title to generate slug from
 * @param {string|import('mongoose').Types.ObjectId} [excludeId] - Optional doc ID to exclude when updating
 * @returns {Promise<string>} Unique slug string
 */
const generateUniqueSlug = async (Model, title, excludeId = null) => {
  const baseSlug = slugify(title) || 'post';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

module.exports = {
  slugify,
  generateUniqueSlug,
};
