import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ROLES, ROLE_LIST } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.CUSTOMER,
    },
    avatar: {
      url: {
        type: String,
        default: "https://res.cloudinary.com/demo/image/upload/d_avatar.png/v1/avatar.png",
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save password hashing and backward compatible mapping hook
userSchema.pre("save", async function () {
  if (this.name) {
    const parts = this.name.trim().split(/\s+/);
    this.firstName = parts[0] || "User";
    this.lastName = parts.slice(1).join(" ") || "Account";
    if (!this.username) {
      this.username = this.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    }
  }
  if (this.mobile && !this.phone) {
    this.phone = this.mobile;
  }
  if (this.phone && !this.mobile) {
    this.mobile = this.phone;
  }

  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Pre-query soft-delete filter hook
userSchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

// Compare password correctness
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate signed Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY,
    }
  );
};

// Generate signed Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
export default User;
