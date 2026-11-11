const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getDiscoveryFeed,
  swipeLike,
  swipePass,
  rewindSwipe,
  resetPasses,
} = require("../controllers/discoverController");

router.use(authMiddleware);

router.get("/", getDiscoveryFeed);
router.post("/like", swipeLike);
router.post("/pass", swipePass);
router.post("/rewind", rewindSwipe);
router.post("/reset", resetPasses);

module.exports = router;
