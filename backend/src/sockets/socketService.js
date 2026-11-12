/**
 * socketService.js
 * 
 * Socket.IO Real-Time Service for HeartLink.
 * Handles authenticated socket connections, online presence tracking,
 * instant messaging, typing indicators, read receipts, message reactions,
 * and WebRTC video/audio call signaling.
 */

const { verifyAccessToken } = require("../services/authTokens");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Block = require("../models/Block");
const Notification = require("../models/Notification");
const User = require("../models/User");
const RefreshSession = require("../models/RefreshSession");
const { logSecurityEvent } = require("../services/auditLogger");
const { activeRestrictionUntil, restrictionMessage } = require("../utils/moderation");
const {
  addOnlineSocket,
  removeOnlineSocket,
  isUserOnline,
  getOnlineUserIds,
  broadcastPresence,
  sendPresenceSnapshot,
} = require("../services/presenceService");

/**
 * Send an event directly to a user's personal room
 * @param {import("socket.io").Server} io 
 * @param {string} userId 
 * @param {string} event 
 * @param {any} payload 
 */
function notifyUser(io, userId, event, payload) {
  if (io && userId) {
    io.to(`user_${userId}`).emit(event, payload);
  }
}

function normalizeReactionEmoji(value) {
  if (typeof value !== "string") return null;
  const emoji = value.trim();
  return emoji && [...emoji].length <= 10 ? emoji : null;
}

function toggleUserReaction(reactions, userId, emoji) {
  const currentUserId = userId.toString();
  const index = reactions.findIndex((reaction) => reaction.user.toString() === currentUserId);
  if (index >= 0 && reactions[index].emoji === emoji) {
    reactions.splice(index, 1);
  } else if (index >= 0) {
    reactions[index].emoji = emoji;
  } else {
    reactions.push({ user: userId, emoji });
  }
  return reactions.map((reaction) => ({ user: reaction.user.toString(), emoji: reaction.emoji }));
}

async function socketSessionActive(socket) {
  const [session, user] = await Promise.all([
    RefreshSession.exists({ _id: socket.sessionId, user: socket.userId, revokedAt: null, expiresAt: { $gt: new Date() } }),
    User.exists({ _id: socket.userId, isActive: { $ne: false } }),
  ]);
  return Boolean(session && user);
}

async function socketMessagingAllowed(socket, callback) {
  const account = await User.findById(socket.userId).select("moderation.restrictions");
  const restriction = activeRestrictionUntil(account, "messaging");
  if (!restriction) return true;
  const message = restrictionMessage("messaging", restriction);
  if (callback) callback({ error: message });
  else socket.emit("error", { message });
  return false;
}

/**
 * Initialize Socket.IO with authentication middleware and event handlers
 * @param {import("socket.io").Server} io 
 */
