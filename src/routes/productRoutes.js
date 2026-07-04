import { Router } from "express";
import {
  getNewArrivals,
  getProductsByCategorySlug,
  getProductBySlug,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleNewArrival,
  toggleProductStatus,
} from "../controllers/productController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";
import upload from "../middleware/multer.js";

const router = Router();

// ─────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ─────────────────────────────────────────────────────

// IMPORTANT: /new-arrivals MUST come before /:slug
router.get("/new-arrivals", getNewArrivals);
router.get("/category/:slug", getProductsByCategorySlug);
router.get("/:slug", getProductBySlug);

// ─────────────────────────────────────────────────────
// ADMIN ROUTES (auth required)
// ─────────────────────────────────────────────────────

router.get(
  "/",
  verifyJWT,
  authorizeRoles("Super Admin", "Admin"),
  getAllProducts
);

router.post(
  "/",
  verifyJWT,
  authorizeRoles("Super Admin", "Admin"),
  upload.single("image"),
  createProduct
);

router.put(
  "/:id",
  verifyJWT,
  authorizeRoles("Super Admin", "Admin"),
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("Super Admin"),
  deleteProduct
);

router.patch(
  "/:id/toggle-arrival",
  verifyJWT,
  authorizeRoles("Super Admin", "Admin"),
  toggleNewArrival
);

router.patch(
  "/:id/toggle-status",
  verifyJWT,
  authorizeRoles("Super Admin", "Admin"),
  toggleProductStatus
);

export default router;
