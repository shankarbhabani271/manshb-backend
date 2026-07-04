import { ApiError } from "../utils/ApiError.js";

/**
 * Global centralized error responder middleware.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Wrap generic errors in ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  // Output logs to terminal
  console.error(`🔴 [Error Middleware] [${req.method}] ${req.url} - Code: ${error.statusCode}`);
  console.error(error.stack || error.message);

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
export default errorHandler;
