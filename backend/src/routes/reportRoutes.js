const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createReport } = require("../controllers/reportController");
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many safety reports from this network. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authMiddleware);

router.post("/", reportLimiter, createReport);

module.exports = router;
