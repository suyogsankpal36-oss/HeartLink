const Match = require("../models/Match");
const Block = require("../models/Block");
const User = require("../models/User");

const onlineSockets = new Map();

function addOnlineSocket(userId, socketId) {
  const id = String(userId);
  const sockets = onlineSockets.get(id) || new Set();
  const becameOnline = sockets.size === 0;
  sockets.add(socketId);
  onlineSockets.set(id, sockets);
  return becameOnline;
}

function removeOnlineSocket(userId, socketId) {
  const id = String(userId);
  const sockets = onlineSockets.get(id);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size > 0) return false;
  onlineSockets.delete(id);
  return true;
}

function isUserOnline(userId) {
  return Boolean(onlineSockets.get(String(userId))?.size);
}

function getOnlineUserIds() {
  return [...onlineSockets.keys()];
}

async function getUnblockedMatchPeers(userId) {
  const id = String(userId);
  const [matches, blocks] = await Promise.all([
    Match.find({ users: userId, status: "active" }).select("users").lean(),
    Block.find({ $or: [{ blocker: userId }, { blockedUser: userId }] }).select("blocker blockedUser").lean(),
  ]);
  const blockedIds = new Set(blocks.map((block) => (
    String(block.blocker) === id ? String(block.blockedUser) : String(block.blocker)
  )));
  return [...new Set(matches.flatMap((match) => match.users.map(String).filter((peerId) => peerId !== id && !blockedIds.has(peerId))))];
}

async function broadcastPresence(io, userId) {
  if (!io) return;
  const [user, peerIds] = await Promise.all([
    User.findById(userId).select("privacySettings.showOnlineStatus").lean(),
    getUnblockedMatchPeers(userId),
  ]);
  const online = isUserOnline(userId) && user?.privacySettings?.showOnlineStatus !== false;
  for (const peerId of peerIds) {
    io.to(`user_${peerId}`).emit("presence_update", { userId: String(userId), online });
  }
}

async function sendPresenceSnapshot(io, userId) {
  if (!io) return;
  const peerIds = await getUnblockedMatchPeers(userId);
  if (!peerIds.length) return;
  const peers = await User.find({ _id: { $in: peerIds } }).select("privacySettings.showOnlineStatus").lean();
  for (const peer of peers) {
    const peerId = String(peer._id);
    if (isUserOnline(peerId) && peer.privacySettings?.showOnlineStatus !== false) {
      io.to(`user_${userId}`).emit("presence_update", { userId: peerId, online: true });
    }
  }
}

module.exports = {
  addOnlineSocket,
  removeOnlineSocket,
  isUserOnline,
  getOnlineUserIds,
  broadcastPresence,
  sendPresenceSnapshot,
};
