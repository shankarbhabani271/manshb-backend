/**
 * Reusable Mongoose helper function to handle paginated queries.
 * @param {object} model - The Mongoose Model to query
 * @param {object} [query={}] - MongoDB query filters
 * @param {object} [options={}] - Pagination options
 * @param {number|string} [options.page=1] - Current page number
 * @param {number|string} [options.limit=10] - Number of items per page
 * @param {object|string} [options.sort={ createdAt: -1 }] - Mongoose sort criteria
 * @param {string} [options.select=""] - Fields to select (space-separated)
 * @param {string|object} [options.populate=""] - Mongoose populate options
 * @returns {Promise<object>} Pagination results with metadata
 */
export const paginate = async (model, query = {}, options = {}) => {
  const page = parseInt(options.page || "1", 10);
  const limit = parseInt(options.limit || "10", 10);
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };
  const select = options.select || "";
  const populate = options.populate || "";

  // Perform count and query execution in parallel for better performance
  const [totalResults, results] = await Promise.all([
    model.countDocuments(query),
    (async () => {
      let q = model.find(query).sort(sort).skip(skip).limit(limit);
      if (select) q = q.select(select);
      if (populate) q = q.populate(populate);
      return await q;
    })(),
  ]);

  const totalPages = Math.ceil(totalResults / limit);

  return {
    results,
    page,
    limit,
    totalPages,
    totalResults,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
