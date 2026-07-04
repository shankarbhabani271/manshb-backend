import { body, param, validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

// Helper middleware to gather and format validation outcomes
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  throw new ApiError(422, "Category input validation failed", formattedErrors);
};

const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters long"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Slug must be between 2 and 100 characters long"),
  body("displayOrder")
    .notEmpty()
    .withMessage("Display order is required")
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),
  body("status")
    .optional()
    .isIn(["published", "draft"])
    .withMessage("Status must be either 'published' or 'draft'"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("seoTitle")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("SEO Title cannot exceed 150 characters"),
  body("seoDescription")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("SEO Description cannot exceed 250 characters"),
  validate,
];

const updateCategoryValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters long"),
  body("slug")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Slug must be between 2 and 100 characters long"),
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),
  body("status")
    .optional()
    .isIn(["published", "draft"])
    .withMessage("Status must be either 'published' or 'draft'"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("seoTitle")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("SEO Title cannot exceed 150 characters"),
  body("seoDescription")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("SEO Description cannot exceed 250 characters"),
  validate,
];

export { createCategoryValidator, updateCategoryValidator };
