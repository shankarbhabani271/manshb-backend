import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";
import cloudinary from "../config/cloudinary.js";
import jwt from "jsonwebtoken";

// Helper: Generate tokens and update the refresh token inside the database
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// Helper: Define cookie options matching token expirations
const getCookieOptions = (expiryDurationMs) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: expiryDurationMs,
  };
};

/**
 * Register normal user / admin and send SignUp OTP.
 */
export const registerUser = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log("\n--- [authController] [registerUser] START ---");
  console.log("req.body:", JSON.stringify(req.body));

  const { name, email, mobile, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  console.log("[STEP 3] Checking for duplicate email in database...");
  const existingUser = await User.findOne({ email: normalizedEmail, isDeleted: false });
  if (existingUser) {
    console.warn(`⚠️ [Duplicate Check] User email ${normalizedEmail} already exists.`);
    throw new ApiError(409, "Email already exists");
  }

  // Also check for duplicate mobile
  const existingMobile = await User.findOne({ mobile, isDeleted: false });
  if (existingMobile) {
    console.warn(`⚠️ [Duplicate Check] User mobile ${mobile} already exists.`);
    throw new ApiError(409, "Mobile already registered");
  }

  console.log("[STEP 4] Preparing database user document...");
  console.log("[STEP 5] Generating secure 6-digit OTP code...");
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  const user = await User.create({
    name,
    email: normalizedEmail,
    mobile,
    password,
    role: "User",
    isVerified: false,
    otp,
    otpExpiry,
    otpAttempts: 0,
  });

  console.log("savedUser:", JSON.stringify(user));
  console.log(`[STEP 6] Saving OTP code to user document in database (User ID: ${user._id})`);

  console.log(`[STEP 7] Sending verification OTP email to: ${normalizedEmail}`);
  try {
    await sendOtpEmail(normalizedEmail, otp, name, "registration");
    console.log("emailSent: true");
    console.log("📧 [Email Service] OTP dispatched successfully!");
  } catch (emailError) {
    console.error("🔴 [Email Service] Failed to send registration OTP email:", emailError);
    // Delete the unverified user document if email fails to let them retry
    await User.findByIdAndDelete(user._id);
    throw new ApiError(500, "OTP send failed");
  }

  const executionTime = Date.now() - startTime;
  console.log(`[STEP 8] Registration successfully initiated. Time elapsed: ${executionTime}ms`);
  console.log("--- [authController] [registerUser] END ---\n");

  return res.status(201).json({
    success: true,
    message: "OTP sent successfully",
    email: user.email,
  });
});

/**
 * Verify Registration OTP (Email Verification)
 */
export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Account has already been verified");
  }

  // Enforce maximum 5 OTP attempts
  if (user.otpAttempts >= 5) {
    throw new ApiError(403, "Maximum OTP verification attempts (5) exceeded. Please request a new OTP.");
  }

  if (!user.otp || user.otp !== otp) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, `Invalid OTP. Attempts left: ${5 - user.otpAttempts}`);
  }

  if (user.otpExpiry && new Date() > user.otpExpiry) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // Activate user
  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  await user.save();

  // Send Welcome Email
  try {
    await sendWelcomeEmail(email, user.username);
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const verifiedUser = await User.findById(user._id).select("-password -refreshToken");

  const accessExpiryMs = 15 * 60 * 1000;
  const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;

  return res
    .status(200)
    .cookie("accessToken", accessToken, getCookieOptions(accessExpiryMs))
    .cookie("refreshToken", refreshToken, getCookieOptions(refreshExpiryMs))
    .json(
      new ApiResponse(
        200,
        { user: verifiedUser, accessToken, refreshToken },
        "Account verified and logged in successfully."
      )
    );
});

/**
 * Login step 1: Validate password and send Login OTP (or login directly if Super Admin)
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Enforce email verification
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email first.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // REQ: If role is SUPER_ADMIN, do NOT send an OTP and skip verification
  if (user.role === "Super Admin") {
    // Generate Access & Refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry -otpAttempts");

    const accessExpiryMs = 15 * 60 * 1000;
    const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;

    return res
      .status(200)
      .cookie("accessToken", accessToken, getCookieOptions(accessExpiryMs))
      .cookie("refreshToken", refreshToken, getCookieOptions(refreshExpiryMs))
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken, otpRequired: false },
          "Super Admin authenticated successfully."
        )
      );
  }

  // REQ: If ADMIN or USER, generate and send 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity

  // REQ: If email sending fails, return error and do NOT log the user in
  try {
    await sendOtpEmail(email, otp, user.username, "login");
  } catch (emailError) {
    console.error("Failed to send login OTP email:", emailError);
    throw new ApiError(500, "Failed to send authorization OTP email. Please try again later.");
  }

  // Only update OTP details in DB if mail sending succeeded
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0; // Reset attempts
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email, otpRequired: true },
        "Credentials verified. An authorization OTP code has been sent to your email. Redirecting to OTP page."
      )
    );
});

/**
 * Login step 2: Verify Login OTP and issue JWT tokens
 */
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Enforce maximum 5 OTP attempts
  if (user.otpAttempts >= 5) {
    throw new ApiError(403, "Maximum verification attempts exceeded. Please login again to request a new OTP.");
  }

  if (!user.otp || user.otp !== otp) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, `Invalid OTP. Attempts left: ${5 - user.otpAttempts}`);
  }

  if (user.otpExpiry && new Date() > user.otpExpiry) {
    throw new ApiError(400, "OTP has expired. Please login again to request a new one.");
  }

  // Clear OTP attributes and update login timestamp
  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry -otpAttempts");

  const accessExpiryMs = 15 * 60 * 1000;
  const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;

  return res
    .status(200)
    .cookie("accessToken", accessToken, getCookieOptions(accessExpiryMs))
    .cookie("refreshToken", refreshToken, getCookieOptions(refreshExpiryMs))
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully."
      )
    );
});

