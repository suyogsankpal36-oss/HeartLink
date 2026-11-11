const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const {
  getAdminSupportTickets,
  updateAdminSupportTicket,
} = require("../controllers/supportController");

const router = express.Router();
router.use(authMiddleware, requireRole("moderator", "admin", "superadmin"));
router.get("/", getAdminSupportTickets);
router.patch("/:id", updateAdminSupportTicket);

module.exports = router;
