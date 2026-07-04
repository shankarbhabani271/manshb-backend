import { Product } from "../models/productModel.js";
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

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

const getPublicIdFromCloudinaryUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    return parts.slice(uploadIndex + 2).join("/").split(".")[0];
  } catch { return null; }
};

const deleteAsset = async (urlOrPath) => {
  if (!urlOrPath) return;
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    const publicId = getPublicIdFromCloudinaryUrl(urlOrPath);
    if (publicId) { try { await cloudinary.uploader.destroy(publicId); } catch {} }
  } else if (urlOrPath.startsWith("/uploads/")) {
    const localFilePath = path.join("src", "uploads", urlOrPath.replace("/uploads/", ""));
    try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch {}
  }
};

const getUploadedImagePath = (file) => {
  if (!file) return null;
  if (file.path && (file.path.startsWith("http://") || file.path.startsWith("https://"))) return file.path;
  return `/uploads/${file.filename}`;
};

const resolveProduct = async (id) =>
  mongoose.Types.ObjectId.isValid(id)
    ? Product.findById(id)
    : Product.findOne({ slug: id.toLowerCase() });

// ─────────────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

/** GET /api/products/new-arrivals */
export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "published", isNewArrival: true })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, products, "New arrival products retrieved successfully."));
});

/** GET /api/products/category/:slug */
export const getProductsByCategorySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug: slug.toLowerCase() });
  if (!category) throw new ApiError(404, "Category not found");
  const products = await Product.find({ category: category._id, status: "published" })
    .sort({ displayOrder: 1, title: 1 });
  return res.status(200).json(new ApiResponse(200, products, "Products retrieved successfully."));
});

/** GET /api/products/:slug */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug: slug.toLowerCase(), status: "published" })
    .populate("category", "name slug");
  if (!product) throw new ApiError(404, "Product not found");
  return res.status(200).json(new ApiResponse(200, product, "Product retrieved successfully."));
});

// ─────────────────────────────────────────────────────────────────────
// ADMIN CRUD ENDPOINTS
// ─────────────────────────────────────────────────────────────────────

/** GET /api/products  (Admin/Super Admin) */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status, isNewArrival } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }
  if (status && ["published", "draft"].includes(status)) query.status = status;
  if (isNewArrival === "true") query.isNewArrival = true;
  if (isNewArrival === "false") query.isNewArrival = false;

  const results = await paginate(Product, query, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { displayOrder: 1, createdAt: -1 },
  });
  return res.status(200).json(new ApiResponse(200, results, "Products retrieved successfully."));
});

/** POST /api/products  (Super Admin/Admin) */
export const createProduct = asyncHandler(async (req, res) => {
  const { title, slug: customSlug, description, price, sku, badge,
    category, status, isNewArrival, displayOrder, rating, reviewsCount } = req.body;

  if (!req.file) throw new ApiError(400, "Product image is required");

  const categoryDoc = mongoose.Types.ObjectId.isValid(category)
    ? await Category.findById(category)
    : await Category.findOne({ slug: category });
  if (!categoryDoc) {
    await deleteAsset(getUploadedImagePath(req.file));
    throw new ApiError(404, "Category not found");
  }

  const slug = slugify(customSlug || title, { lower: true, strict: true });
  const existing = await Product.findOne({ slug });
  if (existing) {
    await deleteAsset(getUploadedImagePath(req.file));
    throw new ApiError(409, "A product with this slug already exists");
  }

  const product = await Product.create({
    title,
    slug,
    price: Number(price),
    image: getUploadedImagePath(req.file),
    description: description || "",
    sku: sku || "",
    badge: badge || "",
    category: categoryDoc._id,
    status: status || "published",
    isNewArrival: isNewArrival === "true" || isNewArrival === true,
    displayOrder: Number(displayOrder) || 0,
    rating: Number(rating) || 0,
    reviewsCount: Number(reviewsCount) || 0,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, product, "Product created successfully."));
});

/** PUT /api/products/:id  (Super Admin/Admin) */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, slug: customSlug, description, price, sku, badge,
    category, status, isNewArrival, displayOrder, rating, reviewsCount } = req.body;

  const product = await resolveProduct(id);
  if (!product) {
    if (req.file) await deleteAsset(getUploadedImagePath(req.file));
    throw new ApiError(404, "Product not found");
  }

  if (title !== undefined) product.title = title;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (sku !== undefined) product.sku = sku;
  if (badge !== undefined) product.badge = badge;
  if (status !== undefined) product.status = status;
  if (isNewArrival !== undefined) product.isNewArrival = isNewArrival === "true" || isNewArrival === true;
  if (displayOrder !== undefined) product.displayOrder = Number(displayOrder);
  if (rating !== undefined) product.rating = Number(rating);
  if (reviewsCount !== undefined) product.reviewsCount = Number(reviewsCount);

  if (customSlug) {
    const newSlug = slugify(customSlug, { lower: true, strict: true });
    const dup = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
    if (dup) {
      if (req.file) await deleteAsset(getUploadedImagePath(req.file));
      throw new ApiError(409, "Slug already taken");
    }
    product.slug = newSlug;
  }

  if (category) {
    const cat = mongoose.Types.ObjectId.isValid(category)
      ? await Category.findById(category)
      : await Category.findOne({ slug: category });
    if (cat) product.category = cat._id;
  }

  if (req.file) {
    const old = product.image;
    product.image = getUploadedImagePath(req.file);
    if (old) await deleteAsset(old);
  }

  product.updatedBy = req.user?._id || null;
  await product.save();

  return res.status(200).json(new ApiResponse(200, product, "Product updated successfully."));
});

/** DELETE /api/products/:id  (Super Admin only) */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  if (product.image) await deleteAsset(product.image);
  await Product.deleteOne({ _id: product._id });
  return res.status(200).json(new ApiResponse(200, null, "Product deleted successfully."));
});

/** PATCH /api/products/:id/toggle-arrival  (Super Admin/Admin) */
export const toggleNewArrival = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.isNewArrival = !product.isNewArrival;
  product.updatedBy = req.user?._id || null;
  await product.save();
  return res.status(200).json(new ApiResponse(200, product, `isNewArrival toggled to ${product.isNewArrival}.`));
});

/** PATCH /api/products/:id/toggle-status  (Super Admin/Admin) */
export const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  product.status = product.status === "published" ? "draft" : "published";
  product.updatedBy = req.user?._id || null;
  await product.save();
  return res.status(200).json(new ApiResponse(200, product, `Status switched to '${product.status}'.`));
});
