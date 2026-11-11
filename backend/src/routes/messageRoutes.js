const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middleware/authMiddleware");
const {
  getMessages,
  sendMessage,
  toggleReaction,
} = require("../controllers/messageController");

// Rate limit: max 60 messages per minute per IP/user
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many messages sent. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authMiddleware);

router.get("/:matchId", getMessages);
router.post("/:matchId", messageLimiter, sendMessage);
router.post("/:messageId/react", toggleReaction);

module.exports = router;
