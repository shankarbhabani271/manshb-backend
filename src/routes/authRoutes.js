import { Router } from "express";
import {
  registerUser,
  verifyRegisterOtp,
  loginUser,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
  logoutUser,
  refreshAccessToken,
} from "../controllers/authController.js";
import {
  registerValidator,
  loginValidator,
  otpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} from "../validators/authValidator.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";

const router = Router();

// ==========================================
// PUBLIC ENDPOINTS (Verification and Login)
// ==========================================
router.post("/register", registerValidator, registerUser);
router.post("/verify-signup-otp", otpValidator, verifyRegisterOtp);
router.post("/login", loginValidator, loginUser);
router.post("/verify-login-otp", otpValidator, verifyLoginOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.post("/reset-password", resetPasswordValidator, resetPassword);
router.post("/refresh-token", refreshAccessToken);

// ==========================================
// PROTECTED ENDPOINTS (Requires Login)
// ==========================================
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changePasswordValidator, changePassword);
router.get("/me", verifyJWT, getCurrentUser);
router.put("/update-profile", verifyJWT, updateProfileValidator, updateProfile);
router.post("/upload-avatar", verifyJWT, upload.single("avatar"), uploadProfileImage);

export default router;
