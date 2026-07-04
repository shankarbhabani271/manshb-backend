import { body, validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";
import { ROLE_LIST } from "../constants/roles.js";

// Helper middleware to gather and format validation outcomes
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = {};
  let firstErrorMessage = "";

  errors.array().forEach((err) => {
    const fieldName = err.path || err.param;
    if (!formattedErrors[fieldName]) {
      formattedErrors[fieldName] = err.msg;
      if (!firstErrorMessage) {
        firstErrorMessage = err.msg;
      }
    }
  });

  console.warn("⚠️ [Validator] Input validation failed:", formattedErrors);
  console.log("req.body:", JSON.stringify(req.body));
  console.log("Validation Result:", JSON.stringify(errors.array()));

  return res.status(400).json({
    success: false,
    message: firstErrorMessage || "Validation Failed",
    errors: formattedErrors,
  });
};

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile Number must contain exactly 10 digits")
    .isNumeric()
    .withMessage("Mobile Number must contain only digits"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain at least one special character"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password must match password");
      }
      return true;
    }),
  body("acceptTerms")
    .custom((value) => {
      if (value !== true && value !== "true") {
        throw new Error("Terms must be accepted");
      }
      return true;
    }),
  validate,
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validate,
];

const otpValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 characters long"),
  validate,
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),
  validate,
];

const resetPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 characters long"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage("New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"),
  validate,
];

const changePasswordValidator = [
  body("oldPassword")
    .notEmpty()
    .withMessage("Old password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .withMessage("New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"),
  validate,
];

const updateProfileValidator = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address"),
  body("mobile")
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage("Must be a valid mobile phone number"),
  validate,
];

export {
  registerValidator,
  loginValidator,
  otpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
};
