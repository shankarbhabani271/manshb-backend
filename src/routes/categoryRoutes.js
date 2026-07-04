import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getPublishedCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../controllers/categoryController.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "../validators/categoryValidator.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";
import { upload } from "../middleware/multer.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (Read-only Catalog)
// ==========================================
router.get("/", getAllCategories);
router.get("/published", getPublishedCategories);
router.get("/:id", getCategoryBySlug);

// ==========================================
// SECURED WRITE ROUTES (Admin & Super Admin)
// ==========================================
// Create Category (Requires Image upload)
router.post(
  "/",
  verifyJWT,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  upload.single("image"),
  createCategoryValidator,
  createCategory
);

// Update Category details
router.put(
  "/:id",
  verifyJWT,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  upload.single("image"),
  updateCategoryValidator,
  updateCategory
);

// Toggle Category status (Published/Draft)
router.patch(
  "/:id/toggle",
  verifyJWT,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  toggleCategoryStatus
);

// ==========================================
// CRITICAL DELETION ROUTE (Super Admin Only)
// ==========================================
router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles(ROLES.SUPER_ADMIN),
  deleteCategory
);

export default router;
