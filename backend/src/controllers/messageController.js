const mongoose = require("mongoose");
const Match = require("../models/Match");
const Message = require("../models/Message");
const User = require("../models/User");
const Block = require("../models/Block");
const Notification = require("../models/Notification");
const { activeRestrictionUntil, restrictionMessage } = require("../utils/moderation");

exports.getMessages = async (req, res) => {
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
      return res.status(404).json({ message: "Match not found or access denied." });
    }

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ match: matchId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    const otherUserId = match.users.find((userId) => userId.toString() !== req.userId.toString());
    const otherUser = otherUserId
      ? await User.findById(otherUserId).select("privacySettings.readReceipts").lean()
      : null;
    const canSeeOtherUserReadReceipts = Boolean(otherUser && otherUser.privacySettings?.readReceipts !== false);

    return res.json({
      page: pageNum,
      limit: limitNum,
      messages: messages.map((m) => ({
        id: m._id,
        _id: m._id,
        matchId,
        sender: m.sender,
        receiver: m.receiver,
        text: m.text,
        read: String(m.sender) === String(req.userId) && canSeeOtherUserReadReceipts ? m.read : false,
        readAt: String(m.sender) === String(req.userId) && canSeeOtherUserReadReceipts ? m.readAt || null : null,
        reactions: m.reactions || [],
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ message: "Could not retrieve messages." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const rawText = req.body.text || req.body.content;
    const text = typeof rawText === "string" ? rawText.trim() : "";

    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    if (text.length > 2000) {
      return res
        .status(400)
        .json({ message: "Message cannot exceed 2000 characters." });
    }

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID format." });
    }

    const match = await Match.findOne({
      _id: matchId,
      users: req.userId,
      status: "active",
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found or access denied." });
    }

    const receiverId = match.users.find(
      (uId) => uId.toString() !== req.userId.toString()
    );

    if (!receiverId) {
      return res.status(400).json({ message: "Invalid match participants." });
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blockedUser: receiverId },
        { blocker: receiverId, blockedUser: req.userId },
      ],
    });

    if (isBlocked) {
      return res.status(403).json({ message: "Cannot send messages to a blocked user." });
    }

    const senderUser = await User.findById(req.userId).select("name moderation.restrictions");
    const messagingRestriction = activeRestrictionUntil(senderUser, "messaging");
    if (messagingRestriction) {
      return res.status(403).json({ message: restrictionMessage("messaging", messagingRestriction) });
    }

    const newMessage = await Message.create({
      match: matchId,
      sender: req.userId,
      receiver: receiverId,
      text: text.trim(),
      read: false,
      reactions: [],
    });

    match.lastMessage = newMessage._id;
    match.updatedAt = new Date();
    await match.save();

    const [sender, receiver] = await Promise.all([
      Promise.resolve(senderUser),
      User.findById(receiverId).select("notificationSettings.messages"),
    ]);
    const messageNotificationsEnabled = receiver?.notificationSettings?.messages !== false;
    if (messageNotificationsEnabled) {
      await Notification.create({
        recipient: receiverId,
        sender: req.userId,
        type: "message",
        title: "New Message 💬",
        message: `${sender?.name || "Your match"} sent you a message.`,
        matchId,
      }).catch((e) => console.warn("Message notification error:", e.message));
    }

    const messagePayload = {
      id: newMessage._id,
      _id: newMessage._id,
      matchId,
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      text: newMessage.text,
      read: newMessage.read,
      readAt: newMessage.readAt || null,
      reactions: [],
      createdAt: newMessage.createdAt,
    };

    // 1. Emit live Socket.IO events to all connected clients in this match
    const io = req.app.get("io");
    if (io) {
      io.to(`match_${matchId}`).emit("new_message", messagePayload);
      if (messageNotificationsEnabled) {
        io.to(`user_${receiverId}`).emit("new_notification", {
          type: "message",
          matchId,
          senderId: req.userId,
          senderName: sender?.name || "Match",
          message: `${sender?.name || "Your match"} sent you a message.`,
        });
      }
    }

    return res.status(201).json({
      message: messagePayload,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ message: "Failed to send message." });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format." });
    }

    if (!emoji || typeof emoji !== "string" || emoji.trim().length > 10) {
      return res.status(400).json({ message: "Valid emoji string (max 10 chars) is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    const reactingUser = await User.findById(req.userId).select("moderation.restrictions");
    const messagingRestriction = activeRestrictionUntil(reactingUser, "messaging");
    if (messagingRestriction) {
      return res.status(403).json({ message: restrictionMessage("messaging", messagingRestriction) });
    }

    // Verify user is in this active match
    const match = await Match.findOne({
      _id: message.match,
      users: req.userId,
      status: "active",
    });

    if (!match) {
      return res.status(403).json({ message: "Access denied." });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.userId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingIndex, 1);
      } else {
        // Update emoji
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.userId, emoji });
    }

    await message.save();

    // Broadcast reaction update live over Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`match_${message.match}`).emit("message_reaction_updated", {
        matchId: message.match.toString(),
        messageId: message._id.toString(),
        reactions: message.reactions,
      });
    }

    return res.json({
      success: true,
      reactions: message.reactions,
      messageId: message._id,
    });
  } catch (error) {
    console.error("Toggle reaction error:", error.message);
    return res.status(500).json({ message: "Failed to update reaction." });
  }
};
