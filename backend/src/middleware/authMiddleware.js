const mongoose = require("mongoose");
const { verifyAccessToken } = require("../services/authTokens");
const User = require("../models/User");
const RefreshSession = require("../models/RefreshSession");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing.",
      });
    }

    const decoded = verifyAccessToken(token);
    if (!mongoose.Types.ObjectId.isValid(decoded.userId) || !mongoose.Types.ObjectId.isValid(decoded.sessionId)) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const [user, session] = await Promise.all([
      User.findById(decoded.userId).select("-password"),
      RefreshSession.findOne({
        _id: decoded.sessionId,
        user: decoded.userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }).select("_id"),
    ]);
    if (!user || user.isActive === false || !session) {
      return res.status(401).json({
        message: "User session invalid or account deactivated. Please log in again.",
      });
    }

    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;
    // Attach full user object (minus password) for downstream checks
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message:
        error.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token. Please log in again.",
    });
  }
};
