const express = require("express");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./authRoutes");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const upload = require("../middleware/uploadMiddleware");
const profileController = require("../controllers/profileController");
const discoverController = require("../controllers/discoverController");
const likeController = require("../controllers/likeController");
const matchRoutes = require("./matchRoutes");
const messageController = require("../controllers/messageController");
const notificationRoutes = require("./notificationRoutes");
const blockRoutes = require("./blockRoutes");
const reportRoutes = require("./reportRoutes");
const settingsController = require("../controllers/settingsController");
const supportController = require("../controllers/supportController");
const subscriptionController = require("../controllers/subscriptionController");
const conversationController = require("../controllers/conversationController");

const router = express.Router();
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many support requests from this network. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
const profiles = express.Router();
const likes = express.Router();
const conversations = express.Router();

function uploadProfilePhoto(req, res, next) {
  upload.single("photo")(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message || "Photo upload failed." });
    return next();
  });
}

profiles.use(authMiddleware);
profiles.get("/", discoverController.getDiscoveryFeed);
profiles.post("/rewind", discoverController.rewindSwipe);
profiles.post("/reset", discoverController.resetPasses);
profiles.get("/me", profileController.getProfile);
profiles.patch("/me", uploadProfilePhoto, profileController.updateProfile);
profiles.post("/me/photos", uploadProfilePhoto, profileController.updateProfile);
profiles.delete("/me/photos/:photoId", profileController.deleteProfilePhoto);
profiles.get("/:userId", (req, res, next) => {
  req.params.id = req.params.userId;
  return profileController.getUserProfileById(req, res, next);
});

likes.use(authMiddleware);
likes.get("/received", likeController.getIncomingLikes);
likes.get("/sent", likeController.getSentLikes);
likes.post("/:userId", discoverController.swipeLike);
likes.post("/:userId/pass", discoverController.swipePass);
likes.delete("/:userId", likeController.removeSentLike);
likes.delete("/:userId/pass", discoverController.swipePass);

conversations.use(authMiddleware);
conversations.get("/", conversationController.getConversations);
conversations.post("/", conversationController.createConversation);
conversations.get("/:conversationId/messages", (req, res, next) => {
  req.params.matchId = req.params.conversationId;
  return messageController.getMessages(req, res, next);
});
conversations.post("/:conversationId/messages", (req, res, next) => {
  req.params.matchId = req.params.conversationId;
  return messageController.sendMessage(req, res, next);
});
conversations.post("/:conversationId/messages/:messageId/react", messageController.toggleReaction);
conversations.patch("/:conversationId/read", conversationController.markConversationRead);

router.use("/auth", authRoutes);
router.use("/profiles", profiles);
router.use("/likes", likes);
router.use("/matches", matchRoutes);
router.use("/conversations", conversations);
router.post("/messages/:messageId/react", authMiddleware, messageController.toggleReaction);
router.use("/notifications", notificationRoutes);
router.use("/blocks", blockRoutes);
router.use("/reports", reportRoutes);
router.get("/settings", authMiddleware, settingsController.getSettings);
router.patch("/settings", authMiddleware, settingsController.updateSettings);
router.get("/subscriptions/plans", subscriptionController.getPlans);
router.get("/subscriptions/me", authMiddleware, subscriptionController.getMySubscription);
router.post("/support", supportLimiter, optionalAuth, supportController.createSupportTicket);

module.exports = router;
