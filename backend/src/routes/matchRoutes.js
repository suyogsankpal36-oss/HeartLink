const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getMatches, unmatch } = require("../controllers/matchController");
const { getMessages, sendMessage } = require("../controllers/messageController");

router.use(authMiddleware);

router.get("/", getMatches);
router.delete("/:matchId", unmatch);
router.patch("/:matchId/unmatch", unmatch);

// SRS Endpoint Catalogue: GET/POST /matches/:matchId/messages
router.get("/:matchId/messages", getMessages);
router.post("/:matchId/messages", sendMessage);

module.exports = router;
