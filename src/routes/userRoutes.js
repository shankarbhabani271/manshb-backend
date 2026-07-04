import { Router } from "express";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// Apply authentication and strict User role validation globally to this router
router.use(verifyJWT, authorizeRoles(ROLES.USER));

/**
 * User Specific Profile Dashboard API
 */
router.get("/dashboard", (req, res) => {
  const userDetails = {
    username: req.user.username,
    email: req.user.email,
    mobile: req.user.mobile,
    role: req.user.role,
    cartItemsCount: 0,
    wishlistCount: 0,
    ordersCount: 0,
    message: "Welcome to your customer dashboard!",
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userDetails, "Customer dashboard info loaded successfully."));
});

export default router;
