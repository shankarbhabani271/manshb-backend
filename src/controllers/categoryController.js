import { Category } from "../models/categoryModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../helpers/paginate.js";
import cloudinary from "../config/cloudinary.js";
import slugify from "slugify";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Helper to extract Cloudinary Public ID from URL for deletion
const getPublicIdFromCloudinaryUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const pathParts = parts.slice(uploadIndex + 2); // skip "upload" and "vXXXXXX"
    const fileWithExtension = pathParts.join("/");
    return fileWithExtension.split(".")[0];
  } catch (error) {
    return null;
  }
};

// Helper to safely delete image from Cloudinary or local disk storage
const deleteAsset = async (urlOrPath) => {
  if (!urlOrPath) return;
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    const publicId = getPublicIdFromCloudinaryUrl(urlOrPath);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(`Failed to delete Cloudinary asset [${publicId}]:`, error.message);
      }
    }
  } else if (urlOrPath.startsWith("/uploads/")) {
    // Resolve relative path to actual file on local disk
    const filename = urlOrPath.replace("/uploads/", "");
    const localFilePath = path.join("src", "uploads", filename);
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (error) {
      console.error(`Failed to delete local asset [${localFilePath}]:`, error.message);
    }
  }
};

// Helper to get correct URL/relative path from uploaded file
const getUploadedImagePath = (file) => {
  if (!file) return null;
  // If it's Cloudinary storage, path will be a full url
  if (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://"))) {
    return file.path;
  }
  // Local storage: return relative web path
  return `/uploads/${file.filename}`;
};

// Helper to find a category dynamically by ObjectId or Slug string
const findCategoryByIdOrSlug = async (idOrSlug) => {
  const query = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };
  return await Category.findOne(query);
};

/**
 * Create a new Category (Super Admin/Admin only)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug: customSlug, description, displayOrder, status, seoTitle, seoDescription } = req.body;

  // Image is required on creation
  if (!req.file) {
    throw new ApiError(400, "Category image is required");
  }

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    // Cleanup uploaded image first
    const tempPath = getUploadedImagePath(req.file);
    await deleteAsset(tempPath);
    throw new ApiError(409, "Category with this name already exists");
  }

  // Generate or sanitize slug
  const rawSlug = customSlug || name;
  let slug = slugify(rawSlug, { lower: true, strict: true });

  const existingSlug = await Category.findOne({ slug });
  if (existingSlug) {
    // Cleanup uploaded image first
    const tempPath = getUploadedImagePath(req.file);
    await deleteAsset(tempPath);
    throw new ApiError(409, "Category with this slug already exists");
  }

  const image = getUploadedImagePath(req.file);

  const category = await Category.create({
    name,
    slug,
    image,
    description: description || "",
    displayOrder: displayOrder || 0,
    status: status || "published",
    seoTitle: seoTitle || name,
    seoDescription: seoDescription || description || `Browse products in ${name} category`,
    createdBy: req.user?._id || null,
    updatedBy: req.user?._id || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully."));
});

/**
 * Get all categories (Supports Search, Filtering, and Pagination)
 * Displayed sorted by displayOrder (Ascending)
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status } = req.query;

  const query = {};

  // Text search on name or slug
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by status (published/draft)
  if (status && ["published", "draft"].includes(status)) {
    query.status = status;
  }

  const paginationResults = await paginate(Category, query, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { displayOrder: 1, name: 1 }, // Sort by displayOrder ascending, fallback to name
  });

  return res
    .status(200)
    .json(new ApiResponse(200, paginationResults, "Categories retrieved successfully."));
});

/**
 * Get all published categories sorted by displayOrder (Ascending)
 */
export const getPublishedCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: "published" }).sort({ displayOrder: 1, name: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Published categories retrieved successfully."));
});

/**
 * Get single category details by ID or Slug
 */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await findCategoryByIdOrSlug(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category retrieved successfully."));
});

/**
 * Update Category details by ID or Slug (Super Admin/Admin only)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug: customSlug, description, displayOrder, status, seoTitle, seoDescription } = req.body;

  const category = await findCategoryByIdOrSlug(id);
  if (!category) {
    // If a file was uploaded, discard it to avoid orphans
    if (req.file) {
      const tempPath = getUploadedImagePath(req.file);
      await deleteAsset(tempPath);
    }
    throw new ApiError(404, "Category not found");
  }

  // Handle name change check
  if (name && name !== category.name) {
    const nameDuplicate = await Category.findOne({ name, _id: { $ne: category._id } });
    if (nameDuplicate) {
      if (req.file) {
        const tempPath = getUploadedImagePath(req.file);
        await deleteAsset(tempPath);
      }
      throw new ApiError(409, "Category with this name already exists");
    }
    category.name = name;
    if (!customSlug) {
      category.slug = slugify(name, { lower: true, strict: true });
    }
  }

  // Handle manual slug changes
  if (customSlug) {
    const newSlug = slugify(customSlug, { lower: true, strict: true });
    const slugDuplicate = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
    if (slugDuplicate) {
      if (req.file) {
        const tempPath = getUploadedImagePath(req.file);
        await deleteAsset(tempPath);
      }
      throw new ApiError(409, "Category with this slug already exists");
    }
    category.slug = newSlug;
  }

  if (description !== undefined) category.description = description;
  if (displayOrder !== undefined) category.displayOrder = displayOrder;
  if (status !== undefined) category.status = status;
  if (seoTitle !== undefined) category.seoTitle = seoTitle;
  if (seoDescription !== undefined) category.seoDescription = seoDescription;

  // Handle file replacements
  if (req.file) {
    const oldImage = category.image;
    category.image = getUploadedImagePath(req.file);
    // Delete old image asset
    if (oldImage) {
      await deleteAsset(oldImage);
    }
  }

  category.updatedBy = req.user?._id || null;
  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully."));
});

/**
 * Delete Category by ID or Slug and clear assets (Super Admin only)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await findCategoryByIdOrSlug(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Delete assets from storage
  if (category.image) {
    await deleteAsset(category.image);
  }

  await Category.deleteOne({ _id: category._id });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Category and associated assets deleted successfully."));
});

/**
 * Toggle category status between published / draft
 */
export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await findCategoryByIdOrSlug(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  category.status = category.status === "published" ? "draft" : "published";
  category.updatedBy = req.user?._id || null;
  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, category, `Category status switched to '${category.status}'.`));
});
