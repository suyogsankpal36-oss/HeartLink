const mongoose = require("mongoose");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Like = require("../models/Like");
const Block = require("../models/Block");
const { calculateAge } = require("../utils/adultPolicy");
const { isUserOnline } = require("../services/presenceService");
const { isEmailVerificationComplete } = require("../utils/emailVerification");

function filterAvailableMatches(matches) {
  return matches.filter((match) => match && match.matchedUser);
}

exports.getMatches = async (req, res) => {
  try {
    const [matches, blocks] = await Promise.all([
      Match.find({ users: req.userId, status: "active" })
        .populate("users", "name age dateOfBirth gender bio city interests lookingFor profilePhoto photos prompts lifestyle isVerified isActive emailVerificationRequired isEmailVerified privacySettings.readReceipts privacySettings.showOnlineStatus")
        .populate("lastMessage")
        .sort({ updatedAt: -1 }),
      Block.find({
        $or: [{ blocker: req.userId }, { blockedUser: req.userId }],
      }),
    ]);
    const currentUserObjectId = mongoose.Types.ObjectId.isValid(req.userId)
      ? new mongoose.Types.ObjectId(req.userId)
      : req.userId;
    const unreadCounts = matches.length
      ? await Message.aggregate([
          { $match: { match: { $in: matches.map((match) => match._id) }, receiver: currentUserObjectId, read: false } },
          { $group: { _id: "$match", count: { $sum: 1 } } },
        ])
      : [];
    const unreadByMatch = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));

    const blockedUserIds = new Set(
      blocks.map((b) =>
        b.blocker.toString() === req.userId.toString()
          ? b.blockedUser.toString()
          : b.blocker.toString()
      )
    );

    const formattedMatches = matches
      .map((match) => {
        const otherUser = match.users.find(
          (u) => u && u._id.toString() !== req.userId.toString()
        );

        if (!otherUser || otherUser.isActive === false || !isEmailVerificationComplete(otherUser) || blockedUserIds.has(otherUser._id.toString())) {
          return null;
        }

        const photos =
          Array.isArray(otherUser.photos) && otherUser.photos.length > 0
            ? otherUser.photos
            : [otherUser.profilePhoto].filter(Boolean);

        return {
          matchId: match._id,
          unreadCount: unreadByMatch.get(match._id.toString()) || 0,
          matchedUser: otherUser
            ? {
                id: otherUser._id,
                _id: otherUser._id,
                name: otherUser.name,
                age: otherUser.dateOfBirth ? calculateAge(otherUser.dateOfBirth) : otherUser.age,
                gender: otherUser.gender,
                bio: otherUser.bio,
                city: otherUser.city,
                interests: otherUser.interests,
                lookingFor: otherUser.lookingFor,
                profilePhoto: otherUser.profilePhoto || (photos[0] || ""),
                photos,
                prompts: otherUser.prompts || [],
                lifestyle: otherUser.lifestyle || {},
                isVerified: !!otherUser.isVerified,
                online: isUserOnline(otherUser._id) && otherUser.privacySettings?.showOnlineStatus !== false,
              }
            : null,
        lastMessage: match.lastMessage
          ? {
              id: match.lastMessage._id,
              text: match.lastMessage.text,
              sender: match.lastMessage.sender,
              read: String(match.lastMessage.sender) === req.userId.toString() && otherUser.privacySettings?.readReceipts !== false
                ? match.lastMessage.read
                : false,
              createdAt: match.lastMessage.createdAt,
            }
          : null,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      };
    });

    return res.json({ matches: filterAvailableMatches(formattedMatches) });
  } catch (error) {
    console.error("Get matches error:", error.message);
    return res.status(500).json({ message: "Could not load matches." });
  }
};

exports.filterAvailableMatches = filterAvailableMatches;

exports.unmatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID format." });
    }

    const match = await Match.findOne({
      _id: matchId,
      users: req.userId,
      status: "active",
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const otherUserId = match.users.find(
      (uId) => uId.toString() !== req.userId.toString()
    );

    // Preserve the unmatch record while removing the conversation and both likes.
    await Promise.all([
      Match.findByIdAndUpdate(matchId, { status: "unmatched", unmatchedAt: new Date(), lastMessage: null, lastMessageAt: null }),
      Message.deleteMany({ match: matchId }),
      otherUserId
        ? Like.deleteMany({
            $or: [
              { fromUser: req.userId, toUser: otherUserId },
              { fromUser: otherUserId, toUser: req.userId },
            ],
          })
        : Promise.resolve(),
    ]);

    const io = req.app.get("io");
    if (io) {
      if (otherUserId) io.to(`user_${otherUserId}`).emit("match_removed", { matchId });
      io.to(`user_${req.userId}`).emit("match_removed", { matchId });
    }

    return res.json({ success: true, message: "Unmatched successfully." });
  } catch (error) {
    console.error("Unmatch error:", error.message);
    return res.status(500).json({ message: "Failed to unmatch." });
  }
};
