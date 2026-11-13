/**
 * app.js
 * 
 * Express Application Configuration for HeartLink.
 * Separates route definitions, security middleware, and error handlers from the HTTP server listener,
 * enabling clean architectural separation, scalability, and modular integration.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

// Route imports
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const discoverRoutes = require("./routes/discoverRoutes");
const likeRoutes = require("./routes/likeRoutes");
const matchRoutes = require("./routes/matchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const blockRoutes = require("./routes/blockRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminReportRoutes = require("./routes/adminReportRoutes");
const adminSupportRoutes = require("./routes/adminSupportRoutes");
const v1Routes = require("./routes/v1Routes");
const { getProfile, updateProfile, getUserProfileById } = require("./controllers/profileController");
const { blockUser } = require("./controllers/blockController");
const { swipeLike, swipePass } = require("./controllers/discoverController");
const authMiddleware = require("./middleware/authMiddleware");
const originGuard = require("./middleware/originGuard");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust first proxy (Render, Railway, etc.) for accurate rate limiting
app.set("trust proxy", 1);

// Allowed CORS origins resolution
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://127.0.0.1:5173"] : []),
]
  .filter(Boolean)
  .map((o) => o.trim().replace(/\/+$/, ""));

const allowedOrigins = Array.from(new Set(rawOrigins));

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");
      const isNetlifyDeployment = /^https:\/\/([a-z0-9-]+--)?hilarious-parfait-3bfc2c\.netlify\.app$/i.test(normalizedOrigin);
      const isAllowed =
        allowedOrigins.includes(normalizedOrigin) ||
        isNetlifyDeployment ||
        originGuard.isLocalDevelopmentOrigin(normalizedOrigin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many sign-in attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { message: "Too many refresh attempts. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many Google sign-in attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many account creation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many recovery attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many messages. Please wait before sending more." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", originGuard(allowedOrigins));
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/google", googleAuthLimiter);
app.use("/api/auth/register", registrationLimiter);
app.use("/api/auth/refresh", refreshLimiter);
app.use("/api/auth/forgot-password", passwordRecoveryLimiter);
app.use("/api/auth/reset-password", passwordRecoveryLimiter);
app.use("/api/v1/auth", originGuard(allowedOrigins));
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth/google", googleAuthLimiter);
app.use("/api/v1/auth/register", registrationLimiter);
app.use("/api/v1/auth/refresh", refreshLimiter);
app.use("/api/v1/auth/forgot-password", passwordRecoveryLimiter);
app.use("/api/v1/auth/reset-password", passwordRecoveryLimiter);
// Direct /auth alias rate limiting
app.use("/auth", originGuard(allowedOrigins));
app.use("/auth/login", loginLimiter);
app.use("/auth/google", googleAuthLimiter);
app.use("/auth/register", registrationLimiter);
app.use("/auth/refresh", refreshLimiter);
app.use("/auth/forgot-password", passwordRecoveryLimiter);
app.use("/auth/reset-password", passwordRecoveryLimiter);
app.use("/api", generalLimiter);
app.use("/api/v1/conversations", messageLimiter);
app.use("/api/messages", messageLimiter);

// Serve profile photos directly from the Atlas GridFS bucket.
app.get("/uploads/profiles/:photoId", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.photoId)) return res.sendStatus(404);
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return res.sendStatus(404);
    }

    const photoId = new mongoose.Types.ObjectId(req.params.photoId);
    const file = await mongoose.connection.db.collection("profilePhotos.files").findOne({ _id: photoId });
    if (!file) return res.sendStatus(404);

    const contentType = file.metadata?.contentType || file.contentType;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(contentType || "")) return res.sendStatus(404);

    res.set({ "Content-Type": contentType, "Cache-Control": "public, max-age=86400" });
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "profilePhotos" });
    const stream = bucket.openDownloadStream(photoId);
    stream.on("error", (error) => {
      if (res.headersSent) return res.destroy(error);
      return next(error);
    });
    return stream.pipe(res);
  } catch (error) {
    return next(error);
  }
});

// Health & Liveness Check Endpoints
function getHealthStatus(req, res) {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? "ok" : "degraded",
    database: isConnected ? "connected" : "disconnected",
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    service: "HeartLink API",
  });
}

app.get("/health", getHealthStatus);
app.get("/api/health", getHealthStatus);
app.get("/api/v1/health", getHealthStatus);
app.get("/api/live", (req, res) => res.status(200).json({ status: "alive", timestamp: new Date().toISOString() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/v1", v1Routes);
app.use("/v1", v1Routes);

// SRS Specification Endpoint Catalogue Aliases
app.get("/api/users/me", authMiddleware, getProfile);
app.patch("/api/users/me", authMiddleware, updateProfile);
app.post("/api/users/:userId/block", authMiddleware, blockUser);

app.put("/api/swipes/:targetId", authMiddleware, (req, res, next) => {
  req.body.targetUserId = req.params.targetId;
  if (req.body.action === "pass") {
    return swipePass(req, res, next);
  }
  return swipeLike(req, res, next);
});

// Admin Moderation Queue (FR-11) — mounted before /api/v1/admin so adminRoutes middleware does not duplicate checks
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/v1/admin/reports", adminReportRoutes);
app.use("/api/admin/support", adminSupportRoutes);
app.use("/api/v1/admin/support", adminSupportRoutes);

// Super Admin Panel Routes
app.use("/api/v1/admin", adminRoutes);

// Public user profile alias requested in spec
app.get("/api/users/:userId", authMiddleware, (req, res, next) => {
  req.params.id = req.params.userId;
  return getUserProfileById(req, res, next);
});

// Root API welcome
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HeartLink API ❤️",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// 404 handler for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use(errorHandler);

module.exports = { app, allowedOrigins };
