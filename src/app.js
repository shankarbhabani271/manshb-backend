import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

// Custom Middlewares
import { nosqlInjectionPreventer, xssSanitizer } from "./middleware/securityMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Versioned Routers
import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import superAdminRouter from "./routes/superAdminRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoutes.js";

// Initialize application instance
const app = express();

// ==========================================
// 1. SECURITY MIDDLEWARES
// ==========================================
// Set security HTTP headers (disable crossOriginResourcePolicy for uploads to allow cross-origin image loading)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Dynamic CORS configuration (Handles allowed origin lists & credentials matching)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*") || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error("Request blocked by CORS security policy."));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

// Prevent MongoDB NoSQL Injection attacks
app.use(nosqlInjectionPreventer);

// Basic XSS escaping for request variables
app.use(xssSanitizer);

// ==========================================
// 2. LOGGING, COMPRESSION, & BODY PARSERS
// ==========================================
// Server logging formats
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request parsers with size caps
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// HTTP cookie parser
app.use(cookieParser());

// Response compression
app.use(compression());

// ==========================================
// 3. API RATE LIMITER
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins window
  max: 100, // Limit each client IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Rate limit exceeded. Please retry after 15 minutes.",
  },
});
app.use("/api", apiLimiter);

// Serve uploads folder static assets with explicit cross-origin headers
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static("src/uploads"));

// ==========================================
// 4. API ROUTES
// ==========================================
// Health checker endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Auth module versioned prefix
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/products", productRouter);
app.use("/api/v1/super-admin", superAdminRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user", userRouter);

// Fallback: 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: [${req.method}] ${req.originalUrl}`,
  });
});

// ==========================================
// 5. GLOBAL CENTRALIZED ERROR RESPONDER
// ==========================================
app.use(errorHandler);

export { app };
export default app;