function initSocket(io) {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = verifyAccessToken(token);
      const [session, user] = await Promise.all([
        RefreshSession.exists({ _id: decoded.sessionId, user: decoded.userId, revokedAt: null, expiresAt: { $gt: new Date() } }),
        User.findById(decoded.userId).select("isActive role"),
      ]);
      if (!session || !user || user.isActive === false) {
        await logSecurityEvent(
          "unauthorized_api",
          "medium",
          decoded?.userId || null,
          socket.handshake?.address || "",
          { event: "socket_handshake", reason: user?.isActive === false ? "inactive_user" : "invalid_session" },
          socket.handshake?.headers?.["user-agent"] || "",
        );
        return next(new Error("Invalid token."));
      }

      socket.userId = decoded.userId.toString();
      socket.userRole = user.role || "member";
      socket.sessionId = decoded.sessionId.toString();
      socket.tokenExpiresAt = decoded.exp * 1000;
      if (typeof User.updateOne === "function") {
        User.updateOne({ _id: decoded.userId }, { $set: { lastActive: new Date() } }).catch(() => {});
      }
      next();
    } catch (err) {
      await logSecurityEvent(
        "unauthorized_api",
        "low",
        null,
        socket.handshake?.address || "",
        { event: "socket_handshake_error", reason: err.message },
        socket.handshake?.headers?.["user-agent"] || "",
      );
      return next(new Error("Unauthorized socket connection."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    const tokenLifetime = Math.max(1, socket.tokenExpiresAt - Date.now());
    const expiryTimer = setTimeout(() => socket.disconnect(true), tokenLifetime);

    const becameOnline = addOnlineSocket(userId, socket.id);

    // Join personal room for instant notifications and matches
    socket.join(`user_${userId}`);
    if (becameOnline) broadcastPresence(io, userId).catch((err) => console.warn("Presence broadcast error:", err.message));
    sendPresenceSnapshot(io, userId).catch((err) => console.warn("Presence snapshot error:", err.message));

    // Join a specific match chat room
    socket.on("join_chat", async ({ matchId }) => {
      try {
        if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);

        const match = await Match.findOne({
          _id: matchId,
          users: userId,
          status: "active",
        });

        if (!match) {
          await logSecurityEvent(
            "unauthorized_api",
            "low",
            userId,
            socket.handshake?.address || "",
            { event: "join_chat_denied", matchId },
            socket.handshake?.headers?.["user-agent"] || "",
          );
          return socket.emit("error", { message: "Access denied to match conversation." });
        }

        socket.join(`match_${matchId}`);
      } catch (err) {
        console.error("Socket join_chat error:", err.message);
      }
    });

    // Leave a specific match chat room
    socket.on("leave_chat", ({ matchId }) => {
      if (matchId) {
        socket.leave(`match_${matchId}`);
      }
    });

    // Send a real-time message
    socket.on("send_message", async ({ matchId, text }, callback) => {
      try {
        if (!(await socketSessionActive(socket))) {
          if (callback) callback({ error: "Session expired. Reconnect and try again." });
          return socket.disconnect(true);
        }
        if (!matchId || typeof text !== "string" || !text.trim()) return;
        const now = Date.now();
        socket.messageRateWindow ||= { startedAt: now, count: 0 };
        if (now - socket.messageRateWindow.startedAt >= 60_000) socket.messageRateWindow = { startedAt: now, count: 0 };
        if (socket.messageRateWindow.count >= 30) {
          if (callback) callback({ error: "Message rate limit reached. Please wait a moment." });
          return;
        }
        socket.messageRateWindow.count += 1;

        if (text.trim().length > 2000) {
          if (callback) callback({ error: "Message too long (max 2000 characters)." });
          return;
        }

        if (!(await socketMessagingAllowed(socket, callback))) return;

        const match = await Match.findOne({
          _id: matchId,
          users: userId,
          status: "active",
        });

        if (!match) {
          if (callback) callback({ error: "Match not found or access denied." });
          return;
        }

        const receiverId = match.users
          .find((uId) => uId.toString() !== userId.toString())
          ?.toString();

        if (!receiverId) return;

        // Check if blocked
        const isBlocked = await Block.findOne({
          $or: [
            { blocker: userId, blockedUser: receiverId },
            { blocker: receiverId, blockedUser: userId },
          ],
        });

        if (isBlocked) {
          if (callback) callback({ error: "Cannot message a blocked user." });
          return;
        }

        const newMsg = await Message.create({
          match: matchId,
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
          read: false,
        });

        match.lastMessage = newMsg._id;
        match.updatedAt = new Date();
        await match.save();

        const messagePayload = {
          id: newMsg._id,
          matchId,
          sender: newMsg.sender,
          receiver: newMsg.receiver,
          text: newMsg.text,
          read: newMsg.read,
          status: newMsg.status,
          readAt: newMsg.readAt || null,
          createdAt: newMsg.createdAt,
        };

        // Deliver instantly to match room
        io.to(`match_${matchId}`).emit("new_message", messagePayload);

        const [senderUser, receiver] = await Promise.all([
          User.findById(userId).select("name"),
          User.findById(receiverId).select("notificationSettings.messages"),
        ]);
        const messageNotificationsEnabled = receiver?.notificationSettings?.messages !== false;
        if (messageNotificationsEnabled) {
          await Notification.create({
            recipient: receiverId,
            sender: userId,
            type: "message",
            title: "New Message 💬",
            message: `${senderUser?.name || "Your match"} sent you a message.`,
            matchId,
          }).catch(() => {});
          io.to(`user_${receiverId}`).emit("new_notification", {
            type: "message",
            matchId,
            senderId: userId,
            senderName: senderUser?.name || "Match",
            message: `${senderUser?.name || "Your match"} sent you a message.`,
          });
        }

        if (callback) callback({ success: true, message: messagePayload });
      } catch (err) {
        console.error("Socket send_message error:", err.message);
        if (callback) callback({ error: "Could not deliver message." });
      }
    });

    // Typing indicators
    socket.on("typing", async ({ matchId }) => {
      if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);
      if (!(await socketMessagingAllowed(socket))) return;
      const match = await Match.findOne({ _id: matchId, users: userId, status: "active" }).select("_id");
      if (match) {
        socket.to(`match_${matchId}`).emit("user_typing", { matchId, userId });
      }
    });

    socket.on("stop_typing", async ({ matchId }) => {
      if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);
      if (!(await socketMessagingAllowed(socket))) return;
      const match = await Match.findOne({ _id: matchId, users: userId, status: "active" }).select("_id");
      if (match) {
        socket.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId });
      }
    });

    // Read receipts
    socket.on("mark_read", async ({ matchId }) => {
      try {
        if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);

        const match = await Match.findOne({ _id: matchId, users: userId, status: "active" }).select("_id");
        if (!match) return;

        await Message.updateMany(
          { match: matchId, receiver: userId, read: false },
          { $set: { read: true, status: "read", readAt: new Date() } }
        );

        const reader = await User.findById(userId).select("privacySettings.readReceipts").lean();
        if (reader?.privacySettings?.readReceipts !== false) {
          socket.to(`match_${matchId}`).emit("messages_read", { matchId, readBy: userId });
        }
      } catch (err) {
        console.error("Socket mark_read error:", err.message);
      }
    });

    // Persist one reaction for the authenticated participant before broadcasting it.
    socket.on("message_reaction", async ({ matchId, messageId, emoji }, callback) => {
      try {
        const normalizedEmoji = normalizeReactionEmoji(emoji);
        if (!matchId || !messageId || !normalizedEmoji) {
          if (callback) callback({ error: "A valid match, message, and emoji are required." });
          return;
        }
        if (!(await socketSessionActive(socket))) {
          if (callback) callback({ error: "Session expired. Reconnect and try again." });
          return socket.disconnect(true);
        }
        if (!(await socketMessagingAllowed(socket, callback))) return;
        const match = await Match.findOne({ _id: matchId, users: userId, status: "active" });
        if (!match) {
          if (callback) callback({ error: "Match not found or access denied." });
          return;
        }
        const message = await Message.findOne({ _id: messageId, match: matchId });
        if (!message) {
          if (callback) callback({ error: "Message not found in this conversation." });
          return;
        }
        const persistedReactions = toggleUserReaction(message.reactions, userId, normalizedEmoji);
        await message.save();
        socket.to(`match_${matchId}`).emit("message_reaction_updated", {
          matchId,
          messageId,
          reactions: persistedReactions,
        });
        if (callback) callback({ success: true, reactions: persistedReactions });
      } catch (err) {
        console.error("Socket message_reaction error:", err.message);
        if (callback) callback({ error: "Could not update the message reaction." });
      }
    });

    // Video Date & Audio Call Signaling
    socket.on("start_call", async ({ matchId, callType }) => {
      try {
        if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);
        if (!(await socketMessagingAllowed(socket))) return;
        const match = await Match.findOne({ _id: matchId, users: userId, status: "active" });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("incoming_call", {
          matchId,
          callType: callType || "video",
          callerId: userId,
        });
      } catch (err) {
        console.error("Socket start_call error:", err.message);
      }
    });

    socket.on("accept_call", async ({ matchId }) => {
      try {
        if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);
        if (!(await socketMessagingAllowed(socket))) return;
        const match = await Match.findOne({ _id: matchId, users: userId, status: "active" });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("call_accepted", { matchId });
      } catch (err) {
        console.error("Socket accept_call error:", err.message);
      }
    });

    socket.on("end_call", async ({ matchId }) => {
      try {
        if (!matchId || !(await socketSessionActive(socket))) return socket.disconnect(true);
        const match = await Match.findOne({ _id: matchId, users: userId, status: "active" });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("call_ended", { matchId });
      } catch (err) {
        console.error("Socket end_call error:", err.message);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      clearTimeout(expiryTimer);
      if (removeOnlineSocket(userId, socket.id)) {
        broadcastPresence(io, userId).catch((err) => console.warn("Presence disconnect broadcast error:", err.message));
      }
    });
  });
}

module.exports = {
  initSocket,
  isUserOnline,
  getOnlineUserIds,
  notifyUser,
  normalizeReactionEmoji,
  toggleUserReaction,
};
