const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  googleLogin,
  verifyEmail,
  resendVerification,
} = require("../controllers/authController");

const verificationResendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many verification requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", verificationResendLimiter, resendVerification);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Authenticated auth routes
router.get("/me", authMiddleware, getMe);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.post("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
