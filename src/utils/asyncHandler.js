/**
 * Higher-order utility to wrap async route handlers and forward rejected promises to Express error middlewares.
 * @param {Function} requestHandler - The async route handler function
 * @returns {Function} Express middleware wrapper
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
export default asyncHandler;
