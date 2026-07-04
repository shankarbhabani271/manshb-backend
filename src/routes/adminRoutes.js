import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/categoryModel.js";

const router = Router();

// Apply authentication and Admin/Super Admin role authorization globally to this router
router.use(verifyJWT, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN));

/**
 * Admin Limited Dashboard Statistics API
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    
    const adminStats = {
      categoriesCount: totalCategories,
      scope: "Limited Admin Dashboard Statistics",
      timestamp: new Date(),
    };

    return res
      .status(200)
      .json(new ApiResponse(200, adminStats, "Admin dashboard statistics loaded successfully."));
  } catch (error) {
    next(error);
  }
});

export default router;
