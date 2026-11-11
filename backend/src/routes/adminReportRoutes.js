const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const { getAdminReports, updateAdminReport } = require("../controllers/reportController");

const router = express.Router();
router.use(authMiddleware, requireRole("moderator", "admin", "superadmin"));
router.get("/", getAdminReports);
router.patch("/:id", updateAdminReport);

module.exports = router;
