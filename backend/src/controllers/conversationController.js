const mongoose = require("mongoose");
const Match = require("../models/Match");
const Message = require("../models/Message");
const User = require("../models/User");
const Block = require("../models/Block");
const { calculateAge } = require("../utils/adultPolicy");

exports.getConversations = async (req, res) => {
  try {
    const [conversations, blocks] = await Promise.all([
      Match.find({ users: req.userId, status: "active" })
        .populate("users", "name age dateOfBirth gender city profilePhoto photos isActive privacySettings.readReceipts")
        .populate("lastMessage", "sender text read createdAt")
        .sort({ updatedAt: -1 }),
      Block.find({
        $or: [{ blocker: req.userId }, { blockedUser: req.userId }],
      }),
    ]);
    const blockedUserIds = new Set(
      blocks.map((b) =>
        b.blocker.toString() === req.userId.toString()
          ? b.blockedUser.toString()
          : b.blocker.toString()
      )
    );
    const unreadCounts = conversations.length
      ? await Message.aggregate([
          { $match: { match: { $in: conversations.map((conversation) => conversation._id) }, receiver: req.userId, read: false } },
          { $group: { _id: "$match", count: { $sum: 1 } } },
        ])
      : [];
    const unreadByConversation = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));
    const result = conversations.map((conversation) => {
      const other = conversation.users.find((user) => user && user._id.toString() !== req.userId.toString());
      if (!other || other.isActive === false || blockedUserIds.has(other._id.toString())) return null;
      return {
        id: conversation._id,
        unreadCount: unreadByConversation.get(conversation._id.toString()) || 0,
        participant: {
          id: other._id,
          name: other.name,
          age: other.dateOfBirth ? calculateAge(other.dateOfBirth) : other.age,
          gender: other.gender,
          city: other.city,
          profilePhoto: other.profilePhoto || other.photos?.[0] || "",
        },
        lastMessage: conversation.lastMessage ? {
          id: conversation.lastMessage._id,
          sender: conversation.lastMessage.sender,
          text: conversation.lastMessage.text,
          read: String(conversation.lastMessage.sender) === req.userId.toString() && other.privacySettings?.readReceipts !== false
            ? conversation.lastMessage.read
            : false,
          createdAt: conversation.lastMessage.createdAt,
        } : null,
        updatedAt: conversation.updatedAt,
      };
    }).filter(Boolean);
    return res.json({ conversations: result });
  } catch {
    return res.status(500).json({ message: "Could not load conversations." });
  }
};

exports.createConversation = async (req, res) => {
  const { matchId } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(matchId)) return res.status(400).json({ message: "A valid mutual match is required to start a conversation." });
  const match = await Match.findOne({ _id: matchId, users: req.userId, status: "active" }).select("_id");
  if (!match) return res.status(404).json({ message: "An active mutual match is required." });
  return res.status(200).json({ conversation: { id: match._id, matchId: match._id } });
};

exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: "Invalid conversation ID." });
    const match = await Match.findOne({ _id: conversationId, users: req.userId, status: "active" }).select("_id");
    if (!match) return res.status(404).json({ message: "Conversation not found." });
    const result = await Message.updateMany({ match: conversationId, receiver: req.userId, read: false }, { $set: { read: true, status: "read", readAt: new Date() } });
    if (result.modifiedCount > 0) {
      const reader = await User.findById(req.userId).select("privacySettings.readReceipts").lean();
      if (reader?.privacySettings?.readReceipts !== false) {
        req.app.get("io")?.to(`match_${conversationId}`).emit("messages_read", { matchId: conversationId, readBy: req.userId });
      }
    }
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Could not mark the conversation read." });
  }
};

