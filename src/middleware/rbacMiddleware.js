import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to restrict route access to specific roles.
 * @param {...string} allowedRoles - The roles permitted to access this endpoint
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user must exist, populated by verifyJWT middleware
    if (!req.user) {
      throw new ApiError(401, "Unauthorized. Authentication is required.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Role '${req.user.role}' is not authorized to perform this action.`
      );
    }

    next();
  };
};

export default authorizeRoles;
