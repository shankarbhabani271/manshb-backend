import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/userModel.js";
import { Category } from "../models/categoryModel.js";

const router = Router();

// Apply authentication and strict Super Admin RBAC guard globally to this router
router.use(verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN));

/**
 * Super Admin Dashboard Statistics API
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalUsers, totalAdmins, totalCategories] = await Promise.all([
      User.countDocuments({ role: ROLES.USER, isDeleted: false }),
      User.countDocuments({ role: ROLES.ADMIN, isDeleted: false }),
      Category.countDocuments(),
    ]);

    const systemStats = {
      usersCount: totalUsers,
      adminsCount: totalAdmins,
      categoriesCount: totalCategories,
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    return res
      .status(200)
      .json(new ApiResponse(200, systemStats, "Super Admin dashboard statistics loaded successfully."));
  } catch (error) {
    next(error);
  }
});

/**
 * Super Admin Management: Retrieve all administrators
 */
router.get("/admins", async (req, res, next) => {
  try {
    const adminsList = await User.find({ role: ROLES.ADMIN, isDeleted: false }).select(
      "-password -refreshToken -otp -otpExpiry"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, adminsList, "Administrators list loaded successfully."));
  } catch (error) {
    next(error);
  }
});

export default router;
