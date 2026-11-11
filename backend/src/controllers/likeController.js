const Like = require("../models/Like");
const Block = require("../models/Block");
const mongoose = require("mongoose");
const { calculateAge } = require("../utils/adultPolicy");
const { isEmailVerificationComplete } = require("../utils/emailVerification");

exports.getIncomingLikes = async (req, res) => {
  try {
    const [likes, blocks] = await Promise.all([
      Like.find({ toUser: req.userId, type: { $in: ["like", "superlike"] } })
        .populate("fromUser", "name age dateOfBirth gender bio city interests profilePhoto photos isVerified isActive isIncognito emailVerificationRequired isEmailVerified discoveryPreferences.hideProfile")
        .sort({ updatedAt: -1 })
        .limit(100),
      Block.find({ $or: [{ blocker: req.userId }, { blockedUser: req.userId }] }).select("blocker blockedUser"),
    ]);
    const blockedIds = new Set(blocks.map((block) => (block.blocker.toString() === req.userId.toString() ? block.blockedUser : block.blocker).toString()));

    const senderIds = likes.filter((like) => like.fromUser).map((like) => like.fromUser._id);
    const alreadyLikedBack = new Set(
      (await Like.find({
        fromUser: req.userId,
        toUser: { $in: senderIds },
      type: { $in: ["like", "superlike"] },
      }).select("toUser")).map((like) => like.toUser.toString())
    );

    const incoming = likes
      .filter((like) => like.fromUser && like.fromUser.isActive !== false && like.fromUser.isIncognito !== true && like.fromUser.discoveryPreferences?.hideProfile !== true && isEmailVerificationComplete(like.fromUser) && !blockedIds.has(like.fromUser._id.toString()) && !alreadyLikedBack.has(like.fromUser._id.toString()))
      .map((like) => {
        const user = like.fromUser;
        const photos = Array.isArray(user.photos) && user.photos.length ? user.photos : [user.profilePhoto].filter(Boolean);
        return {
          id: user._id,
          name: user.name,
          age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : user.age,
          gender: user.gender,
          bio: user.bio || "",
          city: user.city || "",
          interests: user.interests || [],
          profilePhoto: user.profilePhoto || photos[0] || "",
          photos,
          type: like.type,
          isVerified: Boolean(user.isVerified),
          likedAt: like.updatedAt,
        };
      });

    return res.json({ likes: incoming });
  } catch (error) {
    console.error("Get incoming likes error:", error.message);
    return res.status(500).json({ message: "Could not load incoming likes." });
  }
};

exports.getSentLikes = async (req, res) => {
  try {
    const [likes, blocks] = await Promise.all([
      Like.find({ fromUser: req.userId, type: { $in: ["like", "superlike"] } }).populate("toUser", "name age dateOfBirth gender bio city interests profilePhoto photos isVerified isActive isIncognito emailVerificationRequired isEmailVerified discoveryPreferences.hideProfile").sort({ updatedAt: -1 }).limit(100),
      Block.find({ $or: [{ blocker: req.userId }, { blockedUser: req.userId }] }).select("blocker blockedUser"),
    ]);
    const blockedIds = new Set(blocks.map((block) => (block.blocker.toString() === req.userId.toString() ? block.blockedUser : block.blocker).toString()));
    const result = likes.filter((like) => like.toUser && like.toUser.isActive !== false && like.toUser.isIncognito !== true && like.toUser.discoveryPreferences?.hideProfile !== true && isEmailVerificationComplete(like.toUser) && !blockedIds.has(like.toUser._id.toString())).map((like) => {
      const user = like.toUser;
      const photos = user.photos?.length ? user.photos : [user.profilePhoto].filter(Boolean);
      return { id: user._id, name: user.name, age: user.dateOfBirth ? calculateAge(user.dateOfBirth) : user.age, gender: user.gender, bio: user.bio || "", city: user.city || "", interests: user.interests || [], profilePhoto: user.profilePhoto || photos[0] || "", photos, type: like.type, isVerified: Boolean(user.isVerified), likedAt: like.updatedAt };
    });
    return res.json({ likes: result });
  } catch {
    return res.status(500).json({ message: "Could not load profiles you liked." });
  }
};

exports.removeSentLike = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId) || userId === req.userId.toString()) return res.status(400).json({ message: "Invalid profile ID." });
    const Match = require("../models/Match");
    const activeMatch = await Match.exists({ users: { $all: [req.userId, userId] }, status: "active" });
    if (activeMatch) return res.status(409).json({ message: "Unmatch before removing a like from an active match." });
    const result = await Like.deleteOne({ fromUser: req.userId, toUser: userId, type: { $in: ["like", "superlike"] } });
    return result.deletedCount ? res.json({ success: true }) : res.status(404).json({ message: "Like not found." });
  } catch {
    return res.status(500).json({ message: "Could not remove the like." });
  }
};
