const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { swipeLike, swipePass } = require("../controllers/discoverController");
const {
  getIncomingLikes,
  getSentLikes,
  removeSentLike,
} = require("../controllers/likeController");

router.use(authMiddleware);

router.get("/", getIncomingLikes);
router.get("/received", getIncomingLikes);
router.get("/sent", getSentLikes);
router.post("/:userId", swipeLike);
router.post("/:userId/pass", swipePass);
router.delete("/:userId", removeSentLike);
router.delete("/:userId/pass", swipePass);

module.exports = router;
