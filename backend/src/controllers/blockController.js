const mongoose = require("mongoose");
const Block = require("../models/Block");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Like = require("../models/Like");
const User = require("../models/User");

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await Block.findOneAndUpdate(
      { blocker: req.userId, blockedUser: userId },
      {},
      { upsert: true, returnDocument: "after" }
    );

    // Break any existing match between these users
    const match = await Match.findOne({
      users: { $all: [req.userId, userId] },
    });

    if (match) {
      await Promise.all([
        Match.findByIdAndDelete(match._id),
        Message.deleteMany({ match: match._id }),
        Like.deleteMany({
          $or: [
            { fromUser: req.userId, toUser: userId },
            { fromUser: userId, toUser: req.userId },
          ],
        }),
      ]);
    }

    return res.json({
      success: true,
      message: `${targetUser.name} has been blocked. They will no longer see your profile or message you.`,
    });
  } catch (error) {
    console.error("Block user error:", error.message);
    return res.status(500).json({ message: "Failed to block user." });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const block = await Block.findOneAndDelete({
      blocker: req.userId,
      blockedUser: userId,
    });

    if (!block) {
      return res.status(404).json({ message: "Block record not found." });
    }

    return res.json({
      success: true,
      message: "User unblocked successfully.",
    });
  } catch (error) {
    console.error("Unblock user error:", error.message);
    return res.status(500).json({ message: "Failed to unblock user." });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.userId })
      .populate("blockedUser", "name age city profilePhoto")
      .sort({ createdAt: -1 });

    const blockedList = blocks
      .filter((b) => b.blockedUser !== null)
      .map((b) => ({
        id: b.blockedUser._id,
        name: b.blockedUser.name,
        age: b.blockedUser.age,
        city: b.blockedUser.city,
        profilePhoto: b.blockedUser.profilePhoto,
        blockedAt: b.createdAt,
      }));

    return res.json({ blockedUsers: blockedList });
  } catch (error) {
    console.error("Get blocked users error:", error.message);
    return res.status(500).json({ message: "Could not retrieve blocked users." });
  }
};
