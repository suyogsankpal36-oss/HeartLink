const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("../controllers/blockController");

router.use(authMiddleware);

router.get("/", getBlockedUsers);
router.post("/:userId", blockUser);
router.delete("/:userId", unblockUser);

module.exports = router;