/**
 * Resend OTP with 60 seconds throttle protection
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Limit spamming: check if previous OTP was generated less than 60 seconds ago
  if (user.otpExpiry) {
    const elapsedSeconds = (10 * 60 * 1000 - (user.otpExpiry - new Date())) / 1000;
    if (elapsedSeconds < 60) {
      throw new ApiError(429, `Too many requests. Please wait ${Math.ceil(60 - elapsedSeconds)} seconds before resending OTP.`);
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(email, otp, user.username, user.isVerified ? "login" : "registration");
  } catch (emailError) {
    console.error("Failed to resend verification email:", emailError);
    throw new ApiError(500, "Failed to send email. Try again later.");
  }

  return res.status(200).json(new ApiResponse(200, null, "A new OTP code has been sent to your email."));
});

/**
 * Forgot password - Send reset code.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(email, otp, user.username);
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    throw new ApiError(500, "Failed to send reset verification email.");
  }

  return res.status(200).json(new ApiResponse(200, null, "Password reset OTP sent to your email."));
});

/**
 * Reset password using verification code.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Enforce maximum 5 OTP attempts
  if (user.otpAttempts >= 5) {
    throw new ApiError(403, "Maximum OTP verification attempts exceeded. Please trigger forgot password again.");
  }

  if (!user.otp || user.otp !== otp) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, `Invalid OTP. Attempts left: ${5 - user.otpAttempts}`);
  }

  if (user.otpExpiry && new Date() > user.otpExpiry) {
    throw new ApiError(400, "OTP code has expired");
  }

  user.password = newPassword;
  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.refreshToken = null; // Invalidate all login sessions
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password reset successfully. You can now log in."));
});

/**
 * Change password when logged in.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid current password.");
  }

  user.password = newPassword;
  user.refreshToken = null; // Clear login sessions
  await user.save();

  return res
    .status(200)
    .clearCookie("accessToken", getCookieOptions(0))
    .clearCookie("refreshToken", getCookieOptions(0))
    .json(new ApiResponse(200, {}, "Password changed successfully. Please log in again."));
});

/**
 * Get current authenticated user details.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user retrieved successfully."));
});

/**
 * Update user profile details.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, mobile } = req.body;

  if (username && username !== req.user.username) {
    const duplicateUsername = await User.findOne({ username, isDeleted: false });
    if (duplicateUsername) throw new ApiError(409, "Username is already taken.");
    req.user.username = username;
  }

  if (email && email !== req.user.email) {
    const duplicateEmail = await User.findOne({ email, isDeleted: false });
    if (duplicateEmail) throw new ApiError(409, "Email is already taken.");
    req.user.email = email;
  }

  if (mobile && mobile !== req.user.mobile) {
    req.user.mobile = mobile;
  }

  await req.user.save();
  const updatedUser = await User.findById(req.user._id).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile details updated successfully."));
});

/**
 * Upload and update profile image.
 */
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please upload an image file.");
  }

  const user = await User.findById(req.user._id);

  if (user.avatar && user.avatar.publicId) {
    try {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    } catch (destroyError) {
      console.error("Failed to delete old avatar:", destroyError);
    }
  }

  user.avatar = {
    url: req.file.path,
    publicId: req.file.filename,
  };

  await user.save();
  const updatedUser = await User.findById(req.user._id).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile avatar updated successfully."));
});

/**
 * Logout user.
 */
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", getCookieOptions(0))
    .clearCookie("refreshToken", getCookieOptions(0))
    .json(new ApiResponse(200, {}, "Logged out successfully."));
});

/**
 * Rotate and refresh tokens.
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been rotated");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const accessExpiryMs = 15 * 60 * 1000;
    const refreshExpiryMs = 7 * 24 * 60 * 60 * 1000;

    return res
      .status(200)
      .cookie("accessToken", accessToken, getCookieOptions(accessExpiryMs))
      .cookie("refreshToken", refreshToken, getCookieOptions(refreshExpiryMs))
      .json(new ApiResponse(200, { accessToken, refreshToken }, "Token refreshed successfully."));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
