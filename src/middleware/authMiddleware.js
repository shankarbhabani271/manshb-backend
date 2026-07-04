import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";

/**
 * Middleware to verify JWT authorization.
 * Attaches verified user to req.user.
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Access denied. Authentication token is missing.");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user excluding sensitive credentials
    const user = await User.findOne({ _id: decodedToken?._id, isDeleted: false }).select(
      "-password -refreshToken -otp -otpExpiry"
    );

    if (!user) {
      throw new ApiError(401, "Invalid token. User session could not be found.");
    }

    // Verify account verification status
    if (!user.isVerified) {
      throw new ApiError(403, "Access Forbidden. Account verification is pending.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired authorization token.");
  }
});

export default verifyJWT;
